import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined
});

async function main() {
  console.log("Creating tables Setting and FaqItem...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Setting" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL,
      "category" TEXT DEFAULT 'general',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "FaqItem" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "category" TEXT DEFAULT 'Pemesanan & Ukuran',
      "question" TEXT NOT NULL,
      "answer" TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("SUCCESS: Setting & FaqItem tables created in Supabase database!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

