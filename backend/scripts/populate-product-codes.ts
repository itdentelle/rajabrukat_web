import * as XLSX from 'xlsx';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('railway') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function extractProductCode(title: string): string {
  if (!title) return '';

  // Patterns:
  // 1. [ KODE 3947AR ] or [ kode 3947AR ] or [ 3947AR ]
  // 2. KODE [ 3947AR ]
  // 3. KODE : 3947AR or KODE 3947AR
  const bracketCodeMatch = title.match(/\[\s*(?:KODE\s*)?([A-Za-z0-9]+)\s*\]/i);
  if (bracketCodeMatch) {
    return bracketCodeMatch[1].trim().toUpperCase();
  }

  const prefixCodeMatch = title.match(/KODE\s*[:\-_]?\s*\[?\s*([A-Za-z0-9]+)\s*\]?/i);
  if (prefixCodeMatch) {
    return prefixCodeMatch[1].trim().toUpperCase();
  }

  return '';
}

async function run() {
  console.log('\n=============================================================');
  console.log('  🚀 MENAMBAHKAN KOLOM & MENGISI KODE KAIN OTOMATIS 🚀');
  console.log('=============================================================\n');

  // Step 1: Ensure column 'code' exists in Product table
  try {
    await pool.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "code" TEXT;`);
    console.log('✔ Kolom "code" berhasil dipastikan ada di tabel "Product".');
  } catch (err: any) {
    console.warn('Notice saat alter table:', err.message);
  }

  // Step 2: Read Excel for reference if available
  let excelLookup: Record<string, string> = {};
  try {
    const excelPath = path.join(__dirname, '../../rajabrukat_products_complete_v2.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    rawData.forEach((row: any) => {
      const name = (row['Nama Produk'] || '').trim();
      const code = extractProductCode(name);
      if (code) {
        excelLookup[name.toLowerCase()] = code;
      }
    });
    console.log(`✔ Membaca ${Object.keys(excelLookup).length} kode referensi dari Excel.`);
  } catch (e) {
    console.log('Excel lookup skipped.');
  }

  // Step 3: Fetch all products and populate code
  const products = await prisma.product.findMany();
  console.log(`Ditemukan ${products.length} produk di database.\n`);

  let updatedCount = 0;

  for (const product of products) {
    let extractedCode = extractProductCode(product.name);

    // If not found in title, check excel lookup
    if (!extractedCode && excelLookup[product.name.toLowerCase()]) {
      extractedCode = excelLookup[product.name.toLowerCase()];
    }

    if (extractedCode) {
      await pool.query(`UPDATE "Product" SET "code" = $1 WHERE "id" = $2`, [extractedCode, product.id]);
      updatedCount++;
      console.log(`✔ [${extractedCode.padEnd(8)}] "${product.name.substring(0, 50)}..."`);
    } else {
      console.log(`ℹ [NO CODE ] "${product.name.substring(0, 50)}..."`);
    }
  }

  // Clear redis cache
  const rawRedisUrl = process.env.REDIS_URL;
  if (rawRedisUrl && rawRedisUrl.trim() !== '') {
    try {
      const redis = new Redis(rawRedisUrl, { connectTimeout: 3000 });
      const keys = await redis.keys('cache:/api/products*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Berhasil menghapus ${keys.length} cache produk di Redis.`);
      }
      await redis.quit();
    } catch {}
  }

  console.log('\n=============================================================');
  console.log(`  🎉 SELESAI: ${updatedCount} dari ${products.length} produk berhasil diisi Kode Kain.`);
  console.log('=============================================================\n');

  await prisma.$disconnect();
  await pool.end();
}

run().catch(err => {
  console.error('Fatal error in populate-product-codes:', err);
  process.exit(1);
});
