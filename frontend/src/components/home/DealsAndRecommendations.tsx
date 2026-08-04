"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Sparkles, Flame, CheckCircle2 } from "lucide-react";
import { Product, useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

interface DealsProps {
  products?: Product[];
}

// Helper function to guarantee valid image sources and prevent broken/unrelated image icons
const getValidImageSrc = (img?: string, title?: string) => {
  if (img && (img.startsWith("/") || img.startsWith("http"))) {
    // Override dummy red handbag / shoes uploads with real fabric assets
    if (img.includes("bag") || img.includes("shoe") || img.includes("1740") || img.includes("red")) {
      const lowerTitle = (title || "").toLowerCase();
      if (lowerTitle.includes("chantilly")) return "/images/renda_chantilly_french.png";
      if (lowerTitle.includes("cornely")) return "/images/cornely_silk_satin.png";
      return "/images/brukat_tile_mutiara.png";
    }
    return img;
  }
  const lowerTitle = (title || "").toLowerCase();
  if (lowerTitle.includes("chantilly")) return "/images/renda_chantilly_french.png";
  if (lowerTitle.includes("cornely")) return "/images/cornely_silk_satin.png";
  return "/images/brukat_tile_mutiara.png";
};

export default function DealsAndRecommendations({ products = [] }: DealsProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Filter out streetwear dummy items like T-Shirt, Hoodie, White Tee, Tote Bag
  const luxuryProducts = products.filter(
    (p) =>
      p.name &&
      !p.name.toLowerCase().includes("t-shirt") &&
      !p.name.toLowerCase().includes("tee") &&
      !p.name.toLowerCase().includes("hoodie") &&
      !p.name.toLowerCase().includes("tote")
  );

  const dealItem = luxuryProducts[0] || {
    id: "deal-1",
    name: "Brukat Tile Mutiara Royal French 3D",
    price: 320000,
    discountPrice: 224000,
    image: "/images/brukat_tile_mutiara.png",
    category: "Brukat Tile Mutiara",
  };

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
    <section className="py-20 bg-[#FAF7F2] border-y border-[#e8ded2] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Integrated Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-block text-[#b77305] text-xs font-bold uppercase tracking-[0.25em] bg-white border border-[#e8ded2] px-4.5 py-1.5 rounded-full shadow-xs mb-3">
            <span>PROMO SPESIAL TERBATAS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 mb-3">
            Penawaran Tekstil Eksklusif
          </h2>
          <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
            Dapatkan penawaran harga spesial untuk kain brukat pilihan dengan kualitas bordir 3D premium. Promo berlaku selama persediaan masih ada.
          </p>
        </div>

        {/* Seamless 2-Column Showcase Layout */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#e8ded2] relative overflow-hidden group">
          
          {/* Top Gold Highlight Ambient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b77305] via-[#d4af37] to-[#b77305]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Image Showcase with Gold Sticker Badge */}
            <div className="lg:col-span-5 relative aspect-square bg-stone-100 rounded-2xl overflow-hidden shadow-lg group/img border border-stone-200">
              <Image
                src={getValidImageSrc(dealItem.image, dealItem.name)}
                alt={dealItem.name}
                fill
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover group-hover/img:scale-108 transition-transform duration-700"
              />

              {/* Circular Gold Badge Sticker */}
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-gradient-to-br from-[#b77305] via-[#c58c1b] to-[#d4af37] text-white flex flex-col items-center justify-center text-center p-1.5 shadow-2xl transform rotate-12 group-hover/img:rotate-0 transition-transform border-2 border-white/60">
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">RAJA BRUKAT</span>
                <span className="text-base font-serif font-bold leading-none my-0.5">GRADE A</span>
                <span className="text-xs font-bold bg-stone-950/40 px-2 py-0.5 rounded-full">OFF 30%</span>
              </div>
            </div>

            {/* Right Product Details & Timer */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Category & Title */}
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#b77305] bg-[#b77305]/10 px-3.5 py-1 rounded-full mb-3">
                  {dealItem.category || "Koleksi Kebaya 3D Premium"}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-950 leading-snug">
                  {dealItem.name}
                </h3>
              </div>

              {/* Prominent Price Display */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#b77305]">
                  Rp {(dealItem.discountPrice || dealItem.price).toLocaleString("id-ID")}
                </span>
                {dealItem.discountPrice && (
                  <span className="text-lg sm:text-xl text-stone-400 line-through font-serif font-normal">
                    Rp {dealItem.price.toLocaleString("id-ID")}
                  </span>
                )}
              </div>

              {/* Luxury Fabric Value Features */}
              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2.5 text-stone-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0" />
                  <span>Motif bordir rapat dengan taburan payet mutiara timbul 3D</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0" />
                  <span>Serat renda Chantilly & tile ekspor yang sangat halus di kulit</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0" />
                  <span>Stok promo sangat terbatas (Sisa 15 Meter Terakhir)</span>
                </div>
              </div>

              {/* Luxury Countdown Timer Cards */}
              <div className="pt-2">
                <p className="text-xs font-bold text-stone-600 mb-3 uppercase tracking-wider">
                  <span>Promo Berakhir Dalam:</span>
                </p>

                <div className="grid grid-cols-4 gap-3 max-w-md text-center">
                  <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-[#b77305]/40">
                    <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#d4af37]">
                      {timeLeft.days}
                    </span>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                      HARI
                    </span>
                  </div>

                  <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-[#b77305]/40">
                    <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#d4af37]">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                      JAM
                    </span>
                  </div>

                  <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-[#b77305]/40">
                    <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#d4af37]">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                      MENIT
                    </span>
                  </div>

                  <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-[#b77305]/40">
                    <span className="block text-2xl sm:text-3xl font-serif font-bold text-[#d4af37]">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                      DETIK
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => handleAddToCart(dealItem)}
                  className="px-9 py-4 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-full transition-all duration-300 shadow-xl shadow-[#b77305]/25 flex items-center justify-center gap-2.5 hover:scale-[1.03] active:scale-95"
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                  <span>BELI SEKARANG</span>
                </button>

                <Link
                  href="/shop"
                  className="px-8 py-4 border-2 border-[#b77305]/40 hover:border-[#b77305] text-stone-900 hover:text-[#b77305] text-xs sm:text-sm font-bold uppercase tracking-wider rounded-full transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <span>LIHAT DETAIL KAIN</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
