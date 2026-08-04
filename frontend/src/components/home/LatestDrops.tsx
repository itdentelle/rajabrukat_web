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

const FABRIC_CATEGORIES = [
  "Semua Kain",
  "Brukat Tile Mutiara",
  "Renda Chantilly",
  "Cornely 3D",
  "Silk & Satin",
];

export default function LatestDrops({ products }: LatestDropsProps) {
  const [activeCategory, setActiveCategory] = useState("Semua Kain");

  // Fallback sample products if API products are empty or contain legacy category labels
  const normalizedProducts =
    products.length > 0
      ? products.map((p) => {
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
          },
          {
            id: "drop-2",
            name: "Renda Chantilly Halus French Export",
            price: 145000,
            discountPrice: null,
            image: "/images/renda_chantilly_french.png",
            category: "Renda Chantilly",
          },
          {
            id: "drop-3",
            name: "Cornely 3D Silk Satin Furing Tulle",
            price: 245000,
            discountPrice: 195000,
            image: "/images/cornely_silk_satin.png",
            category: "Cornely 3D",
          },
          {
            id: "drop-4",
            name: "Silk Satin Furing Polos Premium Nude",
            price: 65000,
            discountPrice: null,
            image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop",
            category: "Silk & Satin",
          },
          {
            id: "drop-5",
            name: "Brukat Tile Mutiara Luxury Gold Series",
            price: 295000,
            discountPrice: 225000,
            image: "/images/brukat_tile_mutiara.png",
            category: "Brukat Tile Mutiara",
          },
          {
            id: "drop-6",
            name: "Renda Chantilly Floral Pastel Blush",
            price: 165000,
            discountPrice: null,
            image: "/images/renda_chantilly_french.png",
            category: "Renda Chantilly",
          },
        ];

  const newestProducts = [...normalizedProducts].sort((a: any, b: any) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const filteredDrops = newestProducts
    .filter((p: any) => activeCategory === "Semua Kain" || p.category === activeCategory)
    .slice(0, 8);

  return (
    <section id="products" className="py-24 bg-white text-stone-900 border-b border-stone-200">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Section Header & Clean Category Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-14 gap-8 border-b border-stone-100 pb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#b77305] block mb-2">
              KOLEKSI MOTIF TERBARU
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 leading-tight mb-3">
              Rilis Koleksi Kain <br />
              <span className="text-[#b77305] italic font-serif">Terbaru & Eksklusif</span>
            </h2>
            <p className="text-stone-600 max-w-md text-sm sm:text-base font-light leading-relaxed">
              Motif kain brukat 3D, renda Chantilly impor, dan furing satin terbaru pilihan utama para perancang gaun & kebaya pengantin.
            </p>
          </div>
          
          {/* Streamlined Category Pill Filters */}
          <div className="w-full lg:w-auto overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2">
              {FABRIC_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  suppressHydrationWarning
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 font-bold uppercase tracking-wider text-xs transition-all duration-300 rounded-full border ${
                    activeCategory === cat 
                      ? "bg-stone-950 text-white border-stone-950 shadow-md" 
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:border-[#b77305] hover:text-[#b77305]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
          <AnimatePresence mode="popLayout">
            {filteredDrops.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={product.id}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredDrops.length === 0 && (
          <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-200 text-stone-500">
            <p className="font-serif font-bold text-stone-900 text-lg mb-1">Motif Tidak Ditemukan</p>
            <p className="text-xs text-stone-500 font-light mb-4">Tidak ada produk yang sesuai dengan kategori ini saat ini.</p>
            <button
              onClick={() => setActiveCategory("Semua Kain")}
              className="px-6 py-2.5 bg-[#b77305] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md hover:bg-[#965e04] transition-all"
            >
              Tampilkan Semua Kain
            </button>
          </div>
        )}

        {/* Bottom Catalog Button */}
        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2.5 px-9 py-4 bg-stone-950 hover:bg-[#b77305] text-white font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 rounded-full shadow-xl hover:scale-105 group"
          >
            <span>Lihat Semua Koleksi Kain</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
