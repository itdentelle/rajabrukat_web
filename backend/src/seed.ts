import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const fabricProducts = [
  {
    id: "brukat-1",
    name: "Brukat Tile Mutiara Royal French Grade A",
    price: 125000,
    discountPrice: 110000,
    category: "Brukat Tile Mutiara",
    description: "Kain Brukat Tile Mutiara mewah bertabur payet dan mutiara sintetis kilau tinggi. Sangat elegan untuk bahan Kebaya Wisuda, Kebaya Pengantin, dan Gaun Pesta Malam. Lebar kain 1.5 meter. Bahan jatuh, dingin, dan tidak gatal.",
    image: "/images/brukat_tile_mutiara.png",
    colors: ["Champagne Gold", "Rose Gold", "Sage Green", "Dusty Pink", "Navy Blue"],
    stock: 250,
    isActive: true,
  },
  {
    id: "brukat-2",
    name: "Renda Chantilly Premium Soft Lace Perancis",
    price: 185000,
    discountPrice: 165000,
    category: "Renda Chantilly",
    description: "Kain Brukat Chantilly Perancis dengan karakter renda super lembut, benang halus, dan motif bunga renda klasik yang sangat mewah. Cocok untuk Gaun Pengantin Modern dan Kebaya Encim Eksklusif.",
    image: "/images/renda_chantilly_french.png",
    colors: ["Broken White", "Blush Pink", "Soft Lavender", "Maroon", "Gold"],
    stock: 180,
    isActive: true,
  },
  {
    id: "brukat-3",
    name: "Brukat Cornely Timbul 3D Silk Satin",
    price: 165000,
    discountPrice: null,
    category: "Cornely 3D",
    description: "Kain Brukat Cornely dengan bordir tali timbul 3D yang kokoh dan tegas. Motif kelopak bunga mekar yang artistik dan mewah. Cocok untuk kombinasi gamis pesta dan kebaya modern.",
    image: "/images/cornely_silk_satin.png",
    colors: ["Emerald Green", "Royal Navy", "Burgundy", "Silver Grey"],
    stock: 200,
    isActive: true,
  },
  {
    id: "brukat-4",
    name: "Brukat Cord Metallic Gold Edition",
    price: 145000,
    discountPrice: null,
    category: "Brukat Cord",
    description: "Kain Brukat Cord dengan lis benang emas metallic kusam (antique gold) yang memberikan kilau anggun khas adat tradisional & modern. Tekstur tebal dan presisi.",
    image: "/images/brukat_tile_mutiara.png",
    colors: ["Antique Gold", "Copper Bronze", "Black Emas", "Rose Champagne"],
    stock: 300,
    isActive: true,
  },
  {
    id: "brukat-5",
    name: "Kain Furing Satin Silk Companion",
    price: 45000,
    discountPrice: null,
    category: "Silk & Satin",
    description: "Kain Furing Silk Velvet super halus dan adem sebagai pasangan/dalaman kain brukat. Kilap doff yang mewah, menyerap keringat, dan membuat brukat terlihat makin kontras.",
    image: "/images/cornely_silk_satin.png",
    colors: ["Match Champagne", "Match Rose Gold", "Match Sage", "Match Nude", "Match White"],
    stock: 500,
    isActive: true,
  },
  {
    id: "brukat-6",
    name: "Brukat Bunga Timbul Sequins Premium",
    price: 215000,
    discountPrice: 195000,
    category: "Brukat Premium",
    description: "Brukat haute couture dengan taburan payet piringan (sequins) kilau mutiara dan aplikasi bunga 3D timbul. Didesain khusus untuk gaun resepsi malam dan busana desainer.",
    image: "/images/renda_chantilly_french.png",
    colors: ["Crystal Silver", "Midnight Black", "Rose Gold", "Sage Emerald"],
    stock: 120,
    isActive: true,
  },
];

async function main() {
  console.log("Cleaning old product data...");
  // Delete all old order items, cart items, wishlist items before deleting products
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("Database products wiped clean.");

  console.log("Seeding fresh RajaBrukat fabric catalog...");
  for (const p of fabricProducts) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`Created fabric product: [${product.id}] ${product.name}`);
  }
  console.log("Seeding finished successfully ✨");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
