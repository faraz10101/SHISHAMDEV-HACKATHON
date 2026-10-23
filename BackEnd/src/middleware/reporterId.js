const crypto = require('crypto');

// Reporter identity = the verified account (set by userAuth), NOT the IP/browser any more.
// reporterHash is a salted HMAC of the user id: stable per person, so "unique reporters" counts real
// verified people, and it is the only identifier the public feed / lookup aggregates ever touch.
module.exports = (req, res, next) => {
  req.reporterHash = crypto
    .createHmac('sha256', process.env.SALT || '')
    .update(String(req.user._id))
    .digest('hex')
    .slice(0, 32);
  next();
};
