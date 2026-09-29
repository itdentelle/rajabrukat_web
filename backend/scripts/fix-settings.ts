import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined
});

async function main() {
  console.log("Fixing images in Setting & SiteConfig tables...");

  const updates = [
    { key: "imageUrl", val: "/images/white_lace_hero.png" },
    { key: "panel2ImageUrl", val: "/images/beige_lace_hero.png" },
    { key: "panel3ImageUrl", val: "/images/metallic_lace_hero.png" },
    { key: "featuredCard1ImgUrl", val: "/images/white_lace_hero.png" },
    { key: "featuredCard2ImgUrl", val: "/images/beige_lace_hero.png" },
    { key: "featuredCard3ImgUrl", val: "/images/metallic_lace_hero.png" },
  ];

  for (const item of updates) {
    await pool.query('UPDATE "Setting" SET "value" = $1, "updatedAt" = NOW() WHERE "key" = $2', [item.val, item.key]);
  }

  try {
    await pool.query(`
      UPDATE "SiteConfig"
      SET 
        "imageUrl" = '/images/white_lace_hero.png',
        "panel2ImageUrl" = '/images/beige_lace_hero.png',
        "panel3ImageUrl" = '/images/metallic_lace_hero.png',
        "featuredCard1ImgUrl" = '/images/white_lace_hero.png',
        "featuredCard2ImgUrl" = '/images/beige_lace_hero.png',
        "featuredCard3ImgUrl" = '/images/metallic_lace_hero.png'
      WHERE id = 'hero-banner'
    `);
  } catch (e: any) {
    console.log("SiteConfig update notice:", e.message);
  }

  console.log("SUCCESS: Image settings fixed!");
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error("Error fixing settings:", err);
  process.exit(1);
});
