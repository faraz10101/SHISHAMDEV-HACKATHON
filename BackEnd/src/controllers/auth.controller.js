const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function registerUser(req, res) {
    try{
        
        const { name, username, email, password, role } = req.validateData;

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            name: name,
            username: username,
            email: email,
            password: hash,
            role: role
        })

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({
            message: 'User registered successfully',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        })
    }
}

async function loginUser(req, res) {

    try {
        const savedUser = req.user;

        const token = jwt.sign(
            {
                id: savedUser._id,
                role: savedUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            message: 'User logged in successfully',
            token: token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        })

    } catch (error) {
        console.error('Error logging in user:', error);

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        })
    }
}


module.exports = { registerUser, loginUser };