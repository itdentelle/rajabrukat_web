export const dynamic = "force-dynamic";

import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import AboutBrand from "@/components/home/AboutBrand";
import DealsAndRecommendations from "@/components/home/DealsAndRecommendations";
import ShopTheLook from "@/components/home/ShopTheLook";
import LatestDrops from "@/components/home/LatestDrops";
import BestSellers from "@/components/home/BestSellers";

async function getProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products", { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return data.products || data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getHeroConfig() {
  try {
    const res = await fetch("http://localhost:5000/api/config/hero", { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch hero config");
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
      <AboutBrand />
      <DealsAndRecommendations products={products} />
      <ShopTheLook />
      <LatestDrops products={products} />
      <BestSellers products={products} />
    </div>
  );
}
