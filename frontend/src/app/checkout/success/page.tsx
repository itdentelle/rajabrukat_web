"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="w-20 h-20 text-green-500" />
      </div>
      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Order Successful!</h1>
      <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
      {orderId && (
        <p className="text-sm bg-gray-100 inline-block px-4 py-2 rounded-md font-mono mt-4 mb-8">
          Order ID: {orderId}
        </p>
      )}
      <div className="mt-8">
        <Link 
          href="/"
          className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-all inline-block"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center container mx-auto px-4 py-24">
      <Suspense fallback={<div>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
