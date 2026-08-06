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

  if (!cleaned || cleaned.length < 3) {
    cleaned = "Brukat Premium Eksklusif";
  }

  // Ensure the title sounds like a fabric product if it's too generic
  let displayTitle = cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const lowerTitle = displayTitle.toLowerCase();
  const fabricKeywords = ["brukat", "tile", "renda", "satin", "cornely", "kain", "tulle", "lace", "panel", "metalic", "metallic"];
  const hasFabricKeyword = fabricKeywords.some(keyword => lowerTitle.includes(keyword));

  if (!hasFabricKeyword) {
    // If it's too generic, prepend "Brukat "
    displayTitle = `Brukat ${displayTitle}`;
  }

  return { displayTitle, code };
}
