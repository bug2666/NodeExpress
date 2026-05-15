import prisma from '../configs/prisma.js';

const createSlug = (value) => {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const firstMonthDate = new Date(currentYear, currentMonth - 5, 1); /* (year, monthIndex,day) */
        const secondMonthDate = new Date(currentYear, currentMonth - 4, 1);
        const thirdMonthDate = new Date(currentYear, currentMonth - 3, 1);
        const fourthMonthDate = new Date(currentYear, currentMonth - 2, 1);
        const fifthMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const sixthMonthDate = new Date(currentYear, currentMonth, 1);

        const monthStart = firstMonthDate;

        const createDashboardMonth = (date) => {
            const year = date.getFullYear();
            const monthNumber = date.getMonth() + 1;
            const monthKey = `${year}-${String(monthNumber).padStart(2, '0')}`; /* chuyển về yy/mm */

            return {
                key: monthKey,
                label: `T${monthNumber}`,
                revenue: 0,
                orders: 0
            };
        };

        const monthKeys = [
            createDashboardMonth(firstMonthDate),
            createDashboardMonth(secondMonthDate),
            createDashboardMonth(thirdMonthDate),
            createDashboardMonth(fourthMonthDate),
            createDashboardMonth(fifthMonthDate),
            createDashboardMonth(sixthMonthDate)
        ];


        const [
            totalProducts,
            totalOrders,
            totalUsers,

            pendingOrders,
            lowStockVariants, /* biến thể tồn kho <=5 */
            okStockVariants, /* biến thể tồn kho >5 */
            revenueResult,
            recentOrders,
            ordersByStatusRaw,
            productsByCategoryRaw
        ] = await Promise.all([
            prisma.products.count(),
            prisma.orders.count(),
            prisma.users.count({
                where: {
                    role: 'user'
                }
            }),
            prisma.orders.count({
                where: {
                    order_status: 'pending'
                }
            }),
            prisma.product_variants.count({
                where: {
                    stock: {
                        lte: 5
                    }
                }
            }),
            prisma.product_variants.count({
                where: {
                    stock: {
                        gt: 5
                    }
                }
            }),
            prisma.orders.aggregate({
                where: {
                    order_status: {
                        in: ['completed', 'delivered']
                    }
                },
                _sum: {
                    total_price: true
                }
            }),
            prisma.orders.findMany({
                where: {
                    created_at: {
                        gte: monthStart
                    },
                    order_status: {
                        in: ['completed', 'delivered']
                    }
                },
                select: {
                    created_at: true,
                    total_price: true
                }
            }),
            prisma.orders.groupBy({
                by: ['order_status'],
                _count: {
                    order_status: true
                }
            }),
            prisma.categories.findMany({
                orderBy: {
                    products: {
                        _count: 'desc'
                    }
                },
                take: 6,
                include: {
                    _count: {
                        select: {
                            products: true
                        }
                    }
                }
            })
        ]);

        const revenueByMonth = monthKeys.map((month) => {
            return {
                key: month.key,
                label: month.label,
                revenue: month.revenue,
                orders: month.orders
            };
        });

        recentOrders.forEach((order) => {
            const orderCreatedAt = new Date(order.created_at);

            const orderYear = orderCreatedAt.getFullYear();
            const orderMonth = orderCreatedAt.getMonth() + 1;
            const orderMonthText = String(orderMonth).padStart(2, '0');

            const orderMonthKey = `${orderYear}-${orderMonthText}`;

            const targetMonth = revenueByMonth.find((month) => {
                return month.key === orderMonthKey;
            });

            if (targetMonth) {
                const orderTotalPrice = Number(order.total_price || 0);

                targetMonth.revenue = targetMonth.revenue + orderTotalPrice;
                targetMonth.orders = targetMonth.orders + 1;
            }
        });


        const statusLabels = {
            pending: 'Chờ xử lý',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            completed: 'Hoàn tất',
            cancelled: 'Đã hủy'
        };

        const orderStatuses = Object.keys(statusLabels); /* trả về mảng chứa các key của object*/

        const ordersByStatus = orderStatuses.map((status) => {
            const statusDataFromDatabase = ordersByStatusRaw.find((orderStatusItem) => {
                return orderStatusItem.order_status === status;
            });
            const statusLabel = statusLabels[status]; /* chuyển lable san tiếng việt với mảng phía trên đã cho */

            let totalOrdersByStatus = 0;

            if (statusDataFromDatabase) {
                totalOrdersByStatus = statusDataFromDatabase._count.order_status;
            }

            return {
                status: status,
                label: statusLabel,
                count: totalOrdersByStatus
            };
        });


        const productsByCategory = productsByCategoryRaw.map((category) => ({
            name: category.name,
            value: category._count.products
        }));

        const totalRevenue = Number(revenueResult._sum.total_price || 0);

        return res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            pendingOrders,
            lowStockVariants,
            revenueByMonth,
            ordersByStatus,
            productsByCategory,
            stockOverview: [
                { name: 'Ổn định', value: okStockVariants },
                { name: 'Sắp hết', value: lowStockVariants }
            ]
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const [users, totalItems] = await Promise.all([
            prisma.users.findMany({
                skip,
                take: limit,
                orderBy: {
                    id: 'desc'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    created_at: true,
                    updated_at: true
                }
            }),
            prisma.users.count()
        ]);

        return res.json({
            users: users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            })),
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }

        const user = await prisma.users.update({
            where: {
                id
            },
            data: {
                role
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                created_at: true,
                updated_at: true
            }
        });

        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (req.user.userId === id) {
            return res.status(400).json({ message: 'Không thể xóa chính tài khoản admin đang đăng nhập' });
        }

        await prisma.users.delete({
            where: {
                id
            }
        });

        return res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await prisma.categories.findMany({
            orderBy: {
                id: 'desc'
            },
            include: {
                _count: {
                    select: {
                        products: true /* đếm số lượng products liên kết với mỗi category */
                    }
                }
            }
        });

        return res.json(categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            productCount: category._count.products,
            createdAt: category.created_at,
            updatedAt: category.updated_at
        })));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên danh mục' });
        }

        const category = await prisma.categories.create({
            data: {
                name: name.trim(),
                slug: createSlug(name)
            }
        });

        return res.status(201).json({
            id: category.id,
            name: category.name,
            slug: category.slug,
            productCount: 0,
            createdAt: category.created_at,
            updatedAt: category.updated_at
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Danh mục đã tồn tại' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên danh mục' });
        }

        const category = await prisma.categories.update({
            where: {
                id
            },
            data: {
                name: name.trim(),
                slug: createSlug(name)
            },
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        return res.json({
            id: category.id,
            name: category.name,
            slug: category.slug,
            productCount: category._count.products,
            createdAt: category.created_at,
            updatedAt: category.updated_at
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Danh mục đã tồn tại' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const productCount = await prisma.products.count({
            where: {
                category_id: id
            }
        });

        if (productCount > 0) {
            return res.status(409).json({ message: 'Không thể xóa danh mục đang có sản phẩm' });
        }

        await prisma.categories.delete({
            where: {
                id
            }
        });

        return res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const getBrands = async (req, res) => {
    try {
        const brands = await prisma.brands.findMany({
            orderBy: {
                id: 'desc'
            },
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        return res.json(brands.map((brand) => ({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            productCount: brand._count.products,
            createdAt: brand.created_at,
            updatedAt: brand.updated_at
        })));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createBrand = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên thương hiệu' });
        }

        const brand = await prisma.brands.create({
            data: {
                name: name.trim(),
                slug: createSlug(name)
            }
        });

        return res.status(201).json({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            productCount: 0,
            createdAt: brand.created_at,
            updatedAt: brand.updated_at
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Thương hiệu đã tồn tại' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const updateBrand = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên thương hiệu' });
        }

        const brand = await prisma.brands.update({
            where: {
                id
            },
            data: {
                name: name.trim(),
                slug: createSlug(name)
            },
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        return res.json({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            productCount: brand._count.products,
            createdAt: brand.created_at,
            updatedAt: brand.updated_at
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Thương hiệu đã tồn tại' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const productCount = await prisma.products.count({
            where: {
                brand_id: id
            }
        });

        if (productCount > 0) {
            return res.status(409).json({ message: 'Không thể xóa thương hiệu đang có sản phẩm' });
        }

        await prisma.brands.delete({
            where: {
                id
            }
        });

        return res.json({ message: 'Xóa thương hiệu thành công' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
        }

        return res.status(500).json({ message: error.message });
    }
};

const getInventoryHistory = async (req, res) => {
    try {
        const variantId = Number(req.query.variantId);
        const limit = Number(req.query.limit) || 20;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.inventory_transactions.findMany({
                where: {
                    variant_id: variantId
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.inventory_transactions.count({
                where: { variant_id: variantId }
            })
        ]);

        return res.json({
            transactions: transactions.map((t) => ({
                id: t.id,
                variantId: t.variant_id,
                quantity: t.quantity,
                reason: t.reason,
                orderId: t.reference_id,
                notes: t.notes,
                createdAt: t.created_at
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};



const adjustVariantStock = async (req, res) => {
    try {
        const variantId = Number(req.params.variantId);
        const { quantity, reason, notes } = req.body; /* lấy dữ liệu từ request */
        const adminId = req.user.userId;

        if (!quantity || quantity === 0) {
            return res.status(400).json({ message: 'Số lượng phải khác 0' });
        }

        // Lấy variant hiện tại
        const variant = await prisma.product_variants.findUnique({
            where: { id: variantId }
        });

        if (!variant) {
            return res.status(404).json({ message: 'Không tìm thấy variant' });
        }

        // Kiểm tra stock không âm
        const newStock = variant.stock + quantity;
        if (newStock < 0) {
            return res.status(400).json({
                message: `Tồn kho không đủ. Hiện tại: ${variant.stock}, cần giảm: ${Math.abs(quantity)}`
            });
        }

        // Cập nhật stock
        const updated = await prisma.product_variants.update({
            where: { id: variantId },
            data: { stock: newStock }
        });

        // Ghi log
        await prisma.inventory_transactions.create({
            data: {
                variant_id: variantId,
                quantity,  // có thể âm hoặc dương
                reason: reason || 'stock_adjustment',
                notes,
                created_by: adminId
            }
        });

        return res.json({
            message: 'Cập nhật tồn kho thành công',
            variant: {
                id: updated.id,
                stock: updated.stock,
                oldStock: variant.stock,
                adjustedBy: quantity
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export {
    getDashboardStats,
    getUsers,
    updateUserRole,
    deleteUser,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    getInventoryHistory,
    adjustVariantStock
};
