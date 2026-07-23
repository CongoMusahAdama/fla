"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ChevronDown, LayoutGrid, List, Check, Search, X, SlidersHorizontal } from 'lucide-react';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { GHANA_REGIONS } from '@/lib/ghana-regions';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

const REGION_ALL_LABEL = 'All Regions';
const PRICE_ALL_LABEL = 'All Prices';

const PRODUCTS_PER_PAGE = 12;

/**
 * Filter panel.
 * Mobile: a bottom sheet anchored to the viewport bottom so every option is
 * reachable and scrollable (avoids the iOS Safari bug where backdrop-blur on the
 * sticky bar traps `position: fixed` children and clips the list).
 * Desktop: a normal dropdown anchored under its trigger button.
 */
const FILTER_DROPDOWN_PANEL =
    'z-[70] bg-white shadow-2xl border border-gray-100 transition-all duration-200 ' +
    'fixed inset-x-0 bottom-0 top-auto max-h-[75dvh] overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl p-3 ' +
    'sm:absolute sm:inset-auto sm:left-0 sm:right-auto sm:bottom-auto sm:top-full sm:mt-4 sm:w-52 sm:max-h-[min(50vh,320px)] sm:rounded-xl sm:p-2 sm:shadow-xl';

function dropdownPanelClass(isOpen: boolean) {
    return `${FILTER_DROPDOWN_PANEL} ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none sm:translate-y-0'}`;
}

function getPriceQueryParams(priceLabel?: string): Record<string, string> {
    if (!priceLabel || priceLabel === PRICE_ALL_LABEL) return {};
    if (priceLabel === 'Under GH₵500') return { priceLt: '500' };
    if (priceLabel === 'GH₵500 - GH₵800') return { minPrice: '500', maxPrice: '800' };
    if (priceLabel === 'Over GH₵800') return { priceGt: '800' };
    return {};
}

function ShopContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [activeCategory, setActiveCategory] = useState('All Product');
    const [catalogFilter, setCatalogFilter] = useState('');
    const [catalogSort, setCatalogSort] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [localSearch, setLocalSearch] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearchPinned, setIsSearchPinned] = useState(false);
    const suppressSuggestionsRef = useRef(false);
    const searchSentinelRef = useRef<HTMLDivElement>(null);

    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category');
    const urlFilter = searchParams.get('filter') || '';
    const urlSort = searchParams.get('sort') || '';

    useEffect(() => {
        setLocalSearch(urlSearch);
        setActiveCategory(urlCategory || 'All Product');
        setCatalogFilter(urlFilter);
        setCatalogSort(urlSort);
        setCurrentPage(1);
    }, [urlSearch, urlCategory, urlFilter, urlSort]);

    // Compact sticky search once the hero scrolls away
    useEffect(() => {
        const sentinel = searchSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsSearchPinned(!entry.isIntersecting),
            {
                // Navbar collapses to ~72px on scroll
                rootMargin: '-80px 0px 0px 0px',
                threshold: 0,
            },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    const pushShopParams = (next: {
        search?: string;
        category?: string;
        filter?: string;
        sort?: string;
    }) => {
        const params = new URLSearchParams();
        const search = next.search !== undefined ? next.search : localSearch;
        const category = next.category !== undefined ? next.category : activeCategory;
        const filter = next.filter !== undefined ? next.filter : catalogFilter;
        const sort = next.sort !== undefined ? next.sort : catalogSort;

        if (search.trim()) params.set('search', search.trim());
        if (category && category !== 'All Product') params.set('category', category);
        if (filter) params.set('filter', filter);
        if (sort) params.set('sort', sort);

        const q = params.toString();
        router.push(q ? `/shop?${q}` : '/shop', { scroll: false });
    };

    useEffect(() => {
        if (suppressSuggestionsRef.current) {
            suppressSuggestionsRef.current = false;
            return;
        }

        const fetchSuggestions = async () => {
            if (localSearch.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const res = await fetch(`${api}/products/suggestions?search=${encodeURIComponent(localSearch)}`);
                if (res.ok) setSuggestions(await res.json());
            } catch (err) {
                console.error("Suggestions fetch error:", err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [localSearch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, localSearch, activeFilters.Region, activeFilters.Price, catalogFilter, catalogSort]);

    useEffect(() => {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const controller = new AbortController();

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('page', String(currentPage));
                params.set('limit', String(PRODUCTS_PER_PAGE));
                if (activeCategory !== 'All Product') params.set('category', activeCategory);
                if (localSearch.trim()) params.set('search', localSearch.trim());
                if (catalogFilter) params.set('filter', catalogFilter);
                if (catalogSort) params.set('sort', catalogSort);
                if (activeFilters.Region) params.set('region', activeFilters.Region);
                const priceParams = getPriceQueryParams(activeFilters.Price);
                Object.entries(priceParams).forEach(([key, value]) => params.set(key, value));

                const response = await fetch(`${api}/products?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setProducts(data);
                        setTotalPages(1);
                        setTotalProducts(data.length);
                    } else {
                        setProducts(data.products || []);
                        setTotalPages(data.totalPages || 1);
                        setTotalProducts(data.total ?? data.products?.length ?? 0);
                    }
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching shop products:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        const delay = localSearch ? 400 : 0;
        const timer = setTimeout(fetchProducts, delay);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [activeCategory, localSearch, activeFilters.Region, activeFilters.Price, currentPage, catalogFilter, catalogSort]);

    useEffect(() => {
        if (!openDropdown) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [openDropdown]);

    const filterData: Record<string, string[]> = {
        Region: [REGION_ALL_LABEL, ...GHANA_REGIONS],
        Price: [PRICE_ALL_LABEL, 'Under GH₵500', 'GH₵500 - GH₵800', 'Over GH₵800']
    };

    const categories = PRODUCT_CATEGORIES;

    const activeShelfLabel =
        catalogFilter ||
        (catalogSort === 'latest' ? 'New Arrival' : '') ||
        (activeCategory !== 'All Product' ? activeCategory : '') ||
        (localSearch ? `Results for "${localSearch}"` : '');

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const clearAll = () => {
        setActiveFilters({});
        setLocalSearch('');
        setActiveCategory('All Product');
        setCatalogFilter('');
        setCatalogSort('');
        router.push('/shop', { scroll: false });
    };

    return (
        <main className="min-h-screen bg-[#F4F6F8] font-sans">
            {openDropdown && (
                <button
                    type="button"
                    aria-label="Close filter menu"
                    className="fixed inset-0 z-[35] bg-slate-900/30 cursor-default"
                    onClick={() => setOpenDropdown(null)}
                />
            )}

            {/* Catalog header — brand blue */}
            <section className="relative bg-brand-blue text-white overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-brand-lemon/15 blur-2xl" />
                    <div className="absolute left-1/3 -bottom-28 w-80 h-80 rounded-full bg-white/5" />
                </div>
                <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-10 md:pb-12">
                    <nav className="flex items-center text-xs font-medium text-white/55 gap-2 mb-4">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span className="text-white/30">/</span>
                        <span className="text-brand-lemon font-semibold">Shop</span>
                        {activeShelfLabel ? (
                            <>
                                <span className="text-white/30">/</span>
                                <span className="text-white/80 truncate max-w-[200px]">{activeShelfLabel}</span>
                            </>
                        ) : null}
                    </nav>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
                        Shop
                    </h1>
                    <p className="mt-3 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed">
                        Discover products from verified vendors across Ghana.
                    </p>
                </div>
            </section>

            <div ref={searchSentinelRef} className="h-px w-full" aria-hidden />

            {/* Search + filters */}
            <section
                className={`z-40 border-b border-slate-200/80 bg-white transition-[box-shadow] duration-300 ${
                    isSearchPinned
                        ? 'sticky top-16 md:top-[4.5rem] shadow-[0_8px_24px_rgba(15,39,68,0.08)]'
                        : 'relative'
                }`}
            >
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                            isSearchPinned ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-36 opacity-100 pt-5 md:pt-6'
                        }`}
                    >
                        <div className="relative max-w-2xl mb-4">
                            <div className="flex items-stretch h-12 rounded-xl border border-slate-200 overflow-hidden bg-white focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15 transition-shadow">
                                <div className="flex items-center pl-3.5 pr-1 text-slate-400">
                                    <Search className="w-4.5 h-4.5 w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search products, brands, or shops…"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            pushShopParams({ search: localSearch });
                                            setSuggestions([]);
                                        }
                                    }}
                                    className="flex-1 min-w-0 px-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                                />
                                {localSearch && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => {
                                            setLocalSearch('');
                                            setSuggestions([]);
                                            pushShopParams({ search: '' });
                                        }}
                                        className="px-3 text-slate-400 hover:text-slate-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        pushShopParams({ search: localSearch });
                                        setSuggestions([]);
                                    }}
                                    className="px-5 bg-brand-blue text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                                >
                                    Search
                                </button>
                            </div>

                            {localSearch.length >= 2 && suggestions.length > 0 && !isSearchPinned && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden z-[50]">
                                    <p className="px-4 py-2 text-[11px] font-medium tracking-wide text-slate-500 bg-slate-50 border-b border-slate-100">
                                        Suggestions
                                    </p>
                                    {(suggestions || []).map((s: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                suppressSuggestionsRef.current = true;
                                                setLocalSearch(s.text);
                                                setSuggestions([]);
                                                pushShopParams({ search: s.text });
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                                        >
                                            <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                                <Search className="w-3.5 h-3.5 text-slate-300" />
                                                {s.text}
                                            </span>
                                            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {s.type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className={`flex flex-wrap items-center gap-2 justify-between transition-all duration-300 ${
                            isSearchPinned ? 'py-2.5' : 'pb-4'
                        }`}
                    >
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            {isSearchPinned && localSearch && (
                                <span className="hidden sm:inline-flex items-center gap-1.5 h-8 max-w-[160px] px-2.5 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-600 truncate">
                                    <Search className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{localSearch}</span>
                                </span>
                            )}

                            {!isSearchPinned && (
                                <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-slate-400 mr-1">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filters
                                </span>
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('Categories')}
                                    className={`inline-flex items-center gap-1 rounded-lg text-xs font-medium border transition-colors h-8 px-2.5 sm:px-3 ${
                                        activeCategory !== 'All Product'
                                            ? 'bg-brand-blue border-brand-blue text-white'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-brand-blue'
                                    }`}
                                >
                                    {activeCategory === 'All Product' ? 'Category' : activeCategory.split('/')[0]}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'Categories' ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={dropdownPanelClass(openDropdown === 'Categories')}>
                                    {openDropdown === 'Categories' && (
                                        <div className="sm:hidden sticky top-0 bg-white z-10 pb-2 mb-1 border-b border-slate-100">
                                            <div className="mx-auto mt-1 mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                                            <div className="flex items-center justify-between px-3">
                                                <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                                                    Categories ({categories.length})
                                                </p>
                                                <button
                                                    onClick={() => setOpenDropdown(null)}
                                                    className="text-[11px] font-semibold text-brand-blue px-2 py-1"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setActiveCategory(cat);
                                                setOpenDropdown(null);
                                                pushShopParams({ category: cat });
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer ${activeCategory === cat ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-700'}`}
                                        >
                                            {cat}
                                            {activeCategory === cat && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {['Region', 'Price'].map((filter) => (
                                <div className="relative" key={filter}>
                                    <button
                                        onClick={() => toggleDropdown(filter)}
                                        className={`inline-flex items-center gap-1 rounded-lg text-xs font-medium border transition-colors h-8 px-2.5 sm:px-3 ${
                                            activeFilters[filter]
                                                ? 'bg-brand-blue border-brand-blue text-white'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-brand-blue'
                                        }`}
                                    >
                                        {activeFilters[filter] || filter}
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === filter ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={dropdownPanelClass(openDropdown === filter)}>
                                        {openDropdown === filter && (
                                            <div className="sm:hidden sticky top-0 bg-white z-10 pb-2 mb-1 border-b border-slate-100">
                                                <div className="mx-auto mt-1 mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                                                <div className="flex items-center justify-between px-3">
                                                    <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                                                        {filter === 'Region' ? `Region (${GHANA_REGIONS.length})` : filter}
                                                    </p>
                                                    <button
                                                        onClick={() => setOpenDropdown(null)}
                                                        className="text-[11px] font-semibold text-brand-blue px-2 py-1"
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {filterData[filter].map((option) => {
                                            const isRegionAll = filter === 'Region' && option === REGION_ALL_LABEL;
                                            const isPriceAll = filter === 'Price' && option === PRICE_ALL_LABEL;
                                            const clearsFilter = isRegionAll || isPriceAll;
                                            const isSelected = clearsFilter
                                                ? !activeFilters[filter]
                                                : activeFilters[filter] === option;
                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => {
                                                        setActiveFilters(prev => ({
                                                            ...prev,
                                                            [filter]: clearsFilter ? '' : (prev[filter] === option ? '' : option),
                                                        }));
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-700'}`}
                                                >
                                                    {option}
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {(localSearch || activeCategory !== 'All Product' || catalogFilter || catalogSort || activeFilters.Region || activeFilters.Price) && (
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-brand-blue text-white' : 'bg-white text-slate-400 hover:text-slate-700'}`}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-brand-blue text-white' : 'bg-white text-slate-400 hover:text-slate-700'}`}
                                    aria-label="List view"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                            isSearchPinned
                                ? 'max-h-0 opacity-0 pointer-events-none'
                                : 'max-h-12 opacity-100 pb-4'
                        }`}
                    >
                        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                            {categories.slice(0, 12).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        setActiveCategory(cat);
                                        pushShopParams({ category: cat });
                                    }}
                                    className={`shrink-0 h-8 px-3.5 rounded-full text-[11px] font-medium transition-all ${
                                        activeCategory === cat
                                            ? 'bg-brand-blue text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-brand-lemon/40 hover:text-slate-900'
                                    }`}
                                >
                                    {cat === 'All Product' ? 'All' : cat.split('/')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Product shelf */}
            <section className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-[560px]">
                <div className="max-w-[1440px] mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
                        <div>
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
                                {activeShelfLabel || 'All products'}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {!loading && totalProducts > 0
                                    ? `Showing ${(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–${Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)} of ${totalProducts}`
                                    : 'Browse verified vendors across Ghana'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-flex items-center justify-center">
                                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                </span>
                                Documented
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-flex items-center justify-center">
                                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                </span>
                                Pending docs
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="aspect-[4/3] bg-white animate-pulse rounded-xl border border-slate-200/80" />
                            ))}
                        </div>
                    ) : (products || []).length > 0 ? (
                        <div className={
                            viewMode === 'list'
                                ? 'flex flex-col gap-5'
                                : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5'
                        }>
                            {(products || []).map((product, index) => (
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
                                    description={product.description}
                                    vendorName={product.vendorName}
                                    uniqueVendorId={product.uniqueVendorId}
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
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-lg font-semibold text-slate-900">No items found</p>
                            <p className="text-sm mt-2 max-w-sm text-center text-slate-500">Try another search, category, or clear your filters.</p>
                            <button
                                onClick={clearAll}
                                className="mt-7 h-11 px-7 bg-brand-blue text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {!loading && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12 pt-8 border-t border-slate-200">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => {
                                    setCurrentPage((p) => Math.max(1, p - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="h-10 px-5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((pageNum, idx, arr) => {
                                        const prev = arr[idx - 1];
                                        const showEllipsis = prev !== undefined && pageNum - prev > 1;
                                        return (
                                            <React.Fragment key={pageNum}>
                                                {showEllipsis && <span className="text-slate-300 px-1">…</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentPage(pageNum);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                                                        currentPage === pageNum
                                                            ? 'bg-brand-blue text-white'
                                                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                            </div>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => {
                                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="h-10 px-5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
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
