export function cleanImageUrl(url?: string | null, fallback: string = "/images/white_lace_hero.png"): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return fallback;
  }
  let trimmed = url.trim();

  // If already absolute URL (Supabase, Unsplash, external HTTPS, or base64 data URL)
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("data:")) {
    // If it's pointing to localhost in a browser that is on a remote domain, strip or redirect
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      if (trimmed.startsWith("http://localhost:5000") || trimmed.startsWith("http://127.0.0.1:5000")) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        if (apiUrl && !apiUrl.includes("localhost") && !apiUrl.includes("127.0.0.1")) {
          return trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, apiUrl.replace(/\/$/, ""));
        }
      }
    }
    return trimmed;
  }

  // If pointing to a relative uploads path that might not exist on disk, fallback safely
  if (trimmed.startsWith("/uploads/upload_")) {
    return fallback;
  }

  // If relative path starts with /uploads/ or /scraped-images/, prefix with NEXT_PUBLIC_API_URL if available in production
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/scraped-images/")) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && !apiUrl.includes("localhost") && !apiUrl.includes("127.0.0.1")) {
      return `${apiUrl.replace(/\/$/, "")}${trimmed}`;
    }
  }

  return trimmed;
}
