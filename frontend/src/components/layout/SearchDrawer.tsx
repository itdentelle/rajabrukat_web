"use client";

import { useSearchStore } from "@/store/searchStore";
import { X, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function SearchDrawer() {
  const isOpen = useSearchStore((state) => state.isOpen);
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Update suggestions when query changes using backend search API
  useEffect(() => {
    if (query.trim().length > 1) {
      const delayDebounceFn = setTimeout(() => {
        fetch(`http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(resData => {
            const data = resData.products || resData;
            setSuggestions(data.slice(0, 4));
          })
          .catch(err => console.error("Search failed", err));
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      router.push(`/shop?category=All&q=${encodeURIComponent(query)}`);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    closeSearch();
    router.push(`/products/${productId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeSearch}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 right-0 bg-white z-50 shadow-xl flex flex-col items-center pt-24 pb-12 px-4 max-h-[80vh] overflow-y-auto"
          >
            <button 
              onClick={closeSearch}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit} className="relative w-full">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full text-3xl md:text-5xl font-black uppercase tracking-tighter border-b-2 border-gray-200 focus:border-black bg-transparent py-4 pr-16 outline-none placeholder:text-gray-300 transition-colors"
                />
                <button 
                  type="submit"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-gray-400 hover:text-black transition-colors"
                >
                  <Search className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {suggestions.map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.id)}
                        className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all group"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img src={product.image || "/placeholder.jpg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-bold uppercase tracking-wider text-sm">{product.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{product.category} &bull; Rp {product.price.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
