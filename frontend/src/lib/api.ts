const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // In browser on production domain or IP:
    // Returning "" (empty string) means requests like `${API_BASE_URL}/api/...`
    // become relative `/api/...`, automatically using the current protocol (HTTPS)
    // and current hostname (rajabrukat.com). This 100% prevents Mixed Content and CORS errors!
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return "";
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  }

  // On server-side (Node.js SSR)
  let url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001";
  url = url.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

export const API_BASE_URL = getApiUrl();

