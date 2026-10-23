const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const emailService = require('../services/email.service');

const OTP_TTL_SECONDS = 60;      // code lifetime (same as the old app)
const MAX_CODE_ATTEMPTS = 5;     // wrong guesses allowed per code
const RESEND_COOLDOWN_MS = 30 * 1000;
const TOKEN_DAYS = 7;

const generateVerificationCode = () => String(crypto.randomInt(100000, 1000000)); // CSPRNG, always 6 digits

const sameCode = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: `${TOKEN_DAYS}d` });

const cookieOptions = () => {
  const prod = process.env.NODE_ENV === 'production';
  // Frontend and API on different sites need SameSite=None (which requires Secure). Override with COOKIE_SAMESITE.
  const sameSite = process.env.COOKIE_SAMESITE || (prod ? 'none' : 'lax');
  return { httpOnly: true, secure: prod || sameSite === 'none', sameSite };
};

const publicUser = (u) => ({ id: u._id, username: u.username, email: u.email, role: u.role, isVerified: u.isVerified });

function startSession(res, user) {
  const token = generateToken(user._id, user.role);
  res.cookie('token', token, { ...cookieOptions(), maxAge: TOKEN_DAYS * 24 * 60 * 60 * 1000 });
  return token;
}

const send = (res, status, body) => res.status(status).json({ success: status < 400, ...body });
const serverError = (res, label, error, message) => {
  console.error(`${label}:`, error);
  return send(res, 500, { message });
};

// POST /api/auth/register -> creates (or refreshes) an UNVERIFIED account and emails a code
async function registerUser(req, res) {
  try {
    const { username, email, password } = req.validateData;

    const existing = await User.findOne({ email });
    if (existing && existing.lastCodeSentAt && Date.now() - existing.lastCodeSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return send(res, 429, { message: 'A code was just sent. Please wait a few seconds before trying again.', email });
    }

    // An abandoned, unverified signup must not keep a username locked forever.
    await User.deleteMany({ username, email: { $ne: email }, isVerified: false });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const fields = {
      username, password: hashedPassword, role: 'user',
      verificationCode, verificationCodeExpires: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      verificationAttempts: 0, lastCodeSentAt: new Date(),
    };

    const user = existing && !existing.isVerified
      ? await User.findByIdAndUpdate(existing._id, fields, { new: true })
      : await User.create({ ...fields, email, isVerified: false });

    try {
      await emailService.sendOTPEmail(email, verificationCode, OTP_TTL_SECONDS);
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      await User.findByIdAndDelete(user._id); // do not keep accounts whose mailbox we could not reach
      return send(res, 500, { message: 'Failed to send verification email. Please try again.' });
    }

    send(res, 200, {
      message: 'Verification code sent successfully! Please check your email.',
      email,
      expiresIn: OTP_TTL_SECONDS,
    });
  } catch (error) {
    if (error.code === 11000) return send(res, 409, { message: 'User with this username or email already exists. Please login.' });
    serverError(res, 'Error in registration', error, 'Registration failed');
  }
}

// POST /api/auth/verify-email -> confirms the code, marks the user verified and logs them in
async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body || {};
    if (typeof email !== 'string' || !email || code === undefined || code === null || code === '') {
      return send(res, 400, { message: 'Email and verification code are required.' });
    }
    const codeStr = String(code).trim();
    if (!/^\d{6}$/.test(codeStr)) return send(res, 400, { message: 'Invalid verification code format.' });

    const lower = email.trim().toLowerCase();
    const found = await User.findOne({ email: lower });
    if (!found) return send(res, 404, { message: 'User not found. Please register first.' });
    if (found.isVerified) return send(res, 400, { message: 'Email already verified. Please log in.' });

    if (!found.verificationCode) {
      return send(res, 400, { message: 'No active code. Please request a new code.', action: 'resend' });
    }
    if (new Date() > new Date(found.verificationCodeExpires)) {
      return send(res, 400, { message: 'Verification code has expired. Please request a new code.', action: 'resend' });
    }

    // Reserve one guess atomically so parallel requests cannot exceed the attempt limit.
    const user = await User.findOneAndUpdate(
      { _id: found._id, isVerified: false, verificationAttempts: { $lt: MAX_CODE_ATTEMPTS } },
      { $inc: { verificationAttempts: 1 } },
      { new: true }
    );
    if (!user) {
      return send(res, 429, { message: 'Too many wrong attempts. Please request a new code.', action: 'resend' });
    }

    if (!sameCode(user.verificationCode, codeStr)) {
      const left = MAX_CODE_ATTEMPTS - user.verificationAttempts;
      return send(res, 400, {
        message: left > 0 ? `Invalid verification code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.` : 'Invalid verification code. Please request a new code.',
        ...(left <= 0 ? { action: 'resend' } : {}),
      });
    }

    user.isVerified = true;
    user.verifiedAt = new Date();
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.verificationAttempts = 0;
    await user.save();

    const token = startSession(res, user);
    send(res, 200, { message: 'Email verified! Account created successfully!', token, user: publicUser(user) });
  } catch (error) {
    serverError(res, 'Error in email verification', error, 'Verification failed');
  }
}

// POST /api/auth/resend-code
async function resendCode(req, res) {
  try {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !email) return send(res, 400, { message: 'Email is required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return send(res, 404, { message: 'User not found. Please register first.' });
    if (user.isVerified) return send(res, 400, { message: 'Email already verified. Please log in.' });

    if (user.lastCodeSentAt && Date.now() - user.lastCodeSentAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.lastCodeSentAt.getTime())) / 1000);
      return send(res, 429, { message: `Please wait ${wait} seconds before requesting another code.`, retryAfter: wait });
    }

    const newCode = generateVerificationCode();
    user.verificationCode = newCode;
    user.verificationCodeExpires = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
    user.verificationAttempts = 0;
    user.lastCodeSentAt = new Date();
    await user.save();

    try {
      await emailService.sendOTPEmail(user.email, newCode, OTP_TTL_SECONDS);
    } catch (emailError) {
      console.error('Resend email failed:', emailError.message);
      return send(res, 500, { message: 'Failed to send verification email. Please try again.' });
    }

    send(res, 200, { message: 'New verification code sent successfully!', expiresIn: OTP_TTL_SECONDS });
  } catch (error) {
    serverError(res, 'Error resending code', error, 'Failed to resend code');
  }
}

// POST /api/auth/login (validateLogin has already checked the password and isVerified)
async function loginUser(req, res) {
  try {
    const user = req.user;
    const token = startSession(res, user);
    send(res, 200, { message: 'Logged in successfully!', token, user: publicUser(user) });
  } catch (error) {
    serverError(res, 'Error logging in', error, 'Login failed');
  }
}

// GET /api/auth/me -> lets the frontend restore the session on page load (then show the home page)
function me(req, res) {
  send(res, 200, { user: publicUser(req.user) });
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('token', cookieOptions());
  send(res, 200, { message: 'Logged out.' });
}

module.exports = { registerUser, verifyEmail, resendCode, loginUser, me, logout };
