const router = require('express').Router();
const rateLimit = require('../middleware/rateLimit');
const { validateRegistration, validateLogin, userAuth } = require('../middleware/auth');
const c = require('../controllers/auth.controller');

// Per-IP limits on the endpoints that send email or accept guesses.
const mailLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many attempts. Please try again later.' });
const verifyLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, message: 'Too many attempts. Please try again later.' });
const loginLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, message: 'Too many login attempts. Please try again later.' });

router.post('/register', mailLimit, validateRegistration, c.registerUser);
router.post('/verify-email', verifyLimit, c.verifyEmail);
router.post('/resend-code', mailLimit, c.resendCode);
router.post('/login', loginLimit, validateLogin, c.loginUser);
router.get('/me', userAuth, c.me);
router.post('/logout', c.logout);

module.exports = router;
