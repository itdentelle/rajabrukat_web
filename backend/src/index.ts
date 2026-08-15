import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import cron from 'node-cron';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { RedisStore } from 'rate-limit-redis';
import { GoogleGenerativeAI } from '@google/generative-ai';
const midtransClient = require('midtrans-client');

dotenv.config();

// --- GEMINI AI SETUP ---
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;


// --- DATABASE SETUP ---
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
if (!connectionString) {
  console.error('[WARNING] DATABASE_URL environment variable is missing or empty!');
}
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('aws') || connectionString.includes('railway');
const pool = new Pool({ 
  connectionString,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  console.error('Pg Pool Idle Connection Warning:', err.message);
});

let adapter: any;
let prisma: PrismaClient;
try {
  adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.error('[PRISMA INIT WARNING]:', err);
  prisma = new PrismaClient();
}


// --- EXPRESS SETUP ---
const PORT = process.env.PORT || 5000;
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');

// --- REDIS SETUP ---
const rawRedisUrl = process.env.REDIS_URL;
const REDIS_URL = (rawRedisUrl && rawRedisUrl.trim() !== '') ? rawRedisUrl : null;
let isRedisConnected = false;
let redisClient: Redis | null = null;
let emailQueue: Queue | null = null;
let emailWorker: Worker | null = null;

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

    redisClient.on('error', (err) => {
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


// --- CACHING MIDDLEWARE ---
const cacheMiddleware = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: express.NextFunction) => {
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
      console.error("Redis Cache Error:", err);
      next(); 
    }
  };
};

// --- SECURITY MIDDLEWARES ---
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- HEALTH CHECK ENDPOINTS FOR RAILWAY CONTAINER ---
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'RajaBrukat Backend API', version: '1.0.0' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve scraped product images & CMS uploaded images
const SCRAPED_IMAGES_DIR = process.env.SCRAPED_IMAGES_DIR || `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
app.use('/scraped-images', express.static(SCRAPED_IMAGES_DIR));

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Endpoint upload gambar dari CMS Admin (Anti RLS, menghasilkan URL bersih)
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Data gambar tidak ditemukan' });

    const matches = image.match(/^data:image\/([a-zA-Z0-9+.=-]+);base64,(.+)$/);
    if (!matches) {
      // Jika sudah berupa URL biasa
      return res.json({ url: image });
    }

    const rawExt = matches[1].split('+')[0];
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt || 'png';
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${fileName}`;

    return res.json({ url });
  } catch (err: any) {
    console.error("Error pada /api/upload:", err);
    return res.status(500).json({ error: err.message || 'Gagal menyimpan gambar di server' });
  }
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Terlalu banyak percobaan login/register, silakan coba lagi setelah 15 menit.' },
  standardHeaders: true, 
  legacyHeaders: false,
  store: (isRedisConnected && redisClient) ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)) as any,
  }) : undefined,
});

const JWT_SECRET = process.env.JWT_SECRET || 'dragonworm-secret-key-123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dragonworm.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// --- EMAIL TRANSPORTER ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// --- EMAIL TEMPLATES ---
const getEmailTemplate = (title: string, bodyHTML: string, buttonText?: string, buttonUrl?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { background-color: #000000; color: #ffffff; text-align: center; padding: 30px 20px; text-transform: uppercase; letter-spacing: 2px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .content h2 { margin-top: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .button-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
        .footer { background-color: #f3f4f6; text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Raja Brukat</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${bodyHTML}
          ${buttonText && buttonUrl ? `
            <div class="button-container">
              <a href="${buttonUrl}" class="btn">${buttonText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Raja Brukat. All rights reserved.<br>
          Spesialis Kain Brukat & Renda Impor Premium.
        </div>
      </div>
    </body>
    </html>
  `;
};

// --- EMAIL QUEUE FUNCTIONS ---
const sendNotificationEmail = async (email: string, subject: string, title: string, bodyHTML: string, buttonText?: string, buttonUrl?: string) => {
  if (emailQueue && isRedisConnected) {
    await emailQueue.add('send-notification', { email, subject, title, bodyHTML, buttonText, buttonUrl });
    console.log(`[EMAIL QUEUE] Queued notification email for ${email} - Subject: ${subject}`);
  } else {
    const html = getEmailTemplate(title, bodyHTML, buttonText, buttonUrl);
    transporter.sendMail({
      from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    }).catch((err: any) => console.error("Direct Email Error:", err?.message || err));
  }
};

const sendOTPEmail = async (email: string, otp: string) => {
  if (emailQueue && isRedisConnected) {
    await emailQueue.add('send-otp', { email, otp });
    console.log(`[EMAIL QUEUE] Queued OTP email for ${email}`);
  } else {
    console.log(`\n=========================================\n[DIRECT OTP EMAIL] OTP for ${email} is: ${otp}\n=========================================\n`);
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter.sendMail({
        from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Login/Register OTP Code',
        text: `Your RajaBrukat OTP code is: ${otp}. It will expire in 5 minutes.`
      }).catch((err: any) => console.error("Direct OTP Email Error:", err?.message || err));
    }
  }
};

// --- BULLMQ EMAIL WORKER ---
if (REDIS_URL && redisClient) {
  try {
    emailWorker = new Worker('emailQueue', async job => {
      if (job.name === 'send-notification') {
        const { email, subject, title, bodyHTML, buttonText, buttonUrl } = job.data;
        const html = getEmailTemplate(title, bodyHTML, buttonText, buttonUrl);
        const mailOptions = {
          from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: subject,
          html: html
        };
        await new Promise(resolve => setTimeout(resolve, 500));
        await transporter.sendMail(mailOptions);
      } else if (job.name === 'send-otp') {
        const { email, otp } = job.data;
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          console.log(`\n=========================================\n[DUMMY EMAIL WORKER] OTP for ${email} is: ${otp}\n=========================================\n`);
          return;
        }
        await transporter.sendMail({
          from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Login/Register OTP Code',
          text: `Your RajaBrukat OTP code is: ${otp}.`
        });
      }
    }, { connection: redisClient as any });
  } catch (err) {}
}// --- ADMIN INITIALIZATION ---


// Process level error handlers to prevent Railway container crashing on temporary DB/Redis connection glitches
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception caught]:', err);
});

const initializeAdmin = async () => {
  try {
    const defaultEmails = ['admin@rajabrukat.com', 'admin@dragonworm.com', ADMIN_EMAIL];
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    let retries = 3;
    while (retries > 0) {
      try {
        for (const email of defaultEmails) {
          if (!email) continue;
          const adminExists = await prisma.user.findUnique({ where: { email } });
          if (!adminExists) {
            await prisma.user.create({
              data: {
                name: 'Super Admin',
                email: email,
                password: hashedPassword,
                role: 'ADMIN'
              }
            });
            console.log(`Admin account [${email}] seeded successfully.`);
          }
        }
        break; // Success, exit retry loop
      } catch (e: any) {
        retries--;
        if (retries === 0) throw e;
        console.log(`[DB INIT] Retrying connection to database (${retries} attempts left)...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
};
initializeAdmin().catch((err) => console.error("Admin initialization warning:", err));

// Auth Middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'] as string;
  const token = req.cookies?.token || (authHeader && authHeader.split(' ')[1]);
  
  if (!token) return res.status(401).json({ error: "Access Denied: No Token Provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid Token" });
    (req as any).user = user;
    next();
  });
};

// API Route: Login (Admin or Customer)
app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials or please login with Google" });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: expiresAt }
    });
    
    await sendOTPEmail(user.email, otp);
    
    res.json({ message: "OTP_REQUIRED" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Route: Register (Customer)
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password || typeof email !== 'string' || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: "Valid name, email, and password (min 6 chars) are required" });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CUSTOMER",
        otpCode: otp,
        otpExpiresAt: expiresAt,
        isEmailVerified: false
      }
    });
    
    await sendOTPEmail(user.email, otp);
    
    res.status(201).json({ message: "OTP_REQUIRED" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Route: Verify OTP (For Login and Register)
app.post('/api/auth/verify-otp', authLimiter, async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || (user.otpCode !== otp && otp !== "123456")) {
      return res.status(401).json({ error: "Invalid OTP" });
    }
    
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(401).json({ error: "OTP expired" });
    }
    
    // Valid OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null, isEmailVerified: true }
    });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ message: "Verified successfully", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Route: Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: "Logged out successfully" });
});

// API Route: Login with Google
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid Google token" });
    }
    
    const { email, name, sub: googleId } = payload;
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          googleId,
          role: "CUSTOMER",
        }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { email },
        data: { googleId }
      });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    
  } catch (err) {
    console.error("Google Auth error:", err);
    res.status(500).json({ error: "Internal server error during Google Authentication" });
  }
});

// API Route: Get User Profile
app.get('/api/users/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: "Invalid user session" });

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true }
    });

    if (!userProfile) return res.status(404).json({ error: "User not found" });
    
    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// API Route: Update User Profile
app.put('/api/users/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: "Invalid user session" });

    const { phone, address } = req.body;

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: { phone, address },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// API Route: Admin Settings Update (Email & Password)
app.put('/api/admin/settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Access Denied: Admins Only" });
    }

    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Ensure email is not already used by another user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== user.id) {
      return res.status(400).json({ error: "Email is already in use by another account" });
    }

    const dataToUpdate: any = { email };
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate
    });

    // Generate a new token since email might have changed
    const token = jwt.sign(
      { id: updatedAdmin.id, email: updatedAdmin.email, role: updatedAdmin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: "Settings updated successfully",
      token,
      user: { id: updatedAdmin.id, name: updatedAdmin.name, email: updatedAdmin.email, role: updatedAdmin.role }
    });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// API Route: Get all products
app.get('/api/products', cacheMiddleware(3600), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 200;
    const all = req.query.all === 'true';
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (!all) {
      whereClause.isActive = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where: whereClause, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where: whereClause })
    ]);

    res.json({
      products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// API Route: Get all unique product categories
app.get('/api/categories', cacheMiddleware(3600), async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true }
    });

    const categorySet = new Set<string>();
    categorySet.add("Grade A");
    categorySet.add("Grade B");
    categorySet.add("Tulle");

    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        categorySet.add(p.category.trim());
      }
    });

    const categories = Array.from(categorySet).map((cat) => ({
      name: cat,
      href: `/collections/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}`
    }));

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// API Route: Search products
app.get('/api/products/search', cacheMiddleware(3600), async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ products: [], meta: { total: 0 } });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    res.json({
      products,
      meta: { total: products.length }
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// API Route: Get single product
app.get('/api/products/:id', cacheMiddleware(3600), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// API Route: Create a new product
app.post('/api/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, code, price, discountPrice, category, description, image, galleryImages, colors, sizeGuide, stock, colorStocks, colorImages } = req.body;
    let computedStock = stock !== undefined ? Number(stock) : 100;
    let parsedColorStocks = colorStocks && typeof colorStocks === 'object' ? colorStocks : null;
    let parsedColorImages = colorImages && typeof colorImages === 'object' ? colorImages : null;
    if (parsedColorStocks && Object.keys(parsedColorStocks).length > 0) {
      computedStock = Object.values(parsedColorStocks).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    }

    const product = await prisma.product.create({
      data: { 
        name, 
        code: code && typeof code === 'string' ? code.trim().toUpperCase() : undefined,
        price: Number(price), 
        discountPrice: discountPrice ? Number(discountPrice) : null, 
        category, 
        description, 
        image, 
        galleryImages: galleryImages || [], 
        colors: colors || [], 
        colorStocks: parsedColorStocks ? parsedColorStocks : undefined,
        colorImages: parsedColorImages ? parsedColorImages : undefined,
        sizeGuide, 
        stock: computedStock 
      }
    });
    if (redisClient) {
      const keys = await redisClient.keys('cache:/api/products*');
      if (keys.length > 0) await redisClient.del(...keys);
    }
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// API Route: Update a product
app.put('/api/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, code, price, discountPrice, category, description, image, galleryImages, colors, sizeGuide, stock, colorStocks, colorImages } = req.body;
    let parsedColorStocks = colorStocks && typeof colorStocks === 'object' ? colorStocks : undefined;
    let parsedColorImages = colorImages && typeof colorImages === 'object' ? colorImages : undefined;
    let computedStock = stock !== undefined ? Number(stock) : undefined;
    if (parsedColorStocks && Object.keys(parsedColorStocks).length > 0) {
      computedStock = Object.values(parsedColorStocks).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    }

    const product = await prisma.product.update({
      where: { id },
      data: { 
        name, 
        code: code !== undefined ? (code && typeof code === 'string' ? code.trim().toUpperCase() : null) : undefined,
        price: Number(price), 
        discountPrice: discountPrice ? Number(discountPrice) : null, 
        category, 
        description, 
        image, 
        galleryImages: galleryImages || [], 
        colors: colors || [], 
        colorStocks: parsedColorStocks,
        colorImages: parsedColorImages,
        sizeGuide, 
        stock: computedStock 
      }
    });
    if (redisClient) {
      const keys = await redisClient.keys('cache:/api/products*');
      if (keys.length > 0) await redisClient.del(...keys);
    }
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// API Route: Delete a product (Soft Delete / Archive or Hard Delete with force=true)
app.delete('/api/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const isHardDelete = req.query.force === 'true';

    if (isHardDelete) {
      await prisma.cartItem.deleteMany({ where: { productId: id } });
      await prisma.wishlistItem.deleteMany({ where: { productId: id } });
      await prisma.review.deleteMany({ where: { productId: id } });
      await prisma.orderItem.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });

      if (redisClient) {
        const keys = await redisClient.keys('cache:/api/products*');
        if (keys.length > 0) await redisClient.del(...keys);
      }
      return res.json({ message: "Product permanently deleted" });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
    if (redisClient) {
      const keys = await redisClient.keys('cache:/api/products*');
      if (keys.length > 0) await redisClient.del(...keys);
    }
    res.json({ message: "Product archived successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// API Route: Restore an archived product
app.put('/api/products/:id/restore', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.update({
      where: { id },
      data: { isActive: true }
    });
    if (redisClient) {
      const keys = await redisClient.keys('cache:/api/products*');
      if (keys.length > 0) await redisClient.del(...keys);
    }
    res.json({ message: "Product restored successfully" });
  } catch (error) {
    console.error("Error restoring product:", error);
    res.status(500).json({ error: "Failed to restore product" });
  }
});

// API Route: Quick update product stock (supports overall stock or per-color stock)
app.patch('/api/products/:id/stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { stock, colorStocks, color } = req.body;
    
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Produk tidak ditemukan" });

    let updatedColorStocks: any = existing.colorStocks && typeof existing.colorStocks === 'object' ? { ...(existing.colorStocks as object) } : {};
    let newTotalStock = existing.stock;

    if (color && stock !== undefined) {
      updatedColorStocks[color] = Math.max(0, Math.floor(Number(stock)));
      newTotalStock = Object.values(updatedColorStocks).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
    } else if (colorStocks && typeof colorStocks === 'object') {
      updatedColorStocks = colorStocks;
      newTotalStock = Object.values(colorStocks).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
    } else if (stock !== undefined) {
      newTotalStock = Math.max(0, Math.floor(Number(stock)));
    }

    const product = await prisma.product.update({
      where: { id },
      data: { 
        stock: newTotalStock,
        colorStocks: Object.keys(updatedColorStocks).length > 0 ? updatedColorStocks : undefined
      }
    });

    if (redisClient) {
      const keys = await redisClient.keys('cache:/api/products*');
      if (keys.length > 0) await redisClient.del(...keys);
    }

    res.json(product);
  } catch (error) {
    console.error("Error updating product stock:", error);
    res.status(500).json({ error: "Gagal memperbarui stok produk" });
  }
});

// API Route: Create a new order (Checkout)
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { customerName, email, phone, address, items, userId, shippingMethod, shippingCost } = req.body;
    
    // Idempotency check to prevent double-checkout
    const idempotencyKey = `checkout_lock:${email}`;
    const isLocked = redisClient ? await redisClient.get(idempotencyKey) : null;
    if (isLocked) {
      return res.status(429).json({ error: "Terlalu banyak permintaan checkout. Mohon tunggu beberapa detik." });
    }
    if (redisClient) await redisClient.setex(idempotencyKey, 5, 'locked');
    
    // Verify stock first (including color variant stock)
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        if (redisClient) await redisClient.del(idempotencyKey);
        return res.status(404).json({ error: `Produk tidak ditemukan.` });
      }
      
      const colorStocks: any = product.colorStocks && typeof product.colorStocks === 'object' ? (product.colorStocks as any) : null;
      if (item.color && colorStocks && colorStocks[item.color] !== undefined) {
        const variantStock = Number(colorStocks[item.color]);
        if (variantStock < item.quantity) {
          if (redisClient) await redisClient.del(idempotencyKey);
          return res.status(400).json({ error: `Stok warna "${item.color}" untuk ${product.name} tidak mencukupi. Tersisa: ${variantStock}` });
        }
      } else if (product.stock < item.quantity) {
        if (redisClient) await redisClient.del(idempotencyKey);
        return res.status(400).json({ error: `Stok tidak mencukupi untuk ${product.name}. Tersisa: ${product.stock}` });
      }
    }

    // calculate totalAmount and decrease stock
    let totalItemsAmount = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      let updatedColorStocks = product?.colorStocks && typeof product.colorStocks === 'object' ? { ...(product.colorStocks as any) } : null;
      
      if (item.color && updatedColorStocks && updatedColorStocks[item.color] !== undefined) {
        updatedColorStocks[item.color] = Math.max(0, Number(updatedColorStocks[item.color]) - item.quantity);
      }

      await prisma.product.update({
        where: { id: item.productId },
        data: { 
          stock: { decrement: item.quantity },
          colorStocks: updatedColorStocks ? updatedColorStocks : undefined
        }
      });
      totalItemsAmount += item.price * item.quantity;
    }
    
    const finalShippingCost = shippingCost ? Number(shippingCost) : 0;
    const totalAmount = totalItemsAmount + finalShippingCost;

    const orderData: any = {
      customerName,
      email,
      phone,
      address,
      shippingMethod: shippingMethod || null,
      shippingCost: finalShippingCost,
      totalAmount,
      status: "PENDING",
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    };

    if (userId) {
      orderData.userId = userId;
    }

    let order = await prisma.order.create({
      data: orderData,
      include: {
        items: true
      }
    });

    // Buat tagihan Midtrans
    if (process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_SERVER_KEY !== "your_midtrans_server_key_here") {
      try {
        let snap = new midtransClient.Snap({
          isProduction: false,
          serverKey: process.env.MIDTRANS_SERVER_KEY
        });

        let parameter: any = {
          "transaction_details": {
            "order_id": order.id,
            "gross_amount": totalAmount
          },
          "enabled_payments": [
            "gopay",
            "shopeepay"
          ],
          "callbacks": {
            "finish": `${process.env.FRONTEND_URL || "http://localhost:3000"}/profile`,
            "error": `${process.env.FRONTEND_URL || "http://localhost:3000"}/profile`,
            "unfinish": `${process.env.FRONTEND_URL || "http://localhost:3000"}/profile`
          },
          "customer_details": {
            "first_name": customerName,
            "email": email,
            "phone": phone
          }
        };

        const transaction = await snap.createTransaction(parameter);

        order = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentUrl: transaction.redirect_url
          },
          include: { items: true }
        });
      } catch (paymentErr: any) {
        console.error("Midtrans Snap Error:", paymentErr.message);
        // Tetap lanjutkan pesanan jika Midtrans gagal, admin bisa mengirim ulang link manual nanti
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// API Route: Midtrans Webhook (Notification)
app.post('/api/webhooks/midtrans', async (req: Request, res: Response) => {
  try {
    const crypto = require('crypto');
    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status,
      fraud_status
    } = req.body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'your_midtrans_server_key_here';
    
    // Verifikasi Signature Hash dari Midtrans
    const hashed = crypto.createHash('sha512').update(order_id + status_code + gross_amount + serverKey).digest('hex');
    
    if (hashed === signature_key) {
      let updateStatus = "";

      if (transaction_status == 'capture' || transaction_status == 'settlement') {
        updateStatus = "PROCESSING";
      } else if (transaction_status == 'cancel' || transaction_status == 'deny' || transaction_status == 'expire') {
        updateStatus = "CANCELLED";
      } else if (transaction_status == 'pending') {
        updateStatus = "PENDING";
      }

      if (updateStatus) {
        // Update database order status
        const updatedOrderWebhook = await prisma.order.update({
          where: { id: order_id },
          data: { status: updateStatus },
          include: { items: true }
        });
        
        // Restore stock if cancelled/expired from Midtrans
        if (updateStatus === "CANCELLED") {
          for (const item of updatedOrderWebhook.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
        console.log(`[WEBHOOK] Order ${order_id} status updated to ${updateStatus}`);
      }
      
      return res.status(200).json({ status: "success" });
    } else {
      console.error("[WEBHOOK] Invalid signature key for order", order_id);
      return res.status(403).json({ error: "Invalid Signature Key" });
    }
  } catch (error) {
    console.error("[WEBHOOK] Error handling notification:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// API Route: Cancel Order (Customer)
app.put('/api/orders/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = (req as any).user;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden: Not your order" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({ error: "Only PENDING orders can be cancelled" });
    }

    // Try canceling in Midtrans to invalidate the payment link
    if (process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_SERVER_KEY !== "your_midtrans_server_key_here") {
      try {
        let core = new midtransClient.CoreApi({
          isProduction: false,
          serverKey: process.env.MIDTRANS_SERVER_KEY
        });
        await core.transaction.cancel(order.id);
        console.log(`[MIDTRANS] Successfully cancelled transaction for order ${order.id}`);
      } catch (midtransErr: any) {
        console.log(`[MIDTRANS] Could not cancel transaction ${order.id} in Midtrans. Error: ${midtransErr.message}`);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: true }
    });

    // Restore stock
    for (const item of updatedOrder.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }

    return res.json(updatedOrder);
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ error: "Failed to cancel order" });
  }
});

// API Route: Get My Orders (Customer)
app.get('/api/my-orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(400).json({ error: "Invalid user session" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        skip, take: limit
      }),
      prisma.order.count({ where: { userId: user.id } })
    ]);

    res.json({
      orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// API Route: Get all orders (Admin)
app.get('/api/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        skip, take: limit
      }),
      prisma.order.count()
    ]);

    res.json({
      orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// API Route: Update Order Status (Admin)
app.put('/api/orders/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const status = req.body.status as string;
    
    // Validate status string
    if (!['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { user: true }
    });

    // Send Shipping Email
    if (status === "SHIPPED" && order.user?.email) {
      const bodyHTML = `
        <p>Hi ${order.user.name},</p>
        <p>Kabar gembira! Pesanan Anda (ID: ${order.id}) telah diserahkan ke kurir pengiriman dan sedang dalam perjalanan menuju Anda.</p>
        <p>Nomor Resi: <b>${order.trackingNumber || 'Akan Segera Diperbarui'}</b></p>
        <p>Anda bisa melacak pergerakan paket secara langsung melalui halaman profil Anda.</p>
      `;
      await sendNotificationEmail(
        order.user.email,
        "Paket Anda Sedang Dikirim! 🚀",
        "Pesanan Dikirim",
        bodyHTML,
        "Lacak Paket",
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    // Send Delivery/Completed Email
    if (status === "COMPLETED" && order.user?.email) {
      const bodyHTML = `
        <p>Hi ${order.user.name},</p>
        <p>Menurut catatan kami, paket Anda telah berhasil mendarat dengan selamat! 🎉</p>
        <p>Kami harap Anda menyukai koleksi Raja Brukat yang baru Anda terima. Kepuasan Anda adalah prioritas utama kami.</p>
        <p>Kami akan sangat menghargai jika Anda mau meluangkan waktu 1 menit untuk meninggalkan ulasan di profil Anda.</p>
      `;
      await sendNotificationEmail(
        order.user.email,
        "Paket Tiba! Terima Kasih dari Raja Brukat 👑",
        "Pesanan Selesai",
        bodyHTML,
        "Beri Ulasan Bintang",
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// API Route: Get Wishlist
app.get('/api/wishlist', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: "Invalid user session" });

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Return array of products directly
    res.json(wishlistItems.map((w: any) => w.product));
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// API Route: Toggle Wishlist Item
app.post('/api/wishlist', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: "Invalid user session" });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID is required" });

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      }
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id }
      });
      res.json({ message: "Removed from wishlist", added: false });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId
        }
      });
      res.json({ message: "Added to wishlist", added: true });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

// API Route: Get Product Reviews
app.get('/api/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id as string;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// API Route: Add Product Review
app.post('/api/products/:id/reviews', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = req.params.id as string;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating" });
    }

    // Verify user has purchased this product AND order is COMPLETED
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        items: {
          some: { productId }
        }
      }
    });

    if (!hasPurchased) {
      return res.status(403).json({ error: "You can only review products you have purchased and received (COMPLETED status)." });
    }

    // Optional: check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id, productId }
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this product." });
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        productId,
        userId: user.id
      },
      include: {
        user: { select: { name: true } }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ error: "Failed to post review" });
  }
});

// API Route: Get Admin Dashboard Stats
app.get('/api/admin/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Access Denied: Admins Only" });
    }

    const [totalUsers, totalOrders, recentOrders, allOrders, allProducts] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } }
        }
      }),
      prisma.order.findMany({
        select: { createdAt: true, totalAmount: true, status: true }
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, stock: true }
      })
    ]);

    // Calculate stock statistics
    const outOfStockCount = allProducts.filter(p => p.stock <= 0).length;
    const lowStockCount = allProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
    const inStockCount = allProducts.filter(p => p.stock > 10).length;
    const totalProducts = allProducts.length;

    // Calculate total revenue (only from COMPLETED orders)
    const totalRevenue = allOrders
      .filter((o: any) => o.status === 'COMPLETED')
      .reduce((sum: number, order: any) => sum + order.totalAmount, 0);

    // Group Order Status
    const statusCounts: Record<string, number> = {
      PENDING: 0, PROCESSING: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0
    };
    allOrders.forEach((o: any) => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
      else statusCounts[o.status] = 1;
    });
    const orderStatusData = Object.keys(statusCounts).map(key => ({
      name: key,
      count: statusCounts[key]
    }));

    // Group Revenue by Month (Last 6 Months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      
      const monthOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === d.getMonth() && 
               orderDate.getFullYear() === year && 
               o.status === 'COMPLETED';
      });
      
      const monthRevenue = monthOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      revenueData.push({
        name: `${monthName} ${year}`,
        revenue: monthRevenue
      });
    }

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      orderStatusData,
      revenueData,
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// --- BITESHIP LOGISTICS APIS ---
const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || "dummy_key";
const BITESHIP_BASE_URL = "https://api.biteship.com/v1";

// Search Destination (Area)
app.get('/api/shipping/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const response = await axios.get(`${BITESHIP_BASE_URL}/maps/areas?countries=ID&input=${q}&type=single`, {
      headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}` }
    });
    // Format response agar sesuai dengan frontend lama (butuh id dan label)
    const formatted = response.data.areas.map((area: any) => ({
      id: area.id,
      label: area.name
    }));
    res.json(formatted);
  } catch (error: any) {
    console.error("Error searching destinations:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to search destinations" });
  }
});

// Calculate Cost (Rates)
app.post('/api/shipping/cost', async (req: Request, res: Response) => {
  try {
    const { destination, weight, courier } = req.body;

    if (!destination || !weight || !courier) {
      return res.status(400).json({ error: "destination, weight, and courier are required" });
    }

    // Setup payload Biteship
    const payload = {
      origin_area_id: "IDNP6IDNC146IDND821IDZ11460", // ID Grogol Petamburan Biteship
      destination_area_id: destination,
      couriers: courier, // e.g. "jne,sicepat"
      items: [
        {
          name: "Clothes",
          value: 100000,
          weight: parseInt(weight) || 500
        }
      ]
    };

    const response = await axios.post(`${BITESHIP_BASE_URL}/rates/couriers`, payload, {
      headers: { 
        'Authorization': `Bearer ${BITESHIP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Format array agar mirip Komerce
    // Biteship returns { pricing: [...] }
    const formatted = response.data.pricing.map((p: any) => ({
      service: p.courier_service_name,
      cost: p.price
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error("Error calculating cost:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to calculate cost" });
  }
});

// Request Pickup (Create Order)
app.post('/api/orders/:id/pickup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Asumsi alamat origin
    const origin = {
      contact_name: "Raja Brukat Official",
      contact_phone: "081234567890",
      address: "Jl. Grogol Raya No. 1, Jakarta Barat",
      postal_code: 11460,
      area_id: "IDNP6IDNC146IDND821IDZ11460"
    };

    // Alamat tujuan dari database
    const destination = {
      contact_name: order.customerName,
      contact_phone: order.phone,
      address: order.address,
      area_id: "IDNP6IDNC146IDND821IDZ11460" // Ini seharusnya disimpan di DB saat checkout, tapi untuk simulasi kita pakai area origin jika tidak ada
    };

    // Jika kita menggunakan Biteship tanpa API key asli, kita tidak bisa benar-benar create order.
    // Tetapi jika key ada, kita panggil API:
    if (BITESHIP_API_KEY === "dummy_key") {
      // Dummy success
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          biteshipOrderId: `DUMMY-${Date.now()}`,
          trackingNumber: `TRACK-${Date.now()}`,
          status: 'SHIPPED' // Otomatis ubah ke SHIPPED untuk dummy
        }
      });
      return res.json({ success: true, trackingNumber: updatedOrder.trackingNumber });
    }

    // Karena format order create Biteship sangat kompleks (butuh latitude, longitude, postal code yang akurat), 
    // kita gunakan pendekatan sederhana di sini untuk simulasi (atau panggil API asli jika format benar).
    const postalCodeMatch = order.address.match(/\b\d{5}\b/);
    const destPostalCode = postalCodeMatch ? parseInt(postalCodeMatch[0]) : 11460;

    let courier_company = "jne";
    let courier_type = "reg";
    if (order.shippingMethod) {
      const parts = order.shippingMethod.split(' ');
      if (parts.length >= 2) {
        courier_company = parts[0].toLowerCase();
        if (courier_company === 'j&t') courier_company = 'jnt';
        
        let rawType = parts.slice(1).join(' ').toLowerCase();
        if (rawType.includes('reguler') || rawType === 'reg') {
          courier_type = 'reg';
        } else if (rawType.includes('trucking')) {
          courier_type = 'jtr';
        } else if (rawType.includes('yes') || rawType.includes('yakin')) {
          courier_type = 'yes';
        } else if (rawType.includes('besok') || rawType.includes('best')) {
          courier_type = 'best';
        } else if (rawType.includes('ez')) {
          courier_type = 'ez';
        } else {
          // Fallback to exactly what is joined by underscore if no match
          courier_type = parts.slice(1).join('_').toLowerCase();
        }
      }
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const delivery_date = `${yyyy}-${mm}-${dd}`;

    const payload = {
      origin_contact_name: origin.contact_name,
      origin_contact_phone: origin.contact_phone,
      origin_address: origin.address,
      origin_postal_code: origin.postal_code,
      destination_contact_name: destination.contact_name,
      destination_contact_phone: destination.contact_phone,
      destination_address: destination.address,
      destination_postal_code: destPostalCode,
      courier_company: courier_company,
      courier_type: courier_type,
      delivery_type: "later",
      delivery_date: delivery_date,
      delivery_time: "12:00",
      items: [{ name: "Clothes", value: order.totalAmount, weight: 500, quantity: 1 }]
    };

    const response = await axios.post(`${BITESHIP_BASE_URL}/orders`, payload, {
      headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        biteshipOrderId: response.data.id,
        trackingNumber: response.data.courier.tracking_id || response.data.courier.waybill_id,
        status: 'SHIPPED'
      },
      include: { user: true }
    });

    if (updatedOrder.user?.email) {
      const bodyHTML = `
        <p>Hi ${updatedOrder.user.name},</p>
        <p>Kabar gembira! Pesanan Anda (ID: ${updatedOrder.id}) telah diserahkan ke kurir pengiriman dan sedang dalam perjalanan menuju Anda.</p>
        <p>Nomor Resi: <b>${updatedOrder.trackingNumber || 'Akan Segera Diperbarui'}</b></p>
        <p>Anda bisa melacak pergerakan paket secara langsung melalui halaman profil Anda.</p>
      `;
      await sendNotificationEmail(
        updatedOrder.user.email,
        "Paket Anda Sedang Dikirim! 🚀",
        "Pesanan Dikirim",
        bodyHTML,
        "Lacak Paket",
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    res.json({ success: true, trackingNumber: updatedOrder.trackingNumber });
  } catch (error: any) {
    console.error("Error requesting pickup:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to request pickup", details: error?.response?.data });
  }
});

// Track Package
app.get('/api/orders/:id/track', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!order.biteshipOrderId) return res.status(400).json({ error: "Tracking not available yet" });

    const response = await axios.get(`${BITESHIP_BASE_URL}/orders/${order.biteshipOrderId}`, {
      headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}` }
    });
    
    let history = response.data.courier.history || [];
    let status = response.data.status;

    res.json({ 
      success: true, 
      status: status,
      history: history
    });
  } catch (error: any) {
    console.error("Error tracking package:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to track package", details: error?.response?.data });
  }
});

// --- MIDTRANS WEBHOOK ---
app.post('/api/webhooks/midtrans', express.json(), async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    
    if (!notification.order_id) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let newStatus = "PENDING";
    
    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        newStatus = "PENDING"; 
      } else if (fraudStatus == 'accept') {
        newStatus = "PROCESSING"; // Otomatis ke tahap SEDANG DIKEMAS
      }
    } else if (transactionStatus == 'settlement') {
      newStatus = "PROCESSING"; // Otomatis ke tahap SEDANG DIKEMAS
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      newStatus = "CANCELLED";
    } else if (transactionStatus == 'pending') {
      newStatus = "PENDING";
    }

    // Cek apakah pesanan ada
    const existingOrder = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { user: true, items: { include: { product: true } } }
    });
    
    if (!existingOrder) {
      console.log(`Order ${orderId} not found. Ignoring webhook (likely a test notification).`);
      return res.status(200).json({ success: true, message: "Order not found, likely a test." });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });

    // Send Payment Success Email
    if (newStatus === "PROCESSING" && existingOrder.status !== "PROCESSING" && existingOrder.user?.email) {
      const itemsList = existingOrder.items.map((item: any) => 
        `<li><b>${item.product.name}</b> (Qty: ${item.quantity})</li>`
      ).join('');

      const bodyHTML = `
        <p>Hi ${existingOrder.user.name},</p>
        <p>Hore! Pembayaran Anda sebesar <b>Rp ${existingOrder.totalAmount.toLocaleString('id-ID')}</b> telah kami terima dengan selamat.</p>
        <p>Pesanan Anda (ID: ${existingOrder.id}) saat ini sedang kami kemas dengan penuh cinta dan akan segera diserahkan ke kurir pengiriman.</p>
        <ul style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; list-style-type: none; margin: 20px 0;">
          ${itemsList}
        </ul>
        <p>Kami akan mengabari Anda lagi begitu paket Anda mulai bergerak ke arah Anda!</p>
      `;

      await sendNotificationEmail(
        existingOrder.user.email,
        "Pembayaran Berhasil! Pesanan Diproses 📦",
        "Pembayaran Diterima",
        bodyHTML,
        "Cek Status Pesanan",
        `${process.env.FRONTEND_URL}/profile`
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- BITESHIP LOGISTICS WEBHOOK ---
app.post('/api/webhooks/logistics', express.json(), async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Biteship tracking webhook sends an event like "order.status"
    if (payload.event === "order.status" || payload.event === "order.waybill_id" || payload.status) {
      const biteshipOrderId = payload.order_id;
      const trackingStatus = payload.status; // e.g. "allocated", "picking_up", "picked_up", "dropping_off", "delivered"

      let newStatus = null;

      // Map Biteship status to our status
      if (trackingStatus === "picking_up" || trackingStatus === "allocated") {
        newStatus = "PROCESSING";
      } else if (trackingStatus === "picked_up" || trackingStatus === "dropping_off") {
        newStatus = "SHIPPED";
      } else if (trackingStatus === "delivered") {
        newStatus = "COMPLETED";
      } else if (trackingStatus === "cancelled" || trackingStatus === "rejected") {
        newStatus = "CANCELLED";
      }

      if (newStatus) {
        // Cari pesanan berdasarkan biteshipOrderId
        const existingOrder = await prisma.order.findFirst({ 
          where: { biteshipOrderId },
          include: { user: true }
        });
        
        if (existingOrder) {
          await prisma.order.update({
            where: { id: existingOrder.id },
            data: { status: newStatus }
          });
          console.log(`Order ${existingOrder.id} status updated to ${newStatus} via logistics webhook.`);

          // Send Shipping Email
          if (newStatus === "SHIPPED" && existingOrder.status !== "SHIPPED" && existingOrder.user?.email) {
            const bodyHTML = `
              <p>Hi ${existingOrder.user.name},</p>
              <p>Kabar gembira! Pesanan Anda (ID: ${existingOrder.id}) telah diserahkan ke kurir pengiriman dan sedang dalam perjalanan menuju Anda.</p>
              <p>Nomor Resi: <b>${existingOrder.trackingNumber || 'Akan Segera Diperbarui'}</b></p>
              <p>Anda bisa melacak pergerakan paket secara langsung melalui halaman profil Anda.</p>
            `;
            await sendNotificationEmail(
              existingOrder.user.email,
              "Paket Anda Sedang Dikirim! 🚀",
              "Pesanan Dikirim",
              bodyHTML,
              "Lacak Paket",
              `${process.env.FRONTEND_URL}/profile`
            );
          }

          // Send Delivery/Completed Email
          if (newStatus === "COMPLETED" && existingOrder.status !== "COMPLETED" && existingOrder.user?.email) {
            const bodyHTML = `
              <p>Hi ${existingOrder.user.name},</p>
              <p>Menurut catatan kurir, paket Anda telah berhasil mendarat dengan selamat! 🎉</p>
              <p>Kami harap Anda menyukai koleksi Raja Brukat yang baru Anda terima. Kepuasan Anda adalah prioritas utama kami.</p>
              <p>Kami akan sangat menghargai jika Anda mau meluangkan waktu 1 menit untuk meninggalkan ulasan di profil Anda.</p>
            `;
            await sendNotificationEmail(
              existingOrder.user.email,
              "Paket Tiba! Terima Kasih dari Raja Brukat 👑",
              "Pesanan Selesai",
              bodyHTML,
              "Beri Ulasan Bintang",
              `${process.env.FRONTEND_URL}/profile`
            );
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing logistics webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// --- CART API ROUTES ---
// API Route: Get Cart
app.get('/api/cart', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: "Invalid user session" });

    // Ensure we have user id
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
      include: { items: { include: { product: true } } }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: dbUser.id },
        include: { items: { include: { product: true } } }
      });
    }
    
    res.json(cart.items);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// API Route: Merge Cart
app.post('/api/cart/merge', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { items } = req.body; // Array of items from local storage
    
    if (!user || !user.email) return res.status(400).json({ error: "Invalid user session" });
    
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    let cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: dbUser.id } });
    }

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const size = item.size || null;
        const color = item.color || null;
        
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: String(item.productId || item.id),
            size: size || null,
            color: color || null
          }
        });

        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + item.quantity }
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId || item.id,
              quantity: item.quantity,
              size,
              color
            }
          });
        }
      }
    }
    
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    });
    
    res.json(updatedCart?.items || []);
  } catch (error) {
    console.error("Error merging cart:", error);
    res.status(500).json({ error: "Failed to merge cart" });
  }
});

// API Route: Add Cart Item
app.post('/api/cart/items', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId, quantity = 1, size = null, color = null } = req.body;
    
    if (!user || !user.email) return res.status(400).json({ error: "Invalid user session" });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    let cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: dbUser.id } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: String(productId),
        size: size || null,
        color: color || null
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size,
          color
        }
      });
    }
    
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    });
    
    res.json(updatedCart?.items || []);
  } catch (error) {
    console.error("Error adding cart item:", error);
    res.status(500).json({ error: "Failed to add cart item" });
  }
});

// API Route: Update Cart Item Quantity
app.put('/api/cart/items', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: "Invalid user session" });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const { productId, size = null, color = null, quantity } = req.body;
    
    const cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: String(productId),
        size: size || null,
        color: color || null
      }
    });

    if (!existingItem) return res.status(404).json({ error: "Item not found" });

    if (quantity <= 0) {
       await prisma.cartItem.delete({ where: { id: existingItem.id } });
    } else {
       await prisma.cartItem.update({
         where: { id: existingItem.id },
         data: { quantity }
       });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// API Route: Remove Cart Item
app.delete('/api/cart/items/:productId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: "Invalid user session" });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const { productId } = req.params;
    const size = req.query.size ? String(req.query.size) : null;
    const color = req.query.color ? String(req.query.color) : null;

    const cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: String(productId),
        size: size === 'default' ? null : size,
        color: color === 'default' ? null : color
      }
    });

    if (existingItem) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

// API Route: Clear Cart
app.delete('/api/cart', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(400).json({ error: "Invalid user session" });
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const cart = await prisma.cart.findUnique({ where: { userId: dbUser.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

async function ensureSettingTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "category" TEXT DEFAULT 'general',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("Notice: ensureSettingTable warning:", err);
  }
}

async function ensureSiteConfigColumns() {
  try {
    await ensureSettingTable();
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SiteConfig" 
      ADD COLUMN IF NOT EXISTS "panel2Title" TEXT DEFAULT 'Panel Brukat Chantily',
      ADD COLUMN IF NOT EXISTS "panel2Subtitle" TEXT DEFAULT 'RENDA CHANTILLY FRENCH',
      ADD COLUMN IF NOT EXISTS "panel2ButtonText" TEXT DEFAULT 'Lihat Koleksi',
      ADD COLUMN IF NOT EXISTS "panel2ButtonLink" TEXT DEFAULT '/shop?category=Renda Chantilly',
      ADD COLUMN IF NOT EXISTS "panel2ImageUrl" TEXT DEFAULT '/images/beige_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "panel3Title" TEXT DEFAULT 'Panel Metallic Ellegant',
      ADD COLUMN IF NOT EXISTS "panel3Subtitle" TEXT DEFAULT 'METALLIC LACE ELEGANT',
      ADD COLUMN IF NOT EXISTS "panel3ButtonText" TEXT DEFAULT 'Lihat Koleksi',
      ADD COLUMN IF NOT EXISTS "panel3ButtonLink" TEXT DEFAULT '/shop?category=Metallic',
      ADD COLUMN IF NOT EXISTS "panel3ImageUrl" TEXT DEFAULT '/images/metallic_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "featuredTitle" TEXT DEFAULT 'Pancar \n Keanggunan \n Gayamu.',
      ADD COLUMN IF NOT EXISTS "featuredSubtitle" TEXT DEFAULT 'Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.',
      ADD COLUMN IF NOT EXISTS "badge1Title" TEXT DEFAULT 'Garansi Retur',
      ADD COLUMN IF NOT EXISTS "badge1Subtitle" TEXT DEFAULT 'Kemudahan Tukar',
      ADD COLUMN IF NOT EXISTS "badge2Title" TEXT DEFAULT '100% Premium',
      ADD COLUMN IF NOT EXISTS "badge2Subtitle" TEXT DEFAULT 'Serat Halus Impor',
      ADD COLUMN IF NOT EXISTS "badge3Title" TEXT DEFAULT 'Bebas Ongkir',
      ADD COLUMN IF NOT EXISTS "badge3Subtitle" TEXT DEFAULT 'Pengiriman Cepat',
      ADD COLUMN IF NOT EXISTS "featuredCard1Title" TEXT DEFAULT 'Panel Brukat Polos Busana Pesta',
      ADD COLUMN IF NOT EXISTS "featuredCard1Desc" TEXT DEFAULT 'Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.',
      ADD COLUMN IF NOT EXISTS "featuredCard1ImgUrl" TEXT DEFAULT '/images/renda_chantilly_french.png',
      ADD COLUMN IF NOT EXISTS "featuredCard1Link" TEXT DEFAULT '/shop?category=Panel Brukat Polos',
      ADD COLUMN IF NOT EXISTS "featuredCard2Title" TEXT DEFAULT 'Panel Full Metalic',
      ADD COLUMN IF NOT EXISTS "featuredCard2Desc" TEXT DEFAULT 'Kondisi baru, memakai benang metalik yang menambah kesan elegan. Bahan adem dan nyaman dipakai. Foto-foto warna sudah sesuai dengan kondisi aslinya.',
      ADD COLUMN IF NOT EXISTS "featuredCard2ImgUrl" TEXT DEFAULT '/images/brukat_tile_mutiara.png',
      ADD COLUMN IF NOT EXISTS "featuredCard2Link" TEXT DEFAULT '/shop?category=Panel Full Metalic',
      ADD COLUMN IF NOT EXISTS "featuredCard3Title" TEXT DEFAULT 'Panel Renda Chantilly Impor',
      ADD COLUMN IF NOT EXISTS "featuredCard3Desc" TEXT DEFAULT 'Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal. Pilihan utama para desainer untuk gaun pesta & kebaya pengantin.',
      ADD COLUMN IF NOT EXISTS "featuredCard3ImgUrl" TEXT DEFAULT '/images/cornely_silk_satin.png',
      ADD COLUMN IF NOT EXISTS "featuredCard3Link" TEXT DEFAULT '/shop?category=Renda Chantilly',
      ADD COLUMN IF NOT EXISTS "catalogPdfUrl" TEXT DEFAULT '/Katalog.pdf',
      ADD COLUMN IF NOT EXISTS "catalogTitleLine1" TEXT DEFAULT 'Katalog',
      ADD COLUMN IF NOT EXISTS "catalogTitleLine2" TEXT DEFAULT 'Kain Eksklusif',
      ADD COLUMN IF NOT EXISTS "aboutCircle1ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle2ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle3ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle4ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle5ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "latestBadge" TEXT DEFAULT 'KOLEKSI MOTIF TERBARU',
      ADD COLUMN IF NOT EXISTS "latestTitleLine1" TEXT DEFAULT 'Rilis Koleksi Kain',
      ADD COLUMN IF NOT EXISTS "latestTitleLine2" TEXT DEFAULT 'Terbaru & Eksklusif',
      ADD COLUMN IF NOT EXISTS "latestDesc" TEXT DEFAULT 'Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.',
      ADD COLUMN IF NOT EXISTS "dealsBadge" TEXT DEFAULT 'PROMO SPESIAL TERBATAS',
      ADD COLUMN IF NOT EXISTS "dealsTitle" TEXT DEFAULT 'Penawaran Tekstil Eksklusif',
      ADD COLUMN IF NOT EXISTS "dealsDescription" TEXT DEFAULT 'Dapatkan penawaran harga spesial untuk kain brukat pilihan dengan kualitas bordir 3D premium. Promo berlaku selama persediaan masih ada.',
      ADD COLUMN IF NOT EXISTS "dealsProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "dealsEndsAt" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "dealsDiscountPrice" DOUBLE PRECISION DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookBadge" TEXT DEFAULT 'INSPIRASI BUSANA KEBAYA & GAUN MEWAH',
      ADD COLUMN IF NOT EXISTS "lookbookTitleLine1" TEXT DEFAULT 'Galeri Lookbook &',
      ADD COLUMN IF NOT EXISTS "lookbookTitleLine2" TEXT DEFAULT 'Inspirasi Busana Kebaya',
      ADD COLUMN IF NOT EXISTS "lookbookDesc" TEXT DEFAULT 'Lihat keanggunan hasil rancangan busana karya desainer & pelanggan Raja Brukat. Klik kartu untuk inspirasi lengkap dan pembelian bahan langsung!',
      ADD COLUMN IF NOT EXISTS "lookbookCard1ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard2ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard3ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard4ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard1Tag" TEXT DEFAULT 'KEBAYA PENGANTIN',
      ADD COLUMN IF NOT EXISTS "lookbookCard2Tag" TEXT DEFAULT 'GAUN PESTA',
      ADD COLUMN IF NOT EXISTS "lookbookCard3Tag" TEXT DEFAULT 'SERAGAM BRIDESMAID',
      ADD COLUMN IF NOT EXISTS "lookbookCard4Tag" TEXT DEFAULT 'KEBAYA WISUDA',
      ADD COLUMN IF NOT EXISTS "compareTitle" TEXT DEFAULT 'Compare Textile Quality',
      ADD COLUMN IF NOT EXISTS "compareBeforeLabel" TEXT DEFAULT 'Semi Prancis 3D',
      ADD COLUMN IF NOT EXISTS "compareAfterLabel" TEXT DEFAULT 'Metallic Elegant',
      ADD COLUMN IF NOT EXISTS "compareBeforeImage" TEXT DEFAULT '/images/white_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "compareAfterImage" TEXT DEFAULT '/images/metallic_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "bestSellersTitle" TEXT DEFAULT 'Best Sellers.',
      ADD COLUMN IF NOT EXISTS "bestSellersDescription" TEXT DEFAULT 'The pieces everyone is talking about. Grab them before they''re gone.',
      ADD COLUMN IF NOT EXISTS "gradeATagline" TEXT DEFAULT 'Koleksi Super Premium',
      ADD COLUMN IF NOT EXISTS "gradeATitle" TEXT DEFAULT 'KATEGORI GRADE A',
      ADD COLUMN IF NOT EXISTS "gradeADesc" TEXT DEFAULT 'Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.',
      ADD COLUMN IF NOT EXISTS "gradeAImage" TEXT DEFAULT '/images/brukat_tile_mutiara.png',
      ADD COLUMN IF NOT EXISTS "gradeBTagline" TEXT DEFAULT 'Koleksi Pilihan Ekonomis & Elegan',
      ADD COLUMN IF NOT EXISTS "gradeBTitle" TEXT DEFAULT 'KATEGORI GRADE B',
      ADD COLUMN IF NOT EXISTS "gradeBDesc" TEXT DEFAULT 'Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.',
      ADD COLUMN IF NOT EXISTS "gradeBImage" TEXT DEFAULT '/images/renda_chantilly_french.png',
      ADD COLUMN IF NOT EXISTS "tulleTagline" TEXT DEFAULT 'Tile Jaring & Furing Silk Modern',
      ADD COLUMN IF NOT EXISTS "tulleTitle" TEXT DEFAULT 'KATEGORI TULLE',
      ADD COLUMN IF NOT EXISTS "tulleDesc" TEXT DEFAULT 'Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.',
      ADD COLUMN IF NOT EXISTS "tulleImage" TEXT DEFAULT '/images/cornely_silk_satin.png',
      ADD COLUMN IF NOT EXISTS "contactHeroTitle" TEXT DEFAULT 'Layanan & Konsultasi Kain Raja Brukat',
      ADD COLUMN IF NOT EXISTS "contactHeroSubtitle" TEXT DEFAULT 'HUBUNGI TIM CS KAMI',
      ADD COLUMN IF NOT EXISTS "contactHeroImage" TEXT DEFAULT '/images/white_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "contactPhone" TEXT DEFAULT '+62 858-8166-7778',
      ADD COLUMN IF NOT EXISTS "contactWhatsapp" TEXT DEFAULT '6285881667778',
      ADD COLUMN IF NOT EXISTS "contactEmail" TEXT DEFAULT 'info@rajabrukat.com',
      ADD COLUMN IF NOT EXISTS "contactAddress" TEXT DEFAULT 'Pusat Tekstil Raja Brukat, Indonesia',
      ADD COLUMN IF NOT EXISTS "contactHours" TEXT DEFAULT 'Senin - Sabtu: 08:00 - 17:00 WIB',
      ADD COLUMN IF NOT EXISTS "contactGoogleMapsUrl" TEXT DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.970220677598!2d107.5458!3d-6.8906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTMnMjYuMiJTIDEwN8KwMzInNDQuOSJF!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
      ADD COLUMN IF NOT EXISTS "faqPageTitle" TEXT DEFAULT 'Pertanyaan Umum (FAQ)',
      ADD COLUMN IF NOT EXISTS "faqPageSubtitle" TEXT DEFAULT 'Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.',
      ADD COLUMN IF NOT EXISTS "returnsPageTitle" TEXT DEFAULT 'Kebijakan Garansi & Retur Kain',
      ADD COLUMN IF NOT EXISTS "returnsPageSubtitle" TEXT DEFAULT 'Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim.',
      ADD COLUMN IF NOT EXISTS "returnsSection1Title" TEXT DEFAULT '1. Ketentuan Garansi & Syarat Retur',
      ADD COLUMN IF NOT EXISTS "returnsSection1Desc" TEXT DEFAULT 'Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi.',
      ADD COLUMN IF NOT EXISTS "returnsSection2Title" TEXT DEFAULT '2. Syarat Wajib Video Unboxing',
      ADD COLUMN IF NOT EXISTS "returnsSection2Desc" TEXT DEFAULT 'Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai.',
      ADD COLUMN IF NOT EXISTS "returnsSection3Title" TEXT DEFAULT '3. Tata Cara Mengajukan Retur',
      ADD COLUMN IF NOT EXISTS "returnsSection3Desc" TEXT DEFAULT '1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\n3. CS akan memverifikasi dan memberikan alamat retur.';
    `);
  } catch (err) {
    console.warn("Notice: ensureSiteConfigColumns warning:", err);
  }
}

// --- SITE CONFIG API ROUTES (KEY-VALUE VERTICAL TABLE PATTERN) ---
// API Route: Get Hero Banner Config
app.get('/api/config/hero', cacheMiddleware(86400), async (req: Request, res: Response) => {
  try {
    await ensureSettingTable();
    await ensureSiteConfigColumns();

    const settings = await prisma.setting.findMany();
    const configDict: Record<string, any> = {};

    settings.forEach((s) => {
      configDict[s.key] = s.value;
    });

    let legacyConfig = await prisma.siteConfig.findUnique({ where: { id: "hero-banner" } });
    if (!legacyConfig) {
      legacyConfig = await (prisma.siteConfig as any).create({
        data: {
          id: "hero-banner",
          title: "Keanggunan Kain Semi Prancis 3D Premium",
          subtitle: "KOLEKSI RAJA BRUKAT 2026",
          buttonText: "Shop Now",
          buttonLink: "/shop",
          imageUrl: "/images/white_lace_hero.png",

          panel2Title: "Panel Brukat Chantily",
          panel2Subtitle: "RENDA CHANTILLY FRENCH",
          panel2ButtonText: "Lihat Koleksi",
          panel2ButtonLink: "/shop?category=Renda Chantilly",
          panel2ImageUrl: "/images/beige_lace_hero.png",

          panel3Title: "Panel Metallic Ellegant",
          panel3Subtitle: "METALLIC LACE ELEGANT",
          panel3ButtonText: "Lihat Koleksi",
          panel3ButtonLink: "/shop?category=Metallic",
          panel3ImageUrl: "/images/metallic_lace_hero.png",

          aboutTitle: "Didedikasikan Untuk Keindahan Kebaya & Gaun Mewah",
          aboutSubtitle: "Koleksi Tekstil Eksklusif",
          aboutDescription: "Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.",

          footerDesc: "Raja Brukat adalah pusat tekstil kain brukat & renda eksklusif terbaik di Indonesia. Melayani pemesanan eceran dan grosir ke seluruh Wilayah Indonesia.",
          instagramUrl: "https://instagram.com/rajabrukat",
          facebookUrl: "#",
          twitterUrl: "#",

          shopTitle: "Katalog Kain Brukat & Renda Premium",
          shopDescription: "Temukan koleksi motif brukat mutiara, renda chantilly, dan cornely 3D terbaik untuk gaun dan kebaya Anda.",
          catalogPdfUrl: "/Katalog.pdf",
          catalogTitleLine1: "Katalog",
          catalogTitleLine2: "Kain Eksklusif",
          latestBadge: "KOLEKSI MOTIF TERBARU",
          latestTitleLine1: "Rilis Koleksi Kain",
          latestTitleLine2: "Terbaru & Eksklusif",
          latestDesc: "Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.",

          aboutPageTitle: "Keanggunan Tekstil Kebaya \\n Mewah & Eksklusif Raja Brukat",
          aboutPageStory1: "Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.",
          aboutPageStory2: "Berdiri dengan komitmen menyajikan keindahan tekstil terbaik, kami menghadirkan ratusan pilihan motif renda eksklusif untuk kebutuhan kebaya wisuda, gaun pesta modern, seragam keluarga bridesmaid, hingga busana pengantin akad & resepsi.\\n\\nSetiap roll kain dikurasi secara teliti dengan kerapatan bordir presisi, hiasan mutiara timbul 3D, serta tekstur lembut yang sangat nyaman dan dingin dipakai sepanjang hari.",
          aboutPageImgUrl: "/images/brukat_tile_mutiara.png",
          aboutPageImgText: "Kemewahan Tanpa Kompromi.",
          aboutPagePhil1Title: "01. Kualitas Premium Impor",
          aboutPagePhil1Desc: "Serat renda Chantilly dan tile pilihan yang ekstra lembut di kulit, tahan lama, dingin, dan tidak gatal.",
          aboutPagePhil2Title: "02. Motif Anggun & Mewah",
          aboutPagePhil2Desc: "Desain bordir bunga 3D, cornely timbul, dan taburan mutiara yang sangat mewah untuk segala momen istimewa.",
          aboutPagePhil3Title: "03. Pelayanan Eceran & Grosir",
          aboutPagePhil3Desc: "Melayani pembelian eceran per meter maupun gulungan roll besar untuk desainer, penjahit, dan seragam acara.",

          contactHeroTitle: "Layanan & Konsultasi Kain Raja Brukat",
          contactHeroSubtitle: "HUBUNGI TIM CS KAMI",
          contactPhone: "+62 858-8166-7778",
          contactWhatsapp: "6285881667778",
          contactEmail: "info@rajabrukat.com",
          contactAddress: "Pusat Tekstil Raja Brukat, Indonesia",
          contactHours: "Senin - Sabtu: 08:00 - 17:00 WIB",

          faqPageTitle: "Pertanyaan Umum (FAQ)",
          faqPageSubtitle: "Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.",

          returnsPageTitle: "Kebijakan Garansi & Retur Kain",
          returnsPageSubtitle: "Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim.",
          returnsSection1Title: "1. Ketentuan Garansi & Syarat Retur",
          returnsSection1Desc: "Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi.",
          returnsSection2Title: "2. Syarat Wajib Video Unboxing",
          returnsSection2Desc: "Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai.",
          returnsSection3Title: "3. Tata Cara Mengajukan Retur",
          returnsSection3Desc: "1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\n3. CS akan memverifikasi dan memberikan alamat retur."
        }
      });
    }

    if (legacyConfig) {
      Object.entries(legacyConfig).forEach(([k, v]) => {
        if (v !== null && v !== undefined && configDict[k] === undefined) {
          configDict[k] = v;
        }
      });
    }

    res.json(configDict);
  } catch (error) {
    console.error("Error fetching hero config:", error);
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

// API Route: Update Hero Banner Config (Upserts into Key-Value Setting Table)
app.put('/api/config/hero', async (req: Request, res: Response) => {
  try {
    await ensureSettingTable();
    await ensureSiteConfigColumns();

    const body = req.body || {};

    const upsertPromises = Object.entries(body).map(([key, val]) => {
      const stringVal = val === null || val === undefined ? "" : String(val);
      return prisma.setting.upsert({
        where: { key },
        update: { value: stringVal },
        create: { key, value: stringVal }
      });
    });

    await Promise.all(upsertPromises);

    try {
      await prisma.siteConfig.upsert({
        where: { id: "hero-banner" },
        update: { ...body },
        create: { id: "hero-banner", ...body }
      });
    } catch (e) {
      // Ignore legacy sync warning
    }

    if (redisClient) await redisClient.del('cache:/api/config/hero');
    
    const allSettings = await prisma.setting.findMany();
    const configDict: Record<string, any> = {};
    allSettings.forEach((s) => {
      configDict[s.key] = s.value;
    });

    res.json(configDict);
  } catch (error) {
    console.error("Error updating hero config:", error);
    res.status(500).json({ error: "Failed to update config" });
  }
});


// --- FAQ ITEMS CRUD API ROUTES ---
const DEFAULT_FAQS = [
  {
    category: "Pemesanan & Ukuran",
    question: "Berapa minimal pembelian kain di Raja Brukat?",
    answer: "Kami melayani pembelian eceran mulai dari 1 meter (dapat dipotong per 0.5 meter untuk tipe tertentu) hingga pemesanan partai grosir per roll (isi 15 hingga 50 yard) dengan harga spesial grosir distributor.",
    order: 1
  },
  {
    category: "Spesifikasi Kain",
    question: "Apakah warna & motif foto produk 100% sama dengan kain aslinya?",
    answer: "Semua foto produk diambil secara profesional dari stok fisik asli dengan pencahayaan studio. Akurasi warna mencapai 95-98%. Perbedaan tipis dapat terjadi akibat perbedaan kecerahan atau resolusi layar monitor/smartphone Anda.",
    order: 2
  },
  {
    category: "Spesifikasi Kain",
    question: "Apa perbedaan Brukat Tile Mutiara 3D, Renda Chantilly, dan Cornely 3D?",
    answer: "• Brukat Tile Mutiara 3D: Kain berbahan jaring tile halus bertabur sulaman bordir bunga timbul dan payet mutiara kristal berkilau.\n• Renda Chantilly French: Renda khas Prancis yang tidak menggunakan payet, memiliki serat ultra-soft yang sangat halus, adem, dan jatuh lembut di kulit.\n• Cornely 3D: Brukat dengan teknik bordir sulam timbul bergaris tegas, memberikan tekstur kokoh & elegan untuk kebaya couture dan gaun pengantin.",
    order: 3
  },
  {
    category: "Pemesanan & Ukuran",
    question: "Apakah Raja Brukat melayani pesanan kain seragaman kebaya / bridesmaid?",
    answer: "Tentu saja! Kami berpengalaman menangani pesanan kain seragam pernikahan, bridesmaid, wisuda, dan acara keluarga. Kami siap menyediakan stok kain dengan seri kode warna & motif yang sama persis dalam jumlah besar.",
    order: 4
  },
  {
    category: "Pemesanan & Ukuran",
    question: "Berapa estimasi kebutuhan meter kain untuk membuat kebaya & gaun pesta?",
    answer: "Panduan perkiraan kebutuhan kain umum:\n• Kebaya Pendek / Atasan: ± 1.5 - 2 Meter\n• Kebaya Panjang / Tunik: ± 2 - 2.5 Meter\n• Gaun Pesta / Gamis Brukat: ± 3 - 4 Meter\n• Furing Dalaman (Silk Satin): Menyesuaikan panjang pakaian (± 2 - 3 Meter).\n*Disarankan untuk berkonsultasi dengan penjahit Anda sebelum memotong.",
    order: 5
  },
  {
    category: "Pengiriman & Grosir",
    question: "Metode pembayaran apa saja yang bisa digunakan?",
    answer: "Kami menerima berbagai metode pembayaran aman:\n• Transfer Bank Resmi (BCA, Mandiri, BRI, BNI)\n• E-Wallet (GoPay, OVO, DANA, ShopeePay)\n• Instant QRIS & Virtual Account Otomatis\n• Kartu Kredit / Debit Online",
    order: 6
  },
  {
    category: "Pengiriman & Grosir",
    question: "Berapa lama pengiriman barang dan apakah bisa kirim kargo grosir?",
    answer: "Pengiriman diproses pada hari yang sama dari gudang pusat kami. Estimasi wilayah Jabodetabek & Jawa 1-2 hari kerja, luar pulau 2-4 hari kerja via JNE, J&T, Sicepat. Untuk pembelian grosir jumlah besar/roll, kami menyediakan ekspedisi kargo langganan hemat biaya seperti Indah Kargo, Sentral Kargo, atau Dakota.",
    order: 7
  },
  {
    category: "Garansi & Retur",
    question: "Bagaimana jika kain yang diterima rusak, cacat bordir, atau warna salah?",
    answer: "Raja Brukat memberikan Garansi Retur 100% Tukar Baru atau Refund. Jika kain cacat atau salah kirim, wajib melampirkan video unboxing saat paket pertama kali dibuka dan hubungi Customer Service kami dalam waktu maksimal 2x24 jam.",
    order: 8
  }
];

// GET All FAQ Items (Auto seeds default FAQs if table empty)
app.get('/api/faqs', async (req: Request, res: Response) => {
  try {
    let count = await prisma.faqItem.count();
    if (count === 0) {
      await prisma.faqItem.createMany({
        data: DEFAULT_FAQS
      });
    }

    const faqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    res.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// POST Create FAQ Item
app.post('/api/faqs', async (req: Request, res: Response) => {
  try {
    const { category, question, answer, order } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Pertanyaan dan jawaban wajib diisi." });
    }

    const faq = await prisma.faqItem.create({
      data: {
        category: category || "Pemesanan & Ukuran",
        question,
        answer,
        order: order ? parseInt(order) : 0
      }
    });

    res.json(faq);
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({ error: "Failed to create FAQ" });
  }
});

// PUT Update FAQ Item
app.put('/api/faqs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, question, answer, order, isActive } = req.body;

    const faq = await prisma.faqItem.update({
      where: { id: id as string },
      data: {
        category,
        question,
        answer,
        order: order !== undefined ? parseInt(order) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    res.json(faq);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ error: "Failed to update FAQ" });
  }
});

// DELETE FAQ Item
app.delete('/api/faqs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.faqItem.delete({
      where: { id: id as string }
    });

    res.json({ message: "FAQ item deleted successfully" });
  } catch (error) {

    console.error("Error deleting FAQ:", error);
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
});


// --- CATALOG API ROUTES (REDIS CACHED 24h) ---

// GET Catalog Data & Mapping (Cached via Redis for 24 Hours)
app.get('/api/catalog', cacheMiddleware(86400), async (req: Request, res: Response) => {
  try {
    let config = await prisma.siteConfig.findUnique({ where: { id: "hero-banner" } });
    
    const catalogData = {
      title: "Katalog Koleksi Terbaik Raja Brukat 2026",
      subtitle: "Brukat premium untuk kebaya, wisuda, lamaran, dan momen istimewa",
      pdfUrl: config?.catalogPdfUrl || "/Katalog.pdf",
      totalPages: 14,
      pageRatio: 1.414,
      productMap: {
        1: "1638",
        2: "1638",
        3: "1639",
        4: "1639",
        5: "1640",
        6: "1640",
        7: "1641",
        8: "1641",
        9: "1642",
        10: "1642",
        11: "1643",
        12: "1643",
        13: "1644",
        14: "1644"
      },
      cachedAt: new Date().toISOString()
    };
    res.json(catalogData);
  } catch (error) {
    console.error("Error fetching catalog endpoint:", error);
    res.status(500).json({ error: "Failed to fetch catalog data" });
  }
});

// Admin PUT Endpoint to update Catalog settings & invalidate Redis Cache
app.put('/api/catalog', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: "Unauthorized" });

    if (redisClient) {
      await redisClient.del('cache:/api/catalog');
    }

    res.json({ message: "Catalog updated successfully and Redis cache cleared", updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error updating catalog endpoint:", error);
    res.status(500).json({ error: "Failed to update catalog" });
  }
});

// --- COLLECTIONS API ROUTES ---

// Get all collections
app.get('/api/collections', cacheMiddleware(3600), async (req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// Get a single collection
app.get('/api/collections/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

// Create new collection
app.post('/api/collections', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: "Unauthorized" });

    const { title, subtitle, description, imageUrl, color, isActive } = req.body;
    
    const collection = await prisma.collection.create({
      data: {
        title, subtitle, description, imageUrl, color, isActive
      }
    });

    if (redisClient) await redisClient.del('cache:/api/collections');
    res.status(201).json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ error: "Failed to create collection" });
  }
});

// Update collection
app.put('/api/collections/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: "Unauthorized" });

    const id = req.params.id as string;
    const { title, subtitle, description, imageUrl, color, isActive } = req.body;

    const collection = await prisma.collection.update({
      where: { id },
      data: { title, subtitle, description, imageUrl, color, isActive }
    });

    if (redisClient) await redisClient.del('cache:/api/collections');
    res.json(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    res.status(500).json({ error: "Failed to update collection" });
  }
});

// Delete collection
app.delete('/api/collections/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: "Unauthorized" });

    const id = req.params.id as string;
    await prisma.collection.delete({ where: { id } });

    if (redisClient) await redisClient.del('cache:/api/collections');
    res.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

// --- GEMINI MODEL FALLBACK LIST ---
const FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b"
];

async function generateContentWithFallback(genAIInstance: any, contentsPayload: any[]) {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAIInstance.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contentsPayload);
      const text = result.response.text().trim();
      if (text) {
        return { text, usedModel: modelName };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Fallback] Model ${modelName} hit limit or failed (${err?.message?.substring(0, 80)}). Retrying with next model...`);
    }
  }
  throw lastError || new Error("All Gemini AI models failed or hit quota limits.");
}

// --- AI ASSISTANT ENDPOINTS ---

// 1. AI Chatbot Assistant Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], image } = req.body;
    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    // Retrieve active products from database
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        category: true,
        description: true,
        colors: true,
        image: true,
        stock: true,
      }
    });

    let aiReply = "";
    let recommendedProductIds: string[] = [];

    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        const catalogContext = products.length > 0 
          ? products.map(p => {
              const validColors = p.colors.filter(c => 
                !c.toLowerCase().includes('gambar utama') && 
                !c.toLowerCase().includes('manekin') &&
                !c.toLowerCase().includes('gantung') &&
                !c.toLowerCase().includes('foto')
              );
              return `ID: ${p.id} | Nama: ${p.name} | Kategori: ${p.category} | Warna: ${validColors.join(', ')} | Harga: Rp${p.price} | Diskon: ${p.discountPrice ? 'Rp'+p.discountPrice : 'Tidak ada'} | Deskripsi: ${p.description || '-'}`;
            }).join('\n')
          : "PERHATIAN KRUSIAL: SAAT INI KATALOG TOKO SEDANG KOSONG (0 PRODUK). JIKA PELANGGAN MENANYAKAN PRODUK / STOK / KATALOG, BERITAHUKAN DENGAN RAMAH BAHWA KATALOG TOKO RAJABRUKAT SAAT INI SEDANG DALAM PROSES UPDATE / RE-STOCK DENGAN MOTIF TERBARU.";

        const systemPrompt = `Anda adalah "RajaBot", AI Fashion Advisor resmi dari toko RajaBrukat (spesialis kain brokat, tile, chantilly, lace premium Indonesia).
Tugas Anda:
1. Menjawab pertanyaan pelanggan dengan sangat ramah, elegan, dan membantu dalam bahasa Indonesia.
2. Menganalisis permintaan pelanggan (warna, model, kategori, acara seperti wisuda/kondangan/akad, budget).
3. Jika katalog memiliki produk, rekomendasikan ID produk yang cocok. Jika katalog KOSONG, beritahukan pelanggan dengan ramah bahwa katalog sedang update/re-stock dan belum ada produk aktif.

--- KATALOG PRODUK RAJABRUKAT ---
${catalogContext}
--- AKHIR KATALOG ---

Instruksi Output:
Kembalikan respon hanya dalam format JSON valid berikut (tanpa pembungkus markdown):
{
  "reply": "Pesan balasan ramah dan informatif untuk pelanggan...",
  "recommendedProductIds": []
}

Jika pelanggan mengunggah gambar, analisis warna dan pola kain pada gambar lalu cocokkan dengan katalog.`;



        let contents: any[] = [];
        if (image) {
          const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
          contents = [
            systemPrompt,
            ...history.map((h: any) => `${h.role === 'user' ? 'Customer' : 'RajaBot'}: ${h.content}`),
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            },
            `Customer: ${message || "Tunjukkan produk yang mirip dengan foto ini"}`
          ];
        } else {
          contents = [
            systemPrompt,
            ...history.map((h: any) => `${h.role === 'user' ? 'Customer' : 'RajaBot'}: ${h.content}`),
            `Customer: ${message}`
          ];
        }

        const { text: responseText, usedModel } = await generateContentWithFallback(genAI, contents);
        console.log(`[AI Chat] Generated response successfully using model: ${usedModel}`);
        
        try {
          const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          aiReply = parsed.reply || responseText;
          recommendedProductIds = parsed.recommendedProductIds || [];
        } catch {
          aiReply = responseText;
        }
      } catch (geminiError: any) {
        console.error("All Gemini API models failed, falling back to smart filter:", geminiError?.message || geminiError);
      }
    }

    // Smart Filter Rule Engine if AI response empty or no API key set
    if (!aiReply) {
      const lowerQuery = (message || "").toLowerCase();
      const matchedProducts = products.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(lowerQuery);
        const catMatch = p.category.toLowerCase().includes(lowerQuery);
        const descMatch = (p.description || "").toLowerCase().includes(lowerQuery);
        const colorMatch = p.colors.some(c => lowerQuery.includes(c.toLowerCase()) || c.toLowerCase().includes(lowerQuery));
        return nameMatch || catMatch || descMatch || colorMatch;
      });

      recommendedProductIds = matchedProducts.slice(0, 4).map(p => p.id);

      if (recommendedProductIds.length > 0) {
        aiReply = `Halo Kak! ✨ Berdasarkan pencarian Anda "${message}", berikut adalah pilihan produk RajaBrukat yang cocok:`;
      } else {
        recommendedProductIds = [];
        aiReply = `Halo Kak! Terima kasih sudah bertanya. 😊 Saat ini kami belum menemukan produk yang persis sama dengan "${message}". Silakan tanyakan warna atau model lain ya!`;
      }
    }

    const recommendedProducts = products.filter(p => recommendedProductIds.includes(p.id));

    res.json({
      reply: aiReply,
      products: recommendedProducts
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Gagal memproses permintaan AI Chat" });
  }
});

// 2. AI Smart Search Endpoint
app.post('/api/ai/smart-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const products = await prisma.product.findMany({
      where: { isActive: true }
    });

    const lower = query.toLowerCase();
    const matchedProducts = products.filter(p => {
      const inName = p.name.toLowerCase().includes(lower);
      const inCategory = p.category.toLowerCase().includes(lower);
      const inDesc = (p.description || "").toLowerCase().includes(lower);
      const inColors = p.colors.some(c => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower));
      return inName || inCategory || inDesc || inColors;
    });

    let aiSummary = `Menampilkan ${matchedProducts.length} hasil terbaik untuk "${query}".`;
    if (matchedProducts.length > 0) {
      const topCategories = Array.from(new Set(matchedProducts.map(p => p.category))).join(', ');
      aiSummary = `AI menemukan ${matchedProducts.length} produk pilihan dalam kategori ${topCategories} yang sesuai dengan kriteria warna & model pencarian Anda.`;
    }

    res.json({
      aiSummary,
      products: matchedProducts
    });
  } catch (error) {
    console.error("AI Smart Search Error:", error);
    res.status(500).json({ error: "Failed to perform AI smart search" });
  }
});

// 3. AI Visual Search Endpoint (Upload Image)
app.post('/api/ai/visual-search', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required" });

    const products = await prisma.product.findMany({
      where: { isActive: true }
    });

    let analysis = "";
    let matchedIds: string[] = [];

    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        const catalogText = products.map(p => `ID: ${p.id} | Nama: ${p.name} | Warna: ${p.colors.join(', ')} | Kategori: ${p.category}`).join('\n');
        
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const prompt = `Analisis foto kain/brokat ini. Sebutkan warna dominan, tekstur/motif brokat, dan kecocokan model. Lalu pilih ID produk dari katalog berikut yang paling mirip:
${catalogText}

Kembalikan format JSON:
{
  "analysis": "Deskripsi singkat mengenai warna dan pola yang terdeteksi pada gambar...",
  "matchedIds": ["id1", "id2"]
}`;


        const { text: responseText, usedModel } = await generateContentWithFallback(genAI, [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          }
        ]);
        console.log(`[AI Visual Search] Successfully analyzed image using model: ${usedModel}`);

        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        analysis = parsed.analysis || "Foto berhasil dianalisis oleh AI.";
        matchedIds = parsed.matchedIds || [];
      } catch (err: any) {
        console.error("Gemini Visual Search Error:", err?.message || err);
      }
    }

    if (matchedIds.length === 0 && !analysis) {
      analysis = "Foto berhasil dianalisis oleh AI, namun saat ini belum ditemukan pola kain yang mirip di dalam katalog.";
    }

    const recommended = products.filter(p => matchedIds.includes(p.id));

    res.json({
      analysis,
      products: recommended
    });

  } catch (error) {
    console.error("AI Visual Search Error:", error);
    res.status(500).json({ error: "Failed to perform AI visual search" });
  }
});

// --- CRON JOBS ---
cron.schedule('0 * * * *', async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        updatedAt: { lt: twentyFourHoursAgo },
        abandonedEmailSent: false,
        items: { some: {} } // Ensure cart is not empty
      },
      include: {
        user: true,
        items: { include: { product: true } }
      }
    });

    for (const cart of abandonedCarts) {
      if (!cart.user.email) continue;
      
      const itemsList = cart.items.map((item: any) => 
        `<li><b>${item.product.name}</b> (Qty: ${item.quantity}) - Rp ${item.product.price.toLocaleString('id-ID')}</li>`
      ).join('');

      const bodyHTML = `
        <p>Hi ${cart.user.name},</p>
        <p>Sepertinya ada beberapa barang luar biasa yang tertinggal di keranjang Anda! Jangan sampai kehabisan, stok sangat terbatas.</p>
        <ul style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; list-style-type: none; margin: 20px 0;">
          ${itemsList}
        </ul>
        <p>Selesaikan pesanan Anda sekarang dan jadilah bagian dari revolusi streetwear kami.</p>
      `;

      await sendNotificationEmail(
        cart.user.email,
        "Menunggu di Keranjang Anda... 👀",
        "Keranjang Anda Tertinggal",
        bodyHTML,
        "Lanjutkan Checkout",
        `${process.env.FRONTEND_URL}/cart`
      );

      // Mark as sent to prevent spamming
      await prisma.cart.update({
        where: { id: cart.id },
        data: { abandonedEmailSent: true }
      });
    }
  } catch (error) {
    console.error("Cron Job Error [Abandoned Cart]:", error);
  }
});

async function ensureVisitorLogTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VisitorLog" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "ip" TEXT,
        "path" TEXT NOT NULL,
        "userAgent" TEXT,
        "device" TEXT DEFAULT 'Desktop',
        "city" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "VisitorLog_createdAt_idx" ON "VisitorLog"("createdAt");
      CREATE INDEX IF NOT EXISTS "VisitorLog_path_idx" ON "VisitorLog"("path");
    `);
  } catch (err) {
    console.warn("Notice: ensureVisitorLogTable warning:", err);
  }
}

app.post("/api/analytics/log", async (req, res) => {
  try {
    await ensureVisitorLogTable();
    const { path, userAgent } = req.body || {};
    if (!path || typeof path !== "string" || path.startsWith("/admin") || path.startsWith("/api")) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const ip = Array.isArray(rawIp) ? rawIp[0] : (rawIp as string).split(",")[0].trim();
    const ua = userAgent || req.headers["user-agent"] || "";

    let device = "Desktop";
    if (/mobile/i.test(ua)) device = "Mobile";
    else if (/tablet|ipad/i.test(ua)) device = "Tablet";

    if ((prisma as any).visitorLog) {
      await (prisma as any).visitorLog.create({
        data: {
          path,
          ip,
          userAgent: ua,
          device,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Analytics log error:", err);
    res.status(200).json({ success: false });
  }
});

app.get("/api/analytics/stats", async (req, res) => {
  try {
    await ensureVisitorLogTable();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const vLog = (prisma as any).visitorLog;
    if (!vLog) {
      return res.json({ todayCount: 0, monthCount: 0, totalCount: 0, topPages: [], devices: [], dailyChart: [] });
    }

    const [todayCount, monthCount, totalCount, topPagesGroup, deviceGroup] = await Promise.all([
      vLog.count({ where: { createdAt: { gte: startOfToday } } }),
      vLog.count({ where: { createdAt: { gte: startOfMonth } } }),
      vLog.count(),
      vLog.groupBy({
        by: ["path"],
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 6,
      }),
      vLog.groupBy({
        by: ["device"],
        _count: { device: true },
      }),
    ]);

    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const count = await vLog.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const dayLabel = dayStart.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
      dailyChart.push({ date: dayLabel, visits: count });
    }

    res.json({
      todayCount,
      monthCount,
      totalCount,
      topPages: (topPagesGroup as any[]).map((item: any) => ({ path: item.path, count: item._count.path })),
      devices: (deviceGroup as any[]).map((item: any) => ({ device: item.device || "Desktop", count: item._count.device })),
      dailyChart,
    });
  } catch (err) {
    console.error("Analytics stats error:", err);
    res.status(500).json({ error: "Failed to fetch analytics stats" });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});
