"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryClientProps {
  mainImage: string;
  galleryImages: string[];
  productName: string;
}

export default function ProductGalleryClient({ mainImage, galleryImages, productName }: ProductGalleryClientProps) {
  const [activeImage, setActiveImage] = useState(mainImage);

  // Combine main image with gallery images for the thumbnails
  const allImages = [mainImage, ...(galleryImages || [])];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image View */}
      <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
        <Image 
          src={activeImage || "/placeholder.jpg"} 
          alt={productName} 
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-opacity duration-300"
        />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {allImages.map((imgUrl, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveImage(imgUrl)}
              className={`relative aspect-[3/4] bg-gray-100 overflow-hidden cursor-pointer transition-all border-b-2 ${
                activeImage === imgUrl ? "border-black opacity-100" : "border-transparent opacity-70 hover:opacity-100 hover:border-black"
              }`}
            >
              <Image 
                src={imgUrl || "/placeholder.jpg"} 
                alt={`${productName} view ${idx + 1}`} 
                fill
                sizes="(max-width: 768px) 25vw, 10vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
