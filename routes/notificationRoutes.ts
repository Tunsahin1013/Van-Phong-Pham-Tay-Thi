import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

// Broadcast by Admin
router.post('/', authorizeRole(['ADMIN']), notificationController.createNotification);

export default router;
