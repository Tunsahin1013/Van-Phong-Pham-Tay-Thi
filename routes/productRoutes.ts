import { Router } from 'express';
import { productController } from '../controllers/productController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeatured);
router.get('/best-sellers', productController.getBestSellers);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/:id', productController.getProductById);

// Admin & Employee product management
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']), productController.createProduct);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']), productController.updateProduct);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), productController.deleteProduct);

export default router;
