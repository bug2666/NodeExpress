const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { getDashboardStats } = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard/stats', authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;
