"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Sparkles, Flame, CheckCircle2 } from "lucide-react";
import { Product, useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

interface DealsProps {
  products?: Product[];
  config?: any;
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

export default function DealsAndRecommendations({ products = [], config: initialConfig }: DealsProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.warn("Error fetching live deals config:", err));
  }, []);

  // Safely parse products array
  const safeProductsList = Array.isArray(products)
    ? products
    : products && Array.isArray((products as any).products)
    ? (products as any).products
    : [];

  // Filter out streetwear dummy items like T-Shirt, Hoodie, White Tee, Tote Bag
  const luxuryProducts = safeProductsList.filter(
    (p: any) =>
      p &&
      p.name &&
      !p.name.toLowerCase().includes("t-shirt") &&
      !p.name.toLowerCase().includes("tee") &&
      !p.name.toLowerCase().includes("hoodie") &&
      !p.name.toLowerCase().includes("tote")
  );

  const [customSelectedProduct, setCustomSelectedProduct] = useState<any>(null);

  useEffect(() => {
    if (!config?.dealsProductId) {
      setCustomSelectedProduct(null);
      return;
    }

    const found = safeProductsList.find((p: any) => p && p.id === config.dealsProductId);
    if (found) {
      setCustomSelectedProduct(found);
    } else {
      fetch(`${API_BASE_URL}/api/products/${config.dealsProductId}`)
        .then((res) => {
          const contentType = res.headers.get("content-type") || "";
          if (!res.ok || !contentType.includes("application/json")) return null;
          return res.json();
        })
        .then((data) => {
          const prod = data?.product || data;
          if (prod && prod.id) {
            setCustomSelectedProduct(prod);
          }
        })
        .catch((err) => console.warn("Error fetching custom deal product:", err));
    }
  }, [config?.dealsProductId, safeProductsList]);

  const dealItem = customSelectedProduct || (config?.dealsProductId ? luxuryProducts.find((p: any) => p.id === config.dealsProductId) : null) || luxuryProducts[0] || {
    id: "deal-1",
    name: "Brukat Tile Mutiara Royal French 3D",
    price: 320000,
    discountPrice: 224000,
    image: "/images/brukat_tile_mutiara.png",
    category: "Brukat Tile Mutiara",
  };

  const rawPrice = typeof dealItem.price === "number" ? dealItem.price : Number(dealItem.price) || 0;
  const rawDiscount = config?.dealsDiscountPrice
    ? Number(config.dealsDiscountPrice)
    : typeof dealItem.discountPrice === "number"
    ? dealItem.discountPrice
    : dealItem.discountPrice
    ? Number(dealItem.discountPrice)
    : null;
  const activeDiscountPrice = rawDiscount && !isNaN(rawDiscount) && rawDiscount > 0 ? rawDiscount : null;
  const mainPriceToDisplay = activeDiscountPrice || rawPrice;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      if (config?.dealsEndsAt && typeof config.dealsEndsAt === "string" && config.dealsEndsAt.trim() !== "") {
        const cleanStr = config.dealsEndsAt.trim().replace(" ", "T");
        const target = new Date(cleanStr).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (!isNaN(target) && diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft({ days, hours, minutes, seconds });
          return;
        }
      }

      // Default fallback timer if no target set
      setTimeLeft({ days: 0, hours: 13, minutes: 33, seconds: 18 });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [config?.dealsEndsAt]);

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
            <span>{config?.dealsBadge || "PROMO SPESIAL TERBATAS"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 mb-3">
            {config?.dealsTitle || "Penawaran Tekstil Eksklusif"}
          </h2>
          <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed whitespace-pre-line">
            {config?.dealsDescription || "Dapatkan penawaran harga spesial untuk kain brukat pilihan dengan kualitas bordir 3D premium. Promo berlaku selama persediaan masih ada."}
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
                  Rp {(mainPriceToDisplay || 0).toLocaleString("id-ID")}
                </span>
                {activeDiscountPrice && activeDiscountPrice < rawPrice && (
                  <span className="text-lg sm:text-xl text-stone-400 line-through font-serif font-normal">
                    Rp {rawPrice.toLocaleString("id-ID")}
                  </span>
                )}
              </div>

              {/* Luxury Fabric Value Features */}
              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2.5 text-stone-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0" />
                  <span>{config?.dealsPoint1 || "Motif bordir rapat dengan taburan payet mutiara timbul 3D"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0" />
                  <span>{config?.dealsPoint2 || "Serat renda Chantilly & tile ekspor yang sangat halus di kulit"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-700 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0" />
                  <span>{config?.dealsPoint3 || "Stok promo sangat terbatas (Sisa 15 Meter Terakhir)"}</span>
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
                  href={dealItem.id.startsWith("deal-") ? "/shop" : `/products/${dealItem.id}`}
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
