"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Eye, X, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { useCartStore, Product } from "@/store/cartStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";
import { cleanTitle } from "@/utils/cleanTitle";
import { cleanDescription } from "@/utils/cleanDescription";
import { cleanImageUrl } from "@/utils/cleanImageUrl";

interface LookbookItem {
  id: string;
  title: string;
  code?: string;
  designer: string;
  categoryTag: string;
  image: string;
  fabricUsed: Product;
  fabricNeeded: string;
  furingRecommendation: string;
  description: string;
}

function buildLooksFromProducts(products: any[], config?: any): LookbookItem[] {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  // Filter products that have valid images
  const validProducts = products.filter((p: any) => p && p.image && !p.image.includes("placeholder"));
  const pool = validProducts.length > 0 ? validProducts : products;

  const cardIds = [
    config?.lookbookCard1ProductId,
    config?.lookbookCard2ProductId,
    config?.lookbookCard3ProductId,
    config?.lookbookCard4ProductId,
  ];

  const defaultTags = [
    config?.lookbookCard1Tag || "Kebaya Pengantin",
    config?.lookbookCard2Tag || "Gaun Pesta",
    config?.lookbookCard3Tag || "Seragam Bridesmaid",
    config?.lookbookCard4Tag || "Kebaya Wisuda",
  ];

  const chosenProducts = [0, 1, 2, 3].map((idx) => {
    const specifiedId = cardIds[idx];
    if (specifiedId) {
      const found = pool.find((p: any) => p.id === specifiedId);
      if (found) return found;
    }
    return pool[idx % pool.length];
  });

  return chosenProducts.map((p: any, idx: number) => {
    const { displayTitle, code } = cleanTitle(p.name);
    const categoryName = p.category || "Brukat Premium";
    const productPrice = Number(p.price) || 150000;
    const cleanImg = cleanImageUrl(p.image, "/images/white_lace_hero.png");

    return {
      id: `look-${p.id || idx}`,
      title: code ? `${displayTitle} (${code})` : displayTitle,
      code: code,
      designer: `Koleksi ${categoryName}`,
      categoryTag: defaultTags[idx] || categoryName.toUpperCase(),
      image: cleanImg,
      fabricUsed: {
        id: p.id || `prod-${idx}`,
        name: p.name || displayTitle,
        price: productPrice,
        discountPrice: p.discountPrice,
        category: p.category,
        image: cleanImg,
      },
      fabricNeeded: "2.5 Meter (Satu Set Kebaya & Selendang)",
      furingRecommendation: "Furing Silk Satin Premium 2.0 Meter",
      description: cleanDescription(p.description) || "Kain renda brukat pilihan berkualitas tinggi dengan tekstur halus, adem di kulit, dan motif bordir yang anggun.",
    };
  });
}

interface ShopTheLookProps {
  products?: any[];
  config?: any;
}

export default function ShopTheLook({ products: initialProducts = [], config }: ShopTheLookProps) {
  const [looks, setLooks] = useState<LookbookItem[]>(() =>
    buildLooksFromProducts(initialProducts, config)
  );
  const [selectedLook, setSelectedLook] = useState<LookbookItem | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setLooks(buildLooksFromProducts(initialProducts, config));
      return;
    }

    fetch(`${API_BASE_URL}/api/products?limit=100`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const fetchedProducts = data.products || data;
        if (Array.isArray(fetchedProducts) && fetchedProducts.length > 0) {
          setLooks(buildLooksFromProducts(fetchedProducts, config));
        }
      })
      .catch((err) => console.warn("Could not load lookbook products:", err));
  }, [
    initialProducts,
    config?.lookbookCard1ProductId,
    config?.lookbookCard2ProductId,
    config?.lookbookCard3ProductId,
    config?.lookbookCard4ProductId,
    config?.lookbookCard1Tag,
    config?.lookbookCard2Tag,
    config?.lookbookCard3Tag,
    config?.lookbookCard4Tag,
  ]);

  const handleBuyFabric = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} berhasil ditambahkan ke keranjang!`);
    openCart();
  };

  if (!looks || looks.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white border-b border-stone-200 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Section Header with Luxury Serif Typography */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#b77305] text-xs font-bold uppercase tracking-[0.25em] block mb-3">
            {config?.lookbookBadge || "INSPIRASI BUSANA KEBAYA & GAUN MEWAH"}
          </span>
          <motion.h2
            initial={{ opacity: 0, filter: "blur(14px)", y: 20 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: false, margin: "-60px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-wide text-stone-950 mb-4"
          >
            <span className="block text-stone-800 font-light">{config?.lookbookTitleLine1 || "Galeri Lookbook &"}</span>
            <span className="block text-[#b77305] italic font-serif mt-1">{config?.lookbookTitleLine2 || "Inspirasi Busana Kebaya"}</span>
          </motion.h2>
          <p className="text-stone-600 text-sm md:text-base font-light leading-relaxed">
            {config?.lookbookDesc || "Lihat keanggunan kain asli Raja Brukat. Klik kartu untuk inspirasi lengkap dan pembelian bahan langsung!"}
          </p>
        </div>

        {/* Lookbook 4-Card Grid Using Real Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {looks.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`Lihat Detail ${item.title}`}
              onClick={() => setSelectedLook(item)}
              className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 border border-stone-200/80 flex flex-col justify-between hover:-translate-y-1.5"
            >
              {/* Top Image Container with Real Product Image */}
              <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden">
                <Image
                  src={cleanImageUrl(item.image, "/images/white_lace_hero.png")}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-108 transition-transform duration-700"
                />

                {/* Subtle Image Bottom Fade Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition-opacity" />

                {/* Top Category Tag & Quick View Eye Icon */}
                <div className="relative z-20 p-4 flex items-center justify-between">
                  <span className="px-3 py-1 bg-stone-900/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-md">
                    {item.categoryTag}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-stone-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-[#b77305] hover:border-[#b77305]">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Bottom Card Content Body (Clean White Surface) */}
              <div className="p-5 bg-white flex flex-col justify-between flex-1 space-y-3">
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-stone-950 leading-snug line-clamp-2 group-hover:text-[#b77305] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 font-light line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Footer Real Product Price & CTA Button */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-stone-600 block tracking-wider">
                      Bahan yang Digunakan:
                    </span>
                    <span className="text-sm font-serif font-bold text-[#b77305] truncate block">
                      Rp {item.fabricUsed.price.toLocaleString("id-ID")}/m
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleBuyFabric(item.fabricUsed, e)}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex-shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Beli Bahan</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Consultation CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white border border-[#b77305]/30 rounded-3xl p-8 sm:p-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b77305] to-transparent" />

          <div className="text-left space-y-1.5 max-w-xl">
            <h4 className="text-xl sm:text-2xl font-serif font-medium text-white tracking-wide">
              Ingin Konsultasi Model &amp; Kebutuhan Kain?
            </h4>
            <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
              Konsultasikan gratis rekomendasi jenis bahan &amp; takaran meteran bersama Tim Ahli Raja Brukat via WhatsApp.
            </p>
          </div>

          <Link
            href="/pages/contact"
            className="px-7 py-3.5 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 whitespace-nowrap shadow-xl hover:scale-105 flex items-center gap-2 flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Konsultasi Gratis</span>
          </Link>
        </div>

      </div>

      {/* Lookbook Detail Lightbox Modal */}
      <AnimatePresence>
        {selectedLook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLook(null)}
              className="absolute inset-0 bg-stone-950/70 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden z-10 border border-stone-200"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedLook(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors shadow"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
                {/* Left: High-Res Image Preview */}
                <div className="md:col-span-6 relative aspect-square md:aspect-auto bg-stone-100 min-h-[300px]">
                  <Image
                    src={selectedLook.image}
                    alt={selectedLook.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-4 left-4 bg-[#b77305] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow">
                    {selectedLook.categoryTag}
                  </div>
                </div>

                {/* Right: Lookbook Details */}
                <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#b77305] uppercase tracking-wider block mb-1">
                      {selectedLook.designer}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-stone-950 leading-snug mb-3">
                      {selectedLook.title}
                    </h3>
                    <p className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed mb-4">
                      {selectedLook.description}
                    </p>

                    <div className="space-y-2.5 pt-4 border-t border-stone-100">
                      <div className="flex items-start gap-2 text-xs text-stone-700">
                        <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-stone-950 font-medium">Estimasi Kebutuhan Kain:</strong> {selectedLook.fabricNeeded}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-stone-700">
                        <CheckCircle2 className="w-4 h-4 text-[#b77305] flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-stone-950 font-medium">Rekomendasi Furing:</strong> {selectedLook.furingRecommendation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hotspot Product Buy Area */}
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#e8ded2] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#b77305] tracking-wider block">
                          Bahan Kain Utama:
                        </span>
                        <h4 className="text-sm font-serif font-bold text-stone-950 truncate max-w-[180px]">
                          {selectedLook.fabricUsed.name}
                        </h4>
                      </div>
                      <span className="text-base font-serif font-bold text-[#b77305]">
                        Rp {selectedLook.fabricUsed.price.toLocaleString("id-ID")}/m
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuyFabric(selectedLook.fabricUsed)}
                      className="w-full py-3 bg-gradient-to-r from-[#b77305] via-[#c58c1b] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Beli Bahan Kain Ini</span>
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
