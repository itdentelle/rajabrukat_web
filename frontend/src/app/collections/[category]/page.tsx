"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Filter,
  Grid,
  Layers,
  ChevronDown,
  Search,
  ShoppingCart,
  Heart,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Product, useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

const CATEGORY_MAP: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    bannerImage: string;
  }
> = {
  "grade-a": {
    name: "Grade A",
    tagline: "Koleksi Super Premium",
    description:
      "Kain brukat Grade A kualitas premium tertinggi dengan kerapatan bordir maksimal, benang kilau mutiara mewah, dan serat benang paling halus untuk busana eksklusif.",
    bannerImage: "/images/brukat_tile_mutiara.png",
  },
  "grade-b": {
    name: "Grade B",
    tagline: "Koleksi Pilihan Ekonomis & Elegan",
    description:
      "Koleksi kain brukat Grade B dengan motif indah, tekstur lembut, dan harga terjangkau yang sangat ideal untuk pembuatan kebaya pesta, seragam bridesmaid, dan gaun anggun.",
    bannerImage: "/images/renda_chantilly_french.png",
  },
  tulle: {
    name: "Tulle",
    tagline: "Tile Jaring & Furing Silk Modern",
    description:
      "Koleksi kain Tulle & Tile jaring eksklusif dengan hiasan mutiara 3D, renda Chantilly Perancis, serta furing silk satin yang jatuh sempurna saat dikenakan.",
    bannerImage: "/images/cornely_silk_satin.png",
  },
};

const QUALITY_TYPES = [
  "Semua Quality",
  "Chantilly",
  "Polos",
  "Metallic",
  "3D Polos",
  "3D Metallic",
];

interface CategoryProduct extends Product {
  quality?: string;
}

const MOCK_PRODUCTS: CategoryProduct[] = [
  {
    id: "p1",
    name: "Brukat Tile Mutiara Royal French Grade A",
    price: 185000,
    category: "Grade A",
    quality: "3D Metallic",
    image: "/images/brukat_tile_mutiara.png",
    description: "Brukat tile jaring halus bertabur mutiara & payet timbul 3D.",
  },
  {
    id: "p2",
    name: "Brukat Tile Mutiara Luxury Gold Grade A",
    price: 195000,
    category: "Grade A",
    quality: "3D Polos",
    image: "/images/brukat_tile_mutiara.png",
    description: "Motif sulam bordir benang emas mewah dengan payet kilau anggun.",
  },
  {
    id: "p3",
    name: "Renda Chantilly Halus French Grade B",
    price: 125000,
    category: "Grade B",
    quality: "Chantilly",
    image: "/images/renda_chantilly_french.png",
    description: "Renda motif bunga Perancis bertekstur sangat lembut dan tidak gatal.",
  },
  {
    id: "p4",
    name: "Renda Chantilly Soft Pastel Grade B",
    price: 110000,
    category: "Grade B",
    quality: "Polos",
    image: "/images/renda_chantilly_french.png",
    description: "Kain renda motif floral klasik tanpa payet untuk tampilan simpel manis.",
  },
  {
    id: "p5",
    name: "Cornely 3D Silk Satin Furing Tulle",
    price: 245000,
    category: "Tulle",
    quality: "3D Metallic",
    image: "/images/cornely_silk_satin.png",
    description: "Kain tulle jaring bermotif cornely timbul melayang yang mewah.",
  },
  {
    id: "p6",
    name: "Tulle Polos Silk Furing Soft Cream",
    price: 95000,
    category: "Tulle",
    quality: "Metallic",
    image: "/images/cornely_silk_satin.png",
    description: "Kain tulle tile polos ringan berkilau untuk lapisan gaun pesta.",
  },
];

export default function CategoryPage() {
  const routeParams = useParams();
  const rawSlug = (routeParams?.category as string) || (routeParams?.categorySlug as string) || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase();

  const categoryInfo = CATEGORY_MAP[slug] || {
    name: slug ? slug.replace(/-/g, " ").toUpperCase() : "KATEGORI BRUKAT",
    tagline: "Koleksi Eksklusif Raja Brukat",
    description: "Koleksi kain brukat pilihan kualitas terbaik untuk busana Anda.",
    bannerImage: "/images/brukat_tile_mutiara.png",
  };

  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [selectedQuality, setSelectedQuality] = useState("Semua Quality");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const addItem = useCartStore((state) => state.addItem);

  // Load products matching category
  useEffect(() => {
    async function loadCategoryProducts() {
      try {
        const res = await fetch("http://localhost:5000/api/products", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const allProds: CategoryProduct[] = data.products || data;
          const filtered = allProds.filter(
            (p) => p.category?.toLowerCase() === categoryInfo.name.toLowerCase()
          );
          setProducts(
            filtered.length > 0
              ? filtered
              : MOCK_PRODUCTS.filter(
                  (p) => p.category.toLowerCase() === categoryInfo.name.toLowerCase()
                )
          );
        } else {
          setProducts(
            MOCK_PRODUCTS.filter(
              (p) => p.category.toLowerCase() === categoryInfo.name.toLowerCase()
            )
          );
        }
      } catch (e) {
        setProducts(
          MOCK_PRODUCTS.filter(
            (p) => p.category.toLowerCase() === categoryInfo.name.toLowerCase()
          )
        );
      }
    }
    loadCategoryProducts();
  }, [categoryInfo.name]);

  // Filtered & Sorted products
  const displayProducts = useMemo(() => {
    let result = [...products];

    // Filter by Quality
    if (selectedQuality !== "Semua Quality") {
      result = result.filter(
        (p) => p.quality?.toLowerCase() === selectedQuality.toLowerCase()
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedQuality, searchQuery, sortBy]);

  const handleAddToCart = (product: CategoryProduct) => {
    addItem(product);
    toast.success(`${product.name} dimasukkan ke keranjang!`);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-20 pb-24">
      {/* Category Hero Header Banner */}
      <div className="relative bg-stone-900 text-white overflow-hidden py-16 md:py-24 mb-12">
        <div className="absolute inset-0 opacity-40 z-0">
          <Image
            src={categoryInfo.bannerImage}
            alt={categoryInfo.name}
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/40 z-10" />

        <div className="container mx-auto px-6 max-w-7xl relative z-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              Kategori {categoryInfo.name}
            </h1>

            <p className="text-stone-300 text-base md:text-lg leading-relaxed mb-6 font-medium">
              {categoryInfo.description}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono font-bold text-stone-400">
              <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white">
                Total {displayProducts.length} Produk Tersedia
              </span>
              <span>• Grosir & Eceran Meteran</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Quality Type Quick Filter Chips */}
        <div className="mb-8 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#b77305]" />
              <span>Filter Quality Type:</span>
            </span>

            {selectedQuality !== "Semua Quality" && (
              <button
                onClick={() => setSelectedQuality("Semua Quality")}
                className="text-xs font-bold text-[#b77305] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {QUALITY_TYPES.map((qType) => {
              const isSelected = selectedQuality === qType;
              return (
                <button
                  key={qType}
                  onClick={() => setSelectedQuality(qType)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? "bg-[#b77305] text-white shadow-md"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {qType}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar: Search & Sort */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari kain di kategori ${categoryInfo.name}...`}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-[#b77305]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
              Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#b77305]"
            >
              <option value="featured">Unggulan</option>
              <option value="price-low">Harga: Termurah</option>
              <option value="price-high">Harga: Termahal</option>
            </select>
          </div>
        </div>

        {/* Product Catalog Grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-stone-100 overflow-hidden">
                  <Image
                    src={product.image || "/images/brukat_tile_mutiara.png"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Quality Pill Badge */}
                  {product.quality && (
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {product.quality}
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    aria-label="Add to wishlist"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-stone-700 hover:text-rose-500 flex items-center justify-center transition-all shadow-sm"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Info & Buy Button */}
                <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#b77305] uppercase tracking-wider block mb-1">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2 group-hover:text-[#b77305] transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-[#e53935] block">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[9px] text-stone-400 block font-medium">
                        per meter
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      aria-label="Add to cart"
                      className="px-3 py-2 bg-[#b77305] hover:bg-[#965e04] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Beli</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center max-w-md mx-auto my-12">
            <h4 className="text-lg font-bold text-stone-800 mb-2">
              Produk Tidak Ditemukan
            </h4>
            <p className="text-stone-500 text-xs mb-6">
              Tidak ada produk yang cocok dengan filter atau kata kunci pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSelectedQuality("Semua Quality");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 bg-[#b77305] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
