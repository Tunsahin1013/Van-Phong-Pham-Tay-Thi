import { Router } from 'express';
import { voucherController } from '../controllers/voucherController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', voucherController.getVouchers);
router.post('/validate', voucherController.validateVoucher);

// Admin only
router.post('/', authenticateToken, authorizeRole(['ADMIN']), voucherController.createVoucher);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), voucherController.updateVoucher);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), voucherController.deleteVoucher);

export default router;
