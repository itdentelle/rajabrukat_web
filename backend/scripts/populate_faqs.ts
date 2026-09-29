import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('aws');
const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined
});

const DEFAULT_FAQS = [
  {
    category: "Pemesanan & Ukuran",
    question: "Berapa minimal pembelian kain di Raja Brukat?",
    answer: "Kami melayani pembelian eceran mulai dari 1 meter (dapat dipotong per 0.5 meter untuk tipe tertentu) hingga pemesanan partai grosir per roll (isi 15 hingga 50 yard) dengan harga spesial grosir distributor.",
    order: 1
  },
  {
    category: "Spesifikasi Kain",
    question: "Apakah warna & motif foto produk 100% sama dengan kain aslinya?",
    answer: "Semua foto produk diambil secara profesional dari stok fisik asli dengan pencahayaan studio. Akurasi warna mencapai 95-98%. Perbedaan tipis dapat terjadi akibat perbedaan kecerahan atau resolusi layar monitor/smartphone Anda.",
    order: 2
  },
  {
    category: "Spesifikasi Kain",
    question: "Apa perbedaan Brukat Tile Mutiara 3D, Renda Chantilly, dan Cornely 3D?",
    answer: "• Brukat Tile Mutiara 3D: Kain berbahan jaring tile halus bertabur sulaman bordir bunga timbul dan payet mutiara kristal berkilau.\n• Renda Chantilly French: Renda khas Prancis yang tidak menggunakan payet, memiliki serat ultra-soft yang sangat halus, adem, dan jatuh lembut di kulit.\n• Cornely 3D: Brukat dengan teknik bordir sulam timbul bergaris tegas, memberikan tekstur kokoh & elegan untuk kebaya couture dan gaun pengantin.",
    order: 3
  },
  {
    category: "Pemesanan & Ukuran",
    question: "Apakah Raja Brukat melayani pesanan kain seragaman kebaya / bridesmaid?",
    answer: "Tentu saja! Kami berpengalaman menangani pesanan kain seragam pernikahan, bridesmaid, wisuda, dan acara keluarga. Kami siap menyediakan stok kain dengan seri kode warna & motif yang sama persis dalam jumlah besar.",
    order: 4
  },
  {
    category: "Pemesanan & Ukuran",
    question: "Berapa estimasi kebutuhan meter kain untuk membuat kebaya & gaun pesta?",
    answer: "Panduan perkiraan kebutuhan kain umum:\n• Kebaya Pendek / Atasan: ± 1.5 - 2 Meter\n• Kebaya Panjang / Tunik: ± 2 - 2.5 Meter\n• Gaun Pesta / Gamis Brukat: ± 3 - 4 Meter\n• Furing Dalaman (Silk Satin): Menyesuaikan panjang pakaian (± 2 - 3 Meter).\n*Disarankan untuk berkonsultasi dengan penjahit Anda sebelum memotong.",
    order: 5
  },
  {
    category: "Pengiriman & Grosir",
    question: "Metode pembayaran apa saja yang bisa digunakan?",
    answer: "Kami menerima berbagai metode pembayaran aman:\n• Transfer Bank Resmi (BCA, Mandiri, BRI, BNI)\n• E-Wallet (GoPay, OVO, DANA, ShopeePay)\n• Instant QRIS & Virtual Account Otomatis\n• Kartu Kredit / Debit Online",
    order: 6
  },
  {
    category: "Pengiriman & Grosir",
    question: "Berapa lama pengiriman barang dan apakah bisa kirim kargo grosir?",
    answer: "Pengiriman diproses pada hari yang sama dari gudang pusat kami. Estimasi wilayah Jabodetabek & Jawa 1-2 hari kerja, luar pulau 2-4 hari kerja via JNE, J&T, Sicepat. Untuk pembelian grosir jumlah besar/roll, kami menyediakan ekspedisi kargo langganan hemat biaya seperti Indah Kargo, Sentral Kargo, atau Dakota.",
    order: 7
  },
  {
    category: "Garansi & Retur",
    question: "Bagaimana jika kain yang diterima rusak, cacat bordir, atau warna salah?",
    answer: "Raja Brukat memberikan Garansi Retur 100% Tukar Baru atau Refund. Jika kain cacat atau salah kirim, wajib melampirkan video unboxing saat paket pertama kali dibuka dan hubungi Customer Service kami dalam waktu maksimal 2x24 jam.",
    order: 8
  }
];

async function main() {
  console.log("Populating FaqItem table...");

  for (const item of DEFAULT_FAQS) {
    await pool.query(`
      INSERT INTO "FaqItem" ("id", "category", "question", "answer", "order", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
    `, [item.category, item.question, item.answer, item.order]);
  }

  console.log("SUCCESS: FaqItem table populated with 8 initial Q&A rows!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
