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

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase().substring(0, 50);
}

function extractCode(str: string): string | null {
  const match = str.match(/KODE\s*\[?\s*([0-9A-Za-z]+)\s*\]?/i);
  return match ? match[1].toUpperCase() : null;
}

function cleanTitle(titleStr: string): string {
  if (!titleStr) return "Brukat Premium Eksklusif";

  let cleaned = titleStr
    .replace(/^https?:\/\/[^\s]+/i, '')
    .replace(/Your connection was interrupted/i, '')
    .replace(/rajabrukat\.com/i, '')
    .trim();

  // Normalize hyphens and multiple spaces
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ').trim();
  return cleaned;
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

function normalizeCategory(folderCat: string, title: string): string {
  const t = title.toLowerCase();
  const f = folderCat.toLowerCase();

  if (f.includes('panel a') || t.includes('grade a')) return 'Panel A';
  if (f.includes('panel b') || t.includes('grade b')) return 'Panel B';
  if (f.includes('tulle') || t.includes('tulle') || t.includes('tile')) return 'Tulle';
  if (t.includes('greige')) return 'Greige';

  return 'Panel B';
}

async function uploadLocalFileToSupabase(localFilePath: string, destFileName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);

    const webpBuffer = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const webpDestFileName = destFileName.replace(/\.[^/.]+$/, "") + ".webp";

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(webpDestFileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error(`  Upload error for ${webpDestFileName}:`, error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(webpDestFileName);

    return publicData.publicUrl;
  } catch (err: any) {
    console.error(`  Failed to convert/upload ${localFilePath}:`, err?.message || err);
    return null;
  }
}

async function main() {
  console.log('========================================================');
  console.log('🚀 MEMULAI PROSES RESET DATABASE & IMPORT 78 PRODUK BERSIH');
  console.log('========================================================');

  // STEP 1: HAPUS SEMUA DATA LAMA AGAR TIDAK ADA DUPLIKAT
  console.log('\n🧹 [1/4] Mengosongkan data lama di Supabase Database...');
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  const deletedCount = await prisma.product.deleteMany({});
  console.log(`✅ Berhasil menghapus ${deletedCount.count} produk lama. Database kini 100% bersih!`);

  // STEP 2: SCAN SEMUA FOLDER PRODUK DARI HASIL_SCRAPING
  console.log('\n📂 [2/4] Membaca seluruh folder produk di hasil_scraping...');
  const categories = ['Panel A Grade', 'Panel B Grade', 'Tulle'];
  const productFolders: { catName: string; folderName: string; fullPath: string; metadataPath: string }[] = [];

  categories.forEach(cat => {
    const catPath = path.join(SCRAPED_DIR, cat);
    if (!fs.existsSync(catPath)) return;
    const folders = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory());
    folders.forEach(f => {
      const fullPath = path.join(catPath, f);
      const metaPath = path.join(fullPath, 'metadata.json');
      if (fs.existsSync(metaPath)) {
        productFolders.push({ catName: cat, folderName: f, fullPath, metadataPath: metaPath });
      }
    });
  });

  console.log(`📦 Terdeteksi total ${productFolders.length} folder produk valid.`);

  // STEP 3: PROSES SETIAP PRODUK & UPLOAD FOTO KE SUPABASE
  console.log('\n☁️ [3/4] Mengonversi ke WebP, mengunggah ke Supabase Storage, & menyusun database...');

  let successCount = 0;

  for (let i = 0; i < productFolders.length; i++) {
    const item = productFolders[i];
    const rawJson = fs.readFileSync(item.metadataPath, 'utf-8');
    const data = JSON.parse(rawJson);

    const rawTitle = data.title || item.folderName;
    const formattedTitle = cleanTitle(rawTitle);
    const productCode = extractCode(formattedTitle) || extractCode(item.folderName) || `PRD-${i + 1}`;
    const category = normalizeCategory(item.catName, formattedTitle);
    const { price, discountPrice } = parsePriceString(data.price || "");

    const infoKain = data.short_description || data.description || "";
    const descLengkap = data.full_description || "";
    const combinedDescription = [
      infoKain ? `${infoKain.trim()}` : "",
      descLengkap ? `\n\n--- KETERANGAN LENGKAP & SPESIFIKASI ---\n${descLengkap.trim()}` : ""
    ].filter(Boolean).join("");

    console.log(`\n[${i + 1}/${productFolders.length}] Memproses: ${formattedTitle.substring(0, 45)}... (Kode: ${productCode})`);

    // Scan all local images in folder
    const allFiles = fs.readdirSync(item.fullPath);
    const imageFiles = allFiles.filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));

    const galleryImages: string[] = [];
    const colorNames: string[] = [];
    const colorStocks: Record<string, number> = {};
    const colorImages: Record<string, string> = {};

    // Determine primary/hero image
    const heroImageFile = imageFiles.find(f => /manekin|gambar utama/i.test(f)) || imageFiles[0];

    // Upload hero image first
    let primaryImageUrl = "";
    if (heroImageFile) {
      const heroPath = path.join(item.fullPath, heroImageFile);
      const destHeroName = `${sanitizeFilename(formattedTitle)}_hero`;
      const uploadedHero = await uploadLocalFileToSupabase(heroPath, destHeroName);
      if (uploadedHero) {
        primaryImageUrl = uploadedHero;
        galleryImages.push(uploadedHero);
      }
    }

    // Process variant colors from metadata and files
    const variantFiles = imageFiles.filter(f => f !== heroImageFile);

    for (let fIdx = 0; fIdx < variantFiles.length; fIdx++) {
      const vFile = variantFiles[fIdx];
      const vPath = path.join(item.fullPath, vFile);
      let colorName = path.parse(vFile).name.replace(/[-_]/g, ' ').replace(/scaled|copy/gi, '').trim();
      if (/manekin|gambar utama|chatgpt/i.test(colorName)) {
        colorName = `Detail Motif ${fIdx + 1}`;
      } else {
        colorName = colorName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
      }

      const destVariantName = `${sanitizeFilename(formattedTitle)}_${sanitizeFilename(colorName)}_${fIdx + 1}`;
      const uploadedVariant = await uploadLocalFileToSupabase(vPath, destVariantName);

      if (uploadedVariant) {
        galleryImages.push(uploadedVariant);
        if (!colorNames.includes(colorName)) {
          colorNames.push(colorName);
        }
        colorStocks[colorName] = 100;
        colorImages[colorName] = uploadedVariant;
      }
    }

    // Fallback if no specific hero found
    if (!primaryImageUrl && galleryImages.length > 0) {
      primaryImageUrl = galleryImages[0];
    }

    // If colorNames still empty, check available_colors from metadata
    if (colorNames.length === 0 && Array.isArray(data.available_colors)) {
      data.available_colors.forEach((cStr: string) => {
        const m = cStr.match(/^([A-Z\s]+)\s*:\s*(\d+)/i);
        if (m) {
          const cName = m[1].trim();
          colorNames.push(cName);
          colorStocks[cName] = parseInt(m[2]) || 100;
        }
      });
    }

    // Calculate total stock
    const totalStock = Object.values(colorStocks).reduce((sum, n) => sum + n, 0) || 100;

    await prisma.product.create({
      data: {
        name: formattedTitle,
        code: productCode,
        price: price,
        discountPrice: discountPrice,
        category: category,
        description: combinedDescription || "Kain Brukat Premium berkualitas tinggi.",
        image: primaryImageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
        galleryImages: galleryImages,
        colors: colorNames,
        colorStocks: colorStocks,
        colorImages: colorImages,
        stock: totalStock,
        weight: 500,
        isActive: true,
      }
    });

    successCount++;
    console.log(`  ✅ [${successCount}] Berhasil diimpor ke DB (${galleryImages.length} foto, ${colorNames.length} warna, total stok: ${totalStock})`);
  }

  // STEP 4: VERIFIKASI AKHIR
  console.log('\n========================================================');
  const finalCount = await prisma.product.count();
  console.log(`🎉 SINKRONISASI SELESAI 100%!`);
  console.log(`📊 Total Produk Aktif di Supabase DB: ${finalCount} PRODUK`);
  console.log('========================================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Error saat sinkronisasi:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
