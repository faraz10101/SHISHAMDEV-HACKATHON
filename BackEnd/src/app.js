const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth.route');
const checkRoutes = require('./routes/check.route');
const reportRoutes = require('./routes/report.route');
const feedRoutes = require('./routes/feed.route');
const adminRoutes = require('./routes/admin.route');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // correct client IP behind Render / Railway / Vercel

// credentials: true lets the browser send the login cookie. Set CLIENT_ORIGIN in production.
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()) : true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '20kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/check', checkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.status(200).json({ message: 'ScamShield server is live and running successfully!' }));
app.get('/api/health', (req, res) => res.json({ success: true, time: new Date() }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
