import { Router } from 'express';
import { orderController } from '../controllers/orderController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.post('/', authenticateToken, orderController.createOrder);
router.get('/my-orders', authenticateToken, orderController.getMyOrders);
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']), orderController.getAllOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id/status', authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']), orderController.updateOrderStatus);
router.post('/:id/cancel', authenticateToken, orderController.cancelOrder);

export default router;
