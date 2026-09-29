import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import cartRoutes from './cart.routes';
import wishlistRoutes from './wishlist.routes';
import shippingRoutes from './shipping.routes';
import webhookRoutes from './webhook.routes';
import adminRoutes from './admin.routes';
import configRoutes from './config.routes';
import faqRoutes from './faq.routes';
import catalogRoutes from './catalog.routes';
import collectionRoutes from './collection.routes';
import aiRoutes from './ai.routes';
import analyticsRoutes from './analytics.routes';
import uploadRoutes from './upload.routes';

import { getCategories } from '../controllers/product.controller';
import { getMyOrders } from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { cacheMiddleware } from '../middlewares/cache.middleware';

const router = Router();

// Sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/shipping', shippingRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/config', configRoutes);
router.use('/faqs', faqRoutes);
router.use('/catalog', catalogRoutes);
router.use('/collections', collectionRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);

// Direct top-level API endpoints matching frontend contract
router.get('/categories', cacheMiddleware(3600), getCategories);
router.get('/my-orders', authenticateToken, getMyOrders);

export default router;
