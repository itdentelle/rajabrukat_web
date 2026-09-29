import { Request, Response, NextFunction } from 'express';
import { redisClient, isRedisConnected } from '../config/redis';

export const cacheMiddleware = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || !isRedisConnected || !redisClient || redisClient.status !== 'ready') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      } else {
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          if (isRedisConnected && redisClient && redisClient.status === 'ready') {
            redisClient.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
          }
          return originalJson(body);
        };
        next();
      }
    } catch (err) {
      console.error('Redis Cache Error:', err);
      next();
    }
  };
};

export const clearCacheByPattern = async (pattern: string) => {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.error(`Error clearing cache pattern ${pattern}:`, err);
    }
  }
};
