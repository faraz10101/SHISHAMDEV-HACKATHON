const mongoose = require('mongoose');

// Every report in ScamShield belongs to one of these accounts, and only accounts
// with isVerified === true (email OTP confirmed) can create reports.
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, lowercase: true, trim: true, unique: true, maxlength: 50 },
    email: {
      type: String, required: true, unique: true, maxlength: 100, lowercase: true, trim: true,
      match: [/^[\w.+-]+@[\w.-]+\.\w{2,}$/, 'Please provide a valid email address'],
    },
    password: { type: String, required: true, minlength: 6, maxlength: 256 }, // bcrypt hash
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    verificationAttempts: { type: Number, default: 0 }, // wrong OTP guesses for the current code
    lastCodeSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
