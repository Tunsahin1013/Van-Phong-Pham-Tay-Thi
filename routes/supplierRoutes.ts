import { Router } from 'express';
import { supplierController } from '../controllers/supplierController.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken, authorizeRole(['ADMIN', 'EMPLOYEE']));

router.get('/', supplierController.getSuppliers);
router.post('/', authorizeRole(['ADMIN']), supplierController.createSupplier);
router.put('/:id', authorizeRole(['ADMIN']), supplierController.updateSupplier);
router.delete('/:id', authorizeRole(['ADMIN']), supplierController.deleteSupplier);

export default router;
