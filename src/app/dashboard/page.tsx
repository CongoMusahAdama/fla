"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, ShoppingBag, Heart, Bell, User,
    HelpCircle, LogOut, Package, Clock, CheckCircle2,
    Wallet, ChevronRight, MessageSquare, ShieldAlert,
    Search, Menu, X, ArrowRight, Star, ArrowLeft,
    Printer, FileText, Download, Check, Truck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';
import ProductCard from '@/components/ProductCard';

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.502-5.485-1.454l-.394-.227-4.078 1.07 1.089-3.975-.249-.396A9.816 9.816 0 011.942 12.07C1.942 6.656 6.355 2.24 11.77 2.24s9.829 4.417 9.829 9.831c0 5.414-4.417 9.831-9.83 9.831m11.834-11.83c0-6.521-5.303-11.825-11.825-11.825C5.461 0 0 5.461 0 11.825c0 2.083.54 4.117 1.571 5.905L0 24l6.446-1.691c1.71 1.017 3.65 1.554 5.62 1.554 6.523 0 11.825-5.303 11.825-11.825" />
    </svg>
);

type DashboardSection = 'home' | 'orders' | 'wishlist' | 'notifications' | 'profile' | 'help';

export default function CustomerDashboard() {
    const { user, token, logout, updateUser, isAuthenticated, isLoading } = useAuth();
    const { addToCart } = useCart();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<DashboardSection>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState<any>(null);
    const [orderFilter, setOrderFilter] = useState('All');
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    // Help Center States
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [showLiveSupport, setShowLiveSupport] = useState(false);
    const [disputeStep, setDisputeStep] = useState(1);
    const [chatInput, setChatInput] = useState('');

    // Dispute Form States
    const [disputeOrderId, setDisputeOrderId] = useState('');
    const [disputeCategory, setDisputeCategory] = useState('Wrong Sizing');
    const [disputeDescription, setDisputeDescription] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    const handleSendOrderToWhatsApp = (order: any) => {
        const phone = "233505112925";
        const message = `Hello FLA Support,\n\nI would like to discuss my order:\nOrder ID: ${order.id}\nProduct: ${order.name}\nPrice: GH₵ ${order.price}\nStatus: ${order.status}\n\nThank you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const phone = "233505112925"; // Store owner's number
        const text = encodeURIComponent(`Hello FLA Support, I am ${user?.name || 'a customer'}. ${chatInput}`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        setChatInput('');
    };

    // Dashboard Data States
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [wishlist, setWishlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Profile States
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [profilePhone, setProfilePhone] = useState(user?.phone || '+233 24 000 0000');
    const [profileCity, setProfileCity] = useState(user?.location || 'Accra');
    const [profileAddress, setProfileAddress] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Hydration check
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const fetchDashboardData = React.useCallback(async () => {
        if (!user || !token) return;

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

            const headers = {
                'Content-Type': 'application/json'
            };

            const fetchData = async (endpoint: string, setter: (data: any) => void) => {
                try {
                    const res = await fetch(`${apiBase}${endpoint}`, { 
                        headers: {
                            ...headers,
                            'Authorization': `Bearer ${token}`
                        }, 
                        credentials: 'include' 
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setter(data);
                    } else if (res.status === 401) {
                        // Handle potential expired token
                        console.warn(`Unauthorized access to ${endpoint}`);
                    }
                } catch (err) {
                    console.error(`Fetch error for ${endpoint}:`, err);
                }
            };

            await Promise.all([
                fetchData('/dashboard/customer/stats', setDashboardData),
                fetchData('/orders/my-orders', (data) => setOrders(Array.isArray(data) ? data : data.orders || data.data || [])),
                fetchData('/wishlist/my-wishlist', setWishlist),
                fetchData('/notifications/my-notifications', (data) => setNotifications(Array.isArray(data) ? data : data.notifications || data.data || [])),
                fetchData('/support/my-disputes', (data) => setDisputes(Array.isArray(data) ? data : data.disputes || data.data || []))
            ]);

        } catch (error) {
            console.error('Error in fetchDashboardData:', error);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            // Sync profile states to ensure we don't show stale data
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
            setProfilePhone(user.phone || '');
            setProfileCity(user.location || '');
            setProfileAddress(user.address || '');
            setProfileImage(user.profileImage || null);
        }
    }, [user, fetchDashboardData]);

    // Redirect if not authenticated once loading is done
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            if (user?.role === 'vendor') {
                router.push('/vendor');
                return;
            }
            if (user?.role === 'admin') {
                router.push('/admin');
                return;
            }
        }

        if (!isLoading && !isAuthenticated && isHydrated) {
            router.push('/auth?role=customer&redirect=' + encodeURIComponent(window.location.pathname));
        }
    }, [isAuthenticated, isLoading, router, isHydrated, user]);

    const filteredOrders = React.useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return orders.filter(order => {
            if (orderFilter === 'All') return true;
            if (orderFilter === 'In delivery') return ![ 'delivered', 'completed', 'cancelled' ].includes(order.status);
            if (orderFilter === 'Completed') return [ 'delivered', 'completed' ].includes(order.status);
            if (orderFilter === 'Cancelled') return order.status === 'cancelled';
            return true;
        });
    }, [orders, orderFilter]);

    const getImageUrl = (url: string | undefined | null) => {
        if (!url || url === '/product-1.jpg') return '/product-1.jpg';
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBase.replace(/\/api\/?$/, '');

        if (url.startsWith('/uploads/')) return `${baseUrl}${url}`;
        if (url.startsWith('uploads/')) return `${baseUrl}/${url}`;
        if (url.startsWith('/')) return url;

        return `${baseUrl}/uploads/${url}`;
    };


    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: profileName,
                    email: profileEmail,
                    phone: profilePhone,
                    location: profileCity,
                    address: profileAddress,
                    profileImage: profileImage
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Profile update failed:', errorData);
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const updatedUser = await response.json();

            // Map backend fields to frontend context expectations if necessary
            updateUser({
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                location: updatedUser.location,
                address: updatedUser.address,
                profileImage: updatedUser.profileImage
            });

            Swal.fire({
                icon: 'success',
                title: 'PROFILE UPDATED',
                text: 'Your information has been successfully saved to our database.',
                confirmButtonText: 'EXCELLENT',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    htmlContainer: 'text-slate-500 font-medium text-sm mb-6',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
                }
            });
        } catch (error: any) {
            console.error('Profile update error:', error);
            Swal.fire({
                icon: 'error',
                title: 'UPDATE FAILED',
                text: error.message || 'An error occurred while saving your changes.',
                confirmButtonText: 'TRY AGAIN',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    htmlContainer: 'text-slate-500 font-medium text-sm mb-6',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
                }
            });
        } finally {
            setIsUpdating(false);
        }
    };



    const handleLogout = () => {
        Swal.fire({
            title: 'SAD TO SEE YOU GO! 👋',
            text: "Are you sure you want to end your fashion session?",
            icon: 'info',
            iconColor: '#0F172A',
            showCancelButton: true,
            confirmButtonColor: '#0F172A',
            cancelButtonColor: '#F1F5F9',
            confirmButtonText: 'Sign Out',
            cancelButtonText: 'Stay Logged In',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl p-8 md:p-12 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                htmlContainer: 'text-slate-500 font-medium text-sm mb-8',
                confirmButton: 'bg-slate-900 text-white rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2',
                cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                router.push('/');
            }
        });
    };

    const handleSubmitDispute = async () => {
        if (!disputeOrderId || !disputeDescription) {
            Swal.fire({
                icon: 'error',
                title: 'FIELDS REQUIRED',
                text: 'Please select an order and describe the issue.',
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-8 py-3 text-[11px] font-black uppercase tracking-widest'
                }
            });
            return;
        }

        setIsSubmittingDispute(true);
        try {
            // Find the order to get the vendorId
            const order = orders.find(o => o._id === disputeOrderId);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/support/dispute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    orderId: disputeOrderId,
                    vendorId: order?.vendorId,
                    category: disputeCategory,
                    description: disputeDescription
                })
            });

            if (!response.ok) throw new Error('Failed to submit dispute');

            Swal.fire({
                icon: 'success',
                title: 'DISPUTE SUBMITTED',
                text: 'Your dispute has been recorded in the ledger. You can now chat with the vendor and admin in the Dispute Center.',
                confirmButtonText: 'OPEN LEDGER',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    htmlContainer: 'text-slate-500 font-medium text-sm mb-6',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
                }
            }).then(() => {
                setActiveSection('help'); // Or a new 'disputes' section
            });
            setShowDisputeForm(false);
            setDisputeDescription('');
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'SUBMISSION FAILED',
                text: error.message,
                confirmButtonText: 'OK',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-8 py-3 text-[11px] font-black uppercase tracking-widest'
                }
            });
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const handlePayNow = async (orderId: string, amount: number) => {
        try {
            Swal.fire({
                title: 'PREPARING PAYMENT...',
                didOpen: () => { Swal.showLoading(); }
            });

            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

            // We need to re-initialize payment for this order if it was already created but not paid.
            // Or we can fetch the existing payment link if the backend supports it.
            // For now, let's assume the backend will return a new payment link when requested.
            const res = await fetch(`${apiBase}/orders/${orderId}/initialize-payment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Could not initialize payment');
            const { paymentLink } = await res.json();

            // Redirect to Paystack
            window.location.href = paymentLink;
        } catch (error: any) {
            Swal.fire('ERROR', error.message, 'error');
        }
    };

    const handlePayDeliveryFee = async (orderId: string) => {
        try {
            Swal.fire({
                title: 'INITIALIZING GATEWAY...',
                didOpen: () => { Swal.showLoading(); }
            });

            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

            const res = await fetch(`${apiBase}/orders/${orderId}/initialize-first-mile-payment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Could not initialize payment');
            const { paymentLink } = await res.json();

            // Redirect to Paystack
            window.location.href = paymentLink;
        } catch (error: any) {
            Swal.fire('ERROR', error.message, 'error');
        }
    };

    const handleWithdrawOrder = async (orderId: string) => {
        const result = await Swal.fire({
            title: 'WITHDRAW ORDER?',
            text: "Withdrawal is only permitted if you do not accept the delivery quotation. If confirmed, this order will be cancelled and a refund will be initiated if payment was already made.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'YES, WITHDRAW',
            cancelButtonText: 'CANCEL',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[32px] p-10',
                title: 'text-2xl font-black text-slate-900 uppercase',
                confirmButton: 'bg-red-500 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest mr-3',
                cancelButton: 'bg-slate-100 text-slate-400 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest'
            }
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ status: 'cancelled', escrowStatus: 'frozen' })
                });

                if (!response.ok) throw new Error('Failed to withdraw order');
                
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled', escrowStatus: 'frozen' } : o));
                
                Swal.fire({
                    icon: 'success',
                    title: 'ORDER WITHDRAWN',
                    text: 'Our support team will contact you regarding any refunds.',
                    customClass: { popup: 'rounded-[32px]' }
                });
            } catch (err: any) {
                Swal.fire('ERROR', err.message, 'error');
            }
        }
    };

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'help', label: 'Help Center', icon: HelpCircle },
    ];

    const statsList = [
        {
            label: 'Wallet Balance',
            value: `GH₵ ${dashboardData?.walletBalance || 0}`,
            icon: Wallet,
            color: 'text-slate-900',
            bg: 'bg-brand-lemon/20',
            border: 'border-brand-lemon/30'
        },
        {
            label: 'Pending Settlement',
            value: `GH₵ ${dashboardData?.pendingEscrow || 0}`,
            icon: ShieldAlert,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        },
        {
            label: 'Active Orders',
            value: dashboardData?.activeOrders || '0',
            icon: Package,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100'
        },
        {
            label: 'Total Spent',
            value: `GH₵ ${dashboardData?.totalSpent || 0}`,
            icon: ShoppingBag,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-100'
        },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'home':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Welcome Header */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Hi, {user?.name?.split(' ')[0] || 'Member'} 👋</h1>
                            <p className="text-slate-500 text-sm mt-1">Here's what's happening with your orders today.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {statsList.map((stat, i) => (
                                <div
                                    key={i}
                                    className={`p-5 rounded-[24px] border ${stat.border} shadow-sm group overflow-hidden relative text-left w-full`}
                                >
                                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Logistics Attention Banner (If any inter-regional order requires fee payment) */}
                        {orders.some(o => o.deliveryType === 'inter-regional' && o.firstMileFee > 0 && !o.isFirstMileFeePaid) && (
                            <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group animate-in slide-in-from-top-4 duration-700">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                    <Truck className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-brand-lemon text-slate-900 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Action Required</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Logistics</span>
                                        </div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter">Logistics Update Ready</h2>
                                        <p className="text-slate-400 text-xs font-medium max-w-md">Your vendors have updated delivery quotations for your inter-regional orders. Please review and pay to proceed with fulfillment.</p>
                                    </div>
                                    <button 
                                        onClick={() => setActiveSection('orders')}
                                        className="bg-brand-lemon text-slate-900 px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-lemon/10"
                                    >
                                        Pay Delivery Fees
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Recent Activity & Quick Links */}
                        <div className="grid lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-slate-900">Recent Orders</h2>
                                    <button onClick={() => setActiveSection('orders')} className="text-xs font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors">
                                        View All <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    {orders.length > 0 ? (
                                        orders.slice(0, 5).map((order, i) => (
                                            <div key={i} className={`p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${i !== Math.min(orders.length, 5) - 1 ? 'border-b border-slate-50' : ''}`}>
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="relative w-16 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                                                        <Image
                                                            src={getImageUrl(order.items[0]?.image || '/product-1.jpg')}
                                                            alt={order.items[0]?.name || 'Product'}
                                                            fill
                                                            unoptimized={true}
                                                            className="object-cover"

                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/product-1.jpg';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">#ORD-{order._id.slice(-6).toUpperCase()}</p>
                                                                <h3 className="font-bold text-slate-900 truncate pr-2 text-sm md:text-base">{order.items[0]?.name || 'Multiple Items'}</h3>
                                                            </div>
                                                            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest sm:hidden ${['delivered', 'cancelled'].includes(order.status) ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{order.vendorName || 'FLA Studio'}</p>
                                                        {order.pickupPoint && (
                                                            <div className="mt-1">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Collect At:</span>
                                                                <span className="text-[9px] font-black text-brand-black bg-brand-lemon px-2 py-0.5 rounded-md border border-brand-lemon/20 inline-block uppercase">{order.pickupPoint}</span>
                                                            </div>
                                                        )}
                                                        <p className="font-sans font-black text-slate-900 mt-2 sm:hidden">GH₵ {order.totalAmount}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-2 pl-20 sm:pl-0 -mt-2 sm:mt-0">
                                                    <div className="hidden sm:block text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 ${['delivered', 'cancelled'].includes(order.status) ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                        <p className="font-sans font-black text-slate-900">GH₵ {order.totalAmount}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {/* Removed WhatsApp button to utilize space for 'Satisfied' button in core order list */}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center">
                                            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">No orders found yet.</p>
                                            <Link href="/" className="text-sm font-black text-slate-900 underline mt-2 inline-block">Start Shopping</Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-slate-900">Track & Help</h2>
                                <div className="space-y-3">
                                    <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl shadow-slate-900/10">
                                        <MessageSquare className="w-6 h-6 text-brand-lemon mb-4" />
                                        <h3 className="font-bold mb-1">Need Assistance?</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed mb-4">Chat with our styling experts or open a dispute regarding an order.</p>
                                        <button className="w-full py-3 bg-brand-lemon text-slate-900 rounded-full text-xs font-bold hover:opacity-90 transition-all">
                                            Contact Support
                                        </button>
                                    </div>
                                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                        <ShieldAlert className="w-6 h-6 text-slate-900 mb-4" />
                                        <h3 className="font-bold mb-1 text-slate-900">Wallet Overview</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed mb-4">Your payments are secured via split settlement until you confirm delivery.</p>
                                        <button className="text-xs font-bold text-slate-900 underline">View Settlement Policy</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pt-2 md:pt-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">My Orders</h1>
                                <p className="text-slate-500 text-sm mt-1">Manage and track your fashion orders.</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-full overflow-x-auto no-scrollbar max-w-full self-start md:self-auto">
                                {['All', 'In delivery', 'Completed', 'Cancelled'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setOrderFilter(f)}
                                        className={`px-6 md:px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${orderFilter === f
                                            ? 'bg-white text-slate-900 shadow-md scale-105'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                            {/* Mobile Card View */}
                            <div className="md:hidden">
                                {filteredOrders.map((order) => (
                                    <div key={order._id} className="p-5 border-b border-slate-50 last:border-none">
                                        <div className="flex gap-4 mb-4">
                                            <div className="relative w-24 h-28 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                                                <Image
                                                    src={getImageUrl(order.items[0]?.image)}
                                                    alt={order.items[0]?.name || 'Product'}
                                                    fill
                                                    unoptimized={true}
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/product-1.jpg';
                                                    }}
                                                />
                                                    <span className={`block text-center px-1 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter shadow-sm ${order.escrowStatus === 'released' ? 'bg-emerald-500 text-white' :
                                                        order.escrowStatus === 'frozen' ? 'bg-red-500 text-white' :
                                                            'bg-orange-500 text-white'
                                                        }`}>
                                                        {order.escrowStatus === 'released' ? 'SETTLED' :
                                                         order.escrowStatus === 'frozen' ? 'DISPUTED' :
                                                         order.escrowStatus === 'waiting_approval' ? 'PENDING APPROVAL' :
                                                         'SECURED'}
                                                    </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">#ORD-{order._id.slice(-6).toUpperCase()}</p>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${['delivered', 'cancelled'].includes(order.status) ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{order.items[0]?.name || 'Multiple Items'}</h3>
                                                <p className="text-xs text-slate-500 font-medium">{order.vendorName || 'FLA Vendor'}</p>
                                                {order.deliveryType === 'inter-regional' && (
                                                    <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 flex flex-col gap-1">
                                                        <span>1st Mile: GH₵ {order.firstMileFee || 'TBD'} 
                                                            {order.firstMileFee > 0 && ` (${order.isFirstMileFeePaid ? 'Paid' : 'Pending'})`}
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="font-sans font-black text-slate-900 mt-2">GH₵ {order.totalAmount}</p>
                                            </div>
                                        </div>
                                        <div className={`grid grid-cols-2 gap-3 transition-all duration-500 ${order.status === 'cancelled' ? 'opacity-20 pointer-events-none grayscale blur-[3px]' : ''}`}>
                                            {!order.isPaid && !order.paymentProof && (
                                                <button
                                                    onClick={() => handlePayNow(order._id, order.totalAmount)}
                                                    className="col-span-2 py-3 bg-brand-lemon text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 text-center mb-1"
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                            {order.deliveryType === 'inter-regional' && order.firstMileFee > 0 && !order.isFirstMileFeePaid && (
                                                <div className="col-span-2 flex flex-col gap-2 mb-2">
                                                    <button
                                                        onClick={() => handlePayDeliveryFee(order._id)}
                                                        className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 text-center shadow-slate-900/10"
                                                    >
                                                        Accept & Pay Delivery (GHC {order.firstMileFee})
                                                    </button>
                                                    <button
                                                        onClick={() => handleWithdrawOrder(order._id)}
                                                        className="py-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 text-center"
                                                    >
                                                        Withdraw Order
                                                    </button>
                                                </div>
                                            )}
                                            {order.paymentProof && !order.isPaid && (
                                                <div className="col-span-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center mb-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Verification Pending</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setTrackingOrder(order)}
                                                className="py-3 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 text-center"
                                            >
                                                Track
                                            </button>
                                            <button
                                                onClick={() => setSelectedReceipt(order)}
                                                className="py-3 bg-slate-100 text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
                                            >
                                                <FileText className="w-3 h-3" /> Receipt
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDisputeOrderId(order._id);
                                                    setShowDisputeForm(true);
                                                }}
                                                className="py-3 bg-red-50 text-red-500 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 text-center"
                                            >
                                                Report
                                            </button>
                                            <div className="flex gap-3">

                                                {order.status === 'shipped' && (
                                                    <button
                                                        onClick={async () => {
                                                            const result = await Swal.fire({
                                                                title: 'Received Package?',
                                                                text: "Have you received your package from the courier? This will update your order status to Delivered.",
                                                                icon: 'info',
                                                                showCancelButton: true,
                                                                confirmButtonColor: '#0F172A',
                                                                confirmButtonText: 'Yes, Received'
                                                            });

                                                            if (result.isConfirmed) {
                                                                try {
                                                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${order._id}/confirm-receipt`, {
                                                                        method: 'POST',
                                                                        credentials: 'include'
                                                                    });

                                                                    if (!response.ok) throw new Error('Failed to confirm receipt');

                                                                    // Update local state
                                                                    setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'delivered' } : o));

                                                                    Swal.fire('Updated!', 'Order marked as Delivered. Please let us know if you are satisfied with the items.', 'success');
                                                                } catch (error: any) {
                                                                    Swal.fire('Error', error.message, 'error');
                                                                }
                                                            }
                                                        }}
                                                        className="flex-1 py-3 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all text-center shadow-md shadow-slate-200"
                                                    >
                                                        Confirm Receipt
                                                    </button>
                                                )}

                                                 {order.status === 'delivered' && order.escrowStatus !== 'released' && (
                                                    <button
                                                        onClick={async () => {
                                                            const result = await Swal.fire({
                                                                title: 'Release Funds?',
                                                                text: "Are you satisfied with the quality of the item? Clicking yes will release the payment to the vendor.",
                                                                icon: 'question',
                                                                showCancelButton: true,
                                                                confirmButtonColor: '#10B981',
                                                                confirmButtonText: 'Yes, I am Satisfied'
                                                            });

                                                            if (result.isConfirmed) {
                                                                try {
                                                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${order._id}/satisfied`, {
                                                                        method: 'POST',
                                                                        credentials: 'include'
                                                                    });

                                                                    if (!response.ok) throw new Error('Failed to release funds');

                                                                    // Update local state
                                                                    setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'completed', escrowStatus: 'released' } : o));

                                                                    Swal.fire('Completed!', 'Thank you! The vendor has been paid.', 'success');
                                                                } catch (error: any) {
                                                                    Swal.fire('Error', error.message, 'error');
                                                                }
                                                            }
                                                        }}
                                                        className="flex-1 py-3 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all text-center shadow-md shadow-slate-200"
                                                    >
                                                        I'm Satisfied
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && (
                                    <div className="p-10 text-center text-slate-400 font-bold text-sm">No orders found.</div>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredOrders.map((order) => (
                                            <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-12 h-14 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                                            <Image
                                                                src={getImageUrl(order.items[0]?.image)}
                                                                alt={order.items[0]?.name || 'Product'}
                                                                fill
                                                                unoptimized={true}
                                                                className="object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = '/product-1.jpg';
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">#ORD-{order._id.slice(-6).toUpperCase()}</p>
                                                            <p className="font-bold text-slate-900 text-sm">{order.items[0]?.name || 'Multiple Items'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${['delivered', 'cancelled'].includes(order.status) ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.escrowStatus === 'released' ? 'bg-emerald-100 text-emerald-700' :
                                                        order.escrowStatus === 'frozen' ? 'bg-red-100 text-red-700' :
                                                            order.escrowStatus === 'waiting_approval' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {order.escrowStatus === 'released' ? 'SETTLED' :
                                                         order.escrowStatus === 'frozen' ? 'DISPUTED' :
                                                         order.escrowStatus === 'waiting_approval' ? 'PENDING APPROVAL' :
                                                         'PENDING SETTLEMENT'}
                                                    </span>
                                                <td className="px-8 py-6 text-sm text-slate-600 font-bold">
                                                    {order.vendorName || 'FLA Vendor'}
                                                    {order.pickupPoint && (
                                                        <div className="mt-1">
                                                            <span className="text-[9px] font-black text-brand-black bg-brand-lemon px-2 py-0.5 rounded-md border border-brand-lemon/20 inline-block uppercase">POINT: {order.pickupPoint}</span>
                                                        </div>
                                                    )}
                                                    {order.deliveryType === 'inter-regional' && (
                                                        <div className="mt-1 flex flex-col gap-0.5">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">1st Mile: GH₵ {order.firstMileFee || 'TBD'}</span>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest ${order.isFirstMileFeePaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                {order.firstMileFee > 0 ? (order.isFirstMileFeePaid ? 'PAID' : 'PENDING') : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 font-sans font-black text-slate-900">GH₵ {order.totalAmount}</td>
                                                <td className={`px-8 py-6 text-right flex items-center justify-end gap-2 transition-all duration-500 ${order.status === 'cancelled' ? 'opacity-20 pointer-events-none grayscale blur-[3px]' : ''}`}>
                                                    {!order.isPaid && (
                                                        <button
                                                            onClick={() => handlePayNow(order._id, order.totalAmount)}
                                                            className="px-6 py-2 bg-brand-lemon text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest hover:shadow-lg transition-all whitespace-nowrap"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                    {order.deliveryType === 'inter-regional' && order.firstMileFee > 0 && !order.isFirstMileFeePaid && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handlePayDeliveryFee(order._id)}
                                                                className="px-6 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:shadow-lg transition-all whitespace-nowrap"
                                                            >
                                                                Accept Fee
                                                            </button>
                                                            <button
                                                                onClick={() => handleWithdrawOrder(order._id)}
                                                                className="px-6 py-2 bg-red-50 text-red-500 border border-red-100 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all whitespace-nowrap"
                                                            >
                                                                Withdraw
                                                            </button>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => setTrackingOrder(order)}
                                                        className="px-6 py-2 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                    >
                                                        Track
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedReceipt(order)}
                                                        className="px-6 py-2 bg-slate-100 text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
                                                    >
                                                        <FileText className="w-3 h-3 text-slate-400 group-hover:text-slate-900" /> Receipt
                                                    </button>
                                                    {order.status === 'shipped' && (
                                                        <button
                                                            onClick={async () => {
                                                                const result = await Swal.fire({
                                                                    title: 'Received Package?',
                                                                    text: "Have you received your package from the courier? This will update your order status to Delivered.",
                                                                    icon: 'info',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#0F172A',
                                                                    confirmButtonText: 'Yes, Received'
                                                                });

                                                                if (result.isConfirmed) {
                                                                    try {
                                                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${order._id}/confirm-receipt`, {
                                                                            method: 'POST',
                                                                            credentials: 'include'
                                                                        });

                                                                        if (!response.ok) throw new Error('Failed to confirm receipt');

                                                                        // Update local state
                                                                        setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'delivered' } : o));

                                                                        Swal.fire('Updated!', 'Order marked as Delivered. Please let us know if you are satisfied with the items.', 'success');
                                                                    } catch (error: any) {
                                                                        Swal.fire('Error', error.message, 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-6 py-2 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-md shadow-slate-200"
                                                        >
                                                            Confirm Receipt
                                                        </button>
                                                    )}

                                                    {order.status === 'delivered' && order.escrowStatus !== 'released' && (
                                                        <button
                                                            onClick={async () => {
                                                                const result = await Swal.fire({
                                                                    title: 'Release Funds?',
                                                                    text: "Are you satisfied with the quality of the item? Clicking yes will release the payment to the vendor.",
                                                                    icon: 'question',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#10B981',
                                                                    confirmButtonText: 'Yes, I am Satisfied'
                                                                });

                                                                if (result.isConfirmed) {
                                                                    try {
                                                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${order._id}/satisfied`, {
                                                                            method: 'POST',
                                                                            credentials: 'include'
                                                                        });

                                                                        if (!response.ok) throw new Error('Failed to release funds');

                                                                        // Update local state
                                                                        setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'completed', escrowStatus: 'released' } : o));

                                                                        Swal.fire('Completed!', 'Thank you! The vendor has been paid.', 'success');
                                                                    } catch (error: any) {
                                                                        Swal.fire('Error', error.message, 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-6 py-2 bg-emerald-600 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-md shadow-emerald-200"
                                                        >
                                                            I'm Satisfied
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setDisputeOrderId(order._id);
                                                            setShowDisputeForm(true);
                                                        }}
                                                        className="px-6 py-2 bg-slate-50 text-red-500 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                    >
                                                        Complain
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="max-w-4xl animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Profile Settings</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage your account details and delivery address.</p>
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-12 space-y-8">
                            <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                                <div className="relative w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden bg-slate-100 flex items-center justify-center group">
                                    {profileImage ? (
                                        <Image
                                            src={getImageUrl(profileImage)}
                                            alt="Profile"
                                            fill
                                            unoptimized={true}
                                            className="object-cover"

                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/product-1.jpg';
                                            }}
                                        />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <Star className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-black text-slate-900 bg-brand-lemon border border-brand-lemon px-5 py-2.5 rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Change Avatar
                                    </button>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Max Size: 2MB (.PNG, .JPG)</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileEmail}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={profilePhone}
                                        onChange={(e) => setProfilePhone(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery City</label>
                                    <input
                                        type="text"
                                        value={profileCity}
                                        onChange={(e) => setProfileCity(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Delivery Address</label>
                                    <textarea
                                        rows={3}
                                        value={profileAddress}
                                        onChange={(e) => setProfileAddress(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none"
                                        placeholder="Enter your full house/office address details..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isUpdating}
                                    className={`px-10 py-4 bg-slate-900 text-white rounded-full font-bold text-sm tracking-wide hover:shadow-2xl transition-all shadow-slate-900/20 active:scale-95 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUpdating ? 'Saving Changes...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'wishlist':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">My Wishlist</h1>
                            <p className="text-slate-500 text-sm mt-1">Designs you've saved for later.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {wishlist?.items?.length > 0 ? (
                                wishlist.items.map((item: any, i: number) => (
                                    <ProductCard
                                        key={item._id || i}
                                        id={item.productId?._id}
                                        name={item.productId?.name || 'Unnamed Design'}
                                        price={item.productId?.price || 0}
                                        images={item.productId?.images || ['/product-1.jpg']}
                                        sizes={item.productId?.sizes}
                                        stock={item.productId?.stock || 0}
                                        vendorId={item.productId?.vendorId}
                                        index={i}
                                        duration={item.productId?.tailoringTime}
                                        imageLabels={item.productId?.imageLabels}
                                        initialWishlistState={true}
                                        description={item.productId?.description}

                                        vendorName={item.productId?.vendorName}
                                        hasSizes={item.productId?.hasSizes}
                                        hasColors={item.productId?.hasColors}
                                        colors={item.productId?.colors}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <Heart className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Your wishlist is lonely.</p>
                                    <Link href="/" className="text-sm font-black text-slate-900 underline mt-2 inline-block tracking-tighter uppercase">Browse Collection</Link>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Notifications</h1>
                        </div>
                        <div className="space-y-4">
                            {notifications.length > 0 ? (
                                notifications.map((n, i) => (
                                    <div key={n._id || i} className={`p-5 rounded-[24px] flex gap-4 items-start transition-all border ${!n.isRead ? 'bg-white border-brand-lemon shadow-md' : 'bg-white border-slate-100 shadow-sm opacity-70'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-brand-lemon text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`font-bold transition-colors ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</h3>
                                                <span className="text-[9px] font-black text-slate-300 uppercase shrink-0 ml-2">{new Date(n.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                    <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No new notifications.</p>
                                    <p className="text-slate-300 text-xs mt-1">We'll notify you here about your orders and messages.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'help':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Help & Support</h1>
                            <p className="text-slate-500 text-sm mt-1">We're here to ensure you have the best fashion experience.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { title: 'Open Dispute', label: 'Order Issues', icon: ShieldAlert, color: 'text-red-500', action: () => setShowDisputeForm(true) },
                                { title: 'Live Support', label: 'Stylist Advice', icon: MessageSquare, color: 'text-blue-500', action: () => setShowLiveSupport(true) },
                            ].map((s, i) => (
                                <button key={i} onClick={s.action} className="flex items-center gap-5 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group text-left">
                                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                                        <h3 className="font-bold text-slate-900 text-lg">{s.title}</h3>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-200 ml-auto" />
                                </button>
                            ))}
                        </div>

                        {/* Recent Disputes List */}
                        <div className="mt-8">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">Recent Disputes</h2>
                            {disputes.length > 0 ? (
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    {disputes.map((dispute) => (
                                        <div key={dispute._id} className="p-6 border-b border-slate-50 last:border-none flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${dispute.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                                                        dispute.status === 'closed' ? 'bg-slate-100 text-slate-500' :
                                                            'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {dispute.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Opened {new Date(dispute.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm">{dispute.category}</h3>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                    <span className="font-bold text-slate-400">Order #{dispute.orderId.slice(-6).toUpperCase()}</span> — {dispute.description}
                                                </p>
                                            </div>
                                            <Link 
                                                href={`/dispute/${dispute._id}`}
                                                className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all text-center"
                                            >
                                                Enter Ledger
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-6 bg-white rounded-[32px] border border-slate-100 border-dashed">
                                    <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Active Disputes</p>
                                    <p className="text-xs text-slate-300 mt-1">If you have issues with an order, report it above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isHydrated || isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-lemon rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Lifestyle...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <main className="min-h-screen bg-[#FDFDFF] flex flex-col md:flex-row">
            {/* Sidebar Overlay */}
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className={`absolute top-0 left-0 w-[80%] h-full bg-white transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-8 pb-12 flex justify-between items-center bg-white">
                            <Image 
                                src="/logo.jpeg" 
                                alt="FLA Logo" 
                                width={40} 
                                height={40} 
                                className="h-10 w-auto object-contain rounded-lg"
                            />
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="flex-1 px-4 space-y-2">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveSection(item.id as DashboardSection);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-xs font-bold tracking-wider transition-all ${activeSection === item.id ? 'bg-slate-900 text-brand-lemon' : 'text-slate-400 hover:text-slate-900'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="p-8 border-t border-slate-50 space-y-4">
                            <Link href="/">
                                <button className="flex items-center gap-4 text-xs font-bold text-slate-400 hover:text-slate-900 w-full text-left">
                                    <ArrowLeft className="w-4 h-4" /> Launch Store
                                </button>
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-4 text-xs font-bold text-red-500 hover:translate-x-1 transition-transform w-full text-left">
                                <LogOut className="w-4 h-4" /> Logout Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-[280px] h-screen bg-white border-r border-slate-100 sticky top-0 overflow-y-auto">
                <div className="p-10 pt-12 pb-16 flex items-center justify-center">
                    <Link href="/">
                        <Image 
                            src="/logo.jpeg" 
                            alt="FLA Logo" 
                            width={80} 
                            height={80} 
                            className="h-14 w-auto object-contain rounded-2xl shadow-xl shadow-slate-200/50"
                        />
                    </Link>
                </div>

                <nav className="flex-1 px-6 space-y-3">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as DashboardSection)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap group ${activeSection === item.id ? 'bg-slate-900 text-brand-lemon shadow-xl shadow-slate-900/10' : 'text-slate-400 hover:text-slate-900'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 transition-transform ${activeSection === item.id ? 'scale-110' : 'group-hover:translate-x-1'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>



                <div className="p-10 border-t border-slate-50 space-y-4">
                    <Link href="/">
                        <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:translate-x-1 transition-all group w-full text-left">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Launch Store
                        </button>
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:translate-x-1 transition-transform active:scale-95 w-full text-left">
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Dashboard Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full z-[80] bg-white/95 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 mt-14">
                <Link href="/">
                    <Image 
                        src="/logo.jpeg" 
                        alt="FLA Logo" 
                        width={40} 
                        height={40} 
                        className="h-8 w-auto object-contain rounded-lg"
                    />
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-slate-900 text-white rounded-full shadow-lg"
                >
                    <Menu className="w-4 h-4" />
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 min-h-screen md:h-screen md:overflow-y-auto overflow-x-hidden relative">
                {/* Fixed Top Bar (Desktop Only) */}
                <header className="hidden md:flex sticky top-0 z-50 bg-[#FDFDFF]/80 backdrop-blur-md px-10 py-6 items-center justify-between border-b border-slate-100/50">
                    <div className="relative w-96 max-w-sm">
                        <input type="text" placeholder="Search orders, receipts, help..." className="w-full bg-white py-3 pl-12 pr-6 rounded-full border border-slate-100 text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all shadow-sm" />
                        <Search className="w-4 h-4 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{user?.name || 'Customer'}</p>
                            <p className="text-[9px] font-black text-brand-lemon uppercase tracking-widest">Premium Member</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white border-2 border-brand-lemon shadow-lg overflow-hidden relative">
                            {profileImage ? (
                                <Image src={getImageUrl(profileImage)} alt="User" fill className="object-cover" unoptimized={true} />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-12 pt-36 md:pt-12 pb-24 w-full max-w-[95%] mx-auto">
                    {renderContent()}
                </div>

                {/* Live Support / Chat UI */}
                {showLiveSupport && (
                    <div className="fixed bottom-8 right-8 z-[400] w-full max-w-sm animate-in slide-in-from-bottom-10 duration-500">
                        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
                            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-lemon flex items-center justify-center text-slate-900">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-black text-brand-lemon uppercase tracking-widest">Active Stylist</p>
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        </div>
                                        <h4 className="font-bold">Afiwa (Expert)</h4>
                                    </div>
                                </div>
                                <button onClick={() => setShowLiveSupport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="h-96 bg-slate-50 p-6 overflow-y-auto space-y-4">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%]">
                                    <p className="text-xs text-slate-600 leading-relaxed">Hi {user?.name}! I'm Afiwa, your head stylist today. How can I help with your design?</p>
                                </div>
                                <div className="bg-brand-lemon p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] ml-auto">
                                    <p className="text-xs text-slate-900 font-bold leading-relaxed">I'm having issues with the fabric selection for my latest order.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type to chat on WhatsApp..."
                                    className="flex-1 bg-slate-50 border-none rounded-full px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform hover:bg-emerald-600 group"
                                >
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="bg-slate-50 px-6 py-2 border-t border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase text-center tracking-widest">Direct Link to WhatsApp Official Support</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dispute Modal */}
                {showDisputeForm && (
                    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDisputeForm(false)} />
                        <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Resolution Center</p>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Open a Dispute</h2>
                                    </div>
                                    <button onClick={() => setShowDisputeForm(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Order</label>
                                        <select
                                            value={disputeOrderId}
                                            onChange={(e) => setDisputeOrderId(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                        >
                                            <option value="">Select an order...</option>
                                            {orders.map(o => (
                                                <option key={o._id} value={o._id}>Order #ORD-{o._id.slice(-6).toUpperCase()} - {o.items[0]?.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Problem Category</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Wrong Sizing', 'Print Quality', 'Late Delivery', 'Fabric Issue'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setDisputeCategory(c)}
                                                    className={`py-3 px-4 rounded-xl text-[10px] font-bold transition-all text-left border ${disputeCategory === c ? 'bg-slate-900 text-brand-lemon border-slate-900' : 'bg-white border-slate-100 text-slate-600 hover:border-brand-lemon'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence / Description</label>
                                        <textarea
                                            rows={4}
                                            value={disputeDescription}
                                            onChange={(e) => setDisputeDescription(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none"
                                            placeholder="Describe the issue in detail..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button onClick={() => setShowDisputeForm(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-full font-bold text-xs uppercase tracking-widest">Cancel</button>
                                    <button
                                        onClick={handleSubmitDispute}
                                        disabled={isSubmittingDispute}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute Case'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {/* Tracking Modal */}
                {trackingOrder && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setTrackingOrder(null)} />
                        <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Tracking</p>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Order #ORD-{trackingOrder._id.slice(-6).toUpperCase()}</h2>
                                </div>
                                <button onClick={() => setTrackingOrder(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                {/* Current Activity Indicator */}
                                {(() => {
                                    const getStatusInfo = (status: string) => {
                                        switch (status) {
                                            case 'pending': return { label: 'Awaiting Payment', desc: 'Secure your design via Split Pay', color: 'bg-orange-500' };
                                            case 'funds_captured': case 'payment_verified': return { label: 'Payment Verified', desc: 'Payment securely settled', color: 'bg-emerald-500' };
                                            case 'confirmed': return { label: 'Order Confirmed', desc: 'Vendor has accepted your request', color: 'bg-blue-500' };
                                            case 'processing': case 'in_printing': return { label: 'In Production', desc: 'Your bespoke design is being crafted', color: 'bg-purple-500' };
                                            case 'preparing_shipment': return { label: 'Preparing Shipment', desc: 'Vendor is packaging your items', color: 'bg-indigo-500' };
                                            case 'in_transit_to_first_mile': return { label: 'In Transit to Hub', desc: 'Moving to the regional sorting station', color: 'bg-blue-600' };
                                            case 'arrived_at_first_mile': return { label: 'At Sorting Hub', desc: 'Processing at regional station', color: 'bg-cyan-500' };
                                            case 'in_transit_to_last_mile': return { label: 'In Final Transit', desc: 'Moving to your local delivery hub', color: 'bg-blue-700' };
                                            case 'in_transit': case 'shipped': return { label: 'In Transit', desc: 'Your package is on its way to you', color: 'bg-brand-lemon' };
                                            case 'delivered': return { label: 'Delivered', desc: 'Package arrived at destination', color: 'bg-emerald-600' };
                                            case 'completed': return { label: 'Order Completed', desc: 'Transaction finalized', color: 'bg-slate-900' };
                                            case 'disputed': return { label: 'In Dispute', desc: 'Resolution center is reviewing case', color: 'bg-red-500' };
                                            case 'cancelled': return { label: 'Cancelled', desc: 'This order has been terminated', color: 'bg-slate-400' };
                                            default: return { label: 'Status Update', desc: 'Tracking your order progress', color: 'bg-slate-900' };
                                        }
                                    };
                                    const info = getStatusInfo(trackingOrder.status);
                                    return (
                                        <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden">
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-2 h-2 rounded-full ${info.color} animate-pulse`} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Activity</span>
                                                </div>
                                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">{info.label}</h3>
                                                <p className="text-xs text-slate-400 font-medium">{info.desc}</p>
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-full opacity-10 pointer-events-none">
                                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    <path d="M0 0 L100 0 L100 100 Z" fill="white" />
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Order Summary Mini */}
                                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-[24px]">
                                    <div className="relative w-16 h-20 rounded-xl overflow-hidden shadow-sm">
                                        <Image
                                            src={getImageUrl(trackingOrder.items[0]?.image || '/product-1.jpg')}
                                            alt="p"
                                            fill
                                            className="object-cover"
                                            unoptimized={true}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/product-1.jpg';
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{trackingOrder.items[0]?.name || 'Multiple Items'}</h3>
                                        <p className="text-xs text-slate-500 font-medium">Bespoke Production • GH₵ {trackingOrder.totalAmount}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-[10px] font-black text-brand-lemon uppercase tracking-wider">Estimated Delivery</p>
                                        <p className="text-sm font-black text-slate-900">6-7 Working Days</p>
                                    </div>
                                </div>

                                {/* Tracking Stepper */}
                                <div className="relative space-y-6 pl-2">
                                    <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                    {(() => {
                                        const status = trackingOrder.status;
                                        const isInterRegional = trackingOrder.deliveryType === 'inter-regional';
                                        
                                        const isPassed = (current: string, target: string[]) => target.includes(current);

                                        const baseSteps = [
                                            { 
                                                title: 'Order Placed', 
                                                time: 'Recently', 
                                                desc: 'Your fashion request has been received.', 
                                                done: true 
                                            },
                                            { 
                                                title: 'Payment Verified', 
                                                time: isPassed(status, ['funds_captured', 'payment_verified', 'confirmed', 'processing', 'in_printing', 'preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) ? 'Done' : 'Pending',
                                                desc: 'Transaction secured via FLA Split Payment.',
                                                done: isPassed(status, ['funds_captured', 'payment_verified', 'confirmed', 'processing', 'in_printing', 'preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed'])
                                            },
                                            { 
                                                title: 'In Production', 
                                                time: isPassed(status, ['processing', 'in_printing', 'preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) ? 'Done' : 'In Progress', 
                                                desc: 'Stylists are working on your design.', 
                                                done: isPassed(status, ['processing', 'in_printing', 'preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) 
                                            },
                                            { 
                                                title: 'Preparing Shipment', 
                                                time: isPassed(status, ['preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) ? 'Done' : 'Pending', 
                                                desc: 'Vendor is carefully packaging your items.', 
                                                done: isPassed(status, ['preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) 
                                            },
                                        ];

                                        let trackingSteps = [];
                                        if (isInterRegional) {
                                            trackingSteps = [
                                                ...baseSteps,
                                                { title: 'In Transit to Hub', time: isPassed(status, ['in_transit_to_first_mile', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) ? 'Done' : 'Pending', desc: 'Moving to the regional sorting station.', done: isPassed(status, ['in_transit_to_first_mile', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) },
                                                { title: 'Arrived at Hub', time: isPassed(status, ['arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) ? 'Done' : 'Pending', desc: 'Sorting at regional delivery station.', done: isPassed(status, ['arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) },
                                                { title: 'Final Transit', time: isPassed(status, ['in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) ? 'Done' : 'Pending', desc: 'On the way to your local hub.', done: isPassed(status, ['in_transit_to_last_mile', 'shipped', 'delivered', 'completed']) },
                                                { title: 'Shipment Delivered', time: isPassed(status, ['delivered', 'completed']) ? 'Finalized' : 'Pending', desc: isPassed(status, ['delivered', 'completed']) ? `Arrived via ${trackingOrder.carrier || 'FLA Logistics'} (Tracking: ${trackingOrder.trackingNumber || 'N/A'})` : 'Package handed over to recipient.', done: isPassed(status, ['delivered', 'completed']) },
                                            ];
                                        } else {
                                            trackingSteps = [
                                                ...baseSteps,
                                                { title: 'In Transit (Direct)', time: isPassed(status, ['in_transit', 'shipped', 'delivered', 'completed']) ? 'Done' : 'Pending', desc: 'On its way directly to your location.', done: isPassed(status, ['in_transit', 'shipped', 'delivered', 'completed']) },
                                                { title: 'Shipment Delivered', time: isPassed(status, ['delivered', 'completed']) ? 'Finalized' : 'Pending', desc: isPassed(status, ['delivered', 'completed']) ? `Arrived via ${trackingOrder.carrier || 'FLA Logistics'} (Tracking: ${trackingOrder.trackingNumber || 'N/A'})` : 'Package handed over to recipient.', done: isPassed(status, ['delivered', 'completed']) },
                                            ];
                                        }

                                        return trackingSteps.map((s, idx) => (
                                            <div key={idx} className={`relative flex gap-6 transition-all duration-500 ${s.done ? 'opacity-100' : 'opacity-20 translate-x-1'}`}>
                                                <div className={`w-3 h-3 rounded-full mt-1.5 z-10 border-2 border-white ring-4 transition-all duration-700 ${s.done ? 'bg-brand-lemon ring-brand-lemon/30' : 'bg-slate-200 ring-slate-50'}`} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`font-bold text-sm transition-colors ${s.done ? 'text-slate-900' : 'text-slate-400'}`}>{s.title}</h4>
                                                        <span className={`text-[9px] font-black uppercase transition-colors ${s.done ? 'text-slate-500' : 'text-slate-300'}`}>{s.time}</span>
                                                    </div>
                                                    <p className={`text-[11px] mt-0.5 transition-colors ${s.done ? 'text-slate-600' : 'text-slate-300'}`}>{s.desc}</p>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Map / Courier Placeholder */}
                                <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-lemon flex items-center justify-center text-slate-900">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-brand-lemon uppercase tracking-widest">Courier Partner</p>
                                            <p className="text-xs font-bold">{trackingOrder.carrier || 'FLA Logistics'}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{trackingOrder.trackingNumber || 'Tracking Pending'}</p>
                                        </div>
                                    </div>
                                    <div className="relative w-12 h-12 bg-white p-1 rounded-lg border border-white/20">
                                        {/* @ts-ignore */}
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(isHydrated ? window.location.origin + '/track/' + trackingOrder._id : '')}`}
                                            alt="tracking qr"
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {selectedReceipt && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)} />
                        <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                            {/* Receipt Content */}
                            <div id="printable-receipt" className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
                                <div className="flex justify-between items-start mb-10 pb-10 border-b-2 border-slate-50">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Image 
                                                src="/logo.jpeg" 
                                                alt="FLA Logo" 
                                                width={40} 
                                                height={40} 
                                                className="h-10 w-auto object-contain rounded-lg shadow-sm"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Official Transaction Receipt</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1 flex items-center justify-end gap-2">
                                            <span className="text-xs text-slate-400 font-medium">TOTAL:</span> GH₵ {selectedReceipt.totalAmount}
                                        </h2>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedReceipt.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {selectedReceipt.isPaid ? (
                                                <React.Fragment>
                                                    <CheckCircle2 className="w-3 h-3" /> Payment Verified
                                                </React.Fragment>
                                            ) : (
                                                <React.Fragment>
                                                    <Clock className="w-3 h-3" /> Payment Pending
                                                </React.Fragment>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 mb-12">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Details</p>
                                        <p className="font-bold text-slate-900 text-sm md:text-base">{user?.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
                                        <p className="text-xs text-slate-500">{user?.phone || user?.location}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Information</p>
                                        <p className="text-sm text-slate-900 font-bold">#ORD-{selectedReceipt._id.slice(-6).toUpperCase()}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(selectedReceipt.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs text-slate-500">{selectedReceipt.paymentStatus === 'paid' ? 'Paystack Transaction' : 'Platform Settlement'}</p>
                                    </div>
                                </div>

                                {/* Itemized List */}
                                <div className="space-y-4 mb-12">
                                    <div className="md:hidden divide-y divide-slate-100">
                                        {selectedReceipt.items.map((item: any, i: number) => (
                                            <div key={i} className="py-6 space-y-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 text-[13px] uppercase tracking-tighter truncate">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">SIZE: {item.size} • QTY: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-black text-slate-900 text-sm tabular-nums whitespace-nowrap">GH₵ {(item.price * (item.quantity || 1)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <table className="hidden md:table w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Item Description</th>
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Qty</th>
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedReceipt.items.map((item: any, i: number) => (
                                                <tr key={i}>
                                                    <td className="py-6">
                                                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                                                            Size: {item.size} • Studio: {selectedReceipt.vendorName || 'FLA Studio'}
                                                        </p>
                                                    </td>
                                                    <td className="py-6 text-center text-sm font-bold text-slate-900">{item.quantity}</td>
                                                    <td className="py-6 text-right font-sans font-black text-slate-900">GH₵ {(item.price * (item.quantity || 1)).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="space-y-3 pt-6 border-t-2 border-slate-50 mb-12">
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                                        <span className="font-sans font-bold">GH₵ {selectedReceipt.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Processing Fee</span>
                                        <span className="font-sans font-bold">GH₵ 0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Total Amount</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">GH₵ {selectedReceipt.totalAmount}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Verified Purchase</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Digitally Certified by FLA Purchase</p>
                                        </div>
                                    </div>
                                    <div className="relative w-16 h-16 bg-white p-1 rounded-lg border border-slate-100 hidden sm:block">
                                        {/* @ts-ignore */}
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(isHydrated ? window.location.origin + '/track/' + selectedReceipt._id : '')}`}
                                            alt="receipt qr"
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 text-center">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Thank you for supporting authentic fashion</p>
                                </div>
                            </div>

                            {/* Modal Footer (No Print) */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 no-print">
                                <button onClick={() => setSelectedReceipt(null)} className="flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white hover:border-slate-300 transition-all active:scale-95">
                                    Close
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                                >
                                    <Printer className="w-4 h-4" /> Print Receipt
                                </button>
                            </div>
                        </div>

                        <style jsx global>{`
                            @media print {
                                body > *:not(.fixed) { display: none !important; }
                                .fixed:not(:has(#printable-receipt)) { display: none !important; }
                                .fixed:has(#printable-receipt) { position: absolute !important; inset: 0 !important; background: white !important; }
                                .no-print { display: none !important; }
                                #printable-receipt { 
                                    visibility: visible !important;
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 100% !important;
                                    padding: 40px !important;
                                }
                            }
                        `}</style>
                    </div>
                )
                }

                {/* Mobile Bottom Float Action */}
                <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-max">
                    <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex gap-1 items-center">
                        {sidebarItems.slice(0, 4).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id as DashboardSection)}
                                className={`h-12 flex items-center justify-center transition-all duration-500 rounded-full gap-2 ${activeSection === item.id
                                    ? 'bg-brand-lemon text-slate-900 px-6 shadow-lg shadow-brand-lemon/20'
                                    : 'text-slate-400 px-4'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'scale-110' : ''}`} />
                                {activeSection === item.id && (
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
