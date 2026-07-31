"use client";

import { Reveal } from "@/components/ui/Reveal";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-black pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <Reveal>
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
              Returns & Exchanges
            </h1>
            <p className="text-gray-500 text-lg">
              Our policy on returns, refunds, and exchanging items.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="prose prose-lg max-w-none text-gray-600">
            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">Return Policy</h3>
            <p className="mb-6">
              We accept returns within 14 days of the delivery date. To be eligible for a return, your item must be unused, unwashed, and in the same condition that you received it. It must also be in the original packaging with all tags attached.
            </p>

            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">Non-returnable Items</h3>
            <p className="mb-6">
              Certain types of items cannot be returned, such as final sale items, limited edition drops (unless defective), and intimates/accessories for hygiene reasons.
            </p>

            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">Exchanges</h3>
            <p className="mb-6">
              If you need to exchange an item for a different size or color, please return your original item for a refund and place a new order. We only replace items if they are defective or damaged upon arrival.
            </p>

            <h3 className="text-xl font-bold uppercase tracking-wide text-black mb-4 mt-8">How to Start a Return</h3>
            <p className="mb-6">
              To initiate a return, please contact our support team at support@dragonworm.com with your order number and reason for return. We will provide you with a return shipping address and instructions. Please note that return shipping costs are the responsibility of the customer.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
