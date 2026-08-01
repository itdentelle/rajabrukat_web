"use client";

import { useSearchStore } from "@/store/searchStore";
import { X, Search, Sparkles, TrendingUp, ArrowRight, Tag, Command } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  description?: string;
}

const TRENDING_KEYWORDS = [
  "Brukat Tile Mutiara",
  "Renda Chantilly",
  "Cornely 3D",
  "Silk Satin Furing",
  "Grade A",
  "Metallic",
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

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
    }
  }, [isOpen]);

  // Real-time Debounced Search via API
  useEffect(() => {
    if (query.trim().length > 1) {
      setLoading(true);
      const delayDebounceFn = setTimeout(() => {
        fetch(`http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`)
          .then((res) => res.json())
          .then((resData) => {
            const data: Product[] = resData.products || resData;
            setSuggestions(data.slice(0, 6));
            setLoading(false);
          })
          .catch((err) => {
            console.error("Search failed", err);
            setSuggestions([]);
            setLoading(false);
          });
      }, 250);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      router.push(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    closeSearch();
    router.push(`/shop?q=${encodeURIComponent(keyword)}`);
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
            className="fixed top-12 sm:top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-full max-w-2xl bg-white z-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200"
          >
            {/* Modal Search Input Header Bar */}
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
              <Search className="w-6 h-6 text-[#b77305] flex-shrink-0" />
              
              <form onSubmit={handleSubmit} className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari motif kain, Chantilly, 3D Mutiara..."
                  className="w-full text-lg sm:text-2xl font-bold text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                />
              </form>

              {/* Shortcut Tag & Close Button */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-200 text-stone-600 text-[10px] font-mono font-bold">
                  <Command className="w-3 h-3" /> K
                </span>

                <button
                  onClick={closeSearch}
                  className="p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
              
              {/* State 1: Trending Keywords (When query is empty) */}
              {!query.trim() && (
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
                <div className="py-8 text-center text-stone-500 text-sm font-semibold">
                  Mencari motif kain...
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
                    {suggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.id)}
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-stone-200 hover:border-[#b77305] bg-white hover:bg-amber-50/40 cursor-pointer transition-all duration-300 group shadow-sm"
                      >
                        {/* Fabric Thumbnail */}
                        <div className="relative w-14 h-14 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={product.image || "/images/brukat_tile_mutiara.png"}
                            alt={product.name}
                            fill
                            sizes="56px"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate group-hover:text-[#b77305] transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                            {product.category}
                          </p>
                          <p className="text-xs font-bold text-[#b77305] font-mono mt-1">
                            {formatRupiah(product.discountPrice ?? product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* State 4: No Results State */}
              {query.trim().length > 1 && suggestions.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <p className="text-stone-800 font-bold text-base mb-1">Motif Kain Tidak Ditemukan</p>
                  <p className="text-stone-500 text-xs mb-4">
                    Tidak ditemukan kain dengan kata kunci &quot;{query}&quot;. Cobalah kata kunci seperti Chantilly, Mutiara, atau 3D.
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
              <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">ENTER</kbd> untuk cari di katalog</span>
              <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">ESC</kbd> untuk menutup</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
