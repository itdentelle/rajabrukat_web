"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, FadeIn } from "@/components/ui/Reveal";
import ProductSkeleton from "@/components/ui/ProductSkeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Format the slug (e.g., "new-arrivals" -> "New Arrivals", "t-shirt" -> "T-Shirt")
  const formatCategoryName = (slug: string) => {
    return slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const categoryName = formatCategoryName(categorySlug);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((resData: any) => {
        const data: Product[] = resData.products || resData;
        // Filter products based on category
        // Special case for "New Arrivals", we just show everything or latest items for demo
        let filtered = data;
        if (categorySlug !== "new-arrivals") {
          filtered = data.filter((p) => 
            p.category.toLowerCase() === categoryName.toLowerCase()
          );
        }
        setProducts(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
        setLoading(false);
      });
  }, [categorySlug, categoryName]);

  return (
    <div className="min-h-screen bg-white text-black pt-24 pb-24">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="mb-8">
            <Link href="/collections" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Collections
            </Link>
          </div>
          
          <div className="border-b border-gray-200 pb-8 mb-16">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
              {categoryName}
            </h1>
            <p className="text-gray-500 max-w-md">
              {categorySlug === "new-arrivals" 
                ? "Discover the latest drops and most recent additions to our catalog."
                : `Browse our curated selection of premium ${categoryName.toLowerCase()}.`}
            </p>
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
              {products.map((product, idx) => (
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

        {products.length === 0 && !loading && (
          <div className="text-center py-24 text-gray-500 border border-dashed border-gray-200">
            <p className="text-lg font-bold uppercase tracking-widest mb-2 text-black">Sold Out / Coming Soon</p>
            <p>We currently have no {categoryName.toLowerCase()} in stock.</p>
          </div>
        )}
      </div>
    </div>
  );
}
