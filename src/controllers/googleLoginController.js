import { OAuth2Client } from 'google-auth-library';
import * as User from '../models/User.js';
import jwt from 'jsonwebtoken';


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, userName, role) => {
    return jwt.sign({ userId, userName, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Thiếu Google credential' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Tài khoản Google không có email' });
        }

        let user = await User.findByEmail(email);

        if (!user) {
            user = await User.createGoogleUser({
                name,
                email
            });
        }

        return res.json({
            message: 'Đăng nhập Google thành công',
            token: generateToken(user.id, user.name, user.role),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(401).json({ message: 'Đăng nhập Google thất bại' });
    }
};
export{
    googleLogin
};
