"use client";

import { Product, useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState } from "react";
import { Minus, Plus, Heart } from "lucide-react";
import { toast } from "react-hot-toast";

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product.colors?.[0] || "");
  const { addItem, openCart } = useCartStore();
  
  const isWished = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({ ...product, color });
    }
    const colorInfo = color ? ` (Warna: ${color})` : "";
    toast.success(`${quantity} x ${product.name}${colorInfo} berhasil ditambahkan ke keranjang`);
    openCart();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold uppercase tracking-widest text-sm">Warna</span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {product.colors.map((c) => (
              <button 
                key={c}
                onClick={() => setColor(c)}
                className={`border px-6 py-3 font-medium transition-all ${
                  color === c 
                    ? "border-black bg-black text-white" 
                    : "border-[var(--border)] hover:border-black focus:border-black"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center border border-[var(--border)] h-14">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 h-full hover:bg-[var(--muted)] transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="px-4 font-medium min-w-[3rem] text-center">
            {quantity}
          </span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 h-full hover:bg-[var(--muted)] transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          className="flex-1 bg-black text-white h-14 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Add to Cart
        </button>

        {/* Wishlist Button */}
        <button 
          onClick={() => toggleWishlist(product.id)}
          className="h-14 w-14 border border-black flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <Heart className={`w-6 h-6 ${isWished ? "fill-red-500 text-red-500" : "text-black"}`} />
        </button>
      </div>
    </div>
  );
}
