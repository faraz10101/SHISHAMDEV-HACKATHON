// Simple in-memory limiter (enough for one server instance).
// By default it counts per IP. Pass `key: (req) => ...` to count per something else (e.g. per user).
module.exports = function rateLimit({ windowMs, max, message, key }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const id = key ? String(key(req)) : req.ip;
    let e = hits.get(id);
    if (!e || e.reset <= now) { e = { count: 0, reset: now + windowMs }; hits.set(id, e); }
    e.count += 1;
    if (e.count > max) {
      res.set('Retry-After', String(Math.ceil((e.reset - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please wait a moment and try again.',
      });
    }
    next();
  };
};
