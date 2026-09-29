export function cleanImageUrl(url?: string | null, fallback: string = "/images/white_lace_hero.png"): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return fallback;
  }
  let trimmed = url.trim();

  // If pointing to /uploads/ or /scraped-images/ anywhere (absolute or relative), normalize to relative path
  if (trimmed.includes("/uploads/")) {
    return trimmed.slice(trimmed.indexOf("/uploads/"));
  }
  if (trimmed.includes("/scraped-images/")) {
    return trimmed.slice(trimmed.indexOf("/scraped-images/"));
  }

  // If already absolute URL (Supabase, Unsplash, external HTTPS, or base64 data URL)
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Ensure relative path starts with /
  if (!trimmed.startsWith("/")) {
    trimmed = `/${trimmed}`;
  }

  return trimmed;
}
