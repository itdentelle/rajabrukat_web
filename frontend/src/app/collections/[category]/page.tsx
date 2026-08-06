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
import ProductCard from "@/components/products/ProductCard";
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
  const [loading, setLoading] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState("Semua Quality");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Load products matching category directly from backend API
  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/products", {
          cache: "no-store",
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          const allProds: CategoryProduct[] = data.products || data;
          const filtered = allProds.filter(
            (p) => p.category?.toLowerCase() === categoryInfo.name.toLowerCase() || p.category?.toLowerCase().includes(slug)
          );
          setProducts(filtered);
        } else {
          setProducts([]);
        }
      } catch (e) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryProducts();
  }, [categoryInfo.name, slug]);

  // Scroll Position Restoration Effect
  useEffect(() => {
    if (!loading && products.length > 0) {
      const savedPos = sessionStorage.getItem("catalog_scroll_pos");
      const savedUrl = sessionStorage.getItem("catalog_scroll_url");
      if (savedPos && savedUrl === window.location.href) {
        const yPos = parseInt(savedPos, 10);
        if (!isNaN(yPos) && yPos > 0) {
          setTimeout(() => {
            window.scrollTo({ top: yPos, behavior: "instant" });
            sessionStorage.removeItem("catalog_scroll_pos");
            sessionStorage.removeItem("catalog_scroll_url");
          }, 50);
        }
      }
    }
  }, [loading, products.length]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesQuality =
        selectedQuality === "Semua Quality" ||
        p.quality?.toLowerCase() === selectedQuality.toLowerCase() ||
        p.name.toLowerCase().includes(selectedQuality.toLowerCase());
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesQuality && matchesSearch;
    });
  }, [products, selectedQuality, searchQuery]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-20">
      {/* Category Hero Banner */}
      <section className="relative bg-stone-950 text-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src={categoryInfo.bannerImage}
            alt={categoryInfo.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b77305] mb-2 block">
            {categoryInfo.tagline}
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight font-serif mb-4">
            KATEGORI {categoryInfo.name}
          </h1>
          <p className="text-stone-300 max-w-2xl text-sm sm:text-base leading-relaxed mb-6">
            {categoryInfo.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-stone-400 font-mono">
            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-white font-bold">
              Total {filteredProducts.length} Produk Tersedia
            </span>
            <span>• Grosir & Eceran Meteran</span>
          </div>
        </div>
      </section>

      {/* Main Filter & Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quality Filter Pills */}
        <div className="mb-8 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#b77305]" /> Quality:
            </span>
            {QUALITY_TYPES.map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap ${
                  selectedQuality === q
                    ? "bg-[#b77305] text-white shadow-md"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Search inside Category */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari kain di kategori ${categoryInfo.name}...`}
              className="w-full pl-9 pr-4 py-2 bg-stone-100 text-xs text-stone-900 rounded-xl border border-stone-200 focus:outline-none focus:border-[#b77305]"
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="py-20 text-center text-stone-500 font-bold text-sm">
            Memuat produk kategori {categoryInfo.name}...
          </div>
        )}

        {/* Product Catalog Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
            <Layers className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-900 mb-1">
              Belum Ada Produk Tersedia
            </h3>
            <p className="text-stone-500 text-xs max-w-md mx-auto mb-6">
              Saat ini belum ada kain dalam kategori <span className="font-bold text-stone-900">{categoryInfo.name}</span> di database. Silakan jalankan scraper atau tambahkan produk baru lewat admin dashboard.
            </p>
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-[#b77305] text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-[#965e04] transition shadow-md"
            >
              Lihat Semua Katalog
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
