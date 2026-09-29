import { prisma } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔄 Memulai proses export data dari database saat ini...');

  const [products, users, siteConfigs, collections, faqs, settings] = await Promise.all([
    prisma.product.findMany(),
    prisma.user.findMany(),
    prisma.siteConfig.findMany(),
    prisma.collection.findMany(),
    prisma.faqItem.findMany(),
    prisma.setting.findMany(),
  ]);

  const backupData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalProducts: products.length,
      totalUsers: users.length,
      totalSiteConfigs: siteConfigs.length,
      totalCollections: collections.length,
      totalFaqs: faqs.length,
      totalSettings: settings.length,
    },
    products,
    users,
    siteConfigs,
    collections,
    faqs,
    settings,
  };

  const outputPath = path.join(__dirname, '../prisma/backup_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log('✅ Export data BERHASIL diselamatkan!');
  console.log(`📁 File tersimpan di: ${outputPath}`);
  console.log('📊 Ringkasan Data:');
  console.log(`   - Produk: ${products.length} item`);
  console.log(`   - Users / Admin: ${users.length} user`);
  console.log(`   - Site Config: ${siteConfigs.length} config`);
  console.log(`   - Koleksi: ${collections.length} koleksi`);
  console.log(`   - FAQ: ${faqs.length} item`);
  console.log(`   - Settings: ${settings.length} setting`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Gagal export data:', err);
  process.exit(1);
});
