"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface HeroConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
}

interface HeroBannerProps {
  config?: HeroConfig;
}

const CATEGORY_PANELS = [
  {
    id: 1,
    num: "01",
    category: "BRUKAT TILE MUTIARA 3D",
    title: "Brukat Tile Mutiara",
    description: "Seni bordir tile bertabur payet mutiara kristal mewah untuk kebaya & gaun pesta.",
    buttonText: "Lihat Koleksi",
    buttonLink: "/shop?category=Brukat Tile Mutiara",
    image: "/images/brukat_tile_mutiara.png",
    badge: "Grade A",
  },
  {
    id: 2,
    num: "02",
    category: "RENDA CHANTILLY FRENCH",
    title: "Renda Chantilly Impor",
    description: "Kehalusan renda Prancis bertkstur ultra-soft yang jatuh lembut di kulit.",
    buttonText: "Lihat Koleksi",
    buttonLink: "/shop?category=Renda Chantilly",
    image: "/images/renda_chantilly_french.png",
    badge: "Grade B",
  },
  {
    id: 3,
    num: "03",
    category: "CORNELY 3D & SILK SATIN",
    title: "Cornely 3D & Silk Satin",
    description: "Dimensi bordir 3D timbul dipadu furing silk satin bernapas untuk kenyamanan maksimal.",
    buttonText: "Lihat Koleksi",
    buttonLink: "/shop?category=Cornely 3D",
    image: "/images/cornely_silk_satin.png",
    badge: "Tulle",
  },
];

export default function HeroBanner({ config }: HeroBannerProps) {
  const panels = config?.title && config.title !== "Define Your Street." ? [
    {
      id: 1,
      num: "01",
      category: config.subtitle || "KOLEKSI EKSKLUSIF 2026",
      title: config.title.replace(/\n/g, ", "),
      subtitle: "Koleksi Tekstil Premium Raja Brukat",
      description: "Koleksi kain brukat dan renda pilihan dengan standar kualitas terbaik untuk gaun pesta & kebaya istimewa Anda.",
      buttonText: config.buttonText || "Shop Now",
      buttonLink: config.buttonLink || "/shop",
      image: "/images/brukat_tile_mutiara.png",
      badge: "Grade A",
    },
    ...CATEGORY_PANELS.slice(1)
  ] : CATEGORY_PANELS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextPanel = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % panels.length);
  }, [panels.length]);

  // Auto-play timer (5.5 seconds), pauses on user interaction
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextPanel();
    }, 5500);
    return () => clearInterval(timer);
  }, [nextPanel, isPaused]);

  return (
    <div
      className="relative w-full h-screen min-h-[650px] bg-stone-100 overflow-hidden flex flex-col pt-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main 3-Column Interactive Accordion Container */}
      <div className="relative w-full h-full flex flex-col lg:flex-row items-stretch overflow-hidden">
        {panels.map((panel, idx) => {
          const isActive = idx === activeIndex;

          return (
            <div
              key={panel.id}
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden group border-b lg:border-b-0 lg:border-r border-stone-200/90 transform-gpu will-change-flex ${isActive
                  ? "flex-[3.5] lg:flex-[3.5] shadow-2xl"
                  : "flex-1 lg:flex-1 opacity-80 hover:opacity-100 hover:flex-[1.3]"
                }`}
            >
              {/* Background Fabric Image with Soft Zoom */}
              <div className="absolute inset-0 z-0 transform-gpu">
                <Image
                  src={panel.image}
                  alt={panel.title}
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className={`object-cover object-center transition-transform duration-1000 transform-gpu ${isActive ? "scale-105" : "scale-100 group-hover:scale-105"
                    }`}
                />

                {/* Tight Compact Soft Radial Glow at Bottom-Left */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isActive
                      ? "bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.92)_0%,_rgba(255,255,255,0.3)_25%,_transparent_45%)] opacity-95"
                      : "bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.85)_0%,_rgba(255,255,255,0.2)_20%,_transparent_40%)] opacity-90 group-hover:opacity-75"
                    }`}
                />

                {/* Top Active Gold Border Ribbon */}
                {isActive && (
                  <div
                    className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#b77305] via-[#d4af37] to-[#b77305] z-10 transition-opacity duration-500"
                  />
                )}
              </div>

              {/* COLLAPSED STATE VIEW (When panel is inactive) */}
              {!isActive && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-8">
                  {/* Category Number Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#b77305] font-mono">
                      {panel.num}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider text-stone-800 uppercase px-2.5 py-1 rounded bg-white/90 border border-stone-300 shadow-sm">
                      {panel.badge}
                    </span>
                  </div>

                  {/* Vertical / Horizontal Collapsed Category Name */}
                  <div className="lg:my-auto lg:transform lg:-rotate-90 lg:origin-bottom-left lg:translate-x-12">
                    <p className="text-[#b77305] text-xs font-semibold uppercase tracking-widest mb-1">
                      {panel.category}
                    </p>
                    <h3 className="text-xl font-bold text-stone-900 whitespace-nowrap drop-shadow-sm">
                      {panel.title}
                    </h3>
                  </div>

                  {/* Bottom Arrow Indicator */}
                  <div className="flex items-center justify-end text-[#b77305] group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-6 h-6 stroke-[2]" />
                  </div>
                </div>
              )}

              {/* EXPANDED STATE VIEW (When panel is active) */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative z-10 w-full h-full flex flex-col justify-end p-6 sm:p-10 md:p-12 text-left max-w-xl"
                >
                  {/* Category Badge & Index */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl font-bold text-[#b77305] font-mono">
                      {panel.num}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/90 border border-[#b77305]/40 text-[#b77305] text-xs font-semibold uppercase tracking-wider shadow-md">
                      {panel.badge}
                    </span>
                  </div>

                  {/* Category Tag */}
                  <p className="text-[#b77305] text-xs md:text-sm font-bold uppercase tracking-widest mb-1.5">
                    {panel.category}
                  </p>

                  {/* Main Title */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-950 leading-tight mb-6 drop-shadow-sm">
                    {panel.title}
                  </h2>

                  {/* Action Button */}
                  <div>
                    <Link
                      href={panel.buttonLink}
                      className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#b77305] hover:bg-[#965e04] text-white font-medium text-sm md:text-base rounded-lg transition-all duration-300 shadow-xl shadow-[#b77305]/20 hover:scale-[1.03] active:scale-95 group"
                    >
                      <span>{panel.buttonText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Panel Indicators Dots */}
      <div className="absolute bottom-4 right-6 md:right-12 z-20 flex items-center gap-2">
        {panels.map((panel, idx) => (
          <button
            key={panel.id}
            onClick={() => setActiveIndex(idx)}
            aria-label={`Go to panel ${idx + 1}`}
            className="p-1 focus:outline-none"
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeIndex
                  ? "w-8 bg-[#b77305]"
                  : "w-3 bg-stone-300 hover:bg-stone-400"
                }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
