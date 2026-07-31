"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import ProductSkeleton from "@/components/ui/ProductSkeleton";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((resData) => {
        const data = resData.products || resData;
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
        setLoading(false);
      });
  }, [query]);

  const min = parseInt(minPrice) || 0;
  const max = parseInt(maxPrice) || Infinity;
  let finalProducts = products.filter(p => {
    const priceToCompare = p.discountPrice ?? p.price;
    return priceToCompare >= min && priceToCompare <= max;
  });

  finalProducts.sort((a, b) => {
    const priceA = a.discountPrice ?? a.price;
    const priceB = b.discountPrice ?? b.price;
    
    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;
    
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="container mx-auto px-4 py-24 min-h-[70vh]">
      <div className="mb-12 border-b border-gray-200 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            Search Results
          </h1>
          <p className="text-gray-500">
            Showing results for <span className="font-bold text-black">"{query}"</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 w-full md:w-auto">
          {/* Sort By Dropdown */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-transparent text-sm font-bold uppercase tracking-widest border border-gray-200 focus:border-black outline-none rounded-md"
          >
            <option value="newest">Sort: Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          {/* Price Filter Dropdown (Custom UI) */}
          <div className="relative group">
            <button className="px-4 py-2 bg-transparent text-sm font-bold uppercase tracking-widest border border-gray-200 hover:border-black outline-none rounded-md flex items-center h-full">
              Price Filter
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl p-4 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1">Min Price (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1">Max Price (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="Unlimited"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <ProductSkeleton key={n} />
          ))}
        </div>
      ) : finalProducts.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
          <AnimatePresence>
            {finalProducts.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={product.id}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold uppercase mb-4">No Matches Found</h2>
          <p className="text-gray-500">Try searching for something else like "jacket" or "t-shirt".</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
