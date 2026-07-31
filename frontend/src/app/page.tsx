import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import AboutBrand from "@/components/home/AboutBrand";
import LatestDrops from "@/components/home/LatestDrops";
import BestSellers from "@/components/home/BestSellers";

async function getProducts() {
  try {
    // Using no-store to ensure we always get fresh products (or you can use revalidate: 60)
    const res = await fetch("http://localhost:5000/api/products", { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return data.products || data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getHeroConfig() {
  try {
    const res = await fetch("http://localhost:5000/api/config/hero", { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch hero config");
    return await res.json();
  } catch (error) {
    console.error(error);
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
      <LatestDrops products={products} />
      <BestSellers products={products} />
    </div>
  );
}
