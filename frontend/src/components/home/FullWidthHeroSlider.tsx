"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
}

interface FullWidthHeroSliderProps {
  config?: HeroConfig;
}

const DEFAULT_SLIDES = [
  {
    id: 1,
    title: "Keanggunan Kain Semi Prancis 3D Premium",
    category: "KOLEKSI TERBARU 2026",
    buttonText: "Mulai Belanja",
    buttonLink: "/shop?category=Grade A",
    image: "/images/white_lace_hero.jpg",
  },
  {
    id: 2,
    title: "Panel Brukat Chantily",
    category: "RENDA CHANTILLY FRENCH",
    buttonText: "Mulai Belanja",
    buttonLink: "/shop?category=Grade B",
    image: "/images/beige_lace_hero.jpg",
  },
  {
    id: 3,
    title: "Panel Metallic Ellegant",
    category: "METALLIC LACE ELEGANT",
    buttonText: "Mulai Belanja",
    buttonLink: "/shop?category=Metallic",
    image: "/images/metallic_lace_hero.jpg",
  },
];

import { cleanImageUrl } from "@/utils/cleanImageUrl";

export default function FullWidthHeroSlider({ config }: FullWidthHeroSliderProps) {
  const cfg = config as any;
  const slides = [
    {
      id: 1,
      title: cfg?.title ? cfg.title.replace(/\n/g, ", ") : DEFAULT_SLIDES[0].title,
      category: cfg?.subtitle || DEFAULT_SLIDES[0].category,
      buttonText: cfg?.buttonText || DEFAULT_SLIDES[0].buttonText,
      buttonLink: cfg?.buttonLink || DEFAULT_SLIDES[0].buttonLink,
      image: cleanImageUrl(cfg?.imageUrl, DEFAULT_SLIDES[0].image),
    },
    {
      id: 2,
      title: cfg?.panel2Title ? cfg.panel2Title.replace(/\n/g, ", ") : DEFAULT_SLIDES[1].title,
      category: cfg?.panel2Subtitle || DEFAULT_SLIDES[1].category,
      buttonText: cfg?.panel2ButtonText || DEFAULT_SLIDES[1].buttonText,
      buttonLink: cfg?.panel2ButtonLink || DEFAULT_SLIDES[1].buttonLink,
      image: cleanImageUrl(cfg?.panel2ImageUrl, DEFAULT_SLIDES[1].image),
    },
    {
      id: 3,
      title: cfg?.panel3Title ? cfg.panel3Title.replace(/\n/g, ", ") : DEFAULT_SLIDES[2].title,
      category: cfg?.panel3Subtitle || DEFAULT_SLIDES[2].category,
      buttonText: cfg?.panel3ButtonText || DEFAULT_SLIDES[2].buttonText,
      buttonLink: cfg?.panel3ButtonLink || DEFAULT_SLIDES[2].buttonLink,
      image: cleanImageUrl(cfg?.panel3ImageUrl, DEFAULT_SLIDES[2].image),
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play timer (5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-[70vh] min-h-[520px] max-h-[700px] bg-stone-900 overflow-hidden flex items-center">
      {/* Background Image Carousel with Smooth Slide/Fade Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.05, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, x: -20, transition: { duration: 0.5, ease: "easeInOut" } }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0 z-0 transform-gpu"
        >
          <Image
            src={currentSlide.image}
            alt={currentSlide.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/30 z-10" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Container (Left Aligned) */}
      <div className="container mx-auto px-6 md:px-12 relative z-20 pt-8 md:pt-0">
        <div className="max-w-2xl text-left">
          
          {/* Dash Pagination Indicators (Top of Text) */}
          <div className="flex items-center gap-2 mb-6">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="group p-1 focus:outline-none"
              >
                <div
                  className={`h-[3px] rounded-full transition-all duration-500 ${
                    idx === currentIndex
                      ? "w-10 bg-[#b77305]"
                      : "w-5 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Category Tag */}
          <AnimatePresence mode="wait">
            <motion.span
              key={`cat-${currentSlide.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="inline-block text-[#d4af37] text-xs md:text-sm font-bold uppercase tracking-widest mb-3"
            >
              {currentSlide.category}
            </motion.span>
          </AnimatePresence>

          {/* Headline Title */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${currentSlide.id}`}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight md:leading-[1.15] mb-8 tracking-tight drop-shadow-md"
            >
              {currentSlide.title}
            </motion.h1>
          </AnimatePresence>

          {/* Action Button */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`btn-${currentSlide.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            >
              <Link
                href={currentSlide.buttonLink}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#b77305] hover:bg-[#965e04] text-white font-bold text-sm md:text-base rounded-xl transition-all duration-300 shadow-xl hover:scale-[1.03] active:scale-95"
              >
                <span>{currentSlide.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* Navigation Arrow Buttons (Round Translucent Buttons with Chevron) */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-white/30 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm group hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6 stroke-[2] group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-white/30 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-300 backdrop-blur-sm group hover:scale-110"
      >
        <ChevronRight className="w-6 h-6 stroke-[2] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
