"use client";

import { useState } from "react";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface LatestDropsProps {
  products: Product[];
  config?: any;
}

// Categories synced with the Shop page filters (Main Categories + Key Quality Types)
const FABRIC_CATEGORIES = [
  "Semua Kain",
  "Grade A",
  "Grade B",
  "Tulle",
  "Chantilly",
  "Metallic",
  "3D",
];

export default function LatestDrops({ products = [], config }: LatestDropsProps) {
  const [activeCategory, setActiveCategory] = useState("Semua Kain");

  const newestProducts = [...products].sort((a: any, b: any) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Filter matching function aligned with Shop page rules
  const matchesCategory = (p: any, cat: string) => {
    if (cat === "Semua Kain" || cat === "Semua Kategori") return true;

    const catLower = (p.category || "").toLowerCase();
    const nameLower = (p.name || "").toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    const combined = `${catLower} ${nameLower} ${descLower}`;

    if (cat === "Grade A") {
      return catLower.includes("grade a") || combined.includes("mutiara") || combined.includes("tile");
    }
    if (cat === "Grade B") {
      return catLower.includes("grade b") || combined.includes("chantilly");
    }
    if (cat === "Tulle") {
      return catLower.includes("tulle") || combined.includes("cornely") || combined.includes("satin");
    }
    if (cat === "Chantilly") {
      return combined.includes("chantilly");
    }
    if (cat === "Metallic") {
      return combined.includes("metallic") || combined.includes("metalik");
    }
    if (cat === "3D") {
      return combined.includes("3d");
    }

    return catLower === cat.toLowerCase();
  };

  const filteredDrops = newestProducts
    .filter((p: any) => matchesCategory(p, activeCategory))
    .slice(0, 8);

  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Minimalist Editorial Underline Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-60px" }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15,
                },
              },
              hidden: {},
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, filter: "blur(14px)", y: -15 },
                visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.65, ease: "easeOut" } },
              }}
              className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#b77305] mb-2"
            >
              <span>{config?.latestBadge || "Koleksi Motif Terbaru"}</span>
            </motion.div>

            <h2 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight font-serif">
              <motion.span
                variants={{
                  hidden: { opacity: 0, filter: "blur(14px)", x: -25 },
                  visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.65, ease: "easeOut" } },
                }}
                className="block"
              >
                {config?.latestTitleLine1 || "Rilis Koleksi Kain"}
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, filter: "blur(14px)", x: 25 },
                  visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.65, ease: "easeOut" } },
                }}
                className="inline-block italic font-normal text-[#b77305]"
              >
                {config?.latestTitleLine2 || "Terbaru & Eksklusif"}
              </motion.span>
            </h2>

            <motion.p
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)", y: 15 },
                visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.65, ease: "easeOut" } },
              }}
              className="mt-3 text-sm text-stone-500 max-w-lg leading-relaxed"
            >
              {config?.latestDesc || "Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin."}
            </motion.p>
          </motion.div>

          {/* Minimalist Editorial Underline Tabs (Gaya Rumah Mode Mewah) */}
          <div className="flex items-center gap-6 sm:gap-7 overflow-x-auto pb-0.5 shrink-0 max-w-full lg:max-w-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-stone-200">
            {FABRIC_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-label={`Filter kain kategori ${cat}`}
                  className={`relative pb-3 text-xs sm:text-sm tracking-wider uppercase whitespace-nowrap transition-colors duration-300 cursor-pointer ${
                    isActive
                      ? "text-stone-950 font-bold"
                      : "text-stone-400 hover:text-stone-700 font-medium"
                  }`}
                >
                  <span>{cat}</span>

                  {/* Animated Gold Underline Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="latestDropsUnderline"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-[#b77305]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {filteredDrops.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredDrops.length === 0 && (
          <div className="py-16 text-center text-stone-500 text-sm">
            Belum ada produk di kategori <span className="font-bold text-stone-900">{activeCategory}</span>.
          </div>
        )}

        {/* Bottom Call To Action */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 px-8 py-4 bg-stone-950 hover:bg-[#b77305] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl hover:scale-105 group"
          >
            <span>Jelajahi Semua Koleksi Motif ({products.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
