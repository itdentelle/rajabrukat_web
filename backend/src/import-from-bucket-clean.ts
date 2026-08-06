import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykzpelepxkrkzbxlrydi.supabase.co';
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'products';

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

const SCRAPED_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
const BASE_SCRAPING_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb`;

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase().substring(0, 50);
}

function cleanTitle(titleStr: string): string {
  if (!titleStr) return "Brukat Premium Eksklusif";

  let cleaned = titleStr
    .replace(/^https?:\/\/[^\s]+/i, '')
    .replace(/Your connection was interrupted/i, '')
    .replace(/rajabrukat\.com/i, '')
    .trim();

  if (!cleaned || cleaned.length < 4) {
    return "";
  }

  cleaned = cleaned.replace(/\s*–\s*(BUSANA PESTA|GAUN PENGANTIN|FASHION MODERN|KEBAYA MODERN|BUSANA MEWAH|EKSKLUSIF BRUKAT|MEWAH|GRADE A|GRADE B)\s*/gi, '');

  return cleaned.trim();
}

function normalizeCategory(title: string, rawCat: string): string {
  const combined = (title + " " + rawCat).toLowerCase();

  if (combined.includes("chantilly")) return "Renda Chantilly";
  if (combined.includes("cornely")) return "Cornely 3D";
  if (combined.includes("satin") || combined.includes("furing")) return "Silk & Satin";
  if (combined.includes("tile") || combined.includes("mutiara")) return "Brukat Tile Mutiara";
  if (combined.includes("grade a") || combined.includes("panel a")) return "Grade A";
  if (combined.includes("grade b") || combined.includes("panel b")) return "Grade B";
  if (combined.includes("tulle")) return "Tulle";

  return "Brukat Tile Mutiara";
}

function parsePriceString(priceStr: string): { price: number; discountPrice: number | null } {
  if (!priceStr) return { price: 185000, discountPrice: null };

  const matches = priceStr.match(/Rp\s*([\d\.,]+)/gi);
  if (!matches || matches.length === 0) return { price: 185000, discountPrice: null };

  const numbers = matches.map(m => {
    const clean = m.replace(/Rp\s*/i, '').replace(/\./g, '').replace(/,/g, '');
    return parseFloat(clean);
  }).filter(n => !isNaN(n) && n > 0);

  if (numbers.length >= 2) {
    const originalPrice = Math.max(...numbers);
    const promoPrice = Math.min(...numbers);
    return {
      price: originalPrice,
      discountPrice: promoPrice < originalPrice ? promoPrice : null
    };
  } else if (numbers.length === 1) {
    return {
      price: numbers[0],
      discountPrice: null
    };
  }

  return { price: 185000, discountPrice: null };
}

function extractColorNames(json: any): string[] {
  const colors = new Set<string>();

  if (Array.isArray(json.variants)) {
    for (const v of json.variants) {
      if (v.color_name) {
        const cName = v.color_name.trim();
        if (cName.length < 35 && !cName.includes("KODE") && !cName.includes("http") && !cName.includes("PANEL")) {
          colors.add(cName);
        }
      }
    }
  }

  if (colors.size === 0 && Array.isArray(json.available_colors)) {
    for (const c of json.available_colors) {
      if (typeof c === 'string') {
        const namePart = c.split(':')[0].trim();
        if (namePart && namePart.length < 35) {
          colors.add(namePart);
        }
      }
    }
  }

  return Array.from(colors);
}

function findMetadataFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findMetadataFiles(filePath, fileList);
    } else if (file === 'metadata.json') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function getBucketWebpUrl(destFileName: string): string {
  const webpFileName = destFileName.replace(/\.[^/.]+$/, "") + ".webp";
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${webpFileName}`;
}

async function main() {
  console.log(`☁️ Reading WebP image URLs directly from Supabase Storage Bucket: "${BUCKET_NAME}"`);
  console.log(`🔍 Scanning metadata files in: ${SCRAPED_DIR}...`);
  const metadataPaths = findMetadataFiles(SCRAPED_DIR);
  console.log(`📦 Found ${metadataPaths.length} metadata files.`);

  console.log("Wiping existing database products...");
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("Database wiped clean.");

  let successCount = 0;
  let skippedJunkCount = 0;

  for (let i = 0; i < metadataPaths.length; i++) {
    const metadataPath = metadataPaths[i];
    const itemDir = path.dirname(metadataPath);
    const folderName = path.basename(itemDir);

    if (
      folderName.includes("Your connection was interrupted") ||
      folderName.includes("rajabrukat.com") ||
      folderName.length < 4
    ) {
      skippedJunkCount++;
      continue;
    }

    try {
      const rawJson = fs.readFileSync(metadataPath, 'utf-8');
      const data = JSON.parse(rawJson);

      const rawTitle = data.title || folderName;
      const formattedTitle = cleanTitle(rawTitle);

      if (!formattedTitle) {
        skippedJunkCount++;
        continue;
      }

      const category = normalizeCategory(formattedTitle, data.category || folderName);
      const { price, discountPrice } = parsePriceString(data.price || "");

      const infoKain = data.short_description || data.description || "";
      const descLengkap = data.full_description || "";
      const combinedDescription = [
        infoKain ? `${infoKain.trim()}` : "",
        descLengkap ? `\n\n--- KETERANGAN LENGKAP & DEKSRIPSI ---\n${descLengkap.trim()}` : ""
      ].filter(Boolean).join("");

      const colorList = extractColorNames(data);
      const galleryImages: string[] = [];
      const safeTitle = sanitizeFilename(formattedTitle);

      if (Array.isArray(data.variants) && data.variants.length > 0) {
        for (let idx = 0; idx < data.variants.length; idx++) {
          const v = data.variants[idx];
          const safeColor = sanitizeFilename(v.color_name || `var_${idx}`);
          const destFilename = `${safeTitle}_${safeColor}_${idx}.webp`;

          const bucketUrl = getBucketWebpUrl(destFilename);
          galleryImages.push(bucketUrl);
        }
      }

      if (galleryImages.length === 0) {
        const localImagesInDir = fs.readdirSync(itemDir).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
        for (let idx = 0; idx < localImagesInDir.length; idx++) {
          const destFilename = `${safeTitle}_img_${idx}.webp`;
          const bucketUrl = getBucketWebpUrl(destFilename);
          galleryImages.push(bucketUrl);
        }
      }

      if (galleryImages.length === 0) {
        skippedJunkCount++;
        continue;
      }

      const primaryImage = galleryImages[0];

      await prisma.product.create({
        data: {
          name: formattedTitle,
          price: price,
          discountPrice: discountPrice,
          category: category,
          description: combinedDescription || "Kain Brukat Premium berkualitas tinggi.",
          image: primaryImage,
          galleryImages: galleryImages,
          colors: colorList,
          stock: 100,
          weight: 400,
          isActive: true,
        }
      });

      successCount++;
      console.log(`[${successCount}] Imported: "${formattedTitle.substring(0, 45)}" -> Category: [${category}] (${galleryImages.length} Bucket WebP Images)`);
    } catch (err: any) {
      console.error(`Failed for ${metadataPath}:`, err?.message || err);
    }
  }

  console.log(`\n🎉 INSTANT RE-IMPORT COMPLETE! Successfully linked ${successCount} clean products to Supabase Storage Bucket images in PostgreSQL Database!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Bucket import error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
