// Utility to clean raw scraped e-commerce descriptions into elegant summary text (max 3 sentences)
export function cleanDescription(rawText?: string): string {
  if (!rawText) {
    return "Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul dan payet kilau eksklusif. Sempurna untuk busana pesta, wisuda, dan seragam keluarga. Pilihan utama para desainer untuk keindahan gaun & kebaya mewah.";
  }

  let text = rawText;

  // Extract content inside "INFORMASI PRODUK :" if present
  const infoMatch = text.match(/INFORMASI PRODUK\s*:\s*([^#]+)/i);
  if (infoMatch && infoMatch[1].trim().length > 15) {
    text = infoMatch[1].trim();
  }

  // Remove hashtags
  text = text.replace(/#[^\s#]+/g, "").trim();

  // Remove CATATAN PENGIRIMAN block
  text = text.replace(/CATATAN PENGIRIMAN[\s\S]*/i, "").trim();

  // Remove KETERANGAN GRADE block
  text = text.replace(/KETERANGAN GRADE[\s\S]*?(?=INFORMASI PRODUK|$)/i, "").trim();

  // Remove raw stock / code prefixes
  text = text
    .replace(/^Informasi Kain\s*:\s*/i, "")
    .replace(/Kain\s*:\s*/gi, "")
    .replace(/\[\s*Kode\s*\d+[A-Z]?\s*\]/gi, "")
    .replace(/NO\s+OB\s+[A-Z0-9\/]+/gi, "")
    .replace(/Panjang\s+1\s+Kain\s*:[\s\S]*?SUB TOTAL[^\n]+/gi, "")
    .replace(/SUB TOTAL[^\n]+/gi, "")
    .replace(/---\s*KETERANGAN LENGKAP[^\n]+/gi, "")
    .replace(/Description\s*/gi, "")
    .replace(/Informasi Produk\s*:\s*/gi, "")
    .replace(/Mohon toleransi perbedaan warna[\s\S]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Split into sentences and strictly take at most 3 sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !s.toLowerCase().includes("closing") && !s.toLowerCase().includes("pemesanan"));

  if (sentences.length > 0) {
    text = sentences.slice(0, 3).join(" ");
  }

  if (!text || text.length < 15) {
    return "Serat renda dan brukat kualitas impor yang sangat halus, ringan, dan tidak gatal. Kerapatan bordir presisi diperkaya dengan taburan mutiara timbul. Pilihan utama untuk gaun pesta, wisuda & kebaya pengantin.";
  }

  return text;
}
