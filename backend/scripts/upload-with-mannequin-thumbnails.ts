import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykzpelepxkrkzbxlrydi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'products';

if (!SUPABASE_KEY) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY di file backend/.env masih kosong!");
  process.exit(1);
}

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

const SCRAPED_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
const BASE_SCRAPING_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb`;

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase().substring(0, 45);
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

  return cleaned.trim();
}

function normalizeCategory(title: string, rawCat: string, folderPath: string): string {
  const normalizedPath = folderPath.replace(/\\/g, '/');
  if (normalizedPath.includes("Panel A Grade")) return "Grade A";
  if (normalizedPath.includes("Panel B Grade")) return "Grade B";
  if (normalizedPath.includes("Tulle")) return "Tulle";

  const combined = (title + " " + rawCat).toLowerCase();
  if (combined.includes("grade a") || combined.includes("panel a")) return "Grade A";
  if (combined.includes("grade b") || combined.includes("panel b")) return "Grade B";
  if (combined.includes("tulle")) return "Tulle";

  return "Grade A";
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
  console.log(`☁️ Connected to Supabase Storage Bucket: "${BUCKET_NAME}"`);

  // Ensure Bucket is Public
  try {
    await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
    console.log(`✅ Ensured Supabase Storage Bucket "${BUCKET_NAME}" is PUBLIC.`);
  } catch (e: any) {
    console.log("Bucket update note:", e?.message || e);
  }

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
  let duplicateCount = 0;
  const seenProductKeys = new Set<string>();

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

      // Check for product code or title deduplication key
      const codeMatch = formattedTitle.match(/KODE\s*\[?\s*([A-Za-z0-9]+)\s*\]?/i);
      const prodKey = codeMatch 
        ? `code_${codeMatch[1].toLowerCase()}`
        : formattedTitle.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);

      if (seenProductKeys.has(prodKey)) {
        duplicateCount++;
        console.log(`⚠️ Skipping duplicate product: "${formattedTitle.substring(0, 40)}" (Key: ${prodKey})`);
        continue;
      }
      seenProductKeys.add(prodKey);

      const category = normalizeCategory(formattedTitle, data.category || folderName, metadataPath);
      const { price, discountPrice } = parsePriceString(data.price || "");

      const infoKain = data.short_description || data.description || "";
      const descLengkap = data.full_description || "";
      const combinedDescription = [
        infoKain ? `${infoKain.trim()}` : "",
        descLengkap ? `\n\n--- KETERANGAN LENGKAP & DEKSRIPSI ---\n${descLengkap.trim()}` : ""
      ].filter(Boolean).join("");

      const colorList = extractColorNames(data);
      const safeTitle = sanitizeFilename(formattedTitle);

      // Get all local images in directory
      const localFiles = fs.readdirSync(itemDir).filter(f => 
        f.toLowerCase().endsWith('.png') || 
        f.toLowerCase().endsWith('.jpg') || 
        f.toLowerCase().endsWith('.jpeg')
      );

      // Find Mannequin / Main Image (Gambar Utama)
      const mannequinFile = localFiles.find(f => {
        const lower = f.toLowerCase();
        return lower.includes("utama") || lower.includes("manekin") || lower.includes("thumbnail") || lower.includes("main");
      });

      function getFileHash(filePath: string): string {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          return crypto.createHash('md5').update(fileBuffer).digest('hex');
        } catch {
          return '';
        }
      }

      let primaryImageWebpUrl: string | null = null;
      const galleryImages: string[] = [];
      const uploadedLocalPaths = new Set<string>();
      const uploadedFileHashes = new Set<string>();

      const isDuplicateFile = (filePath: string, filename: string): boolean => {
        const lowerPath = filePath.toLowerCase();
        const lowerBase = filename.toLowerCase();

        if (mannequinFile && lowerBase === mannequinFile.toLowerCase()) return true;
        if (uploadedLocalPaths.has(lowerPath) || uploadedLocalPaths.has(lowerBase)) return true;

        const fileHash = getFileHash(filePath);
        if (fileHash && uploadedFileHashes.has(fileHash)) return true;

        return false;
      };

      const markFileAsUploaded = (filePath: string, filename: string) => {
        uploadedLocalPaths.add(filePath.toLowerCase());
        uploadedLocalPaths.add(filename.toLowerCase());
        const fileHash = getFileHash(filePath);
        if (fileHash) uploadedFileHashes.add(fileHash);
      };

      // 1. If Mannequin image exists, convert & upload it first as Primary Image
      if (mannequinFile) {
        const mannequinPath = path.join(itemDir, mannequinFile);
        markFileAsUploaded(mannequinPath, mannequinFile);
        const destName = `${safeTitle}_thumbnail_mannequin.webp`;
        primaryImageWebpUrl = await uploadLocalFileToSupabaseWebp(mannequinPath, destName);
      }

      // 2. Upload variant images & other detail files
      if (Array.isArray(data.variants) && data.variants.length > 0) {
        for (let idx = 0; idx < data.variants.length; idx++) {
          const v = data.variants[idx];

          // Skip main mannequin thumbnail variant because mannequinFile was already uploaded in Step 1
          if (
            v.is_main_thumbnail || 
            (v.color_name && (v.color_name.toLowerCase().includes("manekin") || v.color_name.toLowerCase().includes("gambar utama")))
          ) {
            continue;
          }

          let imageSourcePath: string | null = null;

          if (v.local_path) {
            const resolvedLocal = path.resolve(BASE_SCRAPING_DIR, v.local_path);
            if (fs.existsSync(resolvedLocal)) imageSourcePath = resolvedLocal;
          }

          if (!imageSourcePath && v.color_name) {
            const matchFile = localFiles.find(f => f.toLowerCase().includes(v.color_name.toLowerCase()));
            if (matchFile) imageSourcePath = path.join(itemDir, matchFile);
          }

          if (imageSourcePath && fs.existsSync(imageSourcePath)) {
            const filename = path.basename(imageSourcePath);
            if (isDuplicateFile(imageSourcePath, filename)) continue;

            markFileAsUploaded(imageSourcePath, filename);

            const safeColor = sanitizeFilename(v.color_name || `var_${idx}`);
            const destName = `${safeTitle}_var_${safeColor}_${idx}.webp`;
            const uploadedUrl = await uploadLocalFileToSupabaseWebp(imageSourcePath, destName);
            if (uploadedUrl && !galleryImages.includes(uploadedUrl)) {
              galleryImages.push(uploadedUrl);
            }
          }
        }
      }

      // 3. Fallback: Upload any remaining un-uploaded local images
      for (let idx = 0; idx < localFiles.length; idx++) {
        const imgFile = localFiles[idx];
        const srcPath = path.join(itemDir, imgFile);
        if (isDuplicateFile(srcPath, imgFile)) continue;

        markFileAsUploaded(srcPath, imgFile);

        const destName = `${safeTitle}_file_${idx}.webp`;
        const uploadedUrl = await uploadLocalFileToSupabaseWebp(srcPath, destName);
        if (uploadedUrl && !galleryImages.includes(uploadedUrl)) {
          galleryImages.push(uploadedUrl);
        }
      }

      if (galleryImages.length === 0 && !primaryImageWebpUrl) {
        skippedJunkCount++;
        continue;
      }

      // Final Primary Image: Priority to Mannequin image, else first gallery item
      const finalPrimaryImage = primaryImageWebpUrl || galleryImages[0];

      await prisma.product.create({
        data: {
          name: formattedTitle,
          price: price,
          discountPrice: discountPrice,
          category: category,
          description: combinedDescription || "Kain Brukat Premium berkualitas tinggi.",
          image: finalPrimaryImage,
          galleryImages: galleryImages,
          colors: colorList,
          stock: 100,
          weight: 400,
          isActive: true,
        }
      });

      successCount++;
      const hasMannequinBadge = Boolean(mannequinFile) ? "👗 MANNEQUIN THUMBNAIL" : "🖼️ VARIANT THUMBNAIL";
      console.log(`[${successCount}] (${hasMannequinBadge}) "${formattedTitle.substring(0, 40)}" -> [${category}] (${galleryImages.length} images)`);
    } catch (err: any) {
      console.error(`Failed for ${metadataPath}:`, err?.message || err);
    }
  }

  console.log(`\n🎉 MANNEQUIN THUMBNAILS IMPORT COMPLETE! Successfully imported ${successCount} products with mannequin thumbnails to Supabase DB & Storage!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Mannequin import error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
