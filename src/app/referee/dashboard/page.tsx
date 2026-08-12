"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { LayoutDashboard, Wallet, Calendar, Copy, LogOut, CheckCircle2, History, Package, Eye, EyeOff, RefreshCcw } from 'lucide-react';

export default function RefereeDashboard() {
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [storeProducts, setStoreProducts] = useState<any[]>([]);
    const [hiddenProducts, setHiddenProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'store' | 'history'>('overview');

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'referee')) {
            router.push('/referee');
            return;
        }

        if (isAuthenticated && user?.role === 'referee') {
            fetchDashboardData();
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [dashRes, storeRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/dashboard`, { credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/my-store`, { credentials: 'include' })
            ]);

            if (dashRes.ok) setDashboardData(await dashRes.json());
            if (storeRes.ok) {
                const storeData = await storeRes.json();
                setStoreProducts(storeData.products || []);
                setHiddenProducts(storeData.hiddenIds || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleHideProduct = async (productId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/my-store/toggle/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
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

    const handleWithdrawalRequest = async () => {
        if (!dashboardData || dashboardData.walletBalance < 50) {
            Swal.fire({ icon: 'error', title: 'Insufficient Balance', text: 'Minimum withdrawal amount is GHS 50.', confirmButtonColor: '#0f172a' });
            return;
        }

        const { value: formValues } = await Swal.fire({
            title: 'Request Withdrawal',
            html: `
                <div class="text-left space-y-4 py-2">
                    <p class="text-sm text-slate-500">Available: GHS ${dashboardData.walletBalance.toFixed(2)}</p>
                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Amount (GHS)</label>
                        <input id="swal-amount" type="number" min="50" max="${dashboardData.walletBalance}" class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Min 50" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">MoMo Number</label>
                        <input id="swal-momo" type="tel" class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="e.g. 024xxxxxxx" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Account Name</label>
                        <input id="swal-name" type="text" class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Registered Name" />
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Submit Request',
            confirmButtonColor: '#0f172a',
            preConfirm: () => {
                const amount = (document.getElementById('swal-amount') as HTMLInputElement).value;
                const momoNumber = (document.getElementById('swal-momo') as HTMLInputElement).value;
                const accountName = (document.getElementById('swal-name') as HTMLInputElement).value;
                
                if (!amount || !momoNumber || !accountName) {
                    Swal.showValidationMessage('All fields are required');
                    return false;
                }
                if (Number(amount) < 50 || Number(amount) > dashboardData.walletBalance) {
                    Swal.showValidationMessage('Invalid amount');
                    return false;
                }
                return { amount: Number(amount), momoNumber, accountName, paymentMethod: 'momo' };
            }
        });

        if (!formValues) return;

        try {
            Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payments/withdrawals/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formValues)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to request withdrawal');
            }

            Swal.fire('Success', 'Withdrawal request submitted successfully.', 'success');
            fetchDashboardData();
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1F5] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div>
            </div>
        );
    }

    if (!dashboardData) return null;

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
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">GHS {dashboardData.walletBalance.toFixed(2)}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                </div>
                                <button onClick={handleWithdrawalRequest} className="mt-4 w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                                    Withdraw
                                </button>
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
                        <header>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Store Products</h2>
                            <p className="text-sm text-slate-500 mt-1">Share individual products to earn 2% on every sale.</p>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {storeProducts.map((product) => {
                                const isHidden = hiddenProducts.includes(product._id);
                                const productUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://flamingo-store1.com'}/product/${product._id}?ref=${dashboardData.refereeCode}`;
                                
                                return (
                                    <div key={product._id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all ${isHidden ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                                        <div className="aspect-[4/5] relative bg-slate-100">
                                            <Image src={product.images[0] || '/placeholder.png'} alt={product.name} fill className="object-cover" />
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
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
