import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin only
router.post('/', authenticateToken, authorizeRole(['ADMIN']), categoryController.createCategory);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), categoryController.updateCategory);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), categoryController.deleteCategory);

export default router;
