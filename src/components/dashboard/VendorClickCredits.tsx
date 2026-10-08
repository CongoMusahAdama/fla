"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { clicksForAmount, WHATSAPP_CLICK_PRICE_GHS } from "@/lib/whatsapp-clicks";

type VendorClickCreditsProps = {
  user: { phone?: string; whatsappClickBalance?: number } | null;
  token?: string | null;
  onUser?: (user: any) => void;
};

export function VendorClickCredits({ user, token, onUser }: VendorClickCreditsProps) {
  const [amount, setAmount] = useState("1");
  const [paying, setPaying] = useState(false);
  const balance = Math.max(0, Number(user?.whatsappClickBalance || 0));

  useEffect(() => {
    if (!token || !onUser) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${api}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data?.user) onUser(data.user);
      } catch {
        /* keep the last balance on screen */
      }
    };
    void pull();
    const timer = window.setInterval(pull, 20000);
    window.addEventListener("focus", pull);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", pull);
    };
  }, [token, onUser]);
  const parsed = parseFloat(amount);
  const quote = clicksForAmount(parsed);
  const hasPhone = Boolean(user?.phone?.trim());

  const pay = async () => {
    if (!hasPhone) {
      Swal.fire({
        icon: "warning",
        title: "Add your WhatsApp number",
        text: "Save a WhatsApp number in Studio Identity before you buy clicks.",
        confirmButtonColor: "#0f172a",
      });
      return;
    }
    if (quote.clicks < 1) {
      Swal.fire({
        icon: "warning",
        title: "Amount too small",
        text: `Enter at least GHS ${WHATSAPP_CLICK_PRICE_GHS.toFixed(2)} for 1 click.`,
        confirmButtonColor: "#0f172a",
      });
      return;
    }

    setPaying(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${api}/payments/whatsapp-clicks/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ amountGhs: parsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
        throw new Error(msg || "Could not start payment");
      }
      if (data.reference) sessionStorage.setItem("fla_click_ref", data.reference);
      if (!data.authorizationUrl) throw new Error("No Paystack checkout URL returned");
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Payment did not start",
        text: err?.message || "Try again in a moment.",
        confirmButtonColor: "#0f172a",
      });
      setPaying(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-6 md:p-8 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">WhatsApp clicks</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{balance} left</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-xl leading-relaxed">
            Contact listings show your WhatsApp instead of Add to cart. Each customer tap costs GHS {WHATSAPP_CLICK_PRICE_GHS.toFixed(2)}.
            The button hides when this balance hits zero. Buy now stays on shop listings.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <label className="flex-1 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (GHS)</span>
          <input
            type="number"
            min={WHATSAPP_CLICK_PRICE_GHS}
            step="0.50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold"
          />
        </label>
        <div className="md:w-56 h-14 px-5 rounded-2xl bg-slate-900 text-white flex flex-col justify-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-lemon">You get</span>
          <span className="text-sm font-black">
            {quote.clicks} click{quote.clicks === 1 ? "" : "s"}
            {quote.clicks > 0 ? ` · pay GHS ${quote.chargeGhs.toFixed(2)}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={pay}
          disabled={paying || quote.clicks < 1}
          className="h-14 px-8 rounded-full bg-[#25D366] text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {paying ? "Opening Paystack…" : "Recharge"}
        </button>
      </div>
      {!hasPhone && (
        <p className="text-xs font-bold text-amber-600">Add a WhatsApp number in Studio Identity before recharging.</p>
      )}
    </div>
  );
}
