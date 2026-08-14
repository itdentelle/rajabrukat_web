export function cleanImageUrl(url?: string | null, fallback: string = "/images/white_lace_hero.png"): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return fallback;
  }
  let trimmed = url.trim();
  // Convert http://localhost:5000/uploads/... and http://127.0.0.1:5000/uploads/... to relative /uploads/...
  if (trimmed.startsWith("http://localhost:5000") || trimmed.startsWith("http://127.0.0.1:5000")) {
    trimmed = trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, "");
  }
  return trimmed;
}
