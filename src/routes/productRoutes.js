const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

//nạp phân quyền
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.get('/getProducts', getProducts);
router.get('/getProductById/:id', getProductById);

/* phân quyền admin*/
router.post('/createProduct',authMiddleware, adminMiddleware, createProduct);
router.put('/updateProduct/:id',authMiddleware, adminMiddleware, updateProduct);
router.delete('/deleteProduct/:id',authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
