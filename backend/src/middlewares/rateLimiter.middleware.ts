import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient, isRedisConnected } from '../config/redis';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan login/register, silakan coba lagi setelah 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
  store:
    isRedisConnected && redisClient
      ? new RedisStore({
          sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)) as any,
        })
      : undefined,
});
