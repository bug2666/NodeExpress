/* file này có chức năng định nghĩa cho các endpoint và nối chúng với controller */

const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword,logout  } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
