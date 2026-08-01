"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Award, Truck, ChevronUp, ChevronDown, ArrowRight, Eye } from "lucide-react";

interface FabricCardItem {
  id: string;
  name: string;
  category: string;
  priceTag: string;
  badgeTop: string;
  badgeBottom: string;
  description: string;
  image: string;
  link: string;
}

const FABRIC_CARDS: FabricCardItem[] = [
  {
    id: "left",
    name: "Renda Chantilly Halus Impor",
    category: "Renda Chantilly",
    priceTag: "Rp 85.000 / meter",
    badgeTop: "✨ Renda Chantilly Impor Halus",
    badgeBottom: "“ Lembut & Tidak Gatal di Kulit ”",
    description: "Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal. Pilihan utama para desainer untuk gaun pesta & kebaya pengantin.",
    image: "/images/renda_chantilly_french.png",
    link: "/shop?category=Renda Chantilly",
  },
  {
    id: "center",
    name: "Brukat Tile Mutiara 3D Premium",
    category: "Brukat Tile Mutiara",
    priceTag: "Rp 120.000 / meter",
    badgeTop: "🌟 100% Premium Quality Guaranteed",
    badgeBottom: "“ Motif Brukat Mutiara 2026 ”",
    description: "Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul dan payet kilau eksklusif. Sempurna untuk busana pesta, wisuda, dan seragam keluarga.",
    image: "/images/brukat_tile_mutiara.png",
    link: "/shop?category=Brukat Tile Mutiara",
  },
  {
    id: "right",
    name: "Silk & Satin Furing Premium",
    category: "Furing & Silk Satin",
    priceTag: "Rp 55.000 / meter",
    badgeTop: "💎 Silk Satin Polos Premium",
    badgeBottom: "“ Jatuh Sempurna & Adem ”",
    description: "Bahan furing satin silk impor dengan Kilau lembut mewah, tekstur dingin di kulit, serta jatuh secara sempurna untuk dalaman kebaya dan gaun.",
    image: "/images/cornely_silk_satin.png",
    link: "/shop?category=Furing %26 Silk",
  },
];

export default function FeaturedCategories() {
  const [activeCardId, setActiveCardId] = useState<string>("center");
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const activeCard = FABRIC_CARDS.find((c) => c.id === activeCardId) || FABRIC_CARDS[1];

  const handleCardHover = (id: string) => {
    setActiveCardId(id);
    setIsHovered(true);
  };

  const handleNext = () => {
    const currentIndex = FABRIC_CARDS.findIndex((c) => c.id === activeCardId);
    const nextIndex = (currentIndex + 1) % FABRIC_CARDS.length;
    setActiveCardId(FABRIC_CARDS[nextIndex].id);
  };

  const handlePrev = () => {
    const currentIndex = FABRIC_CARDS.findIndex((c) => c.id === activeCardId);
    const prevIndex = (currentIndex - 1 + FABRIC_CARDS.length) % FABRIC_CARDS.length;
    setActiveCardId(FABRIC_CARDS[prevIndex].id);
  };

  // Auto-rotate every 5 seconds, pauses on mouse hover
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeCardId, isHovered]);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="py-20 px-6 bg-white overflow-hidden relative"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Interactive Full Preview Panel (Slides in from Left on Hover) */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left relative min-h-[480px]">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="w-full"
              >
                {/* Main Headline */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-900 leading-[1.1] mb-6">
                  Pancar Keanggunan <br className="hidden sm:block" /> Gayamu.
                </h2>

                {/* Subtitle / Description */}
                <p className="text-stone-600 text-base md:text-lg leading-relaxed max-w-xl mb-8 font-normal">
                  {activeCard.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-12">
                  <Link 
                    href={activeCard.link}
                    className="px-8 py-4 bg-stone-950 hover:bg-[#b77305] text-white font-semibold text-sm rounded-md transition-all duration-300 shadow-md hover:scale-[1.02] flex items-center gap-2 group"
                  >
                    Belanja Sekarang
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/shop"
                    className="px-8 py-4 bg-white border border-stone-300 hover:border-stone-800 text-stone-800 font-semibold text-sm rounded-md transition-all duration-300 hover:bg-stone-50"
                  >
                    Lihat Semua Motif
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-100 max-w-lg">
              <div className="flex flex-col items-start gap-2">
                <RotateCcw className="w-5 h-5 text-stone-800 stroke-[1.5]" />
                <div>
                  <p className="text-xs font-semibold text-stone-900">Garansi Retur</p>
                  <p className="text-[11px] text-stone-500">Kemudahan Tukar</p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2">
                <Award className="w-5 h-5 text-stone-800 stroke-[1.5]" />
                <div>
                  <p className="text-xs font-semibold text-stone-900">100% Premium</p>
                  <p className="text-[11px] text-stone-500">Serat Halus Impor</p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2">
                <Truck className="w-5 h-5 text-stone-800 stroke-[1.5]" />
                <div>
                  <p className="text-xs font-semibold text-stone-900">Bebas Ongkir</p>
                  <p className="text-[11px] text-stone-500">Pengiriman Cepat</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Overlapping Cards (Hover Trigger) */}
          <div className="lg:col-span-6 relative min-h-[480px] md:min-h-[560px] flex items-center justify-center">
            
            {/* Pill Container */}
            <div className="relative w-full max-w-md md:max-w-lg h-[460px] md:h-[520px] flex items-center justify-center">
              
              {/* Card 1: Left Back Card */}
              <motion.div 
                onMouseEnter={() => handleCardHover("left")}
                className={`absolute left-0 top-6 w-[45%] h-[82%] rounded-[50px] md:rounded-[70px] overflow-hidden cursor-pointer transition-all duration-500 border-2 ${
                  activeCardId === "left" 
                    ? "border-[#b77305] shadow-2xl scale-105 z-30 ring-4 ring-[#b77305]/20" 
                    : "border-white shadow-lg z-10 opacity-80 hover:opacity-100 hover:scale-102"
                }`}
                whileHover={{ scale: 1.04 }}
              >
                <Image 
                  src={FABRIC_CARDS[0].image} 
                  alt={FABRIC_CARDS[0].name}
                  fill
                  sizes="30vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                <div className="absolute bottom-6 left-4 right-4 text-center">
                  <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-stone-900 shadow">
                    Renda Chantilly
                  </span>
                </div>
              </motion.div>

              {/* Card 2: Right Back Card */}
              <motion.div 
                onMouseEnter={() => handleCardHover("right")}
                className={`absolute right-4 bottom-4 w-[48%] h-[80%] rounded-[50px] md:rounded-[70px] overflow-hidden cursor-pointer transition-all duration-500 border-2 ${
                  activeCardId === "right" 
                    ? "border-[#b77305] shadow-2xl scale-105 z-30 ring-4 ring-[#b77305]/20" 
                    : "border-white shadow-lg z-10 opacity-80 hover:opacity-100 hover:scale-102"
                }`}
                whileHover={{ scale: 1.04 }}
              >
                <Image 
                  src={FABRIC_CARDS[2].image} 
                  alt={FABRIC_CARDS[2].name}
                  fill
                  sizes="30vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                <div className="absolute bottom-6 left-4 right-4 text-center">
                  <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-stone-900 shadow">
                    Silk & Satin Furing
                  </span>
                </div>
              </motion.div>

              {/* Card 3: Center Elevated Front Card */}
              <motion.div 
                onMouseEnter={() => handleCardHover("center")}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[54%] h-[94%] rounded-[60px] md:rounded-[80px] overflow-hidden cursor-pointer transition-all duration-500 border-4 ${
                  activeCardId === "center" 
                    ? "border-[#b77305] shadow-2xl scale-105 z-30 ring-4 ring-[#b77305]/30" 
                    : "border-white shadow-xl z-20 hover:scale-102"
                }`}
                whileHover={{ scale: 1.06 }}
              >
                <Image 
                  src={FABRIC_CARDS[1].image} 
                  alt={FABRIC_CARDS[1].name}
                  fill
                  priority
                  sizes="40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-4 right-4 text-center">
                  <span className="inline-block px-4 py-1.5 bg-[#b77305] text-white rounded-full text-xs font-bold shadow-lg">
                    Brukat Tile Mutiara
                  </span>
                </div>
              </motion.div>

              {/* Floating Badge Top */}
              <motion.div 
                animate={{ y: activeCardId === "center" ? [0, -4, 0] : 0 }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute top-2 right-10 z-40 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-stone-100 flex items-center gap-2 pointer-events-none"
              >
                <span className="w-2 h-2 rounded-full bg-[#b77305] animate-pulse" />
                <span className="text-xs font-semibold text-stone-800">{activeCard.badgeTop}</span>
              </motion.div>

              {/* Floating Badge Bottom */}
              <motion.div 
                className="absolute bottom-4 left-4 z-40 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-stone-100 pointer-events-none"
              >
                <p className="text-xs font-semibold text-stone-900 tracking-wide">{activeCard.badgeBottom}</p>
              </motion.div>

              {/* Vertical Scroll Controls */}
              <div className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
                <button
                  onClick={handlePrev}
                  aria-label="Previous Fabric"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-stone-200/80 hover:bg-[#b77305] hover:text-white text-stone-700 flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110"
                >
                  <ChevronUp className="w-6 h-6 stroke-[2]" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next Fabric"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-stone-200/80 hover:bg-[#b77305] hover:text-white text-stone-700 flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110"
                >
                  <ChevronDown className="w-6 h-6 stroke-[2]" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
