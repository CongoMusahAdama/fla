"use client";

import React from "react";
import { Mail, X, Send } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getFlaSupportEmail, getSupportMailtoUrl } from "@/lib/support-contacts";

export default function ChatSupport() {
  const { isSupportOpen, setIsSupportOpen } = useCart();
  const supportEmail = getFlaSupportEmail();

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[50] flex flex-col items-end pointer-events-none">
      {isSupportOpen && (
        <div className="mb-4 w-72 bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto origin-bottom-right">
          <div className="bg-slate-900 p-5 text-white">
            <h3 className="font-heading text-lg font-bold">Need help?</h3>
            <p className="text-white/80 text-xs font-medium">Email us and we'll reply fast</p>
          </div>

          <div className="p-4 space-y-3">
            <a
              href={getSupportMailtoUrl()}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Email support
            </a>

            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              Or write to us
            </p>

            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-lemon flex items-center justify-center text-slate-900 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{supportEmail}</p>
                <p className="text-[10px] text-slate-500 font-medium">Customer support</p>
              </div>
            </a>
          </div>

          <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">We reply within 24 hours</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsSupportOpen(!isSupportOpen)}
        className={`flex items-center gap-3 px-5 md:px-6 h-14 rounded-full shadow-2xl shadow-slate-900/30 transition-all duration-300 pointer-events-auto font-black uppercase tracking-widest text-[10px] md:text-xs ${
          isSupportOpen
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95"
        }`}
        aria-label={isSupportOpen ? "Close support menu" : "Open email support"}
      >
        {isSupportOpen ? (
          <X className="w-5 h-5 shrink-0" />
        ) : (
          <Mail className="w-5 h-5 shrink-0" />
        )}
        <span className="hidden md:inline">{isSupportOpen ? "Close" : "Email Help"}</span>
      </button>
    </div>
  );
}
