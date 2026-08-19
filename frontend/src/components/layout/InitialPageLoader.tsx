"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function InitialPageLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    // Check if session already saw splash in this tab to avoid repetitive loads
    if (typeof window !== "undefined" && sessionStorage.getItem("rb_splash_shown")) {
      setIsVisible(false);
      setIsRendered(false);
      return;
    }

    let minTimePassed = false;
    let pageFullyLoaded = typeof document !== "undefined" && document.readyState === "complete";

    const finishLoading = () => {
      if (minTimePassed && pageFullyLoaded) {
        setIsVisible(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("rb_splash_shown", "1");
        }
        // Completely remove from rendering after fade-out transition finishes (500ms)
        setTimeout(() => setIsRendered(false), 550);
      }
    };

    // Smooth buffer duration (750ms)
    const minTimer = setTimeout(() => {
      minTimePassed = true;
      finishLoading();
    }, 750);

    const handleLoad = () => {
      pageFullyLoaded = true;
      finishLoading();
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        pageFullyLoaded = true;
        finishLoading();
      } else {
        window.addEventListener("load", handleLoad, { once: true });
      }
    }

    // Safety fallback
    const maxSafetyTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setIsRendered(false), 550);
    }, 2000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxSafetyTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("load", handleLoad);
      }
    };
  }, []);

  if (!isRendered) return null;

  return (
    <div
      aria-hidden={!isVisible}
      style={{
        contain: "strict",
        willChange: "opacity",
        transition: "opacity 450ms cubic-bezier(0.4, 0, 0.2, 1), visibility 450ms",
      }}
      className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center select-none ${
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none invisible"
      }`}
    >
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transform-gpu">
        <Image
          src="/icon.png"
          alt="Raja Brukat"
          width={128}
          height={128}
          priority
          fetchPriority="high"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
