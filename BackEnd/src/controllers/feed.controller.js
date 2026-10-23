const { getFeed } = require('../services/feed.service');

// GET /api/feed?city=Hyderabad  (city is optional)
exports.getFeed = async (req, res) => {
  const city = req.query.city ? String(req.query.city).trim().slice(0, 60) : null;
  res.json({ success: true, data: await getFeed(city) });
};
