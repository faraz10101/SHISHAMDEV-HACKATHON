const { SCAM_TYPES } = require('../config/constants');

const bad = (res, message) => res.status(400).json({ success: false, message });

exports.validateCheck = (req, res, next) => {
  const c = req.body?.content;
  if (typeof c !== 'string' || c.trim().length < 3) {
    return bad(res, 'Please paste a message, link or phone number to check.');
  }
  if (c.length > 2000) return bad(res, 'The text is too long. Please keep it under 2000 characters.');
  req.body.content = c.trim();
  next();
};

exports.validateReport = (req, res, next) => {
  const b = req.body || {};
  const message = typeof b.message === 'string' ? b.message.trim() : '';
  const url = typeof b.url === 'string' ? b.url.trim() : '';
  const numbers = Array.isArray(b.numbers) ? b.numbers.filter((n) => typeof n === 'string').slice(0, 5) : [];

  if (message.length > 2000) return bad(res, 'The message is too long. Please keep it under 2000 characters.');
  if (url.length > 300) return bad(res, 'The link is too long.');
  if (message.length < 20 && !numbers.length && !url) {
    return bad(res, "Please include the scammer's phone number, the link, or the full message text.");
  }
  if (b.amountLost !== undefined && b.amountLost !== null && b.amountLost !== '') {
    const a = Number(b.amountLost);
    if (!Number.isFinite(a) || a < 0 || a > 10000000) return bad(res, 'Please enter a valid amount lost, or leave it empty.');
  }
  if (b.city && String(b.city).length > 60) return bad(res, 'City name is too long.');
  if (b.scamType && !SCAM_TYPES.includes(b.scamType)) return bad(res, 'Unknown scam type.');

  req.body = {
    message, url, numbers,
    amountLost: b.amountLost ? Number(b.amountLost) : 0,
    city: b.city ? String(b.city).trim() : null,
    scamType: b.scamType || null,
  };
  next();
};
