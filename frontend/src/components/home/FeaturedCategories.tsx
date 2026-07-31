"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

import Image from "next/image";

export default function FeaturedCategories() {
  const categories = [
    {
      title: "T-Shirts",
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop",
      link: "/shop?category=T-Shirt"
    },
    {
      title: "Outerwear",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop",
      link: "/shop?category=Outerwear"
    }
  ];

  return (
    <section className="py-8 px-4 bg-white">
      <div className="container mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, idx) => (
              <Link key={cat.title} href={cat.link} className="group relative h-[400px] md:h-[600px] overflow-hidden block">
                <motion.div 
                  className="absolute inset-0 z-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Image 
                    src={cat.image} 
                    alt={cat.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-10"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end z-20 text-white">
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">{cat.title}</h3>
                  <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    Shop Now <span className="text-lg">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
