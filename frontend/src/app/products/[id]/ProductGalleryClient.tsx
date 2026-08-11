"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryClientProps {
  mainImage: string;
  galleryImages: string[];
  productName: string;
}

export default function ProductGalleryClient({ mainImage, galleryImages, productName }: ProductGalleryClientProps) {
  const [activeImage, setActiveImage] = useState(mainImage);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine main image with gallery images for the thumbnails, ensuring uniqueness
  const allImages = Array.from(new Set([mainImage, ...(galleryImages || [])].filter(Boolean)));

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation inside Lightbox (Left, Right, ESC)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, allImages.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image View (Click to open Lightbox Modal) */}
      <div 
        onClick={() => handleOpenLightbox(allImages.indexOf(activeImage))}
        className="relative aspect-square w-full bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm cursor-zoom-in group"
      >
        <Image 
          src={activeImage || "/placeholder.jpg"} 
          alt={productName} 
          fill
          unoptimized={true}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Floating Zoom Indicator Badge */}
        <div className="absolute bottom-3 right-3 bg-stone-950/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>Klik untuk perbesar</span>
        </div>
      </div>

      {/* Thumbnails (Hover to preview on page) */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {allImages.map((imgUrl, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setActiveImage(imgUrl);
                handleOpenLightbox(idx);
              }}
              onMouseEnter={() => setActiveImage(imgUrl)}
              className={`relative aspect-square bg-stone-50 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                activeImage === imgUrl ? "border-stone-900 shadow-md scale-102 opacity-100" : "border-stone-200/60 opacity-70 hover:opacity-100 hover:border-stone-400"
              }`}
            >
              <Image 
                src={imgUrl || "/placeholder.jpg"} 
                alt={`${productName} view ${idx + 1}`} 
                fill
                unoptimized={true}
                sizes="(max-width: 768px) 20vw, 10vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLightboxOpen(false)}
              className="absolute inset-0 bg-stone-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Big Active Image Preview with Prev/Next Controls */}
              <div className="relative flex-1 bg-stone-100 min-h-[350px] sm:min-h-[450px] md:min-h-[550px] flex items-center justify-center p-4">
                <Image 
                  src={allImages[lightboxIndex] || "/placeholder.jpg"} 
                  alt={productName}
                  fill
                  unoptimized={true}
                  className="object-contain p-2"
                />

                {/* Left Arrow (<) */}
                {allImages.length > 1 && (
                  <button 
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-14 bg-stone-900/60 hover:bg-stone-900 text-white rounded-xl flex items-center justify-center backdrop-blur-xs shadow-lg transition-all hover:scale-105"
                    aria-label="Gambar Sebelumnya"
                  >
                    <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                  </button>
                )}

                {/* Right Arrow (>) */}
                {allImages.length > 1 && (
                  <button 
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-14 bg-stone-900/60 hover:bg-stone-900 text-white rounded-xl flex items-center justify-center backdrop-blur-xs shadow-lg transition-all hover:scale-105"
                    aria-label="Gambar Selanjutnya"
                  >
                    <ChevronRight className="w-7 h-7 stroke-[2.5]" />
                  </button>
                )}
              </div>

              {/* Right Column: Title & Thumbnail Selector Grid */}
              <div className="w-full md:w-80 p-6 flex flex-col bg-white border-t md:border-t-0 md:border-l border-stone-200 overflow-y-auto">
                <h3 className="font-bold text-stone-900 text-base sm:text-lg leading-snug line-clamp-3 mb-4 pr-6">
                  {productName}
                </h3>

                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                  Pilih Varian Foto ({lightboxIndex + 1}/{allImages.length})
                </p>

                {/* Lightbox Thumbnails Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      onMouseEnter={() => setLightboxIndex(idx)}
                      aria-label={`Pilih Thumbnail ${idx + 1}`}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        lightboxIndex === idx
                          ? "border-[#b77305] shadow-md scale-102 ring-2 ring-[#b77305]/20"
                          : "border-stone-200 opacity-70 hover:opacity-100 hover:border-stone-400"
                      }`}
                    >
                      <Image 
                        src={imgUrl || "/placeholder.jpg"}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        unoptimized={true}
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
