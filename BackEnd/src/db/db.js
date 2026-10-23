const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectDB() {

    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to DB')
    } catch (error) {
        console.error('Error connecting to DB:', error);
    }
}

module.exports = connectDB;