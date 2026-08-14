import React from "react";
import { Info, Truck, CheckCircle2, ShieldCheck, Ruler } from "lucide-react";

interface FormattedDescriptionProps {
  description?: string | null;
}

export default function FormattedDescription({ description }: FormattedDescriptionProps) {
  if (!description || description.trim() === "") {
    return (
      <p className="text-gray-600 leading-relaxed text-sm">
        Dibuat dari bahan premium berkualitas tinggi yang memberikan kesan mewah, elegan, dan nyaman untuk momen spesial Anda.
      </p>
    );
  }

  // Parse raw text sections if scraped raw string is provided
  const rawText = description;

  // Extract Specification (Panjang & Lebar)
  const lengthMatch = rawText.match(/Panjang\s*1?\s*Kain\s*:\s*([^:\n\r–\-]+(?:\([^)]+\))?)/i);
  const widthMatch = rawText.match(/Lebar\s*1?\s*Kain\s*:\s*([^:\n\r–\-]+(?:\([^)]+\))?)/i);
  
  const lengthVal = lengthMatch ? lengthMatch[1].replace(/KETERSEDIAAN.*/i, "").trim() : null;
  const widthVal = widthMatch ? widthMatch[1].replace(/KETERSEDIAAN.*/i, "").trim() : null;

  // Extract Grade Info
  const gradeMatch = rawText.match(/KETERANGAN GRADE\s*:\s*([^:\n\r]+)/i) || 
                     rawText.match(/GRADE\s+([AB])\s*–\s*([^:\n\r]+)/i);
  // Extract Informasi Kain & Deskripsi Produk
  let fabricInfoText = "";
  let productDescText = "";

  const fabricInfoMatch = rawText.match(/INFORMASI KAIN\s*:\s*([\s\S]*?)(?=DESKRIPSI PRODUK|DESKRIPSI:|CATATAN PENGIRIMAN|#|$)/i) ||
                          rawText.match(/INFORMASI PRODUK\s*:\s*([\s\S]*?)(?=DESKRIPSI PRODUK|DESKRIPSI:|CATATAN PENGIRIMAN|#|$)/i);
  
  const descMatch = rawText.match(/DESKRIPSI PRODUK\s*:\s*([\s\S]*?)(?=CATATAN PENGIRIMAN|#|$)/i) ||
                    rawText.match(/DESKRIPSI\s*:\s*([\s\S]*?)(?=CATATAN PENGIRIMAN|#|$)/i);

  if (fabricInfoMatch) {
    fabricInfoText = fabricInfoMatch[1].trim();
  }
  if (descMatch) {
    productDescText = descMatch[1].trim();
  }

  // Fallback if no explicit tags exist
  if (!fabricInfoMatch && !descMatch) {
    fabricInfoText = rawText
      .replace(/Panjang\s*1?\s*Kain\s*:\s*[^\n\r]+\n?/gi, "")
      .replace(/Lebar\s*1?\s*Kain\s*:\s*[^\n\r]+\n?/gi, "")
      .replace(/Informasi Kain\s*:\s*/gi, "")
      .replace(/KETERSEDIAAN WARNA\s*:[\s\S]*?SUB TOTAL[^\n\r–\-]*/gi, "")
      .replace(/---.*?---/gi, "")
      .replace(/Description/gi, "")
      .replace(/KETERANGAN GRADE\s*:.*?/gi, "")
      .replace(/CATATAN PENGIRIMAN\s*:[\s\S]*/gi, "")
      .replace(/#\w+/g, "")
      .trim();
  }

  // Extract Shipping Info
  const shippingMatch = rawText.match(/CATATAN PENGIRIMAN\s*:\s*([\s\S]*?)(?=#|$)/i);
  const shippingText = shippingMatch ? shippingMatch[1].trim() : null;

  // Extract hashtags
  const hashtags = rawText.match(/#[\w]+/g);

  // Check if text was parsed into structured sections
  const hasStructuredSections = lengthVal || widthVal || gradeMatch || fabricInfoText || productDescText || shippingText;

  if (!hasStructuredSections) {
    return (
      <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line space-y-2">
        {description}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Dimension Badges / Specs */}
      {(lengthVal || widthVal) && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-stone-50/70 rounded-2xl border border-stone-200/80 shadow-2xs">
          {lengthVal && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs shrink-0">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-stone-400 font-medium leading-none mb-1">Panjang Kain</p>
                <p className="text-sm font-extrabold text-stone-900 leading-none">{lengthVal}</p>
              </div>
            </div>
          )}
          {widthVal && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs shrink-0">
                <Ruler className="w-4 h-4 rotate-90" />
              </div>
              <div>
                <p className="text-[11px] text-stone-400 font-medium leading-none mb-1">Lebar Kain</p>
                <p className="text-sm font-extrabold text-stone-900 leading-none">{widthVal}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade Info Badge */}
      {gradeMatch && (
        <div className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Keterangan Grade: </span>
            <span>{gradeMatch[1] || gradeMatch[0]}</span>
          </div>
        </div>
      )}

      {/* Fabric Info Section */}
      {fabricInfoText && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">INFORMASI KAIN</h4>
          <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">
            {fabricInfoText}
          </p>
        </div>
      )}

      {/* Product Description Section */}
      {productDescText && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">DESKRIPSI PRODUK</h4>
          <p className="text-stone-700 leading-relaxed whitespace-pre-line text-sm">
            {productDescText}
          </p>
        </div>
      )}

      {/* Catatan Pengiriman (Default Automatic on All Products) */}
      <div className="p-4 bg-stone-50/80 border border-stone-200/80 rounded-2xl space-y-3 text-xs text-stone-700 shadow-2xs">
        <div className="flex items-center gap-2 font-extrabold text-stone-900 text-sm">
          <Truck className="w-4 h-4 text-stone-800" />
          <span>Catatan Pengiriman</span>
        </div>
        {shippingText ? (
          <p className="leading-relaxed pl-6 whitespace-pre-line text-stone-600">
            {shippingText.replace(/•/g, "\n• ").trim()}
          </p>
        ) : (
          <ul className="space-y-2 text-stone-600 font-medium pl-1">
            <li className="flex items-start gap-2">
              <span className="text-stone-400 font-bold">•</span>
              <span>Closing hari Senin – Jumat pukul 14.30 | Sabtu pukul 11.30</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-stone-400 font-bold">•</span>
              <span>Pemesanan di luar jam operasional akan diproses esok hari.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-stone-400 font-bold">•</span>
              <span>Tidak ada pengiriman di hari Minggu dan tanggal merah.</span>
            </li>
          </ul>
        )}
      </div>

      {/* Hashtags */}
      {hashtags && hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {hashtags.map((tag, idx) => (
            <span key={idx} className="text-xs text-amber-700 bg-amber-50 font-medium px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
