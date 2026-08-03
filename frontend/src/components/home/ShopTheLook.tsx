"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Eye, Sparkles, X, ArrowRight, Check, Tag } from "lucide-react";
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
    image: "/images/brukat_tile_mutiara.png",
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
    <section className="py-20 bg-white border-b border-stone-200 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[#b77305] text-xs font-bold uppercase tracking-widest block mb-2">
            INSPIRASI BUSANA KEBAYA & GAUN
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-stone-900 mb-4">
            GALERI LOOKBOOK & INSPIRASI MOTIF
          </h2>
          <p className="text-stone-600 text-sm md:text-base font-normal leading-relaxed">
            Lihat keanggunan hasil busana karya desainer & pelanggan yang menggunakan kain brukat pilihan Raja Brukat. Klik gambar untuk beli bahannya langsung!
          </p>
        </div>

        {/* Lookbook 4-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LOOKBOOK_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedLook(item)}
              className="group relative bg-stone-900 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 border border-stone-200 aspect-[3/4] flex flex-col justify-between"
            >
              {/* Image Background with Hover Zoom */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
              />

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent z-10 opacity-90 group-hover:opacity-80 transition-opacity" />

              {/* Top Tag & Quick View Pill */}
              <div className="relative z-20 p-5 flex items-center justify-between">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-stone-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow">
                  {item.categoryTag}
                </span>

                <div className="w-8 h-8 rounded-full bg-stone-900/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                  <Eye className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Bottom Card Content & Hotspot Product Banner */}
              <div className="relative z-20 p-6 space-y-3">
                <h3 className="text-lg font-bold text-white leading-snug group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-300 font-medium line-clamp-2">
                  {item.description}
                </p>

                {/* Hotspot Fabric Badge Box */}
                <div className="pt-2 border-t border-white/20 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-amber-300 block tracking-wider">
                      Bahan yang Digunakan:
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      Rp {item.fabricUsed.price.toLocaleString("id-ID")}/m
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleBuyFabric(item.fabricUsed, e)}
                    className="px-3.5 py-2 bg-[#b77305] hover:bg-[#965e04] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg hover:scale-105 active:scale-95 flex-shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Beli Bahan</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 text-center bg-stone-50 border border-stone-200 rounded-3xl p-8 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="text-left">
            <h4 className="text-base font-bold text-stone-900 uppercase tracking-tight mb-1">
              Punya Model Kebaya / Gaun Sendiri?
            </h4>
            <p className="text-stone-500 text-xs font-normal">
              Konsultasikan rekomendasi jenis kain & kebutuhan meteran bersama Tim Ahli Raja Brukat via WhatsApp.
            </p>
          </div>

          <Link
            href="/pages/contact"
            className="px-6 py-3 bg-stone-900 hover:bg-[#b77305] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 whitespace-nowrap shadow-md flex items-center gap-2"
          >
            <span>Konsultasi Gratis</span>
            <ArrowRight className="w-4 h-4" />
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
                  <div className="absolute top-4 left-4 bg-[#b77305] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                    {selectedLook.categoryTag}
                  </div>
                </div>

                {/* Right: Look Details & Direct Purchase */}
                <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#b77305] uppercase tracking-wider block mb-1">
                        {selectedLook.designer}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
                        {selectedLook.title}
                      </h3>
                    </div>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-normal">
                      {selectedLook.description}
                    </p>

                    {/* Tailoring Recommendations Box */}
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5 text-[#b77305]" />
                        <span>Panduan Takaran Bahan:</span>
                      </div>

                      <div className="text-xs text-stone-700 space-y-1 font-medium">
                        <p>
                          • <span className="font-bold text-stone-900">Kebutuhan Utama:</span> {selectedLook.fabricNeeded}
                        </p>
                        <p>
                          • <span className="font-bold text-stone-900">Rekomendasi Furing:</span> {selectedLook.furingRecommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Hotspot Card & Buy CTA */}
                  <div className="pt-4 border-t border-stone-200 space-y-4">
                    <div className="flex items-center justify-between gap-4 p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Bahan Baku Resmi:
                        </span>
                        <h4 className="text-xs font-bold text-stone-900 truncate max-w-[200px]">
                          {selectedLook.fabricUsed.name}
                        </h4>
                        <span className="text-sm font-black text-[#e53935] block">
                          Rp {selectedLook.fabricUsed.price.toLocaleString("id-ID")} /m
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyFabric(selectedLook.fabricUsed)}
                        className="px-5 py-2.5 bg-[#b77305] hover:bg-[#965e04] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 hover:scale-105 active:scale-95"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Beli Bahan</span>
                      </button>
                    </div>
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
