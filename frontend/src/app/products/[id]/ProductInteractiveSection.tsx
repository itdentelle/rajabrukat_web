"use client";

import { useState } from "react";
import ProductGalleryClient from "./ProductGalleryClient";
import ProductDetailsClient from "./ProductDetailsClient";
import FormattedDescription from "@/components/products/FormattedDescription";
import { Product } from "@/store/cartStore";

interface ProductInteractiveSectionProps {
  product: Product;
  formattedTitle: string;
  reviews: any[];
  avgRating: string | number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductInteractiveSection({
  product,
  formattedTitle,
  reviews,
  avgRating,
}: ProductInteractiveSectionProps) {
  const [selectedColorImage, setSelectedColorImage] = useState<string | undefined>(undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
      {/* Left Column: Product Image Gallery & Buy Actions */}
      <div className="flex flex-col gap-8">
        <ProductGalleryClient 
          mainImage={product.image} 
          galleryImages={product.galleryImages || []} 
          productName={product.name}
          selectedImage={selectedColorImage}
        />

        {/* Client component for add to cart interaction & color image switching */}
        <ProductDetailsClient 
          product={product} 
          onSelectColorImage={(imgUrl) => setSelectedColorImage(imgUrl)}
        />
      </div>

      {/* Right Column: Product Info & Specifications */}
      <div className="flex flex-col">
        <p className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-3">{product.category}</p>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 leading-snug mb-3">{formattedTitle}</h1>
        
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
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
          <div className="flex items-center gap-4 mb-6">
            <p className="text-3xl font-medium text-red-600">{formatPrice(product.discountPrice)}</p>
            <p className="text-xl text-gray-400 line-through">{formatPrice(product.price)}</p>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">SALE</span>
          </div>
        ) : (
          <p className="text-3xl font-medium mb-6">{formatPrice(product.price)}</p>
        )}

        <div>
          <FormattedDescription description={product.description} />
        </div>
      </div>
    </div>
  );
}
