"use client";

import Link from "next/link";
import { useCartStore, Product } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";

import { toast } from "react-hot-toast";

import Image from "next/image";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  
  const isWished = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link click
    addItem(product);
    toast.success(`${product.name} added to cart`);
    openCart();
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id);
  };

  return (
    <Link href={`/products/${product.id}`} className="group block active:scale-[0.98] active:opacity-90 transition-all duration-200">
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden rounded-sm mb-4">
        <Image 
          src={product.image || "/placeholder.jpg"} 
          alt={product.name} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <button 
            onClick={handleQuickAdd}
            className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black hover:text-white"
          >
            <ShoppingBag className="w-4 h-4" /> Quick Add
          </button>
        </div>
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          aria-label={isWished ? "Remove from Wishlist" : "Add to Wishlist"}
          className="absolute top-2 left-2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white z-10"
        >
          <Heart className={`w-5 h-5 ${isWished ? "fill-red-500 text-red-500" : "text-black"}`} />
        </button>

        {product.discountPrice && (
          <div className="absolute top-2 right-2 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10">
            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <h3 className="font-bold uppercase tracking-wide text-sm group-hover:text-gray-600 transition-colors">{product.name}</h3>
        <p className="text-gray-500 text-xs mt-1 mb-2 capitalize">{product.category}</p>
        {product.discountPrice ? (
          <div className="flex items-center gap-2">
            <p className="font-medium text-red-600">Rp {product.discountPrice.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-400 line-through">Rp {product.price.toLocaleString("id-ID")}</p>
          </div>
        ) : (
          <p className="font-medium">Rp {product.price.toLocaleString("id-ID")}</p>
        )}
      </div>
    </Link>
  );
}
