"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface FabricComparisonProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function FabricComparisonSlider({
  beforeImage = "/images/white_lace_hero.png",
  afterImage = "/images/metallic_lace_hero.png",
  beforeLabel = "Semi Prancis 3D",
  afterLabel = "Metallic Elegant",
}: FabricComparisonProps) {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <section className="py-20 bg-white text-stone-900 relative overflow-hidden border-t border-stone-100">
      <div className="w-full mx-auto px-2 sm:px-4 md:px-8 max-w-[1700px]">
        
        {/* Section Header with Progressive Blur Reveal Animation */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-wide text-stone-950 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          >
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(14px)", x: -25 },
                visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.65, ease: "easeOut" } },
              }}
              className="inline-block"
            >
              Compare
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(14px)", x: -25 },
                visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.65, ease: "easeOut" } },
              }}
              className="inline-block text-[#b77305] italic font-serif"
            >
              Textile
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(14px)", x: -25 },
                visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.65, ease: "easeOut" } },
              }}
              className="inline-block text-[#b77305] italic font-serif"
            >
              Quality
            </motion.span>
          </motion.h2>
        </div>

        {/* Interactive Comparison Slider Container */}
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (e.touches[0]) handleMove(e.touches[0].clientX);
          }}
          className="relative w-full h-[460px] sm:h-[580px] md:h-[680px] lg:h-[750px] rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize select-none group"
        >
          {/* Base Image (Right / After) */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={afterImage}
              alt={afterLabel}
              fill
              priority
              sizes="(max-width: 1700px) 100vw, 1700px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-stone-950/20" />

            {/* Stationary Label on Right Image side, near left edge where slider handle sits when opened */}
            <div className="absolute left-10 sm:left-16 md:left-20 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <h3 className="text-3xl sm:text-5xl md:text-6xl font-serif font-medium text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] whitespace-nowrap tracking-wide">
                {afterLabel}
              </h3>
            </div>
          </div>

          {/* Clipped Image (Left / Before) */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden z-20"
            style={{
              clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
            }}
          >
            <Image
              src={beforeImage}
              alt={beforeLabel}
              fill
              priority
              sizes="(max-width: 1700px) 100vw, 1700px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-stone-950/20" />

            {/* Stationary Label on Left Image side, near right edge where slider handle sits when opened */}
            <div className="absolute right-10 sm:right-16 md:right-20 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <h3 className="text-3xl sm:text-5xl md:text-6xl font-serif font-medium text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] whitespace-nowrap tracking-wide">
                {beforeLabel}
              </h3>
            </div>
          </div>

          {/* Divider Drag Line & Handle */}
          <div
            className="absolute top-0 bottom-0 z-30 w-1 bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.8)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Center Handle Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-950/90 border-2 border-white/80 text-white shadow-2xl backdrop-blur-md flex items-center justify-center gap-0.5 group-hover:scale-110 transition-transform">
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
