"use client";

import Link from "next/link";
import { LayoutDashboard, Package, Settings, LogOut, ShoppingBag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", { method: "POST" });
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block sticky top-0 h-screen overflow-y-auto">
        <div className="min-h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Link href="/admin/products" className="text-xl font-black tracking-tighter uppercase">
              Admin Panel
            </Link>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-1">
            <Link
              href="/admin"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/admin' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <LayoutDashboard className={`mr-3 h-5 w-5 ${pathname === '/admin' ? 'text-white' : 'text-gray-400'}`} />
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/admin/products' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Package className={`mr-3 h-5 w-5 ${pathname === '/admin/products' ? 'text-white' : 'text-gray-400'}`} />
              Products
            </Link>
            <Link
              href="/admin/orders"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/admin/orders' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ShoppingBag className={`mr-3 h-5 w-5 ${pathname === '/admin/orders' ? 'text-white' : 'text-gray-400'}`} />
              Orders
            </Link>
            <Link
              href="/admin/banner"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/admin/banner' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <LayoutDashboard className={`mr-3 h-5 w-5 ${pathname === '/admin/banner' ? 'text-white' : 'text-gray-400'}`} />
              Site CMS
            </Link>
            <Link
              href="/admin/collections"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/admin/collections' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <LayoutDashboard className={`mr-3 h-5 w-5 ${pathname === '/admin/collections' ? 'text-white' : 'text-gray-400'}`} />
              Collections
            </Link>
            <Link
              href="/admin/settings"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/admin/settings' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Settings className={`mr-3 h-5 w-5 ${pathname === '/admin/settings' ? 'text-white' : 'text-gray-400'}`} />
              Settings
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500" />
              Logout
            </button>
            <Link
              href="/"
              className="mt-2 flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Package className="mr-3 h-5 w-5 text-gray-400" />
              Storefront
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
