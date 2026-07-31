"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { useEffect, useState } from "react";

if (typeof window !== "undefined" && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function () {
    let [resource, config] = arguments;
    if (typeof resource === 'string' && resource.startsWith('http://localhost:5000')) {
      config = config || {};
      config.credentials = 'include';
    }
    return await originalFetch(resource, config);
  };
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="min-h-screen flex flex-col">{children}</main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
