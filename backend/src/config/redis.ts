import Redis from 'ioredis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const rawRedisUrl = process.env.REDIS_URL;
export const REDIS_URL = rawRedisUrl && rawRedisUrl.trim() !== '' ? rawRedisUrl : null;

export let isRedisConnected = false;
export let redisClient: Redis | null = null;
export let emailQueue: Queue | null = null;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        if (times > 2) {
          return null; // Stop reconnecting after 2 failed attempts
        }
        return Math.min(times * 200, 2000);
      },
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('Redis Connected Successfully 🚀');
    });

    redisClient.on('error', () => {
      isRedisConnected = false;
      // Silent warning to prevent log noise when Redis is unreachable
    });

    emailQueue = new Queue('emailQueue', { connection: redisClient as any });
  } catch (err) {
    console.log('Redis initialized in offline/bypassed mode.');
  }
} else {
  console.log('Redis disabled (No REDIS_URL set). Running in memory-direct mode.');
}
