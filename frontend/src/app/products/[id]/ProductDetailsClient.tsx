"use client";

import { Product, useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState } from "react";
import { Minus, Plus, Heart } from "lucide-react";
import { toast } from "react-hot-toast";

interface ProductDetailsClientProps {
  product: Product;
  onSelectColorImage?: (imgUrl: string) => void;
}

export default function ProductDetailsClient({ product, onSelectColorImage }: ProductDetailsClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product.colors?.[0] || "");
  const { addItem, openCart } = useCartStore();
  
  const isWished = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  // Per-color stock & image resolution
  const colorStocks: Record<string, number> | null = 
    product.colorStocks && typeof product.colorStocks === "object" 
      ? (product.colorStocks as Record<string, number>) 
      : null;

  const colorImages: Record<string, string> | null =
    product.colorImages && typeof product.colorImages === "object"
      ? (product.colorImages as Record<string, string>)
      : null;

  const getStockForColor = (colorName: string): number => {
    if (colorStocks && colorStocks[colorName] !== undefined) {
      return Number(colorStocks[colorName]);
    }
    return product.stock !== undefined ? product.stock : 100;
  };

  const handleSelectColor = (selectedColorName: string) => {
    setColor(selectedColorName);
    setQuantity(1);
    const colorImg = colorImages?.[selectedColorName];
    if (colorImg && onSelectColorImage) {
      onSelectColorImage(colorImg);
    }
  };

  const activeStock = color ? getStockForColor(color) : (product.stock !== undefined ? product.stock : 100);
  const isOutOfStock = activeStock <= 0;
  const isLowStock = activeStock > 0 && activeStock <= 10;

  const handleIncreaseQty = () => {
    if (quantity >= activeStock) {
      toast(`Mencapai batas stok ${color ? `warna ${color}` : ''} yang tersedia (${activeStock} pcs)`, { icon: "⚠️" });
      return;
    }
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQty = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`Maaf, stok warna ${color || 'produk'} sedang habis.`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem({ ...product, color });
    }
    const colorInfo = color ? ` (Warna: ${color})` : "";
    toast.success(`${quantity} pcs ${product.name}${colorInfo} berhasil ditambahkan ke keranjang`);
    openCart();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold uppercase tracking-widest text-sm">Pilih Warna Varian</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {product.colors.map((c) => {
              const cStock = getStockForColor(c);
              const cIsOut = cStock <= 0;
              const cImg = colorImages?.[c];

              return (
                <button 
                  key={c}
                  onClick={() => handleSelectColor(c)}
                  className={`relative border px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2.5 ${
                    color === c 
                      ? "border-black bg-black text-white shadow-md scale-[1.02]" 
                      : cIsOut 
                      ? "border-rose-200 bg-rose-50/60 text-stone-400 hover:border-rose-400"
                      : "border-stone-200 bg-stone-50 hover:border-stone-400 text-stone-900"
                  }`}
                >
                  {/* Mini Color Image Thumbnail */}
                  {cImg ? (
                    <img 
                      src={cImg} 
                      alt={c} 
                      className={`w-6 h-6 rounded-lg object-cover border flex-shrink-0 ${
                        color === c ? "border-white/50" : "border-stone-300"
                      }`} 
                    />
                  ) : null}
                  <span>{c}</span>
                  {cIsOut ? (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${color === c ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700"}`}>
                      Habis
                    </span>
                  ) : cStock <= 10 ? (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${color === c ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-800"}`}>
                      Sisa {cStock} pcs
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shopee / Tokopedia Style Quantity Section */}
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-stone-600 min-w-[70px]">Kuantitas</span>
        
        <div className="flex items-center gap-4">
          {/* Stepper Box */}
          <div className={`flex items-center border border-stone-300 rounded-lg overflow-hidden h-10 shadow-2xs ${isOutOfStock ? "opacity-40 pointer-events-none" : ""}`}>
            <button 
              onClick={handleDecreaseQty}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-9 h-full flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-30 border-r border-stone-200 text-stone-600"
              title="Kurangi Kuantitas"
            >
              <Minus size={14} />
            </button>

            <input 
              type="number"
              min="1"
              max={activeStock}
              value={isOutOfStock ? 0 : quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                if (val > activeStock) setQuantity(activeStock);
                else setQuantity(Math.max(1, val));
              }}
              className="w-12 h-full text-center font-bold text-sm text-stone-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button 
              onClick={handleIncreaseQty}
              disabled={quantity >= activeStock || isOutOfStock}
              className="w-9 h-full flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-30 border-l border-stone-200 text-stone-600"
              title="Tambah Kuantitas"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Inline Stock Availability Text */}
          <span className="text-sm font-medium text-stone-500">
            {isOutOfStock ? (
              <span className="text-rose-600 font-bold">Stok Habis</span>
            ) : (
              <>Tersedia <strong className="text-stone-900">{activeStock}</strong> pcs</>
            )}
          </span>
        </div>
      </div>

      {/* Add to Cart & Wishlist Buttons */}
      <div className="flex gap-4 pt-2">
        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 h-14 rounded-xl font-bold uppercase tracking-widest transition-all shadow-md ${
            isOutOfStock 
              ? "bg-stone-400 text-white cursor-not-allowed" 
              : "bg-black text-white hover:bg-[#b77305] active:scale-98"
          }`}
        >
          {isOutOfStock ? `Stok Warna ${color} Habis` : "Add to Cart"}
        </button>

        <button 
          onClick={() => toggleWishlist(product.id)}
          className="h-14 w-14 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors flex-shrink-0"
        >
          <Heart className={`w-6 h-6 ${isWished ? "fill-red-500 text-red-500" : "text-black"}`} />
        </button>
      </div>
    </div>
  );
}
