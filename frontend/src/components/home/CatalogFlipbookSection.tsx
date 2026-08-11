"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

const PAGE_PRODUCT_MAP: Record<number, string> = {
  3: "3808",
  4: "3476",
  5: "3476",
  6: "3476",
  7: "3476",
  8: "3476",
  9: "3476",
  10: "3476",
  11: "3476",
  12: "3188",
};

// Module-level memory cache so the catalog doesn't reload on page navigation
let globalPdfPagesCache: string[] = [];
let globalPageRatioCache = 1.414;
let globalProductCodeMapCache: Record<string, string> | null = null;

interface CatalogFlipbookProps {
  initialFullscreen?: boolean;
  config?: any;
}

export default function CatalogFlipbookSection({ initialFullscreen = false, config: propConfig }: CatalogFlipbookProps) {
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
        .catch((err) => console.warn("CatalogFlipbookSection config fetch warning:", err));
    }
  }, [propConfig]);

  const [pages, setPages] = useState<string[]>(globalPdfPagesCache);
  const [totalPages, setTotalPages] = useState(globalPdfPagesCache.length);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(globalPdfPagesCache.length === 0);
  const [loadProgress, setLoadProgress] = useState(globalPdfPagesCache.length > 0 ? 100 : 0);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [zoomLevel, setZoomLevel] = useState(1);
  // Actual page aspect ratio (height / width) from PDF canvas
  const [pageRatio, setPageRatio] = useState(globalPageRatioCache); // A4 default
  const [bookPageW, setBookPageW] = useState(0);
  const [fsPageW, setFsPageW] = useState(0);

  const bookRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<any>(null);
  const fsBookRef = useRef<HTMLDivElement>(null);
  const fsFlipBookRef = useRef<any>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll pinning state
  const pinnedFlips = useRef(0);
  const isCoolingDown = useRef(false);
  const [scrollHint, setScrollHint] = useState<string | null>(null);
  const [pinnedCount, setPinnedCount] = useState(0);

  // Dynamic product mapping
  const [productCodeToIdMap, setProductCodeToIdMap] = useState<Record<string, string>>(
    globalProductCodeMapCache || {}
  );

  // Fetch product list to map product codes to product IDs
  useEffect(() => {
    if (globalProductCodeMapCache) return;
    fetch(`${API_BASE_URL}/api/products?limit=200`)
      .then((res) => res.json())
      .then((data) => {
        const productList = data.products || data;
        if (Array.isArray(productList)) {
          const codeMap: Record<string, string> = {};
          productList.forEach((p: any) => {
            if (p.name && p.id) {
              const match = p.name.match(/KODE\s*(\d+[A-Z]?)/i);
              if (match && match[1]) {
                codeMap[match[1]] = p.id;
              }
            }
          });
          globalProductCodeMapCache = codeMap;
          setProductCodeToIdMap(codeMap);
        }
      })
      .catch((err) => console.warn("Notice: Catalog map fetch unreachable:", err?.message || err));

    // Fetch Redis-cached catalog metadata (TTL 24 hours)
    fetch(`${API_BASE_URL}/api/catalog`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.cachedAt) {
          console.log("⚡ Catalog Redis Cache loaded instantly:", data.cachedAt);
        }
      })
      .catch(() => {});
  }, []);

  // ── Load PDF via pdf.js ──
  useEffect(() => {
    if (globalPdfPagesCache.length > 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const loadPdf = async () => {
      try {
        let pdfUrlToLoad = "/Katalog.pdf";
        try {
          const res = await fetch(`${API_BASE_URL}/api/catalog`);
          const data = await res.json();
          if (data && data.pdfUrl) {
            pdfUrlToLoad = data.pdfUrl;
          }
        } catch (e) {
          console.warn("Failed to fetch catalog pdfUrl:", e);
        }

        const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.js")) as any;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument(pdfUrlToLoad).promise;
        const numPages: number = pdf.numPages;
        if (cancelled) return;
        setTotalPages(numPages);
        const urls: string[] = [];
        let calculatedRatio = 1.414;

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) return;
          // ⚡ Yield to event loop between each page so UI stays responsive
          await new Promise<void>((r) => setTimeout(r, 0));
          if (cancelled) return;
          const page = await pdf.getPage(i);
          // Reduced scale 1.5 (was 2.0) — 44% less memory, still sharp on screen
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          // Reduced JPEG quality 0.82 (was 0.88) — visually indistinguishable on screen
          urls.push(canvas.toDataURL("image/jpeg", 0.82));
          // Store aspect ratio from first page
          if (i === 1 && !cancelled) {
            calculatedRatio = viewport.height / viewport.width;
            setPageRatio(calculatedRatio);
          }
          if (!cancelled) setLoadProgress(Math.round((i / numPages) * 100));
        }
        if (!cancelled) {
          globalPdfPagesCache = urls;
          globalPageRatioCache = calculatedRatio;
          setPages(urls);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) setIsLoading(false);
      }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, []);

  // ── Scroll Pinning (Vertical) & Horizontal Swipe ──
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Allow scroll handling if we are hovering over the book
      if (!sectionRef.current || !flipBookRef.current || isLoading) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Check if section center is aligned with viewport center (+/- 220px)
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const isCentered = Math.abs(sectionCenter - viewportCenter) < 220;

      // Horizontal swipe (deltaX) works regardless of being perfectly centered
      if (Math.abs(e.deltaX) > 10 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault(); // Prevent browser back/forward swipe navigation
        
        if (isCoolingDown.current) return;
        isCoolingDown.current = true;
        
        const activeFlipBook = isFullscreen ? fsFlipBookRef.current : flipBookRef.current;
        if (!activeFlipBook) return;

        if (e.deltaX > 0) {
          activeFlipBook.flipNext();
        } else {
          activeFlipBook.flipPrev();
        }
        
        // Defer React state update and cooldown
        setTimeout(() => {
          isCoolingDown.current = false;
        }, 560);
        return;
      }

      // Vertical scroll is completely native and smooth now. No scrolljacking.
    };

    const book = bookRef.current;
    if (book) {
      book.addEventListener("wheel", handleWheel, { passive: false });
    }
    const fsBook = fsBookRef.current;
    if (fsBook) {
      fsBook.addEventListener("wheel", handleWheel, { passive: false });
    }
    
    return () => {
      if (book) book.removeEventListener("wheel", handleWheel);
      if (fsBook) fsBook.removeEventListener("wheel", handleWheel);
    };
  }, [isLoading]);

  // ── Init page-flip flipbook ──
  useEffect(() => {
    if (!pages.length || !bookRef.current) return;

    const initFlip = async () => {
      const { PageFlip } = await import("page-flip");

      // Destroy previous instance
      if (flipBookRef.current) {
        try { flipBookRef.current.destroy(); } catch (_) {}
      }

      const container = bookRef.current;
      if (!container || !container.parentElement) return;
      const availableW = container.parentElement.clientWidth || (typeof window !== "undefined" ? window.innerWidth * 0.9 : 600);
      // Calculate page dimensions constrained by width AND maximum height (640px on desktop)
      let pageW = Math.floor(availableW / 2);
      let pageH = Math.round(pageW * pageRatio);
      
      const maxH = typeof window !== "undefined" && window.innerWidth < 640 ? 400 : 520;
      if (pageH > maxH) {
        pageH = maxH;
        pageW = Math.round(pageH / pageRatio);
      }

      // Ensure container has relative positioning so PageFlip internal absolute elements don't escape
      container.style.position = "relative";
      // Update container dimensions to match calculated book dimensions exactly
      container.style.width = `${pageW * 2}px`;
      container.style.height = `${pageH}px`;
      setBookPageW(pageW);

      const pf = new PageFlip(container, {
        width: pageW,
        height: pageH,
        size: "fixed",
        minWidth: 100,
        maxWidth: pageW,
        minHeight: 100,
        maxHeight: pageH,
        showCover: true,
        drawShadow: true,
        flippingTime: 550,
        usePortrait: false,
        startPage: 0,
        autoSize: false,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: false,
        clickEventForward: false,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: true,
        disableFlipByClick: false,
      });

      // Build page elements
      const pageEls: HTMLElement[] = [];
      // Blank cover back (index 0 is cover front = page 1)
      pages.forEach((url, idx) => {
        const div = document.createElement("div");
        div.className = "stf-page";
        div.style.cssText = "width:100%;height:100%;overflow:hidden;background:#fff;";
        const img = document.createElement("img");
        img.src = url;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
        img.draggable = false;
        div.appendChild(img);
        pageEls.push(div);
      });

      pf.loadFromHTML(pageEls);

      pf.on("flip", (e: any) => {
        setCurrentPage(e.data);
      });

      flipBookRef.current = pf;
      setCurrentPage(0);
    };

    // Delay initialization slightly to ensure the container is fully rendered
    // and layout dimensions are available when remounting from cache.
    const timerId = setTimeout(initFlip, 150);
    return () => clearTimeout(timerId);
  }, [pages]);

  // ── Init fullscreen page-flip ──
  useEffect(() => {
    if (!isFullscreen || !pages.length || !fsBookRef.current) return;

    const initFs = async () => {
      const { PageFlip } = await import("page-flip");
      if (fsFlipBookRef.current) {
        try { fsFlipBookRef.current.destroy(); } catch (_) {}
      }

      const container = fsBookRef.current;
      if (!container || !container.parentElement) return;
      const parent = container.parentElement;
      const availW = parent.clientWidth || window.innerWidth * 0.95;
      const availH = (parent.clientHeight || window.innerHeight * 0.78) - 12;

      // Calculate page dimensions constrained by both available height & width preserving pageRatio
      let pageH = availH;
      let pageW = Math.round(pageH / pageRatio);

      if (pageW * 2 > availW) {
        pageW = Math.floor(availW / 2);
        pageH = Math.round(pageW * pageRatio);
      }

      setFsPageW(pageW);
      container.style.height = `${pageH}px`;
      container.style.width = `${pageW * 2}px`;

      const pf = new PageFlip(container, {
        width: pageW,
        height: pageH,
        size: "fixed",
        showCover: true,
        drawShadow: true,
        flippingTime: 700,
        usePortrait: false,
        autoSize: false,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: false,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: true,
      });

      const pageEls: HTMLElement[] = pages.map((url) => {
        const div = document.createElement("div");
        div.style.cssText = "width:100%;height:100%;overflow:hidden;background:#fff;";
        const img = document.createElement("img");
        img.src = url;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
        img.draggable = false;
        div.appendChild(img);
        return div;
      });

      pf.loadFromHTML(pageEls);

      // Go to current page
      if (currentPage > 0) {
        setTimeout(() => pf.turnToPage(currentPage), 100);
      }

      pf.on("flip", (e: any) => setCurrentPage(e.data));
      fsFlipBookRef.current = pf;
    };

    const timer = setTimeout(initFs, 100);
    return () => clearTimeout(timer);
  }, [isFullscreen, pages]);

  const handleNext = () => flipBookRef.current?.flipNext();
  const handlePrev = () => flipBookRef.current?.flipPrev();
  const handleFsNext = () => fsFlipBookRef.current?.flipNext();
  const handleFsPrev = () => fsFlipBookRef.current?.flipPrev();

  const spreadDots = Math.ceil(totalPages / 2);
  const currentSpreadIdx = Math.floor(currentPage / 2);
  const activeProduct = PAGE_PRODUCT_MAP[currentPage + 1] || PAGE_PRODUCT_MAP[currentPage + 2];
  const activeProductId = activeProduct ? productCodeToIdMap[activeProduct] : null;
  const activeHref = activeProductId 
    ? `/products/${activeProductId}` 
    : (activeProduct ? `/shop?search=${activeProduct}` : "/shop");

  return (
    <section ref={sectionRef} id="katalog-section" className="pt-8 pb-24 sm:pt-12 sm:pb-36 bg-transparent text-stone-900 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section Header with Progressive Blur Reveal Animation */}
          <div className="text-center max-w-3xl mx-auto mb-8">
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
                {config?.catalogTitleLine1 || "Katalog"}
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, filter: "blur(14px)", x: -25 },
                  visible: { opacity: 1, filter: "blur(0px)", x: 0, transition: { duration: 0.65, ease: "easeOut" } },
                }}
                className="inline-block text-[#b77305] italic font-serif"
              >
                {config?.catalogTitleLine2 || "Kain Eksklusif"}
              </motion.span>
            </motion.h2>
          </div>

          {/* Top Bar (Scroll Pinning Hint Badge) */}
          <div className="flex flex-wrap items-center justify-start text-xs text-stone-600 mb-3 px-1 min-h-[32px]">
            {scrollHint && (
              <span className="px-3 py-1 bg-[#b77305]/10 border border-[#b77305]/30 text-[#b77305] font-bold rounded-full animate-pulse flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {scrollHint}
              </span>
            )}
          </div>

          {/* ── Flipbook Container ── */}
          <div className="relative">
            {/* Loading overlay */}
            {isLoading && (
              <div className="z-50 flex flex-col items-center justify-center bg-white/95 rounded-2xl gap-4 shadow border border-stone-100 min-h-[400px] w-full">
                <Loader2 className="w-10 h-10 text-[#b77305] animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-stone-900">Memuat Katalog PDF...</p>
                  <p className="text-xs text-stone-500">{loadProgress}% selesai</p>
                  <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-[#b77305] rounded-full transition-all duration-300" style={{ width: `${loadProgress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Book stage — centered when cover page (currentPage === 0) */}
            <div className="w-full flex justify-center py-2">
              <div
                ref={bookRef}
                className={`relative transition-all duration-300 ${
                  currentPage === 0
                    ? "bg-transparent shadow-none"
                    : "bg-white shadow-[0_15px_50px_rgba(0,0,0,0.15)]"
                }`}
                style={{
                  minHeight: "300px",
                  display: isLoading ? "none" : "block",
                  transform:
                    bookPageW > 0 && currentPage === 0
                      ? `translateX(-${bookPageW / 2}px)`
                      : bookPageW > 0 && currentPage >= totalPages - 1
                      ? `translateX(${bookPageW / 2}px)`
                      : "translateX(0px)",
                  transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>

            {/* Nav arrows removed per user request */}
          </div>

          {/* Bottom Controls Area */}
          {!isLoading && (
            <div className="mt-6 flex flex-col items-center gap-4">
              {/* Page Scrollbar */}
              <div className="flex items-center justify-center w-full max-w-[240px] gap-3">
                <span className="text-xs font-bold text-stone-400">1</span>
                <input
                  type="range"
                  min="0"
                  max={spreadDots - 1}
                  value={currentSpreadIdx}
                  onChange={(e) => flipBookRef.current?.turnToPage(Number(e.target.value) * 2)}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#b77305] hover:accent-[#d4af37]"
                />
                <span className="text-xs font-bold text-stone-400">{totalPages}</span>
              </div>

              {/* Action Bar (Hal counter, Fullscreen, PDF) — Only appears when user opens to the second spread / after 2 scroll flips */}
              <AnimatePresence>
                {(pinnedCount >= 2 || currentPage >= 2) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-wrap items-center justify-center gap-3 text-xs text-stone-600 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-stone-200 shadow-md"
                  >
                    <span className="text-stone-500 font-medium">
                      Hal <strong className="text-stone-900 font-bold">{currentPage + 1}</strong>–
                      <strong className="text-stone-900 font-bold">{Math.min(currentPage + 2, totalPages)}</strong>
                      {" "}dari{" "}
                      <strong className="text-stone-900 font-bold">{totalPages}</strong>
                    </span>

                    <div className="w-px h-4 bg-stone-300 mx-1" />

                    <Link 
                      href={activeHref}
                      className="flex items-center gap-1.5 text-[#b77305] hover:text-[#9a5f00] font-bold transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {activeProduct ? `Belanja Kode ${activeProduct}` : "Belanja Sekarang"}
                    </Link>

                    <div className="w-px h-4 bg-stone-300 mx-1" />

                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="px-3.5 py-1.5 bg-[#b77305] hover:bg-[#d4af37] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Fullscreen</span>
                    </button>
                    <a
                      href="/Katalog.pdf"
                      download="Katalog_RajaBrukat_2026.pdf"
                      className="px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-all border border-stone-200 flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#b77305]" />
                      <span>PDF</span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────── FULLSCREEN MODAL ─────────────── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-stone-100/98 backdrop-blur-xl flex flex-col p-3 sm:p-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#b77305]/10 border border-[#b77305]/30 text-[#b77305]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Katalog 3D Raja Brukat 2026</h3>
                  {!isLoading && (
                    <p className="text-xs text-stone-500">
                      Hal <strong>{currentPage + 1}</strong>–<strong>{Math.min(currentPage + 2, totalPages)}</strong> dari {totalPages}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
                  <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-xs font-bold px-2 min-w-[40px] text-center text-stone-700">{Math.round(zoomLevel * 100)}%</span>
                  <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"><ZoomIn className="w-4 h-4" /></button>
                </div>
                <a href="/Katalog.pdf" download className="hidden sm:flex px-3 py-2 bg-[#b77305] text-white font-bold text-xs rounded-xl items-center gap-2 hover:bg-[#d4af37] transition-colors">
                  <Download className="w-4 h-4" /><span>Unduh PDF</span>
                </a>
                <button onClick={() => setIsFullscreen(false)} className="p-2 bg-white hover:bg-red-600 text-stone-700 hover:text-white rounded-xl border border-stone-200 transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* FS Book */}
            <div className="flex-1 flex items-center justify-center my-2 overflow-hidden w-full h-full">
              <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.2s ease", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <div
                  ref={fsBookRef}
                  className="flex justify-center items-center"
                  style={{
                    transform:
                      fsPageW > 0 && currentPage === 0
                        ? `translateX(-${fsPageW / 2}px)`
                        : fsPageW > 0 && currentPage >= totalPages - 1
                        ? `translateX(${fsPageW / 2}px)`
                        : "translateX(0px)",
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </div>

            {/* FS Nav */}
            <div className="shrink-0 flex items-center justify-center gap-4 pt-2">
              <button onClick={handleFsPrev} className="w-10 h-10 rounded-full bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-[#b77305] hover:text-white hover:border-[#b77305] disabled:opacity-20 transition-all shadow-sm">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs text-stone-500">Geser halaman atau klik sudut buku untuk membalik</span>
              <button onClick={handleFsNext} className="w-10 h-10 rounded-full bg-white border border-stone-200 text-stone-700 flex items-center justify-center hover:bg-[#b77305] hover:text-white hover:border-[#b77305] disabled:opacity-20 transition-all shadow-sm">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
