import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.get('/product/:productId', reviewController.getByProduct);
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']), reviewController.getAllReviews);
router.post('/', authenticateToken, reviewController.addReview);
router.put('/:id/status', authenticateToken, authorizeRole(['ADMIN']), reviewController.updateStatus);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), reviewController.deleteReview);

export default router;
