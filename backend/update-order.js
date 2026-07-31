const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: 'PAID' },
    data: { status: 'PROCESSING' }
  });
  console.log(`Updated ${result.count} orders from PAID to PROCESSING`);
}

main().catch(e => console.error(e)).finally(() => {
  prisma.$disconnect();
  pool.end();
});
