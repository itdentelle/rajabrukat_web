"use client";

import { useState } from "react";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface LatestDropsProps {
  products: Product[];
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

export default function LatestDrops({ products = [] }: LatestDropsProps) {
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
        {/* Section Header with Responsive Non-overlapping Filter Pills */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#b77305] mb-2">
              <span>Koleksi Motif Terbaru</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight font-serif">
              Rilis Koleksi Kain <br />
              <span className="italic font-normal text-[#b77305]">
                Terbaru & Eksklusif
              </span>
            </h2>
            <p className="mt-3 text-sm text-stone-500 max-w-lg leading-relaxed">
              Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.
            </p>
          </div>

          {/* Category Filter Pills (Aligned with Shop filters) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 max-w-full lg:max-w-xl no-scrollbar">
            {FABRIC_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap shrink-0 ${
                  activeCategory === cat
                    ? "bg-stone-950 text-white shadow-md scale-105"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                }`}
              >
                {cat}
              </button>
            ))}
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
