"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
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
    category: "KOLEKSI EKSKLUSIF 2026",
    title: "Keanggunan Kain Semi Prancis 3D Premium",
    description: "Seni bordir tile bertabur payet mutiara kristal mewah untuk kebaya & gaun pesta istimewa Anda.",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=Brukat Tile Mutiara",
    image: "/images/white_lace_hero.jpg",
    badge: "BRUKAT 3D",
  },
  {
    id: 2,
    num: "02",
    category: "RENDA CHANTILLY FRENCH",
    title: "Panel Brukat Chantily",
    description: "Kehalusan renda Prancis bertekstur ultra-soft yang jatuh lembut dan mewah di kulit.",
    buttonText: "Lihat Koleksi",
    buttonLink: "/shop?category=Renda Chantilly",
    image: "/images/beige_lace_hero.jpg",
    badge: "CHANTILLY",
  },
  {
    id: 3,
    num: "03",
    category: "METALLIC LACE ELEGANT",
    title: "Panel Metallic Ellegant",
    description: "Seni bordir metallic berkilau dengan detail mewah dan elegan untuk gaun pesta istimewa Anda.",
    buttonText: "Lihat Koleksi",
    buttonLink: "/shop?category=Metallic",
    image: "/images/metallic_lace_hero.jpg",
    badge: "METALLIC",
  },
];

export default function HeroBanner({ config }: HeroBannerProps) {
  const panels = config?.title && config.title !== "Define Your Street." ? [
    {
      id: 1,
      num: "01",
      category: config.subtitle || "KOLEKSI EKSKLUSIF 2026",
      title: config.title === "Keanggunan Kain Brukat & Lace Premium" 
        ? "Keanggunan Kain Semi Prancis 3D Premium" 
        : config.title.replace(/\n/g, ", "),
      description: "Koleksi kain brukat dan renda pilihan dengan standar kualitas terbaik untuk gaun pesta & kebaya istimewa Anda.",
      buttonText: config.buttonText || "Shop Now",
      buttonLink: config.buttonLink || "/shop",
      image: "/images/white_lace_hero.jpg",
      badge: "BRUKAT 3D",
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
      className="relative w-full h-screen min-h-[650px] bg-white overflow-hidden flex flex-col pt-[60px] md:pt-[68px]"
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
              className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden group border-b lg:border-b-0 lg:border-r border-white/10 transform-gpu will-change-flex ${isActive
                  ? "flex-[3.5] lg:flex-[3.5] shadow-2xl z-10"
                  : "flex-1 lg:flex-1 opacity-90 hover:opacity-100 hover:flex-[1.25]"
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

                {/* Dark Scrim Gradient Overlay for Maximum Legibility & WCAG Compliance */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isActive
                      ? "bg-gradient-to-t from-stone-950/95 via-stone-950/45 to-black/30 opacity-100"
                      : "bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-black/40 opacity-90 group-hover:opacity-75"
                    }`}
                />

                {/* Top Active Gold Border Ribbon */}
                {isActive && (
                  <div
                    className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#b77305] via-[#f3e5ab] to-[#b77305] z-10 transition-opacity duration-500 shadow-md"
                  />
                )}
              </div>

              {/* COLLAPSED STATE VIEW (Upright Legible Text) */}
              {!isActive && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 md:p-7 text-white">
                  {/* Top Badge */}
                  <div className="flex items-center justify-end">
                    <span className="text-[10px] font-bold tracking-widest text-amber-200 uppercase px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/30 shadow-md">
                      {panel.badge}
                    </span>
                  </div>

                  {/* Upright Stacked Category Title */}
                  <div className="my-auto py-4">
                    <p className="text-[#e2b744] text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5 opacity-90">
                      {panel.category}
                    </p>
                    <h3 className="text-xl md:text-2xl font-serif font-medium text-white drop-shadow-md leading-tight group-hover:text-amber-100 transition-colors">
                      {panel.title}
                    </h3>
                  </div>

                  {/* Bottom Explore CTA Link */}
                  <div className="flex items-center justify-between text-[#e2b744] group-hover:translate-x-1 transition-transform pt-3 border-t border-white/10">
                    <span className="text-[11px] font-medium tracking-wider uppercase text-stone-300">Eksplorasi</span>
                    <ChevronRight className="w-5 h-5 stroke-[2]" />
                  </div>
                </div>
              )}

              {/* EXPANDED STATE VIEW (Luxury Serif & Clear Hierarchy) */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative z-10 w-full h-full flex flex-col justify-end p-6 sm:p-10 md:p-12 text-left max-w-xl text-white"
                >
                  {/* Category Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-[#e2b744]/40 text-[#e2b744] text-xs font-semibold uppercase tracking-wider shadow-lg">
                      {panel.badge}
                    </span>
                  </div>

                  {/* Category Tag */}
                  <p className="text-[#e2b744] text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-2 drop-shadow-sm">
                    {panel.category}
                  </p>

                  {/* Main Serif Luxury Title */}
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-medium text-white leading-[1.18] mb-6 drop-shadow-lg">
                    {panel.title}
                  </h2>

                  {/* Action Button & Integrated Slider Progress Dots */}
                  <div className="flex items-center flex-wrap gap-4 sm:gap-5 mt-2">
                    <Link
                      href={panel.buttonLink}
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white font-medium text-sm md:text-base rounded-full transition-all duration-300 shadow-xl shadow-black/50 hover:scale-[1.03] active:scale-95 group border border-amber-300/30"
                    >
                      <span>{panel.buttonText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {/* Integrated Slider Dots for Active Panel */}
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/15 shadow-lg">
                      {panels.map((p, pIdx) => (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveIndex(pIdx);
                          }}
                          aria-label={`Go to slide ${pIdx + 1}`}
                          className="p-1 focus:outline-none"
                        >
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              pIdx === activeIndex
                                ? "w-7 bg-[#e2b744]"
                                : "w-2.5 bg-white/40 hover:bg-white/70"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

