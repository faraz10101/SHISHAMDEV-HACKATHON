const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth.route');

const app = express();
app.use(cors());    
app.use(express.json());

app.use('/api/auth', authRoutes)

// Test Route to check if server is alive
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Server are live and running successfully!"
    });
});


module.exports = app;