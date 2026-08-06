"use client";

import React from "react";
import { ExternalLink, Star } from "lucide-react";

export default function MarketplaceShowcase() {
  return (
    <div className="mb-8">
      {/* Shopee Store Card Only */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#ee4d2d]/10 via-[#ee4d2d]/5 to-transparent border border-[#ee4d2d]/25 hover:border-[#ee4d2d]/50 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Profile Picture / Avatar */}
          <div className="relative w-12 h-12 rounded-xl bg-white p-1 border border-[#ee4d2d]/30 shadow-sm shrink-0 overflow-hidden">
            <img
              src="/icon.png"
              alt="Raja Brukat Shopee Official"
              className="w-full h-full object-contain"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-[#ee4d2d] text-white text-[7px] font-black px-1 rounded">
              Star+
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">Raja Brukat Official Store</h3>
              <span className="bg-[#ee4d2d] text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Star+ Seller
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-[#ee4d2d]">
                <Star className="w-3.5 h-3.5 fill-[#ee4d2d] text-[#ee4d2d]" /> 4.9 / 5.0 Rating
              </span>
              <span>•</span>
              <span>100% Produk Original</span>
              <span>•</span>
              <span>Pengiriman Cepat</span>
            </div>
          </div>
        </div>

        {/* Visit Store Button */}
        <a
          href="https://shopee.co.id/rajabrukat"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <span>Kunjungi Toko Shopee</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
