"use client";

import { Reveal } from "@/components/ui/Reveal";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white text-black pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <Reveal>
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
              Shipping Policy
            </h1>
            <p className="text-gray-500 text-lg">
              Information regarding our shipping times, couriers, and international deliveries.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="prose prose-lg max-w-none text-gray-600">
            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">Order Processing</h3>
            <p className="mb-6">
              All orders are processed within 1-3 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.
            </p>

            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">Domestic Shipping (Indonesia)</h3>
            <p className="mb-6">
              We offer standard shipping across all regions in Indonesia. Standard delivery typically takes 2-5 business days depending on your location. Shipping charges for your order will be calculated and displayed at checkout.
            </p>

            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">International Shipping</h3>
            <p className="mb-6">
              We offer worldwide shipping. International shipping rates and delivery estimates vary depending on the destination and will be calculated at checkout. Please note that you are responsible for any customs and taxes applied to your order.
            </p>

            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">Order Tracking</h3>
            <p className="mb-6">
              You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
