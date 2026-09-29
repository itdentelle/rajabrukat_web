import { prisma } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function main() {
  const backupPath = path.join(__dirname, '../prisma/backup_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ File backup tidak ditemukan di: ${backupPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('🔄 Memulai proses restore data ke database...');
  console.log(`📅 Timestamp backup: ${data.metadata?.exportedAt || 'N/A'}`);

  // 1. Restore Users
  if (data.users && data.users.length > 0) {
    console.log(`👤 Mengimpor ${data.users.length} user/admin...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          password: u.password,
          googleId: u.googleId,
          name: u.name,
          role: u.role,
          phone: u.phone,
          address: u.address,
          isEmailVerified: u.isEmailVerified,
          createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
        },
      });
    }
  }

  // 2. Restore SiteConfig
  if (data.siteConfigs && data.siteConfigs.length > 0) {
    console.log(`⚙️ Mengimpor ${data.siteConfigs.length} site config...`);
    for (const sc of data.siteConfigs) {
      const { id, createdAt, updatedAt, ...rest } = sc;
      const existing = await prisma.siteConfig.findFirst();
      if (existing) {
        await prisma.siteConfig.update({
          where: { id: existing.id },
          data: rest,
        });
      } else {
        await prisma.siteConfig.create({
          data: {
            ...rest,
            createdAt: createdAt ? new Date(createdAt) : undefined,
            updatedAt: updatedAt ? new Date(updatedAt) : undefined,
          },
        });
      }
    }
  }

  // 3. Restore Collections
  if (data.collections && data.collections.length > 0) {
    console.log(`🏷️ Mengimpor ${data.collections.length} koleksi...`);
    for (const col of data.collections) {
      await prisma.collection.upsert({
        where: { id: col.id },
        update: {
          title: col.title,
          subtitle: col.subtitle,
          description: col.description,
          imageUrl: col.imageUrl,
          color: col.color || 'bg-zinc-900',
          isActive: col.isActive ?? true,
        },
        create: {
          id: col.id,
          title: col.title,
          subtitle: col.subtitle,
          description: col.description,
          imageUrl: col.imageUrl,
          color: col.color || 'bg-zinc-900',
          isActive: col.isActive ?? true,
          createdAt: col.createdAt ? new Date(col.createdAt) : undefined,
          updatedAt: col.updatedAt ? new Date(col.updatedAt) : undefined,
        },
      });
    }
  }

  // 4. Restore FAQs
  if (data.faqs && data.faqs.length > 0) {
    console.log(`❓ Mengimpor ${data.faqs.length} FAQ item...`);
    for (const faq of data.faqs) {
      await prisma.faqItem.upsert({
        where: { id: faq.id },
        update: {
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          order: faq.order ?? 0,
          isActive: faq.isActive ?? true,
        },
        create: {
          id: faq.id,
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          order: faq.order ?? 0,
          isActive: faq.isActive ?? true,
          createdAt: faq.createdAt ? new Date(faq.createdAt) : undefined,
          updatedAt: faq.updatedAt ? new Date(faq.updatedAt) : undefined,
        },
      });
    }
  }

  // 5. Restore Settings
  if (data.settings && data.settings.length > 0) {
    console.log(`🔧 Mengimpor ${data.settings.length} setting...`);
    for (const s of data.settings) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: {
          value: s.value,
          category: s.category || 'general',
        },
        create: {
          key: s.key,
          value: s.value,
          category: s.category || 'general',
          createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
        },
      });
    }
  }

  // 6. Restore Products
  if (data.products && data.products.length > 0) {
    console.log(`📦 Mengimpor ${data.products.length} produk...`);
    for (const p of data.products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          code: p.code,
          price: p.price,
          discountPrice: p.discountPrice,
          category: p.category,
          description: p.description,
          image: p.image,
          galleryImages: p.galleryImages,
          colors: p.colors,
          colorStocks: p.colorStocks,
          colorImages: p.colorImages,
          weight: p.weight,
          stock: p.stock,
          sizeGuide: p.sizeGuide,
          isActive: p.isActive,
        },
        create: {
          id: p.id,
          name: p.name,
          code: p.code,
          price: p.price,
          discountPrice: p.discountPrice,
          category: p.category,
          description: p.description,
          image: p.image,
          galleryImages: p.galleryImages,
          colors: p.colors,
          colorStocks: p.colorStocks,
          colorImages: p.colorImages,
          weight: p.weight,
          stock: p.stock,
          sizeGuide: p.sizeGuide,
          isActive: p.isActive,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
        },
      });
    }
  }

  console.log('🎉 SEMUA DATA BERHASIL DI-RESTORE KE DATABASE!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Gagal restore data:', err);
  process.exit(1);
});
