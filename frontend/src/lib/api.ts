const getApiUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "https://rajabrukatweb-production.up.railway.app";
  url = url.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

export const API_BASE_URL = getApiUrl();
