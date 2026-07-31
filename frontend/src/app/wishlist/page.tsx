"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "@/components/products/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const { items, isLoading, fetchWishlist } = useWishlistStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <div className="min-h-[70vh] bg-white text-black pt-24 pb-24">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="mb-12 border-b border-gray-200 pb-8">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Your Wishlist
            </h1>
            <p className="text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </Reveal>

        {isLoading ? (
          <div className="text-center py-24 text-gray-500">Loading your wishlist...</div>
        ) : items.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            <AnimatePresence>
              {items.map((product) => (
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
            <HeartEmpty />
            <h2 className="text-2xl font-bold uppercase mb-4 mt-8">Your Wishlist is Empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't saved any items yet. Start exploring our collections and save your favorite pieces.
            </p>
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function HeartEmpty() {
  return (
    <div className="flex justify-center">
      <svg 
        width="64" 
        height="64" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-gray-300"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </div>
  );
}
