const prisma = require('../configs/prisma');



/* admin */
const findAllOrders = async () => {
    const orders = await prisma.orders.findMany({
        orderBy: {
            id: 'desc'
        },
        include: {
            users: true
        }
    });

    return orders.map((order) => {
        return {
            ...formatOrder(order),
            customerName: order.users.name,
            customerEmail: order.users.email
        };
    });
};

const updateStatus = async (orderId, status) => {
    const existingOrder = await prisma.orders.findUnique({
        where: {
            id: orderId
        }
    });

    if (!existingOrder) {
        return null;
    }

    const updatedOrder = await prisma.orders.update({
        where: {
            id: orderId
        },
        data: {
            order_status: status
        },
        include: {
            users: true
        }
    });

    return {
        ...formatOrder(updatedOrder),
        customerName: updatedOrder.users.name,
        customerEmail: updatedOrder.users.email
    };
};

/* user */
const formatPaymentMethod = (paymentMethod) => {
    if (paymentMethod === 'bank') {
        return 'bank_transfer';
    }

    return paymentMethod;
};

const formatOrder = (order) => {
    return {
        id: order.id,
        userId: order.user_id,
        totalAmount: order.total_price,
        status: order.order_status,
        shippingName: order.recipient_name,
        shippingPhone: order.recipient_phone,
        shippingAddress: order.shipping_address,
        paymentMethod: order.payment_method,
        createdAt: order.created_at
    };
};

const createOrderFromCart = async (userId, { shippingName, shippingPhone, shippingAddress, paymentMethod }) => {
    return prisma.$transaction(async (transactionClient) => {
        const cart = await transactionClient.carts.findUnique({
            where: {
                user_id: userId
            }
        });

        if (!cart) {
            throw new Error('Giỏ hàng không tồn tại');
        }

        const items = await transactionClient.cart_items.findMany({
            where: {
                cart_id: cart.id
            },
            include: {
                products: {
                    include: {
                        product_images: {
                            orderBy: [
                                { sort_order: 'asc' },
                                { id: 'asc' }
                            ],
                            take: 1
                        }
                    }
                },
                product_variants: true
            }
        });

        if (items.length === 0) {
            throw new Error('Giỏ hàng đang trống');
        }

        for (const item of items) {
            if (item.quantity > item.product_variants.stock) {
                throw new Error('Có sản phẩm vượt quá tồn kho');
            }
        }

        const total = items.reduce((sum, item) => {
            return sum + Number(item.unit_price) * Number(item.quantity);
        }, 0);

        const order = await transactionClient.orders.create({
            data: {
                user_id: userId,
                total_price: total,
                order_status: 'pending',
                payment_status: 'pending',
                recipient_name: shippingName,
                recipient_phone: shippingPhone,
                shipping_address: shippingAddress,
                payment_method: formatPaymentMethod(paymentMethod)
            }
        });

        for (const item of items) {
            const firstImage = item.products.product_images[0];
            const unitPrice = Number(item.unit_price);
            const subtotal = unitPrice * Number(item.quantity);

            await transactionClient.order_items.create({
                data: {
                    order_id: order.id,
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    product_name_snapshot: item.products.name,
                    image_snapshot: firstImage?.image_url || null,
                    size_snapshot: item.product_variants.size,
                    color_snapshot: item.product_variants.color,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    subtotal
                }
            });

            await transactionClient.product_variants.update({
                where: {
                    id: item.variant_id
                },
                data: {
                    stock: {
                        decrement: item.quantity
                    }
                }
            });
        }

        await transactionClient.cart_items.deleteMany({
            where: {
                cart_id: cart.id
            }
        });

        return findById(order.id, userId, transactionClient);
    });
};

const findMyOrders = async (userId) => {
    const orders = await prisma.orders.findMany({
        where: {
            user_id: userId
        },
        orderBy: {
            id: 'desc'
        }
    });

    return orders.map((order) => {
        return formatOrder(order);
    });
};

const findById = async (orderId, userId, client = prisma) => {
    const order = await client.orders.findFirst({
        where: {
            id: orderId,
            user_id: userId
        },
        include: {
            order_items: true
        }
    });

    if (!order) {
        return null;
    }

    return {
        ...formatOrder(order),
        items: order.order_items.map((item) => {
            return {
                id: item.id,
                productId: item.product_id,
                variantId: item.variant_id,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                productName: item.product_name_snapshot,
                size: item.size_snapshot,
                color: item.color_snapshot
            };
        })
    };
};

module.exports = {
    createOrderFromCart,
    findMyOrders,
    findById,
    findAllOrders,
    updateStatus
};

