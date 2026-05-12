import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';

import {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout,
    googleLogin
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', authMiddleware, logout);

router.post('/google', googleLogin);

export default router
