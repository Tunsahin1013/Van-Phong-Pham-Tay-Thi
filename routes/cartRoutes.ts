import { Router } from 'express';
import { cartController } from '../controllers/cartController.ts';

const router = Router();

router.post('/validate', cartController.validateCart);
router.get('/:sessionId', cartController.getCart);
router.put('/:sessionId', cartController.saveCart);

export default router;
