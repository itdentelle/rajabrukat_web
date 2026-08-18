import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.product.count();
  console.log(`📊 TOTAL PRODUK DI DB: ${count}`);

  const samples = await prisma.product.findMany({ take: 3 });
  samples.forEach((p, i) => {
    console.log(`\n========================================`);
    console.log(`PRODUK #${i + 1}: ${p.name}`);
    console.log(`KODE: ${p.code}`);
    console.log(`FOTO THUMBNAIL (image): ${p.image}`);
    console.log(`TOTAL FOTO GALERI: ${p.galleryImages.length}`);
    console.log(`DAFTAR WARNA: [${p.colors.join(', ')}]`);
    console.log(`STOK PER WARNA:`, p.colorStocks);
    console.log(`TOTAL STOK: ${p.stock}`);
    console.log(`DESKRIPSI BERSIH:\n${p.description.substring(0, 200)}...`);
  });
}

main().then(() => {
  pool.end();
  process.exit(0);
});
