"use client";
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, ShoppingBag, Heart, Bell, User,
    HelpCircle, LogOut, Package, Clock, CheckCircle2,
    Wallet, ChevronRight, MessageSquare, ShieldAlert,
    Search, Menu, X, ArrowRight, Star, ArrowLeft
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
    const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();
    const { addToCart } = useCart();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<DashboardSection>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState<any>(null);
    const [orderFilter, setOrderFilter] = useState('All');
    const [ratingOrder, setRatingOrder] = useState<any>(null);
    const [ratingValue, setRatingValue] = useState(0);

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

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('fla_token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                const [statsRes, ordersRes, wishlistRes, notificationsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/dashboard/customer/stats`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/my-orders`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist/my-wishlist`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/my-notifications`, { headers })
                ]);

                if (statsRes.ok) setDashboardData(await statsRes.json());
                if (ordersRes.ok) setOrders(await ordersRes.json());
                if (wishlistRes.ok) setWishlist(await wishlistRes.json());
                if (notificationsRes.ok) setNotifications(await notificationsRes.json());
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
            // Sync profile states
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
            setProfilePhone(user.phone || '');
            setProfileCity(user.location || '');
            setProfileAddress(user.address || '');
            setProfileImage(user.profileImage || null);
        }
    }, [user]);

    const getImageUrl = (url: string) => {
        if (!url || url === '/product-1.jpg') return '/product-1.jpg';
        if (url.startsWith('http')) return url;

        // Backend uploads
        if (url.startsWith('/uploads')) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
            return `${baseUrl}${url}`;
        }

        // Frontend static assets
        if (url.startsWith('/')) return url;

        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
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
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
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
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/support/dispute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: disputeOrderId,
                    category: disputeCategory,
                    description: disputeDescription
                })
            });

            if (!response.ok) throw new Error('Failed to submit dispute');

            Swal.fire({
                icon: 'success',
                title: 'DISPUTE SUBMITTED',
                text: 'Our team will review your case and contact you soon.',
                confirmButtonText: 'UNDERSTOOD',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    htmlContainer: 'text-slate-500 font-medium text-sm mb-6',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
                }
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
            label: 'Total Spent',
            value: `GH₵ ${dashboardData?.totalSpent || 0}`,
            icon: Wallet,
            color: 'text-slate-900',
            bg: 'bg-brand-lemon/20',
            border: 'border-brand-lemon/30'
        },
        {
            label: 'Active Orders',
            value: dashboardData?.activeOrders || '0',
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        },
        {
            label: 'Wishlist Items',
            value: dashboardData?.wishlistCount || '0',
            icon: Heart,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100'
        },
        {
            label: 'Completed',
            value: orders.filter(o => o.status === 'delivered').length.toString(),
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100'
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
                                                        <Image src={getImageUrl(order.items[0]?.image || '/product-1.jpg')} alt={order.items[0]?.name || 'Product'} fill className="object-cover" unoptimized />
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
                                                        <p className="text-xs text-slate-500 mt-0.5">{order.vendorName || 'FLA Vendor'}</p>
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
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendOrderToWhatsApp(order);
                                                            }}
                                                            className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                            title="Send to WhatsApp"
                                                        >
                                                            <WhatsAppIcon className="w-4.5 h-4.5" />
                                                        </button>
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
                                        <p className="text-slate-500 text-xs leading-relaxed mb-4">Your payments are held in escrow until you confirm delivery.</p>
                                        <button className="text-xs font-bold text-slate-900 underline">View Escrow Policy</button>
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
                                {['All', 'Active', 'Completed'].map(f => (
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
                                {orders
                                    .filter(order => {
                                        if (orderFilter === 'All') return true;
                                        if (orderFilter === 'Active') return !['delivered', 'cancelled'].includes(order.status);
                                        if (orderFilter === 'Completed') return order.status === 'delivered';
                                        return true;
                                    })
                                    .map((order) => (
                                        <div key={order._id} className="p-5 border-b border-slate-50 last:border-none">
                                            <div className="flex gap-4 mb-4">
                                                <div className="relative w-20 h-24 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                                                    <Image
                                                        src={getImageUrl(order.items[0]?.image || '/product-1.jpg')}
                                                        alt="p"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
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
                                                    <p className="font-sans font-black text-slate-900 mt-2">GH₵ {order.totalAmount}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setTrackingOrder(order)}
                                                    className="py-3 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 text-center"
                                                >
                                                    Track Order
                                                </button>
                                                <div className="flex gap-3">
                                                    {order.status === 'delivered' && (
                                                        <button
                                                            onClick={() => setRatingOrder({ id: order._id, name: order.items[0]?.name })}
                                                            className="flex-1 py-3 bg-brand-lemon text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:shadow-lg transition-all text-center"
                                                        >
                                                            Rate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleSendOrderToWhatsApp(order)}
                                                        className="flex-1 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
                                                        title="Send Order to WhatsApp"
                                                    >
                                                        <WhatsAppIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    </button>
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
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orders
                                            .filter(order => {
                                                if (orderFilter === 'All') return true;
                                                if (orderFilter === 'Active') return !['delivered', 'cancelled'].includes(order.status);
                                                if (orderFilter === 'Completed') return order.status === 'delivered';
                                                return true;
                                            })
                                            .map((order) => (
                                                <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative w-12 h-14 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                                                <Image
                                                                    src={getImageUrl(order.items[0]?.image || '/product-1.jpg')}
                                                                    alt="p"
                                                                    fill
                                                                    className="object-cover"
                                                                    unoptimized
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
                                                    <td className="px-8 py-6 text-sm text-slate-600 font-bold">{order.vendorName || 'FLA Vendor'}</td>
                                                    <td className="px-8 py-6 font-sans font-black text-slate-900">GH₵ {order.totalAmount}</td>
                                                    <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                                                        {order.status === 'delivered' && (
                                                            <button
                                                                onClick={() => setRatingOrder({ id: order._id, name: order.items[0]?.name })}
                                                                className="px-6 py-2 bg-brand-lemon text-slate-900 rounded-full text-[9px] font-bold uppercase tracking-widest hover:shadow-lg transition-all"
                                                            >
                                                                Rate Design
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setTrackingOrder(order)}
                                                            className="px-6 py-2 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                        >
                                                            Track
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendOrderToWhatsApp(order)}
                                                            className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-md group"
                                                            title="Send Order to WhatsApp"
                                                        >
                                                            <WhatsAppIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
                                        <Image src={profileImage} alt="Profile" fill className="object-cover" />
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
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all resize-none"
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
                                        batchSize={item.productId?.batchSize}
                                        currentBatchCount={item.productId?.currentBatchCount}
                                        wholesalePrice={item.productId?.wholesalePrice}
                                        batchStatus={item.productId?.batchStatus}
                                        duration={item.productId?.duration}
                                        imageLabels={item.productId?.imageLabels}
                                        initialWishlistState={true}
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
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <main className="min-h-screen bg-[#FDFDFF] flex flex-col md:flex-row">
            {/* Sidebar Overlay */}
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className={`absolute top-0 left-0 w-[80%] h-full bg-white transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-8 pb-12 flex justify-between items-center bg-white">
                            <span className="font-heading font-black text-2xl tracking-tighter text-slate-900 uppercase">FLA.</span>
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
                    <Link href="/" className="font-heading font-black text-3xl tracking-tighter text-slate-900 uppercase">FLA<span className="text-brand-lemon">.</span></Link>
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

                <div className="p-8 m-6 rounded-[32px] bg-slate-50 group border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-lemon">
                            <Star className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">VIP</span>
                    </div>
                    <p className="text-xs font-black text-slate-900 leading-tight">Elite Fashion <br />Access Member</p>
                    <button className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Upgrade Plan</button>
                </div>

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
                <Link href="/" className="font-heading font-black text-xl tracking-tighter text-slate-900 uppercase">FLA.</Link>
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
                                <Image src={profileImage} alt="User" fill className="object-cover" />
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

                {/* Rating Modal */}
                {ratingOrder && (
                    <div className="fixed inset-0 z-[310] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setRatingOrder(null)} />
                        <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-brand-lemon/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Star className="w-10 h-10 text-brand-lemon fill-current" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Rate Your Design</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">— Optional —</p>
                            <p className="text-slate-500 text-sm mb-8">How would you rate the tailoring and print quality of <b>{ratingOrder.name}</b>?</p>

                            <div className="flex justify-center gap-3 mb-10">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setRatingValue(star)}
                                        onMouseLeave={() => setRatingValue(0)}
                                        onClick={() => {
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Thank You!',
                                                text: 'Your feedback helps our tailoring community grow.',
                                                customClass: { popup: 'rounded-[32px]' }
                                            });
                                            setRatingOrder(null);
                                        }}
                                        className="transition-transform active:scale-90 hover:scale-110"
                                    >
                                        <Star className={`w-8 h-8 ${star <= ratingValue ? 'text-brand-lemon fill-current' : 'text-slate-200'}`} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                placeholder="Share your experience (optional)..."
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm mb-8 resize-none h-24 focus:ring-2 focus:ring-brand-lemon/20"
                            />

                            <button
                                onClick={() => setRatingOrder(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-full font-bold text-sm tracking-widest uppercase shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                Submit Rating
                            </button>

                            <button
                                onClick={() => {
                                    setRatingOrder(null);
                                    setRatingValue(0);
                                }}
                                className="w-full mt-4 py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
                            >
                                Maybe Later
                            </button>
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
                                {/* Order Summary Mini */}
                                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-[24px]">
                                    <div className="relative w-16 h-20 rounded-xl overflow-hidden shadow-sm">
                                        <Image src={trackingOrder.items[0]?.image || '/product-1.jpg'} alt="p" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{trackingOrder.items[0]?.name || 'Multiple Items'}</h3>
                                        <p className="text-xs text-slate-500 font-medium">Bespoke Production • GH₵ {trackingOrder.totalAmount}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-[10px] font-black text-brand-lemon uppercase tracking-wider">Estimated Delivery</p>
                                        <p className="text-sm font-black text-slate-900">3-5 Working Days</p>
                                    </div>
                                </div>

                                {/* Tracking Stepper */}
                                <div className="relative space-y-6 pl-2">
                                    <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                    {[
                                        { title: 'Order Placed', time: 'Recently', desc: 'Your fashion request has been received.', done: true },
                                        { title: 'In Production', time: 'In Progress', desc: 'Stylists are working on your design.', done: ['processing', 'shipped', 'delivered'].includes(trackingOrder.status) },
                                        { title: 'Quality Assurance', time: 'Pending', desc: 'Checking tailoring excellence.', done: ['shipped', 'delivered'].includes(trackingOrder.status) },
                                        { title: 'Shipped via FLA Logistics', time: 'Pending', desc: 'On its way to your location.', done: ['shipped', 'delivered'].includes(trackingOrder.status) },
                                        { title: 'Delivered', time: 'Pending', desc: 'Package handed over to recipient.', done: trackingOrder.status === 'delivered' },
                                    ].map((s, idx) => (
                                        <div key={idx} className={`relative flex gap-6 transition-opacity ${s.done ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className={`w-3 h-3 rounded-full mt-1.5 z-10 border-2 border-white ring-4 ${s.done ? 'bg-brand-lemon ring-brand-lemon/20' : 'bg-slate-200 ring-slate-100'}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">{s.time}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Map / Courier Placeholder */}
                                <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-lemon flex items-center justify-center text-slate-900">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-brand-lemon uppercase tracking-widest">Delivery Hero</p>
                                            <p className="text-xs font-bold">Kojo Mensah (FLA-992)</p>
                                        </div>
                                    </div>
                                    <button className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold hover:bg-white/20 transition-all">
                                        Call Driver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
