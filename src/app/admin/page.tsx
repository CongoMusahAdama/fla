"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut, ArrowLeft } from 'lucide-react';

export default function AdminDashboard() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/auth');
        }
    }, [isAuthenticated, user, router]);

    if (!user || user.role !== 'admin') return null;

    const stats = [
        { label: 'Total Revenue', value: 'GH₵ 12,450', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'New Customers', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending Orders', value: '8', icon: LayoutDashboard, color: 'text-slate-900', bg: 'bg-brand-lemon' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-8">
                    <Link href="/" className="font-heading text-2xl font-black tracking-tighter text-slate-900">
                        FLA ADMIN
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all text-left">
                        <ShoppingBag className="w-4 h-4" />
                        Orders
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all text-left">
                        <Users className="w-4 h-4" />
                        Customers
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all text-left">
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Welcome Back, {user.name}</h1>
                            <p className="text-slate-500 text-sm">Here's what's happening with FLA today.</p>
                        </div>
                        <Link href="/">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                <ArrowLeft className="w-3 h-3" />
                                Storefront
                            </button>
                        </Link>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Placeholder Table */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="font-bold text-slate-900">Recent Orders</h2>
                        </div>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-500 text-sm italic">All orders are up to date.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
