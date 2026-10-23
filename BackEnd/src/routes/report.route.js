const router = require('express').Router();
const rateLimit = require('../middleware/rateLimit');
const reporterId = require('../middleware/reporterId');
const { userAuth } = require('../middleware/auth');
const { validateReport } = require('../middleware/validate');
const { createReport, lookup, complaint } = require('../controllers/report.controller');

// Reporting needs a logged-in, email-verified account. Limit is per user (not per IP).
router.post('/', userAuth, rateLimit({ windowMs: 60 * 60 * 1000, max: 15, key: (req) => req.user._id, message: 'You have sent many reports in a short time. Please try again later.' }), reporterId, validateReport, createReport);
router.get('/lookup', rateLimit({ windowMs: 60 * 1000, max: 40 }), lookup);
router.get('/complaint', rateLimit({ windowMs: 60 * 1000, max: 10 }), complaint);

module.exports = router;
