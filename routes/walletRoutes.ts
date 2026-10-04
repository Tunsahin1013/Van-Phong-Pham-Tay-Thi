import { Router } from 'express';
import { walletController } from '../controllers/walletController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

router.get('/', walletController.getWallet);
router.post('/deposit', walletController.deposit);
router.get('/transactions', walletController.getTransactions);
router.post('/redeem-points', walletController.redeemPoints);

export default router;
