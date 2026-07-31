"use client";

import { Product } from "@/store/cartStore";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import ProductCard from "@/components/products/ProductCard";

interface BestSellersProps {
  products: Product[];
}

export default function BestSellers({ products }: BestSellersProps) {
  const bestSellers = [...products].sort((a, b) => {
    const priceA = a.discountPrice ?? a.price;
    const priceB = b.discountPrice ?? b.price;
    return priceA - priceB;
  }).slice(0, 8);

  return (
    <section className="py-24 px-4 bg-gray-50 text-black overflow-hidden">
      <div className="container mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-gray-200 pb-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">Best <br/> Sellers.</h2>
              <p className="text-gray-500 max-w-md">The pieces everyone is talking about. Grab them before they're gone.</p>
            </div>
          </div>
        </Reveal>

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
