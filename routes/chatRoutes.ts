import { Router } from 'express';
import { chatController } from '../controllers/chatController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

router.get('/', chatController.getConversations);
router.post('/init', chatController.initConversation);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);
router.put('/:id/read', chatController.markAsRead);

export default router;
