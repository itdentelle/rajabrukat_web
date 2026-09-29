import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykzpelepxkrkzbxlrydi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'products';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ 
  connectionString,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearStorageBucket() {
  console.log(`🧹 Clearing Supabase Storage Bucket: "${BUCKET_NAME}"...`);
  try {
    let hasMore = true;
    let deletedCount = 0;

    while (hasMore) {
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 100 });

      if (error) {
        console.error("Error listing files in bucket:", error.message);
        break;
      }

      if (!files || files.length === 0) {
        hasMore = false;
        break;
      }

      const paths = files.map(f => f.name);
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(paths);

      if (removeError) {
        console.error("Error removing files:", removeError.message);
        break;
      }

      deletedCount += paths.length;
      console.log(`  Deleted batch of ${paths.length} files from storage bucket...`);
    }

    console.log(`✅ Supabase Storage Bucket "${BUCKET_NAME}" cleared! Total files deleted: ${deletedCount}`);
  } catch (err: any) {
    console.error("Failed to clear storage bucket:", err?.message || err);
  }
}

async function clearDatabase() {
  console.log("🧹 Clearing database product records...");
  try {
    await prisma.orderItem.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.wishlistItem.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.product.deleteMany({});
    console.log("✅ Database wiped clean!");
  } catch (err: any) {
    console.error("Failed to clear database:", err?.message || err);
  }
}

async function main() {
  await clearDatabase();
  await clearStorageBucket();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Error clearing DB & Bucket:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
