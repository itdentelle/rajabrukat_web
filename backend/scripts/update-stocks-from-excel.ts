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

function formatColorName(str: string): string {
  let cleaned = str.replace(/KETERSEDIAAN\s+WARNA\s*[:=]?/i, '').trim();
  cleaned = cleaned.replace(/[:=\-_[\]()]+$/g, '').trim();
  cleaned = cleaned.replace(/–\s*belum ada foto.*$/i, '').trim();
  cleaned = cleaned.replace(/\s*–\s*foto.*$/i, '').trim();

  if (!cleaned || /^(kain|lebar|panjang|no ob|grade|warna|sub total|total)/i.test(cleaned)) {
    return '';
  }
  return cleaned
    .split(/\s+/)
    .map(word => {
      // Preserve Roman numerals like I, II, III, IV
      if (/^(i|ii|iii|iv|v|vi)$/i.test(word)) {
        return word.toUpperCase();
      }
      // Preserve uppercase abbreviations like BW
      if (/^bw$/i.test(word)) {
        return 'BW';
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function parseLineStock(line: string, colorStocks: Record<string, number>) {
  if (/SUB\s*TOTAL/i.test(line) || /TOTAL\s*=/i.test(line)) return;

  const cleaned = line.replace(/^[\d]+\.\s*/, '').replace(/^[•\-*]\s*/, '').trim();

  // Pattern 1: COLOR [ XX PCS ] or COLOR ( XX PCS )
  const bracketMatch = cleaned.match(/^([A-Za-z0-9\s/&.\-_]+?)\s*[\[(]\s*(\d+)\s*(?:PCS|pcs|M|m|roll|ROLL)?\s*[\])]/i);
  if (bracketMatch) {
    const colorName = formatColorName(bracketMatch[1]);
    const qty = parseInt(bracketMatch[2], 10);
    if (colorName && !isNaN(qty) && qty > 0) {
      colorStocks[colorName] = (colorStocks[colorName] || 0) + qty;
      return;
    }
  }

  // Pattern 2: COLOR : XX PCS or COLOR = XX PCS or COLOR : XX
  const colonMatch = cleaned.match(/^([A-Za-z0-9\s/&.\-_]+?)\s*[:=]\s*(\d+)\s*(?:PCS|pcs|M|m|roll|ROLL)?$/i);
  if (colonMatch) {
    const colorName = formatColorName(colonMatch[1]);
    const qty = parseInt(colonMatch[2], 10);
    if (colorName && !isNaN(qty) && qty > 0) {
      colorStocks[colorName] = (colorStocks[colorName] || 0) + qty;
      return;
    }
  }

  // Pattern 3: COLOR XX pcs or COLOR XX PCS
  const trailingPcsMatch = cleaned.match(/^([A-Za-z0-9\s/&.\-_]+?)\s+(\d+)\s*(?:PCS|pcs|M|m|roll|ROLL)$/i);
  if (trailingPcsMatch) {
    const colorName = formatColorName(trailingPcsMatch[1]);
    const qty = parseInt(trailingPcsMatch[2], 10);
    if (colorName && !isNaN(qty) && qty > 0) {
      colorStocks[colorName] = (colorStocks[colorName] || 0) + qty;
      return;
    }
  }
}

function parseColorStocksFromText(text: string): { colorStocks: Record<string, number>; colors: string[]; totalStock: number } {
  const colorStocks: Record<string, number> = {};
  if (!text) return { colorStocks, colors: [], totalStock: 0 };

  const lines = text.split('\n');
  let inKetersediaanSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/KETERSEDIAAN\s+WARNA/i.test(line)) {
      inKetersediaanSection = true;
      const afterColon = line.split(/KETERSEDIAAN\s+WARNA\s*[:=]?/i)[1];
      if (afterColon && afterColon.trim() && !afterColon.trim().startsWith(':')) {
        parseLineStock(afterColon.trim(), colorStocks);
      }
      continue;
    }

    if (inKetersediaanSection) {
      if (/SUB\s*TOTAL/i.test(line) || /TOTAL\s*STOCK/i.test(line) || /INFORMASI\s*LAIN/i.test(line) || /CATATAN/i.test(line)) {
        continue;
      }
      parseLineStock(line, colorStocks);
    }
  }

  if (Object.keys(colorStocks).length === 0) {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/pcs/i.test(line) && !/SUB\s*TOTAL/i.test(line)) {
        parseLineStock(line, colorStocks);
      }
    }
  }

  const colors = Object.keys(colorStocks);
  const totalStock = Object.values(colorStocks).reduce((sum, val) => sum + val, 0);

  return { colorStocks, colors, totalStock };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[–—\-]/g, ' ')
    .replace(/\[|\]|\(|\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function updateStocks() {
  console.log('\n=============================================================');
  console.log('  🚀 MEMPERBARUI STOK PRODUK & VARIAN WARNA DARI EXCEL 🚀');
  console.log('=============================================================\n');

  const excelPath = path.join(__dirname, '../../rajabrukat_products_complete_v2.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

  const dbProducts = await prisma.product.findMany();
  console.log(`Membaca ${rawData.length} data dari Excel...\nDatabase saat ini memiliki ${dbProducts.length} produk.\n`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const excelName = (row['Nama Produk'] || '').trim();
    const excelCategory = (row['Kategori'] || '').trim();
    const desc = row['Deskripsi Singkat / Informasi Kain'] || '';

    const { colorStocks, colors, totalStock } = parseColorStocksFromText(desc);

    const normExcelName = normalizeName(excelName);
    const isGradeA = /grade\s*a/i.test(excelName) || /panel\s*a\s*grade/i.test(excelCategory);
    const isGradeB = /grade\s*b/i.test(excelName) || /panel\s*b\s*grade/i.test(excelCategory);

    // Matching logic
    let matchedDb = dbProducts.find(p => normalizeName(p.name) === normExcelName);

    if (!matchedDb) {
      // Match by code + grade
      const codeMatch = excelName.match(/\[\s*([A-Za-z0-9]+)\s*\]/);
      if (codeMatch) {
        const code = codeMatch[1].toLowerCase();
        matchedDb = dbProducts.find(p => {
          const nameLower = p.name.toLowerCase();
          const hasCode = nameLower.includes(code);
          if (!hasCode) return false;
          if (isGradeA && nameLower.includes('grade b')) return false;
          if (isGradeB && nameLower.includes('grade a')) return false;
          return true;
        });
      }
    }

    if (!matchedDb) {
      matchedDb = dbProducts.find(p => {
        const normDb = normalizeName(p.name);
        return normExcelName.includes(normDb) || normDb.includes(normExcelName);
      });
    }

    if (matchedDb) {
      // Perform DB Update
      const oldStock = matchedDb.stock;
      const oldColorsCount = matchedDb.colors?.length || 0;

      await prisma.product.update({
        where: { id: matchedDb.id },
        data: {
          stock: totalStock > 0 ? totalStock : (matchedDb.stock || 100),
          colors: colors.length > 0 ? colors : matchedDb.colors,
          colorStocks: Object.keys(colorStocks).length > 0 ? colorStocks : undefined,
        },
      });

      updatedCount++;
      console.log(`✔ [Row ${i + 1}] Berhasil Update: "${matchedDb.name.substring(0, 45)}..."`);
      console.log(`   🎨 Varian Warna (${colors.length}): ${colors.join(', ')}`);
      console.log(`   📦 Stok per Warna: ${JSON.stringify(colorStocks)}`);
      console.log(`   📊 Total Stok: ${oldStock} ➔ ${totalStock} pcs\n`);
    } else {
      notFoundCount++;
      console.log(`⚠ [Row ${i + 1}] Tidak ditemukan di DB: "${excelName.substring(0, 50)}..."`);
    }
  }

  // Invalidate Redis Cache
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

  console.log('=============================================================');
  console.log(`  🎉 RINGKASAN PEMBARUAN STOK DARI EXCEL:`);
  console.log(`  • Total Baris Excel : ${rawData.length}`);
  console.log(`  • Produk Terupdate  : ${updatedCount} produk`);
  console.log(`  • Belum Terpasang   : ${notFoundCount} produk`);
  console.log('=============================================================\n');

  await prisma.$disconnect();
  await pool.end();
}

updateStocks().catch(err => {
  console.error('Fatal Error updating stocks:', err);
  process.exit(1);
});
