"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { getFlaTermsSections, FLA_TERMS_VERSION, type TermsRole } from "@/lib/fla-terms";

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
    window.location.href = `mailto:Help@FlaPurchase.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full flex flex-col min-h-[70vh]">
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Terms and Conditions</h2>
      <button
        type="button"
        onClick={handleSendEmail}
        className="text-sm text-blue-600 font-medium text-center mb-6 hover:underline"
      >
        Send by Email
      </button>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 mb-6 max-h-[50vh] custom-scrollbar">
        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">IMPORTANT</p>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Please read these Terms and Conditions carefully before using FLA Purchase. By selecting Agree, you
          enter a binding agreement with FLA for your {role === "vendor" ? "vendor studio" : "customer"} account.
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{intro} · v{FLA_TERMS_VERSION}</p>

        {sections.map((section, index) => (
          <div key={section.title} className="border-b border-slate-200/80 last:border-0">
            <button
              type="button"
              onClick={() => setExpanded(expanded === index ? null : index)}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">{section.title}</span>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded === index ? "rotate-90" : ""}`}
              />
            </button>
            {expanded === index && (
              <p className="text-sm text-slate-600 leading-relaxed pb-4 pr-2">{section.body}</p>
            )}
          </div>
        ))}

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          PLEASE READ THESE TERMS CAREFULLY. IF YOU DO NOT AGREE, SELECT DISAGREE — YOU WILL NOT BE ABLE TO USE
          YOUR NEW ACCOUNT.
        </p>
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onAgree()}
        className="w-full py-4 rounded-full bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/20"
      >
        {isSubmitting ? "Saving…" : "Agree"}
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onDisagree}
        className="w-full py-4 mt-2 text-slate-900 font-semibold text-base hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
      >
        Disagree
      </button>
    </div>
  );
}
