"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, ShoppingBag, Copy, Check, ChevronDown, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { getImageUrl, getVendorDisplayLocation } from '@/lib/utils';
import { storeProductPath, storefrontUrl } from '@/lib/storefront';
import {
  saveStoreReturn,
  restoreStoreScrollIfNeeded,
  cacheStorePage,
  readStoreCache,
} from '@/lib/store-return';
import { resolveStoreTheme, storeThemeStyle } from '@/lib/store-theme';
import { useProductCategories } from '@/hooks/useProductCategories';
import { useCart } from '@/context/CartContext';
import Footer from '@/components/Footer';

const CATEGORY_DROPDOWN_PANEL =
  'z-[70] bg-white shadow-2xl border border-gray-100 transition-all duration-200 ' +
  'fixed inset-x-0 bottom-0 top-auto max-h-[75dvh] overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl p-3 ' +
  'sm:absolute sm:inset-auto sm:left-0 sm:right-auto sm:bottom-auto sm:top-full sm:mt-4 sm:w-56 sm:max-h-[min(50vh,360px)] sm:rounded-xl sm:p-2 sm:shadow-xl';

function categoryDropdownClass(isOpen: boolean) {
  return `${CATEGORY_DROPDOWN_PANEL} ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none sm:translate-y-0'}`;
}

type StoreVendor = {
  _id: string;
  shopName?: string;
  name?: string;
  bio?: string;
  bannerImage?: string;
  profileImage?: string;
  location?: string;
  region?: string;
  uniqueVendorId?: string;
  storeSlug?: string;
  vendorTier?: string;
  businessRegistration?: string;
  productTypes?: string;
  storeAccentColor?: string;
  storeThemeColor?: string;
};

type StoreProduct = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  images?: string[];
  stock?: number;
  tailoringTime?: string;
};

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function VendorStorePage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : String(rawSlug || '');
  const { cartCount, setIsCartOpen } = useCart();
  const { categories } = useProductCategories({ includeAll: true });

  const [vendor, setVendor] = useState<StoreVendor | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Product');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Instant restore when returning from a product (avoids full reload flash)
  useEffect(() => {
    if (!slug) return;
    const cached = readStoreCache(slug);
    if (cached?.vendor) {
      setVendor(cached.vendor);
      setProducts(cached.products || []);
      setLoading(false);
      restoreStoreScrollIfNeeded(slug);
    }
  }, [slug]);

  // Guest checkout return from Paystack — stay on storefront (not login/dashboard)
  useEffect(() => {
    if (typeof window === 'undefined' || !slug) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    const paid = params.get('paid');
    if (!orderId || paid !== '1') return;

    const seenKey = `fla_store_guest_paid_${orderId}`;
    if (sessionStorage.getItem(seenKey)) {
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    sessionStorage.setItem(seenKey, '1');
    window.history.replaceState({}, '', window.location.pathname);

    Swal.fire({
      icon: 'success',
      iconColor: '#059669',
      title: 'Payment received',
      html: `
        <p class="text-slate-600 text-sm leading-relaxed">
          Thank you for shopping with <strong>${vendor?.shopName || vendor?.name || 'this store'}</strong>.
          A receipt will be sent to your email. The vendor may contact you on WhatsApp about delivery.
        </p>
      `,
      confirmButtonText: 'Keep browsing',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-[32px] border-none shadow-2xl p-8 bg-white',
        title: 'text-xl font-black text-slate-900 tracking-tighter uppercase',
        confirmButton:
          'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all',
      },
    });
  }, [slug, vendor?.shopName, vendor?.name]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Store not found');
      return;
    }
    let cancelled = false;

    (async () => {
      // Only show skeleton if we have nothing to paint yet
      if (!readStoreCache(slug)?.vendor) {
        setLoading(true);
      }
      setError(null);
      try {
        const storeRes = await fetch(`${apiBase()}/users/store/${encodeURIComponent(slug)}`);
        if (!storeRes.ok) {
          const body = await storeRes.json().catch(() => ({}));
          const detail = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
          throw new Error(
            storeRes.status === 404
              ? 'Store not found'
              : detail || `Failed to load store (${storeRes.status})`,
          );
        }
        const storeData = await storeRes.json();
        const v: StoreVendor = storeData.vendor;
        if (!v?._id) {
          throw new Error('Store not found');
        }
        if (cancelled) return;
        setVendor(v);

        const vendorId = v._id;
        const collected: StoreProduct[] = [];
        let page = 1;
        let totalPages = 1;

        // Paginated fetch — backend caps page size at 48, so loop until every
        // active listing for this store is loaded (not just the first 100).
        do {
          const productsRes = await fetch(
            `${apiBase()}/products?vendorId=${encodeURIComponent(vendorId)}&page=${page}&limit=48`,
          );
          if (!productsRes.ok) break;
          const raw = await productsRes.json();
          if (Array.isArray(raw)) {
            collected.push(...raw);
            totalPages = 1;
            break;
          }
          collected.push(...(raw.products || raw.data || []));
          totalPages = Math.max(1, Number(raw.totalPages) || 1);
          page += 1;
        } while (page <= totalPages && page <= 50); // hard safety against runaway loops

        if (!cancelled) {
          setProducts(collected);
          cacheStorePage(slug, { vendor: v, products: collected });
          restoreStoreScrollIfNeeded(slug);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load store');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!categoryOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [categoryOpen]);

  const shopName = vendor?.shopName || vendor?.name || 'Store';
  const theme = resolveStoreTheme(vendor);

  const storeCategories = useMemo(() => {
    const fromProducts = new Set(
      products.map((p) => (p.category || '').trim()).filter(Boolean),
    );
    const withCounts = categories
      .filter((cat) => cat === 'All Product' || fromProducts.has(cat))
      .map((cat) => ({
        label: cat,
        count:
          cat === 'All Product'
            ? products.length
            : products.filter((p) => p.category === cat).length,
      }));
    return withCounts.length > 1 ? withCounts : [{ label: 'All Product', count: products.length }];
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === 'All Product' || p.category === activeCategory;
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const shelfLabel =
    activeCategory !== 'All Product'
      ? activeCategory
      : 'All products';
  const location = getVendorDisplayLocation({
    location: vendor?.location,
    region: vendor?.region,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl(slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 animate-pulse space-y-6">
          <div className="h-56 md:h-72 rounded-3xl bg-slate-200" />
          <div className="h-10 w-64 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-slate-200 rounded-2xl" />
              ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !vendor) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Store not found
          </h1>
          <p className="text-slate-500 text-sm">
            This vendor storefront is unavailable or no longer active.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-lemon text-slate-900 rounded-full text-xs font-black uppercase tracking-widest"
          >
            Browse marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]" style={storeThemeStyle(vendor)}>
      {/* Full-bleed banner hero */}
      <section className="relative w-full min-h-[42vh] md:min-h-[48vh] overflow-hidden" style={{ backgroundColor: theme.theme }}>
        {vendor.bannerImage ? (
          <Image
            src={getImageUrl(vendor.bannerImage)}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(to bottom right, ${theme.theme}, ${theme.theme}dd, #0a1a2e)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-10 md:pt-28 md:pb-14 flex flex-col justify-end min-h-[42vh] md:min-h-[48vh]">
          <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90"
            >
              <ShoppingBag className="w-4 h-4" />
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </button>
          </div>

          <div className="min-w-0">
              <h1 className="font-heading text-3xl md:text-5xl font-black text-white tracking-tighter leading-none truncate">
                {shopName}
              </h1>
              {vendor.productTypes && (
                <p className="mt-2 inline-flex text-[9px] font-black uppercase tracking-widest text-slate-900 px-2.5 py-1 rounded-full" style={{ backgroundColor: theme.accent }}>
                  {vendor.productTypes}
                </p>
              )}
              {location && (
                <p className="mt-2 flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                  {location}
                </p>
              )}
            </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-4 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          {vendor.bio ? (
            <p className="text-sm text-slate-600 leading-relaxed flex-1">{vendor.bio}</p>
          ) : (
            <p className="text-sm text-slate-400 flex-1">Welcome to {shopName} on FLA.</p>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 shrink-0 px-5 py-3 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy store link'}
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {categoryOpen && (
          <button
            type="button"
            aria-label="Close category menu"
            className="fixed inset-0 z-[65] bg-slate-900/30 cursor-default"
            onClick={() => setCategoryOpen(false)}
          />
        )}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
              Catalog
            </p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              {shelfLabel}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-300 w-full sm:w-48 md:w-64 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen((o) => !o)}
                className={`inline-flex items-center gap-1 rounded-lg text-xs font-medium border transition-colors h-9 px-3 ${
                  activeCategory === 'All Product'
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'text-white'
                }`}
                style={
                  activeCategory !== 'All Product'
                    ? { backgroundColor: theme.theme, borderColor: theme.theme }
                    : undefined
                }
              >
                {activeCategory === 'All Product' ? 'Category' : activeCategory.split('/')[0]}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={categoryDropdownClass(categoryOpen)}>
                {categoryOpen && (
                  <div className="sm:hidden sticky top-0 bg-white z-10 pb-2 mb-1 border-b border-slate-100">
                    <div className="mx-auto mt-1 mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                    <div className="flex items-center justify-between px-3">
                      <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                        Categories ({storeCategories.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setCategoryOpen(false)}
                        className="text-[11px] font-semibold px-2 py-1"
                        style={{ color: theme.theme }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
                {storeCategories.map(({ label, count }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setActiveCategory(label);
                      setCategoryOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex justify-between items-center gap-3 hover:bg-slate-50 transition-colors ${
                      activeCategory === label ? 'bg-slate-50' : 'text-slate-700'
                    }`}
                    style={activeCategory === label ? { color: theme.theme } : undefined}
                  >
                    <span>{label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400">{count}</span>
                      {activeCategory === label && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
              {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {storeCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-6">
            {storeCategories.map(({ label, count }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveCategory(label)}
                className={`shrink-0 h-8 px-3.5 rounded-full text-[11px] font-medium transition-all ${
                  activeCategory === label
                    ? 'text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                style={
                  activeCategory === label
                    ? { backgroundColor: theme.accent }
                    : undefined
                }
              >
                {label === 'All Product' ? `All (${count})` : `${label.split('/')[0]} (${count})`}
              </button>
            ))}
          </div>
        )}

        <div className="mb-2" />

        {products.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <p className="text-lg font-bold text-slate-900 uppercase tracking-tighter">
              No products yet
            </p>
            <p className="text-sm mt-2">Check back soon — new pieces are on the way.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <p className="text-lg font-bold text-slate-900 uppercase tracking-tighter">
              {activeCategory !== 'All Product'
                ? `No ${activeCategory} items yet`
                : 'No products found'}
            </p>
            <p className="text-sm mt-2">
              {activeCategory !== 'All Product'
                ? `This store has no listings in ${activeCategory} right now.`
                : 'This store has no listings yet.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All Product');
              }}
              className="mt-6 px-8 py-3 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ backgroundColor: theme.accent }}
            >
              View all items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map((product, i) => {
              const soldOut = (product.stock ?? 0) <= 0;
              return (
                <Link
                  key={product._id}
                  href={storeProductPath(slug, product._id)}
                  data-product-id={product._id}
                  onClick={() => saveStoreReturn(slug, product._id)}
                  className="group bg-white rounded-3xl border border-slate-100 p-3 md:p-4 hover:shadow-xl hover:border-slate-200 transition-all duration-500"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="relative aspect-[4/5] bg-[#F7F7F7] rounded-2xl overflow-hidden mb-4">
                    <Image
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      fill
                      unoptimized
                      className={`object-contain p-3 transition-transform duration-700 group-hover:scale-105 ${
                        soldOut ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    {soldOut && (
                      <span className="absolute top-3 left-3 bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Sold out
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-slate-900 text-sm md:text-base line-clamp-1 group-hover:text-brand-blue transition-colors">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    GHS {Number(product.price).toLocaleString()}
                  </p>
                  <p
                    className={`mt-1 text-[9px] font-black uppercase tracking-widest ${
                      soldOut
                        ? 'text-slate-400'
                        : (product.stock ?? 0) <= 5
                          ? 'text-orange-500'
                          : 'text-emerald-600'
                    }`}
                  >
                    {soldOut
                      ? 'Sold out'
                      : (product.stock ?? 0) <= 5
                        ? `Only ${product.stock} left`
                        : `${product.stock} in stock`}
                  </p>
                  {product.tailoringTime && (
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {product.tailoringTime}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="text-center pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Powered by{' '}
          <Link href="/" className="text-brand-blue hover:text-slate-900">
            FLA
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
