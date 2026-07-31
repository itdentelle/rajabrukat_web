import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const collections = [
  {
    title: "Fall/Winter 2026",
    subtitle: "The Urban Uniform",
    description: "Embrace the elements with heavy-weight cotton, technical fabrics, and oversized silhouettes designed for the concrete jungle.",
    imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80",
    color: "bg-zinc-900",
    isActive: true
  },
  {
    title: "Spring/Summer 2026",
    subtitle: "Neon Shadows",
    description: "Lightweight breathability meets bold graphic statements. Stand out when the sun goes down.",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80",
    color: "bg-zinc-800",
    isActive: true
  },
  {
    title: "Core Essentials",
    subtitle: "Everyday Foundations",
    description: "The building blocks of your wardrobe. Timeless cuts, premium materials, and subtle branding.",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80",
    color: "bg-zinc-700",
    isActive: true
  }
];

async function main() {
  for (const col of collections) {
    await prisma.collection.create({
      data: col
    });
  }
  console.log("Collections seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
