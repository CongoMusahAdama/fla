"use client";

import React from "react";
import {
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  openWhatsAppChat,
  promptMissingWhatsAppContact,
} from "@/lib/whatsapp";

export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.502-5.485-1.454l-.394-.227-4.078 1.07 1.089-3.975-.249-.396A9.816 9.816 0 011.942 12.07C1.942 6.656 6.355 2.24 11.77 2.24s9.829 4.417 9.829 9.831c0 5.414-4.417 9.831-9.83 9.831m11.834-11.83c0-6.521-5.303-11.825-11.825-11.825C5.461 0 0 5.461 0 11.825c0 2.083.54 4.117 1.571 5.905L0 24l6.446-1.691c1.71 1.017 3.65 1.554 5.62 1.554 6.523 0 11.825-5.303 11.825-11.825" />
  </svg>
);

type WhatsAppButtonProps = {
  phone?: string | null;
  message: string;
  label?: string;
  className?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  missingContactRole?: "vendor" | "customer" | "referee";
  /** When set, runs instead of default wa.me open (e.g. admin report handler). */
  onClick?: () => void;
};

const sizeClasses = {
  sm: "gap-1.5 px-4 py-2.5 text-[9px]",
  md: "gap-2 px-5 py-3 text-[10px]",
  lg: "gap-2.5 px-6 py-4 text-[11px]",
};

export function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  className = "",
  fullWidth = false,
  size = "md",
  missingContactRole = "vendor",
  onClick,
}: WhatsAppButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    const normalized = normalizeWhatsAppPhone(phone);
    if (!normalized) {
      promptMissingWhatsAppContact(missingContactRole);
      return;
    }
    openWhatsAppChat(normalized, message);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center font-black uppercase tracking-widest text-white bg-[#25D366] hover:bg-[#20BD5A] shadow-lg shadow-[#25D366]/25 transition-all active:scale-[0.98] rounded-full ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      <WhatsAppIcon className={size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      {label}
    </button>
  );
}
