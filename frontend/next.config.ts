import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
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
