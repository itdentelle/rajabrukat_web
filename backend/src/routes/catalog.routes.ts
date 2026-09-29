import { Router } from 'express';
import { getCatalog, updateCatalog } from '../controllers/catalog.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { cacheMiddleware } from '../middlewares/cache.middleware';

const router = Router();

router.get('/', cacheMiddleware(86400), getCatalog);
router.put('/', authenticateToken, updateCatalog);

export default router;
