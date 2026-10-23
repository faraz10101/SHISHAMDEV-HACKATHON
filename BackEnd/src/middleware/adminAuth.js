const crypto = require('crypto');

module.exports = (req, res, next) => {
  const expected = Buffer.from(process.env.ADMIN_KEY || '');
  const provided = Buffer.from(req.get('x-admin-key') || '');
  if (!expected.length || expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  next();
};
