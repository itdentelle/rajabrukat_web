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

interface HeroBannerProps {
  config?: HeroConfig;
}

const DEFAULT_SLIDES = [
  {
    id: 1,
    title: "Keanggunan Kain Brukat & Lace Premium Raja Brukat",
    category: "KOLEKSI TERBARU 2026",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=Brukat Tile Mutiara",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2400&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Renda Chantilly Halus & Lembut Untuk Kebaya Pesta Impian",
    category: "KUALITAS IMPOR EKSKLUSIF",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=Renda Chantilly",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2400&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Brukat Cornely 3D Mutiara, Detail Timbul & Anggun Berkelas",
    category: "BORDIR 3D PREMIUM",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=Cornely 3D",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Silk & Satin Furing Premium, Tekstur Halus & Jatuh Sempurna",
    category: "FURING & SILK SATIN",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=Furing & Silk",
    image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=2400&auto=format&fit=crop",
  },
];

export default function HeroBanner({ config }: HeroBannerProps) {
  const slides = config?.title && config.title !== "Define Your Street." ? [
    {
      id: 1,
      title: config.title.replace(/\n/g, ", "),
      category: config.subtitle || "KOLEKSI TERBARU 2026",
      buttonText: config.buttonText || "Shop Now",
      buttonLink: config.buttonLink || "/shop",
      image: config.imageUrl || DEFAULT_SLIDES[0].image,
    },
    ...DEFAULT_SLIDES.slice(1)
  ] : DEFAULT_SLIDES;

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
    }, 5500);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-screen min-h-[600px] bg-white overflow-hidden flex items-center">
      {/* Background Image Carousel with Ken Burns Soft Zoom Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.0 }}
          animate={{ opacity: 1, scale: 1.12 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          transition={{
            opacity: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 6.5, ease: "linear" }
          }}
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
          {/* White Overlay Gradient from Left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 md:via-white/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/30 z-10" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Container (Left Aligned) */}
      <div className="container mx-auto px-6 md:px-12 relative z-20 pt-12 md:pt-0">
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
                      : "w-5 bg-stone-300 group-hover:bg-stone-500"
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
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="inline-block text-[#b77305] text-xs md:text-sm font-semibold uppercase tracking-widest mb-3"
            >
              {currentSlide.category}
            </motion.span>
          </AnimatePresence>

          {/* Headline Title */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${currentSlide.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight md:leading-[1.15] mb-8 tracking-tight drop-shadow-sm"
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
              transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
              <Link
                href={currentSlide.buttonLink}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#b77305] hover:bg-[#965e04] text-white font-medium text-sm md:text-base rounded transition-all duration-300 shadow-md hover:scale-[1.03] active:scale-95"
              >
                {currentSlide.buttonText}
              </Link>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* Navigation Arrows (Clean Icon Only - No Circle) */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-2 text-stone-800 hover:text-[#b77305] transition-all duration-300 group"
      >
        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 stroke-[1.75] group-hover:-translate-x-1 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-2 text-stone-800 hover:text-[#b77305] transition-all duration-300 group"
      >
        <ChevronRight className="w-8 h-8 md:w-10 md:h-10 stroke-[1.75] group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
