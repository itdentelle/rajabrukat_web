"use client";

import { useEffect, useState, Suspense } from "react";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, FadeIn } from "@/components/ui/Reveal";
import ProductSkeleton from "@/components/ui/ProductSkeleton";
import { useSearchParams } from "next/navigation";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    // Fetch products
    fetch("http://localhost:5000/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
        setLoading(false);
      });

    // Fetch site config
    fetch("http://localhost:5000/api/config/hero")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Error fetching config:", err));
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  let filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  // Search Filter
  const searchQuery = searchParams.get("q");
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.category.toLowerCase().includes(lowerQuery) ||
      (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }

  // Price Filter
  const min = parseInt(minPrice) || 0;
  const max = parseInt(maxPrice) || Infinity;
  filteredProducts = filteredProducts.filter(p => {
    const priceToCompare = p.discountPrice ?? p.price;
    return priceToCompare >= min && priceToCompare <= max;
  });

  // Sorting
  filteredProducts.sort((a, b) => {
    const priceA = a.discountPrice ?? a.price;
    const priceB = b.discountPrice ?? b.price;
    
    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;
    
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-24">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-gray-200 pb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                {config?.shopTitle?.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>) || <><span key="1">Shop</span><br/><span key="2">All.</span></>}
              </h1>
              <p className="text-gray-500 max-w-md">
                {searchQuery 
                  ? `Showing search results for "${searchQuery}"`
                  : (config?.shopDescription || "Browse our complete collection of premium streetwear. Designed for the bold.")}
              </p>
            </div>
            
            {/* Advanced Filters: Category, Sort, Price */}
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between w-full border-b border-gray-200 pb-6 mb-8">
              
              <div className="flex gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide w-full xl:w-auto flex-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    suppressHydrationWarning
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2.5 font-bold uppercase tracking-widest text-xs transition-colors rounded-full border ${
                      activeCategory === cat 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                {/* Sort By Dropdown */}
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-white text-xs font-bold uppercase tracking-widest border border-gray-200 hover:border-black focus:border-black outline-none rounded-full transition-colors cursor-pointer appearance-none"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                {/* Inline Price Filter */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-black transition-colors focus-within:border-black">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Rp</span>
                  <input 
                    type="number" 
                    placeholder="MIN"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-16 sm:w-20 text-xs font-bold text-center bg-transparent outline-none placeholder:text-gray-300"
                  />
                  <span className="text-gray-300">-</span>
                  <input 
                    type="number" 
                    placeholder="MAX"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-16 sm:w-20 text-xs font-bold text-center bg-transparent outline-none placeholder:text-gray-300"
                  />
                </div>
              </div>

            </div>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <ProductSkeleton key={n} />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            <AnimatePresence>
              {filteredProducts.map((product, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={product.id}
                >
                  <FadeIn delay={idx * 0.1}>
                    <ProductCard product={product} />
                  </FadeIn>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-24 text-gray-500">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white pt-24 pb-24 text-center text-gray-500 font-bold uppercase tracking-widest">
        Loading Shop...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
