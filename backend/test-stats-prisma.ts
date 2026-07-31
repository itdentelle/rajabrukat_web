import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const [totalUsers, totalOrders, recentOrders, allOrders] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } }
        }
      }),
      prisma.order.findMany({
        select: { createdAt: true, totalAmount: true, status: true }
      })
    ]);

    console.log("allOrders count:", allOrders.length);
    console.log("recentOrders count:", recentOrders.length);
    console.log("Success!");
  } catch (err) {
    console.error("Prisma logic error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
