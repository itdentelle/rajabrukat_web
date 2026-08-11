"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  ShoppingBag,
  Menu,
  X,
  Store,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { API_BASE_URL } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Skip auth check if we're on the login page itself
    if (pathname === "/admin/login") {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    useCartStore.getState().clearCart();
    router.push("/");
  };

  if (!isAuthenticated) return null;

  // Don't show the sidebar if we are on the login page
  if (pathname === "/admin/login") {
    return <main>{children}</main>;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products Catalog", icon: Package },
    { href: "/admin/orders", label: "Customer Orders", icon: ShoppingBag },
    { href: "/admin/banner", label: "Site CMS Banner", icon: SlidersHorizontal },
    { href: "/admin/settings", label: "Store Settings", icon: Settings },
  ];


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-stone-100/60 text-stone-900 font-sans">
      
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/admin/products" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[#b77305] text-white flex items-center justify-center font-bold text-xs">
            RB
          </span>
          <span className="text-base font-black tracking-tight text-stone-900 uppercase">
            Admin Panel
          </span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar (Desktop Sticky + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-72 md:w-64 h-screen bg-white border-r border-stone-200 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="min-h-full flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-stone-200 bg-stone-50/50">
              <Link href="/admin/products" className="flex items-center gap-2.5">
                <div className="w-9 h-9 relative flex items-center justify-center shrink-0">
                  <Image
                    src="/images/logo_rajabrukat-removebg-preview.png"
                    alt="Raja Brukat Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wider text-stone-900 uppercase">
                    Raja Brukat
                  </span>
                  <span className="text-[10px] text-[#b77305] font-semibold tracking-widest uppercase">
                    Admin Portal
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="py-6 px-4 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#b77305] text-white shadow-md shadow-[#b77305]/20 scale-[1.01]"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <Icon className={`mr-3.5 h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-stone-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-stone-200 bg-stone-50/30 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center px-4 py-2.5 text-xs font-bold rounded-xl text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <Store className="mr-3 h-4 w-4 text-[#b77305]" />
              <span>Preview Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4 text-rose-500" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
