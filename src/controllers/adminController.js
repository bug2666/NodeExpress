const prisma = require('../configs/prisma');

const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await prisma.products.count(); /* đếm số sản phẩm */

        const totalOrders = await prisma.orders.count();

        const totalUsers = await prisma.users.count({
            where: {
                role: 'user'
            }
        });

        const pendingOrders = await prisma.orders.count({
            where: {
                order_status: 'pending'
            }
        });

        const lowStockVariants = await prisma.product_variants.count({
            where: {
                stock: {
                    lte: 5 /* nhỏ hơn hoặc bằng */
                }
            }
        });

        const revenueResult = await prisma.orders.aggregate({ /* tính tổng */
            where: {
                order_status: {
                    in: ['completed', 'delivered']
                }
            },
            _sum: {
                total_price: true
            }
        });

        const totalRevenue = Number(revenueResult._sum.total_price || 0);

        return res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            pendingOrders,
            lowStockVariants
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats
};
