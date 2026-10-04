import { Router } from 'express';
import { reportController } from '../controllers/reportController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']));

router.get('/dashboard', reportController.getDashboard);
router.get('/revenue', reportController.getRevenue);
router.get('/orders', reportController.getOrders);
router.get('/products', reportController.getProducts);

export default router;
