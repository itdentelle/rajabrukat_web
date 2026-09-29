import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

export async function ensureSettingTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "category" TEXT DEFAULT 'general',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('Notice: ensureSettingTable warning:', err);
  }
}

export async function ensureSiteConfigColumns() {
  try {
    await ensureSettingTable();
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SiteConfig" 
      ADD COLUMN IF NOT EXISTS "panel2Title" TEXT DEFAULT 'Panel Brukat Chantily',
      ADD COLUMN IF NOT EXISTS "panel2Subtitle" TEXT DEFAULT 'RENDA CHANTILLY FRENCH',
      ADD COLUMN IF NOT EXISTS "panel2ButtonText" TEXT DEFAULT 'Lihat Koleksi',
      ADD COLUMN IF NOT EXISTS "panel2ButtonLink" TEXT DEFAULT '/shop?category=Renda Chantilly',
      ADD COLUMN IF NOT EXISTS "panel2ImageUrl" TEXT DEFAULT '/images/beige_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "panel3Title" TEXT DEFAULT 'Panel Metallic Ellegant',
      ADD COLUMN IF NOT EXISTS "panel3Subtitle" TEXT DEFAULT 'METALLIC LACE ELEGANT',
      ADD COLUMN IF NOT EXISTS "panel3ButtonText" TEXT DEFAULT 'Lihat Koleksi',
      ADD COLUMN IF NOT EXISTS "panel3ButtonLink" TEXT DEFAULT '/shop?category=Metallic',
      ADD COLUMN IF NOT EXISTS "panel3ImageUrl" TEXT DEFAULT '/images/metallic_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "featuredTitle" TEXT DEFAULT 'Pancar \\n Keanggunan \\n Gayamu.',
      ADD COLUMN IF NOT EXISTS "featuredSubtitle" TEXT DEFAULT 'Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.',
      ADD COLUMN IF NOT EXISTS "badge1Title" TEXT DEFAULT 'Garansi Retur',
      ADD COLUMN IF NOT EXISTS "badge1Subtitle" TEXT DEFAULT 'Kemudahan Tukar',
      ADD COLUMN IF NOT EXISTS "badge2Title" TEXT DEFAULT '100% Premium',
      ADD COLUMN IF NOT EXISTS "badge2Subtitle" TEXT DEFAULT 'Serat Halus Impor',
      ADD COLUMN IF NOT EXISTS "badge3Title" TEXT DEFAULT 'Bebas Ongkir',
      ADD COLUMN IF NOT EXISTS "badge3Subtitle" TEXT DEFAULT 'Pengiriman Cepat',
      ADD COLUMN IF NOT EXISTS "featuredCard1Title" TEXT DEFAULT 'Panel Brukat Polos Busana Pesta',
      ADD COLUMN IF NOT EXISTS "featuredCard1Desc" TEXT DEFAULT 'Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.',
      ADD COLUMN IF NOT EXISTS "featuredCard1ImgUrl" TEXT DEFAULT '/images/renda_chantilly_french.png',
      ADD COLUMN IF NOT EXISTS "featuredCard1Link" TEXT DEFAULT '/shop?category=Panel Brukat Polos',
      ADD COLUMN IF NOT EXISTS "featuredCard2Title" TEXT DEFAULT 'Panel Full Metalic',
      ADD COLUMN IF NOT EXISTS "featuredCard2Desc" TEXT DEFAULT 'Kondisi baru, memakai benang metalik yang menambah kesan elegan. Bahan adem dan nyaman dipakai. Foto-foto warna sudah sesuai dengan kondisi aslinya.',
      ADD COLUMN IF NOT EXISTS "featuredCard2ImgUrl" TEXT DEFAULT '/images/brukat_tile_mutiara.png',
      ADD COLUMN IF NOT EXISTS "featuredCard2Link" TEXT DEFAULT '/shop?category=Panel Full Metalic',
      ADD COLUMN IF NOT EXISTS "featuredCard3Title" TEXT DEFAULT 'Panel Renda Chantilly Impor',
      ADD COLUMN IF NOT EXISTS "featuredCard3Desc" TEXT DEFAULT 'Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal. Pilihan utama para desainer untuk gaun pesta & kebaya pengantin.',
      ADD COLUMN IF NOT EXISTS "featuredCard3ImgUrl" TEXT DEFAULT '/images/cornely_silk_satin.png',
      ADD COLUMN IF NOT EXISTS "featuredCard3Link" TEXT DEFAULT '/shop?category=Renda Chantilly',
      ADD COLUMN IF NOT EXISTS "catalogPdfUrl" TEXT DEFAULT '/Katalog.pdf',
      ADD COLUMN IF NOT EXISTS "catalogTitleLine1" TEXT DEFAULT 'Katalog',
      ADD COLUMN IF NOT EXISTS "catalogTitleLine2" TEXT DEFAULT 'Kain Eksklusif',
      ADD COLUMN IF NOT EXISTS "aboutCircle1ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle2ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle3ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle4ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "aboutCircle5ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "latestBadge" TEXT DEFAULT 'KOLEKSI MOTIF TERBARU',
      ADD COLUMN IF NOT EXISTS "latestTitleLine1" TEXT DEFAULT 'Rilis Koleksi Kain',
      ADD COLUMN IF NOT EXISTS "latestTitleLine2" TEXT DEFAULT 'Terbaru & Eksklusif',
      ADD COLUMN IF NOT EXISTS "latestDesc" TEXT DEFAULT 'Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.',
      ADD COLUMN IF NOT EXISTS "dealsBadge" TEXT DEFAULT 'PROMO SPESIAL TERBATAS',
      ADD COLUMN IF NOT EXISTS "dealsTitle" TEXT DEFAULT 'Penawaran Tekstil Eksklusif',
      ADD COLUMN IF NOT EXISTS "dealsDescription" TEXT DEFAULT 'Dapatkan penawaran harga spesial untuk kain brukat pilihan dengan kualitas bordir 3D premium. Promo berlaku selama persediaan masih ada.',
      ADD COLUMN IF NOT EXISTS "dealsProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "dealsEndsAt" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "dealsDiscountPrice" DOUBLE PRECISION DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookBadge" TEXT DEFAULT 'INSPIRASI BUSANA KEBAYA & GAUN MEWAH',
      ADD COLUMN IF NOT EXISTS "lookbookTitleLine1" TEXT DEFAULT 'Galeri Lookbook &',
      ADD COLUMN IF NOT EXISTS "lookbookTitleLine2" TEXT DEFAULT 'Inspirasi Busana Kebaya',
      ADD COLUMN IF NOT EXISTS "lookbookDesc" TEXT DEFAULT 'Lihat keanggunan hasil rancangan busana karya desainer & pelanggan Raja Brukat. Klik kartu untuk inspirasi lengkap dan pembelian bahan langsung!',
      ADD COLUMN IF NOT EXISTS "lookbookCard1ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard2ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard3ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard4ProductId" TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "lookbookCard1Tag" TEXT DEFAULT 'KEBAYA PENGANTIN',
      ADD COLUMN IF NOT EXISTS "lookbookCard2Tag" TEXT DEFAULT 'GAUN PESTA',
      ADD COLUMN IF NOT EXISTS "lookbookCard3Tag" TEXT DEFAULT 'SERAGAM BRIDESMAID',
      ADD COLUMN IF NOT EXISTS "lookbookCard4Tag" TEXT DEFAULT 'KEBAYA WISUDA',
      ADD COLUMN IF NOT EXISTS "compareTitle" TEXT DEFAULT 'Compare Textile Quality',
      ADD COLUMN IF NOT EXISTS "compareBeforeLabel" TEXT DEFAULT 'Semi Prancis 3D',
      ADD COLUMN IF NOT EXISTS "compareAfterLabel" TEXT DEFAULT 'Metallic Elegant',
      ADD COLUMN IF NOT EXISTS "compareBeforeImage" TEXT DEFAULT '/images/white_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "compareAfterImage" TEXT DEFAULT '/images/metallic_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "bestSellersTitle" TEXT DEFAULT 'Best Sellers.',
      ADD COLUMN IF NOT EXISTS "bestSellersDescription" TEXT DEFAULT 'The pieces everyone is talking about. Grab them before they''re gone.',
      ADD COLUMN IF NOT EXISTS "gradeATagline" TEXT DEFAULT 'Koleksi Super Premium',
      ADD COLUMN IF NOT EXISTS "gradeATitle" TEXT DEFAULT 'KATEGORI GRADE A',
      ADD COLUMN IF NOT EXISTS "gradeADesc" TEXT DEFAULT 'Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.',
      ADD COLUMN IF NOT EXISTS "gradeAImage" TEXT DEFAULT '/images/brukat_tile_mutiara.png',
      ADD COLUMN IF NOT EXISTS "gradeBTagline" TEXT DEFAULT 'Koleksi Pilihan Ekonomis & Elegan',
      ADD COLUMN IF NOT EXISTS "gradeBTitle" TEXT DEFAULT 'KATEGORI GRADE B',
      ADD COLUMN IF NOT EXISTS "gradeBDesc" TEXT DEFAULT 'Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.',
      ADD COLUMN IF NOT EXISTS "gradeBImage" TEXT DEFAULT '/images/renda_chantilly_french.png',
      ADD COLUMN IF NOT EXISTS "tulleTagline" TEXT DEFAULT 'Tile Jaring & Furing Silk Modern',
      ADD COLUMN IF NOT EXISTS "tulleTitle" TEXT DEFAULT 'KATEGORI TULLE',
      ADD COLUMN IF NOT EXISTS "tulleDesc" TEXT DEFAULT 'Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.',
      ADD COLUMN IF NOT EXISTS "tulleImage" TEXT DEFAULT '/images/cornely_silk_satin.png',
      ADD COLUMN IF NOT EXISTS "contactHeroTitle" TEXT DEFAULT 'Layanan & Konsultasi Kain Raja Brukat',
      ADD COLUMN IF NOT EXISTS "contactHeroSubtitle" TEXT DEFAULT 'HUBUNGI TIM CS KAMI',
      ADD COLUMN IF NOT EXISTS "contactHeroImage" TEXT DEFAULT '/images/white_lace_hero.png',
      ADD COLUMN IF NOT EXISTS "contactPhone" TEXT DEFAULT '+62 858-8166-7778',
      ADD COLUMN IF NOT EXISTS "contactWhatsapp" TEXT DEFAULT '6285881667778',
      ADD COLUMN IF NOT EXISTS "contactEmail" TEXT DEFAULT 'info@rajabrukat.com',
      ADD COLUMN IF NOT EXISTS "contactAddress" TEXT DEFAULT 'Pusat Tekstil Raja Brukat, Indonesia',
      ADD COLUMN IF NOT EXISTS "contactHours" TEXT DEFAULT 'Senin - Sabtu: 08:00 - 17:00 WIB',
      ADD COLUMN IF NOT EXISTS "contactGoogleMapsUrl" TEXT DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.970220677598!2d107.5458!3d-6.8906!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTMnMjYuMiJTIDEwN8KwMzInNDQuOSJF!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
      ADD COLUMN IF NOT EXISTS "faqPageTitle" TEXT DEFAULT 'Pertanyaan Umum (FAQ)',
      ADD COLUMN IF NOT EXISTS "faqPageSubtitle" TEXT DEFAULT 'Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.',
      ADD COLUMN IF NOT EXISTS "returnsPageTitle" TEXT DEFAULT 'Kebijakan Garansi & Retur Kain',
      ADD COLUMN IF NOT EXISTS "returnsPageSubtitle" TEXT DEFAULT 'Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim.',
      ADD COLUMN IF NOT EXISTS "returnsSection1Title" TEXT DEFAULT '1. Ketentuan Garansi & Syarat Retur',
      ADD COLUMN IF NOT EXISTS "returnsSection1Desc" TEXT DEFAULT 'Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi.',
      ADD COLUMN IF NOT EXISTS "returnsSection2Title" TEXT DEFAULT '2. Syarat Wajib Video Unboxing',
      ADD COLUMN IF NOT EXISTS "returnsSection2Desc" TEXT DEFAULT 'Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai.',
      ADD COLUMN IF NOT EXISTS "returnsSection3Title" TEXT DEFAULT '3. Tata Cara Mengajukan Retur',
      ADD COLUMN IF NOT EXISTS "returnsSection3Desc" TEXT DEFAULT '1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\\n3. CS akan memverifikasi dan memberikan alamat retur.';
    `);
  } catch (err) {
    console.warn('Notice: ensureSiteConfigColumns warning:', err);
  }
}

export const getHeroConfig = async (req: Request, res: Response) => {
  try {
    await ensureSettingTable();
    await ensureSiteConfigColumns();

    const settings = await prisma.setting.findMany();
    const configDict: Record<string, any> = {};

    settings.forEach((s) => {
      configDict[s.key] = s.value;
    });

    let legacyConfig = await prisma.siteConfig.findUnique({ where: { id: 'hero-banner' } });
    if (!legacyConfig) {
      legacyConfig = await (prisma.siteConfig as any).create({
        data: {
          id: 'hero-banner',
          title: 'Keanggunan Kain Semi Prancis 3D Premium',
          subtitle: 'KOLEKSI RAJA BRUKAT 2026',
          buttonText: 'Shop Now',
          buttonLink: '/shop',
          imageUrl: '/images/white_lace_hero.png',
          panel2Title: 'Panel Brukat Chantily',
          panel2Subtitle: 'RENDA CHANTILLY FRENCH',
          panel2ButtonText: 'Lihat Koleksi',
          panel2ButtonLink: '/shop?category=Renda Chantilly',
          panel2ImageUrl: '/images/beige_lace_hero.png',
          panel3Title: 'Panel Metallic Ellegant',
          panel3Subtitle: 'METALLIC LACE ELEGANT',
          panel3ButtonText: 'Lihat Koleksi',
          panel3ButtonLink: '/shop?category=Metallic',
          panel3ImageUrl: '/images/metallic_lace_hero.png',
          aboutTitle: 'Didedikasikan Untuk Keindahan Kebaya & Gaun Mewah',
          aboutSubtitle: 'Koleksi Tekstil Eksklusif',
          aboutDescription:
            'Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.',
          footerDesc:
            'Raja Brukat adalah pusat tekstil kain brukat & renda eksklusif terbaik di Indonesia. Melayani pemesanan eceran dan grosir ke seluruh Wilayah Indonesia.',
          instagramUrl: 'https://instagram.com/rajabrukat',
          facebookUrl: '#',
          twitterUrl: '#',
          shopTitle: 'Katalog Kain Brukat & Renda Premium',
          shopDescription:
            'Temukan koleksi motif brukat mutiara, renda chantilly, dan cornely 3D terbaik untuk gaun dan kebaya Anda.',
          catalogPdfUrl: '/Katalog.pdf',
          catalogTitleLine1: 'Katalog',
          catalogTitleLine2: 'Kain Eksklusif',
          latestBadge: 'KOLEKSI MOTIF TERBARU',
          latestTitleLine1: 'Rilis Koleksi Kain',
          latestTitleLine2: 'Terbaru & Eksklusif',
          latestDesc:
            'Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.',
          aboutPageTitle: 'Keanggunan Tekstil Kebaya \\n Mewah & Eksklusif Raja Brukat',
          aboutPageStory1:
            'Raja Brukat adalah destinasi utama di Indonesia untuk menemukan kain brukat mewah, tile mutiara 3D, renda Chantilly impor, dan furing satin silk bermutu tinggi.',
          aboutPageStory2:
            'Berdiri dengan komitmen menyajikan keindahan tekstil terbaik, kami menghadirkan ratusan pilihan motif renda eksklusif untuk kebutuhan kebaya wisuda, gaun pesta modern, seragam keluarga bridesmaid, hingga busana pengantin akad & resepsi.',
          aboutPageImgUrl: '/images/brukat_tile_mutiara.png',
          aboutPageImgText: 'Kemewahan Tanpa Kompromi.',
          aboutPagePhil1Title: '01. Kualitas Premium Impor',
          aboutPagePhil1Desc:
            'Serat renda Chantilly dan tile pilihan yang ekstra lembut di kulit, tahan lama, dingin, dan tidak gatal.',
          aboutPagePhil2Title: '02. Motif Anggun & Mewah',
          aboutPagePhil2Desc:
            'Desain bordir bunga 3D, cornely timbul, dan taburan mutiara yang sangat mewah untuk segala momen istimewa.',
          aboutPagePhil3Title: '03. Pelayanan Eceran & Grosir',
          aboutPagePhil3Desc:
            'Melayani pembelian eceran per meter maupun gulungan roll besar untuk desainer, penjahit, dan seragam acara.',
          contactHeroTitle: 'Layanan & Konsultasi Kain Raja Brukat',
          contactHeroSubtitle: 'HUBUNGI TIM CS KAMI',
          contactPhone: '+62 858-8166-7778',
          contactWhatsapp: '6285881667778',
          contactEmail: 'info@rajabrukat.com',
          contactAddress: 'Pusat Tekstil Raja Brukat, Indonesia',
          contactHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
          faqPageTitle: 'Pertanyaan Umum (FAQ)',
          faqPageSubtitle:
            'Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.',
          returnsPageTitle: 'Kebijakan Garansi & Retur Kain',
          returnsPageSubtitle:
            'Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim.',
          returnsSection1Title: '1. Ketentuan Garansi & Syarat Retur',
          returnsSection1Desc:
            'Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi.',
          returnsSection2Title: '2. Syarat Wajib Video Unboxing',
          returnsSection2Desc:
            'Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai.',
          returnsSection3Title: '3. Tata Cara Mengajukan Retur',
          returnsSection3Desc:
            '1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\n3. CS akan memverifikasi dan memberikan alamat retur.',
        },
      });
    }

    if (legacyConfig) {
      Object.entries(legacyConfig).forEach(([k, v]) => {
        if (v !== null && v !== undefined && configDict[k] === undefined) {
          configDict[k] = v;
        }
      });
    }

    res.json(configDict);
  } catch (error) {
    console.error('Error fetching hero config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
};

export const updateHeroConfig = async (req: Request, res: Response) => {
  try {
    await ensureSettingTable();
    await ensureSiteConfigColumns();

    const body = req.body || {};

    const upsertPromises = Object.entries(body).map(([key, val]) => {
      const stringVal = val === null || val === undefined ? '' : String(val);
      return prisma.setting.upsert({
        where: { key },
        update: { value: stringVal },
        create: { key, value: stringVal },
      });
    });

    await Promise.all(upsertPromises);

    try {
      await prisma.siteConfig.upsert({
        where: { id: 'hero-banner' },
        update: { ...body },
        create: { id: 'hero-banner', ...body },
      });
    } catch (e) {
      // Ignore legacy sync warning
    }

    if (redisClient) await redisClient.del('cache:/api/config/hero');

    const allSettings = await prisma.setting.findMany();
    const configDict: Record<string, any> = {};
    allSettings.forEach((s) => {
      configDict[s.key] = s.value;
    });

    res.json(configDict);
  } catch (error) {
    console.error('Error updating hero config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
};
