const User = require('../models/User');

const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId; // lấy từ JWT trong authMiddleware
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

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
        return res.status(500).json({ message: error.message });
    }
};


const updateMyProfile = async (req, res) => {
    try {
        const userID = req.user.userId;
        const { name, phone } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ message: "Tên và số điện thoại không để trống" });
        }
        const updatedUser = await User.updateProfileById(userID, { name, phone });
        if (!updatedUser) {
            return res.status(400).json({ message: "Không tìm thấy id mà bạn muốn cập nhật" });
        }
        return res.json({
            message: 'Cập nhật profile thành công',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
module.exports = {
    getMyProfile,
    updateMyProfile
};
