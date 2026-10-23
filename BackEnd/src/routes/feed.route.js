const router = require('express').Router();
const { getFeed } = require('../controllers/feed.controller');

router.get('/', getFeed);

module.exports = router;
