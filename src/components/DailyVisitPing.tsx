"use client";

import { useEffect } from "react";
import { readCookie, writeCookie } from "@/lib/site-cookies";

const VISITOR_KEY = "fla_visitor";
const PING_KEY = "fla_visit_day";

function accraDayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Count this browser once per Ghana day. The same person is not counted again until tomorrow. */
export function DailyVisitPing() {
  useEffect(() => {
    const day = accraDayKey();
    try {
      if (sessionStorage.getItem(PING_KEY) === day) return;
    } catch {
      /* private mode can block session storage */
    }

    let visitorId = readCookie(VISITOR_KEY);
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(visitorId)) {
      const uuid = globalThis.crypto?.randomUUID?.();
      visitorId = (uuid || `fla-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).slice(0, 80);
      writeCookie(VISITOR_KEY, visitorId);
    }

    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    fetch(`${api}/dashboard/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
      .then((res) => {
        if (!res.ok) return;
        try {
          sessionStorage.setItem(PING_KEY, day);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
