import { Router } from 'express';
import {
  getProducts,
  getCategories,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  updateProductStock,
} from '../controllers/product.controller';
import { getProductReviews, createProductReview } from '../controllers/review.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { cacheMiddleware } from '../middlewares/cache.middleware';

const router = Router();

// Search and Categories
router.get('/search', cacheMiddleware(3600), searchProducts);

// Reviews for a product
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', authenticateToken, createProductReview);

// Specific product actions
router.put('/:id/restore', authenticateToken, restoreProduct);
router.patch('/:id/stock', authenticateToken, updateProductStock);

// CRUD
router.get('/', cacheMiddleware(3600), getProducts);
router.get('/:id', cacheMiddleware(3600), getProductById);
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

export default router;
