"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Megaphone, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import { getImageUrl } from '@/lib/utils';

type Slot = 'hero_main' | 'hero_side';

type Billboard = {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  linkUrl?: string;
  slot: Slot;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority?: number;
  vendorId?: { _id: string; shopName?: string; name?: string; storeSlug?: string } | string;
  productId?: {
    _id: string;
    name?: string;
    price?: number;
    images?: string[];
    storeSlug?: string;
  } | string;
};

type VendorOption = { _id: string; shopName?: string; name?: string };
type ProductOption = {
  _id: string;
  name: string;
  price?: number;
  images?: string[];
  vendorId?: string | { _id?: string };
};

function toLocalInputValue(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultWindow() {
  const start = new Date();
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { startsAt: toLocalInputValue(start.toISOString()), endsAt: toLocalInputValue(end.toISOString()) };
}

export default function AdminBillboards({
  token,
  vendors,
  products,
}: {
  token: string | null;
  vendors: VendorOption[];
  products: ProductOption[];
}) {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [items, setItems] = useState<Billboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const windowDefaults = defaultWindow();

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaLabel: 'Shop now',
    linkUrl: '',
    slot: 'hero_main' as Slot,
    vendorId: '',
    productId: '',
    startsAt: windowDefaults.startsAt,
    endsAt: windowDefaults.endsAt,
    priority: 10,
    isActive: true,
  });

  const vendorProducts = useMemo(() => {
    if (!form.vendorId) return products;
    return products.filter((p) => {
      const vid = typeof p.vendorId === 'object' ? p.vendorId?._id : p.vendorId;
      return String(vid) === String(form.vendorId);
    });
  }, [products, form.vendorId]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${api}/billboards`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) setItems(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onProductPick = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    const vid =
      typeof product?.vendorId === 'object' ? product?.vendorId?._id : product?.vendorId;
    setForm((prev) => ({
      ...prev,
      productId,
      vendorId: vid ? String(vid) : prev.vendorId,
      title: prev.title || product?.name || '',
      subtitle:
        prev.subtitle ||
        (product?.price != null ? `Featured · GH₵${Number(product.price).toLocaleString()}` : prev.subtitle),
      imageUrl: prev.imageUrl || (product?.images?.[0] ? getImageUrl(product.images[0]) : prev.imageUrl),
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!token) return;
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch(`${api}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.url || data.secure_url || data.path;
      if (!url) throw new Error('No image URL returned');
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      Swal.fire('Upload failed', err.message || 'Could not upload image', 'error');
    }
  };

  const save = async () => {
    if (!token) return;
    if (!form.title.trim() || !form.imageUrl.trim()) {
      Swal.fire('Missing fields', 'Title and image are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${api}/billboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          imageUrl: form.imageUrl.trim(),
          ctaLabel: form.ctaLabel.trim() || 'Shop now',
          linkUrl: form.linkUrl.trim() || undefined,
          slot: form.slot,
          vendorId: form.vendorId || undefined,
          productId: form.productId || undefined,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          priority: Number(form.priority) || 0,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Could not save billboard');
      }
      const nextDefaults = defaultWindow();
      setForm({
        title: '',
        subtitle: '',
        imageUrl: '',
        ctaLabel: 'Shop now',
        linkUrl: '',
        slot: 'hero_main',
        vendorId: '',
        productId: '',
        startsAt: nextDefaults.startsAt,
        endsAt: nextDefaults.endsAt,
        priority: 10,
        isActive: true,
      });
      await load();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Billboard scheduled',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err: any) {
      Swal.fire('Save failed', err.message || 'Could not save billboard', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Billboard) => {
    if (!token) return;
    const res = await fetch(`${api}/billboards/${item._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) load();
  };

  const remove = async (id: string) => {
    if (!token) return;
    const confirm = await Swal.fire({
      title: 'Remove billboard?',
      text: 'This ad will stop showing on the homepage.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      confirmButtonColor: '#0f172a',
    });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`${api}/billboards/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) load();
  };

  const now = Date.now();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">
          Homepage Billboards
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Schedule vendor ads for the hero cards. When no ad is live, FLA falls back to today’s product picks.
        </p>
      </div>

      <div className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-lemon rounded-xl flex items-center justify-center text-slate-900">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Schedule an ad</h3>
            <p className="text-xs text-slate-400 font-bold">Pick a vendor/product, set dates, and choose main or side slot.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slot</label>
            <select
              value={form.slot}
              onChange={(e) => setForm((p) => ({ ...p, slot: e.target.value as Slot }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            >
              <option value="hero_main">Main hero (large left card)</option>
              <option value="hero_side">Side hero (top-right card)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor</label>
            <select
              value={form.vendorId}
              onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value, productId: '' }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            >
              <option value="">Any / none</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.shopName || v.name || v._id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product</label>
            <select
              value={form.productId}
              onChange={(e) => onProductPick(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            >
              <option value="">Optional product link</option>
              {vendorProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
              placeholder="Ad headline"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtitle</label>
            <input
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
              placeholder="e.g. Featured · GH₵120"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starts</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ends</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Image</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                placeholder="Image URL or upload"
              />
              <label className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </label>
            </div>
            {form.imageUrl && (
              <div className="relative h-36 w-full max-w-md rounded-2xl overflow-hidden border border-slate-100 mt-2">
                <Image src={getImageUrl(form.imageUrl)} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CTA label</label>
            <input
              value={form.ctaLabel}
              onChange={(e) => setForm((p) => ({ ...p, ctaLabel: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom link (optional)</label>
            <input
              value={form.linkUrl}
              onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
              placeholder="/store/slug or https://…"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-lemon text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-brand-lemon-hover disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {saving ? 'Saving…' : 'Schedule billboard'}
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Scheduled ads</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} total</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No billboards yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((item) => {
              const start = new Date(item.startsAt).getTime();
              const end = new Date(item.endsAt).getTime();
              const live = item.isActive && start <= now && end >= now;
              const vendor =
                typeof item.vendorId === 'object' && item.vendorId
                  ? item.vendorId.shopName || item.vendorId.name
                  : null;
              return (
                <div key={item._id} className="p-4 md:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative w-full sm:w-28 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <Image src={getImageUrl(item.imageUrl)} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.slot === 'hero_main' ? 'Main' : 'Side'}
                      </span>
                      {live ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <Clock className="w-3 h-3" /> {item.isActive ? 'Scheduled' : 'Paused'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {vendor ? `${vendor} · ` : ''}
                      {new Date(item.startsAt).toLocaleString()} → {new Date(item.endsAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      className="px-3 py-2 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                    >
                      {item.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item._id)}
                      className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
