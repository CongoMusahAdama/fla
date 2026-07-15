"use client";

import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";
import { Filter, ChevronRight, ChevronDown, LayoutGrid, List, MapPin } from 'lucide-react';
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
    if (filt) url += `&filter=${encodeURIComponent(filt)}`;
    if (region) url += `&region=${encodeURIComponent(region)}`;
    if (!filt) url += '&sort=latest';
    return url;
  };

  const fetchLatestProducts = async (cat: string, filt: string, region: string) => {
    setLoading(true);
    setPage(1);
    try {
      const res = await fetch(buildProductsUrl(cat, filt, region, 1));

      if (res.ok) {
        const data = await res.json();
        const list: Product[] = Array.isArray(data) ? data : (data.products || []);
        const totalPages = Array.isArray(data) ? 1 : (data.totalPages || 1);
        setProducts(list);
        setHasMore(1 < totalPages);

        if (cat === 'All Product' && !filt && !region) {
          const total = Array.isArray(data) ? list.length : (data.total ?? list.length);
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
    <main className="min-h-screen bg-gray-50">
      <Hero />

      <section className="w-full px-4 md:px-8 py-10 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-12">

          {/* Sidebar - Hidden on Mobile */}
          <aside className="hidden md:block w-64 flex-shrink-0 space-y-8 sticky top-32 h-fit self-start max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
            {/* Region Filter */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-blue" />
                Select Region
              </h3>
              <div className="relative group">
                <select 
                  value={activeRegion}
                  onChange={(e) => setActiveRegion(e.target.value)}
                  className="w-full pl-5 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-slate-900/10 transition-all hover:bg-slate-100"
                >
                  <option value="">All Regions</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-900 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Category</h3>
              <div className="space-y-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveFilter('');
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}>
                    <span className={activeCategory === cat ? 'opacity-100' : 'opacity-50'}>
                      {cat === 'All Product' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    </span>
                    {cat}
                    {cat === 'All Product' && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{totalCount || 0}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Filters</h3>
              <div className="space-y-1">
                {PRODUCT_FILTERS.map((filt) => (
                  <button
                    key={filt}
                    onClick={() => setActiveFilter(filt)}
                    className={`w-full text-left px-4 py-2 text-sm flex justify-between items-center group cursor-pointer transition-colors ${activeFilter === filt ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'}`}>
                    {filt}
                    <ChevronRight className={`w-4 h-4 transition-all ${activeFilter === filt ? 'opacity-100 translate-x-1 text-slate-900' : 'opacity-0 group-hover:opacity-100 text-brand-blue'}`} />
                  </button>
                ))}
                {(activeFilter || activeRegion) && (
                  <button
                    onClick={() => {
                      setActiveFilter('');
                      setActiveRegion('');
                    }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 hover:bg-red-50 transition-colors rounded-lg"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Areas */}
          <div className="flex-1">
            {/* Mobile Categories - Luxury Scroll */}
            <div className="md:hidden mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-heading text-2xl font-black text-slate-900 uppercase tracking-tighter">Collections</h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-lemon animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">New Arrivals</span>
                </div>
              </div>

              {/* Mobile Region — native picker shows all 16 regions on iOS/Android */}
              <div className="mb-4">
                <label htmlFor="mobile-region-filter" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                  Region ({GHANA_REGIONS.length} regions)
                </label>
                <select
                  id="mobile-region-filter"
                  value={activeRegion}
                  onChange={(e) => setActiveRegion(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                >
                  <option value="">All Regions</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                Categories — scroll for all {PRODUCT_CATEGORIES.length}
              </p>
              <div className="max-h-[min(45dvh,280px)] overflow-y-auto overscroll-contain touch-pan-y rounded-2xl border border-slate-100 bg-white p-2 space-y-1 mb-4">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveFilter('');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                      ? 'bg-slate-900 text-brand-lemon shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-xl md:text-2xl font-black text-slate-900 uppercase">
                  {activeFilter || activeCategory}
                </h2>
                {activeRegion && (
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {activeRegion}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-900 active:bg-slate-50 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors"><List className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {error && (
                <div className="col-span-full py-4 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 font-medium">
                  {error}
                </div>
              )}
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-slate-100 animate-pulse rounded-2xl" />
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
                    index={index % HOME_PAGE_SIZE}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400">
                  No products found.
                </div>
              )}
            </div>

            {/* Show More — loads more products inline */}
            {!loading && products.length > 0 && (
              <div className="flex flex-col items-center gap-3 mt-20">
                {hasMore ? (
                  <button
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="group flex items-center gap-3 px-16 py-4 bg-brand-lemon rounded-full text-xs font-bold text-slate-900 hover:bg-black hover:text-white transition-all duration-500 shadow-xl hover:shadow-2xl cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                  >
                    {loadingMore ? 'Loading…' : 'Show More'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${loadingMore ? 'animate-bounce' : 'group-hover:translate-y-0.5'}`} />
                  </button>
                ) : (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    You&rsquo;ve reached the end
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <ProcessSection />

      <Footer />
    </main>
  );
}
