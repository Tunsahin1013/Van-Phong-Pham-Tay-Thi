import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']));

router.get('/logs', inventoryController.getLogs);
router.get('/low-stock', inventoryController.getLowStock);
router.post('/in', inventoryController.stockIn);
router.post('/adjust', inventoryController.stockAdjust);

export default router;
