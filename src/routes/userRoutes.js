const express = require('express');
const { getMyProfile ,updateMyProfile} = require('../controllers/userController'); // trả về dạng object
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getMyProfile);
router.put('/updateMyProfile', authMiddleware, updateMyProfile);


module.exports = router;
