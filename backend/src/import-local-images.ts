import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCRAPED_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
const BASE_SCRAPING_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb`;
const PUBLIC_UPLOADS_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\rajabrukat_web\\frontend\\public\\uploads\\products`;

// Ensure uploads directory exists
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase().substring(0, 60);
}

function parsePriceString(priceStr: string): { price: number; discountPrice: number | null } {
  if (!priceStr) return { price: 150000, discountPrice: null };

  const matches = priceStr.match(/Rp\s*([\d\.,]+)/gi);
  if (!matches || matches.length === 0) return { price: 150000, discountPrice: null };

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

  return { price: 150000, discountPrice: null };
}

function extractColorNames(json: any): string[] {
  const colors = new Set<string>();

  if (Array.isArray(json.variants)) {
    for (const v of json.variants) {
      if (v.color_name) {
        if (v.color_name.length < 40 && !v.color_name.includes("KODE")) {
          colors.add(v.color_name.trim());
        }
      }
    }
  }

  if (colors.size === 0 && Array.isArray(json.available_colors)) {
    for (const c of json.available_colors) {
      if (typeof c === 'string') {
        const namePart = c.split(':')[0].trim();
        if (namePart && namePart.length < 40) {
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

async function main() {
  console.log(`📁 Target local uploads folder: ${PUBLIC_UPLOADS_DIR}`);
  console.log(`🔍 Scanning metadata files in: ${SCRAPED_DIR}...`);
  const metadataPaths = findMetadataFiles(SCRAPED_DIR);
  console.log(`📦 Found ${metadataPaths.length} product metadata files.`);

  if (metadataPaths.length === 0) {
    console.log("No metadata.json files found. Exiting...");
    process.exit(0);
  }

  console.log("Wiping existing database products & dependencies...");
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("Database wiped clean.");

  let successCount = 0;
  let totalCopiedImages = 0;

  for (let i = 0; i < metadataPaths.length; i++) {
    const metadataPath = metadataPaths[i];
    const itemDir = path.dirname(metadataPath);

    try {
      const rawJson = fs.readFileSync(metadataPath, 'utf-8');
      const data = JSON.parse(rawJson);

      const title = data.title || path.basename(itemDir);
      const category = data.category || "Brukat Tile";
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
          let imageSourcePath: string | null = null;

          // 1. Try local_path from JSON
          if (v.local_path) {
            const resolvedLocal = path.resolve(BASE_SCRAPING_DIR, v.local_path);
            if (fs.existsSync(resolvedLocal)) {
              imageSourcePath = resolvedLocal;
            }
          }

          // 2. Try looking in folder directly by color_name
          if (!imageSourcePath && v.color_name) {
            const possibleFiles = fs.readdirSync(itemDir).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
            const matchFile = possibleFiles.find(f => f.toLowerCase().includes(v.color_name.toLowerCase()));
            if (matchFile) {
              imageSourcePath = path.join(itemDir, matchFile);
            }
          }

          // 3. If image source path exists, copy it to frontend/public/uploads/products
          if (imageSourcePath && fs.existsSync(imageSourcePath)) {
            const ext = path.extname(imageSourcePath) || '.png';
            const safeColor = sanitizeFilename(v.color_name || `var_${idx}`);
            const destFilename = `${safeTitle}_${safeColor}_${idx}${ext}`;
            const destFullPath = path.join(PUBLIC_UPLOADS_DIR, destFilename);

            fs.copyFileSync(imageSourcePath, destFullPath);
            totalCopiedImages++;

            // Web URL path
            const webPath = `/uploads/products/${destFilename}`;
            galleryImages.push(webPath);
          } else if (v.image_url && v.image_url.startsWith("http")) {
            // Fallback to online image URL if local file is missing
            galleryImages.push(v.image_url);
          }
        }
      }

      // If no images were copied/found in folder, fallback to any image file in folder
      if (galleryImages.length === 0) {
        const localImagesInDir = fs.readdirSync(itemDir).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
        for (let idx = 0; idx < localImagesInDir.length; idx++) {
          const imgFile = localImagesInDir[idx];
          const srcPath = path.join(itemDir, imgFile);
          const ext = path.extname(imgFile) || '.png';
          const destFilename = `${safeTitle}_img_${idx}${ext}`;
          const destFullPath = path.join(PUBLIC_UPLOADS_DIR, destFilename);

          fs.copyFileSync(srcPath, destFullPath);
          totalCopiedImages++;

          galleryImages.push(`/uploads/products/${destFilename}`);
        }
      }

      const primaryImage = galleryImages.length > 0 ? galleryImages[0] : "/images/brukat_tile_mutiara.png";

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
      console.log(`[${successCount}/${metadataPaths.length}] Imported with ${galleryImages.length} local images: ${title.substring(0, 45)}...`);
    } catch (err: any) {
      console.error(`Failed to import ${metadataPath}:`, err?.message || err);
    }
  }

  console.log(`\n🎉 SUCCESS! Successfully imported ${successCount} products and copied ${totalCopiedImages} LOCAL IMAGE FILES into frontend/public/uploads/products!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Local import error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
