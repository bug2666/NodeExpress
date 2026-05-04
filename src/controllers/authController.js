const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');
const sendMail = require('../configs/mailer');

const generateToken = (userId, userName, role) => {
    return jwt.sign({ userId, userName, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên, email và mật khẩu' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(422).json({ message: 'Email không hợp lệ' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(422).json({ message: 'Email đã được đăng kí' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.createUser({
            name,
            email,
            password: hashedPassword,
            phone
        });

        res.status(201).json({
            message: 'Đăng ký thành công',
            token: generateToken(user.id, user.name, user.role),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email và mật khẩu phải có dữ liệu" });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng!" });
        }
        else {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng!" });
            }
            else {
                res.json({
                    message: 'Login successful',
                    token: generateToken(user.id, user.name, user.role),
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                })
            }
        }

    } catch (error) {
        console.log("đăng nhập lỗi");
    }
};

const logout = (req, res) => {
    return res.json({ message: 'Đăng xuất thành công' });
};

/* quên mật khẩu */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email' });
        }

        const user = await User.findByEmail(email);

        if (!user) {
            return res.json({
                message: 'Nếu email tồn tại, link đặt lại mật khẩu sẽ được gửi'
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');

        const hashedToken = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await User.saveResetToken(user.id, hashedToken, expiresAt);

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

        try {
            await sendMail({
                to: user.email,
                subject: 'Đặt lại mật khẩu',
                html: `
                    <h2>Đặt lại mật khẩu</h2>
                    <p>Click vào link bên dưới để đặt lại mật khẩu:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>Link hết hạn sau 15 phút.</p>
                `
            });
        } catch (mailError) {
            console.error('Send reset password email failed:', mailError);
            return res.status(500).json({ message: 'Không gửi được email đặt lại mật khẩu' });
        }

        return res.json({
            message: 'Nếu email tồn tại, link đặt lại mật khẩu sẽ được gửi'
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/* reset pass */
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đủ mật khẩu' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findByResetToken(hashedToken);

        if (!user) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const expiresAt = new Date(user.resetPasswordExpires);

        if (expiresAt < new Date()) {
            await User.clearResetToken(user.id);
            return res.status(400).json({ message: 'Token đã hết hạn' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.updatePassword(user.id, hashedPassword);
        await User.clearResetToken(user.id);

        return res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout
};