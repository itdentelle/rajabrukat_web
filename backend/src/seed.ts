import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  {
    id: "1",
    name: "Classic Logo Black T-Shirt",
    price: 185000,
    category: "T-Shirt",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1287&auto=format&fit=crop",
    description: "Our signature classic logo t-shirt made with premium 100% combed cotton. Built for daily wear and maximum comfort.",
  },
  {
    id: "2",
    name: "Essential White Tee",
    price: 175000,
    category: "T-Shirt",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
    description: "The essential white tee that fits perfectly into any wardrobe. Breathable, durable, and stylish.",
  },
  {
    id: "3",
    name: "Urban Zip Hoodie",
    price: 350000,
    category: "Jacket",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1287&auto=format&fit=crop",
    description: "Stay warm in style with our Urban Zip Hoodie. Featuring a heavy-weight fleece fabric and a sleek design.",
  },
  {
    id: "4",
    name: "Canvas Tote Bag",
    price: 120000,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1597523168239-2ce13f30b91e?q=80&w=1287&auto=format&fit=crop",
    description: "A durable and spacious canvas tote bag perfect for carrying your daily essentials everywhere you go.",
  },
];

async function main() {
  console.log("Start seeding...");
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
    console.log(`Created product with id: ${product.id}`);
  }
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
