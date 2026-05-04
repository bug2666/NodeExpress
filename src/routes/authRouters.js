const express = require('express');
const router = express.Router();

const {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout
} = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
