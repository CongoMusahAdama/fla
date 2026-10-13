"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type AreaHit = { name: string; region?: string };

type AreaSuggestProps = {
  value: string;
  onChange: (name: string) => void;
  region?: string;
  placeholder?: string;
  inputClassName?: string;
  /** Vendors can add a missing area. Shoppers can only pick one that already exists. */
  allowCreate?: boolean;
};

export function AreaSuggest({
  value,
  onChange,
  region,
  placeholder = "Search your area",
  inputClassName = "",
  allowCreate = false,
}: AreaSuggestProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<AreaHit[]>([]);

  useEffect(() => {
    const q = value.trim();
    const timer = window.setTimeout(async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (region) params.set("region", region);
        const res = await fetch(`${api}/users/areas?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setHits(Array.isArray(data) ? data : []);
      } catch {
        setHits([]);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [value, region]);

  const exact = hits.some((hit) => hit.name.toLowerCase() === value.trim().toLowerCase());
  const canAdd = allowCreate && value.trim().length >= 2 && !exact;

  const choose = async (name: string, create: boolean) => {
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (cleaned.length < 2) return;
    if (create) {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${api}/users/areas`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ name: cleaned, region: region || undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.name) {
          onChange(data.name);
          setOpen(false);
          return;
        }
      } catch {
        /* keep the typed name if the save fails */
      }
    }
    onChange(cleaned);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={inputClassName}
      />
      {open && (hits.length > 0 || canAdd) && (
        <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl z-30">
          {hits.map((hit) => (
            <button
              key={hit.name}
              type="button"
              onClick={() => choose(hit.name, false)}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {hit.name}
              {hit.region ? <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{hit.region}</span> : null}
            </button>
          ))}
          {canAdd && (
            <button
              type="button"
              onClick={() => choose(value, true)}
              className="w-full px-4 py-3 text-left text-sm font-bold text-[#128C7E] hover:bg-emerald-50"
            >
              Add “{value.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
