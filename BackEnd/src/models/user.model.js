const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100,
        lowercase: true, // Yeh 'User@Email.Com' ko khud 'user@email.com' bana dega
        trim: true,      // Yeh extra spaces (shuru ya aakhir mein) ko khatam kar dega
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 256
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
})

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;