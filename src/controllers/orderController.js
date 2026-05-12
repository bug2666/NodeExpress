import * as Order from '../models/Order.js';



const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAllOrders();

        return res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "shipping",
            "delivered",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
        }

        const order = await Order.updateStatus(orderId, status);

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        return res.json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};





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

export {
    createOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrderStatus
};


