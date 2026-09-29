import fs from 'fs';
import path from 'path';
import https from 'https';

const SUPABASE_BASE_URL = 'https://ykzpelepxkrkzbxlrydi.supabase.co/storage/v1/object/public/products';
const TARGET_DIR = path.join(__dirname, '../public/uploads/products');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(true);
          });
        } else {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          resolve(false);
        }
      })
      .on('error', () => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        resolve(false);
      });
  });
}

async function main() {
  const backupFile = path.join(__dirname, '../prisma/backup_data.json');
  if (!fs.existsSync(backupFile)) {
    console.error('❌ File backup_data.json tidak ditemukan!');
    process.exit(1);
  }

  const raw = fs.readFileSync(backupFile, 'utf-8');
  const regex = /\/uploads\/products\/([a-zA-Z0-9_.-]+)/g;
  const filenames = new Set<string>();

  let match;
  while ((match = regex.exec(raw)) !== null) {
    filenames.add(match[1]);
  }

  console.log(`\n🚀 Ditemukan ${filenames.size} foto produk kain Raja Brukat yang dibutuhkan.`);
  console.log(`⚡ Mengunduh langsung di VPS dengan kecepatan data center...\n`);

  const list = Array.from(filenames);
  let downloaded = 0;
  let alreadyExists = 0;
  let failed = 0;

  const BATCH_SIZE = 12;
  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (filename) => {
        const dest = path.join(TARGET_DIR, filename);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
          alreadyExists++;
          return;
        }

        const url = `${SUPABASE_BASE_URL}/${encodeURIComponent(filename)}`;
        const ok = await downloadFile(url, dest);
        if (ok) {
          downloaded++;
        } else {
          failed++;
        }
      })
    );

    const progress = Math.min(i + BATCH_SIZE, list.length);
    process.stdout.write(`\rProgress: [${progress}/${list.length}] foto berhasil diproses...`);
  }

  console.log('\n\n===========================================');
  console.log('🎉 SINKRONISASI FOTO PRODUK SELESAI!');
  console.log(`   ✔ Baru diunduh   : ${downloaded}`);
  console.log(`   ✔ Sudah ada      : ${alreadyExists}`);
  if (failed > 0) {
    console.log(`   ⚠ Gagal diunduh  : ${failed}`);
  }
  console.log('===========================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
