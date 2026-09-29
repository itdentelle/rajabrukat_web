import { Router } from 'express';
import { getWishlist, toggleWishlist } from '../controllers/wishlist.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getWishlist);
router.post('/', authenticateToken, toggleWishlist);

export default router;
