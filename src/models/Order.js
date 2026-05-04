const pool = require('../configs/mysql');
/* nhiều bước quá nên phải dùng beginTransaction tránh việc 1 cái lỗi thì nó nghi vào db lỗi */
const createOrderFromCart = async (userId, { shippingName, shippingPhone, shippingAddress, paymentMethod }) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [cartRows] = await connection.execute(
            'SELECT id FROM carts WHERE user_id = ? LIMIT 1',
            [userId]
        );

        const cart = cartRows[0];

        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        const [items] = await connection.execute(
            `SELECT
                cart_items.product_id AS productId,
                cart_items.variant_id AS variantId,
                cart_items.quantity AS quantity,
                cart_items.unit_price AS unitPrice,
                product_variants.stock AS stock
            FROM cart_items
            JOIN product_variants ON product_variants.id = cart_items.variant_id
            WHERE cart_items.cart_id = ?`,
            [cart.id]
        );

        if (items.length === 0) {
            throw new Error('Giỏ hàng đang trống');
        }

        for (const item of items) {
            if (item.quantity > item.stock) {
                throw new Error('Có sản phẩm vượt quá tồn kho');
            }
        }

        const total = items.reduce((sum, item) => {
            return sum + Number(item.unitPrice) * Number(item.quantity);
        }, 0);

        const [orderResult] = await connection.execute(
            `INSERT INTO orders
                (user_id, total_amount, status, shipping_name, shipping_phone, shipping_address, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                total,
                'pending',
                shippingName,
                shippingPhone,
                shippingAddress,
                paymentMethod
            ]
        );

        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.execute(
                `INSERT INTO order_items
                    (order_id, product_id, variant_id, quantity, unit_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.variantId,
                    item.quantity,
                    item.unitPrice
                ]
            );

            await connection.execute(
                'UPDATE product_variants SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.variantId]
            );
        }

        await connection.execute(
            'DELETE FROM cart_items WHERE cart_id = ?',
            [cart.id]
        );

        await connection.commit();

        return findById(orderId, userId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const findMyOrders = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            user_id AS userId,
            total_amount AS totalAmount,
            status,
            shipping_name AS shippingName,
            shipping_phone AS shippingPhone,
            shipping_address AS shippingAddress,
            payment_method AS paymentMethod,
            created_at AS createdAt
        FROM orders
        WHERE user_id = ?
        ORDER BY id DESC`,
        [userId]
    );

    return rows;
};

const findById = async (orderId, userId) => {
    const [orders] = await pool.execute(
        `SELECT
            id,
            user_id AS userId,
            total_amount AS totalAmount,
            status,
            shipping_name AS shippingName,
            shipping_phone AS shippingPhone,
            shipping_address AS shippingAddress,
            payment_method AS paymentMethod,
            created_at AS createdAt
        FROM orders
        WHERE id = ? AND user_id = ?
        LIMIT 1`,
        [orderId, userId]
    );

    const order = orders[0];

    if (!order) {
        return null;
    }

    const [items] = await pool.execute(
        `SELECT
            order_items.id,
            order_items.product_id AS productId,
            order_items.variant_id AS variantId,
            order_items.quantity,
            order_items.unit_price AS unitPrice,
            products.name AS productName,
            product_variants.size,
            product_variants.color
        FROM order_items
        JOIN products ON products.id = order_items.product_id
        JOIN product_variants ON product_variants.id = order_items.variant_id
        WHERE order_items.order_id = ?`,
        [order.id]
    );

    return {
        ...order,
        items
    };
};

module.exports = {
    createOrderFromCart,
    findMyOrders,
    findById
};
