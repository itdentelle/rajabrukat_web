"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.901 2.89 2.893 2.893 0 0 1-2.89-2.89 2.893 2.893 0 0 1 2.89-2.89c.376 0 .736.07 1.066.2v-3.52a6.38 6.38 0 0 0-1.066-.092 6.338 6.338 0 0 0-6.333 6.333A6.338 6.338 0 0 0 9.477 22a6.338 6.338 0 0 0 6.333-6.333V9.012a8.216 8.216 0 0 0 4.779 1.516v-3.48a4.819 4.819 0 0 1-1.000-.362z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface SiteConfig {
  footerDesc: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
}

export default function Footer() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/config/hero")
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.warn("Could not load footer config from server, using default UI:", err));
  }, []);

  const descriptionText =
    "Raja Brukat – Pusat grosir dan eceran kain brukat berkualitas. Koleksi brukat terlengkap dengan berbagai motif yang indah dan elegan tentunya dengan harga yang terjangkau.";

  return (
    <footer className="bg-white text-stone-800 pt-16 pb-8 border-t border-stone-200">
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        {/* Brand & Description Column */}
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#b77305]">
            RAJA BRUKAT
          </h3>
          <p className="text-stone-600 text-sm leading-relaxed mb-6 font-normal">
            {descriptionText}
          </p>

          {/* Social Media Icon Buttons Only */}
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/rajabrukat_id"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Raja Brukat"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>

            <a
              href="https://facebook.com/rajabrukat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Raja Brukat"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
            >
              <FacebookIcon className="w-4 h-4" />
            </a>

            <a
              href="https://tiktok.com/@rajabrukatofficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Raja Brukat"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
            >
              <TikTokIcon className="w-4 h-4" />
            </a>

            <a
              href="https://wa.me/6285881667778"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Hotline Raja Brukat"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
            >
              <Phone className="w-4 h-4 stroke-[2]" />
            </a>
          </div>
        </div>

        {/* Kategori Kain Column */}
        <div>
          <h4 className="font-bold uppercase tracking-widest mb-5 text-xs text-[#b77305]">
            Kategori Kain
          </h4>
          <ul className="space-y-2.5 text-stone-600 text-sm font-medium">
            <li>
              <Link href="/shop" className="hover:text-[#b77305] transition-colors">
                Semua Produk
              </Link>
            </li>
            <li>
              <Link href="/shop?category=Brukat Tile Mutiara" className="hover:text-[#b77305] transition-colors">
                Brukat Tile Mutiara
              </Link>
            </li>
            <li>
              <Link href="/shop?category=Renda Chantilly" className="hover:text-[#b77305] transition-colors">
                Renda Chantilly
              </Link>
            </li>
            <li>
              <Link href="/shop?category=Cornely 3D" className="hover:text-[#b77305] transition-colors">
                Brukat Cornely 3D
              </Link>
            </li>
            <li>
              <Link href="/shop?category=Furing & Silk" className="hover:text-[#b77305] transition-colors">
                Silk & Furing Satin
              </Link>
            </li>
          </ul>
        </div>

        {/* Bantuan & Info Column */}
        <div>
          <h4 className="font-bold uppercase tracking-widest mb-5 text-xs text-[#b77305]">
            Bantuan & Info
          </h4>
          <ul className="space-y-2.5 text-stone-600 text-sm font-medium">
            <li>
              <Link href="/pages/faq" className="hover:text-[#b77305] transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/pages/shipping" className="hover:text-[#b77305] transition-colors">
                Info Pengiriman
              </Link>
            </li>
            <li>
              <Link href="/pages/returns" className="hover:text-[#b77305] transition-colors">
                Kebijakan Retur
              </Link>
            </li>
            <li>
              <Link href="/pages/contact" className="hover:text-[#b77305] transition-colors">
                Hubungi Kami
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div>
          <h4 className="font-bold uppercase tracking-widest mb-5 text-xs text-[#b77305]">
            Newsletter
          </h4>
          <p className="text-stone-600 text-sm mb-4 leading-relaxed font-normal">
            Berlangganan untuk mendapatkan info rilis kain brukat terbaru & penawaran spesial.
          </p>
          <form className="flex flex-col gap-2.5">
            <input
              suppressHydrationWarning
              type="email"
              placeholder="Masukkan email Anda"
              className="bg-stone-50 border border-stone-300 text-stone-900 placeholder:text-stone-400 px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] transition-colors rounded-lg shadow-sm"
            />
            <button
              suppressHydrationWarning
              type="button"
              className="bg-[#b77305] text-white font-bold uppercase tracking-widest text-xs py-3 hover:bg-[#965e04] transition-all rounded-lg shadow-md"
            >
              Berlangganan
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="container mx-auto px-6 md:px-12 border-t border-stone-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-stone-500 text-xs font-medium">
          &copy; {new Date().getFullYear()} Raja Brukat. All rights reserved.
        </p>
        <div className="flex gap-6 text-stone-500 text-xs font-medium">
          <Link href="/pages/privacy" className="hover:text-[#b77305] transition-colors">
            Kebijakan Privasi
          </Link>
          <Link href="/pages/terms" className="hover:text-[#b77305] transition-colors">
            Syarat & Ketentuan
          </Link>
        </div>
      </div>
    </footer>
  );
}
