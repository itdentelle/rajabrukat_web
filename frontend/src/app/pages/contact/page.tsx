"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import FullWidthHeroSlider from "@/components/home/FullWidthHeroSlider";
import { cleanImageUrl } from "@/utils/cleanImageUrl";

function TikTokIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.901 2.89 2.893 2.893 0 0 1-2.89-2.89 2.893 2.893 0 0 1 2.89-2.89c.376 0 .736.07 1.066.2v-3.52a6.38 6.38 0 0 0-1.066-.092 6.338 6.338 0 0 0-6.333 6.333A6.338 6.338 0 0 0 9.477 22a6.338 6.338 0 0 0 6.333-6.333V9.012a8.216 8.216 0 0 0 4.779 1.516v-3.48a4.819 4.819 0 0 1-1.000-.362z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

import { API_BASE_URL } from "@/lib/api";
import { useEffect } from "react";

export default function ContactPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    needType: "Eceran Meteran",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Mohon isi Nama Lengkap dan Nomor WhatsApp Anda.");
      return;
    }
    toast.success("Pesan konsultasi Anda berhasil dikirim! Tim Raja Brukat akan segera menghubungi Anda.");
    setFormData({ name: "", phone: "", email: "", needType: "Eceran Meteran", message: "" });
  };

  const contactHeroConfig = {
    title: config?.contactHeroTitle || "Layanan & Konsultasi Kain Raja Brukat",
    subtitle: config?.contactHeroSubtitle || "HUBUNGI TIM CS KAMI",
    imageUrl: config?.contactHeroImage || "/images/white_lace_hero.png",
    buttonText: "Konsultasi Sekarang",
    buttonLink: "#form-section",
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-24 pt-16">
      {/* Single Static Hero Banner (Khusus Halaman Contact Us) */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-stone-950 overflow-hidden flex items-center justify-center">
        <Image
          src={cleanImageUrl(config?.contactHeroImage, "/images/white_lace_hero.png")}
          alt={config?.contactHeroTitle || "Layanan & Konsultasi Kain Raja Brukat"}
          fill
          priority
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent" />
        <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-serif drop-shadow-md">
            {config?.contactHeroTitle || "Layanan & Konsultasi Kain Raja Brukat"}
          </h1>
          <div className="pt-2">
            <a
              href="#form-section"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#b77305] hover:bg-[#d4af37] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-105"
            >
              <span>Konsultasi Sekarang</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div id="form-section" className="container mx-auto px-6 max-w-6xl pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form Section */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-md">
            <h3 className="text-2xl font-bold uppercase tracking-tight mb-2 text-stone-900">
              Formulir Konsultasi Kain
            </h3>
            <p className="text-stone-500 text-sm mb-8">
              Isi data di bawah ini untuk berkonsultasi mengenai produk, sampel motif, atau pesanan khusus.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-700">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all"
                    placeholder="Contoh: Siska Wijaya"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-700">
                    No. WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all"
                    placeholder="085881667778"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-700">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all"
                    placeholder="nama@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-700">
                    Kategori Kebutuhan
                  </label>
                  <select
                    value={formData.needType}
                    onChange={(e) => setFormData({ ...formData, needType: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all"
                  >
                    <option value="Eceran Meteran">Pembelian Eceran Meteran</option>
                    <option value="Grosir Roll">Pembelian Grosir Roll (15-50 yard)</option>
                    <option value="Seragam Kebaya">Seragam Kebaya / Bridesmaid</option>
                    <option value="Sampel Kain">Permintaan Sampel Kain & Katalog</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-stone-700">
                  Detail Pesan / Pertanyaan
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] focus:ring-2 focus:ring-[#b77305]/20 transition-all resize-none"
                  placeholder="Tuliskan pertanyaan atau spesifikasi kain yang Anda butuhkan..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-[#b77305] hover:bg-[#965e04] text-white font-bold uppercase tracking-wider text-sm py-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pesan Konsultasi</span>
              </button>
            </form>
          </div>

          {/* Right Column: Direct Info & Hotline */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick WhatsApp Contact Card */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <span className="text-[#b77305] text-xs font-bold uppercase tracking-wider block mb-2">
                ✦ CS Fast Response
              </span>
              <h4 className="text-2xl font-bold mb-3">Layanan Chat Langsung</h4>
              <p className="text-stone-300 text-sm leading-relaxed mb-6">
                Butuh respon cepat? Hubungi Tim Customer Service Raja Brukat langsung melalui WhatsApp Hotline.
              </p>

              <a
                href={`https://wa.me/${config?.contactWhatsapp || "6285881667778"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat Hotline: {config?.contactPhone || "+62 858-8166-7778"}</span>
              </a>
            </div>

            {/* Official Details List */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-md space-y-6">
              <h4 className="font-bold text-base uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
                Informasi Kontak Resmi
              </h4>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#b77305]/10 text-[#b77305] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">Hot Line / WhatsApp</h5>
                  <p className="text-stone-900 font-semibold text-sm">{config?.contactPhone || "+62 858-8166-7778"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#b77305]/10 text-[#b77305] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">Email Resmi</h5>
                  <p className="text-stone-900 font-semibold text-sm">{config?.contactEmail || "info@rajabrukat.com"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#b77305]/10 text-[#b77305] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">Gudang & Pusat Distribusi</h5>
                  <p className="text-stone-900 font-semibold text-sm">{config?.contactAddress || "Pusat Tekstil Raja Brukat, Indonesia"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#b77305]/10 text-[#b77305] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">Jam Operasional CS</h5>
                  <p className="text-stone-900 font-semibold text-sm">{config?.contactHours || "Senin - Sabtu: 08:00 - 17:00 WIB"}</p>
                </div>
              </div>

              {/* Social Media Buttons */}
              <div className="pt-4 border-t border-stone-100">
                <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 mb-3">Kunjungi Media Sosial</h5>
                <div className="flex items-center gap-3">
                  <a
                    href="https://instagram.com/rajabrukat_id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="https://facebook.com/rajabrukat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="https://tiktok.com/@rajabrukatofficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm"
                  >
                    <TikTokIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Google Maps Embed Section */}
        <div className="mt-12 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#b77305]/10 text-[#b77305] rounded-2xl border border-[#b77305]/20">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-stone-900">
                  Lokasi Toko Fisik & Gudang Raja Brukat
                </h3>
                <p className="text-xs text-stone-500">
                  {config?.contactAddress || "Pusat Tekstil Raja Brukat, Bandung Barat, Jawa Barat"}
                </p>
              </div>
            </div>
            <a
              href="https://www.google.com/maps/place/PT+DENTELLE+JAYA+INFINITEX/@-6.8956179,107.4896587,19z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-[#b77305] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>Petunjuk Arah (Buka di Maps)</span>
            </a>
          </div>

          {/* Map Frame Container */}
          <div className="w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100 relative">
            <iframe
              src={config?.contactGoogleMapsUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1187.2240338601398!2d107.48965865213147!3d-6.8956179324681655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e5e6c2ac2c03%3A0xba4f6af7cd349986!2sPT%20DENTELLE%20JAYA%20INFINITEX!5e0!3m2!1sen!2sid!4v1786429590520!5m2!1sen!2sid"}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Google Maps PT DENTELLE JAYA INFINITEX (Raja Brukat)"
              className="w-full h-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
