"use client";

import { Product } from "@/store/cartStore";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import ProductCard from "@/components/products/ProductCard";

interface BestSellersProps {
  products: Product[];
  config?: any;
}

export default function BestSellers({ products, config }: BestSellersProps) {
  const bestSellers = [...products].sort((a, b) => {
    const priceA = a.discountPrice ?? a.price;
    const priceB = b.discountPrice ?? b.price;
    return priceA - priceB;
  }).slice(0, 8);

  const rawTitle = config?.bestSellersTitle;
  const titleText = (!rawTitle || rawTitle === "Best Sellers.")
    ? "Koleksi Terlaris & Paling Diminati"
    : rawTitle;

  const rawDesc = config?.bestSellersDescription;
  const descriptionText = (!rawDesc || rawDesc.includes("pieces everyone"))
    ? "Kombinasi kain brukat, tile mutiara 3D, dan renda Chantilly paling populer pilihan para desainer & pelanggan Raja Brukat."
    : rawDesc;

  return (
    <section className="py-24 px-6 bg-stone-50 text-stone-900 overflow-hidden border-t border-stone-200">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-stone-200 pb-8">
          <div>
            <span className="text-[#b77305] text-xs font-bold uppercase tracking-[0.25em] block mb-2">
              PRODUK TERFAVORIT
            </span>
            <motion.h2
              initial={{ opacity: 0, filter: "blur(6px)", y: 20 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              viewport={{ once: false, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-wide text-stone-950 mb-3 whitespace-pre-line transform-gpu"
            >
              {titleText.includes("&") ? (
                <>
                  <span>{titleText.split("&")[0]}&</span>
                  <span className="text-[#b77305] italic font-serif ml-2">{titleText.split("&")[1]}</span>
                </>
              ) : (
                titleText
              )}
            </motion.h2>
            <p className="text-stone-600 font-light max-w-lg text-sm md:text-base leading-relaxed">
              {descriptionText}
            </p>
          </div>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {bestSellers.map((product, idx) => (
            <motion.div 
              key={product.id}
              className="min-w-[280px] md:min-w-[320px] snap-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
