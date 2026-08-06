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

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  try {
    const res = await fetch(`http://localhost:5000/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

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
    const res = await fetch(`http://localhost:5000/api/products`, { cache: "no-store" });
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
    const revRes = await fetch(`http://localhost:5000/api/products/${id}/reviews`, { cache: "no-store" });
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
        Back to Shop
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Product Image Gallery */}
        <ProductGalleryClient 
          mainImage={product.image} 
          galleryImages={product.galleryImages} 
          productName={product.name} 
        />

        {/* Product Info */}
        <div className="flex flex-col">
          <p className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-4">{product.category}</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 leading-snug mb-4">{formattedTitle}</h1>
          
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-sm ${star <= Number(avgRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                ))}
              </div>
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-gray-500 text-xs">({reviews.length} reviews)</span>
            </div>
          )}

          {product.discountPrice ? (
            <div className="flex items-center gap-4 mb-8">
              <p className="text-3xl font-medium text-red-600">{formatPrice(product.discountPrice)}</p>
              <p className="text-xl text-gray-400 line-through">{formatPrice(product.price)}</p>
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">SALE</span>
            </div>
          ) : (
            <p className="text-3xl font-medium mb-8">{formatPrice(product.price)}</p>
          )}
          <div className="mb-8">
            <FormattedDescription description={product.description} />
          </div>


          {/* Client component for add to cart interaction */}
          <ProductDetailsClient product={product} />

          {/* Accordions */}
          <div className="mt-12 border-t border-[var(--border)] pt-8">
            <div className="mb-6">
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Shipping & Returns</h3>
              <p className="text-sm text-gray-500">Free standard shipping on orders over Rp 500.000. Returns accepted within 14 days of delivery.</p>
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Materials & Care</h3>
              <p className="text-sm text-gray-500">Bahan Brukat & Kebaya Premium. Disarankan cuci lembut dengan tangan (hand wash), hindari penggunaan pemutih, dan jemur di tempat teduh.</p>
            </div>
          </div>

        </div>
      </div>

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
