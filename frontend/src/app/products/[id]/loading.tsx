import React from "react";

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-24 lg:py-32 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-32 bg-gray-200 rounded mb-12"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Product Image Gallery Skeleton */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-4 order-2 md:order-1 overflow-x-auto w-full md:w-24">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-20 h-24 md:w-full md:h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          {/* Main Image */}
          <div className="order-1 md:order-2 flex-1 w-full bg-gray-200 aspect-square rounded-xl"></div>
        </div>

        {/* Product Info Skeleton */}
        <div className="flex flex-col">
          {/* Category */}
          <div className="h-3 w-24 bg-gray-200 rounded mb-4"></div>
          {/* Title */}
          <div className="h-10 w-3/4 bg-gray-200 rounded mb-4"></div>
          {/* Rating */}
          <div className="h-4 w-48 bg-gray-200 rounded mb-6"></div>
          
          {/* Price */}
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-8"></div>
          
          {/* Description */}
          <div className="space-y-3 mb-10">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>

          {/* Add to Cart Area Skeleton */}
          <div className="mb-8 space-y-4">
            <div className="h-12 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Accordions Skeleton */}
          <div className="mt-12 border-t border-gray-100 pt-8 space-y-6">
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
