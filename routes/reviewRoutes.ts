import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.ts';
import { authenticateToken, authorizeRole, optionalAuth } from '../middleware/auth.ts';

const router = Router();

router.get('/product/:productId', optionalAuth, reviewController.getByProduct);
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']), reviewController.getAllReviews);
router.post('/', authenticateToken, reviewController.addReview);
router.put('/:id', authenticateToken, reviewController.updateReview);
router.put('/:id/reply', authenticateToken, authorizeRole(['ADMIN']), reviewController.replyToReview);
router.delete('/:id/reply', authenticateToken, authorizeRole(['ADMIN']), reviewController.deleteReviewReply);
router.put('/:id/status', authenticateToken, authorizeRole(['ADMIN']), reviewController.updateStatus);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), reviewController.deleteReview);

export default router;
