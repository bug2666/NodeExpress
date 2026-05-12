import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';

import {
    createOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrderStatus
} from '../controllers/orderController.js';

import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createOrder);

router.get('/admin/all', authMiddleware, adminMiddleware, getAllOrders);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);

router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getMyOrderById);


export default router;

