"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";
import { cleanTitle } from "@/utils/cleanTitle";
import { cleanDescription } from "@/utils/cleanDescription";

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
    name: "Brukat Putih 3D Premium",
    category: "Grade A",
    priceTag: "Rp 120.000",
    badgeTop: "✨ Brukat Putih 3D Premium",
    badgeBottom: "“ Kerapatan Bordir Maksimal ”",
    description: "Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul dan payet kilau eksklusif.",
    image: "/images/white_lace_hero.webp",
    link: "/shop?category=Grade A",
  },
  {
    id: "center",
    name: "Panel Brukat Chantily",
    category: "Grade B",
    priceTag: "Rp 85.000",
    badgeTop: "🌟 Renda Chantilly French Impor",
    badgeBottom: "“ Lembut & Tidak Gatal di Kulit ”",
    description: "Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal. Pilihan utama para desainer untuk gaun pesta & kebaya pengantin.",
    image: "/images/beige_lace_hero.webp",
    link: "/shop?category=Renda Chantilly",
  },
  {
    id: "right",
    name: "Panel Metallic Ellegant",
    category: "Metallic",
    priceTag: "Rp 95.000",
    badgeTop: "💎 Metallic Lace Elegant",
    badgeBottom: "“ Kilau Benang Metalik Mewah ”",
    description: "Memakai benang metalik yang menambah kesan elegan dan mewah untuk busana pesta dan kebaya modern.",
    image: "/images/metallic_lace_hero.webp",
    link: "/shop?category=Metallic",
  },
];

interface FeaturedCategoriesProps {
  config?: {
    imageUrl?: string;
    panel2ImageUrl?: string;
    panel3ImageUrl?: string;
    featuredTitle?: string;
    featuredSubtitle?: string;
    badge1Title?: string;
    badge1Subtitle?: string;
    badge2Title?: string;
    badge2Subtitle?: string;
    badge3Title?: string;
    badge3Subtitle?: string;
    featuredCard1Title?: string;
    featuredCard1Desc?: string;
    featuredCard1ImgUrl?: string;
    featuredCard1Link?: string;
    featuredCard2Title?: string;
    featuredCard2Desc?: string;
    featuredCard2ImgUrl?: string;
    featuredCard2Link?: string;
    featuredCard3Title?: string;
    featuredCard3Desc?: string;
    featuredCard3ImgUrl?: string;
    featuredCard3Link?: string;
  };
}

import { cleanImageUrl } from "@/utils/cleanImageUrl";

export default function FeaturedCategories({ config }: FeaturedCategoriesProps) {
  const getCardImage = (imgUrl: string | undefined | null, fallback: string) => {
    if (!imgUrl || typeof imgUrl !== "string" || imgUrl.trim() === "" || imgUrl.startsWith("/uploads/upload_")) {
      return fallback;
    }
    return cleanImageUrl(imgUrl, fallback);
  };

  const initialCards: FabricCardItem[] = [
    {
      id: "left",
      name: config?.featuredCard1Title || "Brukat Putih 3D Premium",
      category: "Grade A",
      priceTag: "Lihat Koleksi",
      badgeTop: config?.featuredCard1Title || "Brukat Putih 3D Premium",
      badgeBottom: "“ Kerapatan Bordir Maksimal ”",
      description: config?.featuredCard1Desc || "Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul dan payet kilau eksklusif.",
      image: getCardImage(config?.featuredCard1ImgUrl || config?.imageUrl, "/images/white_lace_hero.webp"),
      link: config?.featuredCard1Link || "/shop?category=Grade A",
    },
    {
      id: "center",
      name: config?.featuredCard2Title || "Panel Brukat Chantily",
      category: "Grade B",
      priceTag: "Lihat Koleksi",
      badgeTop: config?.featuredCard2Title || "Panel Brukat Chantily",
      badgeBottom: "“ Renda Chantilly Impor ”",
      description: config?.featuredCard2Desc || "Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal.",
      image: getCardImage(config?.featuredCard2ImgUrl || config?.panel2ImageUrl, "/images/beige_lace_hero.webp"),
      link: config?.featuredCard2Link || "/shop?category=Renda Chantilly",
    },
    {
      id: "right",
      name: config?.featuredCard3Title || "Panel Metallic Ellegant",
      category: "Metallic",
      priceTag: "Lihat Koleksi",
      badgeTop: config?.featuredCard3Title || "Panel Metallic Ellegant",
      badgeBottom: "“ Metallic Lace Elegant ”",
      description: config?.featuredCard3Desc || "Memakai benang metalik yang menambah kesan elegan dan mewah untuk busana pesta.",
      image: getCardImage(config?.featuredCard3ImgUrl || config?.panel3ImageUrl, "/images/metallic_lace_hero.webp"),
      link: config?.featuredCard3Link || "/shop?category=Metallic",
    },
  ];

  const [cards, setCards] = useState<FabricCardItem[]>(initialCards);
  const [activeCardId, setActiveCardId] = useState<string>("center");
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[1] || cards[0];

  const featuredTitle = config?.featuredTitle || "Pancar Keanggunan Gayamu.";
  const featuredSubtitle = activeCard.description || config?.featuredSubtitle || "Kondisi baru, Brukat polos dengan tekstur doff halus. Pilihan klasik yang tak lekang oleh waktu. Bahan adem dan nyaman dipakai.";

  const badge1Title = config?.badge1Title || "Garansi Retur";
  const badge1Subtitle = config?.badge1Subtitle || "Kemudahan Tukar";
  const badge2Title = config?.badge2Title || "100% Premium";
  const badge2Subtitle = config?.badge2Subtitle || "Serat Halus Impor";
  const badge3Title = config?.badge3Title || "Bebas Ongkir";
  const badge3Subtitle = config?.badge3Subtitle || "Pengiriman Cepat";

  useEffect(() => {
    setCards([
      {
        id: "left",
        name: config?.featuredCard1Title || "Brukat Putih 3D Premium",
        category: "Grade A",
        priceTag: "Lihat Koleksi",
        badgeTop: config?.featuredCard1Title || "Brukat Putih 3D Premium",
        badgeBottom: "“ Kerapatan Bordir Maksimal ”",
        description: config?.featuredCard1Desc || "Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul dan payet kilau eksklusif.",
        image: getCardImage(config?.featuredCard1ImgUrl || config?.imageUrl, "/images/white_lace_hero.webp"),
        link: config?.featuredCard1Link || "/shop?category=Grade A",
      },
      {
        id: "center",
        name: config?.featuredCard2Title || "Panel Brukat Chantily",
        category: "Grade B",
        priceTag: "Lihat Koleksi",
        badgeTop: config?.featuredCard2Title || "Panel Brukat Chantily",
        badgeBottom: "“ Renda Chantilly Impor ”",
        description: config?.featuredCard2Desc || "Serat renda Chantilly kualitas ekspor yang sangat halus, ringan, dan tidak gatal.",
        image: getCardImage(config?.featuredCard2ImgUrl || config?.panel2ImageUrl, "/images/beige_lace_hero.webp"),
        link: config?.featuredCard2Link || "/shop?category=Renda Chantilly",
      },
      {
        id: "right",
        name: config?.featuredCard3Title || "Panel Metallic Ellegant",
        category: "Metallic",
        priceTag: "Lihat Koleksi",
        badgeTop: config?.featuredCard3Title || "Panel Metallic Ellegant",
        badgeBottom: "“ Metallic Lace Elegant ”",
        description: config?.featuredCard3Desc || "Memakai benang metalik yang menambah kesan elegan dan mewah untuk busana pesta.",
        image: getCardImage(config?.featuredCard3ImgUrl || config?.panel3ImageUrl, "/images/metallic_lace_hero.webp"),
        link: config?.featuredCard3Link || "/shop?category=Metallic",
      },
    ]);
  }, [config]);

  const handleCardHover = useCallback((id: string) => {
    setActiveCardId(id);
    setIsHovered(true);
  }, []);

  const handleNext = useCallback(() => {
    const currentIndex = FABRIC_CARDS.findIndex((c) => c.id === activeCardId);
    const nextIndex = (currentIndex + 1) % FABRIC_CARDS.length;
    setActiveCardId(FABRIC_CARDS[nextIndex].id);
  }, [activeCardId]);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [handleNext, isHovered]);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="py-20 px-6 bg-white overflow-hidden relative border-t border-stone-100"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Interactive Full Preview Panel */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left relative min-h-[460px]">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="w-full"
              >
                {/* Main Luxury Serif Headline */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium tracking-tight text-stone-950 leading-[1.12] mb-6">
                  {featuredTitle.includes("\n") ? (
                    featuredTitle.split("\n").map((line, idx) => (
                      <span key={idx}>
                        {idx === 1 ? (
                          <span className="text-[#b77305] italic font-serif">{line.trim()} </span>
                        ) : (
                          <span>{line.trim()} </span>
                        )}
                      </span>
                    ))
                  ) : (
                    featuredTitle.includes("Keanggunan") ? (
                      <>
                        Pancar <span className="text-[#b77305] italic font-serif">Keanggunan</span> <br className="hidden sm:block" /> Gayamu.
                      </>
                    ) : (
                      featuredTitle
                    )
                  )}
                </h2>

                {/* Subtitle / Description */}
                <p className="text-stone-600 text-base md:text-lg leading-relaxed max-w-xl mb-8 font-light">
                  {featuredSubtitle}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <Link 
                    href={activeCard.link}
                    className="px-8 py-3.5 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white font-medium text-sm rounded-full transition-all duration-300 shadow-lg shadow-[#b77305]/25 hover:scale-[1.03] flex items-center gap-2.5 group"
                  >
                    <span>Belanja Sekarang</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/shop"
                    className="px-8 py-3.5 bg-stone-50 border border-stone-300 hover:border-[#b77305] text-stone-800 hover:text-[#b77305] font-medium text-sm rounded-full transition-all duration-300 hover:bg-stone-100"
                  >
                    Lihat Semua Motif
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>



          </div>

          {/* Right Column: Interactive Overlapping Cards (Hover Trigger) */}
          <div className="lg:col-span-6 relative min-h-[480px] md:min-h-[540px] flex items-center justify-center">
            
            {/* Pill Container */}
            <div className="relative w-full max-w-md md:max-w-lg h-[460px] md:h-[500px] flex items-center justify-center">
              
              {/* Card 1: Left Card */}
              <motion.div 
                role="button"
                tabIndex={0}
                aria-label={`Pilih ${(cards[0] || FABRIC_CARDS[0]).name}`}
                onMouseEnter={() => handleCardHover("left")}
                className={`absolute left-0 top-6 w-[45%] h-[82%] rounded-[50px] md:rounded-[70px] overflow-hidden cursor-pointer transition-all duration-500 border-2 ${
                  activeCardId === "left" 
                    ? "border-[#b77305] shadow-2xl scale-105 z-30 ring-4 ring-[#b77305]/20" 
                    : "border-white shadow-lg z-10 opacity-75 hover:opacity-100 hover:scale-102"
                }`}
                whileHover={{ scale: 1.04 }}
              >
                <Image 
                  src={(cards[0] || FABRIC_CARDS[0]).image} 
                  alt={(cards[0] || FABRIC_CARDS[0]).name}
                  fill
                  sizes="30vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                {activeCardId === "left" && (
                  <div className="absolute bottom-6 left-2 right-2 text-center">
                    <span className="inline-block px-3 py-1.5 bg-[#b77305] text-white rounded-full text-[11px] font-bold shadow-lg max-w-full truncate">
                      {(cards[0] || FABRIC_CARDS[0]).name}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Card 2: Right Card */}
              <motion.div 
                role="button"
                tabIndex={0}
                aria-label={`Pilih ${(cards[2] || FABRIC_CARDS[2]).name}`}
                onMouseEnter={() => handleCardHover("right")}
                className={`absolute right-4 bottom-4 w-[48%] h-[80%] rounded-[50px] md:rounded-[70px] overflow-hidden cursor-pointer transition-all duration-500 border-2 ${
                  activeCardId === "right" 
                    ? "border-[#b77305] shadow-2xl scale-105 z-30 ring-4 ring-[#b77305]/20" 
                    : "border-white shadow-lg z-10 opacity-75 hover:opacity-100 hover:scale-102"
                }`}
                whileHover={{ scale: 1.04 }}
              >
                <Image 
                  src={(cards[2] || FABRIC_CARDS[2]).image} 
                  alt={(cards[2] || FABRIC_CARDS[2]).name}
                  fill
                  sizes="30vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                {activeCardId === "right" && (
                  <div className="absolute bottom-6 left-2 right-2 text-center">
                    <span className="inline-block px-3 py-1.5 bg-[#b77305] text-white rounded-full text-[11px] font-bold shadow-lg max-w-full truncate">
                      {(cards[2] || FABRIC_CARDS[2]).name}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Card 3: Center Card */}
              <motion.div 
                role="button"
                tabIndex={0}
                aria-label={`Pilih ${(cards[1] || FABRIC_CARDS[1]).name}`}
                onMouseEnter={() => handleCardHover("center")}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[54%] h-[94%] rounded-[60px] md:rounded-[80px] overflow-hidden cursor-pointer transition-all duration-500 border-4 ${
                  activeCardId === "center" 
                    ? "border-[#b77305] shadow-2xl scale-105 z-30 ring-4 ring-[#b77305]/30" 
                    : "border-white shadow-xl z-20 hover:scale-102 opacity-90"
                }`}
                whileHover={{ scale: 1.06 }}
              >
                <Image 
                  src={(cards[1] || FABRIC_CARDS[1]).image} 
                  alt={(cards[1] || FABRIC_CARDS[1]).name}
                  fill
                  sizes="40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                {activeCardId === "center" && (
                  <div className="absolute bottom-8 left-2 right-2 text-center">
                    <span className="inline-block px-3.5 py-1.5 bg-[#b77305] text-white rounded-full text-xs font-bold shadow-lg max-w-full truncate">
                      {(cards[1] || FABRIC_CARDS[1]).name}
                    </span>
                  </div>
                )}
              </motion.div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
