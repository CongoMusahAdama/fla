"use client";

import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";
import Link from 'next/link';
import { Filter, ChevronRight, LayoutGrid, List } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?limit=9&sort=latest`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching latest products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />

      <section className="w-full px-4 md:px-8 py-10 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-12">

          {/* Sidebar - Hidden on Mobile */}
          <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Category</h3>
              <div className="space-y-2">
                {['All Product', 'For Men', 'For Women'].map((cat, i) => (
                  <button key={cat} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}>
                    <span className={i === 0 ? 'opacity-100' : 'opacity-50'}>
                      {i === 0 ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    </span>
                    {cat}
                    {i === 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">12</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Filters</h3>
              <div className="space-y-1">
                {['New Arrival', 'Best Seller', 'On Discount'].map((filter) => (
                  <button key={filter} className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:text-slate-900 flex justify-between items-center group cursor-pointer">
                    {filter}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue" />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Areas */}
          <div className="flex-1">
            {/* Mobile Categories - Luxury Scroll */}
            <div className="md:hidden mb-12">
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="font-heading text-2xl font-black text-slate-900 uppercase tracking-tighter">Collections</h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-lemon animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">New Arrivals</span>
                </div>
              </div>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                {['All Product', 'For Men', 'For Women', 'Accessories', 'Limited'].map((cat, i) => (
                  <button
                    key={cat}
                    className={`flex-none px-7 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap active:scale-95 ${i === 0
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
              <h2 className="font-heading text-xl md:text-2xl font-black text-slate-900 uppercase">New Arrivals</h2>
              <div className="flex gap-2">
                <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-900 active:bg-slate-50 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors"><List className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                    index={index}
                    batchSize={product.batchSize}
                    currentBatchCount={product.currentBatchCount}
                    wholesalePrice={product.wholesalePrice}
                    batchStatus={product.batchStatus}
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
