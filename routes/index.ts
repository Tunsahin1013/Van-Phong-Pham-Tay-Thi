import { Router } from 'express';
import authRoutes from './authRoutes.ts';
import productRoutes from './productRoutes.ts';
import categoryRoutes from './categoryRoutes.ts';
import orderRoutes from './orderRoutes.ts';
import cartRoutes from './cartRoutes.ts';
import inventoryRoutes from './inventoryRoutes.ts';
import voucherRoutes from './voucherRoutes.ts';
import reviewRoutes from './reviewRoutes.ts';
import walletRoutes from './walletRoutes.ts';
import notificationRoutes from './notificationRoutes.ts';
import chatRoutes from './chatRoutes.ts';
import reportRoutes from './reportRoutes.ts';
import supplierRoutes from './supplierRoutes.ts';
import userRoutes from './userRoutes.ts';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/vouchers', voucherRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/chats', chatRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/users', userRoutes);

export default apiRouter;
