exports.notFound = (req, res) => res.status(404).json({ success: false, message: 'Route not found.' });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid request body.' });
  }
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'That item already exists.' });
  console.error(err);
  const known = err.status && err.status < 500;
  res.status(err.status || 500).json({
    success: false,
    message: known ? err.message : 'Something went wrong on our side. Please try again in a moment.',
  });
};
