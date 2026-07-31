"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data) setConfig(data);
      })
      .catch(err => console.warn("Could not load footer config from server, using default UI:", err));
  }, []);

  return (
    <footer className="bg-stone-950 text-stone-200 pt-16 pb-8 border-t border-[#b77305]/20">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-[#b77305]">
            RAJA BRUKAT
          </h3>
          <p className="text-stone-400 text-sm leading-relaxed mb-6">
            {config?.footerDesc || "Raja Brukat penyedia kain brukat, renda Chantilly, tile mutiara, dan silk premium berkualitas tinggi di Indonesia. Menyediakan berbagai motif anggun untuk gaun, kebaya, dan seragam istimewa Anda."}
          </p>
          <div className="flex gap-6">
            <a href={config?.instagramUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-[#b77305] hover:text-white transition-colors font-semibold text-xs tracking-widest uppercase">
              INSTAGRAM
            </a>
            <a href={config?.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-[#b77305] hover:text-white transition-colors font-semibold text-xs tracking-widest uppercase">
              FACEBOOK
            </a>
            <a href={config?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-[#b77305] hover:text-white transition-colors font-semibold text-xs tracking-widest uppercase">
              TWITTER
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6 text-xs text-[#b77305]">Kategori Kain</h4>
          <ul className="space-y-3 text-stone-400 text-sm">
            <li><Link href="/shop" className="hover:text-[#b77305] transition-colors">Semua Produk</Link></li>
            <li><Link href="/shop?category=Brukat Tile Mutiara" className="hover:text-[#b77305] transition-colors">Brukat Tile Mutiara</Link></li>
            <li><Link href="/shop?category=Renda Chantilly" className="hover:text-[#b77305] transition-colors">Renda Chantilly</Link></li>
            <li><Link href="/shop?category=Cornely 3D" className="hover:text-[#b77305] transition-colors">Brukat Cornely 3D</Link></li>
            <li><Link href="/shop?category=Furing & Silk" className="hover:text-[#b77305] transition-colors">Silk & Furing Satin</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6 text-xs text-[#b77305]">Bantuan & Info</h4>
          <ul className="space-y-3 text-stone-400 text-sm">
            <li><Link href="/pages/faq" className="hover:text-[#b77305] transition-colors">FAQ</Link></li>
            <li><Link href="/pages/shipping" className="hover:text-[#b77305] transition-colors">Info Pengiriman</Link></li>
            <li><Link href="/pages/returns" className="hover:text-[#b77305] transition-colors">Kebijakan Retur</Link></li>
            <li><Link href="/pages/contact" className="hover:text-[#b77305] transition-colors">Hubungi Kami</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6 text-xs text-[#b77305]">Newsletter</h4>
          <p className="text-stone-400 text-sm mb-4">Berlangganan untuk mendapatkan info rilis kain brukat terbaru & penawaran spesial.</p>
          <form className="flex flex-col gap-3">
            <input 
              suppressHydrationWarning
              type="email" 
              placeholder="Masukkan email Anda" 
              className="bg-stone-900 border border-[#b77305]/30 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#b77305] transition-colors rounded-sm"
            />
            <button 
              suppressHydrationWarning
              type="button" 
              className="bg-[#b77305] text-white font-bold uppercase tracking-widest text-xs py-3 hover:bg-[#965e04] transition-all rounded-sm shadow-md"
            >
              Berlangganan
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 border-t border-stone-800/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-stone-500 text-xs">
          &copy; {new Date().getFullYear()} Raja Brukat. All rights reserved.
        </p>
        <div className="flex gap-4 text-stone-500 text-xs">
          <Link href="/pages/privacy" className="hover:text-[#b77305]">Kebijakan Privasi</Link>
          <Link href="/pages/terms" className="hover:text-[#b77305]">Syarat & Ketentuan</Link>
        </div>
      </div>
    </footer>
  );
}
