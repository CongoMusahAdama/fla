"use client";

import React from "react";
import { Phone, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { WhatsAppButton, WhatsAppIcon } from "@/components/WhatsAppButton";

const SUPPORT_PHONE = "0256774847";
const SUPPORT_PHONE_ALT = "0505112925";

const supportWhatsAppMessage = [
  "Hello FLA Support,",
  "",
  "I need help with my order or account.",
  "",
  "Thank you.",
].join("\n");

export default function ChatSupport() {
  const { isSupportOpen, setIsSupportOpen } = useCart();

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[50] flex flex-col items-end pointer-events-none">
      {isSupportOpen && (
        <div className="mb-4 w-72 bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto origin-bottom-right">
          <div className="bg-[#25D366] p-5 text-white">
            <h3 className="font-heading text-lg font-bold">Need help?</h3>
            <p className="text-white/90 text-xs font-medium">Tap WhatsApp for the fastest reply</p>
          </div>

          <div className="p-4 space-y-3">
            <WhatsAppButton
              fullWidth
              size="lg"
              phone={SUPPORT_PHONE}
              message={supportWhatsAppMessage}
              label="Chat on WhatsApp"
              missingContactRole="vendor"
            />

            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              Or call us
            </p>

            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">025 677 4847</p>
                <p className="text-[10px] text-slate-500 font-medium">Customer service</p>
              </div>
            </a>

            <a
              href={`tel:${SUPPORT_PHONE_ALT}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">050 511 2925</p>
                <p className="text-[10px] text-slate-500 font-medium">Secondary line</p>
              </div>
            </a>
          </div>

          <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Available 9am — 6pm</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsSupportOpen(!isSupportOpen)}
        className={`flex items-center gap-3 px-5 md:px-6 h-14 rounded-full shadow-2xl shadow-[#25D366]/30 transition-all duration-300 pointer-events-auto font-black uppercase tracking-widest text-[10px] md:text-xs ${
          isSupportOpen
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "bg-[#25D366] text-white hover:bg-[#20BD5A] hover:scale-105 active:scale-95"
        }`}
        aria-label={isSupportOpen ? "Close support menu" : "Open WhatsApp support"}
      >
        {isSupportOpen ? (
          <X className="w-5 h-5 shrink-0" />
        ) : (
          <WhatsAppIcon className="w-5 h-5 shrink-0" />
        )}
        <span className="hidden md:inline">{isSupportOpen ? "Close" : "WhatsApp Help"}</span>
      </button>
    </div>
  );
}
