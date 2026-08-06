export const revalidate = 60;

import dynamic from "next/dynamic";
import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import { API_BASE_URL } from "@/lib/api";

// Below-the-fold components: lazy loaded to improve TTI & initial bundle size
const CatalogFlipbookSection = dynamic(() => import("@/components/home/CatalogFlipbookSection"));
const AboutBrand = dynamic(() => import("@/components/home/AboutBrand"));
const LatestDrops = dynamic(() => import("@/components/home/LatestDrops"));
const DealsAndRecommendations = dynamic(() => import("@/components/home/DealsAndRecommendations"));
const ShopTheLook = dynamic(() => import("@/components/home/ShopTheLook"));
const BestSellers = dynamic(() => import("@/components/home/BestSellers"));

async function getProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, { next: { revalidate: 60 } });
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
      <FeaturedCategories />
      <CatalogFlipbookSection />
      <AboutBrand />
      <LatestDrops products={products} />
      <DealsAndRecommendations products={products} />
      <ShopTheLook />
      <BestSellers products={products} />
    </div>
  );
}
