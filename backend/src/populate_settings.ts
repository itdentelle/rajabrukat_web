import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined
});

const DEFAULT_SETTINGS: Record<string, { value: string; category: string }> = {
  // Hero & Banners
  title: { value: "Keanggunan Kain Semi Prancis 3D Premium", category: "landing" },
  subtitle: { value: "KOLEKSI RAJA BRUKAT 2026", category: "landing" },
  buttonText: { value: "Shop Now", category: "landing" },
  buttonLink: { value: "/shop", category: "landing" },
  imageUrl: { value: "/images/white_lace_hero.png", category: "landing" },

  panel2Title: { value: "Panel Brukat Chantily", category: "landing" },
  panel2Subtitle: { value: "RENDA CHANTILLY FRENCH", category: "landing" },
  panel2ButtonText: { value: "Lihat Koleksi", category: "landing" },
  panel2ButtonLink: { value: "/shop?category=Renda Chantilly", category: "landing" },
  panel2ImageUrl: { value: "/images/beige_lace_hero.png", category: "landing" },

  panel3Title: { value: "Panel Metallic Ellegant", category: "landing" },
  panel3Subtitle: { value: "METALLIC LACE ELEGANT", category: "landing" },
  panel3ButtonText: { value: "Lihat Koleksi", category: "landing" },
  panel3ButtonLink: { value: "/shop?category=Metallic", category: "landing" },
  panel3ImageUrl: { value: "/images/metallic_lace_hero.png", category: "landing" },

  featuredTitle: { value: "Pancar \n Keanggunan \n Gayamu.", category: "landing" },
  featuredSubtitle: { value: "Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.", category: "landing" },

  badge1Title: { value: "Garansi Retur", category: "landing" },
  badge1Subtitle: { value: "Kemudahan Tukar", category: "landing" },
  badge2Title: { value: "100% Premium", category: "landing" },
  badge2Subtitle: { value: "Serat Halus Impor", category: "landing" },
  badge3Title: { value: "Bebas Ongkir", category: "landing" },
  badge3Subtitle: { value: "Pengiriman Cepat", category: "landing" },

  featuredCard1Title: { value: "Panel Brukat Polos Busana Pesta", category: "landing" },
  featuredCard1Desc: { value: "Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.", category: "landing" },
  featuredCard1ImgUrl: { value: "/images/renda_chantilly_french.png", category: "landing" },
  featuredCard1Link: { value: "/shop?category=Panel Brukat Polos", category: "landing" },

  featuredCard2Title: { value: "Panel Full Metalic", category: "landing" },
  featuredCard2Desc: { value: "Kondisi baru, memakai benang metalik yang menambah kesan elegan. Bahan adem dan nyaman dipakai. Foto-foto warna sudah sesuai dengan kondisi aslinya.", category: "landing" },
  featuredCard2ImgUrl: { value: "/images/brukat_tile_mutiara.png", category: "landing" },
  featuredCard2Link: { value: "/shop?category=Panel Full Metalic", category: "landing" },

  featuredCard3Title: { value: "Panel Renda Chantilly Impor", category: "landing" },
  featuredCard3Desc: { value: "Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal. Pilihan utama para desainer untuk gaun pesta & kebaya pengantin.", category: "landing" },
  featuredCard3ImgUrl: { value: "/images/cornely_silk_satin.png", category: "landing" },
  featuredCard3Link: { value: "/shop?category=Renda Chantilly", category: "landing" },

  aboutTitle: { value: "Didedikasikan Untuk Keindahan Kebaya & Gaun Mewah", category: "landing" },
  aboutTitleLine1: { value: "Didedikasikan Untuk", category: "landing" },
  aboutTitleLine2: { value: "Keindahan Kebaya & Gaun Mewah", category: "landing" },
  aboutSubtitle: { value: "Koleksi Tekstil Eksklusif", category: "landing" },
  aboutDescription: { value: "Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.", category: "landing" },

  latestBadge: { value: "KOLEKSI MOTIF TERBARU", category: "landing" },
  latestTitleLine1: { value: "Rilis Koleksi Kain", category: "landing" },
  latestTitleLine2: { value: "Terbaru & Eksklusif", category: "landing" },
  latestDesc: { value: "Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.", category: "landing" },

  dealsBadge: { value: "PROMO SPESIAL TERBATAS", category: "landing" },
  dealsTitle: { value: "Penawaran Tekstil Eksklusif", category: "landing" },
  dealsDescription: { value: "Dapatkan penawaran harga spesial untuk kain brukat pilihan dengan kualitas bordir 3D premium. Promo berlaku selama persediaan masih ada.", category: "landing" },

  lookbookBadge: { value: "INSPIRASI BUSANA KEBAYA & GAUN MEWAH", category: "landing" },
  lookbookTitleLine1: { value: "Galeri Lookbook &", category: "landing" },
  lookbookTitleLine2: { value: "Inspirasi Busana Kebaya", category: "landing" },
  lookbookDesc: { value: "Lihat keanggunan hasil rancangan busana karya desainer & pelanggan Raja Brukat. Klik kartu untuk inspirasi lengkap dan pembelian bahan langsung!", category: "landing" },
  lookbookCard1Tag: { value: "KEBAYA PENGANTIN", category: "landing" },
  lookbookCard2Tag: { value: "GAUN PESTA", category: "landing" },
  lookbookCard3Tag: { value: "SERAGAM BRIDESMAID", category: "landing" },
  lookbookCard4Tag: { value: "KEBAYA WISUDA", category: "landing" },

  compareTitle: { value: "Compare Textile Quality", category: "landing" },
  compareBeforeLabel: { value: "Semi Prancis 3D", category: "landing" },
  compareAfterLabel: { value: "Metallic Elegant", category: "landing" },
  compareBeforeImage: { value: "/images/white_lace_hero.png", category: "landing" },
  compareAfterImage: { value: "/images/metallic_lace_hero.png", category: "landing" },

  bestSellersTitle: { value: "Best Sellers.", category: "landing" },
  bestSellersDescription: { value: "The pieces everyone is talking about. Grab them before they're gone.", category: "landing" },

  // Shop Page & Collections
  shopTitle: { value: "Katalog Kain Brukat & Renda Premium", category: "shop" },
  shopDescription: { value: "Temukan koleksi motif brukat mutiara, renda chantilly, dan cornely 3D terbaik untuk gaun dan kebaya Anda.", category: "shop" },
  catalogPdfUrl: { value: "/Katalog.pdf", category: "shop" },
  catalogTitleLine1: { value: "Katalog", category: "shop" },
  catalogTitleLine2: { value: "Kain Eksklusif", category: "shop" },

  gradeATagline: { value: "Koleksi Super Premium", category: "shop" },
  gradeATitle: { value: "KATEGORI GRADE A", category: "shop" },
  gradeADesc: { value: "Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.", category: "shop" },
  gradeAImage: { value: "/images/brukat_tile_mutiara.png", category: "shop" },

  gradeBTagline: { value: "Koleksi Pilihan Ekonomis & Elegan", category: "shop" },
  gradeBTitle: { value: "KATEGORI GRADE B", category: "shop" },
  gradeBDesc: { value: "Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.", category: "shop" },
  gradeBImage: { value: "/images/renda_chantilly_french.png", category: "shop" },

  tulleTagline: { value: "Tile Jaring & Furing Silk Modern", category: "shop" },
  tulleTitle: { value: "KATEGORI TULLE", category: "shop" },
  tulleDesc: { value: "Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.", category: "shop" },
  tulleImage: { value: "/images/cornely_silk_satin.png", category: "shop" },

  // About Page
  aboutPageTitle: { value: "Keanggunan Tekstil Kebaya \n Mewah & Eksklusif Raja Brukat", category: "about" },
  aboutPageStory1: { value: "Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.", category: "about" },
  aboutPageStory2: { value: "Berdiri dengan komitmen menyajikan keindahan tekstil terbaik, kami menghadirkan ratusan pilihan motif renda eksklusif untuk kebutuhan kebaya wisuda, gaun pesta modern, seragam keluarga bridesmaid, hingga busana pengantin akad & resepsi.\n\nSetiap roll kain dikurasi secara teliti dengan kerapatan bordir presisi, hiasan mutiara timbul 3D, serta tekstur lembut yang sangat nyaman dan dingin dipakai sepanjang hari.", category: "about" },
  aboutPageImgUrl: { value: "/images/brukat_tile_mutiara.png", category: "about" },
  aboutPageImgText: { value: "Kemewahan Tanpa Kompromi.", category: "about" },
  aboutPagePhil1Title: { value: "01. Kualitas Premium Impor", category: "about" },
  aboutPagePhil1Desc: { value: "Serat renda Chantilly dan tile pilihan yang ekstra lembut di kulit, tahan lama, dingin, dan tidak gatal.", category: "about" },
  aboutPagePhil2Title: { value: "02. Motif Anggun & Mewah", category: "about" },
  aboutPagePhil2Desc: { value: "Desain bordir bunga 3D, cornely timbul, dan taburan mutiara yang sangat mewah untuk segala momen istimewa.", category: "about" },
  aboutPagePhil3Title: { value: "03. Pelayanan Eceran & Grosir", category: "about" },
  aboutPagePhil3Desc: { value: "Melayani pembelian eceran per meter maupun gulungan roll besar untuk desainer, penjahit, dan seragam acara.", category: "about" },

  // Contact Us Page
  contactHeroTitle: { value: "Layanan & Konsultasi Kain Raja Brukat", category: "contact" },
  contactHeroSubtitle: { value: "HUBUNGI TIM CS KAMI", category: "contact" },
  contactPhone: { value: "+62 858-8166-7778", category: "contact" },
  contactWhatsapp: { value: "6285881667778", category: "contact" },
  contactEmail: { value: "info@rajabrukat.com", category: "contact" },
  contactAddress: { value: "Pusat Tekstil Raja Brukat, Indonesia", category: "contact" },
  contactHours: { value: "Senin - Sabtu: 08:00 - 17:00 WIB", category: "contact" },

  // FAQ & Returns Page
  faqPageTitle: { value: "Pertanyaan Umum (FAQ)", category: "pages" },
  faqPageSubtitle: { value: "Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.", category: "pages" },

  returnsPageTitle: { value: "Kebijakan Garansi & Retur Kain", category: "pages" },
  returnsPageSubtitle: { value: "Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim.", category: "pages" },
  returnsSection1Title: { value: "1. Ketentuan Garansi & Syarat Retur", category: "pages" },
  returnsSection1Desc: { value: "Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi.", category: "pages" },
  returnsSection2Title: { value: "2. Syarat Wajib Video Unboxing", category: "pages" },
  returnsSection2Desc: { value: "Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai.", category: "pages" },
  returnsSection3Title: { value: "3. Tata Cara Mengajukan Retur", category: "pages" },
  returnsSection3Desc: { value: "1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\n3. CS akan memverifikasi dan memberikan alamat retur.", category: "pages" },

  // Footer & Socials
  footerDesc: { value: "Raja Brukat adalah pusat tekstil kain brukat & renda eksklusif terbaik di Indonesia. Melayani pemesanan eceran dan grosir ke seluruh Wilayah Indonesia.", category: "footer" },
  instagramUrl: { value: "https://instagram.com/rajabrukat", category: "footer" },
  facebookUrl: { value: "#", category: "footer" },
  twitterUrl: { value: "#", category: "footer" }
};

async function main() {
  console.log("Populating Setting table...");

  // Also read from existing SiteConfig table if available
  let existingSiteConfig: any = null;
  try {
    const res = await pool.query('SELECT * FROM "SiteConfig" WHERE id = \'hero-banner\' LIMIT 1');
    if (res.rows.length > 0) {
      existingSiteConfig = res.rows[0];
    }
  } catch (e) {}

  for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
    let valToInsert = meta.value;
    if (existingSiteConfig && existingSiteConfig[key] !== null && existingSiteConfig[key] !== undefined) {
      valToInsert = String(existingSiteConfig[key]);
    }

    await pool.query(`
      INSERT INTO "Setting" ("key", "value", "category", "updatedAt")
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT ("key") 
      DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
    `, [key, valToInsert, meta.category]);
  }

  console.log("SUCCESS: Setting table populated with all key-value entries!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Population error:", err);
  process.exit(1);
});
