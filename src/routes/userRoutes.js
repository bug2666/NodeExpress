import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getMyProfile, updateMyProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authMiddleware, getMyProfile);
router.put('/updateMyProfile', authMiddleware, updateMyProfile);


export default router;
