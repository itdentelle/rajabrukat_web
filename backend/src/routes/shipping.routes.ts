import { Router } from 'express';
import { searchAreas, calculateCost } from '../controllers/shipping.controller';

const router = Router();

router.get('/search', searchAreas);
router.post('/cost', calculateCost);

export default router;
