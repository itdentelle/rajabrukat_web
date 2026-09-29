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
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCRAPED_DIR = `C:\\Users\\DWIKY SUMARLIN\\Documents\\PORTOFOLIO\\web-scrapping-rb\\hasil_scraping`;
const BACKEND_URL = `http://localhost:5000`;

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

function getDirectScrapedUrl(metadataPath: string, localOrVariantPath: string): string {
  let relPath = "";
  if (localOrVariantPath) {
    const normalized = localOrVariantPath.replace(/\\/g, '/');
    if (normalized.includes("hasil_scraping/")) {
      relPath = normalized.split("hasil_scraping/")[1];
    } else {
      relPath = normalized;
    }
  }

  if (!relPath) {
    const folderRel = path.relative(SCRAPED_DIR, metadataPath);
    relPath = path.dirname(folderRel).replace(/\\/g, '/');
  }

  const encodedSegments = relPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${BACKEND_URL}/scraped-images/${encodedSegments}`;
}

async function main() {
  console.log(`📁 Direct reading from scraping folder: ${SCRAPED_DIR}...`);
  const metadataPaths = findMetadataFiles(SCRAPED_DIR);
  console.log(`📦 Found ${metadataPaths.length} product metadata files.`);

  if (metadataPaths.length === 0) {
    console.log("No metadata.json files found. Exiting...");
    process.exit(0);
  }

  console.log("Cleaning product database...");
  await prisma.product.deleteMany({});
  console.log("Database products wiped.");

  let successCount = 0;
  let totalDirectImages = 0;

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

      if (Array.isArray(data.variants) && data.variants.length > 0) {
        for (const v of data.variants) {
          if (v.local_path) {
            const url = getDirectScrapedUrl(metadataPath, v.local_path);
            galleryImages.push(url);
            totalDirectImages++;
          } else if (v.image_url && v.image_url.startsWith("http")) {
            galleryImages.push(v.image_url);
          }
        }
      }

      if (galleryImages.length === 0) {
        const localImagesInDir = fs.readdirSync(itemDir).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
        for (const imgFile of localImagesInDir) {
          const fullImgPath = path.join(itemDir, imgFile);
          const url = getDirectScrapedUrl(metadataPath, fullImgPath);
          galleryImages.push(url);
          totalDirectImages++;
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
      console.log(`[${successCount}/${metadataPaths.length}] Linked directly: ${title.substring(0, 45)}...`);
    } catch (err: any) {
      console.error(`Failed to import ${metadataPath}:`, err?.message || err);
    }
  }

  console.log(`\n🎉 SUCCESS! Linked ${successCount} products directly to ${totalDirectImages} images in your ${SCRAPED_DIR} directory (zero files copied)!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Direct import error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
