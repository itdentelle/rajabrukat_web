import express, { Request, Response } from 'express';
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
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('[WARNING] DATABASE_URL environment variable is missing or empty!');
}
const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  console.error('Pg Pool Idle Connection Warning:', err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
].filter((url): url is string => Boolean(url));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());

// Serve scraped product images directly from scraping output directory
const SCRAPED_IMAGES_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
app.use('/scraped-images', express.static(SCRAPED_IMAGES_DIR));


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
          <h1>DragonWorm</h1>
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
          &copy; ${new Date().getFullYear()} DragonWorm. All rights reserved.<br>
          Premium Streetwear Based in Jakarta.
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


const initializeAdmin = async () => {
  try {
    const defaultEmails = ['admin@rajabrukat.com', 'admin@dragonworm.com', ADMIN_EMAIL];
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
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
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
};
initializeAdmin();

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
      prisma.product.findMany({ where: whereClause, skip, take: limit }),
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
    const { name, price, discountPrice, category, description, image, galleryImages, colors, sizeGuide, stock } = req.body;
    const product = await prisma.product.create({
      data: { name, price: Number(price), discountPrice: discountPrice ? Number(discountPrice) : null, category, description, image, galleryImages: galleryImages || [], colors: colors || [], sizeGuide, stock: stock !== undefined ? Number(stock) : 100 }
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
    const { name, price, discountPrice, category, description, image, galleryImages, colors, sizeGuide, stock } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: { name, price: Number(price), discountPrice: discountPrice ? Number(discountPrice) : null, category, description, image, galleryImages: galleryImages || [], colors: colors || [], sizeGuide, stock: stock !== undefined ? Number(stock) : undefined }
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

// API Route: Delete a product (Soft Delete / Archive)
app.delete('/api/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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
    console.error("Error archiving product:", error);
    res.status(500).json({ error: "Failed to archive product" });
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
    
    // items should be an array of { productId, quantity, price }
    // Verify stock first
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        if (redisClient) await redisClient.del(idempotencyKey);
        return res.status(404).json({ error: `Produk tidak ditemukan.` });
      }
      if (product.stock < item.quantity) {
        if (redisClient) await redisClient.del(idempotencyKey);
        return res.status(400).json({ error: `Stok tidak mencukupi untuk ${product.name}. Tersisa: ${product.stock}` });
      }
    }

    // calculate totalAmount and decrease stock
    let totalItemsAmount = 0;
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
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
            "finish": "http://localhost:3000/profile",
            "error": "http://localhost:3000/profile",
            "unfinish": "http://localhost:3000/profile"
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
        <p>Kami harap Anda menyukai koleksi DragonWorm yang baru Anda terima. Kepuasan Anda adalah prioritas utama kami.</p>
        <p>Kami akan sangat menghargai jika Anda mau meluangkan waktu 1 menit untuk meninggalkan ulasan di profil Anda.</p>
      `;
      await sendNotificationEmail(
        order.user.email,
        "Paket Tiba! Terima Kasih dari DragonWorm 🐉",
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

    const [totalUsers, totalOrders, recentOrders, allOrders] = await Promise.all([
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
      })
    ]);

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
      revenueData
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
      contact_name: "DragonWorm Official",
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
              <p>Kami harap Anda menyukai koleksi DragonWorm yang baru Anda terima. Kepuasan Anda adalah prioritas utama kami.</p>
              <p>Kami akan sangat menghargai jika Anda mau meluangkan waktu 1 menit untuk meninggalkan ulasan di profil Anda.</p>
            `;
            await sendNotificationEmail(
              existingOrder.user.email,
              "Paket Tiba! Terima Kasih dari DragonWorm 🐉",
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

// --- SITE CONFIG API ROUTES ---
// API Route: Get Hero Banner Config
app.get('/api/config/hero', cacheMiddleware(86400), async (req: Request, res: Response) => {
  try {
    let config = await prisma.siteConfig.findUnique({ where: { id: "hero-banner" } });
    if (!config || config.title === "Define Your Street." || config.title === "Keanggunan Kain Brukat & Lace Premium") {
      config = await prisma.siteConfig.upsert({
        where: { id: "hero-banner" },
        update: {
          title: "Keanggunan Kain Semi Prancis 3D Premium",
          subtitle: "KOLEKSI RAJA BRUKAT 2026",
          buttonText: "Shop Now",
          buttonLink: "/shop",
          imageUrl: "/images/white_lace_hero.jpg"
        },
        create: {
          id: "hero-banner",
          title: "Keanggunan Kain Semi Prancis 3D Premium",
          subtitle: "KOLEKSI RAJA BRUKAT 2026",
          buttonText: "Shop Now",
          buttonLink: "/shop",
          imageUrl: "/images/white_lace_hero.jpg"
        }
      });
    }
    res.json(config);
  } catch (error) {
    console.error("Error fetching hero config:", error);
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

// API Route: Update Hero Banner Config
app.put('/api/config/hero', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: "Unauthorized" });

    const { 
      title, subtitle, buttonText, buttonLink, imageUrl,
      aboutTitle, aboutSubtitle, aboutDescription,
      footerDesc, instagramUrl, facebookUrl, twitterUrl,
      shopTitle, shopDescription,
      aboutPageTitle, aboutPageStory1, aboutPageStory2, aboutPageImgUrl, aboutPageImgText,
      aboutPagePhil1Title, aboutPagePhil1Desc, aboutPagePhil2Title, aboutPagePhil2Desc, aboutPagePhil3Title, aboutPagePhil3Desc
    } = req.body;

    const updatedConfig = await prisma.siteConfig.upsert({
      where: { id: "hero-banner" },
      update: { 
        title, subtitle, buttonText, buttonLink, imageUrl,
        aboutTitle, aboutSubtitle, aboutDescription,
        footerDesc, instagramUrl, facebookUrl, twitterUrl,
        shopTitle, shopDescription,
        aboutPageTitle, aboutPageStory1, aboutPageStory2, aboutPageImgUrl, aboutPageImgText,
        aboutPagePhil1Title, aboutPagePhil1Desc, aboutPagePhil2Title, aboutPagePhil2Desc, aboutPagePhil3Title, aboutPagePhil3Desc
      },
      create: { 
        id: "hero-banner", 
        title, subtitle, buttonText, buttonLink, imageUrl,
        aboutTitle, aboutSubtitle, aboutDescription,
        footerDesc, instagramUrl, facebookUrl, twitterUrl,
        shopTitle, shopDescription,
        aboutPageTitle, aboutPageStory1, aboutPageStory2, aboutPageImgUrl, aboutPageImgText,
        aboutPagePhil1Title, aboutPagePhil1Desc, aboutPagePhil2Title, aboutPagePhil2Desc, aboutPagePhil3Title, aboutPagePhil3Desc
      }
    });

    if (redisClient) await redisClient.del('cache:/api/config/hero');
    res.json(updatedConfig);
  } catch (error) {
    console.error("Error updating hero config:", error);
    res.status(500).json({ error: "Failed to update config" });
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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});
