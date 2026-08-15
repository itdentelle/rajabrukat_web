"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Archive, RotateCcw, X, Loader2, Info } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  itemName?: string;
  itemSubtitle?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemSubtitle,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-rose-50 border-rose-100 text-rose-600",
          icon: <Trash2 className="w-6 h-6" />,
          confirmBtn:
            "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 hover:shadow-rose-600/30",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 border-amber-100 text-amber-600",
          icon: <Archive className="w-6 h-6" />,
          confirmBtn:
            "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 hover:shadow-amber-600/30",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "info":
      case "success":
        return {
          iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
          icon: <RotateCcw className="w-6 h-6" />,
          confirmBtn:
            "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-emerald-600/30",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          iconBg: "bg-stone-100 border-stone-200 text-stone-700",
          icon: <Info className="w-6 h-6" />,
          confirmBtn:
            "bg-[#b77305] hover:bg-[#965e04] text-white shadow-amber-700/20",
          badge: "bg-stone-100 text-stone-700 border-stone-200",
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isLoading) onClose();
            }}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/80 p-6 sm:p-7 overflow-hidden z-10 my-auto"
          >
            {/* Top Close Button */}
            <button
              onClick={() => {
                if (!isLoading) onClose();
              }}
              disabled={isLoading}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-50"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Icon */}
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${currentVariant.iconBg}`}
              >
                {currentVariant.icon}
              </div>

              <div className="flex-1 pr-6">
                <h3 className="text-lg font-bold text-stone-900 leading-snug">
                  {title}
                </h3>
                <div className="mt-1 text-sm text-stone-500 leading-relaxed">
                  {description || "Tindakan ini tidak dapat dibatalkan."}
                </div>
              </div>
            </div>

            {/* Target Item Highlight Box (if provided) */}
            {itemName && (
              <div className="mt-4 p-3.5 bg-stone-50 border border-stone-200/90 rounded-2xl">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Item Terpilih:
                </div>
                <div className="text-sm font-bold text-stone-900 line-clamp-2">
                  {itemName}
                </div>
                {itemSubtitle && (
                  <div className="mt-1 text-xs text-stone-500 font-medium">
                    {itemSubtitle}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-bold hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold shadow-md inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${currentVariant.confirmBtn}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
