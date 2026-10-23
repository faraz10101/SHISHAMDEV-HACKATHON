require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Fail fast instead of failing on the first signup.
const missing = ['MONGO_URI', 'JWT_SECRET', 'RESEND_API_KEY', 'ENCRYPTION_SECRET', 'SALT'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`ScamShield API running on port ${PORT}`));
})();
