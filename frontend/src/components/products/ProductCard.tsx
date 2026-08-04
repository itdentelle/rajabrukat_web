"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, Product } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { ShoppingBag, Heart } from "lucide-react";
import { toast } from "react-hot-toast";

// Helper function to guarantee 100% authentic fabric images and fix broken/unrelated dummy images
const getFabricImageSrc = (img?: string, title?: string, category?: string) => {
  if (img && (img.startsWith("/") || img.startsWith("http"))) {
    // If image URL is a dummy furniture sofa, casual dress, or broken upload
    if (
      img.includes("bag") ||
      img.includes("shoe") ||
      img.includes("1740") ||
      img.includes("red") ||
      img.includes("sofa") ||
      img.includes("interior") ||
      img.includes("furniture") ||
      img.includes("photo-")
    ) {
      const lower = (title || "" + " " + (category || "")).toLowerCase();
      if (lower.includes("chantilly")) return "/images/renda_chantilly_french.png";
      if (lower.includes("cornely")) return "/images/cornely_silk_satin.png";
      if (lower.includes("satin") || lower.includes("furing"))
        return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop";
      return "/images/brukat_tile_mutiara.png";
    }
    return img;
  }
  const lower = (title || "" + " " + (category || "")).toLowerCase();
  if (lower.includes("chantilly")) return "/images/renda_chantilly_french.png";
  if (lower.includes("cornely")) return "/images/cornely_silk_satin.png";
  if (lower.includes("satin") || lower.includes("furing"))
    return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop";
  return "/images/brukat_tile_mutiara.png";
};

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const isWished = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const imageSrc = getFabricImageSrc(product.image, product.name, product.category);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} berhasil ditambahkan ke keranjang!`);
    openCart();
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden border-b border-stone-100">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-108"
        />

        {/* Floating Wishlist Button */}
        <button
          onClick={handleWishlist}
          aria-label={isWished ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all z-10 hover:scale-110"
        >
          <Heart className={`w-4 h-4 ${isWished ? "fill-red-500 text-red-500" : "text-stone-700"}`} />
        </button>

        {/* Discount or Quality Badge */}
        {product.discountPrice ? (
          <div className="absolute top-3 right-3 bg-[#b77305] text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md z-10">
            OFF {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-stone-950/80 text-white px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase shadow-md z-10 backdrop-blur-xs">
            {product.category || "GRADE A"}
          </div>
        )}

        {/* Quick Add Overlay on Hover */}
        <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
          <button
            onClick={handleQuickAdd}
            className="w-full py-2.5 bg-gradient-to-r from-[#b77305] to-[#d4af37] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all transform translate-y-2 group-hover:translate-y-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tambah Ke Keranjang</span>
          </button>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 space-y-2">
        <span className="text-[10px] font-bold text-[#b77305] uppercase tracking-wider block">
          {product.category || "Brukat Tile 3D"}
        </span>

        <h3 className="font-serif font-bold text-base text-stone-950 group-hover:text-[#b77305] transition-colors leading-snug line-clamp-1">
          {product.name}
        </h3>

        {/* Pricing Display */}
        <div className="flex items-baseline gap-2 pt-1">
          {product.discountPrice ? (
            <>
              <span className="font-serif font-bold text-base text-[#b77305]">
                Rp {product.discountPrice.toLocaleString("id-ID")}<span className="text-xs font-normal text-stone-500">/m</span>
              </span>
              <span className="text-xs text-stone-400 line-through font-serif">
                Rp {product.price.toLocaleString("id-ID")}
              </span>
            </>
          ) : (
            <span className="font-serif font-bold text-base text-stone-950">
              Rp {product.price.toLocaleString("id-ID")}<span className="text-xs font-normal text-stone-500">/m</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
