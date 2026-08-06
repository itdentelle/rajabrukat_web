export const revalidate = 60;

import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import AboutBrand from "@/components/home/AboutBrand";
import DealsAndRecommendations from "@/components/home/DealsAndRecommendations";
import ShopTheLook from "@/components/home/ShopTheLook";
import LatestDrops from "@/components/home/LatestDrops";
import BestSellers from "@/components/home/BestSellers";
import CatalogFlipbookSection from "@/components/home/CatalogFlipbookSection";

async function getProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products", { next: { revalidate: 60 } });
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
    const res = await fetch("http://localhost:5000/api/config/hero", { next: { revalidate: 60 } });
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
      <DealsAndRecommendations products={products} />
      <ShopTheLook />
      <LatestDrops products={products} />
      <BestSellers products={products} />
    </div>
  );
}
