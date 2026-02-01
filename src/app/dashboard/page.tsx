"use client";
import React, { useState } from 'react';
import {
    LayoutDashboard, ShoppingBag, Heart, Bell, User,
    HelpCircle, LogOut, Package, Clock, CheckCircle2,
    Wallet, ChevronRight, MessageSquare, ShieldAlert,
    Search, Menu, X, ArrowRight, Star
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';

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
    const { user, logout } = useAuth();
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

    // Profile States
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [profilePhone, setProfilePhone] = useState('+233 24 000 0000');
    const [profileCity, setProfileCity] = useState('Accra');
    const [profileAddress, setProfileAddress] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
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

    const handleUpdateProfile = () => {
        // In a real app, you'd call an API here
        Swal.fire({
            icon: 'success',
            title: 'Profile Updated',
            text: 'Your information has been successfully saved.',
            customClass: {
                popup: 'rounded-[32px]',
                confirmButton: 'bg-slate-900 rounded-full px-8 py-3'
            }
        });
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'SAD TO SEE YOU GO! 👋',
            text: "Are you sure you want to end your fashion session?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0F172A',
            cancelButtonColor: '#f8fafc',
            confirmButtonText: 'YES, LOGOUT',
            cancelButtonText: 'CANCEL',
            customClass: {
                popup: 'rounded-[40px] border-none shadow-2xl p-12',
                title: 'text-2xl font-black text-slate-900 tracking-tighter',
                htmlContainer: 'text-sm text-slate-500 font-medium pb-4',
                confirmButton: 'rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20',
                cancelButton: 'rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                router.push('/');
            }
        });
    };

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'help', label: 'Help Center', icon: HelpCircle },
    ];

    const stats = [
        { label: 'Active Orders', value: '2', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', section: 'orders', filter: 'Active' },
        { label: 'Pending Deliveries', value: '1', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', section: 'orders', filter: 'Active' },
        { label: 'Completed', value: '12', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', section: 'orders', filter: 'Completed' },
        { label: 'Wallet Balance', value: 'GH₵ 1,250', icon: Wallet, color: 'text-slate-900', bg: 'bg-brand-lemon/20', border: 'border-brand-lemon/30', section: 'home', filter: 'All' },
    ];

    const recentOrders = [
        { id: 'FLA-8821', name: 'Tribal Print Shirt', status: 'Processing', vendor: 'Signature Print', price: '850', image: '/product-1.jpg' },
        { id: 'FLA-8794', name: 'Abstract Circle Dress', status: 'Shipped', vendor: 'FLA Bespoke', price: '1,200', image: '/product-3.png' },
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
                            {stats.map((stat, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setActiveSection(stat.section as DashboardSection);
                                        setOrderFilter(stat.filter);
                                    }}
                                    className={`p-5 rounded-[24px] border ${stat.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative text-left w-full active:scale-95`}
                                >
                                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                </button>
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
                                    {recentOrders.map((order, i) => (
                                        <div key={i} className={`p-5 flex items-center gap-4 ${i !== recentOrders.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                            <div className="relative w-16 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                                                <Image src={order.image} alt={order.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{order.id}</p>
                                                <h3 className="font-bold text-slate-900 truncate">{order.name}</h3>
                                                <p className="text-xs text-slate-500">{order.vendor}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'Processing' ? 'bg-blue-50 text-blue-600' : 'bg-brand-lemon text-slate-900'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                                <p className="font-sans font-black text-slate-900">GH₵{order.price}</p>
                                                <div className="flex items-center gap-2">
                                                    {order.status === 'Shipped' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRatingOrder({ id: order.id, name: order.name });
                                                            }}
                                                            className="text-[9px] font-black text-brand-lemon uppercase tracking-widest hover:underline"
                                                        >
                                                            Rate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendOrderToWhatsApp(order);
                                                        }}
                                                        className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        title="Send to WhatsApp"
                                                    >
                                                        <WhatsAppIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">My Orders</h1>
                                <p className="text-slate-500 text-sm mt-1">Manage and track your fashion orders.</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-full overflow-x-auto no-scrollbar max-w-full">
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
                            <div className="overflow-x-auto">
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
                                        {[1, 2, 3, 4]
                                            .map(i => ({
                                                id: i,
                                                status: i % 2 === 0 ? 'Delivered' : 'In Printing',
                                                isCompleted: i % 2 === 0
                                            }))
                                            .filter(order => {
                                                if (orderFilter === 'All') return true;
                                                if (orderFilter === 'Active') return !order.isCompleted;
                                                if (orderFilter === 'Completed') return order.isCompleted;
                                                return true;
                                            })
                                            .map((order) => {
                                                const i = order.id;
                                                return (
                                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative w-12 h-14 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                                                    <Image
                                                                        src={i % 2 === 0 ? `/product-${(i % 2) + 1}.jpg` : `/product-${(i % 3) + 3}.png`}
                                                                        alt="p"
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">#FLA-882{i}</p>
                                                                    <p className="font-bold text-slate-900 text-sm">Signature Print Shirt {i}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-sm text-slate-600 font-bold">FLA Bespoke</td>
                                                        <td className="px-8 py-6 font-sans font-black text-slate-900">GH₵ 750</td>
                                                        <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                                                            {order.isCompleted && (
                                                                <button
                                                                    onClick={() => setRatingOrder({ id: i, name: `Signature Print Shirt ${i}` })}
                                                                    className="px-6 py-2 bg-brand-lemon text-slate-900 rounded-full text-[9px] font-bold uppercase tracking-widest hover:shadow-lg transition-all"
                                                                >
                                                                    Rate Design
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setTrackingOrder({
                                                                    id: `#FLA-882${i}`,
                                                                    name: `Signature Print Shirt ${i}`,
                                                                    status: order.status,
                                                                    step: order.isCompleted ? 5 : 2,
                                                                    price: '750',
                                                                    image: i % 2 === 0 ? `/product-${(i % 2) + 1}.jpg` : `/product-${(i % 3) + 3}.png`
                                                                })}
                                                                className="px-6 py-2 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                            >
                                                                Track
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendOrderToWhatsApp({ id: `#FLA-882${i}`, name: `Signature Print Shirt ${i}`, price: '750', status: order.status })}
                                                                className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-md group"
                                                                title="Send Order to WhatsApp"
                                                            >
                                                                <WhatsAppIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
                                    className="px-10 py-4 bg-slate-900 text-white rounded-full font-bold text-sm tracking-wide hover:shadow-2xl transition-all shadow-slate-900/20 active:scale-95"
                                >
                                    Save Profile Changes
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
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white p-4 rounded-[32px] border border-slate-100 group">
                                    <div className="relative aspect-[3/4] bg-slate-50 rounded-[24px] overflow-hidden mb-4">
                                        <Image
                                            src={i === 1 ? `/product-2.jpg` : `/product-4.png`}
                                            alt="p"
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm">
                                            <Heart className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm truncate px-1">Geometric Print Set</h3>
                                    <p className="text-xs font-black text-slate-900 mt-1 px-1">GH₵ 750</p>
                                    <button className="w-full mt-4 py-2 bg-slate-50 text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-lemon transition-colors">
                                        Add to Bag
                                    </button>
                                </div>
                            ))}
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
                            {[
                                { title: 'Order Dispatched!', msg: 'Your Tribal Print Shirt is on its way to your location.', time: '2 mins ago', icon: Package, new: true },
                                { title: 'Payment Confirmed', msg: 'Escrow payment for Order #FLA-8821 was successful.', time: '1 hour ago', icon: CheckCircle2, new: false },
                                { title: 'New Message', msg: 'Vendor "Signature Print" sent you a message about your design.', time: '3 hours ago', icon: MessageSquare, new: false },
                            ].map((n, i) => (
                                <div key={i} className={`p-5 rounded-[24px] flex gap-4 items-start transition-all border ${n.new ? 'bg-white border-brand-lemon shadow-md' : 'bg-white border-slate-100 shadow-sm opacity-70'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.new ? 'bg-brand-lemon text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                                        <n.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold transition-colors ${n.new ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</h3>
                                            <span className="text-[9px] font-black text-slate-300 uppercase shrink-0 ml-2">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">{n.msg}</p>
                                    </div>
                                </div>
                            ))}
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
                        <div className="p-8 border-t border-slate-50">
                            <button onClick={handleLogout} className="flex items-center gap-4 text-xs font-bold text-red-500 hover:translate-x-1 transition-transform">
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

                <div className="p-10 border-t border-slate-50">
                    <button onClick={handleLogout} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:translate-x-1 transition-transform active:scale-95">
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Dashboard Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full z-[80] bg-white/95 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 mt-9">
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

                <div className="p-6 md:p-12 pt-36 md:pt-12 pb-24 w-full max-w-[95%] mx-auto min-h-full">
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
                                        <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20">
                                            <option>Order #FLA-8821 - Tribal Print Shirt</option>
                                            <option>Order #FLA-8794 - Abstract Circle Dress</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Problem Category</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Wrong Sizing', 'Print Quality', 'Late Delivery', 'Fabric Issue'].map(c => (
                                                <button key={c} className="py-3 px-4 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:border-brand-lemon hover:text-slate-900 transition-all text-left">
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence / Description</label>
                                        <textarea rows={4} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none" placeholder="Describe the issue in detail..." />
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button onClick={() => setShowDisputeForm(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-full font-bold text-xs uppercase tracking-widest">Cancel</button>
                                    <button
                                        onClick={() => {
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Case Submitted',
                                                text: 'Your dispute has been logged. Our mediators will contact you within 24 hours.',
                                                customClass: { popup: 'rounded-[32px]' }
                                            });
                                            setShowDisputeForm(false);
                                        }}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                                    >
                                        Submit Dispute Case
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
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Order {trackingOrder.id}</h2>
                                </div>
                                <button onClick={() => setTrackingOrder(null)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                {/* Order Summary Mini */}
                                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-[24px]">
                                    <div className="relative w-16 h-20 rounded-xl overflow-hidden shadow-sm">
                                        <Image src={trackingOrder.image} alt="p" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{trackingOrder.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium">Bespoke Production • GH₵ {trackingOrder.price}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-[10px] font-black text-brand-lemon uppercase tracking-wider">Estimated Delivery</p>
                                        <p className="text-sm font-black text-slate-900">Tomorrow, 4PM</p>
                                    </div>
                                </div>

                                {/* Tracking Stepper */}
                                <div className="relative space-y-6 pl-2">
                                    <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                    {[
                                        { title: 'Order Placed', time: 'Oct 24, 09:12 AM', desc: 'Your fashion request has been received.', done: trackingOrder.step >= 1 },
                                        { title: 'In Printing', time: 'Oct 25, 02:30 PM', desc: 'Custom design is being applied to fabric.', done: trackingOrder.step >= 2 },
                                        { title: 'Quality Assurance', time: 'Pending', desc: 'Stylists are checking tailoring excellence.', done: trackingOrder.step >= 3 },
                                        { title: 'Shipped via FLA Logistics', time: 'Pending', desc: 'Pickup scheduled by our delivery partner.', done: trackingOrder.step >= 4 },
                                        { title: 'Delivered', time: 'Pending', desc: 'Package handed over to recipient.', done: trackingOrder.step >= 5 },
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
