"use client";

import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[var(--background)] shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Cart</h2>
          <button 
            onClick={closeCart}
            aria-label="Close Cart"
            className="p-2 hover:bg-[var(--muted)] rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Your cart is empty.</p>
              <button 
                onClick={closeCart}
                className="mt-6 border-2 border-black px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-4 border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
                  {/* Image */}
                  <div className="w-24 h-32 relative bg-gray-100 flex-shrink-0">
                    <Image 
                      src={item.image || "/placeholder.jpg"} 
                      alt={item.name} 
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide leading-tight mb-1">
                        {item.name}
                      </h3>
                      <p className="text-gray-500 text-xs mb-2">
                        {item.category} 
                        {item.size && <span className="font-bold text-black ml-1">| Size: {item.size}</span>}
                        {item.color && <span className="font-bold text-black ml-1">| Color: {item.color}</span>}
                      </p>
                      {item.discountPrice ? (
                        <div className="flex gap-2 items-center">
                          <p className="font-medium text-sm text-red-600">{formatPrice(item.discountPrice)}</p>
                          <p className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</p>
                        </div>
                      ) : (
                        <p className="font-medium text-sm">{formatPrice(item.price)}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Control */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center border border-[var(--border)]">
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            aria-label="Decrease Quantity"
                            className="px-3 py-1 hover:bg-[var(--muted)] transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => {
                              if (item.stock !== undefined && item.quantity >= item.stock) {
                                toast(`Mencapai batas stok tersedia (${item.stock} pcs)`, { icon: "⚠️" });
                                return;
                              }
                              updateQuantity(item.cartItemId, item.quantity + 1);
                            }}
                            disabled={item.stock !== undefined && item.quantity >= item.stock}
                            aria-label="Increase Quantity"
                            className="px-3 py-1 hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        {item.stock !== undefined && item.quantity >= item.stock && (
                          <span className="text-[10px] text-amber-600 font-bold">Max stok ({item.stock} pcs)</span>
                        )}
                      </div>

                      {/* Remove */}
                      <button 
                        onClick={() => {
                          removeItem(item.cartItemId);
                          toast(`${item.name} dihapus`, { icon: '🗑️' });
                        }}
                        aria-label="Remove Item"
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center justify-between mb-6">
              <span className="font-medium text-gray-500">Subtotal</span>
              <span className="text-xl font-bold">{formatPrice(totalPrice())}</span>
            </div>
            <p className="text-xs text-gray-500 mb-6 text-center">
              Shipping & taxes calculated at checkout
            </p>
            <button
              onClick={() => {
                closeCart();
                const token = localStorage.getItem("token");
                if (!token) {
                  toast("Silakan daftar atau login terlebih dahulu", { icon: "⚠️" });
                  router.push("/register");
                } else {
                  router.push("/checkout");
                }
              }}
              className="w-full py-4 bg-black text-white font-bold tracking-widest text-sm hover:bg-gray-800 transition-colors uppercase flex justify-center items-center"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Simple Shopping Cart SVG for empty state
function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
