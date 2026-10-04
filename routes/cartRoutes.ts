import { Router } from 'express';
import { cartController } from '../controllers/cartController.ts';

const router = Router();

router.post('/validate', cartController.validateCart);

export default router;
