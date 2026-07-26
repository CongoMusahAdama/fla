"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, ShoppingBag, Copy, Check, Search, X } from 'lucide-react';
import { getImageUrl, getVendorDisplayLocation } from '@/lib/utils';
import { isVendorDocumented } from '@/lib/kyc';
import { VendorTrustBadge } from '@/components/VendorTrustBadge';
import { storeProductPath, storefrontUrl } from '@/lib/storefront';
import {
  saveStoreReturn,
  restoreStoreScrollIfNeeded,
  cacheStorePage,
  readStoreCache,
} from '@/lib/store-return';
import { useCart } from '@/context/CartContext';
import Footer from '@/components/Footer';

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
};

type StoreProduct = {
  _id: string;
  name: string;
  price: number;
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

  const [vendor, setVendor] = useState<StoreVendor | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');

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

  const shopName = vendor?.shopName || vendor?.name || 'Store';
  const normalizedSearch = storeSearch.trim().toLowerCase();
  const filteredProducts = normalizedSearch
    ? products.filter((p) => p.name?.toLowerCase().includes(normalizedSearch))
    : products;
  const documented = vendor
    ? isVendorDocumented({
        vendorTier: vendor.vendorTier,
        businessRegistration: vendor.businessRegistration,
      })
    : false;
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
    <main className="min-h-screen bg-[#f6f7f9]">
      {/* Full-bleed banner hero */}
      <section className="relative w-full min-h-[42vh] md:min-h-[48vh] overflow-hidden bg-brand-blue">
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
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-[#1a3a5c] to-[#0a1a2e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-10 md:pt-28 md:pb-14 flex flex-col justify-end min-h-[42vh] md:min-h-[48vh]">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-brand-lemon transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              FLA Marketplace
            </Link>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="ml-auto inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 hover:text-brand-lemon"
            >
              <ShoppingBag className="w-4 h-4" />
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </button>
          </div>

          <div className="flex items-end gap-4 md:gap-6">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-brand-lemon/80 bg-white shrink-0 shadow-lg">
              {vendor.profileImage ? (
                <Image
                  src={getImageUrl(vendor.profileImage)}
                  alt={shopName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-lemon text-slate-900 text-2xl font-black">
                  {shopName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <VendorTrustBadge documented={documented} size="md" />
                {vendor.uniqueVendorId && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-lemon bg-black/40 px-2 py-0.5 rounded-full">
                    {vendor.uniqueVendorId}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-black text-white tracking-tighter leading-none truncate">
                {shopName}
              </h1>
              {location && (
                <p className="mt-2 flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5 text-brand-lemon" />
                  {location}
                </p>
              )}
            </div>
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
              Catalog
            </p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              All products
            </h2>
          </div>
          <div className="flex items-center gap-3 md:flex-col md:items-end">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder={`Search ${shopName}…`}
                className="w-full md:w-72 pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-full text-base sm:text-sm focus:bg-white focus:outline-none focus:border-brand-lemon transition-all"
              />
              {storeSearch && (
                <button
                  type="button"
                  onClick={() => setStoreSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
              {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

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
              No matches for “{storeSearch}”
            </p>
            <p className="text-sm mt-2">Try a different word, or clear the search.</p>
            <button
              type="button"
              onClick={() => setStoreSearch('')}
              className="mt-6 px-8 py-3 bg-brand-lemon text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
              Clear search
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
