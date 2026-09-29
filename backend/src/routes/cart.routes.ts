import { Router } from 'express';
import {
  getCart,
  mergeCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cart.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getCart);
router.post('/merge', authenticateToken, mergeCart);
router.post('/items', authenticateToken, addCartItem);
router.put('/items', authenticateToken, updateCartItem);
router.delete('/items/:productId', authenticateToken, removeCartItem);
router.delete('/', authenticateToken, clearCart);

export default router;
