import { Router } from 'express';
import { getAdminStats } from '../controllers/admin.controller';
import { updateAdminSettings } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticateToken, getAdminStats);
router.put('/settings', authenticateToken, updateAdminSettings);

export default router;
