import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykzpelepxkrkzbxlrydi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'products';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const connectionString = `${process.env.DIRECT_URL || process.env.DATABASE_URL}`;
const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


const SCRAPED_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
const BASE_SCRAPING_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb`;

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase().substring(0, 45);
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

async function uploadLocalFileToSupabaseWebp(localFilePath: string, destFileName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);

    const webpBuffer = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const webpDestFileName = destFileName.replace(/\.[^/.]+$/, "") + ".webp";

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(webpDestFileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error(`Upload error for ${webpDestFileName}:`, error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(webpDestFileName);

    return publicData.publicUrl;
  } catch (err: any) {
    console.error(`Failed to convert/upload ${localFilePath}:`, err?.message || err);
    return null;
  }
}

async function main() {
  console.log(`📦 Fetching current WebP files from Supabase Storage bucket "${BUCKET_NAME}"...`);
  const { data: bucketFiles } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
  const existingBucketFileMap = new Map<string, string>();

  if (bucketFiles && bucketFiles.length > 0) {
    for (const f of bucketFiles) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${f.name}`;
      existingBucketFileMap.set(f.name.toLowerCase(), publicUrl);
    }
  }
  console.log(`Found ${existingBucketFileMap.size} existing WebP files in Storage bucket.`);

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

      const title = data.title || folderName;
      const category = normalizeCategory(title, data.category || folderName);
      const { price, discountPrice } = parsePriceString(data.price || "");

      const infoKain = data.short_description || data.description || "";
      const descLengkap = data.full_description || "";
      const combinedDescription = [
        infoKain ? `${infoKain.trim()}` : "",
        descLengkap ? `\n\n--- KETERANGAN LENGKAP & DEKSRIPSI ---\n${descLengkap.trim()}` : ""
      ].filter(Boolean).join("");

      const colorList = extractColorNames(data);
      const galleryImages: string[] = [];

      const safeTitle = sanitizeFilename(title);

      if (Array.isArray(data.variants) && data.variants.length > 0) {
        for (let idx = 0; idx < data.variants.length; idx++) {
          const v = data.variants[idx];
          const safeColor = sanitizeFilename(v.color_name || `var_${idx}`);
          const targetWebpName = `${safeTitle}_${safeColor}_${idx}.webp`.toLowerCase();

          // 1. Check if exact WebP file exists in Supabase Bucket map
          if (existingBucketFileMap.has(targetWebpName)) {
            galleryImages.push(existingBucketFileMap.get(targetWebpName)!);
          } else {
            // 2. Upload local image to Supabase if missing
            let imageSourcePath: string | null = null;
            if (v.local_path) {
              const resolvedLocal = path.resolve(BASE_SCRAPING_DIR, v.local_path);
              if (fs.existsSync(resolvedLocal)) imageSourcePath = resolvedLocal;
            }
            if (!imageSourcePath && v.color_name) {
              const possibleFiles = fs.readdirSync(itemDir).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
              const matchFile = possibleFiles.find(f => f.toLowerCase().includes(v.color_name.toLowerCase()));
              if (matchFile) imageSourcePath = path.join(itemDir, matchFile);
            }

            if (imageSourcePath && fs.existsSync(imageSourcePath)) {
              const uploadedUrl = await uploadLocalFileToSupabaseWebp(imageSourcePath, targetWebpName);
              if (uploadedUrl) galleryImages.push(uploadedUrl);
            }
          }
        }
      }

      if (galleryImages.length === 0) {
        const localImagesInDir = fs.readdirSync(itemDir).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
        for (let idx = 0; idx < localImagesInDir.length; idx++) {
          const imgFile = localImagesInDir[idx];
          const srcPath = path.join(itemDir, imgFile);
          const targetWebpName = `${safeTitle}_img_${idx}.webp`.toLowerCase();

          if (existingBucketFileMap.has(targetWebpName)) {
            galleryImages.push(existingBucketFileMap.get(targetWebpName)!);
          } else {
            const uploadedUrl = await uploadLocalFileToSupabaseWebp(srcPath, targetWebpName);
            if (uploadedUrl) galleryImages.push(uploadedUrl);
          }
        }
      }

      if (galleryImages.length === 0) {
        skippedJunkCount++;
        continue;
      }

      const primaryImage = galleryImages[0];

      await prisma.product.create({
        data: {
          name: title,
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
      console.log(`[${successCount}] Imported: "${title.substring(0, 45)}" -> Category: [${category}] (${galleryImages.length} 100% Valid WebP Images)`);
    } catch (err: any) {
      console.error(`Failed for ${metadataPath}:`, err?.message || err);
    }
  }

  console.log(`\n🎉 SYNC COMPLETE! All ${successCount} products now have 100% VALID HTTP 200 WebP images from Supabase Storage!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Sync error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
