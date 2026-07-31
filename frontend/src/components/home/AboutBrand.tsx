"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface SiteConfig {
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
}

export default function AboutBrand() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  
  useEffect(() => {
    fetch("http://localhost:5000/api/config/hero")
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data) setConfig(data);
      })
      .catch(err => console.warn("Could not load brand config from server, using default UI:", err));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const marqueeX = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const marqueeXReverse = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);

  return (
    <section ref={containerRef} className="py-24 lg:py-32 bg-white text-black overflow-hidden relative">
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
          {/* Hero Section for Brand Story */}
          <div className="relative w-full flex flex-col justify-center items-center py-10 md:py-24 min-h-[50vh] mb-16">
            
            {/* Center/Right: Typography */}
            <div className="w-full text-center relative z-30 pt-6">
              <Reveal>
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
                  <span className="block text-stone-900">Didedikasikan Untuk</span>
                  <span className="block text-[#b77305] mt-2">
                    Keindahan Kebaya & Gaun Mewah
                  </span>
                </h3>
              </Reveal>

              <Reveal>
                <p className="text-stone-600 text-base md:text-xl leading-relaxed max-w-3xl mx-auto font-medium">
                  Raja Brukat menyediakan koleksi kain brukat tile mutiara, Chantilly halus, 3D floral lace, dan silk premium berkualitas tinggi. Sempurna untuk busana pesta, wisuda, seragam keluarga, hingga momen istimewa pernikahan Anda.
                </p>
              </Reveal>
            </div>
          </div>

          {/* Animated Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative z-20">
            {[
              { 
                title: "Detail Brukat Mutiara", 
                desc: "Setiap helai kain diperkaya dengan motif bordir rapat, taburan mutiara timbul, dan payet kilau berkualitas tinggi." 
              },
              { 
                title: "Bahan Halus & Nyaman", 
                desc: "Serat renda Chantilly dan tile kualitas ekspor yang lembut di kulit, tidak gatal, serta jatuh secara sempurna." 
              },
              { 
                title: "Pilihan Warna Lengkap", 
                desc: "Tersedia puluhan varian warna anggun mulai dari pastel lembut, rose gold, nude, champagne, hingga warna royal tajam." 
              }
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
            className="mt-20 flex justify-center relative z-20"
          >
            <a 
              href="#products" 
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black transition-all duration-200 bg-black/5 border border-black/20 hover:bg-black hover:text-white overflow-hidden"
            >
              <span className="relative z-10 uppercase tracking-widest text-sm flex items-center gap-3">
                Explore Collection
                <svg className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
