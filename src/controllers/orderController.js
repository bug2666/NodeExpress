import * as Order from '../models/Order.js';
import { recordTransaction } from '../models/InventoryTransaction.js';


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



const cancelOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const adminId = req.user.userId;

    // Lấy order + items
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { order_items: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.order_status === 'cancelled') {
      return res.status(400).json({ message: 'Đơn hàng đã bị hủy rồi' });
    }

    // Dùng transaction để đảm bảo all-or-nothing
    const result = await prisma.$transaction(async (tx) => {
      // Hoàn stock từng item
      for (const item of order.order_items) {
        // Tăng stock lại
        await tx.product_variants.update({
          where: { id: item.variant_id },
          data: {
            stock: { increment: item.quantity }
          }
        });

        // Ghi log hoàn stock
        await tx.inventory_transactions.create({
          data: {
            variant_id: item.variant_id,
            quantity: item.quantity,  // dương = tăng
            reason: 'order_cancelled',
            reference_id: orderId,
            notes: `Hủy order #${orderId}, hoàn ${item.quantity} cái`,
            created_by: adminId
          }
        });
      }

      // Cập nhật status order
      const updated = await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: 'cancelled',
          updated_at: new Date()
        },
        include: { order_items: true }
      });

      return updated;
    });

    return res.json({
      message: 'Hủy đơn hàng thành công',
      order: result
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export {
    createOrder,
    getMyOrders,
    getMyOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder
};


