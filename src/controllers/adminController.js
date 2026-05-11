const prisma = require('../configs/prisma');

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
        const totalProducts = await prisma.products.count();
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
                    lte: 5
                }
            }
        });
        const revenueResult = await prisma.orders.aggregate({
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

const getUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany({
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
        });

        return res.json(users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        })));
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
                        products: true
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

module.exports = {
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
    deleteBrand
};
