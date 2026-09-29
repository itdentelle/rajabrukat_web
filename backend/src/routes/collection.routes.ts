import { Router } from 'express';
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collection.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { cacheMiddleware } from '../middlewares/cache.middleware';

const router = Router();

router.get('/', cacheMiddleware(3600), getCollections);
router.get('/:id', getCollectionById);
router.post('/', authenticateToken, createCollection);
router.put('/:id', authenticateToken, updateCollection);
router.delete('/:id', authenticateToken, deleteCollection);

export default router;
