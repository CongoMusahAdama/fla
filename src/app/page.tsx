"use client";

import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";
import { ChevronDown, LayoutGrid, List, MapPin, SlidersHorizontal } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { PRODUCT_CATEGORIES, PRODUCT_FILTERS } from '@/lib/constants';
import { GHANA_REGIONS } from '@/lib/ghana-regions';

const HOME_PAGE_SIZE = 12;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All Product');
  const [activeFilter, setActiveFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeRegion, setActiveRegion] = useState('');

  const buildProductsUrl = (cat: string, filt: string, region: string, pageNum: number) => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    let url = `${api}/products?page=${pageNum}&limit=${HOME_PAGE_SIZE}`;
    if (cat !== 'All Product') url += `&category=${encodeURIComponent(cat)}`;
    // Default home shelf = Best Seller ("Top picks today"); otherwise respect sort filter
    const effectiveFilter = filt || (cat === 'All Product' && !region ? 'Best Seller' : '');
    if (effectiveFilter) url += `&filter=${encodeURIComponent(effectiveFilter)}`;
    if (region) url += `&region=${encodeURIComponent(region)}`;
    if (!effectiveFilter) url += '&sort=latest';
    return url;
  };

  const fetchLatestProducts = async (cat: string, filt: string, region: string) => {
    setLoading(true);
    setPage(1);
    try {
      let res = await fetch(buildProductsUrl(cat, filt, region, 1));
      let data = res.ok ? await res.json() : null;
      let list: Product[] = Array.isArray(data) ? data : (data?.products || []);

      // If Best Seller shelf is empty, fall back to latest with images
      if (
        list.length === 0 &&
        !filt &&
        cat === 'All Product' &&
        !region
      ) {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        res = await fetch(`${api}/products?page=1&limit=${HOME_PAGE_SIZE}&sort=latest`);
        if (res.ok) {
          data = await res.json();
          list = Array.isArray(data) ? data : (data?.products || []);
        }
      }

      if (data || list.length) {
        const totalPages = Array.isArray(data) ? 1 : (data?.totalPages || 1);
        setProducts(list);
        setHasMore(1 < totalPages);

        if (cat === 'All Product' && !filt && !region) {
          const total = Array.isArray(data) ? list.length : (data?.total ?? list.length);
          setTotalCount(total);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(buildProductsUrl(activeCategory, activeFilter, activeRegion, nextPage));
      if (res.ok) {
        const data = await res.json();
        const list: Product[] = Array.isArray(data) ? data : (data.products || []);
        const totalPages = Array.isArray(data) ? 1 : (data.totalPages || 1);
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          return [...prev, ...list.filter((p) => !seen.has(p._id))];
        });
        setPage(nextPage);
        setHasMore(nextPage < totalPages);
      }
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLatestProducts(activeCategory, activeFilter, activeRegion);
  }, [activeCategory, activeFilter, activeRegion]);

  return (
    <main className="min-h-screen bg-white">
      <Hero />

      {/* Top picks today — sits directly under Browse by category */}
      <section id="top-picks" className="w-full bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-[1.75rem] font-bold text-slate-900 tracking-tight">
                {activeFilter || (activeCategory === 'All Product' ? 'Top picks today' : activeCategory)}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                {activeCategory === 'All Product' && !activeFilter
                  ? 'Fresh listings from shops across Ghana'
                  : totalCount > 0
                    ? `${totalCount} products from verified vendors`
                    : 'Fresh listings from shops across Ghana'}
              </p>
              {activeRegion && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-brand-lemon" /> {activeRegion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="p-2.5 bg-brand-lemon text-slate-900 rounded-md shadow-sm" aria-label="Grid view">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button type="button" className="p-2.5 text-slate-400 hover:text-slate-900 border border-slate-200 rounded-md transition-colors" aria-label="List view">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="bg-[#f7f8fa] rounded-xl border border-slate-100 p-3 md:p-4 mb-8 space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Category
              </span>
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveFilter('');
                  }}
                  className={`shrink-0 px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-lemon text-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-white border border-slate-100'
                  }`}
                >
                  {cat === 'All Product' ? 'All' : cat}
                  {cat === 'All Product' && totalCount > 0 && (
                    <span className="ml-1.5 text-[9px] opacity-70">{totalCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center border-t border-slate-200/60 pt-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Sort
                </span>
                {PRODUCT_FILTERS.map((filt) => (
                  <button
                    key={filt}
                    type="button"
                    onClick={() => setActiveFilter(activeFilter === filt ? '' : filt)}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      activeFilter === filt
                        ? 'bg-slate-900 text-brand-lemon'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>

              <div className="relative shrink-0 sm:w-52">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-lemon pointer-events-none" />
                <select
                  value={activeRegion}
                  onChange={(e) => setActiveRegion(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-md text-xs font-semibold appearance-none cursor-pointer focus:ring-2 focus:ring-brand-lemon/20"
                >
                  <option value="">All regions</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {(activeFilter || activeRegion || activeCategory !== 'All Product') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('');
                    setActiveRegion('');
                    setActiveCategory('All Product');
                  }}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {error && (
              <div className="col-span-full py-4 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 font-medium">
                {error}
              </div>
            )}
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-[#f7f8fa] animate-pulse rounded-xl border border-slate-100" />
              ))
            ) : products.length > 0 ? (
              products.map((product, index) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  images={product.images || ['/product-1.jpg']}
                  imageLabels={product.imageLabels}
                  sizes={product.sizes}
                  stock={product.stock}
                  vendorId={product.vendorId}
                  vendorName={product.vendorName}
                  uniqueVendorId={product.uniqueVendorId}
                  description={product.description}
                  hasSizes={product.hasSizes}
                  hasColors={product.hasColors}
                  colors={product.colors}
                  duration={product.tailoringTime}
                  vendorRegion={product.region}
                  vendorCity={product.vendorLocation}
                  vendorBio={product.vendorBio}
                  vendorDocumented={product.vendorDocumented}
                  vendorTier={product.vendorTier}
                  storeSlug={product.storeSlug}
                  index={index % HOME_PAGE_SIZE}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400">
                <p className="font-heading text-lg font-bold text-slate-900">No products found</p>
                <p className="text-sm mt-1">Try another category or region.</p>
              </div>
            )}
          </div>

          {!loading && products.length > 0 && (
            <div className="flex flex-col items-center gap-3 mt-14">
              {hasMore ? (
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="group flex items-center gap-3 px-12 py-3.5 bg-brand-lemon rounded-md text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                >
                  {loadingMore ? 'Loading…' : 'Show more'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${loadingMore ? 'animate-bounce' : 'group-hover:translate-y-0.5'}`} />
                </button>
              ) : (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  You&rsquo;ve reached the end
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <ProcessSection />

      <Footer />
    </main>
  );
}
