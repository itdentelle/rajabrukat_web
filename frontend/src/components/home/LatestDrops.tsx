"use client";

import { useState } from "react";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, FadeIn } from "@/components/ui/Reveal";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { Sparkles, SlidersHorizontal, Check } from "lucide-react";

interface LatestDropsProps {
  products: Product[];
}

const FABRIC_CATEGORIES = [
  "Semua Kain",
  "Brukat Tile Mutiara",
  "Renda Chantilly",
  "Cornely 3D",
  "Silk & Satin",
];

const QUALITY_GRADES = [
  "Semua Kualitas",
  "Grade A Premium",
  "Grade B",
  "Export Quality",
];

export default function LatestDrops({ products }: LatestDropsProps) {
  const [activeCategory, setActiveCategory] = useState("Semua Kain");
  const [activeQuality, setActiveQuality] = useState("Semua Kualitas");

  // Fallback sample products if API products are empty or contain legacy category labels
  const normalizedProducts = products.length > 0
    ? products.map((p) => {
        // Sanitize legacy streetwear category labels if any
        let cat = p.category;
        if (!cat || ["T-Shirt", "Jacket", "Accessories", "T-SHIRT", "JACKET", "ACCESSORIES"].includes(cat)) {
          cat = p.name.toLowerCase().includes("chantilly")
            ? "Renda Chantilly"
            : p.name.toLowerCase().includes("cornely")
            ? "Cornely 3D"
            : p.name.toLowerCase().includes("satin") || p.name.toLowerCase().includes("furing")
            ? "Silk & Satin"
            : "Brukat Tile Mutiara";
        }
        return { ...p, category: cat };
      })
    : [
        {
          id: "drop-1",
          name: "Brukat Tile Mutiara Royal French Grade A",
          price: 265000,
          discountPrice: 185000,
          image: "/images/brukat_tile_mutiara.png",
          category: "Brukat Tile Mutiara",
          quality: "Grade A Premium",
        },
        {
          id: "drop-2",
          name: "Renda Chantilly Halus French Original",
          price: 145000,
          discountPrice: null,
          image: "/images/renda_chantilly_french.png",
          category: "Renda Chantilly",
          quality: "Export Quality",
        },
        {
          id: "drop-3",
          name: "Cornely 3D Silk Satin Furing Tulle",
          price: 245000,
          discountPrice: 195000,
          image: "/images/cornely_silk_satin.png",
          category: "Cornely 3D",
          quality: "Grade A Premium",
        },
        {
          id: "drop-4",
          name: "Silk Satin Furing Polos Premium Nude",
          price: 65000,
          discountPrice: null,
          image: "/images/cornely_silk_satin.png",
          category: "Silk & Satin",
          quality: "Grade B",
        },
        {
          id: "drop-5",
          name: "Brukat Tile Mutiara Luxury Gold Series",
          price: 295000,
          discountPrice: 225000,
          image: "/images/brukat_tile_mutiara.png",
          category: "Brukat Tile Mutiara",
          quality: "Export Quality",
        },
        {
          id: "drop-6",
          name: "Renda Chantilly Floral Pastel Blush",
          price: 165000,
          discountPrice: null,
          image: "/images/renda_chantilly_french.png",
          category: "Renda Chantilly",
          quality: "Grade A Premium",
        },
      ];

  const newestProducts = [...normalizedProducts].sort((a: any, b: any) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const filteredDrops = newestProducts.filter((p: any) => {
    const matchCategory =
      activeCategory === "Semua Kain" || p.category === activeCategory;
    const matchQuality =
      activeQuality === "Semua Kualitas" ||
      (p.quality && p.quality === activeQuality) ||
      (activeQuality === "Grade A Premium" && p.name.includes("Grade A"));
    return matchCategory && matchQuality;
  }).slice(0, 8);

  return (
    <section id="products" className="py-24 px-4 bg-white text-black">
      <div className="container mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8 border-b border-stone-200 pb-8">
            <div>
              <div className="flex items-center gap-2 text-[#b77305] mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  KOLEKSI MOTIF TERBARU
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-3">
                RILIS KAIN <br /> TERBARU.
              </h2>
              <p className="text-stone-500 max-w-md text-sm sm:text-base leading-relaxed">
                Motif kain brukat, renda Chantilly, dan furing satin terbaru pilihan utama para desainer gaun & kebaya pengantin.
              </p>
            </div>
            
            {/* Filter Control Section: Kategori & Quality Grade */}
            <div className="w-full lg:w-auto flex flex-col gap-4">
              
              {/* Filter 1: Jenis Kain (Category) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1 flex-shrink-0">
                  <SlidersHorizontal className="w-3 h-3" /> KAIN:
                </span>
                {FABRIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    suppressHydrationWarning
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 font-bold uppercase tracking-wider text-xs transition-all rounded-full border ${
                      activeCategory === cat 
                        ? "bg-[#b77305] text-white border-[#b77305] shadow-sm" 
                        : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#b77305] hover:text-[#b77305]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Filter 2: Quality Grade Pill Badges */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1 flex-shrink-0">
                  QUALITY:
                </span>
                {QUALITY_GRADES.map((grade) => (
                  <button
                    key={grade}
                    suppressHydrationWarning
                    onClick={() => setActiveQuality(grade)}
                    className={`whitespace-nowrap px-3.5 py-1.5 font-bold uppercase tracking-wider text-[10px] transition-all rounded-md border flex items-center gap-1 ${
                      activeQuality === grade 
                        ? "bg-stone-900 text-amber-400 border-stone-900 shadow-xs" 
                        : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-800"
                    }`}
                  >
                    {activeQuality === grade && <Check className="w-3 h-3 text-amber-400" />}
                    {grade}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </Reveal>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
          <AnimatePresence mode="popLayout">
            {filteredDrops.map((product, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={product.id}
              >
                <FadeIn delay={idx * 0.1}>
                  <ProductCard product={product} />
                </FadeIn>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredDrops.length === 0 && (
          <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-200 text-stone-500">
            <p className="font-bold text-stone-800 text-base mb-1">Motif tidak ditemukan</p>
            <p className="text-xs text-stone-500">Tidak ada produk yang sesuai dengan filter kombinasi kategori & kualitas ini.</p>
            <button
              onClick={() => {
                setActiveCategory("Semua Kain");
                setActiveQuality("Semua Kualitas");
              }}
              className="mt-4 text-xs font-bold text-[#b77305] underline hover:text-stone-900"
            >
              Reset Filter
            </button>
          </div>
        )}

        <div className="mt-16 text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-[#b77305] transition-all rounded-xl shadow-md hover:scale-[1.02]">
            <span>Lihat Semua Koleksi Kain</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

