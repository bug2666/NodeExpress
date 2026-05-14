import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

import {
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
} from '../controllers/adminController.js';


const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard/stats', getDashboardStats);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

router.get('/inventory-history', getInventoryHistory);
router.put('/variants/:variantId/adjust-stock', adjustVariantStock);

export default router
