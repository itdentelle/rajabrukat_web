"use client";

import { useState } from "react";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, FadeIn } from "@/components/ui/Reveal";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";

interface LatestDropsProps {
  products: Product[];
}

export default function LatestDrops({ products }: LatestDropsProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const newestProducts = [...products].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  }).slice(0, 8);

  const filteredDrops = activeCategory === "All" 
    ? newestProducts 
    : newestProducts.filter(p => p.category === activeCategory);

  return (
    <section id="products" className="py-24 px-4 bg-white text-black">
      <div className="container mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-gray-200 pb-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Latest <br/> Drops.</h2>
              <p className="text-gray-500 max-w-md">Our 8 newest arrivals. Designed for comfort, styled for the streets.</p>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  suppressHydrationWarning
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 font-bold uppercase tracking-widest text-xs transition-colors rounded-full border ${
                    activeCategory === cat 
                      ? "bg-black text-white border-black" 
                      : "bg-transparent text-gray-500 border-gray-200 hover:border-black hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
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
          <div className="text-center py-24 text-gray-500">
            No products found in this category.
          </div>
        )}
        <div className="mt-16 text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
