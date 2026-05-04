const Order = require('../models/Order');

const createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { shippingName, shippingPhone, shippingAddress, paymentMethod } = req.body;

        if (!shippingName || !shippingPhone || !shippingAddress || !paymentMethod) {
            return res.status(400).json({ message: 'Thiếu thông tin đặt hàng' });
        }

        const order = await Order.createOrderFromCart(userId, {
            shippingName,
            shippingPhone,
            shippingAddress,
            paymentMethod
        });

        return res.status(201).json({
            message: 'Đặt hàng thành công',
            order
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await Order.findMyOrders(userId);

        return res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getMyOrderById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orderId = Number(req.params.id);

        const order = await Order.findById(orderId, userId);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        return res.json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getMyOrderById
};
