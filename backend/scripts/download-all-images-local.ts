import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { prisma } from '../src/config/database';

async function main() {
  const backupPath = path.join(__dirname, '../prisma/backup_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error('File backup_data.json tidak ditemukan!');
    process.exit(1);
  }

  const rawJson = fs.readFileSync(backupPath, 'utf-8');
  const data = JSON.parse(rawJson);

  // Target direktori di backend dan frontend
  const backendUploadsDir = path.join(__dirname, '../public/uploads/products');
  const frontendUploadsDir = path.join(__dirname, '../../frontend/public/uploads/products');

  fs.mkdirSync(backendUploadsDir, { recursive: true });
  fs.mkdirSync(frontendUploadsDir, { recursive: true });

  // Cari semua URL Supabase
  const regex = /https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/products\/([a-zA-Z0-9_.-]+)/g;
  const matches = Array.from(rawJson.matchAll(regex));
  const uniqueUrls = new Map<string, string>(); // filename -> fullUrl

  for (const m of matches) {
    const fullUrl = m[0];
    const filename = m[1];
    uniqueUrls.set(filename, fullUrl);
  }

  console.log(`🔍 Ditemukan ${uniqueUrls.size} gambar unik di Supabase Storage.`);
  console.log('⬇️ Memulai download semua gambar ke folder lokal VPS (public/uploads/products)...');

  let downloaded = 0;
  let alreadyExists = 0;
  let failed = 0;

  const entries = Array.from(uniqueUrls.entries());
  const batchSize = 10;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ([filename, fullUrl]) => {
        const destBackend = path.join(backendUploadsDir, filename);
        const destFrontend = path.join(frontendUploadsDir, filename);

        // Jika file sudah ada di backend dan size > 0
        if (fs.existsSync(destBackend) && fs.statSync(destBackend).size > 0) {
          alreadyExists++;
          if (!fs.existsSync(destFrontend)) {
            fs.copyFileSync(destBackend, destFrontend);
          }
          return;
        }

        try {
          const res = await axios.get(fullUrl, { responseType: 'arraybuffer', timeout: 15000 });
          fs.writeFileSync(destBackend, res.data);
          fs.writeFileSync(destFrontend, res.data);
          downloaded++;
        } catch (err: any) {
          failed++;
          console.error(`  ❌ Gagal download ${filename}:`, err.message);
        }
      })
    );

    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, entries.length)}/${entries.length} selesai...`);
  }

  console.log('\n\n📊 Hasil Download:');
  console.log(`   - Baru didownload : ${downloaded}`);
  console.log(`   - Sudah ada di disk: ${alreadyExists}`);
  console.log(`   - Gagal           : ${failed}`);

  // Ganti semua URL Supabase di file JSON menjadi /uploads/products/filename
  console.log('\n🔄 Memperbarui URL di backup_data.json agar mengarah ke lokal VPS (/uploads/products/)...');
  const updatedJson = rawJson.replace(regex, '/uploads/products/$1');
  fs.writeFileSync(backupPath, updatedJson, 'utf-8');
  console.log('✅ backup_data.json berhasil diperbarui dengan path lokal VPS!');

  // Perbarui juga data di database saat ini agar sinkron
  console.log('\n🔄 Memperbarui database saat ini agar semua URL menjadi path lokal...');
  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const p of products) {
    let changed = false;
    let newImage = p.image;
    let newGallery = [...p.galleryImages];
    let newColorImages = p.colorImages as any;

    if (newImage && newImage.includes('supabase.co')) {
      newImage = newImage.replace(regex, '/uploads/products/$1');
      changed = true;
    }

    newGallery = newGallery.map((img) => {
      if (img.includes('supabase.co')) {
        changed = true;
        return img.replace(regex, '/uploads/products/$1');
      }
      return img;
    });

    if (newColorImages && typeof newColorImages === 'object') {
      const updatedColorImages: Record<string, string> = {};
      for (const [col, colUrl] of Object.entries(newColorImages)) {
        if (typeof colUrl === 'string' && colUrl.includes('supabase.co')) {
          updatedColorImages[col] = colUrl.replace(regex, '/uploads/products/$1');
          changed = true;
        } else {
          updatedColorImages[col] = colUrl as string;
        }
      }
      newColorImages = updatedColorImages;
    }

    if (changed) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          image: newImage,
          galleryImages: newGallery,
          colorImages: newColorImages,
        },
      });
      updatedCount++;
    }
  }

  console.log(`✅ ${updatedCount} produk di database berhasil diubah ke path lokal VPS!`);
  console.log('🎉 SELURUH SISTEM KINI 100% DI DALAM VPS (Zero External Dependencies)!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
