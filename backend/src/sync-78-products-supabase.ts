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
  if (f.includes('tulle') || t.includes('tile')) return 'Tulle';
  if (t.includes('greige')) return 'Greige';

  return 'Panel B';
}

function cleanDescription(shortDesc: string, fullDesc: string): string {
  let combined = ((shortDesc || '') + '\n\n' + (fullDesc || ''));

  // 1. Unescape escaped characters
  combined = combined
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ');

  // 2. Convert HTML tags to clean plaintext / markdown
  combined = combined
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/?(ol|ul|p|div|section|article)[^>]*>/gi, '\n')
    .replace(/<\/?(strong|b|em|i|span|h[1-6])[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]+>/g, '');

  // 3. Clean whitespace and excess blank lines
  const lines = combined.split('\n').map(l => l.trim());
  const cleanLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line && cleanLines.length > 0 && !cleanLines[cleanLines.length - 1]) {
      continue;
    }
    if (line === '\\' || line === '&nbsp;' || line === '•') continue;
    cleanLines.push(line);
  }

  return cleanLines.join('\n').trim();
}

function isNonColorImage(filename: string): boolean {
  const f = filename.toLowerCase();
  return (
    f.includes('manekin') ||
    f.includes('gambar utama') ||
    f.includes('detail motif') ||
    f.includes('detail-motif') ||
    f.includes('chatgpt') ||
    f.includes('banner') ||
    f.includes('watermark') ||
    f.includes('eksklusif') ||
    f.includes('100%') ||
    f.includes('hero')
  );
}

function cleanColorName(filename: string): string {
  let name = path.parse(filename).name;
  name = name.replace(/[-_]/g, ' ').replace(/scaled|copy/gi, '').trim();
  name = name.replace(/\s+\d+$/g, '').trim();
  return name.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
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
  console.log('🚀 MEMULAI RE-SYNC DATABASE DENGAN FOTO & DESKRIPSI BERSIH');
  console.log('========================================================');

  // STEP 1: HAPUS SEMUA DATA LAMA AGAR BERSIH TOTAL
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

  console.log(`📦 Terdeteksi ${productFolders.length} folder produk.`);

  // STEP 3: UPLOAD DAN SINKRONISASI
  console.log('\n☁️ [3/4] Mengunggah foto & menyusun relasi warna, hero, dan galeri...');

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

    const cleanedDescription = cleanDescription(data.short_description || data.description || '', data.full_description || '');

    console.log(`\n[${i + 1}/${productFolders.length}] Memproses: ${formattedTitle.substring(0, 45)}... (Kode: ${productCode})`);

    // Scan all local images
    const allFiles = fs.readdirSync(item.fullPath).filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));

    // 1. Identifikasi Foto Utama (Hero / Manekin)
    // Utamakan file 'Gambar Utama (Manekin).png' atau file manekin tanpa detail
    const heroImageFile = allFiles.find(f => /^gambar utama \(manekin\)\.(png|jpg|jpeg)$/i.test(f)) ||
                          allFiles.find(f => /manekin.*ai/i.test(f)) ||
                          allFiles.find(f => /manekin|gambar utama/i.test(f) && !f.includes('2') && !f.includes('3')) ||
                          allFiles[0];

    // 2. Identifikasi Foto Detail Motif / Tekstur
    const detailFiles = allFiles.filter(f => f !== heroImageFile && isNonColorImage(f));

    // 3. Identifikasi Foto Varian Warna Asli
    const colorFiles = allFiles.filter(f => f !== heroImageFile && !isNonColorImage(f));

    const galleryImages: string[] = [];
    const colorNames: string[] = [];
    const colorStocks: Record<string, number> = {};
    const colorImages: Record<string, string> = {};

    // Upload Hero Image (Foto Utama)
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

    // Upload Detail Motif Images (Masuk ke Galeri Foto, BUKAN tombol varian warna)
    for (let dIdx = 0; dIdx < detailFiles.length; dIdx++) {
      const dFile = detailFiles[dIdx];
      const dPath = path.join(item.fullPath, dFile);
      const destDetailName = `${sanitizeFilename(formattedTitle)}_detail_${dIdx + 1}`;
      const uploadedDetail = await uploadLocalFileToSupabase(dPath, destDetailName);
      if (uploadedDetail) {
        galleryImages.push(uploadedDetail);
      }
    }

    // Upload Varian Warna Asli (Masuk ke Galeri Foto DAN tombol varian warna)
    for (let cIdx = 0; cIdx < colorFiles.length; cIdx++) {
      const cFile = colorFiles[cIdx];
      const cPath = path.join(item.fullPath, cFile);
      const rawColorName = cleanColorName(cFile);

      const destColorName = `${sanitizeFilename(formattedTitle)}_color_${sanitizeFilename(rawColorName)}_${cIdx + 1}`;
      const uploadedColor = await uploadLocalFileToSupabase(cPath, destColorName);

      if (uploadedColor) {
        galleryImages.push(uploadedColor);
        if (!colorNames.includes(rawColorName)) {
          colorNames.push(rawColorName);
        }
        colorImages[rawColorName] = uploadedColor;

        // Cari stok spesifik dari teks deskripsi jika ada
        const stockRegex = new RegExp(`(?:${rawColorName}|@${rawColorName})\\s*[:\\[]?\\s*(\\d+)\\s*(?:PCS|pcs|roll)?`, 'i');
        const stockMatch = cleanedDescription.match(stockRegex);
        colorStocks[rawColorName] = stockMatch ? parseInt(stockMatch[1]) : 100;
      }
    }

    // Jika produk merupakan kain single motif/warna tunggal tanpa file warna terpisah:
    if (colorNames.length === 0 && Array.isArray(data.available_colors)) {
      data.available_colors.forEach((cStr: string) => {
        // Filter out non-colors from available_colors
        if (!/gambar utama|manekin|detail motif/i.test(cStr)) {
          const m = cStr.match(/^([A-Z\s]+)\s*:\s*(\d+)/i);
          if (m) {
            const cName = m[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (cName.length < 30 && !colorNames.includes(cName)) {
              colorNames.push(cName);
              colorStocks[cName] = parseInt(m[2]) || 100;
            }
          }
        }
      });
    }

    // Fallback hero image
    if (!primaryImageUrl && galleryImages.length > 0) {
      primaryImageUrl = galleryImages[0];
    }

    // Hitung total stok
    const totalStock = Object.values(colorStocks).reduce((sum, n) => sum + n, 0) || 100;

    await prisma.product.create({
      data: {
        name: formattedTitle,
        code: productCode,
        price: price,
        discountPrice: discountPrice,
        category: category,
        description: cleanedDescription || "Kain Brukat Premium berkualitas tinggi.",
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
    console.log(`  ✅ [${successCount}] Tersimpan di DB: Foto Utama: ${heroImageFile || 'Default'}, Galeri: ${galleryImages.length} foto, Warna: [${colorNames.join(', ')}]`);
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
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
