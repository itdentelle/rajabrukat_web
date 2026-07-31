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
    name: 'DW Heavyweight Hoodie - Obsidian',
    price: 650000,
    category: 'Jacket',
    description: 'Our signature 500gsm heavyweight cotton hoodie in deep obsidian black. Features an oversized drop-shoulder fit, thick ribbed cuffs, and subtle embroidered DragonWorm logo on the chest. Perfect for harsh city nights.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Neo-Tokyo Graphic Tee',
    price: 250000,
    category: 'T-Shirt',
    description: 'Premium 24s combed cotton t-shirt featuring a retro-futuristic Neo-Tokyo graphic print on the back. Washed finish for a vintage feel and maximum comfort.',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Utility Cargo Pants v2.0',
    price: 450000,
    category: 'Pants',
    description: 'Technical cargo pants built for urban exploration. Constructed from water-repellent ripstop fabric with 8 functional pockets, articulated knees, and adjustable ankle straps.',
    image: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Essential Mock Neck - Bone',
    price: 280000,
    category: 'T-Shirt',
    description: 'Elevated basic featuring a subtle mock neck collar. Made from thick, structured cotton that holds its shape. The bone white colorway pairs with everything in your wardrobe.',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Tactical Vest - Stealth',
    price: 550000,
    category: 'Jacket',
    description: 'Military-inspired tactical vest tailored for the streets. Features multiple 3D pockets, heavy-duty zippers, and a breathable mesh lining for layering in any season.',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Washed Denim Jacket',
    price: 680000,
    category: 'Jacket',
    description: 'A classic silhouette reimagined. 14oz raw denim that has been stone-washed for a perfectly lived-in look. Features custom DragonWorm gunmetal hardware.',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Acid Wash Oversized Tee',
    price: 220000,
    category: 'T-Shirt',
    description: 'Boxy, wide fit t-shirt with a unique acid wash treatment. No two shirts are exactly alike. Features raw hem details and a minimal logo tag.',
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Parachute Track Pants',
    price: 380000,
    category: 'Pants',
    description: 'Lightweight nylon parachute pants with a baggy, relaxed fit. Features elastic waist with elongated drawstrings and bungee cord ankle toggles for a customizable silhouette.',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop',
  }
];

async function main() {
  console.log('Starting database seeding...');
  
  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: product
    });
    console.log(`Created product: ${createdProduct.name}`);
  }
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
