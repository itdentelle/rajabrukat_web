// Clean raw SEO title into an elegant e-commerce product name
export function cleanTitle(rawName: string): { displayTitle: string; code?: string } {
  if (!rawName) return { displayTitle: "Kain Brukat Premium" };

  let text = rawName.replace(/^https?:\/\/[^\s]+/i, "").trim();

  // Extract Code if present (e.g. [ KODE 5486 ] or KODE 5791)
  const codeMatch = text.match(/\[?\s*KODE\s*(\d+[A-Z]?)\s*\]?/i);
  const code = codeMatch ? `Kode ${codeMatch[1]}` : undefined;

  // Strip noise keywords & repetitive tags
  let cleaned = text
    .replace(/\[?\s*KODE\s*\d+[A-Z]?\s*\]?/gi, "")
    .replace(/–|-|—/g, " ")
    .replace(/GRADE\s+[AB]/gi, "")
    .replace(/BAHAN\s+KEBAYA/gi, "")
    .replace(/KEBAYA\s+MODERN/gi, "")
    .replace(/GAUN\s+PENGANTIN/gi, "")
    .replace(/FASHION\s+MODERN/gi, "")
    .replace(/PREMIUM\s+QUALITY/gi, "")
    .replace(/NO\s+OB\s+[A-Z0-9\/]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 1) {
    cleaned = rawName || "Kain Brukat Premium";
  }

  return { displayTitle: cleaned, code };
}
