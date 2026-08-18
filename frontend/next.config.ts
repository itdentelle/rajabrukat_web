import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 80],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5001",
      },
      {
        protocol: "https",
        hostname: "rajabrukat.com",
      },
      {
        protocol: "http",
        hostname: "rajabrukat.com",
      },
      {
        protocol: "https",
        hostname: "*.rajabrukat.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.up.railway.app",
      },
      {
        protocol: "https",
        hostname: "*.railway.app",
      },
      {
        protocol: "https",
        hostname: "ykzpelepxkrkzbxlrydi.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/**",
      }
    ]
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const cleanApiUrl = apiUrl.replace(/\/$/, "");
    return [
      {
        source: "/uploads/:path*",
        destination: `${cleanApiUrl}/uploads/:path*`,
      },
      {
        source: "/scraped-images/:path*",
        destination: `${cleanApiUrl}/scraped-images/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  devIndicators: false,
  // Turbopack alias (Next.js 15+ top-level key)
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/canvas-shim.ts",
    },
  },
  // Webpack alias (for `next build` or non-Turbopack dev)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
