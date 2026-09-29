import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { initializeAdmin } from './config/database';
import { initEmailWorker } from './services/email.service';
import { initCronJobs } from './cron/abandonedCart.cron';
import apiRouter from './routes';

dotenv.config();

// Process level error handlers to prevent container crashes on temporary glitches
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception caught]:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
const envOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
]
  .filter(Boolean)
  .map((origin) => origin!.trim().replace(/\/+$/, ''));

const ALLOWED_ORIGINS = Array.from(
  new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://rajabrukat.com',
    'https://www.rajabrukat.com',
    ...envOrigins,
  ])
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RajaBrukat Backend API', version: '1.0.0' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static directories

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Mount Central API Router
app.use('/api', apiRouter);

// Initialize Admin User, Background Workers & Cron Jobs
initializeAdmin().catch((err) => console.error('Admin initialization warning:', err));
initEmailWorker();
initCronJobs();

// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0) 🚀`);
});

export default app;
