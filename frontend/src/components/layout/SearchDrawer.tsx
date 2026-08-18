"use client";

import { useSearchStore } from "@/store/searchStore";
import { X, Search, Cpu, TrendingUp, ArrowRight, Tag, Command, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cleanTitle } from "@/utils/cleanTitle";
import { API_BASE_URL } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  image: string;
  category: string;
  description?: string;
  colors?: string[];
}

const TRENDING_KEYWORDS = [
  "Brukat Tile Mutiara",
  "Renda Chantilly",
  "Cornely 3D",
  "Silk Satin Furing",
  "Sage Green",
  "Dusty Pink",
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SearchDrawer() {
  const isOpen = useSearchStore((state) => state.isOpen);
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const openSearch = useSearchStore((state) => state.openSearch);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open search, ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
      if (e.key === "Escape" && isOpen) {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
      setSuggestions([]);
      setAiSummary(null);
      setUploadedImage(null);
      setIsAiMode(false);
    }
  }, [isOpen]);

  // Search logic (Standard & AI Smart Search)
  useEffect(() => {
    if (query.trim().length > 1 && !uploadedImage) {
      setLoading(true);
      const delayDebounceFn = setTimeout(() => {
        if (isAiMode) {
          fetch(`${API_BASE_URL}/api/ai/smart-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          })
            .then((res) => {
              const contentType = res.headers.get("content-type") || "";
              if (!res.ok || !contentType.includes("application/json")) throw new Error("Invalid response");
              return res.json();
            })
            .then((data) => {
              setSuggestions(data.products || []);
              setAiSummary(data.aiSummary || null);
              setLoading(false);
            })
            .catch(() => {
              setSuggestions([]);
              setLoading(false);
            });
        } else {
          fetch(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}`)
            .then((res) => {
              const contentType = res.headers.get("content-type") || "";
              if (!res.ok || !contentType.includes("application/json")) throw new Error("Invalid response");
              return res.json();
            })
            .then((resData) => {
              const data: Product[] = resData.products || resData;
              setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
              setAiSummary(null);
              setLoading(false);
            })
            .catch((err) => {
              console.error("Search failed", err);
              setSuggestions([]);
              setLoading(false);
            });
        }
      }, 250);

      return () => clearTimeout(delayDebounceFn);
    } else if (!uploadedImage) {
      setSuggestions([]);
      setAiSummary(null);
      setLoading(false);
    }
  }, [query, isAiMode, uploadedImage]);

  // Handle Image Upload for AI Visual Search
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setLoading(true);
      setIsAiMode(true);

      fetch(`${API_BASE_URL}/api/ai/visual-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      })
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.products || []);
          setAiSummary(data.analysis || "Hasil analisa gambar oleh AI.");
          setLoading(false);
        })
        .catch((err) => {
          console.error("Visual Search error", err);
          setLoading(false);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      router.push(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
  };

  const handleSuggestionClick = (productId: string) => {
    closeSearch();
    router.push(`/products/${productId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-50"
            onClick={closeSearch}
          />

          {/* Centered Command Palette Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            data-lenis-prevent="true"
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="fixed top-12 sm:top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-2xl bg-white z-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 overscroll-contain"
          >
            {/* Mode Switcher Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 px-6 py-2.5 flex items-center justify-between border-b border-amber-800/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAiMode(!isAiMode);
                    setUploadedImage(null);
                  }}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition flex items-center gap-1.5 ${
                    isAiMode
                      ? "bg-amber-500 text-stone-950 shadow-md"
                      : "bg-stone-800 text-amber-300 hover:bg-stone-700"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  {isAiMode ? "Mode Smart AI: Aktif" : "Aktifkan Pencarian AI"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  aria-label="Upload Foto Pencarian Visual"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-xs text-amber-200 hover:text-amber-100 flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full font-medium transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Visual Search (Upload Foto)
                </button>
              </div>
            </div>

            {/* Modal Search Input Header Bar */}
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
              <Search className="w-6 h-6 text-[#b77305] flex-shrink-0" />

              <form onSubmit={handleSubmit} className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  aria-label="Cari Produk atau Bahan Kain"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (uploadedImage) setUploadedImage(null);
                  }}
                  placeholder={
                    isAiMode
                      ? "Ketik pencarian bebas, misal: brokat sage green untuk wisuda..."
                      : "Cari motif kain, Chantilly, 3D Mutiara..."
                  }
                  className="w-full text-lg sm:text-xl font-bold text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                />
              </form>

              {/* Shortcut Tag & Close Button */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-200 text-stone-600 text-[10px] font-mono font-bold">
                  <Command className="w-3 h-3" /> K
                </span>

                <button
                  onClick={closeSearch}
                  aria-label="Tutup Modal Pencarian"
                  className="p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="p-6 max-h-[60vh] overflow-y-auto space-y-5 overscroll-contain"
            >
              {/* Image Preview if Visual Search Active */}
              {uploadedImage && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400">
                      <Image src={uploadedImage} alt="Visual Search" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Foto Siap Dianalisis AI</p>
                      <p className="text-[11px] text-stone-500">Pencarian produk berdasarkan visual foto</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setSuggestions([]);
                      setAiSummary(null);
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* AI Summary Block */}
              {aiSummary && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-100/50 to-stone-50 rounded-2xl border border-amber-300/60 flex items-start gap-3 shadow-sm"
                >
                  <Cpu className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">{aiSummary}</p>
                </motion.div>
              )}

              {/* State 1: Trending Keywords (When query is empty) */}
              {!query.trim() && !uploadedImage && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    <TrendingUp className="w-4 h-4 text-[#b77305]" />
                    <span>Pencarian Populer Raja Brukat</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {TRENDING_KEYWORDS.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => handleKeywordClick(keyword)}
                        className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white border border-stone-200 hover:border-[#b77305] text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{keyword}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* State 2: Loading Search Indicator */}
              {loading && (
                <div className="py-8 text-center text-amber-700 text-sm font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAiMode ? "AI sedang mencocokkan warna & model produk..." : "Mencari motif kain..."}
                </div>
              )}

              {/* State 3: Live Results List */}
              {suggestions.length > 0 && !loading && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    <span>Hasil Produk Ditemukan ({suggestions.length})</span>
                    <button
                      onClick={handleSubmit}
                      className="text-[#b77305] hover:underline flex items-center gap-1"
                    >
                      <span>Lihat Semua</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestions.map((product) => {
                      const { displayTitle, code } = cleanTitle(product.name);
                      const titleToShow = code ? `${displayTitle} [ ${code} ]` : displayTitle;

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSuggestionClick(product.id)}
                          className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-stone-100/80 transition-all cursor-pointer group border border-transparent hover:border-stone-200"
                        >
                          {/* Image */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                            <Image
                              src={product.image || "/images/brukat_tile_mutiara.png"}
                              alt={displayTitle}
                              fill
                              unoptimized={true}
                              sizes="56px"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate group-hover:text-[#b77305] transition-colors">
                              {titleToShow}
                            </h4>
                            <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                              {product.category}
                            </p>
                            <p className="text-xs font-bold text-[#b77305] font-mono mt-1">
                              {formatRupiah(product.discountPrice ?? product.price)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* State 4: No Results State */}
              {(query.trim().length > 1 || uploadedImage) && suggestions.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <p className="text-stone-800 font-bold text-base mb-1">Motif Kain Tidak Ditemukan</p>
                  <p className="text-stone-500 text-xs mb-4">
                    Tidak ditemukan kain yang persis sesuai. Cobalah kata kunci lain atau gunakan AI Assistant.
                  </p>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-[#b77305] text-white text-xs font-bold rounded-xl uppercase tracking-wider shadow-md"
                  >
                    Cari di Semua Katalog
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Helper Bar */}
            <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 text-stone-500 text-[11px] font-semibold flex items-center justify-between">
              <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">ENTER</kbd> untuk cari</span>
              <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">ESC</kbd> untuk menutup</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
