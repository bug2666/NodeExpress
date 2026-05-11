const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createImage,
  updateImage,
  deleteImage
} = require('../controllers/productController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.get('/getProducts', getProducts);
router.get('/getProductById/:id', getProductById);

router.post('/createProduct', authMiddleware, adminMiddleware, createProduct);
router.put('/updateProduct/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/deleteProduct/:id', authMiddleware, adminMiddleware, deleteProduct);

router.post('/:productId/variants', authMiddleware, adminMiddleware, createVariant);
router.put('/variants/:variantId', authMiddleware, adminMiddleware, updateVariant);
router.delete('/variants/:variantId', authMiddleware, adminMiddleware, deleteVariant);

router.post('/:productId/images', authMiddleware, adminMiddleware, createImage);
router.put('/images/:imageId', authMiddleware, adminMiddleware, updateImage);
router.delete('/images/:imageId', authMiddleware, adminMiddleware, deleteImage);

module.exports = router;
