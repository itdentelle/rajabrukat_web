import { Router } from 'express';
import { aiChat, aiSmartSearch, aiVisualSearch } from '../controllers/ai.controller';

const router = Router();

router.post('/chat', aiChat);
router.post('/smart-search', aiSmartSearch);
router.post('/visual-search', aiVisualSearch);

export default router;
