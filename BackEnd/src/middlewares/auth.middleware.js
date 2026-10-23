const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function validateRegistration(req, res, next) {
    try {
        const { name, username, email, password, confirmPassword, role = 'user' } = req.body || {};

        // cheak password are not empty and match with confirm password
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Password does not match'
            })
        }

        // cheak input field are not empty
        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: 'Please provide all required fields'
            })
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                message: 'Username must be between 3 and 20 characters'
            })
        }

        // email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please provide a valid email address'
            })
        }

        // pasword stength cheak
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            })
        }

        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[a-z]/.test(password)) {
            return res.status(400).json({
                message: 'password must contain at Least one uppercase and Lowercase letter and one number'
            })
        }

        const existingUser = await userModel.findOne(
            {
                $or: [
                    { username: username.toLowerCase() },
                    { email: email.toLowerCase() }
                ]
            }
        )

        if (existingUser) {
            return res.status(409).json({
                message: 'User with this username or email already exists please try with different credentials'
            })
        }

        req.validateData = {
            name: name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password,
            role: role
        }

        next();

    } catch (error) {
        console.error('Error validating registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function validateLogin(req, res, next) {

    const { username, email, password } = req.body || {};

    console.log('Login request body:', req.body);

    // cheak input field are not empty
    if (!username && !email) {
        return res.status(400).json({
            message: 'Please provide either username or email'
        })
    }

    // cheak password is not empty
    if (!password) {
        return res.status(400).json({
            message: 'Please provide password'
        })
    }

    // cheak user is exists or not in database
    const savedUser = await userModel.findOne(
        {
            $or: [
                { username },
                { email }
            ]
        }
    )

    // if user is not exists in database
    if (!savedUser) {
        return res.status(404).json({
            message: 'User not found with this username or email'
        })
    }

    // cheak password is correct or not
    const isPasswordCorrect = await bcrypt.compare(password, savedUser.password);

    // if password is incorrect
    if (!isPasswordCorrect) {
        return res.status(401).json({
            message: 'Incorrect password'
        })
    }

    req.user = savedUser;
    next();
}

module.exports = { validateRegistration, validateLogin };