"use client";

import { Product, useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState } from "react";
import { Minus, Plus, Heart } from "lucide-react";

interface ProductDetailsClientProps {
  product: Product;
}

import { toast } from "react-hot-toast";

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [color, setColor] = useState(product.colors?.[0] || "");
  const { addItem, openCart } = useCartStore();
  
  const isWished = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const handleAddToCart = () => {
    // Add item N times based on quantity
    // Our store addItem just adds 1 or increments if exists.
    // Let's call it multiple times or just add a feature to pass quantity.
    // For simplicity, since addItem adds 1 and increments, we'll just loop.
    for (let i = 0; i < quantity; i++) {
      addItem({ ...product, size, color });
    }
    toast.success(`${quantity} x ${product.name} (Size: ${size}, Color: ${color}) added to cart`);
    openCart();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Size Selector */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold uppercase tracking-widest text-sm">Size</span>
          <button onClick={() => setIsSizeGuideOpen(true)} className="text-gray-500 text-sm underline hover:text-black">Size Guide</button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {["S", "M", "L", "XL"].map((s) => (
            <button 
              key={s}
              onClick={() => setSize(s)}
              className={`border py-3 font-medium transition-all ${
                size === s 
                  ? "border-black bg-black text-white" 
                  : "border-[var(--border)] hover:border-black focus:border-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold uppercase tracking-widest text-sm">Color</span>
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

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsSizeGuideOpen(false)}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Size Guide</h3>
            <div className="w-full">
              {product.sizeGuide ? (
                <img src={product.sizeGuide} alt="Size Guide" className="w-full object-contain max-h-[70vh]" />
              ) : (
                <div className="bg-gray-50 p-8 text-center border border-gray-200">
                  <p className="font-bold text-lg mb-4 uppercase tracking-widest">General Size Guide</p>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2">Size</th>
                        <th className="py-2">Chest (cm)</th>
                        <th className="py-2">Length (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-bold">S</td>
                        <td className="py-2">50</td>
                        <td className="py-2">70</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-bold">M</td>
                        <td className="py-2">53</td>
                        <td className="py-2">72</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 font-bold">L</td>
                        <td className="py-2">56</td>
                        <td className="py-2">74</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">XL</td>
                        <td className="py-2">59</td>
                        <td className="py-2">76</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 mt-6">*Measurements may vary by 1-2 cm.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
