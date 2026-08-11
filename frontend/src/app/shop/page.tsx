"use client";

import { useEffect, useState, Suspense } from "react";
import ProductCard from "@/components/products/ProductCard";
import MarketplaceShowcase from "@/components/shop/MarketplaceShowcase";
import { Product } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, FadeIn } from "@/components/ui/Reveal";
import ProductSkeleton from "@/components/ui/ProductSkeleton";
import { useSearchParams, useRouter } from "next/navigation";
import { Award, Filter, Sparkles, Grid, Layers, RotateCcw, X, Check, Tag, DollarSign, Store, ExternalLink, ShoppingBag } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

// Exact 3 Main Categories
const MAIN_CATEGORIES = [
  "Semua Kategori",
  "Grade A",
  "Grade B",
  "Tulle",
];

// Client Request Filters from quality Webs.xlsx (Excluding Yarn / Benang Details)
const FORMAT_OPTIONS = [
  "Semua Format",
  "Panel",
  "Meteran",
];

const FABRIC_TYPE_OPTIONS = [
  "Semua Tipe",
  "Jacquardtronic",
  "Non Jacquard",
  "3D",
];

const QUALITY_NAME_OPTIONS = [
  "Semua Quality",
  "Chantilly",
  "Chantilly Metallic",
  "Plain",
  "Cord Plain",
  "Cord Metallic",
  "Metallic Outline",
  "Metallic Inlay",
  "Full Metallic",
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

let globalShopProductsCache: Product[] | null = null;

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category") || "Semua Kategori";

  const [products, setProducts] = useState<Product[]>(globalShopProductsCache || []);
  const [loading, setLoading] = useState(!globalShopProductsCache);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Client Excel Filters State
  const [activeFormat, setActiveFormat] = useState("Semua Format");
  const [activeFabricType, setActiveFabricType] = useState("Semua Tipe");
  const [activeQualityName, setActiveQualityName] = useState("Semua Quality");

  const [sortBy, setSortBy] = useState("newest");

  // Dual Slider Range States
  const [maxCatalogPrice, setMaxCatalogPrice] = useState<number>(500000);
  const [sliderMinPrice, setSliderMinPrice] = useState<number>(0);
  const [sliderMaxPrice, setSliderMaxPrice] = useState<number>(500000);

  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      if (cat.toLowerCase().includes("tile") || cat.toLowerCase().includes("mutiara")) {
        setActiveCategory("Grade A");
      } else if (cat.toLowerCase().includes("chantilly")) {
        setActiveCategory("Grade B");
        setActiveQualityName("Chantilly");
      } else if (cat.toLowerCase().includes("cornely") || cat.toLowerCase().includes("silk")) {
        setActiveCategory("Tulle");
      } else if (MAIN_CATEGORIES.includes(cat)) {
        setActiveCategory(cat);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    // Fetch products from backend
    fetch(`${API_BASE_URL}/api/products?limit=200`)
      .then((res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data) return;
        const fetchedProducts: Product[] = data.products || data;
        if (Array.isArray(fetchedProducts) && fetchedProducts.length > 0) {
          globalShopProductsCache = fetchedProducts;
          setProducts(fetchedProducts);

          const highest = Math.max(...fetchedProducts.map((p) => p.discountPrice ?? p.price));
          const roundedMax = Math.ceil(highest / 50000) * 50000 || 500000;
          setMaxCatalogPrice(roundedMax);
          setSliderMinPrice(0);
          setSliderMaxPrice(roundedMax);
        }
      })
      .catch((err) => {
        console.warn("Backend API offline or unreachable:", err?.message || err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Reset Filters Function
  const handleResetFilters = () => {
    setActiveCategory("Semua Kategori");
    setActiveFormat("Semua Format");
    setActiveFabricType("Semua Tipe");
    setActiveQualityName("Semua Quality");
    setSliderMinPrice(0);
    setSliderMaxPrice(maxCatalogPrice);
    setSortBy("newest");
    router.push("/shop");
  };

  // Helper matcher for Main Category (Grade A, Grade B, Tulle)
  const matchesMainCategory = (p: Product, targetCat: string) => {
    if (targetCat === "Semua Kategori" || targetCat === "All") return true;
    const catLower = (p.category || "").toLowerCase();
    const targetLower = targetCat.toLowerCase();
    return catLower === targetLower || catLower.includes(targetLower);
  };

  // Helper matcher for Format / Satuan Jual (Panel, Meteran)
  const matchesFormat = (p: Product, targetFormat: string) => {
    if (targetFormat === "Semua Format") return true;
    const nameLower = (p.name || "").toLowerCase();
    const isPanel = nameLower.includes("panel");

    if (targetFormat === "Panel") {
      return isPanel;
    }
    if (targetFormat === "Meteran") {
      return !isPanel;
    }
    return true;
  };

  // Helper matcher for Fabric Type (Jacquardtronic, Non Jacquard, 3D)
  const matchesFabricType = (p: Product, targetType: string) => {
    if (targetType === "Semua Tipe") return true;
    const combined = `${p.name || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
    if (targetType === "Jacquardtronic") {
      return combined.includes("jacquard");
    }
    if (targetType === "Non Jacquard") {
      return combined.includes("non jacquard") || combined.includes("non-jacquard") || !combined.includes("jacquard");
    }
    if (targetType === "3D") {
      return combined.includes("3d");
    }
    return combined.includes(targetType.toLowerCase());
  };

  // Helper matcher for Quality Name (Chantilly, Chantilly Metallic, Plain, Cord Plain, Cord Metallic, Metallic Outline, Metallic Inlay, Full Metallic)
  const matchesQualityName = (p: Product, targetQuality: string) => {
    if (targetQuality === "Semua Quality") return true;
    const combined = `${p.name || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();

    if (targetQuality === "Chantilly Metallic") {
      return combined.includes("chantilly") && (combined.includes("metallic") || combined.includes("metalik"));
    }
    if (targetQuality === "Chantilly") {
      return combined.includes("chantilly");
    }
    if (targetQuality === "Cord Metallic") {
      return (combined.includes("cord") || combined.includes("cornely")) && (combined.includes("metallic") || combined.includes("metalik"));
    }
    if (targetQuality === "Cord Plain") {
      return (combined.includes("cord") || combined.includes("cornely")) && !combined.includes("metallic") && !combined.includes("metalik");
    }
    if (targetQuality === "Full Metallic") {
      return combined.includes("full metallic") || combined.includes("full metalik") || combined.includes("metallic");
    }
    if (targetQuality === "Metallic Outline") {
      return combined.includes("outline") || (combined.includes("metallic") && combined.includes("pinggiran"));
    }
    if (targetQuality === "Metallic Inlay") {
      return combined.includes("inlay") || (combined.includes("metallic") && combined.includes("tengah"));
    }
    if (targetQuality === "Plain") {
      return combined.includes("plain") || combined.includes("polos");
    }

    return combined.includes(targetQuality.toLowerCase());
  };

  // Multi-tier Filtering: Main Category + Format + Fabric Type + Quality Name + Search + Dual Price Slider
  let filteredProducts = products.filter((p) => {
    const matchesCat = matchesMainCategory(p, activeCategory);
    const matchesFmt = matchesFormat(p, activeFormat);
    const matchesFab = matchesFabricType(p, activeFabricType);
    const matchesQual = matchesQualityName(p, activeQualityName);
    return matchesCat && matchesFmt && matchesFab && matchesQual;
  });

  // Search Query Filter
  const searchQuery = searchParams.get("q") || searchParams.get("search");
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }

  // Dual Range Price Filter
  filteredProducts = filteredProducts.filter((p) => {
    const priceToCompare = p.discountPrice ?? p.price;
    return priceToCompare >= sliderMinPrice && priceToCompare <= sliderMaxPrice;
  });

  // Sorting
  filteredProducts.sort((a, b) => {
    const priceA = a.discountPrice ?? a.price;
    const priceB = b.discountPrice ?? b.price;

    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Grouped Products by the 3 Main Categories
  const groupedBy3Categories = {
    "Grade A (Super Premium Mutiara)": filteredProducts.filter((p) => matchesMainCategory(p, "Grade A")),
    "Grade B (Standar Chantilly)": filteredProducts.filter((p) => matchesMainCategory(p, "Grade B")),
    "Tulle & Cornely Edition": filteredProducts.filter((p) => matchesMainCategory(p, "Tulle")),
  };

  // Range percent calculations for dual track bar
  const minPercent = Math.min(100, Math.max(0, (sliderMinPrice / maxCatalogPrice) * 100));
  const maxPercent = Math.min(100, Math.max(0, (sliderMaxPrice / maxCatalogPrice) * 100));

  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setSiteConfig(data);
      })
      .catch((err) => console.warn("Failed to fetch shop header config:", err));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-28 pb-24">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Header Section */}
        <Reveal>
          <div className="mb-6 border-b border-stone-200 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-stone-900 mb-2">
                {siteConfig?.shopTitle
                  ? siteConfig.shopTitle.includes("\n") || siteConfig.shopTitle.includes("\\n")
                    ? siteConfig.shopTitle.replace(/\\n/g, "\n").split("\n").join(" ")
                    : siteConfig.shopTitle
                  : "Katalog Kain Raja Brukat"}
              </h1>
              <p className="text-stone-600 text-sm md:text-base max-w-xl font-normal">
                {searchQuery
                  ? `Menampilkan hasil pencarian untuk "${searchQuery}"`
                  : siteConfig?.shopDescription || "Koleksi lengkap kain brukat pilihan: Grade A, Grade B, dan Tulle dengan varian Chantilly, Polos, Metallic, & 3D."}
              </p>
            </div>

            {/* Mobile Filter Drawer Trigger Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md"
            >
              <Filter className="w-4 h-4 text-[#b77305]" />
              <span>Filter & Kategori</span>
            </button>
          </div>
        </Reveal>

        {/* 2 Official Marketplace Cards: Shopee & Tokopedia */}
        <Reveal>
          <MarketplaceShowcase />
        </Reveal>

        {/* Main 2-Column Layout: Left Sticky Sidebar Filter + Right Product Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR FILTER (Desktop Sticky Sidebar) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide space-y-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">

            {/* Sidebar Header & Reset */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#b77305]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-stone-900">
                  Filter Katalog
                </h3>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#b77305] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* 1. Kategori Utama (3 Kategori: Grade A, Grade B, Tulle) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#b77305]" />
                <span>Kategori Utama (3 Kategori)</span>
              </h4>
              <div className="space-y-1">
                {MAIN_CATEGORIES.map((cat) => {
                  const isSelected = activeCategory === cat;
                  const count = products.filter((p) => matchesMainCategory(p, cat)).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-between group ${isSelected
                          ? "bg-[#b77305] text-white shadow-sm font-bold"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Format / Satuan Jual (Panel, Meteran) */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#b77305]" />
                <span>Format Jual</span>
              </h4>
              <div className="space-y-1">
                {FORMAT_OPTIONS.map((fmt) => {
                  const isSelected = activeFormat === fmt;
                  const count = products.filter((p) => matchesFormat(p, fmt)).length;
                  return (
                    <button
                      key={fmt}
                      onClick={() => setActiveFormat(fmt)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between group ${isSelected
                          ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-amber-300 bg-[#b77305]" : "border-stone-400 bg-white"
                            }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span>{fmt}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSelected ? "bg-amber-300/20 text-amber-300" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Teknik / Tipe Kain (Jacquardtronic, Non Jacquard, 3D) */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#b77305]" />
                <span>Tipe Kain</span>
              </h4>
              <div className="space-y-1">
                {FABRIC_TYPE_OPTIONS.map((type) => {
                  const isSelected = activeFabricType === type;
                  const count = products.filter((p) => matchesFabricType(p, type)).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFabricType(type)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between group ${isSelected
                          ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-amber-300 bg-[#b77305]" : "border-stone-400 bg-white"
                            }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span>{type}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isSelected ? "bg-amber-300/20 text-amber-300" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Nama Quality (Chantilly, Plain, Cord Plain, Metallic, etc.) */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#b77305]" />
                <span>Nama Quality</span>
              </h4>
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {QUALITY_NAME_OPTIONS.map((quality) => {
                  const isSelected = activeQualityName === quality;
                  const count = products.filter((p) => matchesQualityName(p, quality)).length;

                  return (
                    <button
                      key={quality}
                      onClick={() => setActiveQualityName(quality)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between group ${isSelected
                          ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-1">
                        <div
                          className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-amber-300 bg-[#b77305]" : "border-stone-400 bg-white"
                            }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span className="truncate">{quality}</span>
                      </div>
                      <span
                        className={`text-[10px] shrink-0 px-2 py-0.5 rounded-full font-mono font-bold ${isSelected ? "bg-amber-300/20 text-amber-300" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. DUAL-THUMB PRICE RANGE SLIDER (Batas Bawah & Batas Atas) */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#b77305]" />
                  <span>Rentang Harga</span>
                </h4>
              </div>

              {/* Formatted Selected Price Range Badge */}
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 mb-4 text-center">
                <span className="text-xs font-bold text-[#b77305] font-mono">
                  {formatRupiah(sliderMinPrice)} - {formatRupiah(sliderMaxPrice)}
                </span>
              </div>

              {/* DUAL SLIDER TRACK CONTAINER */}
              <div className="relative w-full h-8 flex items-center px-1">
                {/* Background Base Track */}
                <div className="absolute inset-x-0 h-2 bg-stone-200 rounded-full" />

                {/* Gold Highlighted Active Range Track */}
                <div
                  className="absolute h-2 bg-[#b77305] rounded-full"
                  style={{
                    left: `${minPercent}%`,
                    right: `${100 - maxPercent}%`,
                  }}
                />

                {/* Min Price Range Input (Batas Bawah) */}
                <input
                  type="range"
                  min={0}
                  max={maxCatalogPrice}
                  step={5000}
                  value={sliderMinPrice}
                  onChange={(e) => {
                    const value = Math.min(Number(e.target.value), sliderMaxPrice - 5000);
                    setSliderMinPrice(value);
                  }}
                  className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer accent-[#b77305] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b77305] [&::-webkit-slider-thumb]:shadow-md"
                />

                {/* Max Price Range Input (Batas Atas) */}
                <input
                  type="range"
                  min={0}
                  max={maxCatalogPrice}
                  step={5000}
                  value={sliderMaxPrice}
                  onChange={(e) => {
                    const value = Math.max(Number(e.target.value), sliderMinPrice + 5000);
                    setSliderMaxPrice(value);
                  }}
                  className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer accent-[#b77305] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b77305] [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>

              {/* Slider Min & Max Label Indicators */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-stone-500 mt-1">
                <span>Rp 0</span>
                <span>{formatRupiah(maxCatalogPrice)}</span>
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN: Product Catalog Grid & Top Toolbar */}
          <main className="lg:col-span-9 space-y-6">

            {/* Top Results Count & Controls Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">

              {/* Product Count & Active Filters Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-stone-800">
                  Menampilkan <span className="text-[#b77305]">{filteredProducts.length}</span> Produk Kain
                </span>

                {activeCategory !== "Semua Kategori" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#b77305]/10 border border-[#b77305]/30 text-[#b77305] text-[11px] font-semibold">
                    Kategori: {activeCategory}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-stone-900"
                      onClick={() => setActiveCategory("Semua Kategori")}
                    />
                  </span>
                )}

                {activeFormat !== "Semua Format" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-300 text-stone-800 text-[11px] font-semibold">
                    Format: {activeFormat}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-stone-900"
                      onClick={() => setActiveFormat("Semua Format")}
                    />
                  </span>
                )}

                {activeFabricType !== "Semua Tipe" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-semibold">
                    Tipe: {activeFabricType}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-stone-900"
                      onClick={() => setActiveFabricType("Semua Tipe")}
                    />
                  </span>
                )}

                {activeQualityName !== "Semua Quality" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-900 text-amber-300 text-[11px] font-semibold">
                    Quality: {activeQualityName}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-white"
                      onClick={() => setActiveQualityName("Semua Quality")}
                    />
                  </span>
                )}

                {(sliderMinPrice > 0 || sliderMaxPrice < maxCatalogPrice) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-300 text-stone-700 text-[11px] font-semibold">
                    {formatRupiah(sliderMinPrice)} - {formatRupiah(sliderMaxPrice)}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-stone-900"
                      onClick={() => {
                        setSliderMinPrice(0);
                        setSliderMaxPrice(maxCatalogPrice);
                      }}
                    />
                  </span>
                )}
              </div>

              {/* View Mode & Sort Dropdown */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === "grid" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                      }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("grouped")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === "grouped" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Per Kategori</span>
                  </button>
                </div>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3.5 py-2 bg-stone-50 text-xs font-bold uppercase tracking-wider border border-stone-300 rounded-xl focus:outline-none focus:border-[#b77305] text-stone-800 cursor-pointer"
                >
                  <option value="newest">Urutkan: Terbaru</option>
                  <option value="price-low">Harga: Low - High</option>
                  <option value="price-high">Harga: High - Low</option>
                </select>
              </div>

            </div>

            {/* Catalog Grid View */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <ProductSkeleton key={n} />
                ))}
              </div>
            ) : viewMode === "grid" ? (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      key={product.id}
                    >
                      <FadeIn delay={idx * 0.04}>
                        <ProductCard product={product} />
                      </FadeIn>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Grouped by 3 Main Categories View */
              <div className="space-y-12">
                {Object.entries(groupedBy3Categories).map(([catTitle, catProducts]) => {
                  if (catProducts.length === 0) return null;

                  return (
                    <div key={catTitle} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                        <Tag className="w-5 h-5 text-[#b77305]" />
                        <div>
                          <h3 className="text-lg font-bold text-stone-900 uppercase tracking-tight">
                            {catTitle}
                          </h3>
                          <p className="text-stone-500 text-xs font-medium">
                            Koleksi pilihan dengan standar kualitas unggulan Raja Brukat.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {catProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 shadow-sm">
                <Award className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-800 font-bold text-lg mb-1">Produk Tidak Ditemukan</p>
                <p className="text-stone-500 text-sm mb-4">
                  Tidak ada kain yang sesuai dengan kombinasi Kategori & Quality yang dipilih.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-[#b77305] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* MOBILE FILTER OVERLAY DRAWER */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white z-50 lg:hidden p-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <h3 className="font-bold text-base uppercase tracking-wider text-stone-900">
                    Filter Katalog
                  </h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-stone-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile 3 Main Categories */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Kategori Utama (3 Kategori)
                  </h4>
                  <div className="space-y-1">
                    {MAIN_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setMobileFilterOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeCategory === cat ? "bg-[#b77305] text-white font-bold" : "text-stone-700 bg-stone-50"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Format Jual */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Format Jual
                  </h4>
                  <div className="space-y-1">
                    {FORMAT_OPTIONS.map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => {
                          setActiveFormat(fmt);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeFormat === fmt ? "bg-[#b77305] text-white font-bold" : "text-stone-700 bg-stone-50"
                          }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Tipe Kain */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Tipe Kain
                  </h4>
                  <div className="space-y-1">
                    {FABRIC_TYPE_OPTIONS.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setActiveFabricType(type);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeFabricType === type ? "bg-[#b77305] text-white font-bold" : "text-stone-700 bg-stone-50"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Quality Name */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Nama Quality
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {QUALITY_NAME_OPTIONS.map((quality) => (
                      <button
                        key={quality}
                        onClick={() => {
                          setActiveQualityName(quality);
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold ${activeQualityName === quality
                            ? "bg-stone-900 text-amber-300 font-bold"
                            : "text-stone-700 bg-stone-50"
                          }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Dual Price Slider */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Rentang Harga (Dual Slider)
                  </h4>
                  <div className="bg-stone-50 p-2 rounded-xl text-center mb-3">
                    <span className="text-xs font-bold text-[#b77305] font-mono">
                      {formatRupiah(sliderMinPrice)} - {formatRupiah(sliderMaxPrice)}
                    </span>
                  </div>
                  <div className="relative w-full h-8 flex items-center px-1">
                    <div className="absolute inset-x-0 h-2 bg-stone-200 rounded-full" />
                    <div
                      className="absolute h-2 bg-[#b77305] rounded-full"
                      style={{
                        left: `${minPercent}%`,
                        right: `${100 - maxPercent}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={maxCatalogPrice}
                      step={5000}
                      value={sliderMinPrice}
                      onChange={(e) => {
                        const value = Math.min(Number(e.target.value), sliderMaxPrice - 5000);
                        setSliderMinPrice(value);
                      }}
                      className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer accent-[#b77305] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b77305]"
                    />
                    <input
                      type="range"
                      min={0}
                      max={maxCatalogPrice}
                      step={5000}
                      value={sliderMaxPrice}
                      onChange={(e) => {
                        const value = Math.max(Number(e.target.value), sliderMinPrice + 5000);
                        setSliderMaxPrice(value);
                      }}
                      className="absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer accent-[#b77305] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b77305]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-200 flex gap-3">
                <button
                  onClick={handleResetFilters}
                  className="w-1/2 py-3 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-1/2 py-3 bg-[#b77305] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Terapkan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 pt-28 pb-24 text-center text-stone-600 font-bold uppercase tracking-widest">
          Memuat Katalog Raja Brukat...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
