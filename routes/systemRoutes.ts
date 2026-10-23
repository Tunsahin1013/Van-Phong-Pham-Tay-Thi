import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';
import { systemController } from '../controllers/systemController.ts';

const router = Router();

// Public website only receives fields safe to display in the header/footer.
router.get('/settings/public', systemController.getPublicSettings);

// All remaining system administration endpoints are ADMIN-only.
router.use(authenticateToken, authorizeRole(['ADMIN']));
router.get('/settings', systemController.getSettings);
router.put('/settings', systemController.updateSettings);
router.get('/backup', systemController.downloadBackup);
router.get('/reports/export', systemController.exportReport);
router.get('/reports/product-inventory', systemController.getProductInventoryReport);
router.get('/reports/customer-insights', systemController.getCustomerInsightsReport);
router.get('/logs', systemController.getLogs);

export default router;
