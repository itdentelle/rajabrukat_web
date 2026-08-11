"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    if (lastLoggedPath.current === pathname) {
      return;
    }

    lastLoggedPath.current = pathname;

    const logVisitor = async () => {
      try {
        const payload = JSON.stringify({
          path: pathname,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        });

        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(`${API_BASE_URL}/api/analytics/log`, blob);
        } else {
          await fetch(`${API_BASE_URL}/api/analytics/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          });
        }
      } catch (err) {
        // Silently catch analytics errors so user experience is uninterrupted
      }
    };

    logVisitor();
  }, [pathname]);

  return null;
}
