import { Router } from 'express';
import { logVisitor, getVisitorStats } from '../controllers/analytics.controller';

const router = Router();

router.post('/log', logVisitor);
router.get('/stats', getVisitorStats);

export default router;
