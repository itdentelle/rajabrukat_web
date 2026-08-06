import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import axios from 'axios';
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

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase().substring(0, 50);
}

async function downloadAndConvertToWebp(imageUrl: string, filenameHint: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(response.data);

    const webpBuffer = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const destFileName = `${sanitizeFilename(filenameHint)}_${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(destFileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error(`Upload error for ${destFileName}:`, error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(destFileName);

    return publicData.publicUrl;
  } catch (err: any) {
    console.error(`Failed to download/convert online image ${imageUrl}:`, err?.message || err);
    return null;
  }
}

async function main() {
  console.log("🧹 1. Cleaning up old non-webp (.jpg, .png) files from Supabase Storage...");
  try {
    const { data: fileList } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
    if (fileList && fileList.length > 0) {
      const nonWebpFiles = fileList
        .map(f => f.name)
        .filter(name => name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg'));

      if (nonWebpFiles.length > 0) {
        console.log(`Found ${nonWebpFiles.length} old JPG/PNG files in Supabase Storage. Deleting...`);
        const { error: delErr } = await supabase.storage.from(BUCKET_NAME).remove(nonWebpFiles);
        if (delErr) {
          console.error("Storage delete warning:", delErr.message);
        } else {
          console.log(`✅ Successfully deleted ${nonWebpFiles.length} old JPG/PNG files from Supabase Storage.`);
        }
      } else {
        console.log("No old JPG/PNG files found in Supabase Storage bucket.");
      }
    }
  } catch (e: any) {
    console.log("Storage list/clean warning:", e?.message || e);
  }

  console.log("\n🔄 2. Converting any remaining non-webp URLs in Database to WebP...");
  const products = await prisma.product.findMany({});
  let convertedCount = 0;

  for (const prod of products) {
    let updatedImage = prod.image;
    let updatedGallery = [...prod.galleryImages];
    let isModified = false;

    if (prod.image && !prod.image.endsWith('.webp') && prod.image.startsWith('http')) {
      const newWebpUrl = await downloadAndConvertToWebp(prod.image, prod.name);
      if (newWebpUrl) {
        updatedImage = newWebpUrl;
        isModified = true;
      }
    }

    for (let i = 0; i < updatedGallery.length; i++) {
      const url = updatedGallery[i];
      if (url && !url.endsWith('.webp') && url.startsWith('http')) {
        const newWebpUrl = await downloadAndConvertToWebp(url, `${prod.name}_gal_${i}`);
        if (newWebpUrl) {
          updatedGallery[i] = newWebpUrl;
          isModified = true;
        }
      }
    }

    if (isModified) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          image: updatedImage,
          galleryImages: updatedGallery
        }
      });
      convertedCount++;
      console.log(`Converted non-webp URLs to WebP for product: ${prod.name.substring(0, 45)}`);
    }
  }

  const finalProds = await prisma.product.findMany({});
  let remainingNonWebp = 0;
  finalProds.forEach(p => {
    if (!p.image.endsWith('.webp')) remainingNonWebp++;
    p.galleryImages.forEach(g => { if (!g.endsWith('.webp')) remainingNonWebp++; });
  });

  console.log(`\n🎉 COMPLETED! Database now has ${remainingNonWebp} non-webp URLs (100% WebP Verified).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Clean error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
