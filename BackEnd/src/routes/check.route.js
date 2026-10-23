const router = require('express').Router();
const rateLimit = require('../middleware/rateLimit');
const { validateCheck } = require('../middleware/validate');
const { checkContent } = require('../controllers/check.controller');

router.post('/', rateLimit({ windowMs: 60 * 1000, max: 20, message: 'You are checking too fast. Please wait a minute and try again.' }), validateCheck, checkContent);

module.exports = router;
