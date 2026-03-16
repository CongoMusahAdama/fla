"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
    LayoutDashboard, ShoppingBag, Clock, CheckCircle2,
    AlertCircle, LogOut, Menu, X, ArrowLeft, Eye, Package,
    MapPin, Phone, User
} from 'lucide-react';

export default function VendorDashboard() {
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'vendor')) {
            router.push('/auth?role=vendor');
            return;
        }

        if (isAuthenticated && user?.role === 'vendor') {
            fetchVendorData();
            // Refresh every 30 seconds to update timers
            const interval = setInterval(fetchVendorData, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchVendorData = async () => {
        try {
            const token = localStorage.getItem('fla_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [pendingRes, ordersRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/pending-verifications/list`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/vendor-orders`, { headers })
            ]);

            if (pendingRes.ok) setPendingPayments(await pendingRes.json());
            if (ordersRes.ok) setAllOrders(await ordersRes.json());
        } catch (error) {
            console.error('Error fetching vendor data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (orderId: string) => {
        const result = await Swal.fire({
            title: 'Confirm Payment Receipt',
            text: 'Have you received this payment in your mobile money account?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Payment Received',
            cancelButtonText: 'Not Yet',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('fla_token');
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${orderId}/verify-payment`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Payment Verified',
                        text: 'Order has been confirmed and customer notified.',
                        confirmButtonColor: '#0f172a'
                    });
                    fetchVendorData(); // Refresh data
                } else {
                    throw new Error('Failed to verify payment');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: 'Could not verify payment. Please try again.',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    };

    const viewPaymentProof = (proofUrl: string) => {
        Swal.fire({
            title: 'Payment Proof',
            imageUrl: proofUrl,
            imageAlt: 'Payment Screenshot',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-[40px]',
                image: 'rounded-2xl'
            }
        });
    };

    const getTimeRemaining = (submittedAt: string) => {
        const submitted = new Date(submittedAt);
        const deadline = new Date(submitted.getTime() + 30 * 60 * 1000); // 30 minutes
        const now = new Date();
        const remaining = deadline.getTime() - now.getTime();

        if (remaining <= 0) return { expired: true, text: 'OVERDUE', color: 'text-red-600 bg-red-50' };

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        const color = minutes < 10 ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50';
        return { expired: false, text: `${minutes}m ${seconds}s`, color };
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'End Session?',
            text: "Are you sure you want to sign out of the Vendor Panel?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0F172A',
            cancelButtonColor: '#F1F5F9',
            confirmButtonText: 'Yes, Sign Out',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border border-slate-100 shadow-2xl',
                confirmButton: 'rounded-full px-8 py-3 uppercase text-[10px] font-black tracking-widest bg-slate-900 text-white',
                cancelButton: 'rounded-full px-8 py-3 uppercase text-[10px] font-black tracking-widest text-slate-500'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                router.push('/');
            }
        });
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFDFF] flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-[280px] h-screen bg-white border-r border-slate-100 sticky top-0">
                <div className="p-10 pt-12 pb-16 flex items-center justify-center border-b border-slate-50">
                    <Link href="/" className="font-heading font-black text-3xl tracking-tighter text-slate-900 uppercase">
                        FLA<span className="text-brand-lemon">.</span>
                    </Link>
                </div>

                <div className="flex-1 p-6">
                    <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                                {user?.name?.charAt(0) || 'V'}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{user?.name}</p>
                                <p className="text-[9px] font-bold text-brand-lemon uppercase tracking-widest">Vendor</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-white p-3 rounded-xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                                <p className="text-2xl font-black text-orange-600">{pendingPayments.length}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-2xl font-black text-slate-900">{allOrders.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-slate-50 space-y-4">
                    <Link href="/">
                        <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:translate-x-1 transition-all group w-full text-left">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Store
                        </button>
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:translate-x-1 transition-transform active:scale-95 w-full text-left">
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-h-screen md:h-screen md:overflow-y-auto">
                <header className="sticky top-0 z-50 bg-[#FDFDFF]/80 backdrop-blur-md px-6 md:px-10 py-6 border-b border-slate-100/50">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Payment Verifications</h1>
                        <div className="md:hidden">
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-900 text-white rounded-full">
                                <Menu className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-12">
                    {/* Pending Payments Section */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Pending Verifications</h2>
                                <p className="text-xs text-slate-500 mt-1">Confirm payments within 30 minutes</p>
                            </div>
                            {pendingPayments.length > 0 && (
                                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest">
                                    {pendingPayments.length} Waiting
                                </span>
                            )}
                        </div>

                        {pendingPayments.length > 0 ? (
                            <div className="space-y-4">
                                {pendingPayments.map((order) => {
                                    const timer = getTimeRemaining(order.paymentSubmittedAt);
                                    return (
                                        <div key={order._id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                                Order #{order._id.slice(-6).toUpperCase()}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${timer.color}`}>
                                                                <Clock className="w-3 h-3 inline mr-1" />
                                                                {timer.text}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{order.items[0]?.name}</h3>
                                                        <p className="text-sm text-slate-500">
                                                            Amount: <span className="font-bold text-slate-900">GH₵ {order.totalAmount}</span> •
                                                            Method: <span className="font-bold">{order.paymentMethod}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-2">
                                                            Submitted {new Date(order.paymentSubmittedAt).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => viewPaymentProof(order.paymentProof)}
                                                            className="px-6 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Proof
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyPayment(order._id)}
                                                            className="px-6 py-3 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Confirm Payment
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Customer Delivery Info */}
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">📦 Delivery Information</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="flex items-start gap-2">
                                                            <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                                                <p className="text-xs font-bold text-slate-900">{order.customerName || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                                                                <p className="text-xs font-bold text-slate-900">{order.customerPhone || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Location</p>
                                                                <p className="text-xs font-bold text-slate-900">
                                                                    {order.shippingCity || order.shippingRegion
                                                                        ? `${order.shippingCity || ''}${order.shippingCity && order.shippingRegion ? ', ' : ''}${order.shippingRegion || ''}`
                                                                        : 'Greater Accra'}
                                                                </p>
                                                                {order.shippingAddress && (
                                                                    <p className="text-[10px] text-slate-500 mt-0.5">{order.shippingAddress}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 border-dashed">
                                <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">All Caught Up!</p>
                                <p className="text-slate-300 text-xs mt-2">No pending payment verifications</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Orders Section */}
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">Recent Orders</h2>
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Info</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Location</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allOrders.slice(0, 10).map((order) => (
                                            <tr key={order._id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{order.items[0]?.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                                            <User className="w-3 h-3 text-slate-400" />
                                                            {order.customerName || 'Guest'}
                                                        </p>
                                                        {order.customerPhone && (
                                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-slate-300" />
                                                                {order.customerPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">
                                                                {order.shippingCity || order.shippingRegion
                                                                    ? `${order.shippingCity || ''}${order.shippingCity && order.shippingRegion ? ', ' : ''}${order.shippingRegion || ''}`
                                                                    : 'Greater Accra'}
                                                            </p>
                                                            {order.shippingAddress && (
                                                                <p className="text-[10px] text-slate-400 max-w-[140px] truncate">{order.shippingAddress}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900">GH₵ {order.totalAmount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                                        order.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                                                            order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                                'bg-yellow-50 text-yellow-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.paymentVerifiedByVendor ? (
                                                        <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                                            <CheckCircle2 className="w-4 h-4" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="text-orange-600 text-xs font-bold flex items-center gap-1">
                                                            <Clock className="w-4 h-4" /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
