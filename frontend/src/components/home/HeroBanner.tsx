"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface HeroConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
}

import Image from "next/image";

interface HeroBannerProps {
  config: HeroConfig;
}

export default function HeroBanner({ config }: HeroBannerProps) {
  const titleLines = config ? config.title.split('\n') : ["Kemewahan", "Raja Brukat"];

  return (
    <div className="relative h-screen min-h-[650px] w-full flex items-center justify-center overflow-hidden bg-stone-950 text-amber-50">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Image 
          src={config?.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=2400&auto=format&fit=crop"} 
          alt="Raja Brukat Luxury Lace" 
          fill
          priority={true}
          sizes="100vw"
          className="object-cover object-center transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/50 to-stone-950/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950/30 via-transparent to-amber-950/30"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 text-center mt-20">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="uppercase tracking-[0.35em] text-xs md:text-sm mb-6 text-[#b77305] font-semibold"
        >
          {config?.subtitle || "Koleksi Kain Brukat & Lace Premium 2026"}
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter mb-8 leading-none drop-shadow-lg"
        >
          {config ? (
            titleLines.map((line, idx) => (
              <span key={idx}>
                {idx === titleLines.length - 1 ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5a024] via-[#b77305] to-[#8c5703]">{line}</span>
                ) : (
                  <>{line}<br className="hidden md:block"/></>
                )}
              </span>
            ))
          ) : (
            <>Kemewahan <br className="hidden md:block"/> Kain <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5a024] via-[#b77305] to-[#8c5703]">Raja Brukat</span></>
          )}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Link 
            href={config?.buttonLink || "/shop"} 
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#b77305] text-white font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-[#965e04] hover:scale-105 transition-all duration-300 rounded-sm shadow-lg shadow-[#b77305]/20"
          >
            {config?.buttonText || "Jelajahi Koleksi"} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-[1px] h-16 bg-white/30">
          <div className="w-full h-1/2 bg-white"></div>
        </div>
      </motion.div>
    </div>
  );
}
