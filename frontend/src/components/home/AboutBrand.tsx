"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Sparkles, Feather, Palette } from "lucide-react";

import { cleanTitle } from "@/utils/cleanTitle";
import { API_BASE_URL } from "@/lib/api";

interface SiteConfig {
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
}

const FABRIC_CIRCLES = [
  {
    id: 1,
    name: "Brukat Tile Mutiara",
    image: "/images/brukat_tile_mutiara.png",
    link: "/shop?category=Brukat Tile Mutiara",
  },
  {
    id: 2,
    name: "Renda Chantilly",
    image: "/images/renda_chantilly_french.png",
    link: "/shop?category=Renda Chantilly",
  },
  {
    id: 3,
    name: "Cornely 3D Lace",
    image: "/images/cornely_silk_satin.png",
    link: "/shop?category=Cornely 3D",
  },
  {
    id: 4,
    name: "Silk Satin Furing",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop",
    link: "/shop?category=Furing %26 Silk",
  },
  {
    id: 5,
    name: "Organza & Tulle",
    image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=600&auto=format&fit=crop",
    link: "/shop",
  },
];

export default function AboutBrand() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [circles, setCircles] = useState(FABRIC_CIRCLES);
  const [showCircles, setShowCircles] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.warn("Could not load brand config from server, using default UI:", err));

    // Fetch live products from Supabase database to populate fabric circles dynamically
    fetch(`${API_BASE_URL}/api/products?limit=5`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const products = data.products || data;
        if (Array.isArray(products) && products.length > 0) {
          const dynamicCircles = products.slice(0, 5).map((p: any) => {
            const { displayTitle } = cleanTitle(p.name);
            return {
              id: p.id,
              name: displayTitle,
              image: p.image || "/images/brukat_tile_mutiara.png",
              link: `/products/${p.id}`,
            };
          });
          setCircles(dynamicCircles);
        }
      })
      .catch((err) => console.warn("Failed to fetch dynamic circle fabrics from database:", err));
  }, []);

  // Sticky Scroll Pinning specifically for the Big Text Header & Ribbon Animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    restDelta: 0.001,
  });

  // Animates ribbon from 0 to 1 during the pinned scroll of the big text header
  const pathLengthProgress = useTransform(smoothProgress, [0, 0.85], [0, 1]);

  return (
    <section className="bg-white text-black relative">
      
      {/* Pinned Scroll Track: Big Text Header stays centered while ribbon animation draws */}
      <div ref={containerRef} className="relative h-[170vh]">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
          
          {/* Header Box framed by Refined Calligraphic Ribbon */}
          <div className="relative w-full max-w-4xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center justify-center">
            
            {/* Fabric Strand SVG Framing OUTSIDE The Big Header Text */}
            <div className="absolute -inset-6 sm:-inset-12 pointer-events-none z-0 flex items-center justify-center select-none overflow-visible" style={{ willChange: 'transform' }}>
              <svg
                className="w-full h-full min-h-[320px] md:min-h-[380px] opacity-85 md:opacity-95 overflow-visible"
                viewBox="0 0 1080 360"
                fill="none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="calligraphyGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b77305" stopOpacity="0.15" />
                    <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.95" />
                    <stop offset="65%" stopColor="#d97706" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#b77305" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Main Calligraphic Ribbon Strand with Equal Top & Bottom Spacing Buffer */}
                <motion.path
                  d="M 80 48 C 280 20, 780 20, 905 48 S 975 190, 870 260 S 670 335, 630 300 S 710 260, 760 280 S 390 330, 80 300"
                  stroke="url(#calligraphyGold)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{ pathLength: pathLengthProgress }}
                />

                {/* Secondary Parallel Dashed Ribbon Accent */}
                <motion.path
                  d="M 65 60 C 270 32, 770 32, 920 60 S 990 202, 885 272 S 685 347, 645 312 S 725 272, 775 292 S 405 342, 65 312"
                  stroke="url(#calligraphyGold)"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  style={{ pathLength: pathLengthProgress }}
                />
              </svg>
            </div>

            {/* Big Text Header with Luxury Serif Typography */}
            <div className="w-full text-center relative z-10 px-4 py-4 my-auto">
              <Reveal>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#b77305] mb-3">
                    Koleksi Tekstil Eksklusif
                  </span>
                  <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium tracking-wide leading-[1.25] text-stone-950 max-w-2xl sm:max-w-3xl">
                    <span className="block">Didedikasikan Untuk</span>
                    <span className="block text-[#b77305] italic font-serif mt-1.5">
                      Keindahan Kebaya & Gaun Mewah
                    </span>
                  </h3>
                </div>
              </Reveal>
            </div>

          </div>

        </div>
      </div>

      {/* Subsequent Content: Swatches & Feature Cards (Scrolls naturally after header ribbon animation) */}
      <div className="container mx-auto px-4 pb-24 pt-12 relative z-10 border-t border-stone-100">
        <div className="max-w-7xl mx-auto">

          {/* Tombol Opsi: Tampilkan / Sembunyikan Kategori Bulat */}
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => setShowCircles(!showCircles)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white font-medium text-xs rounded-full border border-stone-200 transition-all shadow-sm hover:scale-105 active:scale-95 group"
              title="Tombol Opsi Tampilan Kategori Bulat"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#b77305] group-hover:text-white" />
              <span>{showCircles ? "Sembunyikan / Hapus Kategori Bulat" : "Tampilkan Kategori Bulat"}</span>
            </button>
          </div>

          {/* Circular Fabric Categories Swatch Row */}
          {showCircles && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -15 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="mb-20 overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 items-start justify-items-center py-4">
                {circles.map((item) => (
                  <div key={item.id} className="w-full flex flex-col items-center text-center group cursor-pointer max-w-[190px]">
                    <Link href={item.link} className="w-full flex flex-col items-center group">
                      {/* Circle Avatar Container */}
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden p-1 bg-white shadow-lg shadow-stone-200/80 group-hover:shadow-2xl group-hover:shadow-[#b77305]/20 transition-all duration-500 border border-stone-200/80 group-hover:border-[#b77305] group-hover:scale-105">
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-stone-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 130px, (max-width: 1024px) 150px, 160px"
                            className="object-cover object-center group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                      </div>

                      {/* Category Name Label */}
                      <h3 className="mt-4 text-xs sm:text-sm font-serif font-medium text-stone-900 group-hover:text-[#b77305] leading-snug transition-colors line-clamp-3 px-1 text-center">
                        {item.name}
                      </h3>
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Animated Feature Cards Grid with Custom Gold Emblem Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left relative z-20">
            {[
              {
                title: "Detail Brukat Mutiara",
                desc: "Setiap helai kain diperkaya dengan motif bordir rapat, taburan mutiara timbul, dan payet kilau berkualitas tinggi.",
                icon: Sparkles,
              },
              {
                title: "Bahan Halus & Nyaman",
                desc: "Serat renda Chantilly dan tile kualitas ekspor yang lembut di kulit, tidak gatal, serta jatuh secara sempurna.",
                icon: Feather,
              },
              {
                title: "Pilihan Warna Lengkap",
                desc: "Tersedia puluhan varian warna anggun mulai dari pastel lembut, rose gold, nude, champagne, hingga warna royal tajam.",
                icon: Palette,
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
                  className="p-8 border border-[#e8ded2] hover:border-[#b77305]/60 transition-all duration-500 bg-gradient-to-b from-[#faf8f5] to-[#f6f0ea] backdrop-blur-sm group hover:-translate-y-2 shadow-sm hover:shadow-xl rounded-2xl relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Gold Highlight Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b77305]/40 to-transparent group-hover:via-[#b77305] transition-all duration-500" />

                  <div>
                    {/* Gold Icon Emblem Badge */}
                    <div className="w-12 h-12 rounded-full bg-[#b77305]/10 border border-[#b77305]/30 flex items-center justify-center text-[#b77305] mb-6 group-hover:bg-[#b77305] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>

                    <h4 className="text-xl font-serif font-medium tracking-wide mb-3 text-stone-950 group-hover:text-[#b77305] transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-stone-600 text-sm leading-relaxed font-light group-hover:text-stone-800 transition-colors">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Call To Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 flex justify-center relative z-20"
          >
            <Link
              href="/shop"
              className="px-10 py-4 font-medium text-white transition-all duration-300 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] rounded-full shadow-xl shadow-[#b77305]/25 hover:shadow-2xl hover:shadow-[#b77305]/40 hover:scale-[1.03] active:scale-95 group inline-flex items-center gap-3"
            >
              <span className="uppercase tracking-widest text-xs font-bold">
                Eksplor Koleksi Lengkap
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

        </div>
      </div>

    </section>
  );
}
