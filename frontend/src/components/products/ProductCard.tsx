"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, Product } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { ShoppingBag, Heart, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

// Helper function to guarantee 100% authentic fabric images
const getFabricImageSrc = (img?: string, title?: string, category?: string) => {
  if (img && (img.startsWith("/") || img.startsWith("http"))) {
    if (
      img.includes("bag") ||
      img.includes("shoe") ||
      img.includes("1740") ||
      img.includes("red") ||
      img.includes("sofa") ||
      img.includes("interior") ||
      img.includes("furniture") ||
      img.includes("1528459801416")
    ) {
      const lower = ((title || "") + " " + (category || "")).toLowerCase();
      if (lower.includes("chantilly")) return "/images/renda_chantilly_french.png";
      if (lower.includes("cornely")) return "/images/cornely_silk_satin.png";
      if (lower.includes("satin") || lower.includes("furing"))
        return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop";
      return "/images/brukat_tile_mutiara.png";
    }
    return img;
  }

  const lower = ((title || "") + " " + (category || "")).toLowerCase();
  if (lower.includes("chantilly")) return "/images/renda_chantilly_french.png";
  if (lower.includes("cornely")) return "/images/cornely_silk_satin.png";
  if (lower.includes("satin") || lower.includes("furing"))
    return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop";
  return "/images/brukat_tile_mutiara.png";
};

import { cleanTitle } from "@/utils/cleanTitle";
export { cleanTitle };

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const isWished = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const imageSrc = getFabricImageSrc(product.image, product.name, product.category);
  const { displayTitle, code } = cleanTitle(product.name);

  const stock = product.stock !== undefined ? product.stock : 100;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error(`Maaf, stok ${displayTitle} sedang habis.`);
      return;
    }
    addItem(product);
    toast.success(`${displayTitle} berhasil ditambahkan ke keranjang!`);
    openCart();
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id);
  };

  // Determine category badge label
  const gradeLabel = product.category || "GRADE A";

  const handleCardClick = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("catalog_scroll_pos", window.scrollY.toString());
      sessionStorage.setItem("catalog_scroll_url", window.location.href);
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      onClick={handleCardClick}
      className={`group block bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
        isOutOfStock ? "opacity-90" : ""
      }`}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden border-b border-stone-100">
        <Image
          src={imageSrc}
          alt={displayTitle}
          fill
          unoptimized={imageSrc.includes("supabase.co")}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className={`object-cover object-center transition-transform duration-700 group-hover:scale-105 ${
            isOutOfStock ? "grayscale-[30%]" : ""
          }`}
        />

        {/* Top Badges & Actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label={isWished ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
            className="pointer-events-auto w-11 h-11 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-all hover:scale-110"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? "fill-red-500 text-red-500" : "text-stone-700"}`} />
          </button>

          {/* Stock & Sale Badges */}
          <div className="flex flex-col items-end gap-1">
            {isOutOfStock ? (
              <div className="bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                Stok Habis
              </div>
            ) : isLowStock ? (
              <div className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-md animate-pulse">
                Sisa {stock} pcs!
              </div>
            ) : product.discountPrice ? (
              <div className="bg-[#b77305] text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md backdrop-blur-xs">
                OFF {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
              </div>
            ) : (
              <div className="bg-stone-900/80 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md backdrop-blur-xs">
                {gradeLabel}
              </div>
            )}
          </div>
        </div>

        {/* Subtle Bottom Shadow Gradient for Hover Button */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick Add Overlay Button on Hover */}
        <div className="absolute inset-x-3 bottom-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`w-full py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
              isOutOfStock 
                ? "bg-stone-400 cursor-not-allowed" 
                : "bg-stone-950 hover:bg-[#b77305]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isOutOfStock ? "Stok Habis" : "Tambah Ke Keranjang"}</span>
          </button>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 space-y-1.5">
        {/* Category & Code Subtitle */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#965e04] uppercase tracking-wider">
          <span>{gradeLabel}</span>
          {(product.code || code) && (
            <>
              <span className="text-stone-400">•</span>
              <span className="text-stone-600 font-medium font-mono">{product.code || code}</span>
            </>
          )}
        </div>

        {/* Cleaned Product Title */}
        <h3 className="font-sans font-bold text-sm md:text-base text-stone-900 group-hover:text-[#b77305] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
          {displayTitle}
        </h3>

        {/* Pricing Display & Stock info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            {product.discountPrice ? (
              <>
                <span className="font-sans font-bold text-base text-[#965e04]">
                  Rp {product.discountPrice.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-stone-500 line-through font-sans">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
              </>
            ) : (
              <span className="font-sans font-bold text-base text-stone-900">
                Rp {product.price.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          <span className={`text-[11px] font-bold ${
            isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-600"
          }`}>
            {isOutOfStock ? "Stok Habis" : `Stok: ${stock} pcs`}
          </span>
        </div>
      </div>
    </Link>
  );
}
