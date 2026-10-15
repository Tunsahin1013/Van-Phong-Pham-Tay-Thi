import { Router } from 'express';
import { siteContentController } from '../controllers/siteContentController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', siteContentController.get);
router.put('/', authenticateToken, authorizeRole(['ADMIN']), siteContentController.update);

export default router;
