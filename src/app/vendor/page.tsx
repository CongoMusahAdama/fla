"use client";
import React, { useState } from 'react';
import {
    LayoutDashboard, Package, ShoppingBag, Wallet, Star,
    Bell, User, HelpCircle, LogOut, Plus, Search,
    Menu, X, ChevronRight, ArrowUpRight, TrendingUp,
    Clock, CheckCircle2, ShieldAlert, MessageSquare,
    Image as ImageIcon, Edit2, Trash2, Camera, UploadCloud
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';

// Reuse the WhatsApp Icon from customer dashboard
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.502-5.485-1.454l-.394-.227-4.078 1.07 1.089-3.975-.249-.396A9.816 9.816 0 011.942 12.07C1.942 6.656 6.355 2.24 11.77 2.24s9.829 4.417 9.829 9.831c0 5.414-4.417 9.831-9.83 9.831m11.834-11.83c0-6.521-5.303-11.825-11.825-11.825C5.461 0 0 5.461 0 11.825c0 2.083.54 4.117 1.571 5.905L0 24l6.446-1.691c1.71 1.017 3.65 1.554 5.62 1.554 6.523 0 11.825-5.303 11.825-11.825" />
    </svg>
);

type VendorSection = 'dashboard' | 'products' | 'orders' | 'wallet' | 'reviews' | 'notifications' | 'settings';

interface Product {
    id: number;
    name: string;
    price: string;
    image: string;
    images?: { url: string, label: string }[];
    status: string;
    sales: number;
    quantity: number;
    tailoringTime: string;
    fabrication: string;
}

export default function VendorDashboard() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<VendorSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);

    React.useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/auth');
        }
    }, [isAuthenticated, user, router]);

    const [vendorProducts, setVendorProducts] = useState<Product[]>([
        { id: 1, name: 'Tribal Heritage T-Shirt', price: '750', image: '/product-1.jpg', status: 'In Stock', sales: 45, quantity: 50, tailoringTime: '2 Days', fabrication: '100% Cotton', images: [{ url: '/product-1.jpg', label: 'Front' }] },
        { id: 2, name: 'Artistic Mesh Shirt', price: '850', image: '/product-2.jpg', status: 'In Stock', sales: 32, quantity: 40, tailoringTime: '3 Days', fabrication: 'Silk Mesh', images: [{ url: '/product-2.jpg', label: 'Front' }] },
        { id: 3, name: 'Signature Print Hoodie', price: '1,250', image: '/product-3.png', status: 'Low Stock', sales: 18, quantity: 5, tailoringTime: '5 Days', fabrication: 'Heavy Fleece', images: [{ url: '/product-3.png', label: 'Front' }] },
        { id: 4, name: 'Bespoke Print Cap', price: '450', image: '/product-4.png', status: 'In Stock', sales: 56, quantity: 100, tailoringTime: '1 Day', fabrication: 'Canvas', images: [{ url: '/product-4.png', label: 'Front' }] },
        { id: 5, name: 'Vibrant Pattern Tee', price: '650', image: '/product-5.png', status: 'In Stock', sales: 29, quantity: 60, tailoringTime: '2 Days', fabrication: 'Cotton', images: [{ url: '/product-5.png', label: 'Front' }] },
    ]);

    // Form States for Add/Edit
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formCategory, setFormCategory] = useState('T-Shirt');
    const [formQuantity, setFormQuantity] = useState('');
    const [formTailoring, setFormTailoring] = useState('');
    const [formFabric, setFormFabric] = useState('');
    const [formNarrative, setFormNarrative] = useState('');
    const [formImages, setFormImages] = useState<{ url: string, label: string }[]>([]);

    const handleLogout = () => {
        Swal.fire({
            title: 'SAD TO SEE YOU GO! 👋',
            text: "Are you sure you want to end your vendor session?",
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
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'settings', label: 'Store Settings', icon: User },
    ];

    const stats = [
        { label: 'Total Orders', value: '154', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', trend: '+12.5%' },
        { label: 'Pending Orders', value: '12', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', trend: 'Active' },
        { label: 'Completed', value: '142', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', trend: '98% Success' },
        { label: 'Wallet Balance', value: 'GH₵ 8,450', icon: Wallet, color: 'text-slate-900', bg: 'bg-brand-lemon/20', border: 'border-brand-lemon/30' },
    ];

    if (!user || user.role !== 'vendor') return null;

    const resetForm = () => {
        setFormName('');
        setFormPrice('');
        setFormCategory('T-Shirt');
        setFormQuantity('');
        setFormTailoring('');
        setFormFabric('');
        setFormNarrative('');
        setFormImages([]);
        setEditingProduct(null);
    };

    const handleAddOrEditProduct = () => {
        if (!formName || !formPrice) {
            Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Please fill in the name and price.' });
            return;
        }

        if (editingProduct) {
            setVendorProducts(prev => prev.map(p => p.id === editingProduct.id ? {
                ...p,
                name: formName,
                price: formPrice,
                quantity: parseInt(formQuantity) || 0,
                status: parseInt(formQuantity) < 10 ? 'Low Stock' : 'In Stock',
                tailoringTime: formTailoring,
                fabrication: formFabric,
                images: formImages
            } : p));
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'Your design has been refined.' });
        } else {
            const newProd = {
                id: Date.now(),
                name: formName,
                price: formPrice,
                image: formImages.length > 0 ? formImages[0].url : '/product-1.jpg',
                images: formImages,
                status: parseInt(formQuantity) < 10 ? 'Low Stock' : 'In Stock',
                sales: 0,
                quantity: parseInt(formQuantity) || 0,
                tailoringTime: formTailoring,
                fabrication: formFabric
            };
            setVendorProducts(prev => [newProd, ...prev]);
            Swal.fire({ icon: 'success', title: 'Published!', text: 'Your new design is now live.' });
        }
        setShowAddProduct(false);
        resetForm();
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormPrice(product.price);
        setFormQuantity(product.quantity?.toString() || '');
        setFormTailoring(product.tailoringTime || '');
        setFormFabric(product.fabrication || '');
        setFormImages(product.images || [{ url: product.image, label: 'Front' }]);
        setShowAddProduct(true);
    };

    const handleDeleteProduct = (id: number) => {
        Swal.fire({
            title: 'Delete Design?',
            text: "This will permanently remove this item from the store.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'YES, DELETE'
        }).then((result) => {
            if (result.isConfirmed) {
                setVendorProducts(prev => prev.filter(p => p.id !== id));
                Swal.fire('Deleted!', 'The design has been removed.', 'success');
            }
        });
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 md:pt-0">
                        {/* Welcome Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-xl md:text-3xl font-black text-slate-900">Vendor Hub: {user?.name || 'Signature Print'} ⚡</h1>
                                <p className="text-slate-400 text-xs md:text-sm mt-0.5">Grow your fashion empire with FLA Logistics.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddProduct(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Add Product
                                </button>
                                <button onClick={() => setActiveSection('wallet')} className="flex items-center gap-2 px-6 py-3 bg-brand-lemon text-slate-900 rounded-full text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
                                    <TrendingUp className="w-4 h-4" /> Withdraw
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {stats.map((stat, i) => (
                                <div key={i} className={`p-4 md:p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all group overflow-hidden relative`}>
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className={`w-9 h-9 md:w-10 md:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center relative z-10`}>
                                            <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        {stat.trend && (
                                            <span className="text-[9px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {stat.trend}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-lg md:text-xl font-black text-slate-900 mt-0.5 md:mt-1">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Secondary Content */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Recent Sales</h2>
                                    <button onClick={() => setActiveSection('orders')} className="text-xs font-bold text-slate-400 hover:text-slate-900">View All Orders</button>
                                </div>
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    {vendorProducts.slice(0, 3).map((product, i) => (
                                        <div key={product.id} className={`p-6 flex items-center gap-5 ${i !== 2 ? 'border-b border-slate-50' : ''}`}>
                                            <div className="w-12 h-14 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                                                <Image src={product.image} alt={product.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>
                                                <p className="text-[10px] text-slate-400 uppercase font-black">Ordered by Customer • #{1023 + i}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">GH₵ {product.price}</p>
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Processing</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Wallet Snapshot</h2>
                                <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lemon/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-lemon/20 transition-colors" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Escrow (Pending)</p>
                                        <h3 className="text-3xl font-black text-brand-lemon">GH₵ 4,250</h3>
                                    </div>
                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available for Withdrawal</p>
                                        <h3 className="text-xl font-black text-white">GH₵ 4,200</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            Swal.fire({
                                                title: 'Request Payout',
                                                text: 'Proceed with withdrawal of available GH₵ 4,200 to your MoMo?',
                                                icon: 'question',
                                                showCancelButton: true,
                                                confirmButtonText: 'Yes, Payout',
                                                confirmButtonColor: '#0F172A',
                                                customClass: { popup: 'rounded-[32px]' }
                                            }).then(r => {
                                                if (r.isConfirmed) {
                                                    Swal.fire({ icon: 'success', title: 'Payout Initiated', text: 'Processing your request.', customClass: { popup: 'rounded-[32px]' } });
                                                }
                                            });
                                        }}
                                        className="w-full py-4 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-lemon transition-colors active:scale-95 mt-4"
                                    >
                                        Request Payout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Product Catalog</h1>
                                <p className="text-slate-500 text-sm mt-1">Manage your design inventory and prices.</p>
                            </div>
                            <button onClick={() => { resetForm(); setShowAddProduct(true); }} className="px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                                <Plus className="w-4 h-4" /> New Design
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {vendorProducts.map((product) => (
                                <div key={product.id} className="bg-white rounded-[32px] border border-slate-100 p-4 group hover:shadow-xl transition-all">
                                    <div className="relative aspect-[3/4] bg-slate-50 rounded-[24px] overflow-hidden mb-4">
                                        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                        {product.images && product.images.length > 1 && (
                                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-sm">
                                                <ImageIcon className="w-2.5 h-2.5 text-slate-400" />
                                                <span className="text-[8px] font-black text-slate-900">{product.images.length} Perspectives</span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <button onClick={() => openEditModal(product)} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-lemon">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteProduct(product.id)} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm truncate">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-black text-slate-900">GH₵ {product.price}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${product.status === 'Low Stock' ? 'text-orange-500 bg-orange-50' : 'text-emerald-500 bg-emerald-50'}`}>
                                            {product.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Order Management</h1>
                            <p className="text-slate-500 text-sm mt-1">Track and update customer fashion requests.</p>
                        </div>
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Design</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 font-black text-slate-900 text-xs">#ORD-202{i}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">Customer Name</p>
                                                        <p className="text-[10px] text-slate-400 uppercase">Premium Member</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-700 text-sm">Tribal Print Hoodie</td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${i === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {i === 2 ? 'Delivered' : 'Printing'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: 'Update Progress',
                                                            text: 'Move this order to the next stage of fulfillment.',
                                                            icon: 'info',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'MARK AS PACKED',
                                                            confirmButtonColor: '#0F172A',
                                                            customClass: { popup: 'rounded-[32px]' }
                                                        }).then(r => {
                                                            if (r.isConfirmed) {
                                                                Swal.fire({ icon: 'success', title: 'Status Updated', customClass: { popup: 'rounded-[32px]' } });
                                                            }
                                                        });
                                                    }}
                                                    className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                >
                                                    Update Status
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'wallet':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Earnings & Escrow</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage your payouts and revenue streams.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-10 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-lemon/10 rounded-full blur-3xl" />
                                <ShieldAlert className="w-12 h-12 text-brand-lemon mb-8" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Locked in Escrow</p>
                                <h3 className="text-4xl font-black text-brand-lemon mb-10">GH₵ 12,450.00</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm py-3 border-t border-white/5">
                                        <span className="text-slate-400">Available to Withdraw</span>
                                        <span className="font-black text-white">GH₵ 2,150.00</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-3 border-t border-white/5">
                                        <span className="text-slate-400">Processing Withdrawal</span>
                                        <span className="font-black text-white">GH₵ 1,000.00</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 mt-2">
                                        <p className="text-[10px] font-black text-brand-lemon uppercase tracking-widest mb-1">Payout Destination</p>
                                        <p className="text-xs font-bold text-white uppercase">{user?.accountName || 'Primary Account'}</p>
                                        <p className="text-sm font-black text-white tracking-widest">{user?.momoNumber || 'No Number Linked'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        Swal.fire({
                                            title: 'Request Withdrawal',
                                            text: `Withdraw available GH₵ 2,150.00 to ${user?.momoNumber || 'your MoMo number'}?`,
                                            icon: 'question',
                                            showCancelButton: true,
                                            confirmButtonText: 'Confirm Withdrawal',
                                            confirmButtonColor: '#0f172a',
                                            customClass: { popup: 'rounded-[32px]' }
                                        }).then((result) => {
                                            if (result.isConfirmed) {
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Request Sent',
                                                    text: 'Your funds will be transferred within 24 hours.',
                                                    customClass: { popup: 'rounded-[32px]' }
                                                });
                                            }
                                        });
                                    }}
                                    className="w-full mt-10 py-5 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-lemon transition-all active:scale-95 shadow-xl shadow-white/5"
                                >
                                    Withdraw to Mobile Money
                                </button>
                            </div>
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Withdrawal History</h3>
                                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-6 flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">GH₵ 1,500.00</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black">Success • Oct {20 + i}, 2024</p>
                                            </div>
                                            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'reviews':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Customer Feedback</h1>
                            <p className="text-slate-500 text-sm mt-1">What your fans are saying about your bespoke designs.</p>
                        </div>
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-brand-lemon fill-current" />)}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-sm">Jamie Mensah</h4>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Oct {15 + i}, 2024 • Tribal Print Tee</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">"The quality of the print is insane honestly. The fabric is thick but breathable. Definitely buying my next set from Signature Print! Fast delivery too."</p>
                                    <div className="pt-4 flex gap-3">
                                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Reply to Review</button>
                                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Feature on Profile</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Store Profile</h1>
                            <p className="text-slate-500 text-sm mt-1">Customize how customers see your fashion brand.</p>
                        </div>
                        <div className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-12 space-y-10">
                            {/* Banner Upload */}
                            <div className="relative h-48 bg-slate-100 rounded-[32px] overflow-hidden group border border-slate-100">
                                <UploadCloud className="w-12 h-12 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Change Banner</p>
                                </div>
                            </div>

                            <div className="flex items-end gap-6 -mt-20 relative px-6">
                                <div className="w-32 h-32 rounded-[32px] bg-white p-2 shadow-2xl">
                                    <div className="w-full h-full bg-slate-900 rounded-[24px] flex items-center justify-center text-white relative group overflow-hidden">
                                        <ImageIcon className="w-8 h-8 text-white/20 group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pb-2">
                                    <h3 className="text-xl font-black text-slate-900 uppercase">{user?.shopName || 'Your Brand'}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Premium Vendor Since 2024</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 pt-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Brand Name</label>
                                    <input type="text" defaultValue={user?.shopName} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                    <input type="text" defaultValue={user?.phone} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MoMo Payout Number</label>
                                    <input type="text" defaultValue={user?.momoNumber} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MoMo Account Name</label>
                                    <input type="text" defaultValue={user?.accountName} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Studio Address</label>
                                    <input type="text" defaultValue={user?.location || 'Accra, Ghana'} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Bio</label>
                                    <textarea rows={4} defaultValue="Bespoke fashion partner in the FLA Logistics network." className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none" />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Store Updated',
                                        text: 'Your brand profile has been synchronized with the marketplace.',
                                        icon: 'success',
                                        timer: 2000,
                                        showConfirmButton: false,
                                        customClass: { popup: 'rounded-[32px]' }
                                    });
                                }}
                                className="w-full mt-4 py-5 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-lemon hover:text-slate-900 transition-all active:scale-95"
                            >
                                Save Store Information
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Alert Center</h1>
                            <p className="text-slate-500 text-sm mt-1">Stay updated with your sales and system alerts.</p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: 'New Sale! 🔥', msg: 'Order #ORD-2025 was just placed for GH₵ 750.', time: 'Just Now', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
                                { title: 'Payment Released', msg: 'Escrow GH₵ 1,500 has been moved to your available balance.', time: '2 hours ago', icon: Wallet, color: 'bg-brand-lemon text-slate-900' },
                                { title: 'Product Low Stock', msg: 'Signature Print Hoodie (Size L) only has 2 items left.', time: '5 hours ago', icon: Package, color: 'bg-blue-50 text-blue-600' },
                            ].map((n, i) => (
                                <div key={i} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex gap-5 items-start hover:shadow-md transition-shadow">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                                        <n.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">{n.title}</h3>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.msg}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <main className="min-h-screen bg-[#FDFFFD] flex flex-col md:flex-row">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-[280px] bg-white border-r border-slate-50 flex-col h-screen sticky top-0 z-[250]">
                <div className="p-10 pb-16 flex items-center justify-between">
                    <span className="font-heading font-black text-3xl tracking-tighter text-slate-900 uppercase">FLA Vendor.</span>
                </div>

                <nav className="flex-1 px-6 space-y-2">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as VendorSection)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap group ${activeSection === item.id
                                ? 'bg-slate-900 text-brand-lemon shadow-xl shadow-slate-900/10'
                                : 'text-slate-400 hover:text-slate-900'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 transition-transform ${activeSection === item.id ? 'scale-110' : 'group-hover:translate-x-1'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-8 m-6 rounded-[32px] bg-emerald-50 group border border-emerald-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                            <Package className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">VERIFIED</span>
                    </div>
                    <p className="text-xs font-black text-slate-900 leading-tight">Master Artisan<br />Studio Partner</p>
                    <button className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Seller Guide</button>
                </div>

                <div className="p-10 border-t border-slate-50">
                    <button onClick={handleLogout} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:translate-x-1 transition-transform active:scale-95">
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Sidebar Overlay Mobile */}
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className={`absolute top-0 left-0 w-[80%] h-full bg-white transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-8 pb-12 flex justify-between items-center bg-white">
                            <span className="font-heading font-black text-2xl tracking-tighter text-slate-900 uppercase">FLA Vendor.</span>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="flex-1 px-4 space-y-2">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveSection(item.id as VendorSection);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${activeSection === item.id
                                        ? 'bg-slate-900 text-brand-lemon shadow-xl'
                                        : 'text-slate-400'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div className="p-8 border-t border-slate-50">
                            <button onClick={handleLogout} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-red-500">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden flex sticky top-0 z-[200] bg-white/95 backdrop-blur-md px-6 py-3 items-center justify-between border-b border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-900">
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="font-heading font-black text-lg tracking-tighter text-slate-900 uppercase">FLA.</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white border-2 border-brand-lemon shadow-lg">
                            <User className="w-4 h-4" />
                        </div>
                    </div>
                </header>

                {/* Desktop Top Bar */}
                <header className="hidden md:flex sticky top-0 z-50 bg-[#FDFDFF]/80 backdrop-blur-md px-10 py-6 items-center justify-between border-b border-slate-100/50">
                    <div className="relative w-96 max-w-sm">
                        <input type="text" placeholder="Search orders, products, help..." className="w-full bg-white py-3 pl-12 pr-6 rounded-full border border-slate-100 text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all shadow-sm" />
                        <Search className="w-4 h-4 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-4 text-right">
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{user?.name || 'Signature Print'}</p>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Master Vendor</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white border-2 border-brand-lemon shadow-xl overflow-hidden relative group">
                            <ImageIcon className="w-5 h-5 opacity-40" />
                            <div className="absolute inset-0 bg-brand-lemon/10 group-hover:bg-transparent transition-colors" />
                        </div>
                    </div>
                </header>

                <div className="px-6 pt-28 md:pt-12 md:px-12 pb-24 w-full max-w-[95%] mx-auto">
                    {renderContent()}
                </div>

                {/* Add Product Modal */}
                {showAddProduct && (
                    <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setShowAddProduct(false); resetForm(); }} />
                        <div className="relative bg-white w-full max-w-2xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-510 overflow-hidden">
                            <div className="shrink-0 p-8 md:p-10 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{editingProduct ? 'Refine Heritage' : 'Stock Management'}</p>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">{editingProduct ? 'Edit Design' : 'List New Design'}</h2>
                                </div>
                                <button onClick={() => { setShowAddProduct(false); resetForm(); }} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
                                <div className="grid lg:grid-cols-2 gap-10">
                                    {/* Multi-Image Upload Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Design Perspectives</label>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{formImages.length}/3 Uploaded</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {formImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-[3/4] rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden group">
                                                    <Image src={img.url} alt={`Preview ${idx}`} fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                                        <select
                                                            value={img.label}
                                                            onChange={(e) => {
                                                                const newImgs = [...formImages];
                                                                newImgs[idx].label = e.target.value;
                                                                setFormImages(newImgs);
                                                            }}
                                                            className="bg-white/20 backdrop-blur-md border-none text-[10px] text-white font-black uppercase tracking-widest rounded-full py-1.5 px-4 focus:ring-0 mb-2 cursor-pointer"
                                                        >
                                                            <option className="text-slate-900" value="Front">Front</option>
                                                            <option className="text-slate-900" value="Back">Back</option>
                                                            <option className="text-slate-900" value="Side">Side</option>
                                                        </select>
                                                        <button
                                                            onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="p-2 bg-red-500/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                                                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-tighter">{img.label} View</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {formImages.length < 3 && (
                                                <label className="aspect-[3/4] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 group cursor-pointer hover:border-brand-lemon hover:bg-brand-lemon/5 transition-all">
                                                    <UploadCloud className="w-8 h-8 text-slate-200 group-hover:text-brand-lemon transition-colors mb-3" />
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Add Image</p>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                // In a real app, upload to storage. For demo, create URL.
                                                                const url = URL.createObjectURL(file);
                                                                setFormImages(prev => [...prev, { url, label: 'Front' }]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-slate-300 font-bold leading-relaxed">Most vendors upload Front, Back, and a Detail shot for best customer engagement.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                                            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Signature Tribal Hoodie" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all shadow-sm" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (GH₵)</label>
                                                <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="750" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20">
                                                    <option>T-Shirt</option>
                                                    <option>Hoodie</option>
                                                    <option>Cape</option>
                                                    <option>Bespoke</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                                <input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="50" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tailoring Time</label>
                                                <input type="text" value={formTailoring} onChange={(e) => setFormTailoring(e.target.value)} placeholder="e.g. 3 Days" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fabrication</label>
                                            <input type="text" value={formFabric} onChange={(e) => setFormFabric(e.target.value)} placeholder="e.g. 100% Cotton Print" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">The Narrative (Description)</label>
                                            <textarea rows={2} value={formNarrative} onChange={(e) => setFormNarrative(e.target.value)} placeholder="Story behind this design..." className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Silhouettes</label>
                                            <div className="flex gap-2">
                                                {['S', 'M', 'L', 'XL'].map(s => (
                                                    <button key={s} className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 hover:bg-slate-900 hover:text-white transition-all">{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer for Mobile Actions */}
                                <div className="mt-12 flex gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm pt-4 border-t border-slate-50">
                                    <button onClick={() => { setShowAddProduct(false); resetForm(); }} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-full font-black text-[10px] uppercase tracking-widest">Discard</button>
                                    <button
                                        onClick={handleAddOrEditProduct}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                                    >
                                        {editingProduct ? 'Save Changes' : 'Live in Store'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Bottom Action Bar */}
                <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-max">
                    <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex gap-1 items-center">
                        {sidebarItems.slice(0, 4).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id as VendorSection)}
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
