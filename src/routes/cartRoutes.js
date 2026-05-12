import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getMyCart,
    addItemToCart,
    updateCartItem,
    deleteCartItem
} from '../controllers/cartController.js';

const router = express.Router();

router.get('/', authMiddleware, getMyCart);
router.post('/items', authMiddleware, addItemToCart);
router.put('/items/:variantId', authMiddleware, updateCartItem);
router.delete('/items/:variantId', authMiddleware, deleteCartItem);

export default router;
