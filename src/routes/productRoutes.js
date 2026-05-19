import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
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
  deleteImage,
  createUploadedImage,
  getPublicCategories,
  getPublicBrands
} from '../controllers/productController.js';

const router = express.Router();

router.get('/getProducts', getProducts);
router.get('/getProductById/:id', getProductById);

// Endpoint public cho filter ở frontend
router.get('/categories', getPublicCategories);
router.get('/brands', getPublicBrands);

router.post('/createProduct', authMiddleware, adminMiddleware, createProduct);
router.put('/updateProduct/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/deleteProduct/:id', authMiddleware, adminMiddleware, deleteProduct);

router.post('/:productId/variants', authMiddleware, adminMiddleware, createVariant);
router.put('/variants/:variantId', authMiddleware, adminMiddleware, updateVariant);
router.delete('/variants/:variantId', authMiddleware, adminMiddleware, deleteVariant);

router.post('/:productId/images', authMiddleware, adminMiddleware, createImage);
router.put('/images/:imageId', authMiddleware, adminMiddleware, updateImage);
router.delete('/images/:imageId', authMiddleware, adminMiddleware, deleteImage);

// Thêm route upload
router.post('/:productId/images/upload', authMiddleware, adminMiddleware, upload.single('image'), createUploadedImage);

export default router;
