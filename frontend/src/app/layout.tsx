import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import SearchDrawer from "@/components/layout/SearchDrawer";
import ClientLayout from "@/components/layout/ClientLayout";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Raja Brukat - Grosir & Satuan Kain Brukat",
  description: "Pusat grosir dan eceran kain brukat berkualitas. Koleksi brukat terlengkap dengan berbagai motif yang indah dan elegan dengan harga yang terjangkau.",
  keywords: [
    "raja brukat",
    "kain brukat bandung",
    "grosir kain brukat bandung barat",
    "eceran kain brukat bandung",
    "kain brukat berkualitas",
    "brukat tile mutiara",
    "renda chantilly",
    "brukat cornely 3d",
    "silk satin furing",
    "kain kebaya pengantin",
    "kain gaun pesta",
    "bahan kebaya wisuda",
    "grosir kain bandung barat",
    "toko kain brukat bandung"
  ],
  openGraph: {
    title: "Raja Brukat - Grosir & Satuan Kain Brukat",
    description: "Pusat grosir dan eceran kain brukat berkualitas. Koleksi brukat terlengkap dengan berbagai motif yang indah dan elegan dengan harga yang terjangkau.",
    type: "website",
    locale: "id_ID",
    siteName: "Raja Brukat",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#b77305" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preload" href="/images/white_lace_hero.webp" as="image" type="image/webp" fetchPriority="high" />
        <link rel="preload" href="/images/logo_rajabrukat-removebg-preview.png" as="image" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Raja Brukat",
              "image": "http://localhost:3000/images/logo_rajabrukat-removebg-preview.png",
              "description": "Pusat grosir dan eceran kain brukat berkualitas. Koleksi brukat terlengkap dengan berbagai motif yang indah dan elegan dengan harga yang terjangkau.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bandung Barat",
                "addressRegion": "Jawa Barat",
                "addressCountry": "ID"
              },
              "priceRange": "Rp",
              "telephone": "+6285881667778",
              "url": "http://localhost:3000"
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden overscroll-x-none">
        <Toaster position="top-center" />
        <CartDrawer />
        <SearchDrawer />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
