import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const DEFAULT_FAQS = [
  {
    category: 'Pemesanan & Ukuran',
    question: 'Berapa minimal pembelian kain di Raja Brukat?',
    answer:
      'Kami melayani pembelian eceran mulai dari 1 meter (dapat dipotong per 0.5 meter untuk tipe tertentu) hingga pemesanan partai grosir per roll (isi 15 hingga 50 yard) dengan harga spesial grosir distributor.',
    order: 1,
  },
  {
    category: 'Spesifikasi Kain',
    question: 'Apakah warna & motif foto produk 100% sama dengan kain aslinya?',
    answer:
      'Semua foto produk diambil secara profesional dari stok fisik asli dengan pencahayaan studio. Akurasi warna mencapai 95-98%. Perbedaan tipis dapat terjadi akibat perbedaan kecerahan atau resolusi layar monitor/smartphone Anda.',
    order: 2,
  },
  {
    category: 'Spesifikasi Kain',
    question: 'Apa perbedaan Brukat Tile Mutiara 3D, Renda Chantilly, dan Cornely 3D?',
    answer:
      '• Brukat Tile Mutiara 3D: Kain berbahan jaring tile halus bertabur sulaman bordir bunga timbul dan payet mutiara kristal berkilau.\n• Renda Chantilly French: Renda khas Prancis yang tidak menggunakan payet, memiliki serat ultra-soft yang sangat halus, adem, dan jatuh lembut di kulit.\n• Cornely 3D: Brukat dengan teknik bordir sulam timbul bergaris tegas, memberikan tekstur kokoh & elegan untuk kebaya couture dan gaun pengantin.',
    order: 3,
  },
  {
    category: 'Pemesanan & Ukuran',
    question: 'Apakah Raja Brukat melayani pesanan kain seragaman kebaya / bridesmaid?',
    answer:
      'Tentu saja! Kami berpengalaman menangani pesanan kain seragam pernikahan, bridesmaid, wisuda, dan acara keluarga. Kami siap menyediakan stok kain dengan seri kode warna & motif yang sama persis dalam jumlah besar.',
    order: 4,
  },
  {
    category: 'Pemesanan & Ukuran',
    question: 'Berapa estimasi kebutuhan meter kain untuk membuat kebaya & gaun pesta?',
    answer:
      'Panduan perkiraan kebutuhan kain umum:\n• Kebaya Pendek / Atasan: ± 1.5 - 2 Meter\n• Kebaya Panjang / Tunik: ± 2 - 2.5 Meter\n• Gaun Pesta / Gamis Brukat: ± 3 - 4 Meter\n• Furing Dalaman (Silk Satin): Menyesuaikan panjang pakaian (± 2 - 3 Meter).\n*Disarankan untuk berkonsultasi dengan penjahit Anda sebelum memotong.',
    order: 5,
  },
  {
    category: 'Pengiriman & Grosir',
    question: 'Metode pembayaran apa saja yang bisa digunakan?',
    answer:
      'Kami menerima berbagai metode pembayaran aman:\n• Transfer Bank Resmi (BCA, Mandiri, BRI, BNI)\n• E-Wallet (GoPay, OVO, DANA, ShopeePay)\n• Instant QRIS & Virtual Account Otomatis\n• Kartu Kredit / Debit Online',
    order: 6,
  },
  {
    category: 'Pengiriman & Grosir',
    question: 'Berapa lama pengiriman barang dan apakah bisa kirim kargo grosir?',
    answer:
      'Pengiriman diproses pada hari yang sama dari gudang pusat kami. Estimasi wilayah Jabodetabek & Jawa 1-2 hari kerja, luar pulau 2-4 hari kerja via JNE, J&T, Sicepat. Untuk pembelian grosir jumlah besar/roll, kami menyediakan ekspedisi kargo langganan hemat biaya seperti Indah Kargo, Sentral Kargo, atau Dakota.',
    order: 7,
  },
  {
    category: 'Garansi & Retur',
    question: 'Bagaimana jika kain yang diterima rusak, cacat bordir, atau warna salah?',
    answer:
      'Raja Brukat memberikan Garansi Retur 100% Tukar Baru atau Refund. Jika kain cacat atau salah kirim, wajib melampirkan video unboxing saat paket pertama kali dibuka dan hubungi Customer Service kami dalam waktu maksimal 2x24 jam.',
    order: 8,
  },
];

export const getFaqs = async (req: Request, res: Response) => {
  try {
    const count = await prisma.faqItem.count();
    if (count === 0) {
      await prisma.faqItem.createMany({
        data: DEFAULT_FAQS,
      });
    }

    const faqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { category, question, answer, order } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi.' });
    }

    const faq = await prisma.faqItem.create({
      data: {
        category: category || 'Pemesanan & Ukuran',
        question,
        answer,
        order: order ? parseInt(order) : 0,
      },
    });

    res.json(faq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, question, answer, order, isActive } = req.body;

    const faq = await prisma.faqItem.update({
      where: { id: id as string },
      data: {
        category,
        question,
        answer,
        order: order !== undefined ? parseInt(order) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.json(faq);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.faqItem.delete({
      where: { id: id as string },
    });

    res.json({ message: 'FAQ item deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
};
