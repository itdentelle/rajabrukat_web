import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
if (!connectionString) {
  console.error('[WARNING] DATABASE_URL environment variable is missing or empty!');
}

const isCloudDb =
  connectionString.includes('supabase') ||
  connectionString.includes('pooler') ||
  connectionString.includes('aws') ||
  connectionString.includes('railway');

export const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
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

export { prisma };

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rajabrukat.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}
export const JWT_SECRET: string = rawJwtSecret;

if (!ADMIN_PASSWORD) {
  console.warn('[WARNING] ADMIN_PASSWORD is not set. Admin seeding will be skipped.');
}

export const initializeAdmin = async () => {
  try {
    if (!ADMIN_PASSWORD) {
      console.warn('[DB INIT] ADMIN_PASSWORD not set, skipping admin seed.');
      return;
    }

    const defaultEmails = ['admin@rajabrukat.com', ADMIN_EMAIL].filter(
      (e, i, arr) => e && arr.indexOf(e) === i
    );
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
                role: 'ADMIN',
              },
            });
            console.log(`Admin account [${email}] seeded successfully.`);
          }
        }
        break; // Success, exit retry loop
      } catch (e: any) {
        retries--;
        if (retries === 0) throw e;
        console.log(`[DB INIT] Retrying connection to database (${retries} attempts left)...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  } catch (err) {
    console.error('Failed to seed admin:', err);
  }
};
