"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Image as ImageIcon, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cleanTitle } from "@/utils/cleanTitle";
import { API_BASE_URL } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  image: string;
  colors: string[];
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  products?: Product[];
  image?: string;
  timestamp: string;
}

const PRESET_CHIPS = [
  "Koleksi Produk Terbaru",
  "Kain di Bawah 100 Ribu",
  "Kain di Bawah 150 Ribu",
  "Best Seller Terlaris",
  "Kain Brukat Wisuda",
  "Renda Chantilly Mewah",
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function renderFormattedText(text: string) {
  if (!text) return null;

  // Split by bold pattern **...**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const innerText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-amber-300">
          {innerText}
        </strong>
      );
    }

    // Split non-bold parts by italic *...*
    const subParts = part.split(/(\*.*?\*)/g);
    return subParts.map((sub, subIdx) => {
      if (sub.startsWith("*") && sub.endsWith("*") && sub.length >= 2) {
        return (
          <em key={`${index}-${subIdx}`} className="italic text-amber-100">
            {sub.slice(1, -1)}
          </em>
        );
      }
      return sub;
    });
  });
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Halo Kak! Saya **RajaBot**, AI Fashion Advisor RajaBrukat. Ada yang bisa saya bantu hari ini? Kakak bisa tanya warna, model brokat untuk wisuda/kondangan, atau upload foto kain favorit Kakak!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const queryText = textToSend || inputMessage;
    if (!queryText.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      image: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    const currentImage = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== "welcome-1")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          content: m.text,
        }));

      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
          image: currentImage || undefined,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Invalid AI response");
      }
      const data = await res.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Maaf Kak, sepertinya ada kendala sinyal. Bisa coba tanyakan lagi?",
        products: data.products || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Failed to send AI chat:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Maaf Kak, RajaBot sedang mengalami gangguan koneksi. Silakan coba sebentar lagi ya!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Dialog Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            data-lenis-prevent="true"
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="w-[90vw] sm:w-[420px] h-[580px] bg-stone-900 border border-amber-900/40 text-stone-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl overscroll-contain"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 px-4 py-3.5 border-b border-amber-800/30 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center relative">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-stone-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-100 tracking-wide flex items-center gap-1.5">
                    RajaBot AI Stylist
                  </h3>
                  <p className="text-[11px] text-amber-200/70">Tanya warna, model & visual search</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Tutup AI Chat Assistant"
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="px-3 py-2 bg-stone-950/60 border-b border-stone-800/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar overscroll-contain"
            >
              {PRESET_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(chip)}
                  disabled={loading}
                  className="whitespace-nowrap text-xs px-2.5 py-1 rounded-full bg-stone-800 hover:bg-amber-900/50 text-stone-300 hover:text-amber-200 border border-stone-700/60 transition duration-200 flex-shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message History Area */}
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 p-4 overflow-y-auto space-y-4 text-sm no-scrollbar bg-gradient-to-b from-stone-950 to-stone-900 overscroll-contain"
              style={{ touchAction: "pan-y" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {/* User Uploaded Image Preview */}
                  {msg.image && (
                    <div className="mb-2 relative w-40 h-40 rounded-xl overflow-hidden border border-amber-500/30 shadow-lg">
                      <Image src={msg.image} alt="User Upload" fill className="object-cover" />
                    </div>
                  )}

                  {/* Text Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                      msg.sender === "user"
                        ? "bg-amber-700 text-amber-50 rounded-br-none"
                        : "bg-stone-800/90 text-stone-200 border border-stone-700/60 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{renderFormattedText(msg.text)}</p>
                    <span className="text-[10px] opacity-60 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Recommended Products Display */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full grid grid-cols-2 gap-2.5">
                      {msg.products.map((product) => {
                        const { displayTitle, code } = cleanTitle(product.name);
                        const titleToShow = code ? `${displayTitle} (${code})` : displayTitle;

                        const validColor = product.colors?.find(
                          (c) =>
                            c &&
                            !c.toLowerCase().includes("gambar utama") &&
                            !c.toLowerCase().includes("manekin") &&
                            !c.toLowerCase().includes("gantung") &&
                            !c.toLowerCase().includes("foto")
                        );

                        return (
                          <div
                            key={product.id}
                            className="bg-stone-800/80 rounded-xl border border-amber-900/30 overflow-hidden hover:border-amber-500/50 transition duration-300 flex flex-col group"
                          >
                            <div className="relative h-28 w-full bg-stone-950">
                              <Image
                                src={product.image}
                                alt={displayTitle}
                                fill
                                unoptimized={true}
                                className="object-cover group-hover:scale-105 transition duration-500"
                              />
                              {validColor && (
                                <div className="absolute top-1 left-1 bg-stone-950/80 backdrop-blur text-[10px] text-amber-300 px-1.5 py-0.5 rounded font-medium">
                                  {validColor}
                                </div>
                              )}
                            </div>
                            <div className="p-2 flex-1 flex flex-col justify-between">
                              <div>
                                <h4
                                  className="font-semibold text-xs text-stone-100 group-hover:text-amber-300 transition line-clamp-2"
                                  title={titleToShow}
                                >
                                  {titleToShow}
                                </h4>
                                <p className="text-[11px] font-bold text-amber-400 mt-0.5">
                                  {formatRupiah(product.discountPrice || product.price)}
                                </p>
                              </div>
                              <Link
                                href={`/products/${product.id}`}
                                onClick={() => setIsOpen(false)}
                                className="mt-2 text-[11px] py-1 px-2 bg-amber-800/60 hover:bg-amber-700 text-amber-100 rounded text-center font-medium transition flex items-center justify-center gap-1"
                              >
                                Lihat Detail <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-amber-400/80 text-xs bg-stone-800/60 px-3.5 py-2.5 rounded-2xl w-fit border border-stone-700/40 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  RajaBot sedang berpikir & mencari produk terbaik...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected Image Preview before sending */}
            {selectedImage && (
              <div className="px-4 py-2 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded overflow-hidden border border-amber-500">
                    <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                  </div>
                  <span className="text-xs text-amber-200">Foto siap dianalisis AI</span>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-stone-400 hover:text-red-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-stone-950 border-t border-amber-900/30 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                aria-label="Upload Foto Inspirasi Kain"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload Foto Inspirasi"
                title="Upload foto inspirasi kain/baju"
                className="p-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 rounded-xl transition border border-stone-700"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                aria-label="Pesan Chat AI"
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Tanya warna, model, atau brokat wisuda..."
                disabled={loading}
                className="flex-1 bg-stone-900 text-stone-100 text-xs px-3.5 py-2.5 rounded-xl border border-stone-800 focus:outline-none focus:border-amber-500 placeholder-stone-500"
              />

              <button
                onClick={() => sendMessage()}
                aria-label="Kirim Pesan"
                disabled={loading || (!inputMessage.trim() && !selectedImage)}
                className="p-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-700 text-amber-50 rounded-xl transition shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
