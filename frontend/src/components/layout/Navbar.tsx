"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Search, Menu, User, Heart, Package } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useSearchStore } from "@/store/searchStore";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useCartStore((state) => state.openCart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const openSearch = useSearchStore((state) => state.openSearch);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserRole(parsed?.role || null);
      } else {
        setUserRole(null);
      }
    } catch (e) {
      setUserRole(null);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Fetch synced cart from database if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      fetchCart();
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchCart]);

  const isTransparentPage = pathname === "/" || pathname === "/collections";
  const isTransparent = isTransparentPage && !scrolled;

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white border-b border-gray-100 py-3 shadow-sm text-stone-900"
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Left: Mobile Menu */}
        <div className="md:hidden flex items-center">
          <button className="p-2 -ml-2 text-stone-900" aria-label="Open Mobile Menu" suppressHydrationWarning>
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Center/Left: Logo Only (Natural Shape) */}
        <div className="flex-1 md:flex-none text-center md:text-left">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity group" aria-label="Raja Brukat Home">
            <div className="relative h-11 md:h-14 w-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image 
                src="/images/logo_rajabrukat-removebg-preview.png" 
                alt="Raja Brukat Logo" 
                width={80} 
                height={56} 
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link 
            href="/shop" 
            className={cn(
              "text-sm font-bold uppercase tracking-widest hover:opacity-70 transition-all",
              pathname.startsWith("/shop") ? "border-b-2 border-current pb-1" : ""
            )}
          >
            Shop
          </Link>
          <Link 
            href="/collections" 
            className={cn(
              "text-sm font-bold uppercase tracking-widest hover:opacity-70 transition-all",
              pathname.startsWith("/collections") ? "border-b-2 border-current pb-1" : ""
            )}
          >
            Collections
          </Link>
          <Link 
            href="/about" 
            className={cn(
              "text-sm font-bold uppercase tracking-widest hover:opacity-70 transition-all",
              pathname.startsWith("/about") ? "border-b-2 border-current pb-1" : ""
            )}
          >
            About
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={openSearch}
            className="p-2 hover:opacity-70 transition-opacity hidden md:block"
            aria-label="Search Products"
            suppressHydrationWarning
          >
            <Search className="w-5 h-5" />
          </button>
          
          <Link href={userRole === 'ADMIN' ? "/admin/dashboard" : "/profile"} className="p-2 hover:opacity-70 transition-opacity hidden md:block" aria-label="User Profile" title="Profile">
            <User 
              className="w-5 h-5 transition-all" 
              fill={pathname.startsWith("/profile") ? "currentColor" : "none"} 
              strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2}
            />
          </Link>
          
          {isLoggedIn && (
            <>
              <Link href={userRole === 'ADMIN' ? "/admin/orders" : "/orders"} className="p-2 hover:opacity-70 transition-opacity hidden md:block" aria-label="My Orders" title="My Orders">
                <Package 
                  className="w-5 h-5 transition-all" 
                  fill={pathname.startsWith("/orders") ? "currentColor" : "none"}
                  strokeWidth={pathname.startsWith("/orders") ? 2.5 : 2}
                />
              </Link>

              <Link href="/wishlist" className="p-2 hover:opacity-70 transition-opacity hidden md:block" aria-label="Wishlist" title="Wishlist">
                <Heart 
                  className="w-5 h-5 transition-all" 
                  fill={pathname.startsWith("/wishlist") ? "currentColor" : "none"}
                  strokeWidth={pathname.startsWith("/wishlist") ? 2.5 : 2}
                />
              </Link>
            </>
          )}

          <button 
            className="p-2 hover:opacity-70 transition-opacity relative"
            aria-label="View Cart"
            onClick={openCart}
            suppressHydrationWarning
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
