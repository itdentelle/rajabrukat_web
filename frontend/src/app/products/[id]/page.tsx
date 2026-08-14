// Removed unused import
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductDetailsClient from "./ProductDetailsClient";
import ProductGalleryClient from "./ProductGalleryClient";
import ProductCard from "@/components/products/ProductCard";
import { cleanTitle } from "@/utils/cleanTitle";
import ProductReviews from "@/components/products/ProductReviews";
import FormattedDescription from "@/components/products/FormattedDescription";
import { API_BASE_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

import ProductInteractiveSection from "./ProductInteractiveSection";

export default async function ProductDetailPage({ params }: PageProps) {
  // Await the params Promise in Next.js 15
  const { id } = await params;
  
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const { displayTitle, code } = cleanTitle(product.name);
  const formattedTitle = code ? `${displayTitle} [ ${code} ]` : displayTitle;

  // Fetch all products to get recommendations
  let recommendedProducts = [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, { cache: "no-store" });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const resData = await res.json();
      const allProducts = resData.products || resData;
      if (Array.isArray(allProducts)) {
        recommendedProducts = allProducts.filter((p: any) => p.id !== id).slice(0, 4);
      }
    }
  } catch (error) {
    console.error("Failed to fetch recommended products:", error);
  }

  // Fetch reviews for star rating
  let reviews = [];
  try {
    const revRes = await fetch(`${API_BASE_URL}/api/products/${id}/reviews`, { cache: "no-store" });
    const revContentType = revRes.headers.get("content-type") || "";
    if (revRes.ok && revContentType.includes("application/json")) {
      reviews = await revRes.json();
    }
  } catch(e) {}
  const avgRating = reviews.length ? (reviews.reduce((a: any, b: any) => a + b.rating, 0) / reviews.length).toFixed(1) : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-24 lg:py-32">
      <Link href="/shop" className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-12 transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Kembali ke Katalog Toko
      </Link>
      
      <ProductInteractiveSection
        product={product}
        formattedTitle={formattedTitle}
        reviews={reviews}
        avgRating={avgRating}
      />

      {/* Product Reviews */}
      <ProductReviews productId={product.id} />

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="mt-32 border-t border-[var(--border)] pt-16">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-12 text-center">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {recommendedProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
