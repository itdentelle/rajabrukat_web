import { Router } from 'express';
import {
  createOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller';
import { requestPickup, trackPackage } from '../controllers/shipping.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', createOrder);
router.get('/', authenticateToken, getAllOrders);
router.put('/:id/status', authenticateToken, updateOrderStatus);
router.put('/:id/cancel', authenticateToken, cancelOrder);
router.post('/:id/pickup', authenticateToken, requestPickup);
router.get('/:id/track', authenticateToken, trackPackage);

export default router;
