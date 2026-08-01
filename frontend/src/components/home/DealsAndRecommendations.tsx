"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart, ShoppingBag, ArrowRight } from "lucide-react";
import { Product, useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

interface DealsProps {
  products?: Product[];
}

export default function DealsAndRecommendations({ products = [] }: DealsProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Sample Deals Products if products prop is empty
  const dealItem = products[0] || {
    id: "deal-1",
    name: "Brukat Tile Mutiara Super 3D",
    price: 309800,
    discountPrice: 263350,
    image: "/images/brukat_tile_mutiara.png",
    category: "Brukat Tile Mutiara",
  };

  const recommendedItems = products.length > 1 ? products.slice(1, 5) : [
    {
      id: "rec-1",
      name: "Renda Chantilly Halus French",
      price: 12478,
      image: "/images/renda_chantilly_french.png",
      category: "Renda Chantilly",
    },
    {
      id: "rec-2",
      name: "Cornely Silk Satin Premium",
      price: 432688,
      image: "/images/cornely_silk_satin.png",
      category: "Cornely 3D",
    },
    {
      id: "rec-3",
      name: "Totebag Kain Brukat Special",
      price: 45000,
      image: "/images/brukat_tile_mutiara.png",
      category: "Aksesori",
    },
    {
      id: "rec-4",
      name: "Kain Furing Silk Satin Mandar",
      price: 15008,
      image: "/images/cornely_silk_satin.png",
      category: "Furing Satin",
    },
  ];

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 13,
    minutes: 33,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (item: any) => {
    addItem(item);
    toast.success(`${item.name} berhasil ditambahkan ke keranjang!`);
  };

  return (
    <section className="py-12 bg-stone-100/70 border-y border-stone-200">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN: DEALS OF THE DAY */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 flex flex-col justify-between">
            
            {/* Header Title & Nav Arrows */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div className="relative">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-stone-900">
                  DEALS OF THE DAY
                </h3>
                <div className="absolute -bottom-4 left-0 w-12 h-0.5 bg-[#e53935]" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous Deal"
                  className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:border-stone-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  aria-label="Next Deal"
                  className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:border-stone-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Deal Item Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
              
              {/* Product Image with Promo Sticker */}
              <div className="md:col-span-6 relative aspect-square bg-stone-100 rounded-xl overflow-hidden group">
                <Image
                  src={
                    dealItem.image && !dealItem.image.includes("unsplash") && !dealItem.image.includes("photo-")
                      ? dealItem.image
                      : "/images/brukat_tile_mutiara.png"
                  }
                  alt={dealItem.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Circular Promo Badge Sticker */}
                <div className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#b77305] text-white flex flex-col items-center justify-center text-center p-1 shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-tight">RAJA BRUKAT</span>
                  <span className="text-sm sm:text-base font-black leading-none">GRADE A</span>
                  <span className="text-[10px] font-bold">PROMO 30%</span>
                </div>
              </div>

              {/* Product Details & Countdown */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                  {dealItem.name}
                </h4>

                {/* Pricing */}
                <div className="flex items-baseline gap-3">
                  <span className="text-xl sm:text-2xl font-black text-[#e53935]">
                    Rp {(dealItem.discountPrice || dealItem.price).toLocaleString("id-ID")}
                  </span>
                  {dealItem.discountPrice && (
                    <span className="text-sm text-stone-400 line-through font-medium">
                      Rp {dealItem.price.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                {/* Countdown Timer */}
                <div>
                  <p className="text-xs font-medium text-stone-500 mb-2">
                    Hurry Up! Offer ends in:
                  </p>

                  <div className="grid grid-cols-4 gap-2 max-w-xs text-center">
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-2">
                      <span className="block text-base sm:text-lg font-black text-stone-900">
                        {timeLeft.days}
                      </span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        DAYS
                      </span>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-2">
                      <span className="block text-base sm:text-lg font-black text-stone-900">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        HOURS
                      </span>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-2">
                      <span className="block text-base sm:text-lg font-black text-stone-900">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        MINS
                      </span>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-2">
                      <span className="block text-base sm:text-lg font-black text-stone-900">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        SECS
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Buy Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleAddToCart(dealItem)}
                    className="w-full sm:w-auto px-7 py-3 bg-stone-900 hover:bg-[#b77305] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <span>BELI SEKARANG</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: YOU MAY LIKE */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 flex flex-col justify-between">
            
            {/* Header Title & Nav Arrows */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div className="relative">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-stone-900">
                  YOU MAY LIKE
                </h3>
                <div className="absolute -bottom-4 left-0 w-12 h-0.5 bg-[#e53935]" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous Recommendation"
                  className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:border-stone-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  aria-label="Next Recommendation"
                  className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:border-stone-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recommended Products Vertical List */}
            <div className="space-y-4 my-auto">
              {recommendedItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0 group"
                >
                  {/* Thumbnail & Title/Price */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 h-14 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || "/images/brukat_tile_mutiara.png"}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <div className="min-w-0">
                      <h5 className="font-bold text-xs sm:text-sm text-stone-900 truncate group-hover:text-[#b77305] transition-colors">
                        {item.name}
                      </h5>
                      <p className="text-xs font-bold text-[#e53935] mt-0.5">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Add to Cart Quick Button */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    aria-label={`Add ${item.name} to cart`}
                    className="w-9 h-9 rounded-full bg-stone-100 hover:bg-[#b77305] text-stone-700 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
