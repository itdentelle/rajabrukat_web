import { prisma } from '../config/database';
import { genAI, generateContentWithFallback } from '../config/ai';

export const handleAIChat = async (message?: string, history: any[] = [], image?: string) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
      discountPrice: true,
      category: true,
      description: true,
      colors: true,
      image: true,
      stock: true,
    },
  });

  let aiReply = '';
  let recommendedProductIds: string[] = [];

  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const catalogContext =
        products.length > 0
          ? products
              .map((p) => {
                const validColors = p.colors.filter(
                  (c) =>
                    !c.toLowerCase().includes('gambar utama') &&
                    !c.toLowerCase().includes('manekin') &&
                    !c.toLowerCase().includes('gantung') &&
                    !c.toLowerCase().includes('foto')
                );
                return `ID: ${p.id} | Nama: ${p.name} | Kategori: ${p.category} | Warna: ${validColors.join(
                  ', '
                )} | Harga: Rp${p.price} | Diskon: ${
                  p.discountPrice ? 'Rp' + p.discountPrice : 'Tidak ada'
                } | Deskripsi: ${p.description || '-'}`;
              })
              .join('\n')
          : 'PERHATIAN KRUSIAL: SAAT INI KATALOG TOKO SEDANG KOSONG (0 PRODUK). JIKA PELANGGAN MENANYAKAN PRODUK / STOK / KATALOG, BERITAHUKAN DENGAN RAMAH BAHWA KATALOG TOKO RAJABRUKAT SAAT INI SEDANG DALAM PROSES UPDATE / RE-STOCK DENGAN MOTIF TERBARU.';

      const systemPrompt = `Anda adalah "RajaBot", AI Fashion Advisor resmi dari toko RajaBrukat (spesialis kain brokat, tile, chantilly, lace premium Indonesia).
Tugas Anda:
1. Menjawab pertanyaan pelanggan dengan sangat ramah, elegan, dan membantu dalam bahasa Indonesia.
2. Menganalisis permintaan pelanggan (warna, model, kategori, acara seperti wisuda/kondangan/akad, budget).
3. Jika katalog memiliki produk, rekomendasikan ID produk yang cocok. Jika katalog KOSONG, beritahukan pelanggan dengan ramah bahwa katalog sedang update/re-stock dan belum ada produk aktif.

--- KATALOG PRODUK RAJABRUKAT ---
${catalogContext}
--- AKHIR KATALOG ---

Instruksi Output:
Kembalikan respon hanya dalam format JSON valid berikut (tanpa pembungkus markdown):
{
  "reply": "Pesan balasan ramah dan informatif untuk pelanggan...",
  "recommendedProductIds": []
}

Jika pelanggan mengunggah gambar, analisis warna dan pola kain pada gambar lalu cocokkan dengan katalog.`;

      let contents: any[] = [];
      if (image) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        contents = [
          systemPrompt,
          ...history.map((h: any) => `${h.role === 'user' ? 'Customer' : 'RajaBot'}: ${h.content}`),
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          `Customer: ${message || 'Tunjukkan produk yang mirip dengan foto ini'}`,
        ];
      } else {
        contents = [
          systemPrompt,
          ...history.map((h: any) => `${h.role === 'user' ? 'Customer' : 'RajaBot'}: ${h.content}`),
          `Customer: ${message}`,
        ];
      }

      const { text: responseText, usedModel } = await generateContentWithFallback(genAI, contents);
      console.log(`[AI Chat] Generated response successfully using model: ${usedModel}`);

      try {
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        aiReply = parsed.reply || responseText;
        recommendedProductIds = parsed.recommendedProductIds || [];
      } catch {
        aiReply = responseText;
      }
    } catch (geminiError: any) {
      console.error(
        'All Gemini API models failed, falling back to smart filter:',
        geminiError?.message || geminiError
      );
    }
  }

  // Fallback Rule Engine if AI empty or failed
  if (!aiReply) {
    const lowerQuery = (message || '').toLowerCase();
    let matched = [...products];

    if (lowerQuery.includes('terbaru') || lowerQuery.includes('rilis')) {
      matched = matched.slice(0, 4);
    } else if (
      lowerQuery.includes('100') ||
      lowerQuery.includes('100rb') ||
      lowerQuery.includes('100k') ||
      lowerQuery.includes('100.000')
    ) {
      matched = matched.filter((p) => (p.discountPrice || p.price) <= 100000);
    } else if (
      lowerQuery.includes('150') ||
      lowerQuery.includes('150rb') ||
      lowerQuery.includes('150k') ||
      lowerQuery.includes('150.000')
    ) {
      matched = matched.filter((p) => (p.discountPrice || p.price) <= 150000);
    } else if (
      lowerQuery.includes('200') ||
      lowerQuery.includes('200rb') ||
      lowerQuery.includes('200k') ||
      lowerQuery.includes('200.000')
    ) {
      matched = matched.filter((p) => (p.discountPrice || p.price) <= 200000);
    } else if (lowerQuery.includes('laris') || lowerQuery.includes('best seller')) {
      matched = matched.slice(0, 4);
    } else {
      matched = matched.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(lowerQuery);
        const catMatch = p.category.toLowerCase().includes(lowerQuery);
        const descMatch = (p.description || '').toLowerCase().includes(lowerQuery);
        const colorMatch = p.colors.some(
          (c) => lowerQuery.includes(c.toLowerCase()) || c.toLowerCase().includes(lowerQuery)
        );
        return nameMatch || catMatch || descMatch || colorMatch;
      });
    }

    recommendedProductIds = matched.slice(0, 4).map((p) => p.id);

    if (recommendedProductIds.length > 0) {
      aiReply = `Halo Kak! Berdasarkan pencarian Anda "${message}", berikut adalah pilihan produk RajaBrukat yang cocok:`;
    } else {
      recommendedProductIds = [];
      aiReply = `Halo Kak! Saat ini kami belum menemukan produk yang persis sama dengan kriteria "${message}". Silakan tanyakan warna, model, atau rentang harga lainnya.`;
    }
  }

  const recommendedProducts = products.filter((p) => recommendedProductIds.includes(p.id));

  return {
    reply: aiReply,
    products: recommendedProducts,
  };
};

export const handleAISmartSearch = async (query: string) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const lower = query.toLowerCase();
  const matchedProducts = products.filter((p) => {
    const inName = p.name.toLowerCase().includes(lower);
    const inCategory = p.category.toLowerCase().includes(lower);
    const inDesc = (p.description || '').toLowerCase().includes(lower);
    const inColors = p.colors.some(
      (c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower)
    );
    return inName || inCategory || inDesc || inColors;
  });

  let aiSummary = `Menampilkan ${matchedProducts.length} hasil terbaik untuk "${query}".`;
  if (matchedProducts.length > 0) {
    const topCategories = Array.from(new Set(matchedProducts.map((p) => p.category))).join(', ');
    aiSummary = `AI menemukan ${matchedProducts.length} produk pilihan dalam kategori ${topCategories} yang sesuai dengan kriteria warna & model pencarian Anda.`;
  }

  return {
    aiSummary,
    products: matchedProducts,
  };
};

export const handleAIVisualSearch = async (image: string) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  let analysis = '';
  let matchedIds: string[] = [];

  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const catalogText = products
        .map((p) => `ID: ${p.id} | Nama: ${p.name} | Warna: ${p.colors.join(', ')} | Kategori: ${p.category}`)
        .join('\n');

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const prompt = `Analisis foto kain/brokat ini. Sebutkan warna dominan, tekstur/motif brokat, dan kecocokan model. Lalu pilih ID produk dari katalog berikut yang paling mirip:
${catalogText}

Kembalikan format JSON:
{
  "analysis": "Deskripsi singkat mengenai warna dan pola yang terdeteksi pada gambar...",
  "matchedIds": ["id1", "id2"]
}`;

      const { text: responseText, usedModel } = await generateContentWithFallback(genAI, [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
      ]);
      console.log(`[AI Visual Search] Successfully analyzed image using model: ${usedModel}`);

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      analysis = parsed.analysis || 'Foto berhasil dianalisis oleh AI.';
      matchedIds = parsed.matchedIds || [];
    } catch (err: any) {
      console.error('Gemini Visual Search Error:', err?.message || err);
    }
  }

  if (matchedIds.length === 0 && !analysis) {
    analysis =
      'Foto berhasil dianalisis oleh AI, namun saat ini belum ditemukan pola kain yang mirip di dalam katalog.';
  }

  const recommended = products.filter((p) => matchedIds.includes(p.id));

  return {
    analysis,
    products: recommended,
  };
};
