import { Router } from 'express';
import { authController } from '../controllers/authController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/addresses', authenticateToken, authController.getAddresses);
router.post('/addresses', authenticateToken, authController.addAddress);
router.put('/addresses/:addressId', authenticateToken, authController.updateAddress);
router.patch('/addresses/:addressId/default', authenticateToken, authController.setDefaultAddress);
router.delete('/addresses/:addressId', authenticateToken, authController.deleteAddress);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router;
