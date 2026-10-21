import { Router } from 'express';
import { loyaltyController } from '../controllers/loyaltyController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();
router.use(authenticateToken);
router.post('/redeem-points', loyaltyController.redeemPoints);

export default router;
