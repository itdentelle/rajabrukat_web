"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

interface SiteConfig {
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
}

const FABRIC_CIRCLES = [
  {
    id: 1,
    name: "Brukat Tile Mutiara",
    image: "/images/brukat_tile_mutiara.png",
    link: "/shop?category=Brukat Tile Mutiara",
  },
  {
    id: 2,
    name: "Renda Chantilly",
    image: "/images/renda_chantilly_french.png",
    link: "/shop?category=Renda Chantilly",
  },
  {
    id: 3,
    name: "Cornely 3D Lace",
    image: "/images/cornely_silk_satin.png",
    link: "/shop?category=Cornely 3D",
  },
  {
    id: 4,
    name: "Silk Satin Furing",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop",
    link: "/shop?category=Furing %26 Silk",
  },
  {
    id: 5,
    name: "Organza & Tulle",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop",
    link: "/shop",
  },
];

export default function AboutBrand() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/config/hero")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.warn("Could not load brand config from server, using default UI:", err));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const marqueeX = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const marqueeXReverse = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);

  return (
    <section ref={containerRef} className="py-20 lg:py-28 bg-white text-black overflow-hidden relative">
      {/* Marquee Background */}
      <div className="absolute inset-0 z-0 opacity-[0.05] flex flex-col justify-between py-12 pointer-events-none overflow-hidden select-none">
        <motion.div style={{ x: marqueeX }} className="whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tighter text-amber-900">
          RAJA BRUKAT RAJA BRUKAT RAJA BRUKAT
        </motion.div>
        <motion.div style={{ x: marqueeXReverse }} className="whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tighter text-amber-800">
          LUXURY LACE & FABRICS LUXURY LACE
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="relative w-full flex flex-col justify-center items-center py-6 md:py-12 mb-8">
            <div className="w-full text-center relative z-30">
              <Reveal>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-4">
                  <span className="block text-stone-900">Didedikasikan Untuk</span>
                  <span className="block text-[#b77305] mt-1">
                    Keindahan Kebaya & Gaun Mewah
                  </span>
                </h3>
              </Reveal>
            </div>
          </div>

          {/* Circular Fabric Categories Swatch Row */}
          <div className="mb-20">
            <Reveal>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 py-4">
                {FABRIC_CIRCLES.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="group flex flex-col items-center gap-3.5 text-center transition-transform duration-300"
                  >
                    {/* Circle Swatch Container */}
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden shadow-xl border-4 border-stone-200 group-hover:border-[#b77305] group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 112px, 144px"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-115"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>

                    {/* Category Name Label */}
                    <span className="text-sm md:text-base font-bold text-stone-900 group-hover:text-[#b77305] transition-colors tracking-tight">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Animated Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative z-20">
            {[
              {
                title: "Detail Brukat Mutiara",
                desc: "Setiap helai kain diperkaya dengan motif bordir rapat, taburan mutiara timbul, dan payet kilau berkualitas tinggi.",
              },
              {
                title: "Bahan Halus & Nyaman",
                desc: "Serat renda Chantilly dan tile kualitas ekspor yang lembut di kulit, tidak gatal, serta jatuh secara sempurna.",
              },
              {
                title: "Pilihan Warna Lengkap",
                desc: "Tersedia puluhan varian warna anggun mulai dari pastel lembut, rose gold, nude, champagne, hingga warna royal tajam.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
                className="p-8 border border-[#b77305]/20 hover:border-[#b77305] transition-all duration-500 bg-[#b77305]/5 backdrop-blur-sm group hover:-translate-y-2 shadow-sm rounded-lg"
              >
                <div className="w-12 h-[2px] bg-[#b77305] mb-8 transform origin-left group-hover:scale-x-150 transition-all duration-500"></div>
                <h4 className="text-lg font-bold uppercase tracking-wider mb-4 text-stone-900 group-hover:text-[#b77305] transition-colors">
                  {feature.title}
                </h4>
                <p className="text-stone-600 text-sm leading-relaxed group-hover:text-stone-800 transition-colors">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Call To Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 flex justify-center relative z-20"
          >
            <Link
              href="/shop"
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black transition-all duration-200 bg-black/5 border border-black/20 hover:bg-black hover:text-white rounded-md overflow-hidden"
            >
              <span className="relative z-10 uppercase tracking-widest text-sm flex items-center gap-3">
                Explore Collection
                <svg className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
