import { Router } from 'express';
import { handleMidtransWebhook, handleLogisticsWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/midtrans', handleMidtransWebhook);
router.post('/logistics', handleLogisticsWebhook);

export default router;
