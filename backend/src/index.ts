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
const midtransClient = require('midtrans-client');

dotenv.config();

// --- DATABASE SETUP ---
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- EXPRESS SETUP ---
const PORT = process.env.PORT || 5000;
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');

// --- REDIS SETUP ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let isRedisConnected = false;

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop reconnecting after 3 failed attempts
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
  console.error('Redis Connection Warning (Bypassing Redis cache):', err.message);
});

// --- BULLMQ QUEUE SETUP ---
const emailQueue = new Queue('emailQueue', { connection: redisClient as any });

// --- CACHING MIDDLEWARE ---
const cacheMiddleware = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: express.NextFunction) => {
    if (req.method !== 'GET' || !isRedisConnected || redisClient.status !== 'ready') {
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
          if (isRedisConnected && redisClient.status === 'ready') {
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Terlalu banyak percobaan login/register, silakan coba lagi setelah 15 menit.' },
  standardHeaders: true, 
  legacyHeaders: false,
  store: isRedisConnected ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
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
  await emailQueue.add('send-notification', { email, subject, title, bodyHTML, buttonText, buttonUrl });
  console.log(`[EMAIL QUEUE] Queued notification email for ${email} - Subject: ${subject}`);
};

const sendOTPEmail = async (email: string, otp: string) => {
  await emailQueue.add('send-otp', { email, otp });
  console.log(`[EMAIL QUEUE] Queued OTP email for ${email}`);
};

// --- BULLMQ EMAIL WORKER ---
const emailWorker = new Worker('emailQueue', async job => {
  if (job.name === 'send-notification') {
    const { email, subject, title, bodyHTML, buttonText, buttonUrl } = job.data;
    const html = getEmailTemplate(title, bodyHTML, buttonText, buttonUrl);
    const mailOptions = {
      from: `"DragonWorm" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL WORKER] Successfully sent "${subject}" to ${email}`);
    } catch (error) {
      console.error(`[EMAIL WORKER] Failed to send "${subject}" to ${email}:`, error);
      throw error; 
    }
  } else if (job.name === 'send-otp') {
    const { email, otp } = job.data;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`\n=========================================\n[DUMMY EMAIL WORKER] OTP for ${email} is: ${otp}\n=========================================\n`);
      return;
    }
    
    const mailOptions = {
      from: `"DragonWorm" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login/Register OTP Code',
      text: `Your DragonWorm OTP code is: ${otp}. It will expire in 5 minutes.`
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log(`\n=========================================\n[DEVELOPMENT WORKER] OTP for ${email} is: ${otp}\n=========================================\n`);
    } catch (error) {
      console.error("[EMAIL WORKER] Failed to send OTP email:", error);
      console.log(`\n=========================================\n[DUMMY EMAIL WORKER] OTP for ${email} is: ${otp}\n=========================================\n`);
      throw error;
    }
  }
}, { connection: redisClient as any });

emailWorker.on('completed', job => {
  console.log(`[BULLMQ] Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[BULLMQ] Job ${job?.id} has failed with ${err.message}`);
});

const initializeAdmin = async () => {
  try {
    const adminExists = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log("Admin account seeded successfully.");
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
    if (!user || user.otpCode !== otp) {
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
    const limit = parseInt(req.query.limit as string) || 50; // default to 50 for now to not break too many things
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
    const keys = await redisClient.keys('cache:/api/products*');
    if (keys.length > 0) await redisClient.del(...keys);
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
    const keys = await redisClient.keys('cache:/api/products*');
    if (keys.length > 0) await redisClient.del(...keys);
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
    const keys = await redisClient.keys('cache:/api/products*');
    if (keys.length > 0) await redisClient.del(...keys);
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
    const keys = await redisClient.keys('cache:/api/products*');
    if (keys.length > 0) await redisClient.del(...keys);
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
    const isLocked = await redisClient.get(idempotencyKey);
    if (isLocked) {
      return res.status(429).json({ error: "Terlalu banyak permintaan checkout. Mohon tunggu beberapa detik." });
    }
    await redisClient.setex(idempotencyKey, 5, 'locked');
    
    // items should be an array of { productId, quantity, price }
    // Verify stock first
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        await redisClient.del(idempotencyKey);
        return res.status(404).json({ error: `Produk tidak ditemukan.` });
      }
      if (product.stock < item.quantity) {
        await redisClient.del(idempotencyKey);
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
    res.json(wishlistItems.map(w => w.product));
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
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Group Order Status
    const statusCounts: Record<string, number> = {
      PENDING: 0, PROCESSING: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0
    };
    allOrders.forEach(o => {
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
      
      const monthOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === d.getMonth() && 
               orderDate.getFullYear() === year && 
               o.status === 'COMPLETED';
      });
      
      const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
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
      const itemsList = existingOrder.items.map(item => 
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
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          id: "hero-banner",
          title: "Define Your Street.",
          subtitle: "New Collection 2026",
          buttonText: "Shop Now",
          buttonLink: "/shop",
          imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2400&auto=format&fit=crop"
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

    await redisClient.del('cache:/api/config/hero');
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

    await redisClient.del('cache:/api/collections');
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

    await redisClient.del('cache:/api/collections');
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

    await redisClient.del('cache:/api/collections');
    res.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ error: "Failed to delete collection" });
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
      
      const itemsList = cart.items.map(item => 
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
