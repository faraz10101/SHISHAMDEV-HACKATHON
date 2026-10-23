const express = require('express');
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router();

router.post('/register', authMiddleware.validateRegistration, authController.registerUser)

router.post('/login', authMiddleware.validateLogin, authController.loginUser)

module.exports = router;