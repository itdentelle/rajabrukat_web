import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
});

export const metadata: Metadata = {
  title: "Raja Brukat - Kain Brukat & Lace Premium",
  description: "Pusat Grosir & Eceran Kain Brukat, Tile Mutiara, Renda Chantilly, dan Silk Mewah untuk Kebaya & Gaun Pesta.",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)]">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <Toaster position="top-center" />
          <CartDrawer />
          <SearchDrawer />
          <ClientLayout>{children}</ClientLayout>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
