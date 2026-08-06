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

  // Extract Product Information
  let infoText = "";
  const infoMatch = rawText.match(/INFORMASI PRODUK\s*:\s*([\s\S]*?)(?=CATATAN PENGIRIMAN|#|$)/i);
  if (infoMatch) {
    infoText = infoMatch[1].trim();
  } else {
    // Clean out known header strings if no explicit INFORMASI PRODUK tag exists
    infoText = rawText
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
  const hasStructuredSections = lengthVal || widthVal || gradeMatch || infoText || shippingText;

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
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          {lengthVal && (
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Panjang Kain</p>
                <p className="text-xs font-semibold text-gray-800">{lengthVal}</p>
              </div>
            </div>
          )}
          {widthVal && (
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700">
                <Ruler className="w-4 h-4 rotate-90" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Lebar Kain</p>
                <p className="text-xs font-semibold text-gray-800">{widthVal}</p>
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

      {/* Product Description Body */}
      {infoText && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Detail & Keunggulan Produk</h4>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
            {infoText}
          </p>
        </div>
      )}

      {/* Shipping Note */}
      {shippingText && (
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Truck className="w-4 h-4 text-gray-600" />
            <span>Catatan Pengiriman</span>
          </div>
          <p className="leading-relaxed pl-6 whitespace-pre-line">
            {shippingText.replace(/•/g, "\n• ").trim()}
          </p>
        </div>
      )}

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
