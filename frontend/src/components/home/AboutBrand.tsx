"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface AboutBrandProps {
  config?: any;
}

export default function AboutBrand({ config: propConfig }: AboutBrandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<any>(propConfig || null);

  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
    } else {
      fetch(`${API_BASE_URL}/api/config/hero`)
        .then((res) => {
          const contentType = res.headers.get("content-type") || "";
          if (!res.ok || !contentType.includes("application/json")) return null;
          return res.json();
        })
        .then((data) => {
          if (data) setConfig(data);
        })
        .catch((err) => console.warn("Could not load brand config from server, using default UI:", err));
    }
  }, [propConfig]);

  // Sticky Scroll Pinning specifically for the Big Text Header & Ribbon Animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    restDelta: 0.001,
  });

  // Animates ribbon from 0 to 1 during the pinned scroll of the big text header
  const pathLengthProgress = useTransform(smoothProgress, [0, 0.85], [0, 1]);

  return (
    <section className="bg-white text-black relative">
      {/* Pinned Scroll Track: Big Text Header stays centered while ribbon animation draws */}
      <div ref={containerRef} className="relative h-[150vh]">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
          
          {/* Header Box framed by Refined Calligraphic Ribbon */}
          <div className="relative w-full max-w-4xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center justify-center">
            
            {/* Fabric Strand SVG Framing OUTSIDE The Big Header Text */}
            <div
              className="absolute -inset-6 sm:-inset-12 pointer-events-none z-0 flex items-center justify-center select-none overflow-visible"
              style={{ willChange: "transform" }}
            >
              <svg
                className="w-full h-full min-h-[320px] md:min-h-[380px] opacity-85 md:opacity-95 overflow-visible"
                viewBox="0 0 1080 360"
                fill="none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="calligraphyGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b77305" stopOpacity="0.15" />
                    <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.95" />
                    <stop offset="65%" stopColor="#d97706" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#b77305" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Main Calligraphic Ribbon Strand with Equal Top & Bottom Spacing Buffer */}
                <motion.path
                  d="M 80 48 C 280 20, 780 20, 905 48 S 975 190, 870 260 S 670 335, 630 300 S 710 260, 760 280 S 390 330, 80 300"
                  stroke="url(#calligraphyGold)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{ pathLength: pathLengthProgress }}
                />

                {/* Secondary Parallel Dashed Ribbon Accent */}
                <motion.path
                  d="M 65 60 C 270 32, 770 32, 920 60 S 990 202, 885 272 S 685 347, 645 312 S 725 272, 775 292 S 405 342, 65 312"
                  stroke="url(#calligraphyGold)"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  style={{ pathLength: pathLengthProgress }}
                />
              </svg>
            </div>

            {/* Big Text Header with Luxury Serif Typography & Progressive Blur Reveal Animation */}
            <div className="w-full text-center relative z-10 px-4 py-4 my-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: "-60px" }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.18,
                    },
                  },
                  hidden: {},
                }}
                className="flex flex-col items-center justify-center"
              >
                <motion.span
                  variants={{
                    hidden: { opacity: 0, filter: "blur(6px)", y: -15 },
                    visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                  }}
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#b77305] mb-3 transform-gpu"
                >
                  {config?.aboutSubtitle || "Koleksi Tekstil Eksklusif"}
                </motion.span>

                <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium tracking-wide leading-[1.25] text-stone-950 max-w-2xl sm:max-w-3xl transform-gpu">
                  <motion.span
                    variants={{
                      hidden: { opacity: 0, filter: "blur(6px)", x: -25 },
                      visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                    className="block transform-gpu"
                  >
                    {config?.aboutTitleLine1 || (config?.aboutTitle ? config.aboutTitle.split("\n")[0] : "Didedikasikan Untuk")}
                  </motion.span>
                  <motion.span
                    variants={{
                      hidden: { opacity: 0, filter: "blur(6px)", x: 25 },
                      visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                    className="block text-[#b77305] italic font-serif mt-1.5 transform-gpu"
                  >
                    {config?.aboutTitleLine2 || (config?.aboutTitle ? config.aboutTitle.split("\n")[1] || "" : "Keindahan Kebaya & Gaun Mewah")}
                  </motion.span>
                </h3>
              </motion.div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
