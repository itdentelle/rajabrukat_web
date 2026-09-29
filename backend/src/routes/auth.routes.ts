import { Router } from 'express';
import { login, register, verifyOtp, logout, googleLogin } from '../controllers/auth.controller';
import { authLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/logout', logout);
router.post('/google', googleLogin);

export default router;
