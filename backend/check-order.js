const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const order = await prisma.order.findUnique({
    where: { id: 'a2918d8e-61a0-4d97-b927-694a832a9e13' }
  });
  console.log("Order Data:", JSON.stringify(order, null, 2));
}
check();
