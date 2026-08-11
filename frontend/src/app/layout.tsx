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
  title: "Raja Brukat - Kain Brukat & Lace Premium",
  description: "Pusat Grosir & Eceran Kain Brukat, Tile Mutiara, Renda Chantilly, dan Silk Mewah untuk Kebaya & Gaun Pesta.",
  keywords: ["kain brukat", "tile mutiara", "renda chantilly", "silk satin", "kebaya pengantin", "gaun pesta"],
  openGraph: {
    title: "Raja Brukat - Kain Brukat & Lace Premium",
    description: "Pusat Grosir & Eceran Kain Brukat, Tile Mutiara, Renda Chantilly, dan Silk Mewah untuk Kebaya & Gaun Pesta.",
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

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <>
      <Toaster position="top-center" />
      <CartDrawer />
      <SearchDrawer />
      <ClientLayout>{children}</ClientLayout>
    </>
  );

  return (
    <html lang="id" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#b77305" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden overscroll-x-none">
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {content}
          </GoogleOAuthProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
