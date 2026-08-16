"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { LayoutDashboard, Wallet, Calendar, Copy, LogOut, CheckCircle2, History, Package, Eye, EyeOff, RefreshCcw, Search, MapPin, Plus, X as XIcon } from 'lucide-react';
import { GHANA_REGIONS } from '@/lib/ghana-regions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function RefereeDashboard() {
    const { user, token, logout, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [storeProducts, setStoreProducts] = useState<any[]>([]);
    const [hiddenProducts, setHiddenProducts] = useState<string[]>([]);
    const [storeCap, setStoreCap] = useState(50);
    const [autoFillCount, setAutoFillCount] = useState(10);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'store' | 'history'>('overview');
    const [storeSubTab, setStoreSubTab] = useState<'mine' | 'browse'>('mine');

    // Product picker (browse & add) state
    const [pickerRegion, setPickerRegion] = useState('');
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerProducts, setPickerProducts] = useState<any[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);
    const [pickerSuggestions, setPickerSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'referee')) {
            router.push('/referee');
            return;
        }

        if (isAuthenticated && user?.role === 'referee' && user.status === 'active') {
            fetchDashboardData();
        } else if (isAuthenticated && user?.role === 'referee') {
            setLoading(false);
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
            const [dashRes, storeRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/dashboard`, { credentials: 'include', headers: authHeaders }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/my-store`, { credentials: 'include', headers: authHeaders })
            ]);

            if (dashRes.ok) {
                setDashboardData(await dashRes.json());
            } else {
                setLoadError(true);
            }
            if (storeRes.ok) {
                const storeData = await storeRes.json();
                setStoreProducts(storeData.products || []);
                setHiddenProducts(storeData.hiddenIds || []);
                setStoreCap(storeData.cap || 50);
                setAutoFillCount(storeData.autoFillCount || 10);
                setPickerSelectedIds((storeData.products || []).map((p: any) => p._id));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const authHeaders = (): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {});

    const fetchBrowseProducts = async () => {
        setPickerLoading(true);
        try {
            const params = new URLSearchParams();
            if (pickerRegion) params.set('region', pickerRegion);
            if (pickerSearch) params.set('search', pickerSearch);
            const res = await fetch(`${API_URL}/referral/browse-products?${params.toString()}`, {
                credentials: 'include',
                headers: authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setPickerProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error browsing products:', error);
        } finally {
            setPickerLoading(false);
        }
    };

    useEffect(() => {
        if (storeSubTab === 'browse' && isAuthenticated && user?.role === 'referee' && user.status === 'active') {
            fetchBrowseProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeSubTab, pickerRegion]);

    // Live suggestions dropdown as the referee types a product name.
    useEffect(() => {
        if (storeSubTab !== 'browse' || !pickerSearch.trim()) {
            setPickerSuggestions([]);
            return;
        }
        const handle = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ search: pickerSearch, limit: '6' });
                if (pickerRegion) params.set('region', pickerRegion);
                const res = await fetch(`${API_URL}/referral/browse-products?${params.toString()}`, {
                    credentials: 'include',
                    headers: authHeaders(),
                });
                if (res.ok) {
                    const data = await res.json();
                    setPickerSuggestions(data.products || []);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pickerSearch, storeSubTab, pickerRegion]);

    const handleSelectProduct = async (productId: string) => {
        if (pickerSelectedIds.length >= storeCap) {
            Swal.fire({ icon: 'warning', title: 'Store is full', text: `You can feature up to ${storeCap} products. Remove one first.` });
            return;
        }
        try {
            const res = await fetch(`${API_URL}/referral/my-store/select/${productId}`, {
                method: 'POST',
                credentials: 'include',
                headers: authHeaders(),
            });
            if (res.ok) {
                setPickerSelectedIds((prev) => [...prev, productId]);
                fetchDashboardData();
            } else {
                const err = await res.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Could not add product', text: err.message || 'Please try again.' });
            }
        } catch (error) {
            console.error('Error selecting product:', error);
        }
    };

    const handleUnselectProduct = async (productId: string) => {
        try {
            const res = await fetch(`${API_URL}/referral/my-store/select/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeaders(),
            });
            if (res.ok) {
                setPickerSelectedIds((prev) => prev.filter((id) => id !== productId));
                setStoreProducts((prev) => prev.filter((p: any) => p._id !== productId));
            }
        } catch (error) {
            console.error('Error removing product:', error);
        }
    };

    const toggleHideProduct = async (productId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/my-store/toggle/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                credentials: 'include'
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.hidden) {
                    setHiddenProducts([...hiddenProducts, productId]);
                } else {
                    setHiddenProducts(hiddenProducts.filter(id => id !== productId));
                }
            }
        } catch (error) {
            console.error('Error toggling product visibility:', error);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `${label} copied!`,
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1F5] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div>
            </div>
        );
    }

    if (user?.status && user.status !== 'active') {
        const isRejected = user.status === 'rejected';
        const isBanned = user.status === 'banned';
        return (
            <div className="min-h-screen bg-[#EEF1F5] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <CheckCircle2 className={`w-7 h-7 ${isRejected || isBanned ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                    {isBanned ? 'Account suspended' : isRejected ? 'Application declined' : 'Application under review'}
                </h1>
                <p className="text-sm text-slate-500 max-w-sm">
                    {isBanned
                        ? 'Your referee account has been suspended. Contact support if you believe this is an error.'
                        : isRejected
                            ? 'Your referee application was declined. Please ensure your KYC documents are clear and valid, then contact support to reapply.'
                            : "We're reviewing your Ghana Card, selfie, and payout details. You'll get an SMS once you're approved to start earning."}
                </p>
                <button onClick={logout} className="inline-flex items-center gap-2 h-10 px-5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-[#EEF1F5] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-slate-600 font-medium">
                    {loadError ? "We couldn't load your dashboard. Please try again." : 'No dashboard data available.'}
                </p>
                <button
                    onClick={fetchDashboardData}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-brand-lemon text-slate-900 font-semibold text-sm rounded-xl shadow-sm hover:bg-brand-lemon-hover transition-all"
                >
                    <RefreshCcw className="w-4 h-4" /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col p-4 space-y-2 md:min-h-screen">
                <div className="mb-6 px-2 flex items-center gap-3">
                    <Image src="/logo.jpeg" alt="FLA" width={32} height={32} className="rounded-lg shadow-sm" />
                    <span className="font-bold text-slate-900 tracking-tight">Affiliate Hub</span>
                </div>

                <nav className="flex-1 space-y-1 overflow-x-auto flex md:flex-col pb-2 md:pb-0 scrollbar-hide">
                    <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm whitespace-nowrap md:whitespace-normal ${activeTab === 'overview' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                        <LayoutDashboard className="w-5 h-5" /> Overview
                    </button>
                    <button onClick={() => setActiveTab('store')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm whitespace-nowrap md:whitespace-normal ${activeTab === 'store' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                        <Package className="w-5 h-5" /> My Store Products
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm whitespace-nowrap md:whitespace-normal ${activeTab === 'history' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                        <History className="w-5 h-5" /> Commission History
                    </button>
                </nav>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3 mb-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Referral Code</p>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{dashboardData.refereeCode}</span>
                            <button onClick={() => copyToClipboard(dashboardData.refereeCode, 'Code')} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm w-full">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
                                <p className="text-sm text-slate-500 mt-1">Here's how your referrals are performing.</p>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/ref/${dashboardData.refereeStoreSlug}`} target="_blank" className="inline-flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                                    <Eye className="w-4 h-4" /> View Storefront
                                </Link>
                                <button onClick={() => copyToClipboard(dashboardData.storeUrl, 'Store Link')} className="inline-flex items-center gap-2 h-10 px-4 bg-brand-lemon text-slate-900 font-semibold text-sm rounded-xl shadow-sm hover:bg-brand-lemon-hover transition-all">
                                    <Copy className="w-4 h-4" /> Copy Store Link
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Today's Earnings" amount={dashboardData.todayEarnings} icon={Wallet} color="text-emerald-600" bg="bg-emerald-100" />
                            <StatCard title="This Month" amount={dashboardData.monthEarnings} icon={Calendar} color="text-blue-600" bg="bg-blue-100" />
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {dashboardData.walletBalance > 0 ? 'Pending Payout' : 'Payouts'}
                                        </p>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">GHS {dashboardData.walletBalance.toFixed(2)}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {dashboardData.walletBalance > 0
                                        ? "We'll settle this to your account automatically."
                                        : 'Paid automatically to your MoMo/bank via Paystack.'}
                                </p>
                            </div>
                            <StatCard title="Lifetime Earnings" amount={dashboardData.lifetimeEarnings} icon={CheckCircle2} color="text-amber-600" bg="bg-amber-100" />
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900">Recent Commissions</h2>
                                <button onClick={() => setActiveTab('history')} className="text-sm font-medium text-brand-blue hover:underline">View All</button>
                            </div>
                            {dashboardData.history?.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardData.history.slice(0, 5).map((item: any) => (
                                        <div key={item._id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{item.productNames.join(', ')}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Sold by {item.vendorName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600">+ GHS {item.commission.toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(item.creditedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><Wallet className="w-6 h-6" /></div>
                                    <p className="text-sm font-medium text-slate-600">No commissions yet.</p>
                                    <p className="text-xs text-slate-400 mt-1">Share your links to start earning.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'store' && (
                    <div className="space-y-6">
                        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Store Products</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {storeProducts.length}/{storeCap} selected · {autoFillCount} auto-assigned slots from your region
                                </p>
                            </div>
                            <div className="flex p-1 bg-slate-100 rounded-full w-fit">
                                <button onClick={() => setStoreSubTab('mine')} className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${storeSubTab === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                    In My Store
                                </button>
                                <button onClick={() => setStoreSubTab('browse')} className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${storeSubTab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                    Browse & Add
                                </button>
                            </div>
                        </header>

                        {storeSubTab === 'mine' && (
                            storeProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {storeProducts.map((product) => {
                                        const isHidden = hiddenProducts.includes(product._id);
                                        const productUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://flamingo-store1.com'}/product/${product._id}?ref=${dashboardData.refereeCode}`;

                                        return (
                                            <div key={product._id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all ${isHidden ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                                                <div className="aspect-[4/5] relative bg-slate-100">
                                                    <Image src={product.images[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
                                                    {product.selectionSource === 'auto' && (
                                                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-full">Auto</span>
                                                    )}
                                                    {isHidden && <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center"><span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">Hidden</span></div>}
                                                </div>
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product.vendorName}</p>
                                                    <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 mb-2 flex-1">{product.name}</h3>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="font-bold text-slate-900">GHS {product.price.toFixed(2)}</span>
                                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Earn GHS {(product.price * 0.02).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => copyToClipboard(productUrl, 'Product Link')} disabled={isHidden} className="flex-1 h-9 bg-brand-lemon text-slate-900 text-xs font-semibold rounded-lg hover:bg-brand-lemon-hover transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <Copy className="w-3.5 h-3.5" /> Copy Link
                                                        </button>
                                                        <button onClick={() => toggleHideProduct(product._id)} className="w-9 h-9 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center justify-center transition-colors">
                                                            {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        </button>
                                                        <button onClick={() => handleUnselectProduct(product._id)} className="w-9 h-9 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors">
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-slate-600">Your store is empty.</p>
                                    <p className="text-xs text-slate-400 mt-1">Switch to "Browse & Add" to pick products.</p>
                                </div>
                            )
                        )}

                        {storeSubTab === 'browse' && (
                            <div className="space-y-5">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search products…"
                                            value={pickerSearch}
                                            onChange={(e) => setPickerSearch(e.target.value)}
                                            onFocus={() => pickerSuggestions.length > 0 && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                            onKeyDown={(e) => e.key === 'Enter' && (setShowSuggestions(false), fetchBrowseProducts())}
                                            className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-lemon/30"
                                        />
                                        {showSuggestions && pickerSuggestions.length > 0 && (
                                            <div className="absolute z-20 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                                {pickerSuggestions.map((product) => {
                                                    const isSelected = pickerSelectedIds.includes(product._id);
                                                    return (
                                                        <button
                                                            key={product._id}
                                                            type="button"
                                                            onClick={() => {
                                                                if (!isSelected) handleSelectProduct(product._id);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="w-9 h-9 rounded-lg bg-slate-100 relative overflow-hidden shrink-0">
                                                                <Image src={product.images?.[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                                                                <p className="text-xs text-slate-400 truncate">{product.vendorName} · GHS {product.price?.toFixed(2)}</p>
                                                            </div>
                                                            {isSelected ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            ) : (
                                                                <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative sm:w-56">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-lemon pointer-events-none" />
                                        <select
                                            value={pickerRegion}
                                            onChange={(e) => setPickerRegion(e.target.value)}
                                            className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-brand-lemon/30"
                                        >
                                            <option value="">All regions</option>
                                            {GHANA_REGIONS.map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={fetchBrowseProducts} className="h-10 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                                        Search
                                    </button>
                                </div>

                                {pickerLoading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="w-8 h-8 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div>
                                    </div>
                                ) : pickerProducts.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                        {pickerProducts.map((product) => {
                                            const isSelected = pickerSelectedIds.includes(product._id);
                                            return (
                                                <div key={product._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all">
                                                    <div className="aspect-[4/5] relative bg-slate-100">
                                                        <Image src={product.images?.[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
                                                    </div>
                                                    <div className="p-4 flex-1 flex flex-col">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product.vendorName}</p>
                                                        <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 mb-2 flex-1">{product.name}</h3>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="font-bold text-slate-900">GHS {product.price?.toFixed(2)}</span>
                                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Earn GHS {(product.price * 0.02).toFixed(2)}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => (isSelected ? handleUnselectProduct(product._id) : handleSelectProduct(product._id))}
                                                            className={`h-9 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                                                isSelected
                                                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                    : 'bg-brand-lemon text-slate-900 hover:bg-brand-lemon-hover'
                                                            }`}
                                                        >
                                                            {isSelected ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Added</>) : (<><Plus className="w-3.5 h-3.5" /> Add to Store</>)}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-slate-600">No products found.</p>
                                        <p className="text-xs text-slate-400 mt-1">Try a different region or search term.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <header>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Commission History</h2>
                            <p className="text-sm text-slate-500 mt-1">A detailed record of your affiliate earnings.</p>
                        </header>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-4 font-semibold">Date</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold">Items Sold</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold">Vendor</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold">Sale Amount</th>
                                            <th className="px-4 sm:px-6 py-4 font-semibold text-right">Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {dashboardData.history?.map((item: any) => (
                                            <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(item.creditedAt).toLocaleDateString()}</td>
                                                <td className="px-4 sm:px-6 py-4 font-medium text-slate-900">{item.productNames.join(', ')}</td>
                                                <td className="px-4 sm:px-6 py-4 text-slate-600">{item.vendorName}</td>
                                                <td className="px-4 sm:px-6 py-4 text-slate-600">GHS {item.saleAmount.toFixed(2)}</td>
                                                <td className="px-4 sm:px-6 py-4 font-bold text-emerald-600 text-right">+ GHS {item.commission.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {(!dashboardData.history || dashboardData.history.length === 0) && (
                                <div className="text-center py-12">
                                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No history found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ title, amount, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">GHS {amount.toFixed(2)}</p>
            </div>
        </div>
    );
}
