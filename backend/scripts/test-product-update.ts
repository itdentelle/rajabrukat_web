import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('railway') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const p = await prisma.product.findUnique({
    where: { id: '5181cef6-582a-4358-b978-d572ca2b5c2d' }
  });
  console.log('Product in DB:', p ? { id: p.id, name: p.name, code: p.code, price: p.price, stock: p.stock } : 'NOT FOUND');

  // Test updating
  if (p) {
    const updated = await prisma.product.update({
      where: { id: p.id },
      data: {
        code: '1638',
        name: p.name,
        price: 189000,
        stock: 33,
        colorStocks: { "Putih": 33 }
      }
    });
    console.log('Update success:', { id: updated.id, code: updated.code, stock: updated.stock });
  }

  await prisma.$disconnect();
  await pool.end();
}

run().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
