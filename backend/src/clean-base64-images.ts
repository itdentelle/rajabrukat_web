import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('aws') || connectionString.includes('railway');

const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const prods = await prisma.product.findMany({
    where: {
      image: {
        startsWith: 'data:',
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`Found ${prods.length} products with base64 images.`);

  for (const p of prods) {
    await prisma.product.update({
      where: { id: p.id },
      data: { image: '/images/white_lace_hero.png' },
    });
    console.log(`Fixed product: ${p.name} (${p.id})`);
  }

  // Also check if any other product has base64 in galleryImages
  const allProds = await prisma.product.findMany({
    select: { id: true, name: true, galleryImages: true },
  });

  for (const p of allProds) {
    if (Array.isArray(p.galleryImages) && p.galleryImages.some(img => typeof img === 'string' && img.startsWith('data:'))) {
      const cleanGallery = p.galleryImages.filter(img => typeof img === 'string' && !img.startsWith('data:'));
      await prisma.product.update({
        where: { id: p.id },
        data: { galleryImages: cleanGallery },
      });
      console.log(`Cleaned galleryImages for product: ${p.name} (${p.id})`);
    }
  }

  console.log('Database image cleanup complete.');
}

main()
  .catch((e) => {
    console.error('Error cleaning base64 images:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
