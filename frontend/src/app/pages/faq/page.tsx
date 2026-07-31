"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

export default function FAQPage() {
  const faqs = [
    {
      question: "How do your sizes run?",
      answer: "Our garments feature an oversized, boxy fit. We recommend ordering your true size for the intended streetwear look, or sizing down if you prefer a more standard fit."
    },
    {
      question: "When will out of stock items be restocked?",
      answer: "We rarely restock our limited seasonal collections. However, our Core Essentials are restocked regularly. Sign up for our newsletter to get notified."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship worldwide. Shipping costs and delivery times will be calculated at checkout based on your location."
    },
    {
      question: "How do I wash my garments?",
      answer: "Machine wash cold inside out with similar colors. Do not bleach. Hang dry to prevent shrinking and preserve the quality of the print and fabric."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <Reveal>
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-500 text-lg">
              Everything you need to know about our products and services.
            </p>
          </div>
        </Reveal>

        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <Reveal key={index} delay={index * 0.1}>
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-xl font-bold uppercase tracking-wide mb-4">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
