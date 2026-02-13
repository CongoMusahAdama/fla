"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, Users, ShoppingBag, Settings, LogOut, ArrowLeft,
    Wallet, Package, Truck, MessageSquare, BarChart3, ShieldCheck,
    MoreVertical, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Search,
    ArrowUpRight, Download, Menu, X, Trash2, Shield, Clock, TrendingUp, Star, Phone, Plus, User
} from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';

type AdminSection = 'dashboard' | 'vendors' | 'customers' | 'orders' | 'escrow' | 'products' | 'disputes' | 'delivery' | 'settings' | 'reports';

export default function AdminDashboard() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newVendorData, setNewVendorData] = useState({
        name: '',
        email: '',
        shopName: '',
        phone: '',
        location: '',
        accountName: '',
        momoNumber: '',
        momoProvider: 'MTN',
        bio: '',
        password: Math.random().toString(36).slice(-8) // Initial random password
    });

    // System Settings State
    const [settings, setSettings] = useState({
        platformCommission: 10,
        automatedPayouts: true,
        vendorAutoApproval: false,
        maintenanceMode: false
    });

    const updateSettings = async (updates: Partial<typeof settings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings); // Optimistic update

        try {
            const token = localStorage.getItem('fla_token');
            // In a real app, you'd send this to the backend
            // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
            //     method: 'PATCH',
            //     headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            //     body: JSON.stringify(updates)
            // });

            // Simulating API success
            console.log('Settings updated:', updates);
        } catch (error) {
            console.error('Failed to update settings', error);
            // Revert on failure
            setSettings(settings);
            Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not save settings.' });
        }
    };

    const refreshData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('fla_token');
            if (!token) return;

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [statsRes, ordersRes, usersRes, productsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/dashboard/admin/stats`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products`, { headers })
            ]);

            if (statsRes.ok) setAdminData(await statsRes.json());
            if (ordersRes.ok) setAllOrders(await ordersRes.json());
            if (usersRes.ok) setAllUsers(await usersRes.json());
            if (productsRes.ok) setAllProducts(await productsRes.json());
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/auth');
            return;
        }
        refreshData();
    }, [isAuthenticated, user, router]);

    const handleConfirmPayment = async (orderId: string) => {
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isPaid: true, status: 'confirmed' })
            });

            if (!response.ok) throw new Error('Failed to confirm payment');

            await refreshData();

            Swal.fire({
                icon: 'success',
                title: 'PAYMENT VERIFIED',
                text: 'Funds have been released to orders escrow.',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[32px]' }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Action Failed', text: error.message });
        }
    };

    const handleUpdateUserStatus = async (userId: string, status: string) => {
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update user status');

            await refreshData();

            Swal.fire({
                icon: 'success',
                title: 'USER UPDATED',
                text: `Status changed to ${status}`,
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const result = await Swal.fire({
            title: 'DELETE USER?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'YES, DELETE',
            cancelButtonText: 'CANCEL',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest mr-4',
                cancelButton: 'bg-slate-100 text-slate-400 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest'
            }
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('fla_token');
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                await refreshData();
                Swal.fire('Deleted!', 'User has been removed.', 'success');
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('fla_token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            await refreshData();
            Swal.fire({
                icon: 'success',
                title: !currentStatus ? 'PRODUCT ACTIVATED' : 'PRODUCT HIDDEN',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        const result = await Swal.fire({
            title: 'REMOVE PRODUCT?',
            text: "This will permanently delete the design from the marketplace.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'PERMANENTLY DELETE',
            cancelButtonText: 'KEEP IT',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest mr-4',
                cancelButton: 'bg-slate-100 text-slate-400 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest'
            }
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('fla_token');
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                await refreshData();
                Swal.fire('Purged!', 'Design removed from archives.', 'success');
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleAdminCreateVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/admin/create-vendor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newVendorData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create vendor');
            }

            await refreshData();
            setShowAddVendorModal(false);
            setNewVendorData({
                name: '',
                email: '',
                shopName: '',
                phone: '',
                location: '',
                accountName: '',
                momoNumber: '',
                momoProvider: 'MTN',
                bio: '',
                password: Math.random().toString(36).slice(-8)
            });

            Swal.fire({
                icon: 'success',
                title: 'STUDIO PARTNER CREATED',
                text: 'Credentials have been sent to their email.',
                timer: 3000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[32px]' }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Creation Failed', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getImageUrl = (url: string) => {
        if (!url || url === '/product-1.jpg') return '/product-1.jpg';
        if (url.startsWith('http')) return url;
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return `${baseUrl}/uploads/${url}`;
    };

    if (!user || user.role !== 'admin') return null;

    const sidebarItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'vendors', label: 'Vendors', icon: ShieldCheck },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'escrow', label: 'Escrow & Payments', icon: Wallet },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'disputes', label: 'Disputes', icon: MessageSquare },
        { id: 'delivery', label: 'Delivery', icon: Truck },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    const statsCards = [
        { id: 'escrow' as const, label: 'Gross Revenue', value: `GH₵ ${adminData?.totalRevenue?.toLocaleString() || '0'}`, icon: ShoppingBag, color: 'text-white', bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', pattern: 'opacity-10' },
        { id: 'escrow' as const, label: 'Platform Commission', value: `GH₵ ${adminData?.totalCommission?.toLocaleString() || '0'}`, icon: ShieldCheck, color: 'text-white', bg: 'bg-gradient-to-br from-violet-500 to-indigo-600', pattern: 'opacity-10' },
        { id: 'escrow' as const, label: 'Escrow Balance', value: `GH₵ ${adminData?.escrowBalance?.toLocaleString() || '0'}`, icon: Wallet, color: 'text-white', bg: 'bg-gradient-to-br from-amber-500 to-orange-600', pattern: 'opacity-10' },
        { id: 'orders' as const, label: 'Total Orders', value: adminData?.totalOrders?.toString() || '0', icon: ShoppingBag, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', pattern: 'opacity-10' },
        { id: 'vendors' as const, label: 'Total Vendors', value: adminData?.totalVendors?.toString() || '0', icon: ShieldCheck, color: 'text-white', bg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', pattern: 'opacity-10' },
        { id: 'products' as const, label: 'Total Products', value: adminData?.totalProducts?.toString() || '0', icon: Package, color: 'text-white', bg: 'bg-gradient-to-br from-rose-500 to-pink-600', pattern: 'opacity-10' },
    ];

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
                            {statsCards.map((stat, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveSection(stat.id)}
                                    className={`${stat.bg} p-8 rounded-[32px] shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 text-left border-none outline-none focus:ring-4 focus:ring-brand-lemon/20`}
                                >
                                    {/* Decorative Pattern */}
                                    <div className={`absolute -right-6 -bottom-6 w-32 h-32 ${stat.pattern} transform rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700`}>
                                        <stat.icon className="w-full h-full text-white" />
                                    </div>

                                    <div className={`w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/30 group-hover:rotate-6 transition-transform`}>
                                        <stat.icon className={`w-6 h-6 text-white`} />
                                    </div>
                                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                                </button>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                    <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">Recent Transactions</h2>
                                    <button onClick={() => setActiveSection('escrow')} className="text-[10px] font-black text-brand-lemon bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-tighter">View All</button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {allOrders.slice(0, 5).map((order) => (
                                        <div key={order._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.isPaid ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                                                    <Wallet className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">GH₵ {order.totalAmount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{order.customerName}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${order.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {order.isPaid ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                    <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">Platform Activity</h2>
                                    <BarChart3 className="w-4 h-4 text-slate-300" />
                                </div>
                                <div className="p-12 text-center text-slate-300">
                                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                    <p className="text-xs font-black uppercase tracking-widest">Activity Audit Logs</p>
                                    <p className="text-[10px] mt-1">Real-time system events will appear here.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'vendors':
                const vendors = allUsers.filter(u => u.role === 'vendor');
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Apprentice & Studio Hub</h1>
                                <p className="text-slate-500 text-xs md:text-sm mt-1">Monitor studio performance, verify contact details, and manage payment configurations.</p>
                            </div>
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-auto">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        placeholder="Search studios..."
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-lemon/10 md:min-w-[340px] shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowAddVendorModal(true)}
                                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-brand-lemon rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="md:hidden">Add New Studio</span>
                                    <span className="hidden md:inline">Onboard a Vendor</span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Grid View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {vendors.filter(u =>
                                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                u.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((u) => (
                                <div key={u._id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white overflow-hidden relative shadow-md">
                                                {u.profileImage ? <Image src={getImageUrl(u.profileImage)} alt={u.name} fill className="object-cover" unoptimized /> : u.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">{u.shopName || u.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{u.location || 'Location Not Set'}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${u.status === 'suspended' ? 'bg-red-50 text-red-600' :
                                            u.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {u.status || 'active'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-y border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">{allProducts.filter(p => p.vendorId === u._id).length} Products</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">{u.momoNumber || 'No Wallet'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {u.status === 'pending' ? (
                                            <button
                                                onClick={() => handleUpdateUserStatus(u._id, 'active')}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-lemon text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-lemon/20"
                                            >
                                                <ShieldCheck className="w-3 h-3" /> Approve
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateUserStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')}
                                                className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                            >
                                                {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteUser(u._id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Studio / Profile</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Location & Contacts</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Products</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Payment (MOMO)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {vendors.filter(u =>
                                        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        u.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((u) => (
                                        <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white overflow-hidden relative shadow-2xl border-4 border-white">
                                                        {u.profileImage ? <Image src={getImageUrl(u.profileImage)} alt={u.name} fill className="object-cover" unoptimized /> : u.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-base mb-1">{u.shopName || u.name}</p>
                                                        <p className="text-[10px] font-bold text-brand-lemon bg-slate-900 px-3 py-1 rounded-full inline-block uppercase tracking-widest shadow-sm">Studio Partner</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="w-3 h-3 text-slate-300" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.location || 'Location Not Set'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="w-3 h-3 text-slate-300" />
                                                        <p className="text-xs font-bold text-slate-600">{u.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3 h-3 text-slate-300" />
                                                        <p className="text-xs font-bold text-slate-600">{u.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-brand-lemon" />
                                                    <span className="text-sm font-black text-slate-900">{allProducts.filter(p => p.vendorId === u._id).length}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-block min-w-[180px]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Wallet className="w-3 h-3 text-orange-500" />
                                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{u.accountName || 'No Wallet Name'}</p>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 tracking-wider">{u.momoNumber || '---'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <span className={`mr-4 my-auto text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${u.status === 'suspended' ? 'bg-red-50 text-red-600' :
                                                        u.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                                            'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                        {u.status || 'active'}
                                                    </span>

                                                    {u.status === 'pending' ? (
                                                        <button
                                                            onClick={() => handleUpdateUserStatus(u._id, 'active')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-brand-lemon text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
                                                        >
                                                            <ShieldCheck className="w-3 h-3" /> Approve Studio
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateUserStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')}
                                                            className={`p-2.5 rounded-xl transition-all ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                            title={u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                                        >
                                                            {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        </button>
                                                    )}

                                                    <button onClick={() => handleDeleteUser(u._id)} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'customers':
                const customers = allUsers.filter(u => u.role === 'customer');
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end gap-6 flex-wrap">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Patron Directory</h1>
                                <p className="text-slate-500 text-sm">Manage customer accounts, verify delivery addresses, and monitor loyalty status.</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-lemon/10 min-w-[340px] shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Mobile Grid View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {customers.filter(u =>
                                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((u) => (
                                <div key={u._id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden relative border-2 border-white shadow-md">
                                            {u.profileImage ? <Image src={getImageUrl(u.profileImage)} alt={u.name} fill className="object-cover" unoptimized /> : u.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">{u.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-y border-slate-50">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${u.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {u.status || 'active'}
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-400">{u.location || 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateUserStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')}
                                            className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                        >
                                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        </button>
                                        <button onClick={() => handleDeleteUser(u._id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Customer Profile</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Contact & Location</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {customers.filter(u =>
                                        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((u) => (
                                        <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden relative border-4 border-white shadow-lg">
                                                        {u.profileImage ? <Image src={getImageUrl(u.profileImage)} alt={u.name} fill className="object-cover" unoptimized /> : u.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{u.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Member</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-600">{u.email}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{u.phone || 'No phone'}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">{u.location || 'N/A'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${u.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {u.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateUserStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')} className={`p-2.5 rounded-xl transition-all ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`} title={u.status === 'suspended' ? 'Activate' : 'Suspend'}>
                                                        {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u._id)} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end gap-6 flex-wrap">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Marketplace Inventory</h1>
                                <p className="text-slate-500 text-sm">Review quality and moderate global listings.</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search products by title..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-lemon/10 min-w-[340px] shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                                <div key={p._id} className={`bg-white rounded-[32px] border ${p.isActive ? 'border-slate-100' : 'border-red-100 grayscale-[0.5]'} shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500`}>
                                    <div className="aspect-[4/5] relative bg-slate-50">
                                        <Image src={getImageUrl(p.images?.[0])} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleToggleProductStatus(p._id, p.isActive)} className={`p-3 rounded-2xl shadow-xl transition-all ${p.isActive ? 'bg-white text-slate-900 hover:bg-slate-900 hover:text-white' : 'bg-emerald-500 text-white'}`}>
                                                {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleDeleteProduct(p._id)} className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {!p.isActive && <div className="absolute inset-0 bg-red-500/5 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Hidden</span></div>}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-brand-lemon bg-slate-900 px-3 py-1 rounded-full uppercase tracking-tighter">{p.category}</span>
                                            <p className="text-sm font-black text-slate-900">GH₵ {p.price.toLocaleString()}</p>
                                        </div>
                                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter line-clamp-1">{p.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Vendor: {p.vendorName || 'Independent Artisan'}</p>

                                        {/* Batch Info */}
                                        {p.batchSize > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-50">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                                    <span className="text-slate-400">Batch Progress</span>
                                                    <span className="text-brand-lemon bg-slate-900 px-1.5 rounded">{p.currentBatchCount || 0}/{p.batchSize}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${((p.currentBatchCount || 0) / p.batchSize) * 100}%` }} />
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Wholesale: GH₵ {p.wholesalePrice}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${p.batchStatus === 'production' ? 'text-amber-500' : 'text-emerald-500'}`}>{p.batchStatus || 'Gathering'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'orders':
            case 'delivery':
            case 'escrow':
                const isEscrow = activeSection === 'escrow';
                const isDelivery = activeSection === 'delivery';
                const displayOrders = isEscrow ? allOrders.filter(o => !o.isPaid) : isDelivery ? allOrders.filter(o => o.isPaid) : allOrders;

                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                    {isEscrow ? 'Escrow & Verification' : isDelivery ? 'Logistics & Dispatch' : 'Order Ledger'}
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    {isEscrow ? 'Verify customer payments to release vendor orders.' : 'Monitor shipping tracking and final deliveries.'}
                                </p>
                            </div>
                        </div>

                        {/* Mobile Grid View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {displayOrders.map((o) => (
                                <div key={o._id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">#ORD-{o._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${o.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {o.isPaid ? 'PAID' : 'ESCROW'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 py-2">
                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-black border border-white shadow-sm">
                                            {o.customerName?.[0] || 'G'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{o.customerName || 'Guest'}</p>
                                            <p className="text-[10px] text-slate-400">{o.customerEmail}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-slate-500">Total Amount</span>
                                            <span className="text-slate-900">GH₵ {o.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-slate-500">Commission</span>
                                            <span className="text-emerald-600">GH₵ {(o.adminCommission || o.totalAmount * 0.1).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {isEscrow && !o.isPaid && (
                                        <div className="flex gap-2 mt-2">
                                            {o.paymentProof && (
                                                <button onClick={() => window.open(getImageUrl(o.paymentProof), '_blank')} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                    Proof
                                                </button>
                                            )}
                                            <button onClick={() => handleConfirmPayment(o._id)} className="flex-[2] py-3 bg-slate-900 text-brand-lemon rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">
                                                Release Funds
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Order / Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Customer</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Payment Breakdown</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {displayOrders.map((o) => (
                                        <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <p className="font-black text-slate-900 text-sm">#ORD-{o._id.slice(-6).toUpperCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <p className="text-xs font-black text-slate-700">{o.customerName || 'Guest'}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{o.customerEmail}</p>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Gross</span>
                                                        <span className="text-sm font-black text-slate-900 tabular-nums">GH₵ {o.totalAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase">Fee (10%)</span>
                                                        <span className="text-[10px] font-black text-emerald-600 tabular-nums">GH₵ {(o.adminCommission || o.totalAmount * 0.1).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4 pt-1 border-t border-slate-100">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Vendor Net</span>
                                                        <span className="text-[10px] font-black text-slate-900 tabular-nums">GH₵ {(o.vendorShare || o.totalAmount * 0.9).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="space-y-2">
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${o.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {o.isPaid ? 'PAID / RELEASED' : 'ESCROW HOLD'}
                                                    </span>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-1">{o.status}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {isEscrow && !o.isPaid ? (
                                                    <div className="flex justify-end items-center gap-3">
                                                        {o.paymentProof && (
                                                            <button onClick={() => window.open(getImageUrl(o.paymentProof), '_blank')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View Proof</button>
                                                        )}
                                                        <button onClick={() => handleConfirmPayment(o._id)} className="bg-slate-900 text-brand-lemon px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">Release Funds</button>
                                                    </div>
                                                ) : (
                                                    <button className="px-5 py-2 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100">Details</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'disputes':
                return (
                    <div className="py-20 animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mb-8">
                            <MessageSquare className="w-10 h-10 text-slate-200 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Dispute Resolution Center</h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-sm">Manage and resolve customer and vendor disputes efficiently.</p>
                    </div>
                );
            case 'reports':
                const reportCustomers = allUsers.filter(u => u.role === 'customer');
                const newCustomersThisMonth = reportCustomers.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length;
                const activeCustomers = reportCustomers.filter(u => u.status === 'active').length;

                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Customer Analytics</h1>
                                <p className="text-slate-500 text-sm">Deep dive into user growth, retention, and engagement metrics.</p>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-300 transition-all">
                                <Download className="w-4 h-4" /> Export Report
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-slate-200">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Users className="w-32 h-32" />
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Customers</p>
                                <p className="text-4xl font-black tracking-tighter">{reportCustomers.length}</p>
                                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>+12% vs last month</span>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-blue-200">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <User className="w-32 h-32" />
                                </div>
                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">New Signups (This Month)</p>
                                <p className="text-4xl font-black tracking-tighter">{newCustomersThisMonth}</p>
                                <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs font-bold">
                                    <span>Fresh arrivals to the platform</span>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-emerald-200">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <CheckCircle2 className="w-32 h-32" />
                                </div>
                                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-2">Active Accounts</p>
                                <p className="text-4xl font-black tracking-tighter">{activeCustomers}</p>
                                <div className="mt-4 flex items-center gap-2 text-emerald-100 text-xs font-bold">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                    <span>Currently verified & active</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6">Customer Growth Trend</h3>
                            <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4 border-b border-slate-100 relative">
                                {/* Simulated Chart Bars */}
                                {[35, 45, 30, 60, 75, 50, 65, 80, 70, 85, 90, 100].map((h, i) => (
                                    <div key={i} className="w-full bg-slate-50 hover:bg-brand-lemon/50 transition-colors rounded-t-xl relative group" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h} Users
                                        </div>
                                    </div>
                                ))}
                                <div className="absolute inset-x-0 bottom-0 h-px bg-slate-100"></div>
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                            </div>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">System Configuration</h1>
                                <p className="text-slate-500 text-sm">Control platform variables, fees, and operational status.</p>
                            </div>
                            <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3" />
                                All Systems Operational
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {/* Financial Settings */}
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-brand-lemon rounded-xl flex items-center justify-center text-slate-900">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Financial Operations</h3>
                                        <p className="text-xs text-slate-400 font-bold">Manage commissions and payout gateways.</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">Platform Commission</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Percentage taken from every sale.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={settings.platformCommission}
                                                onChange={(e) => updateSettings({ platformCommission: Number(e.target.value) })}
                                                className="w-16 px-3 py-2 text-center font-black bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                                            />
                                            <span className="text-xs font-black text-slate-400">%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">Automated Payouts</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Release funds immediately after delivery confirmation.</p>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.automatedPayouts}
                                                onChange={(e) => updateSettings({ automatedPayouts: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-lemon/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Access */}
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Security & Access</h3>
                                        <p className="text-xs text-slate-400 font-bold">Control registration and critical modes.</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">Vendor Auto-Approval</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Automatically activate new studio accounts.</p>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.vendorAutoApproval}
                                                onChange={(e) => updateSettings({ vendorAutoApproval: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-lemon/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">Maintenance Mode</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Suspend all customer-facing operations.</p>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.maintenanceMode}
                                                onChange={(e) => updateSettings({ maintenanceMode: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-lemon/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Admin Profile */}
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Admin Profile</h3>
                                        <p className="text-xs text-slate-400 font-bold">Update your credentials.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Name</label>
                                        <input type="text" defaultValue={user?.name} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                                        <input type="email" defaultValue={user?.email} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="py-40 text-center animate-in zoom-in duration-700">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Settings className="w-10 h-10 text-slate-200 animate-spin-slow" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Section Under Construction</h2>
                        <p className="text-slate-400 text-sm mt-1 max-w-xs">This module is part of the next scheduled system update.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[290] md:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Admin Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-[300] w-72 bg-slate-900 text-white transition-transform duration-500 ease-soft-spring
                md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-6 md:p-8 relative">
                    <div className="flex justify-between items-center mb-8 md:mb-10">
                        <Link href="/" className="font-heading text-2xl font-black tracking-tighter text-brand-lemon flex items-center gap-2">
                            FLA <span className="text-white">HQ</span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pr-2">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveSection(item.id as AdminSection);
                                    setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300
                                    ${activeSection === item.id
                                        ? 'bg-brand-lemon text-slate-900 shadow-lg shadow-brand-lemon/10 shadow-inner'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-slate-900' : 'text-slate-500'}`} />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <div className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl">
                            <div className="w-10 h-10 bg-brand-lemon rounded-xl flex items-center justify-center text-slate-900 font-black">
                                {user.name?.[0] || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-widest truncate">{user.name}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase truncate">System Admin</p>
                            </div>
                        </div>
                        <Link href="/">
                            <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group mb-2 text-left">
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Launch Store
                            </button>
                        </Link>
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="w-full flex items-center gap-4 px-6 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group text-left"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative no-scrollbar">
                {/* Mobile Header (Dashboard Level) */}
                <header className="md:hidden flex sticky top-0 z-[200] bg-white/95 backdrop-blur-md px-6 py-4 items-center justify-between border-b border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-900 bg-slate-50 rounded-xl">
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="font-black text-slate-900 uppercase text-xs tracking-tighter">Admin HQ</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-brand-lemon flex items-center justify-center text-slate-900 font-black text-xs border border-slate-200">
                        {user?.name?.[0] || 'A'}
                    </div>
                </header>

                {/* Desktop Sticky Top Bar */}
                <header className="hidden md:flex sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-md px-12 py-6 items-center justify-between border-b border-slate-200/50 w-full">
                    <div className="relative w-full max-w-lg">
                        <input
                            type="text"
                            placeholder="Search everything: users, orders, products..."
                            className="w-full bg-white py-3 pl-12 pr-6 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-4 focus:ring-brand-lemon/10 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{user?.name}</p>
                            <p className="text-[9px] font-black text-brand-lemon bg-slate-900 px-2 py-0.5 rounded-full inline-block uppercase tracking-widest mt-0.5">System Administrator</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-brand-lemon flex items-center justify-center text-slate-900 font-black border-2 border-white shadow-xl relative overflow-hidden group">
                            {user?.name?.[0] || 'A'}
                            <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
                        </div>
                    </div>
                </header>

                <div className="px-6 pt-10 md:pt-12 md:px-12 pb-24 w-full">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-slate-900 text-brand-lemon text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Live Status</span>
                                <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">• Global Administration</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter">
                                {sidebarItems.find(i => i.id === activeSection)?.label}
                            </h1>
                        </div>
                        <div className="flex gap-4">
                            <button className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 hover:shadow-md transition-all">
                                <BarChart3 className="w-4 h-4" />
                            </button>
                            <Link href="/">
                                <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm hover:shadow-lg">
                                    <ArrowLeft className="w-3 h-3" />
                                    Launch Store
                                </button>
                            </Link>
                        </div>
                    </header>

                    {renderSection()}
                </div>
            </main>
            {/* Add Vendor Modal */}
            {showAddVendorModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Onboard New Studio</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manual Partner Registration</p>
                            </div>
                            <button onClick={() => setShowAddVendorModal(false)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdminCreateVendor} className="p-10 space-y-6">
                            {/* Row 1: Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Owner Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full Name"
                                        value={newVendorData.name}
                                        onChange={(e) => setNewVendorData({ ...newVendorData, name: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop/Studio Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Signature Styles"
                                        value={newVendorData.shopName}
                                        onChange={(e) => setNewVendorData({ ...newVendorData, shopName: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="vendor@example.com"
                                        value={newVendorData.email}
                                        onChange={(e) => setNewVendorData({ ...newVendorData, email: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Location & Payment */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="+233..."
                                        value={newVendorData.phone}
                                        onChange={(e) => setNewVendorData({ ...newVendorData, phone: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="City, Region"
                                        value={newVendorData.location}
                                        onChange={(e) => setNewVendorData({ ...newVendorData, location: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Details</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={newVendorData.momoProvider}
                                            onChange={(e) => setNewVendorData({ ...newVendorData, momoProvider: e.target.value })}
                                            className="w-1/3 px-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                        >
                                            <option value="MTN">MTN</option>
                                            <option value="Telecel">Telecel</option>
                                            <option value="AT">AT</option>
                                        </select>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="024..."
                                            value={newVendorData.momoNumber}
                                            onChange={(e) => setNewVendorData({ ...newVendorData, momoNumber: e.target.value })}
                                            className="w-2/3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Account Name & Generated Password */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Mobile Money Name"
                                        value={newVendorData.accountName}
                                        onChange={(e) => setNewVendorData({ ...newVendorData, accountName: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Generated Password (Share this with Vendor)</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            value={newVendorData.password}
                                            readOnly
                                            className="w-full px-5 py-3 bg-slate-900 text-brand-lemon rounded-2xl text-sm font-black focus:outline-none tracking-widest"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/50 font-medium">Auto-generated</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Bio / Story</label>
                                <textarea
                                    rows={2}
                                    placeholder="Short description of the brand..."
                                    value={newVendorData.bio}
                                    onChange={(e) => setNewVendorData({ ...newVendorData, bio: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 focus:outline-none resize-none"
                                />
                            </div>

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-brand-lemon hover:text-slate-900 shadow-xl shadow-slate-900/10'
                                    }`}
                            >
                                {isSubmitting ? 'CREATING STUDIO...' : 'COMPLETE ONBOARDING'}
                                {!isSubmitting && <ArrowUpRight className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            )
            }
        </div >
    );
}
