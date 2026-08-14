const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prod = await prisma.product.findFirst();
  console.log("DB TEST SUCCESSFUL!");
  console.log("Product Name:", prod?.name);
  console.log("Stock:", prod?.stock);
  console.log("ColorStocks:", prod?.colorStocks);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
