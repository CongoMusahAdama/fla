
"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import { ChevronDown, SlidersHorizontal, LayoutGrid, List, Check, Search } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Wrap content in Suspense for search params
function ShopContent() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All Product');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [localSearch, setLocalSearch] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?`;
                if (activeCategory !== 'All Product') {
                    const cat = activeCategory === 'For Men' ? 'Men' : activeCategory === 'For Women' ? 'Women' : activeCategory;
                    url += `category=${cat}&`;
                }
                if (localSearch) {
                    url += `search=${localSearch}&`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error('Error fetching shop products:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchProducts();
        }, 500); // Debounce search

        return () => clearTimeout(timer);
    }, [activeCategory, localSearch]);

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search');

    const filterData: Record<string, string[]> = {
        Color: ['Black', 'White', 'Blue', 'Purple', 'Green'],
        Size: ['Small', 'Medium', 'Large', 'XL', 'XXL'],
        Brand: ['FLA Bespoke', 'Signature Print', 'Urban Thread'],
        Price: ['Under GH₵500', 'GH₵500 - GH₵800', 'Over GH₵800']
    };

    // Using the same product data as homepage for consistency

    const categories = ['All Product', 'For Men', 'For Women'];

    const filteredProducts = products;

    // Toggle dropdown
    const toggleDropdown = (name: string) => {
        if (openDropdown === name) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(name);
        }
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Header Section - Modern Beige Style */}
            <section className="bg-[#F5F2Ed] pt-32 pb-16 px-4 md:px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between z-10 relative">
                    <div className="md:w-1/2 mb-8 md:mb-0">
                        <h1 className="font-heading text-5xl md:text-7xl font-bold text-slate-900 mb-4">Shop</h1>
                        <nav className="flex items-center text-sm font-medium text-slate-500 gap-2">
                            <Link href="/" className="hover:text-slate-900 transition-colors cursor-pointer">Home</Link>
                            <span>&rsaquo;</span>
                            <span className="text-slate-900">Shop</span>
                        </nav>
                    </div>

                    {/* Artistic Header Image */}
                    <div className="md:w-1/2 relative h-[300px] w-full">
                        <div className="absolute inset-0 flex items-center justify-center md:justify-end">
                            <div className="relative w-[400px] h-[300px] bg-white p-4 rotate-3 shadow-xl rounded-xl">
                                <Image
                                    src="/shop-header.png"
                                    alt="Shop Collection"
                                    fill
                                    className="object-cover rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Bar - Adjusted sticky offset for standard and mobile nav (100px total height) */}
            <section className="sticky top-[100px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 px-4 md:px-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">

                    {/* Left: Filter groups */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-6">
                        <div className="hidden sm:flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
                            <span>Filter by</span>
                            <div className="w-1.5 h-1.5 bg-brand-lemon rounded-full"></div>
                        </div>

                        {/* Search on Shop Page */}
                        <div className="relative flex items-center group w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:bg-white focus:outline-none focus:border-brand-lemon w-full sm:w-44 transition-all sm:focus:w-64"
                            />
                            <div className="absolute right-3 text-slate-400">
                                <Search className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Categories Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown('Categories')}
                                className={`flex items-center gap-1 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${activeCategory !== 'All Product' ? 'text-slate-900 bg-brand-lemon px-2 py-0.5 rounded-full' : 'text-slate-900 hover:text-brand-lemon'}`}
                            >
                                Categories <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'Categories' ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className={`absolute top-full left-0 mt-4 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-2 z-50 transition-all duration-200 origin-top-left ${openDropdown === 'Categories' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            setOpenDropdown(null);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer ${activeCategory === cat ? 'text-slate-900 bg-brand-lemon' : 'text-slate-700'}`}
                                    >
                                        {cat}
                                        {activeCategory === cat && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter Wrappers for Consistency */}
                        {['Color', 'Size', 'Price'].map((filter) => (
                            <div className="relative" key={filter}>
                                <button
                                    onClick={() => toggleDropdown(filter)}
                                    className={`flex items-center gap-1 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${activeFilters[filter] ? 'text-slate-900 bg-brand-lemon px-2 py-0.5 rounded-full' : 'text-slate-900 hover:text-brand-lemon'}`}
                                >
                                    {filter} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === filter ? 'rotate-180' : ''}`} />
                                    {activeFilters[filter] && <span className="ml-1 text-[10px] bg-white/50 px-1.5 rounded-full">{activeFilters[filter]}</span>}
                                </button>

                                {/* Generic Dropdown Content */}
                                <div className={`absolute top-full left-0 mt-4 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-2 z-50 transition-all duration-200 origin-top-left ${openDropdown === filter ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                    {filterData[filter].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setActiveFilters(prev => ({
                                                    ...prev,
                                                    [filter]: prev[filter] === option ? '' : option
                                                }));
                                                setOpenDropdown(null);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer ${activeFilters[filter] === option ? 'text-slate-900 bg-brand-lemon' : 'text-slate-700'}`}
                                        >
                                            {option}
                                            {activeFilters[filter] === option && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Sort & Layout */}
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 cursor-pointer">
                            Default Sorting <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="px-4 md:px-8 py-12 md:py-16 min-h-[600px] overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-slate-50 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                            {products.map((product, index) => (
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
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <p className="text-lg font-medium">No products found in this category.</p>
                            <button onClick={() => setActiveCategory('All Product')} className="mt-4 text-slate-900 bg-brand-lemon px-6 py-2 rounded-full font-bold hover:opacity-90 transition-all cursor-pointer">
                                Clear Filters
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-center mt-20 gap-3">
                        <button className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold cursor-pointer">1</button>
                        <button className="w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors">2</button>
                        <button className="w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors">3</button>
                        <button className="w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors">→</button>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <ShopContent />
        </Suspense>
    );
}
