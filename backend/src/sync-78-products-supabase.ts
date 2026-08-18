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

function normalizeCategory(folderCat: string, title: string): string {
  const t = title.toLowerCase();
  const f = folderCat.toLowerCase();

  if (f.includes('panel a') || t.includes('grade a')) return 'Grade A';
  if (f.includes('panel b') || t.includes('grade b')) return 'Grade B';
  if (f.includes('tulle') || t.includes('tile')) return 'Tulle';
  if (t.includes('greige')) return 'Greige';

  return 'Grade B';
}

async function uploadLocalFileToSupabase(localFilePath: string, destFileName: string): Promise<string | null> {
  try {
    if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size === 0) {
      return null;
    }

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
  console.log('🚀 MEMULAI SINKRONISASI DATABASE SUPABASE BERSIH 100%');
  console.log('========================================================');

  // STEP 1: HAPUS SEMUA DATA LAMA
  console.log('\n🧹 [1/4] Mengosongkan data lama di Supabase Database...');
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  const deletedCount = await prisma.product.deleteMany({});
  console.log(`✅ Berhasil menghapus ${deletedCount.count} produk lama.`);

  // STEP 2: SCAN FOLDER PRODUK
  console.log('\n📂 [2/4] Membaca folder produk di hasil_scraping...');
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

  console.log(`📦 Terdeteksi total ${productFolders.length} folder produk.`);

  // STEP 3: UPLOAD DAN SINKRONISASI
  console.log('\n☁️ [3/4] Mengonversi ke WebP, mengunggah thumbnail & varian warna...');

  let successCount = 0;

  for (let i = 0; i < productFolders.length; i++) {
    const item = productFolders[i];
    const rawJson = fs.readFileSync(item.metadataPath, 'utf-8');
    const meta = JSON.parse(rawJson);

    const formattedTitle = meta.title || item.folderName;
    const productCode = meta.code || `PRD-${i + 1}`;
    const category = normalizeCategory(item.catName, formattedTitle);
    const price = meta.regular_price || 150000;
    const discountPrice = meta.sale_price || null;
    const cleanDescription = meta.clean_description || "Kain Brukat Premium berkualitas tinggi.";

    console.log(`\n[${i + 1}/${productFolders.length}] Memproses: ${formattedTitle.substring(0, 45)}... (Kode: ${productCode})`);

    const galleryImages: string[] = [];
    const colorNames: string[] = [];
    const colorStocks: Record<string, number> = {};
    const colorImages: Record<string, string> = {};
    let primaryImageUrl = "";

    // 1. Upload Thumbnail Utama (Featured Image #1)
    if (meta.thumbnail_file) {
      const thumbPath = path.join(item.fullPath, meta.thumbnail_file);
      const destThumbName = `${sanitizeFilename(formattedTitle)}_thumb`;
      const uploadedThumb = await uploadLocalFileToSupabase(thumbPath, destThumbName);
      if (uploadedThumb) {
        primaryImageUrl = uploadedThumb;
        galleryImages.push(uploadedThumb);
        console.log(`  ⭐ [THUMBNAIL] Diunggah -> ${uploadedThumb.split('/').pop()}`);
      }
    }

    // 2. Upload Detail Motif (Masuk ke Galeri)
    if (Array.isArray(meta.detail_files)) {
      for (let dIdx = 0; dIdx < meta.detail_files.length; dIdx++) {
        const dFile = meta.detail_files[dIdx];
        const dPath = path.join(item.fullPath, dFile);
        const destDetailName = `${sanitizeFilename(formattedTitle)}_detail_${dIdx + 1}`;
        const uploadedDetail = await uploadLocalFileToSupabase(dPath, destDetailName);
        if (uploadedDetail) {
          galleryImages.push(uploadedDetail);
          console.log(`  🔍 [DETAIL] Diunggah -> ${uploadedDetail.split('/').pop()}`);
        }
      }
    }

    // 3. Upload Varian Warna Asli
    if (Array.isArray(meta.color_variants)) {
      for (let cIdx = 0; cIdx < meta.color_variants.length; cIdx++) {
        const v = meta.color_variants[cIdx];
        const cPath = path.join(item.fullPath, v.file);
        const destColorName = `${sanitizeFilename(formattedTitle)}_color_${sanitizeFilename(v.color_name)}_${cIdx + 1}`;
        const uploadedColor = await uploadLocalFileToSupabase(cPath, destColorName);

        if (uploadedColor) {
          galleryImages.push(uploadedColor);
          if (!colorNames.includes(v.color_name)) {
            colorNames.push(v.color_name);
          }
          colorImages[v.color_name] = uploadedColor;
          colorStocks[v.color_name] = v.stock || 100;
          console.log(`  🎨 [WARNA] ${v.color_name} (Stok: ${v.stock}) -> ${uploadedColor.split('/').pop()}`);
        }
      }
    }

    // Fallback hero
    if (!primaryImageUrl && galleryImages.length > 0) {
      primaryImageUrl = galleryImages[0];
    }

    // Total stock
    const totalStock = Object.values(colorStocks).reduce((sum, n) => sum + n, 0) || 100;

    await prisma.product.create({
      data: {
        name: formattedTitle,
        code: productCode,
        price: price,
        discountPrice: discountPrice,
        category: category,
        description: cleanDescription,
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
    console.log(`  ✅ [${successCount}] DB OK: Thumbnail: ${primaryImageUrl ? 'Ada' : 'Kosong'}, Galeri: ${galleryImages.length} foto, Warna: [${colorNames.join(', ')}]`);
  }

  // STEP 4: VERIFIKASI AKHIR
  console.log('\n========================================================');
  const finalCount = await prisma.product.count();
  console.log(`🎉 SINKRONISASI DATABASE BERHASIL 100%!`);
  console.log(`📊 Total Produk Aktif di Supabase DB: ${finalCount} PRODUK`);
  console.log('========================================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
