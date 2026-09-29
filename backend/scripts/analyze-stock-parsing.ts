import * as XLSX from 'xlsx';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('railway') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      // If the line itself has color after colon: e.g. "KETERSEDIAAN WARNA : TERACOTTA 84 pcs"
      const afterColon = line.split(/KETERSEDIAAN\s+WARNA\s*[:=]?/i)[1];
      if (afterColon && afterColon.trim() && !afterColon.trim().startsWith(':')) {
        parseLineStock(afterColon.trim(), colorStocks);
      }
      continue;
    }

    if (inKetersediaanSection) {
      if (/SUB\s*TOTAL/i.test(line) || /TOTAL\s*STOCK/i.test(line) || /INFORMASI/i.test(line) || /CATATAN/i.test(line)) {
        // reached end of section
        continue;
      }
      parseLineStock(line, colorStocks);
    }
  }

  // If not found inside section, try fallback full scan for "[ XX PCS ]" or ": XX PCS" or "XX pcs"
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

function parseLineStock(line: string, colorStocks: Record<string, number>) {
  // Ignore subtotal or total
  if (/SUB\s*TOTAL/i.test(line) || /TOTAL\s*=/i.test(line)) return;

  // Patterns:
  // 1. "BABY PINK [ 90 PCS ]" or "BABY PINK [90 PCS]" or "BABY PINK [ 90PCS ]"
  // 2. "HIJAU SAGE : 100 PCS" or "HIJAU SAGE : 100"
  // 3. "TERACOTTA 84 pcs" or "TERACOTTA 84PCS"
  // 4. "DENIM BLUE I = 100 PCS"
  // 5. "1. BABY PINK : 90 PCS"

  // Clean leading numbering like "1. " or "• " or "- "
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

function formatColorName(str: string): string {
  let cleaned = str.replace(/KETERSEDIAAN\s+WARNA\s*[:=]?/i, '').trim();
  cleaned = cleaned.replace(/[:=\-_[\]()]+$/g, '').trim();
  // Capitalize nicely, e.g. "BABY PINK" -> "Baby Pink" or uppercase
  if (!cleaned || /^(kain|lebar|panjang|no ob|grade|warna|sub total|total)/i.test(cleaned)) {
    return '';
  }
  return cleaned
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[–—\-]/g, ' ')
    .replace(/\[|\]|\(|\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function analyze() {
  const excelPath = path.join(__dirname, '../../rajabrukat_products_complete_v2.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

  const dbProducts = await prisma.product.findMany();
  console.log(`\nFound ${rawData.length} rows in Excel and ${dbProducts.length} products in Database.\n`);

  let matchedCount = 0;
  let parsedStockCount = 0;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const excelName = row['Nama Produk'] || '';
    const desc = row['Deskripsi Singkat / Informasi Kain'] || '';

    const { colorStocks, colors, totalStock } = parseColorStocksFromText(desc);

    // Try to match with DB product
    const normExcelName = normalizeName(excelName);
    let matchedDb = dbProducts.find(p => normalizeName(p.name) === normExcelName);

    if (!matchedDb) {
      // Try fuzzy matching or contains code like [ 3947AR ]
      const codeMatch = excelName.match(/\[\s*([A-Za-z0-9]+)\s*\]/);
      if (codeMatch) {
        const code = codeMatch[1].toLowerCase();
        matchedDb = dbProducts.find(p => p.name.toLowerCase().includes(code));
      }
    }

    if (!matchedDb) {
      // Try checking if db product name is a substring of excel name or vice versa
      matchedDb = dbProducts.find(p => {
        const normDb = normalizeName(p.name);
        return normExcelName.includes(normDb) || normDb.includes(normExcelName);
      });
    }

    if (matchedDb) {
      matchedCount++;
    } else {
      console.log(`\n❌ UNMATCHED ROW ${i + 1}: "${excelName}"`);
      console.log(`   Desc: "${desc.replace(/\n/g, ' ')}"`);
    }

    if (colors.length > 0) {
      parsedStockCount++;
    }
  }

  console.log('='.repeat(60));
  console.log(`ANALYSIS SUMMARY:`);
  console.log(`Total Excel Rows: ${rawData.length}`);
  console.log(`Matched to DB: ${matchedCount} / ${rawData.length}`);
  console.log(`Parsed ColorStocks Successfully: ${parsedStockCount} / ${rawData.length}`);
  console.log('='.repeat(60));

  await prisma.$disconnect();
  await pool.end();
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
