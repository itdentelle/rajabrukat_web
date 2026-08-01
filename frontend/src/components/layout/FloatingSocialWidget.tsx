"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, MessageCircle } from "lucide-react";

// Custom SVG Icons for Brands
function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
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

const SOCIAL_ITEMS = [
  {
    id: "whatsapp",
    label: "Hot Line : +62 858-8166-7778",
    handle: "+62 858-8166-7778",
    icon: Phone,
    color: "bg-emerald-600 hover:bg-emerald-500 text-white",
    link: "https://wa.me/6285881667778",
  },
  {
    id: "instagram",
    label: "Instagram : rajabrukat_id",
    handle: "rajabrukat_id",
    customIcon: InstagramIcon,
    color: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white",
    link: "https://instagram.com/rajabrukat_id",
  },
  {
    id: "facebook",
    label: "Facebook : Raja Brukat",
    handle: "Raja Brukat",
    customIcon: FacebookIcon,
    color: "bg-blue-600 hover:bg-blue-500 text-white",
    link: "https://facebook.com/rajabrukat",
  },
  {
    id: "tiktok",
    label: "TikTok : Raja Brukat Official",
    handle: "Raja Brukat Official",
    customIcon: TikTokIcon,
    color: "bg-stone-900 hover:bg-stone-800 text-white border border-stone-700",
    link: "https://tiktok.com/@rajabrukatofficial",
  },
];

export default function FloatingSocialWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Expanded Speed Dial List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-3 mb-3.5 items-end"
          >
            {SOCIAL_ITEMS.map((item, index) => {
              const IconComp = item.icon;
              const CustomIcon = item.customIcon;

              return (
                <motion.a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 15, scale: 0.8 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                  className="flex items-center flex-row-reverse gap-3 group"
                >
                  {/* Floating Action Button */}
                  <div
                    className={`w-11 h-11 rounded-full ${item.color} shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95`}
                  >
                    {IconComp ? (
                      <IconComp className="w-5 h-5 stroke-[2]" />
                    ) : CustomIcon ? (
                      <CustomIcon className="w-5 h-5" />
                    ) : null}
                  </div>

                  {/* Handle Text Badge Pill */}
                  <div className="px-3.5 py-1.5 rounded-full bg-stone-950/90 backdrop-blur-md border border-stone-800 text-xs font-medium text-white shadow-xl flex items-center gap-2 group-hover:border-[#b77305] transition-colors whitespace-nowrap">
                    <span className="text-stone-200 font-semibold">{item.label}</span>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bottom-Right Floating Trigger Circle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Social Media Contacts"
        className="relative w-14 h-14 rounded-full bg-[#b77305] hover:bg-[#965e04] text-white shadow-[0_10px_25px_rgba(183,115,5,0.4)] flex items-center justify-center border-2 border-amber-300/40 transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none"
      >
        {/* Pulsing Outer Ring Badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse z-10" />

        {/* Animated Icon (MessageCircle <-> X) */}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <MessageCircle className="w-6 h-6 stroke-[2]" />
          )}
        </motion.div>

        {/* Tooltip hint when closed */}
        {!isOpen && (
          <span className="absolute right-16 px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-stone-800">
            Hubungi Kami & Sosmed
          </span>
        )}
      </button>
    </div>
  );
}
