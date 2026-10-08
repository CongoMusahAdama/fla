"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { openVendorWhatsappLead } from "@/lib/whatsapp-clicks";
import { WhatsAppIcon } from "@/components/WhatsAppButton";

type WhatsAppLeadButtonProps = {
  productId: string;
  label?: string;
  className?: string;
  onUnavailable?: () => void;
};

export function WhatsAppLeadButton({
  productId,
  label = "WhatsApp vendor",
  className = "",
  onUnavailable,
}: WhatsAppLeadButtonProps) {
  const { token } = useAuth();
  const [opening, setOpening] = useState(false);

  const open = async () => {
    if (opening || !productId) return;
    setOpening(true);
    try {
      const result = await openVendorWhatsappLead(productId, token);
      if (!result.available || !result.url) {
        onUnavailable?.();
        Swal.fire({
          icon: "info",
          title: "WhatsApp unavailable",
          text: result.message || "This vendor has no clicks left.",
          confirmButtonColor: "#0f172a",
        });
        return;
      }
      if (result.whatsappLeadAvailable === false) onUnavailable?.();
      window.location.href = result.url;
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Could not open WhatsApp",
        text: err?.message || "Try again in a moment.",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void open();
      }}
      disabled={opening}
      className={`inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest text-white bg-[#25D366] hover:bg-[#20BD5A] transition-all active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      <WhatsAppIcon className="w-4 h-4" />
      {opening ? "Opening…" : label}
    </button>
  );
}
