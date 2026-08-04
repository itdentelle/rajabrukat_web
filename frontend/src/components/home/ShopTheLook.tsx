"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Eye, Sparkles, X, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { useCartStore, Product } from "@/store/cartStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface LookbookItem {
  id: string;
  title: string;
  designer: string;
  categoryTag: string;
  image: string;
  fabricUsed: Product;
  fabricNeeded: string;
  furingRecommendation: string;
  description: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
  {
    id: "look-1",
    title: "Kebaya Pengantin Royal Mutiara 3D",
    designer: "Desain Kebaya Pengantin",
    categoryTag: "Kebaya Pengantin",
    image: "/images/brukat_tile_mutiara.png",
    fabricUsed: {
      id: "p1",
      name: "Brukat Tile Mutiara Royal French Grade A",
      price: 185000,
      category: "Grade A",
      image: "/images/brukat_tile_mutiara.png",
    },
    fabricNeeded: "3.5 Meter (Satu Set Kebaya & Selendang)",
    furingRecommendation: "Silk Satin Furing Cream 2.5 Meter",
    description:
      "Perpaduan anggun motif bordir tile timbul 3D dengan kristal mutiara bercahaya. Sangat cocok untuk momen akad & resepsi pengantin mewah.",
  },
  {
    id: "look-2",
    title: "Gaun Pesta Renda Chantilly French",
    designer: "Dress Pesta Modern",
    categoryTag: "Gaun Pesta",
    image: "/images/renda_chantilly_french.png",
    fabricUsed: {
      id: "p3",
      name: "Renda Chantilly Halus French Grade B",
      price: 125000,
      category: "Grade B",
      image: "/images/renda_chantilly_french.png",
    },
    fabricNeeded: "2.5 Meter (Gaun Pesta A-Line)",
    furingRecommendation: "Furing Satin Silk Nude 2.5 Meter",
    description: "Serat renda Chantilly impor Prancis yang super lembut, tidak gatal, dan memberikan siluet jatuh yang sangat menawan.",
  },
  {
    id: "look-3",
    title: "Seragam Kebaya Bridesmaid Cornely 3D",
    designer: "Seragam Keluarga & Bridesmaid",
    categoryTag: "Seragam Bridesmaid",
    image: "/images/cornely_silk_satin.png",
    fabricUsed: {
      id: "p5",
      name: "Cornely 3D Silk Satin Furing Tulle",
      price: 245000,
      category: "Tulle",
      image: "/images/cornely_silk_satin.png",
    },
    fabricNeeded: "2.0 Meter per Orang",
    furingRecommendation: "Silk Satin Rose Gold 2.0 Meter",
    description: "Pilihan utama seragam kebaya bridesmaid dengan motif cornely timbul yang serasi untuk momen foto bersama.",
  },
  {
    id: "look-4",
    title: "Kebaya Wisuda & Semi Formal Elegant",
    designer: "Kebaya Wisuda Modern",
    categoryTag: "Kebaya Wisuda",
    image: "/images/brand-model.png",
    fabricUsed: {
      id: "p2",
      name: "Brukat Tile Mutiara Luxury Gold Grade A",
      price: 195000,
      category: "Grade A",
      image: "/images/brukat_tile_mutiara.png",
    },
    fabricNeeded: "2.0 Meter",
    furingRecommendation: "Furing Cotton Satin 2.0 Meter",
    description: "Desain kebaya kartini modern bernuansa emas mewah yang ringan dan nyaman digunakan sepanjang hari acara wisuda.",
  },
];

export default function ShopTheLook() {
  const [selectedLook, setSelectedLook] = useState<LookbookItem | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const handleBuyFabric = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} berhasil ditambahkan ke keranjang!`);
    openCart();
  };

  return (
    <section className="py-24 bg-white border-b border-stone-200 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Section Header with Luxury Serif Typography */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#b77305] text-xs font-bold uppercase tracking-[0.25em] block mb-3">
            INSPIRASI BUSANA KEBAYA & GAUN MEWAH
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium tracking-wide text-stone-950 mb-4">
            <span className="block text-stone-800 font-light">Galeri Lookbook &</span>
            <span className="block text-[#b77305] italic font-serif mt-1">Inspirasi Busana Kebaya</span>
          </h2>
          <p className="text-stone-600 text-sm md:text-base font-light leading-relaxed">
            Lihat keanggunan hasil rancangan busana karya desainer & pelanggan Raja Brukat. Klik kartu untuk inspirasi lengkap dan pembelian bahan langsung!
          </p>
        </div>

        {/* Lookbook 4-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {LOOKBOOK_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedLook(item)}
              className="group relative bg-stone-950 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-stone-200 aspect-[3/4] flex flex-col justify-between"
            >
              {/* Image Background with Hover Zoom */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-108 transition-transform duration-700 opacity-90 group-hover:opacity-100"
              />

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent z-10 opacity-90 group-hover:opacity-80 transition-opacity" />

              {/* Top Tag & Quick View Pill */}
              <div className="relative z-20 p-5 flex items-center justify-between">
                <span className="px-3.5 py-1 bg-white/95 backdrop-blur-md text-stone-900 text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                  {item.categoryTag}
                </span>

                <div className="w-9 h-9 rounded-full bg-stone-900/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Eye className="w-4 h-4 text-[#d4af37]" />
                </div>
              </div>

              {/* Bottom Card Content & Hotspot Product Banner */}
              <div className="relative z-20 p-6 space-y-3">
                <h3 className="text-xl font-serif font-medium text-white leading-snug group-hover:text-[#d4af37] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-300 font-light line-clamp-2">
                  {item.description}
                </p>

                {/* Hotspot Fabric Badge Box */}
                <div className="pt-3 border-t border-white/20 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#d4af37] block tracking-wider">
                      Bahan yang Digunakan:
                    </span>
                    <span className="text-sm font-serif font-bold text-white truncate block">
                      Rp {item.fabricUsed.price.toLocaleString("id-ID")}/m
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleBuyFabric(item.fabricUsed, e)}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#b77305] to-[#d4af37] hover:from-[#965e04] hover:to-[#b77305] text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-lg hover:scale-105 active:scale-95 flex-shrink-0"
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
        <div className="mt-16 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white border border-[#b77305]/30 rounded-3xl p-8 sm:p-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          {/* Top Gold Highlight Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b77305] to-transparent" />

          <div className="text-left space-y-1">
            <h4 className="text-xl sm:text-2xl font-serif font-medium text-white tracking-wide">
              Ingin Konsultasi Model & Kebutuhan Kain?
            </h4>
            <p className="text-stone-300 text-xs sm:text-sm font-light">
              Konsultasikan gratis rekomendasi jenis bahan & takaran meteran bersama Tim Ahli Raja Brukat via WhatsApp.
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
