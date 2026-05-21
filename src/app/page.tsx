"use client";

import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";
import Link from 'next/link';
import { Filter, ChevronRight, LayoutGrid, List, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { PRODUCT_CATEGORIES, GHANA_REGIONS, PRODUCT_FILTERS } from '@/lib/constants';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All Product');
  const [activeFilter, setActiveFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const [activeRegion, setActiveRegion] = useState('');

  const fetchLatestProducts = async (cat: string, filt: string, region: string) => {
    setLoading(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      let url = `${api}/products?limit=12`;
      if (cat !== 'All Product') url += `&category=${encodeURIComponent(cat)}`;
      if (filt) url += `&filter=${encodeURIComponent(filt)}`;
      if (region) url += `&region=${encodeURIComponent(region)}`;
      if (!filt) url += '&sort=latest';

      // Run product fetch and count in parallel (no more double sequential fetches)
      const fetches: Promise<any>[] = [fetch(url)];
      if (cat === 'All Product' && !filt && !region) {
        fetches.push(fetch(`${api}/products/count`));
      }

      const results = await Promise.all(fetches);

      if (results[0].ok) {
        const data = await results[0].json();
        setProducts(data);
      }

      if (results[1] && results[1].ok) {
        const count = await results[1].json();
        setTotalCount(typeof count === 'number' ? count : count?.count ?? 0);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
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

              {/* Mobile Region Filter */}
              <div className="mb-6">
                <select 
                  value={activeRegion}
                  onChange={(e) => setActiveRegion(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest focus:ring-0 shadow-sm transition-all"
                >
                  <option value="">Filter By Region</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveFilter('');
                    }}
                    className={`flex-none px-7 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap active:scale-95 ${activeCategory === cat
                      ? 'bg-slate-900 text-brand-lemon shadow-[0_15px_30px_rgba(0,0,0,0.15)] ring-1 ring-slate-800'
                      : 'bg-white text-slate-400 border border-slate-100'
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
                    index={index}
                    description={product.description}
                    hasSizes={product.hasSizes}
                    hasColors={product.hasColors}
                    colors={product.colors}
                    duration={product.tailoringTime}
                    vendorRegion={product.region}
                    vendorBio={product.vendorBio}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400">
                  No products found.
                </div>
              )}
            </div>

            {/* Explore More Button */}
            <div className="flex justify-center mt-20">
              <Link href="/shop">
                <button className="group flex items-center gap-3 px-16 py-4 bg-brand-lemon rounded-full text-xs font-bold text-slate-900 hover:bg-black hover:text-white transition-all duration-500 shadow-xl hover:shadow-2xl cursor-pointer">
                  Explore More Collection
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProcessSection />

      <Footer />
    </main>
  );
}
