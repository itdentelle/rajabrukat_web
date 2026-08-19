"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function InitialPageLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let minTimePassed = false;
    let pageFullyLoaded = typeof document !== "undefined" && document.readyState === "complete";

    const finishLoading = () => {
      if (minTimePassed && pageFullyLoaded) {
        setIsVisible(false);
      }
    };

    // Minimum display duration (1 second) for smooth clean transition
    const minTimer = setTimeout(() => {
      minTimePassed = true;
      finishLoading();
    }, 1000);

    const handleLoad = () => {
      pageFullyLoaded = true;
      finishLoading();
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        pageFullyLoaded = true;
        finishLoading();
      } else {
        window.addEventListener("load", handleLoad);
      }
    }

    // Safety fallback maximum timeout (2.5 seconds)
    const maxSafetyTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxSafetyTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("load", handleLoad);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="initial-splash-loader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.5, ease: "easeOut" } 
          }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center pointer-events-auto select-none"
        >
          {/* Only Centered Logo on Pure White Background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center"
          >
            <Image
              src="/icon.png"
              alt="Raja Brukat"
              width={144}
              height={144}
              priority
              className="w-full h-full object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
