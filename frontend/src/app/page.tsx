export const revalidate = 60;

import dynamic from "next/dynamic";
import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import { API_BASE_URL } from "@/lib/api";

// Below-the-fold components: lazy loaded with reserved height to eliminate CLS (Cumulative Layout Shift)
const CatalogFlipbookSection = dynamic(() => import("@/components/home/CatalogFlipbookSection"), {
  loading: () => <div className="min-h-[420px] w-full" />,
});
const AboutBrand = dynamic(() => import("@/components/home/AboutBrand"), {
  loading: () => <div className="min-h-[360px] w-full" />,
});
const LatestDrops = dynamic(() => import("@/components/home/LatestDrops"), {
  loading: () => <div className="min-h-[480px] w-full" />,
});
const FabricComparisonSlider = dynamic(() => import("@/components/home/FabricComparisonSlider"), {
  loading: () => <div className="min-h-[480px] w-full" />,
});
const ShopTheLook = dynamic(() => import("@/components/home/ShopTheLook"), {
  loading: () => <div className="min-h-[450px] w-full" />,
});
const BestSellers = dynamic(() => import("@/components/home/BestSellers"), {
  loading: () => <div className="min-h-[400px] w-full" />,
});

async function getProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products?minimal=true&limit=24`, { next: { revalidate: 60 } });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) return [];
    const data = await res.json();
    return data.products || data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getHeroConfig() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/config/hero`, { next: { revalidate: 60 } });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching hero config:", error);
    return null;
  }
}

export default async function Home() {
  const [products, config] = await Promise.all([getProducts(), getHeroConfig()]);

  return (
    <div className="min-h-screen">
      <HeroBanner config={config} />
      <FeaturedCategories config={config} />
      <AboutBrand config={config} />
      <LatestDrops products={products} config={config} />
      <CatalogFlipbookSection config={config} />
      <FabricComparisonSlider config={config} />
      <ShopTheLook products={products} config={config} />
      <BestSellers products={products} config={config} />
    </div>
  );
}
