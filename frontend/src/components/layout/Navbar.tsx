"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Search, Menu, User, Heart, Package, ChevronDown, X, ExternalLink, ArrowUpRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useSearchStore } from "@/store/searchStore";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function ShopeeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path
        fill="#EE4D2D"
        d="M26.4 9.6h-5.2V7.7C21.2 4.4 18.8 2 16 2S10.8 4.4 10.8 7.7v1.9H5.6C4.7 9.6 4 10.3 4 11.2l1.6 17.1c.1.9.8 1.7 1.7 1.7h17.4c.9 0 1.6-.7 1.7-1.7l1.6-17.1c0-.9-.7-1.6-1.6-1.6zM12.8 7.7c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2v1.9h-6.4V7.7zm3.2 17.5c-2.4 0-4.3-.9-5.4-1.7l1.2-2.1c.9.7 2.4 1.4 4.1 1.4 1.7 0 2.5-.7 2.5-1.5 0-2.4-7.4-1.3-7.4-6.1 0-2.6 2.1-4.3 5-4.3 2.1 0 3.8.7 4.7 1.4l-1.1 2c-.8-.6-2.1-1.1-3.6-1.1-1.5 0-2.4.7-2.4 1.5 0 2.2 7.4 1.3 7.4 6 0 2.7-2.2 4.5-5 4.5z"
      />
    </svg>
  );
}

function TokopediaIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path
        fill="#03AC0E"
        d="M27.2 8.4h-3.9L20.8 3.5c-.3-.4-.8-.6-1.3-.6H12.5c-.5 0-1 .2-1.3.6L8.7 8.4H4.8C3.8 8.4 3 9.2 3 10.2v16c0 1 .8 1.8 1.8 1.8h22.4c1 0 1.8-.8 1.8-1.8v-16c0-1-.8-1.8-1.8-1.8zM13.2 5.5h5.6l1.8 2.9h-9.2l1.8-2.9zm13.9 20.7H4.9V10.3h22.2v15.9z"
      />
      <circle cx="11.5" cy="15.5" r="2" fill="#03AC0E" />
      <circle cx="20.5" cy="15.5" r="2" fill="#03AC0E" />
      <path
        stroke="#03AC0E"
        strokeWidth="2"
        strokeLinecap="round"
        d="M12.5 20c1.2 1.2 3.8 1.8 6 0"
      />
    </svg>
  );
}

function TikTokIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.901 2.89 2.893 2.893 0 0 1-2.89-2.89 2.893 2.893 0 0 1 2.89-2.89c.376 0 .736.07 1.066.2v-3.52a6.38 6.38 0 0 0-1.066-.092 6.338 6.338 0 0 0-6.333 6.333A6.338 6.338 0 0 0 9.477 22a6.338 6.338 0 0 0 6.333-6.333V9.012a8.216 8.216 0 0 0 4.779 1.516v-3.48a4.819 4.819 0 0 1-1.000-.362z" />
    </svg>
  );
}

const CATEGORIES = [
  { name: "Grade A", href: "/shop?category=Grade A" },
  { name: "Grade B", href: "/shop?category=Grade B" },
  { name: "Tulle", href: "/shop?category=Tulle" },
  { name: "Brukat Tile Mutiara", href: "/shop?category=Grade A" },
  { name: "Renda Chantilly", href: "/shop?category=Grade B" },
  { name: "Cornely 3D", href: "/shop?category=Tulle" },
  { name: "Silk & Satin Furing", href: "/shop?category=Tulle" },
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
  const [isLogoHovered, setIsLogoHovered] = useState(false);
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

          {/* Left: Logo with Hover Marketplace Popover */}
          <div 
            className="relative flex-1 md:flex-none text-center md:text-left flex items-center"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <Link href="/" className="inline-flex items-center justify-center group" aria-label="Raja Brukat Home">
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

            {/* Hover Marketplace & Social Popover Card */}
            <AnimatePresence>
              {isLogoHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-0 pt-2 z-50 min-w-[210px] hidden md:block"
                >
                  <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 pb-1 border-b border-stone-100 flex items-center justify-between">
                      <span>Toko Resmi Raja Brukat</span>
                      <ExternalLink className="w-3 h-3 text-[#b77305]" />
                    </div>

                    <a
                      href="https://shopee.co.id/rajabrukat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors group/item"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShopeeIcon className="w-4 h-4 text-orange-500" />
                        <span>Shopee Official</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-orange-400 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-transform stroke-[2.5]" />
                    </a>

                    <a
                      href="https://tokopedia.com/rajabrukat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors group/item"
                    >
                      <div className="flex items-center gap-2.5">
                        <TokopediaIcon className="w-4 h-4 text-emerald-500" />
                        <span>Tokopedia Official</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-transform stroke-[2.5]" />
                    </a>

                    <a
                      href="https://tiktok.com/@rajabrukatofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-900 hover:bg-stone-100 transition-colors group/item"
                    >
                      <div className="flex items-center gap-2.5">
                        <TikTokIcon className="w-4 h-4 text-stone-900" />
                        <span>TikTok Official</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-transform stroke-[2.5]" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation (Home, Shop, Categories ▾, FAQ, Contact Us) */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-[16px] font-medium">
            <Link 
              href="/" 
              className={cn(
                "relative py-2 font-medium transition-colors group",
                pathname === "/" ? "text-[#b77305]" : "text-stone-800 hover:text-[#b77305]"
              )}
            >
              <span>Home</span>
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-[#b77305] transition-all duration-300 ease-out group-hover:w-full",
                pathname === "/" ? "w-full" : "w-0"
              )} />
            </Link>

            <Link 
              href="/shop" 
              className={cn(
                "relative py-2 font-medium transition-colors group",
                pathname.startsWith("/shop") && !pathname.includes("category=") ? "text-[#b77305]" : "text-stone-800 hover:text-[#b77305]"
              )}
            >
              <span>Shop</span>
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-[#b77305] transition-all duration-300 ease-out group-hover:w-full",
                pathname.startsWith("/shop") && !pathname.includes("category=") ? "w-full" : "w-0"
              )} />
            </Link>

            {/* Categories Dropdown */}
            <div 
              className="relative group py-2"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button 
                className={cn(
                  "relative inline-flex items-center gap-1 font-medium transition-colors focus:outline-none",
                  pathname.includes("category=") || pathname.startsWith("/collections") ? "text-[#b77305]" : "text-stone-800 hover:text-[#b77305]"
                )}
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 text-[#b77305] group-hover:rotate-180 transition-transform duration-200" />
                <span className={cn(
                  "absolute bottom-0 left-0 h-0.5 bg-[#b77305] transition-all duration-300 ease-out group-hover:w-full",
                  pathname.includes("category=") || pathname.startsWith("/collections") ? "w-full" : "w-0"
                )} />
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
                "relative py-2 font-medium transition-colors group",
                pathname === "/pages/faq" ? "text-[#b77305]" : "text-stone-800 hover:text-[#b77305]"
              )}
            >
              <span>FAQ</span>
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-[#b77305] transition-all duration-300 ease-out group-hover:w-full",
                pathname === "/pages/faq" ? "w-full" : "w-0"
              )} />
            </Link>

            <Link 
              href="/pages/contact" 
              className={cn(
                "relative py-2 font-medium transition-colors group",
                pathname === "/pages/contact" ? "text-[#b77305]" : "text-stone-800 hover:text-[#b77305]"
              )}
            >
              <span>Contact Us</span>
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-[#b77305] transition-all duration-300 ease-out group-hover:w-full",
                pathname === "/pages/contact" ? "w-full" : "w-0"
              )} />
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
