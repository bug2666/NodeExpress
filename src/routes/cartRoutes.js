const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    getMyCart,
    addItemToCart,
    updateCartItem,
    deleteCartItem
} = require('../controllers/cartController');

const router = express.Router();

router.get('/', authMiddleware, getMyCart);
router.post('/items', authMiddleware, addItemToCart);
router.put('/items/:variantId', authMiddleware, updateCartItem);
router.delete('/items/:variantId', authMiddleware, deleteCartItem);

module.exports = router;
