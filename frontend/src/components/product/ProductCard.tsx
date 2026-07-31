"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore, Product } from "@/store/cartStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
        {/* Placeholder Image using a random image service or a solid color if image fails. We use a grey placeholder initially. */}
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
              // You could trigger a toast here
            }}
            className="w-full bg-black text-white py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
      <Link href={`/products/${product.id}`} className="block">
        <h3 className="font-bold text-sm uppercase tracking-wide mb-1 group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mb-2">{product.category}</p>
        <p className="font-medium">{formatPrice(product.price)}</p>
      </Link>
    </div>
  );
}
