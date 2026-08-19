"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Lazy-load non-critical floating interactive widgets (zero impact on initial TBT & LCP)
const FloatingSocialWidget = dynamic(() => import("./FloatingSocialWidget"), { ssr: false });
const AiChatWidget = dynamic(() => import("../ai/AiChatWidget"), { ssr: false });

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

if (typeof window !== "undefined" && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function () {
    let [resource, config] = arguments;
    if (
      typeof resource === "string" &&
      (resource.startsWith("http://localhost:5000") || (API_BASE_URL && resource.startsWith(API_BASE_URL)))
    ) {
      config = config || {};
      config.credentials = "include";
    }
    return await originalFetch(resource, config);
  };
}

import SmoothScrollProvider from "../providers/SmoothScrollProvider";
import VisitorTracker from "../analytics/VisitorTracker";
import InitialPageLoader from "./InitialPageLoader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isAdminRoute) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <SmoothScrollProvider>
      <InitialPageLoader />
      {mounted && <VisitorTracker />}
      <Navbar />
      <main className="min-h-screen flex flex-col">{children}</main>
      <Footer />
      {mounted && (
        <>
          <FloatingSocialWidget />
          <AiChatWidget />
        </>
      )}
    </SmoothScrollProvider>
  );
}

