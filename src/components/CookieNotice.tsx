"use client";

import React, { useEffect, useState } from "react";
import { readCookie, writeCookie } from "@/lib/site-cookies";

const KEY = "fla_cookie_ok";

export function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readCookie(KEY) !== "1");
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[80] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:left-auto">
      <p className="text-sm text-slate-700 leading-relaxed">
        FLA uses cookies to remember the area you pick and to avoid charging a vendor twice for a double tap.
      </p>
      <button
        type="button"
        onClick={() => {
          writeCookie(KEY, "1");
          setOpen(false);
        }}
        className="mt-3 h-10 px-5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest"
      >
        OK
      </button>
    </div>
  );
}
