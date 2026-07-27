"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { getFlaTermsSections, FLA_TERMS_VERSION, type TermsRole } from "@/lib/fla-terms";
import { getFlaSupportEmail } from "@/lib/support-contacts";

interface TermsAcceptanceScreenProps {
  role: TermsRole;
  userEmail?: string;
  onAgree: () => void | Promise<void>;
  onDisagree: () => void;
  isSubmitting?: boolean;
}

export function TermsAcceptanceScreen({
  role,
  userEmail,
  onAgree,
  onDisagree,
  isSubmitting = false,
}: TermsAcceptanceScreenProps) {
  const { intro, sections } = getFlaTermsSections(role);
  const [expanded, setExpanded] = useState<number | null>(0);

  const handleSendEmail = () => {
    const subject = encodeURIComponent("FLA Purchase — Terms and Conditions");
    const body = encodeURIComponent(
      `Please send me a copy of the FLA Purchase Terms and Conditions (version ${FLA_TERMS_VERSION}).\n\nMy account email: ${userEmail || ""}`
    );
    window.location.href = `mailto:${getFlaSupportEmail()}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full flex flex-col min-h-[70vh]">
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Terms and Conditions</h2>
      <button
        type="button"
        onClick={handleSendEmail}
        className="text-sm text-blue-600 font-medium text-center mb-6 hover:underline"
      >
        Email me a copy
      </button>

      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{intro}</p>

      <div className="flex-1 space-y-2 mb-8">
        {sections.map((section, idx) => (
          <div key={section.title} className="border border-slate-100 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-bold text-slate-900">{section.title}</span>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${expanded === idx ? "rotate-90" : ""}`}
              />
            </button>
            {expanded === idx && (
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                {section.body}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white pt-4 pb-2 space-y-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onAgree}
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-brand-lemon text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-brand-lemon-hover transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "I Agree"}
        </button>
        <button
          type="button"
          onClick={onDisagree}
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          I Do Not Agree
        </button>
      </div>
    </div>
  );
}
