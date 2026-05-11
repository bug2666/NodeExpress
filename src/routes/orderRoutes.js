const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getMyOrderById);


router.get('/admin/all', authMiddleware, adminMiddleware, getAllOrders);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);


module.exports = router;
