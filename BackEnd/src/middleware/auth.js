const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.\w{2,}$/;
const isStr = (v) => typeof v === 'string';
const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });

async function validateRegistration(req, res, next) {
  try {
    // "role" is intentionally NOT read from req.body. Admins are created manually in the DB.
    const { username, email, password } = req.body || {};

    if (!isStr(username) || !isStr(email) || !isStr(password) || !username.trim() || !email.trim() || !password) {
      return fail(res, 400, 'Please provide all required fields');
    }
    if (username.trim().length > 50) return fail(res, 400, 'Username must be 50 characters or fewer');
    if (email.trim().length > 100 || !EMAIL_RE.test(email.trim())) return fail(res, 400, 'Please provide a valid email address');
    if (password.length < 6) return fail(res, 400, 'Password must be at least 6 characters long');
    if (password.length > 72) return fail(res, 400, 'Password must be 72 characters or fewer'); // bcrypt only reads 72 bytes

    const clean = { username: username.trim().toLowerCase(), email: email.trim().toLowerCase(), password };

    const verified = await User.findOne({ isVerified: true, $or: [{ username: clean.username }, { email: clean.email }] });
    if (verified) return fail(res, 409, 'User with this username or email already exists. Please login.');
    // Unverified leftovers are overwritten by registerUser().

    req.validateData = { ...clean, role: 'user' };
    next();
  } catch (error) {
    console.error('Error validating registration:', error);
    fail(res, 500, 'Internal server error');
  }
}

async function validateLogin(req, res, next) {
  try {
    let { username, email, password } = req.body || {};

    if (username !== undefined && !isStr(username)) return fail(res, 400, 'Invalid username');
    if (email !== undefined && !isStr(email)) return fail(res, 400, 'Invalid email');
    if (!username && !email) return fail(res, 400, 'Please provide either username or email');
    if (!isStr(password) || !password) return fail(res, 400, 'Please provide password');

    if (username && username.includes('@')) { email = username; username = undefined; }

    const conditions = [];
    if (username) conditions.push({ username: username.trim().toLowerCase() });
    if (email) conditions.push({ email: email.trim().toLowerCase() });

    const saved = await User.findOne({ $or: conditions });
    if (!saved) return fail(res, 404, 'User not found with this username or email');

    if (!saved.isVerified) {
      return fail(res, 403, 'Your email is not verified. Please verify your email first.', { action: 'verify', email: saved.email });
    }
    if (!(await bcrypt.compare(password, saved.password))) return fail(res, 401, 'Incorrect password');

    req.user = saved;
    next();
  } catch (error) {
    console.error('ERROR in validateLogin:', error);
    fail(res, 500, 'Internal server error');
  }
}

// Logged-in AND email-verified users only. This is the gate in front of POST /api/reports,
// so every report can be traced back to a real, verified mailbox.
async function userAuth(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return fail(res, 401, 'Please log in to continue.', { action: 'login' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return fail(res, 401, 'Account not found. Please log in again.', { action: 'login' });

    if (!user.isVerified) {
      return fail(res, 403, 'Please verify your email before continuing.', { action: 'verify', email: user.email });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return fail(res, 401, 'Session expired. Please log in again.', { action: 'login' });
    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') return fail(res, 401, 'Invalid session. Please log in again.', { action: 'login' });
    console.error('userAuth error:', error);
    fail(res, 500, 'Authentication error');
  }
}

module.exports = { validateRegistration, validateLogin, userAuth };
