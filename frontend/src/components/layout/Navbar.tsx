"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Search, Menu, User, Heart, Package, ChevronDown, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useSearchStore } from "@/store/searchStore";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Panel A Grade", href: "/shop?category=Panel A Grade" },
  { name: "Panel B Grade", href: "/shop?category=Panel B Grade" },
  { name: "Tulle", href: "/shop?category=Tulle" },
  { name: "Brukat Tile Mutiara", href: "/shop?category=Brukat Tile Mutiara" },
  { name: "Renda Chantilly", href: "/shop?category=Renda Chantilly" },
  { name: "Cornely 3D", href: "/shop?category=Cornely 3D" },
  { name: "Silk & Satin Furing", href: "/shop?category=Furing %26 Silk" },
];

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useCartStore((state) => state.openCart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const openSearch = useSearchStore((state) => state.openSearch);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
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

    const token = localStorage.getItem("token");
    if (token) {
      fetchCart();
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchCart]);

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white border-b border-gray-100 py-3 shadow-sm text-stone-900"
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-full">
          {/* Left: Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 -ml-2 text-stone-900" 
              aria-label="Open Mobile Menu" 
              suppressHydrationWarning
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Left: Logo Only */}
          <div className="flex-1 md:flex-none text-center md:text-left flex items-center">
            <Link href="/" className="inline-flex items-center justify-center hover:opacity-80 transition-opacity group" aria-label="Raja Brukat Home">
              <div className="relative h-9 md:h-11 w-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image 
                  src="/images/logo_rajabrukat-removebg-preview.png" 
                  alt="Raja Brukat Logo" 
                  width={80} 
                  height={56} 
                  className="h-full w-auto object-contain block my-auto"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (Home, Shop, Categories ▾, FAQ, Contact Us) */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-[16px] font-medium">
            <Link 
              href="/" 
              className={cn(
                "hover:text-[#b77305] transition-colors py-2",
                pathname === "/" ? "text-[#b77305] font-semibold" : "text-stone-800"
              )}
            >
              Home
            </Link>

            <Link 
              href="/shop" 
              className={cn(
                "hover:text-[#b77305] transition-colors py-2",
                pathname.startsWith("/shop") && !pathname.includes("category=") ? "text-[#b77305] font-semibold" : "text-stone-800"
              )}
            >
              Shop
            </Link>

            {/* Categories Dropdown */}
            <div 
              className="relative group py-2"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button 
                className={cn(
                  "inline-flex items-center gap-1 hover:text-[#b77305] transition-colors text-[#b77305] font-medium focus:outline-none",
                  pathname.includes("category=") || pathname.startsWith("/collections") ? "font-semibold" : ""
                )}
              >
                Categories
                <ChevronDown className="w-4 h-4 text-[#b77305] group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {/* Dropdown Card */}
              {isCategoriesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-52 z-50">
                  <div className="bg-white rounded-md shadow-xl border border-gray-100 py-2 overflow-hidden transition-all animate-in fade-in-50 slide-in-from-top-2">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="block px-5 py-2.5 text-sm text-stone-700 hover:text-[#b77305] hover:bg-amber-50/60 transition-colors border-b border-stone-50 last:border-0"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/pages/faq" 
              className={cn(
                "hover:text-[#b77305] transition-colors py-2",
                pathname === "/pages/faq" ? "text-[#b77305] font-semibold" : "text-stone-800"
              )}
            >
              FAQ
            </Link>

            <Link 
              href="/pages/contact" 
              className={cn(
                "hover:text-[#b77305] transition-colors py-2",
                pathname === "/pages/contact" ? "text-[#b77305] font-semibold" : "text-stone-800"
              )}
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={openSearch}
              className="p-2 hover:text-[#b77305] transition-colors hidden md:block"
              aria-label="Search Products"
              suppressHydrationWarning
            >
              <Search className="w-5 h-5" />
            </button>
            
            <Link href={userRole === 'ADMIN' ? "/admin/dashboard" : "/profile"} className="p-2 hover:text-[#b77305] transition-colors hidden md:block" aria-label="User Profile" title="Profile">
              <User 
                className="w-5 h-5 transition-all" 
                fill={pathname.startsWith("/profile") ? "currentColor" : "none"} 
                strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2}
              />
            </Link>
            
            {isLoggedIn && (
              <>
                <Link href={userRole === 'ADMIN' ? "/admin/orders" : "/orders"} className="p-2 hover:text-[#b77305] transition-colors hidden md:block" aria-label="My Orders" title="My Orders">
                  <Package 
                    className="w-5 h-5 transition-all" 
                    fill={pathname.startsWith("/orders") ? "currentColor" : "none"}
                    strokeWidth={pathname.startsWith("/orders") ? 2.5 : 2}
                  />
                </Link>

                <Link href="/wishlist" className="p-2 hover:text-[#b77305] transition-colors hidden md:block" aria-label="Wishlist" title="Wishlist">
                  <Heart 
                    className="w-5 h-5 transition-all" 
                    fill={pathname.startsWith("/wishlist") ? "currentColor" : "none"}
                    strokeWidth={pathname.startsWith("/wishlist") ? 2.5 : 2}
                  />
                </Link>
              </>
            )}

            <button 
              className="p-2 hover:text-[#b77305] transition-colors relative"
              aria-label="View Cart"
              onClick={openCart}
              suppressHydrationWarning
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#b77305] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="relative bg-white w-4/5 max-w-xs h-full shadow-2xl p-6 flex flex-col z-10 overflow-y-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <Image 
                src="/images/logo_rajabrukat-removebg-preview.png" 
                alt="Raja Brukat Logo" 
                width={70} 
                height={45} 
                className="h-8 w-auto object-contain"
              />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 text-stone-500 hover:text-stone-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-4 text-base font-medium text-stone-800">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#b77305] py-2 border-b border-stone-100"
              >
                Home
              </Link>
              <Link 
                href="/shop" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#b77305] py-2 border-b border-stone-100"
              >
                Shop
              </Link>

              <div>
                <button 
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="w-full flex items-center justify-between py-2 border-b border-stone-100 text-[#b77305]"
                >
                  Categories
                  <ChevronDown className={cn("w-4 h-4 transition-transform", mobileCategoriesOpen ? "rotate-180" : "")} />
                </button>
                {mobileCategoriesOpen && (
                  <div className="pl-4 py-2 space-y-2 bg-stone-50 rounded-md mt-1">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-1.5 text-sm text-stone-700 hover:text-[#b77305]"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link 
                href="/pages/faq" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#b77305] py-2 border-b border-stone-100"
              >
                FAQ
              </Link>

              <Link 
                href="/pages/contact" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#b77305] py-2"
              >
                Contact Us
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

