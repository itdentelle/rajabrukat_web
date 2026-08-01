"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, HelpCircle, MessageSquare, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    category: "Pemesanan & Ukuran",
    question: "Berapa minimal pembelian kain di Raja Brukat?",
    answer: "Kami melayani pembelian eceran mulai dari 1 meter (dapat dipotong per 0.5 meter untuk tipe tertentu) hingga pemesanan partai grosir per roll (isi 15 hingga 50 yard) dengan harga spesial grosir distributor."
  },
  {
    id: 2,
    category: "Spesifikasi Kain",
    question: "Apakah warna & motif foto produk 100% sama dengan kain aslinya?",
    answer: "Semua foto produk diambil secara profesional dari stok fisik asli dengan pencahayaan studio. Akurasi warna mencapai 95-98%. Perbedaan tipis dapat terjadi akibat perbedaan kecerahan atau resolusi layar monitor/smartphone Anda."
  },
  {
    id: 3,
    category: "Spesifikasi Kain",
    question: "Apa perbedaan Brukat Tile Mutiara 3D, Renda Chantilly, dan Cornely 3D?",
    answer: "• Brukat Tile Mutiara 3D: Kain berbahan jaring tile halus bertabur sulaman bordir bunga timbul dan payet mutiara kristal berkilau.\n• Renda Chantilly French: Renda khas Prancis yang tidak menggunakan payet, memiliki serat ultra-soft yang sangat halus, adem, dan jatuh lembut di kulit.\n• Cornely 3D: Brukat dengan teknik bordir sulam timbul bergaris tegas, memberikan tekstur kokoh & elegan untuk kebaya couture dan gaun pengantin."
  },
  {
    id: 4,
    category: "Pemesanan & Ukuran",
    question: "Apakah Raja Brukat melayani pesanan kain seragaman kebaya / bridesmaid?",
    answer: "Tentu saja! Kami berpengalaman menangani pesanan kain seragam pernikahan, bridesmaid, wisuda, dan acara keluarga. Kami siap menyediakan stok kain dengan seri kode warna & motif yang sama persis dalam jumlah besar."
  },
  {
    id: 5,
    category: "Pemesanan & Ukuran",
    question: "Berapa estimasi kebutuhan meter kain untuk membuat kebaya & gaun pesta?",
    answer: "Panduan perkiraan kebutuhan kain umum:\n• Kebaya Pendek / Atasan: ± 1.5 - 2 Meter\n• Kebaya Panjang / Tunik: ± 2 - 2.5 Meter\n• Gaun Pesta / Gamis Brukat: ± 3 - 4 Meter\n• Furing Dalaman (Silk Satin): Menyesuaikan panjang pakaian (± 2 - 3 Meter).\n*Disarankan untuk berkonsultasi dengan penjahit Anda sebelum memotong."
  },
  {
    id: 6,
    category: "Pengiriman & Grosir",
    question: "Metode pembayaran apa saja yang bisa digunakan?",
    answer: "Kami menerima berbagai metode pembayaran aman:\n• Transfer Bank Resmi (BCA, Mandiri, BRI, BNI)\n• E-Wallet (GoPay, OVO, DANA, ShopeePay)\n• Instant QRIS & Virtual Account Otomatis\n• Kartu Kredit / Debit Online"
  },
  {
    id: 7,
    category: "Pengiriman & Grosir",
    question: "Berapa lama pengiriman barang dan apakah bisa kirim kargo grosir?",
    answer: "Pengiriman diproses pada hari yang sama dari gudang pusat kami. Estimasi wilayah Jabodetabek & Jawa 1-2 hari kerja, luar pulau 2-4 hari kerja via JNE, J&T, Sicepat. Untuk pembelian grosir jumlah besar/roll, kami menyediakan ekspedisi kargo langganan hemat biaya seperti Indah Kargo, Sentral Kargo, atau Dakota."
  },
  {
    id: 8,
    category: "Garansi & Retur",
    question: "Bagaimana jika kain yang diterima rusak, cacat bordir, atau warna salah?",
    answer: "Raja Brukat memberikan Garansi Retur 100% Tukar Baru atau Refund. Jika kain cacat atau salah kirim, wajib melampirkan video unboxing saat paket pertama kali dibuka dan hubungi Customer Service kami dalam waktu maksimal 2x24 jam."
  }
];

const CATEGORIES = ["Semua", "Pemesanan & Ukuran", "Spesifikasi Kain", "Pengiriman & Grosir", "Garansi & Retur"];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(1); // Open first by default

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-28 pb-24">
      {/* Top Hero Section Header */}
      <div className="bg-white border-b border-stone-200 py-12 mb-12 shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-stone-900 mb-4">
            Pertanyaan Umum (FAQ)
          </h1>
          
          <p className="text-stone-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Temukan jawaban lengkap seputar pembelian kain, meteran/roll, spesifikasi bahan brukat, pengiriman kargo, hingga garansi retur.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan... (cth: minimal pemesanan, grosir, chantilly)"
              className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                selectedCategory === cat
                  ? "bg-[#b77305] text-white shadow-md scale-105"
                  : "bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
                    isOpen
                      ? "border-[#b77305] shadow-lg ring-1 ring-[#b77305]/20"
                      : "border-stone-200 hover:border-stone-300 shadow-sm"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        isOpen ? "text-[#b77305]" : "text-stone-400"
                      }`} />
                      <span className="font-bold text-stone-900 text-base sm:text-lg">
                        {faq.question}
                      </span>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                      isOpen ? "bg-[#b77305]/10 text-[#b77305] rotate-180" : "bg-stone-100 text-stone-500"
                    }`}>
                      <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 text-stone-600 text-sm md:text-base leading-relaxed border-t border-stone-100 whitespace-pre-line font-normal">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm">
              <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-700 font-bold text-lg mb-1">Pertanyaan Tidak Ditemukan</p>
              <p className="text-stone-500 text-sm">Cobalah mencari dengan kata kunci lain atau pilih kategori Semua.</p>
            </div>
          )}
        </div>

        {/* Direct Contact CS Card Banner */}
        <div className="mt-16 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="relative z-10 text-center sm:text-left">
            <span className="text-[#b77305] text-xs font-bold uppercase tracking-widest block mb-2">
              ✦ Butuh Bantuan Lebih Lanjut?
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">
              Masih Memiliki Pertanyaan Khusus?
            </h3>
            <p className="text-stone-300 text-sm max-w-lg">
              Tim Customer Service Raja Brukat siap melayani konsultasi pemilihan jenis kain, pencocokan warna, hingga kalkulasi harga grosir per roll.
            </p>
          </div>

          <a
            href="https://wa.me/6285881667778"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 px-7 py-3.5 bg-[#b77305] hover:bg-[#965e04] text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2.5 whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat CS WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
