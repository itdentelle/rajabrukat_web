import { Router } from 'express';
import { getHeroConfig, updateHeroConfig } from '../controllers/config.controller';
import { cacheMiddleware } from '../middlewares/cache.middleware';

const router = Router();

router.get('/hero', cacheMiddleware(86400), getHeroConfig);
router.put('/hero', updateHeroConfig);

export default router;
