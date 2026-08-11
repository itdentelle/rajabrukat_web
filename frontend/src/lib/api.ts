const getApiUrl = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    }
  }
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  url = url.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

export const API_BASE_URL = getApiUrl();
