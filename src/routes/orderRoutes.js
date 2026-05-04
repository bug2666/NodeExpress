const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createOrder,
    getMyOrders,
    getMyOrderById
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getMyOrderById);

module.exports = router;
