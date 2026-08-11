"use client";

import { Reveal } from "@/components/ui/Reveal";
import { ShieldCheck, RotateCcw, Truck, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

export default function ReturnsPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/hero`)
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-28 pb-24">
      {/* Top Banner Header */}
      <div className="bg-white border-b border-stone-200 py-12 mb-12 shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#b77305]/10 border border-[#b77305]/20 text-[#b77305] text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Garansi Kepuasan Pelanggan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-stone-900 mb-4">
            {config?.returnsPageTitle || "Kebijakan Garansi & Retur Kain"}
          </h1>
          
          <p className="text-stone-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {config?.returnsPageSubtitle || "Komitmen Raja Brukat untuk memberikan jaminan kualitas 100% kain Brukat, Chantilly, dan Tile Mutiara bebas cacat atau salah kirim."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200 shadow-md space-y-10">
          
          {/* Section 1 */}
          <Reveal>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-stone-900">
                  {config?.returnsSection1Title || "1. Ketentuan Garansi & Syarat Retur"}
                </h3>
              </div>
              <p className="text-stone-600 leading-relaxed text-sm sm:text-base font-normal pl-2 whitespace-pre-line">
                {config?.returnsSection1Desc || "Kami menerima pengajuan retur kain atau klaim garansi dalam jangka waktu maksimal 2x24 jam sejak barang diterima sesuai resi pelacakan ekspedisi. Syarat retur yang berlaku: Terjadi kerusakan fisik pada kain (sobek, cacat sulaman bordir fatal, atau payet rontok parah), jumlah meteran pemotongan kain tidak sesuai, atau salah kirim warna/motif."}
              </p>
            </div>
          </Reveal>

          {/* Section 2 */}
          <Reveal delay={0.1}>
            <div className="pt-6 border-t border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-stone-900">
                  {config?.returnsSection2Title || "2. Syarat Wajib Video Unboxing"}
                </h3>
              </div>
              <p className="text-stone-600 leading-relaxed text-sm sm:text-base font-normal pl-2 whitespace-pre-line">
                {config?.returnsSection2Desc || "Demi kenyamanan bersama dan validasi klaim garansi retur, pelanggan WAJIB menyertakan Video Unboxing utuh dari saat paket belum dibuka sama sekali hingga proses pemeriksaan kain selesai."}
              </p>
            </div>
          </Reveal>

          {/* Section 3 */}
          <Reveal delay={0.2}>
            <div className="pt-6 border-t border-stone-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-[#b77305]/10 text-[#b77305] rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-stone-900">
                  {config?.returnsSection3Title || "3. Tata Cara Mengajukan Retur"}
                </h3>
              </div>
              <div className="text-stone-600 leading-relaxed text-sm sm:text-base font-normal pl-2 whitespace-pre-line">
                {config?.returnsSection3Desc || "1. Hubungi CS WhatsApp Hotline di +62 858-8166-7778.\n2. Kirimkan foto resi, nomor nota, dan video unboxing.\n3. CS akan memverifikasi dan memberikan alamat retur."}
              </div>
            </div>
          </Reveal>


          {/* Call to Action CS */}
          <div className="pt-6 border-t border-stone-100">
            <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <h4 className="text-lg font-bold mb-1">Ada Kendala dengan Pesanan Kain Anda?</h4>
                <p className="text-stone-400 text-xs sm:text-sm">Tim CS Raja Brukat siap membimbing proses penukaran hingga tuntas.</p>
              </div>

              <a
                href="https://wa.me/6285881667778"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#b77305] hover:bg-[#965e04] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hubungi CS Retur</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

