"use client";
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, ShoppingBag, Wallet, Star,
    Bell, User, HelpCircle, LogOut, Plus, Search,
    Menu, X, ChevronRight, ArrowUpRight, TrendingUp,
    Clock, CheckCircle2, ShieldAlert, MessageSquare,
    Image as ImageIcon, Edit2, Trash2, Camera, UploadCloud,
    Eye, EyeOff, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';

// Reuse the WhatsApp Icon from customer dashboard
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.502-5.485-1.454l-.394-.227-4.078 1.07 1.089-3.975-.249-.396A9.816 9.816 0 011.942 12.07C1.942 6.656 6.355 2.24 11.77 2.24s9.829 4.417 9.829 9.831c0 5.414-4.417 9.831-9.83 9.831m11.834-11.83c0-6.521-5.303-11.825-11.825-11.825C5.461 0 0 5.461 0 11.825c0 2.083.54 4.117 1.571 5.905L0 24l6.446-1.691c1.71 1.017 3.65 1.554 5.62 1.554 6.523 0 11.825-5.303 11.825-11.825" />
    </svg>
);

type VendorSection = 'dashboard' | 'products' | 'orders' | 'wallet' | 'reviews' | 'notifications' | 'settings';

interface Product {
    id: any;
    name: string;
    price: string;
    image: string;
    images?: { url: string, label: string }[];
    status: string;
    sales: number;
    quantity: number;
    tailoringTime: string;
    fabrication: string;
    description: string;
    category: string;
    imageLabels?: string[];
    sizes?: string[];
    isActive?: boolean;
}

export default function VendorDashboard() {
    const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<VendorSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [vendorOrders, setVendorOrders] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Hydration check
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const getImageUrl = (url: string) => {
        if (!url || url === '/product-1.jpg') return '/product-1.jpg';
        if (url.startsWith('http') || url.startsWith('data:')) return url;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBase.replace('/api', '');

        // Backend uploads
        if (url.startsWith('/uploads')) {
            return `${baseUrl}${url}`;
        }

        // Frontend static assets
        if (url.startsWith('/')) return url;

        return `${baseUrl}/uploads/${url}`;
    };


    // Profile States
    const [shopName, setShopName] = useState(user?.shopName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [momoNumber, setMomoNumber] = useState(user?.momoNumber || '');
    const [accountName, setAccountName] = useState(user?.accountName || '');
    const [location, setLocation] = useState(user?.location || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [bannerImage, setBannerImage] = useState(user?.bannerImage || '');

    useEffect(() => {
        if (user) {
            setShopName(user.shopName || '');
            setPhone(user.phone || '');
            setMomoNumber(user.momoNumber || '');
            setAccountName(user.accountName || '');
            setLocation(user.location || '');
            setBio(user.bio || '');
            setProfileImage(user.profileImage || '');
            setBannerImage(user.bannerImage || '');
        }
    }, [user]);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/auth');
            return;
        }

        const fetchVendorData = async () => {
            try {
                const token = localStorage.getItem('fla_token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                const [statsRes, productsRes, ordersRes, notificationsRes, withdrawalRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/dashboard/vendor/stats`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?vendorId=${user.id}`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/vendor-orders`, { headers }), // Need to implement this endpoint or use query
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/notifications/my-notifications`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payments/withdrawals/my-history`, { headers })
                ]);



                if (statsRes.ok) setDashboardData(await statsRes.json());
                if (productsRes.ok) {
                    const prods = await productsRes.json();
                    setVendorProducts(prods.map((p: any) => ({
                        id: p._id,
                        name: p.name,
                        price: p.price.toString(),
                        image: p.images?.[0] || '/product-1.jpg',
                        images: p.images?.map((img: string, idx: number) => ({
                            url: img,
                            label: p.imageLabels?.[idx] || 'Product'
                        })) || [],
                        status: p.stock < 10 ? 'Low Stock' : 'In Stock',
                        sales: 0, // Placeholder
                        quantity: p.stock,
                        tailoringTime: p.tailoringTime || '3 Days',
                        fabrication: p.fabrication || 'Cotton',
                        description: p.description || '',
                        category: p.category || 'T-Shirt',
                        imageLabels: p.imageLabels || [],
                        sizes: p.sizes || []
                    })));
                }
                if (ordersRes.ok) setVendorOrders(await ordersRes.json());
                if (notificationsRes.ok) setNotifications(await notificationsRes.json());
                if (withdrawalRes.ok) {
                    const withdrawals = await withdrawalRes.json();
                    setDashboardData((prev: any) => ({ ...prev, withdrawalHistory: withdrawals }));
                }

            } catch (error) {
                console.error('Error fetching vendor data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVendorData();

        // Sync local states
        setShopName(user.shopName || '');
        setPhone(user.phone || '');
        setMomoNumber(user.momoNumber || '');
        setAccountName(user.accountName || '');
        setLocation(user.location || '');
        setBio(user.bio || '');

    }, [isAuthenticated, user, router]);

    const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
    const [formSizes, setFormSizes] = useState<string[]>([]);



    const handleLogout = () => {
        Swal.fire({
            title: 'SAD TO SEE YOU GO! 👋',
            text: "Are you sure you want to end your vendor session?",
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
        { label: 'Total Revenue', value: `GH₵ ${((dashboardData?.totalRevenue || 0) + (dashboardData?.pendingRevenue || 0)).toLocaleString()}`, icon: Wallet, color: 'text-white', bg: 'bg-gradient-to-br from-emerald-500 to-emerald-700', pattern: 'opacity-10', trend: dashboardData?.pendingRevenue > 0 ? `+ GH₵ ${dashboardData.pendingRevenue.toLocaleString()} Pending` : 'Lifetime' },
        { label: 'Active Orders', value: dashboardData?.activeOrders || '0', icon: Clock, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-blue-700', pattern: 'opacity-10' },
        { label: 'Total Sales', value: dashboardData?.totalSales || '0', icon: ShoppingBag, color: 'text-white', bg: 'bg-gradient-to-br from-violet-500 to-violet-700', pattern: 'opacity-10' },
        { label: 'Store Products', value: vendorProducts.length.toString(), icon: Package, color: 'text-white', bg: 'bg-gradient-to-br from-orange-500 to-orange-700', pattern: 'opacity-10' },
    ];

    if (!isHydrated || isLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-lemon rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Studio...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user || (user.role !== 'vendor' && user.role !== 'admin')) {
        return null;
    }

    // Handle Pending Approval State
    if (user.status === 'pending' && user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 md:p-12 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-brand-lemon/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <Clock className="w-12 h-12 text-slate-900" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Studio Verification</h1>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">
                        Welcome to the FLA family, <span className="text-slate-900 font-bold">{user.name}</span>! Our administrators are currently reviewing your studio details to ensure the highest quality of craftsmanship on our platform.
                    </p>
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                            <span className="text-xs font-black text-brand-lemon bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-tighter">Awaiting Approval</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium italic">This usually takes 12-24 hours. You'll receive an email once approved.</p>
                    </div>

                    <div className="mt-12 flex flex-col gap-3">
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                            Sign Out
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-4 bg-white text-slate-500 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Back to Store
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const resetForm = () => {
        setFormName('');
        setFormPrice('');
        setFormCategory('T-Shirt');
        setFormQuantity('');
        setFormTailoring('');
        setFormFabric('');
        setFormNarrative('');
        setFormImages([]);
        setFormSizes([]);
        setEditingProduct(null);
    };

    const handleAddOrEditProduct = async () => {
        if (!formName || !formPrice) {
            Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Please fill in the name and price.' });
            return;
        }

        try {
            const token = localStorage.getItem('fla_token');
            const url = editingProduct
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${editingProduct.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products`;

            const response = await fetch(url, {
                method: editingProduct ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formName,
                    price: parseFloat(formPrice),
                    category: formCategory,
                    stock: parseInt(formQuantity) || 0,
                    description: formNarrative,
                    images: formImages.map(img => img.url),
                    imageLabels: formImages.map(img => img.label),
                    sizes: formSizes,
                    tailoringTime: formTailoring,
                    fabrication: formFabric,
                    vendorId: user?.id,
                    vendorName: user?.shopName,
                    uniqueVendorId: user?.uniqueVendorId
                })
            });

            if (!response.ok) throw new Error('Failed to save product');

            const savedProduct = await response.json();

            if (editingProduct) {
                setVendorProducts(prev => prev.map(p => p.id === editingProduct.id ? {
                    ...p,
                    name: savedProduct.name,
                    price: savedProduct.price.toString(),
                    quantity: savedProduct.stock,
                    category: savedProduct.category,
                    description: savedProduct.description,
                    tailoringTime: savedProduct.tailoringTime,
                    fabrication: savedProduct.fabrication,
                    images: savedProduct.images?.map((img: string, idx: number) => ({
                        url: img,
                        label: savedProduct.imageLabels?.[idx] || 'Product'
                    })) || [],
                    sizes: savedProduct.sizes,
                    status: savedProduct.stock < 10 ? 'Low Stock' : 'In Stock',
                } : p));
                Swal.fire({ icon: 'success', title: 'Updated!', text: 'Your design has been refined.' });
            } else {
                const newProd = {
                    id: savedProduct._id,
                    name: savedProduct.name,
                    price: savedProduct.price.toString(),
                    quantity: savedProduct.stock,
                    category: savedProduct.category,
                    description: savedProduct.description,
                    image: savedProduct.images?.[0] || '/product-1.jpg',
                    images: savedProduct.images?.map((img: string, idx: number) => ({
                        url: img,
                        label: savedProduct.imageLabels?.[idx] || 'Product'
                    })) || [],
                    status: savedProduct.stock < 10 ? 'Low Stock' : 'In Stock',
                    sales: 0,
                    tailoringTime: savedProduct.tailoringTime || '3 Days',
                    fabrication: savedProduct.fabrication || 'Cotton',
                    sizes: savedProduct.sizes
                };
                setVendorProducts(prev => [newProd, ...prev]);
                Swal.fire({ icon: 'success', title: 'Published!', text: 'Your new design is now live.' });
            }
            resetForm();
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    const handleUpdateVendorProfile = async () => {
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopName,
                    phone,
                    momoNumber,
                    accountName,
                    location,
                    bio,
                    profileImage,
                    bannerImage
                })
            });

            if (!response.ok) throw new Error('Failed to update store profile');

            const updatedUser = await response.json();
            updateUser(updatedUser);

            Swal.fire({
                icon: 'success',
                title: 'STORE UPDATED',
                text: 'Your brand profile has been synchronized with the marketplace.',
                confirmButtonText: 'EXCELLENT',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
                }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'UPDATE FAILED', text: error.message });
        }
    };

    const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = localStorage.getItem('fla_token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            if (type === 'avatar') setProfileImage(data.url);
            else setBannerImage(data.url);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Could not upload image.' });
        }
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormPrice(product.price);
        setFormCategory(product.category || 'T-Shirt');
        setFormQuantity(product.quantity?.toString() || '');
        setFormTailoring(product.tailoringTime || '');
        setFormFabric(product.fabrication || '');
        setFormNarrative(product.description || '');
        setFormImages(product.images || [{ url: product.image, label: 'Front' }]);
        setFormSizes(product.sizes || []);
        setShowAddProduct(true);
    };

    const handleWithdrawal = async () => {
        const availableAmount = user?.walletBalance || 0;

        if (availableAmount <= 0) {
            Swal.fire({
                icon: 'info',
                title: 'NO FUNDS AVAILABLE',
                text: 'Your wallet balance is currently zero. Funds appear here once admin approves your completed orders.',
                customClass: { popup: 'rounded-[32px]' }
            });
            return;
        }

        const { value: amount } = await Swal.fire({
            title: 'REQUEST PAYOUT',
            html: `
                <div class="text-left space-y-4">
                    <p class="text-sm text-slate-500 font-medium">Available for immediate transfer: <span class="text-slate-900 font-black font-sans text-lg">GH₵ ${availableAmount.toLocaleString()}</span></p>
                    <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Fee Disclosure</p>
                        <p class="text-xs text-blue-700 font-medium leading-relaxed">A 10% service commission will be deducted from your withdrawal amount at processing.</p>
                    </div>
                </div>
            `,
            input: 'number',
            inputLabel: 'Amount to Withdraw (GH₵)',
            inputPlaceholder: 'Enter amount...',
            inputValue: availableAmount,
            showCancelButton: true,
            confirmButtonText: 'INITIATE PAYOUT',
            cancelButtonText: 'CANCEL',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[40px] p-10 bg-white border-none shadow-2xl',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-5 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all w-full mb-3',
                cancelButton: 'text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all w-full',
                input: 'w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 mt-4 h-14'
            }
        });

        if (amount && parseFloat(amount) > 0) {
            const requestedAmount = parseFloat(amount);
            if (requestedAmount > availableAmount) {
                Swal.fire({ icon: 'error', title: 'INSUFFICIENT FUNDS', text: 'Requested amount exceeds your available balance.' });
                return;
            }

            try {
                const token = localStorage.getItem('fla_token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payments/withdrawals/request`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: requestedAmount,
                        paymentMethod: 'momo',
                        momoNumber: user?.momoNumber,
                        accountName: user?.accountName
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Withdrawal request failed');
                }

                const result = await response.json();

                // Update local user state (deduct from wallet)
                if (user) {
                    updateUser({
                        walletBalance: user.walletBalance ? user.walletBalance - requestedAmount : 0
                    });
                }

                Swal.fire({
                    icon: 'success',
                    title: 'PAYOUT INITIATED',
                    html: `
                        <div class="space-y-4">
                            <p class="text-sm text-slate-500 font-medium">Your request of GH₵ ${requestedAmount.toLocaleString()} has been received.</p>
                            <div class="py-3 px-4 bg-emerald-50 rounded-xl">
                                <p class="text-[10px] font-black text-emerald-600 uppercase">Est. Payout after fees: GH₵ ${(requestedAmount * 0.9).toLocaleString()}</p>
                            </div>
                        </div>
                    `,
                    customClass: { popup: 'rounded-[32px]' }
                });
            } catch (error: any) {
                Swal.fire({ icon: 'error', title: 'REQUEST FAILED', text: error.message });
            }
        }
    };

    const handleDeleteProduct = async (id: any) => {
        Swal.fire({
            title: 'Delete Design?',
            text: "This will permanently remove this item from the store.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'YES, DELETE'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('fla_token');
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) throw new Error('Failed to delete product');

                    setVendorProducts(prev => prev.filter(p => p.id !== id));
                    Swal.fire('Deleted!', 'The design has been removed.', 'success');
                } catch (error: any) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    const handleMarkSoldOut = async (id: any) => {
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stock: 0 })
            });

            if (!response.ok) throw new Error('Failed to update status');

            setVendorProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: 0, status: 'Sold Out' } : p));
            Swal.fire({ icon: 'success', title: 'Sold Out!', text: 'Marketplace updated.' });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    const handleToggleVisibility = async (id: any, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (!response.ok) throw new Error('Failed to update visibility');

            setVendorProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
            Swal.fire({
                icon: 'success',
                title: !currentStatus ? 'Now Visible' : 'Now Hidden',
                text: !currentStatus ? 'Product is now live in the store.' : 'Product is hidden from customers.',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[32px]' }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    const handleVerifyPayment = async (orderId: string) => {
        try {
            const token = localStorage.getItem('fla_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${orderId}/verify-payment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Payment verification failed');

            setVendorOrders(prev => prev.map(o => o._id === orderId ? { ...o, isPaid: true, status: 'payment_verified', paymentVerifiedByVendor: true } : o));
            Swal.fire({ icon: 'success', title: 'Payment Verified', text: 'Order is now confirmed and funds held in escrow.' });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    const handleViewPublicProfile = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/vendor/${user.id}/profile`);
            if (!response.ok) throw new Error('Failed to fetch vendor profile');
            const data = await response.json();
            const { vendor, stats } = data;

            const resolvedProfileImage = getImageUrl(vendor.profileImage);

            Swal.fire({
                html: `
                    <div class="flex flex-col -m-6 overflow-hidden">
                        <!-- Luxury Header -->
                        <div class="bg-slate-900 pt-16 pb-12 px-6 text-center relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                            </div>
                            
                            <div class="relative inline-block mb-4">
                                ${vendor.profileImage
                        ? `<img src="${resolvedProfileImage}" class="w-28 h-28 rounded-[2rem] object-cover border-4 border-[#E5FF7F] shadow-2xl">`
                        : `<div class="w-28 h-28 rounded-[2rem] bg-slate-800 flex items-center justify-center text-[#E5FF7F] border-4 border-slate-700 shadow-2xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                       </div>`
                    }
                                <div class="absolute -bottom-2 -right-2 bg-[#E5FF7F] p-1.5 rounded-xl shadow-lg border-2 border-slate-900">
                                    <svg class="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-center gap-1.5">
                                <h2 class="text-3xl font-black text-white uppercase tracking-tighter">${vendor.shopName || vendor.name}</h2>
                                <span class="bg-brand-lemon/10 text-brand-lemon text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-brand-lemon/20">
                                    ID: ${vendor.uniqueVendorId || 'VND-PENDING'}
                                </span>
                            </div>

                            <div class="flex items-center justify-center gap-1.5 text-[#E5FF7F] text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                ${vendor.location || 'Accra, Ghana'}
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div class="bg-white px-6 py-8 -mt-6 rounded-t-[3.5rem] relative z-10 flex flex-col gap-8">
                            <div class="text-center">
                                <p class="text-slate-500 text-sm font-medium leading-relaxed italic px-4">
                                    "${vendor.bio || "Your studio's narrative is shared here with patrons in the marketplace."}"
                                </p>
                            </div>

                            <!-- Contact Channels -->
                            <div class="flex flex-col gap-4">
                                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Patron Contact Channels</h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <a href="https://wa.me/${vendor.phone}" target="_blank" class="flex items-center justify-center gap-2 bg-emerald-500 text-white p-4 rounded-3xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all text-xs font-black uppercase tracking-widest">
                                        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.502-5.485-1.454l-.394-.227-4.078 1.07 1.089-3.975-.249-.396A9.816 9.816 0 011.942 12.07C1.942 6.656 6.355 2.24 11.77 2.24s9.829 4.417 9.829 9.831c0 5.414-4.417 9.831-9.83 9.831m11.834-11.83c0-6.521-5.303-11.825-11.825-11.825C5.461 0 0 5.461 0 11.825c0 2.083.54 4.117 1.571 5.905L0 24l6.446-1.691c1.71 1.017 3.65 1.554 5.62 1.554 6.523 0 11.825-5.303 11.825-11.825" /></svg>
                                        WhatsApp
                                    </a>
                                    <a href="tel:${vendor.phone}" class="flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-3xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-xs font-black uppercase tracking-widest">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 18.92z"/></svg>
                                        Call
                                    </a>
                                </div>
                                <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                    <div class="flex items-center gap-3 overflow-hidden text-left">
                                        <div class="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                        </div>
                                        <div class="flex flex-col overflow-hidden">
                                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                                            <span class="text-[11px] font-black text-slate-900 truncate">${vendor.email || 'contact@fla.com'}</span>
                                        </div>
                                    </div>
                                    <button onclick="navigator.clipboard.writeText('${vendor.email}')" class="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Performance Grid -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reliability</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl font-black text-slate-900">${vendor.fulfillmentRate || 99}%</span>
                                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping</span>
                                    <span class="text-xl font-black text-slate-900">${vendor.averageTimeToShip || '2-4 Days'}</span>
                                </div>
                            </div>

                            <!-- Stats Row -->
                            <div class="flex items-center justify-between p-2 bg-slate-900 rounded-[2.5rem] text-white">
                                <div class="flex-1 text-center py-4 border-r border-slate-800">
                                    <span class="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Orders</span>
                                    <span class="text-lg font-black">${stats.total || 0}</span>
                                </div>
                                <div class="flex-1 text-center py-4 border-r border-slate-800">
                                    <span class="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Rating</span>
                                    <div class="flex items-center justify-center gap-1">
                                        <span class="text-lg font-black">${vendor.rating || '5.0'}</span>
                                        <svg class="w-3.5 h-3.5 text-[#E5FF7F] fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    </div>
                                </div>
                                <div class="flex-1 text-center py-4">
                                    <span class="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Experience</span>
                                    <span class="text-lg font-black">PRO</span>
                                </div>
                            </div>
                        </div>
                    </div>
        `,
                showCloseButton: true,
                showConfirmButton: false,
                width: '480px',
                background: 'transparent',
                customClass: {
                    popup: 'p-0 rounded-[3.5rem] overflow-hidden border-none mx-4',
                }
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleMarkShipped = async (orderId: string) => {
        const { value: formValues } = await Swal.fire({
            title: 'Shipment Details',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Tracking Number">' +
                '<input id="swal-input2" class="swal2-input" placeholder="Carrier Name">',
            focusConfirm: false,
            preConfirm: () => {
                return [
                    (document.getElementById('swal-input1') as HTMLInputElement).value,
                    (document.getElementById('swal-input2') as HTMLInputElement).value
                ]
            }
        });

        if (formValues) {
            const [trackingNumber, carrier] = formValues;
            try {
                const token = localStorage.getItem('fla_token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${orderId}/shipped`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ trackingNumber, carrier })
                });

                if (!response.ok) throw new Error('Failed to update shipment');

                setVendorOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'shipped', trackingNumber, carrier } : o));
                Swal.fire({ icon: 'success', title: 'Shipped!', text: 'Customer has been notified.' });
            } catch (error: any) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message });
            }
        }
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
                                <div key={i} className={`p-6 md:p-8 rounded-[32px] ${stat.bg} shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative`}>
                                    {/* Decorative Pattern */}
                                    <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${stat.pattern} transform rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700`}>
                                        <stat.icon className="w-full h-full text-white" />
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-white rounded-2xl flex items-center justify-center relative z-10 group-hover:rotate-6 transition-all`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        {stat.trend && (
                                            <span className="text-[9px] md:text-[10px] font-black text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-tighter border border-white/20">
                                                {stat.trend}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                        <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</p>
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
                                    {vendorOrders.length > 0 ? (
                                        vendorOrders.slice(0, 3).map((order, i) => (
                                            <div key={order._id || i} className={`p-6 flex items-center gap-5 ${i !== 2 ? 'border-b border-slate-50' : ''}`}>
                                                <div className="w-12 h-14 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                                                    <Image
                                                        src={getImageUrl(order.productImage)}
                                                        alt={order.productName || 'Product'}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = '/product-1.jpg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 text-sm">{order.productName || 'Bespoke Order'}</h4>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black">Ordered by {order.customerName || 'Customer'} • #{order._id?.slice(-6) || 'N/A'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900">GH₵ {order.totalAmount}</p>
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${order.status === 'Delivered' ? 'text-emerald-500' : 'text-blue-500'}`}>{order.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center">
                                            <ShoppingBag className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No recent sales.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Wallet Snapshot</h2>
                                <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lemon/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-lemon/20 transition-colors" />
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Escrow (Pending)</p>
                                                <h3 className="text-2xl font-black text-brand-lemon">GH₵ {(dashboardData?.pendingRevenue || 0).toLocaleString()}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee (5%)</p>
                                                <p className="text-xs font-bold text-slate-500">- GH₵ {((dashboardData?.totalRevenue + dashboardData?.pendingRevenue) * 0.05 || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available for Withdrawal</p>
                                        <h3 className="text-xl font-black text-white">GH₵ {(dashboardData?.totalRevenue || 0).toLocaleString()}</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            Swal.fire({
                                                title: 'Request Payout',
                                                text: `Proceed with withdrawal of available GH₵ ${(dashboardData?.totalRevenue || 0).toLocaleString()} to your MoMo?`,
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
                                        <Image
                                            src={getImageUrl(product.image)}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            unoptimized={true}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/product-1.jpg';
                                            }}
                                        />
                                        {product.images && product.images.length > 1 && (
                                            <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-sm">
                                                <ImageIcon className="w-2.5 h-2.5 text-slate-400" />
                                                <span className="text-[8px] font-black text-slate-900">{product.images.length} Perspectives</span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(product.id, product.isActive !== false); }}
                                                className={`w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity ${product.isActive === false ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-900 hover:bg-slate-900 hover:text-white'}`}
                                                title={product.isActive === false ? "Show Product" : "Hide Product"}
                                            >
                                                {product.isActive === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleMarkSoldOut(product.id); }} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-900 shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500 hover:text-white" title="Mark Sold Out">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-900 shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-lemon">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-red-500 shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm truncate">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-black text-slate-900">GH₵ {product.price}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${product.quantity === 0 ? 'text-red-500 bg-red-50' : product.status === 'Low Stock' ? 'text-orange-500 bg-orange-50' : 'text-emerald-500 bg-emerald-50'}`}>
                                            {product.quantity === 0 ? 'Sold Out' : product.status}
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
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Order ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Customer</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Design</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {vendorOrders.length > 0 ? (
                                        vendorOrders.map((order, i) => (
                                            <tr key={order._id || i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 font-black text-slate-900 text-xs border-r border-slate-50">#ORD-{order._id?.slice(-6).toUpperCase() || 'N/A'}</td>
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{order.customerName || 'Guest'}</p>
                                                            <p className="text-[10px] text-slate-400 uppercase">{order.customerPhone || 'Verified Order'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-slate-700 text-xs border-r border-slate-50">{order.productName || 'Bespoke Item'}</td>
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {order.status || 'Processing'}
                                                        </span>
                                                        {order.isPaid && (
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter ml-1">Verified Paid</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {order.paymentProof && (
                                                            <button
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        title: 'Payment Proof',
                                                                        imageUrl: getImageUrl(order.paymentProof),
                                                                        imageAlt: 'Payment Screenshot',
                                                                        confirmButtonText: 'CLOSE',
                                                                        buttonsStyling: false,
                                                                        customClass: {
                                                                            popup: 'rounded-[32px] p-8',
                                                                            confirmButton: 'bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest'
                                                                        }
                                                                    });
                                                                }}
                                                                className="p-2 bg-brand-lemon text-slate-900 rounded-xl hover:shadow-md transition-all"
                                                                title="View Proof"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {!order.paymentVerifiedByVendor && order.paymentProof && (
                                                            <button
                                                                onClick={() => handleVerifyPayment(order._id)}
                                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                                                            >
                                                                Verify Payment
                                                            </button>
                                                        )}
                                                        {order.paymentVerifiedByVendor && order.status !== 'shipped' && order.status !== 'delivered' && (
                                                            <button
                                                                onClick={() => handleMarkShipped(order._id)}
                                                                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md"
                                                            >
                                                                Mark Shipped
                                                            </button>
                                                        )}
                                                        {order.status === 'pending' && order.paymentProof && (
                                                            <button
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        title: 'Confirm Payment?',
                                                                        text: 'Have you verified the funds in your account?',
                                                                        icon: 'question',
                                                                        showCancelButton: true,
                                                                        confirmButtonText: 'YES, CONFIRM',
                                                                        cancelButtonText: 'NOT YET',
                                                                        buttonsStyling: false,
                                                                        customClass: {
                                                                            popup: 'rounded-[32px] p-10',
                                                                            title: 'text-xl font-black text-slate-900 uppercase',
                                                                            confirmButton: 'bg-emerald-500 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest mr-3',
                                                                            cancelButton: 'bg-slate-100 text-slate-400 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest'
                                                                        }
                                                                    }).then(async r => {
                                                                        if (r.isConfirmed) {
                                                                            try {
                                                                                const token = localStorage.getItem('fla_token');
                                                                                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${order._id}`, {
                                                                                    method: 'PATCH',
                                                                                    headers: {
                                                                                        'Authorization': `Bearer ${token}`,
                                                                                        'Content-Type': 'application/json'
                                                                                    },
                                                                                    body: JSON.stringify({ status: 'confirmed' })
                                                                                });
                                                                                setVendorOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'confirmed' } : o));
                                                                                Swal.fire({ icon: 'success', title: 'Payment Confirmed', customClass: { popup: 'rounded-[32px]' } });
                                                                            } catch (err) {
                                                                                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to confirm payment.' });
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                            >
                                                                Confirm Payment
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                Swal.fire({
                                                                    title: 'Update Progress',
                                                                    text: 'Move this order to the next stage of fulfillment.',
                                                                    icon: 'info',
                                                                    input: 'select',
                                                                    inputOptions: {
                                                                        'processing': 'Processing',
                                                                        'in_printing': 'In Printing',
                                                                        'shipped': 'Shipped',
                                                                        'delivered': 'Delivered',
                                                                        'cancelled': 'Cancelled'
                                                                    },
                                                                    inputPlaceholder: 'Select Status',
                                                                    showCancelButton: true,
                                                                    confirmButtonText: 'UPDATE',
                                                                    confirmButtonColor: '#0F172A',
                                                                    customClass: { popup: 'rounded-[32px]' }
                                                                }).then(async r => {
                                                                    if (r.isConfirmed && r.value) {
                                                                        try {
                                                                            const token = localStorage.getItem('fla_token');
                                                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${order._id}`, {
                                                                                method: 'PATCH',
                                                                                headers: {
                                                                                    'Authorization': `Bearer ${token}`,
                                                                                    'Content-Type': 'application/json'
                                                                                },
                                                                                body: JSON.stringify({ status: r.value })
                                                                            });
                                                                            setVendorOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: r.value } : o));
                                                                            Swal.fire({ icon: 'success', title: 'Status Updated', customClass: { popup: 'rounded-[32px]' } });
                                                                        } catch (err) {
                                                                            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update order status.' });
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                            className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                        >
                                                            Update Status
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                                                            title="View Details"
                                                        >
                                                            <Search className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Your studio has no orders yet.</p>
                                            </td>
                                        </tr>
                                    )}
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
                                <Wallet className="w-12 h-12 text-brand-lemon mb-8" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Available for Withdrawal</p>
                                <h3 className="text-4xl font-black text-brand-lemon mb-10">GH₵ {(user?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm py-3 border-t border-white/5">
                                        <span className="text-slate-400">Total Revenue (Net)</span>
                                        <span className="font-black text-white">GH₵ {(dashboardData?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-3 border-t border-white/5">
                                        <span className="text-slate-400">Locked in Escrow</span>
                                        <span className="font-black text-brand-lemon">GH₵ {(user?.pendingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 mt-2">
                                        <p className="text-[10px] font-black text-brand-lemon uppercase tracking-widest mb-1">Payout Destination</p>
                                        <p className="text-xs font-bold text-white uppercase">{user?.accountName || 'Primary Account'}</p>
                                        <p className="text-sm font-black text-white tracking-widest">{user?.momoNumber || 'No Number Linked'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleWithdrawal}
                                    className="w-full mt-10 py-5 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-lemon transition-all active:scale-95 shadow-xl shadow-white/5"
                                >
                                    Withdraw to Mobile Money
                                </button>
                            </div>
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Withdrawal History</h3>
                                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                                    {(dashboardData?.withdrawalHistory || []).length > 0 ? (
                                        dashboardData.withdrawalHistory.map((w: any, i: number) => (
                                            <div key={i} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-black text-slate-900 text-sm">GH₵ {w.netAmount?.toLocaleString() || w.amount.toLocaleString()}</p>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${w.status === 'processed' ? 'bg-emerald-100 text-emerald-600' :
                                                            w.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                                                'bg-red-100 text-red-600'
                                                            }`}>
                                                            {w.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 uppercase font-black">
                                                        {new Date(w.createdAt).toLocaleDateString()} • {w.paymentMethod?.toUpperCase() || 'MOMO'}
                                                        {w.adminCommission > 0 && ` • FEE: GH₵ ${w.adminCommission}`}
                                                    </p>
                                                </div>
                                                <div className={`p-2 rounded-xl ${w.status === 'processed' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center">
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">No withdrawals<br />recorded yet.</p>
                                        </div>
                                    )}
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
                            {(dashboardData?.recentReviews || []).length > 0 ? (
                                dashboardData.recentReviews.map((review: any, i: number) => (
                                    <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 flex gap-0.5">
                                            {[...Array(5)].map((_, s) => (
                                                <Star key={s} className={`w-4 h-4 ${s < review.rating ? 'text-brand-lemon fill-current' : 'text-slate-100'}`} />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">{review.customerName}</h4>
                                                <p className="text-[10px] text-slate-400 uppercase font-black">{new Date(review.createdAt).toLocaleDateString()} • {review.productName}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm border-dashed">
                                    <Star className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No reviews yet.</p>
                                    <p className="text-slate-300 text-xs mt-1 font-medium">Verified customer feedback will appear here.</p>
                                </div>
                            )}
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
                                {bannerImage ? (
                                    <Image
                                        src={getImageUrl(bannerImage)}
                                        alt="Banner"
                                        fill
                                        className="object-cover"
                                        unoptimized={true}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/product-1.jpg';
                                        }}
                                    />
                                ) : (
                                    <UploadCloud className="w-12 h-12 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                                )}
                                <label className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Change Banner</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                                </label>
                            </div>

                            <div className="flex items-end gap-6 -mt-20 relative px-6">
                                <div className="w-32 h-32 rounded-[32px] bg-white p-2 shadow-2xl">
                                    <div className="w-full h-full bg-slate-900 rounded-[24px] flex items-center justify-center text-white relative group overflow-hidden">
                                        {profileImage ? (
                                            <Image
                                                src={getImageUrl(profileImage)}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                                unoptimized={true}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/product-1.jpg';
                                                }}
                                            />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-white/20 group-hover:scale-110 transition-transform" />
                                        )}
                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Camera className="w-6 h-6 text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
                                        </label>
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
                                    <input
                                        type="text"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MoMo Payout Number</label>
                                    <input
                                        type="text"
                                        value={momoNumber}
                                        onChange={(e) => setMomoNumber(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MoMo Account Name</label>
                                    <input
                                        type="text"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Studio Address</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Bio</label>
                                    <textarea
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateVendorProfile}
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
                            {notifications.length > 0 ? (
                                notifications.map((n, i) => (
                                    <div key={n._id || i} className={`p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex gap-5 items-start hover:shadow-md transition-shadow ${!n.isRead ? 'border-brand-lemon' : ''}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-brand-lemon text-slate-900' : 'bg-slate-50 text-slate-300'}`}>
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">{n.title}</h3>
                                                <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(n.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                    <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No new alerts.</p>
                                    <p className="text-slate-300 text-xs mt-1">We'll notify you here about sales and system updates.</p>
                                </div>
                            )}
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
                <div className="p-8"></div>

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

            {/* Sidebar Overlay Mobile */}
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className={`absolute top-0 left-0 w-[80%] h-full bg-white transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-8 pb-12 flex justify-end items-center bg-white">
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
                        <div className="p-8 border-t border-slate-50 space-y-4">
                            <Link href="/">
                                <button className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 w-full text-left">
                                    <ArrowLeft className="w-4 h-4" /> Launch Store
                                </button>
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-red-500 w-full text-left">
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
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleViewPublicProfile}
                            className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white border-2 border-brand-lemon shadow-lg overflow-hidden relative active:scale-95 transition-transform"
                        >
                            {profileImage ? (
                                <Image src={getImageUrl(profileImage)} alt="Avatar" fill className="object-cover" unoptimized={true} />
                            ) : (
                                <User className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </header>

                {/* Desktop Top Bar */}
                <header className="hidden md:flex sticky top-0 z-50 bg-[#FDFDFF]/80 backdrop-blur-md px-10 py-6 items-center justify-between border-b border-slate-100/50">
                    <div className="relative w-96 max-w-sm">
                        <input type="text" placeholder="Search orders, products, help..." className="w-full bg-white py-3 pl-12 pr-6 rounded-full border border-slate-100 text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all shadow-sm" />
                        <Search className="w-4 h-4 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-4 text-right">
                        <button onClick={handleViewPublicProfile} className="text-right group active:scale-95 transition-all">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-lemon transition-colors">{user?.shopName || user?.name || 'Signature Print'}</p>
                            <div className="flex items-center justify-end gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user?.location || 'Accra, Ghana'}</p>
                            </div>
                        </button>
                        <button
                            onClick={handleViewPublicProfile}
                            className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white border-2 border-brand-lemon shadow-xl overflow-hidden relative group active:scale-90 transition-all"
                        >
                            {profileImage ? (
                                <Image src={getImageUrl(profileImage)} alt="Avatar" fill className="object-cover" unoptimized={true} />
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5 opacity-40" />
                                    <div className="absolute inset-0 bg-brand-lemon/10 group-hover:bg-transparent transition-colors" />
                                </>
                            )}
                        </button>
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
                            <div className="shrink-0 p-6 md:p-10 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                <div className="pr-4">
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">{editingProduct ? 'Refine Heritage' : 'Stock Management'}</p>
                                    <h2 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{editingProduct ? 'Edit Design' : 'List New Design'}</h2>
                                </div>
                                <button onClick={() => { setShowAddProduct(false); resetForm(); }} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-6 md:space-y-10 custom-scrollbar">
                                <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
                                    {/* Multi-Image Upload Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Design Perspectives</label>
                                            <span className="text-[9px] font-black text-slate-300 uppercase">{formImages.length}/3 Uploaded</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {formImages.map((img: any, idx) => (
                                                <div key={idx} className="relative aspect-[3/4] rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden group">
                                                    <Image src={getImageUrl(img.url)} alt={`Preview ${idx}`} fill className="object-cover" unoptimized={true} />
                                                    {img.isUploading && (
                                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                                                            <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {/* Controls Div - Always visible on mobile, hover on desktop */}
                                                    <div className="absolute inset-0 bg-black/40 md:bg-black/40 md:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                                        <select
                                                            value={img.label}
                                                            onChange={(e) => {
                                                                const newImgs = [...formImages];
                                                                newImgs[idx].label = e.target.value;
                                                                setFormImages(newImgs);
                                                            }}
                                                            className="bg-white/20 backdrop-blur-md border-none text-[10px] text-white font-black uppercase tracking-widest rounded-full py-1.5 px-4 focus:ring-0 mb-2 cursor-pointer shadow-lg"
                                                        >
                                                            <option className="text-slate-900" value="Front">Front</option>
                                                            <option className="text-slate-900" value="Back">Back</option>
                                                            <option className="text-slate-900" value="Side">Side</option>
                                                        </select>
                                                        <button
                                                            onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg active:scale-90"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm md:block hidden">
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
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const localUrl = URL.createObjectURL(file);
                                                                const tempId = Date.now().toString();

                                                                // Show local preview immediately
                                                                setFormImages(prev => [...prev, { url: localUrl, label: 'Front', isUploading: true, id: tempId }]);

                                                                try {
                                                                    const formData = new FormData();
                                                                    formData.append('file', file);
                                                                    const token = localStorage.getItem('fla_token');

                                                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload`, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${token}`
                                                                        },
                                                                        body: formData
                                                                    });

                                                                    if (!response.ok) throw new Error('Upload failed');
                                                                    const data = await response.json();

                                                                    // Update with the real URL from server
                                                                    setFormImages(prev => prev.map((img: any) =>
                                                                        img.id === tempId ? { ...img, url: data.url, isUploading: false } : img
                                                                    ));
                                                                } catch (err) {
                                                                    setFormImages(prev => prev.filter((img: any) => img.id !== tempId));
                                                                    Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Could not upload image.' });
                                                                }
                                                            }
                                                            // Reset the input so the same file can be selected again or to allow consecutive uploads
                                                            e.target.value = '';
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

                                                {/* Revenue Forecast */}
                                                {(formPrice && Number(formPrice) > 0) && (
                                                    <div className="mt-4 p-5 bg-slate-900 rounded-[24px] shadow-xl animate-in slide-in-from-top-2 duration-300">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">Platform Fee (10%)</span>
                                                            <span className="text-[10px] font-black text-red-400">- GH₵ {(Number(formPrice) * 0.1).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Your Payout</span>
                                                            <span className="text-base font-black text-brand-lemon">GH₵ {(Number(formPrice) * 0.9).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-3 tracking-tighter">Verified FLA Partner Rate</p>
                                                    </div>
                                                )}
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
                                            <textarea rows={4} value={formNarrative} onChange={(e) => setFormNarrative(e.target.value)} placeholder="Story behind this design..." className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none" />
                                        </div>
                                        <div className="space-y-1.5 pb-20 md:pb-0">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Silhouettes (Sizes)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['S', 'M', 'L', 'XL', 'XXL'].map(s => {
                                                    const isSelected = formSizes.includes(s);
                                                    return (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setFormSizes(prev => prev.filter(size => size !== s));
                                                                } else {
                                                                    setFormSizes(prev => [...prev, s]);
                                                                }
                                                            }}
                                                            className={`w-11 h-11 md:w-12 md:h-12 rounded-xl border transition-all text-[9px] md:text-[10px] font-black uppercase ${isSelected
                                                                ? 'bg-slate-900 border-slate-900 text-brand-lemon shadow-lg shadow-slate-900/10'
                                                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer for Mobile Actions */}
                                <div className="mt-8 md:mt-12 flex gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md py-4 md:py-6 border-t border-slate-100 z-50">
                                    <button onClick={() => { setShowAddProduct(false); resetForm(); }} className="flex-1 py-4 md:py-5 bg-slate-50 text-slate-400 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Discard</button>
                                    <button
                                        onClick={handleAddOrEditProduct}
                                        className="flex-[2] py-4 md:py-5 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
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
                        {sidebarItems.slice(0, 2).map((item) => (
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

                        {/* Central Plus Button */}
                        <button
                            onClick={() => { resetForm(); setShowAddProduct(true); }}
                            className="w-14 h-14 bg-brand-lemon text-slate-900 rounded-full flex items-center justify-center -translate-y-4 shadow-[0_10px_30px_rgba(234,255,102,0.3)] active:scale-95 transition-all border-4 border-slate-900"
                        >
                            <Plus className="w-6 h-6" />
                        </button>

                        {sidebarItems.slice(2, 4).map((item) => (
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

                {selectedOrder && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[600] flex items-center justify-center p-4 md:p-8">
                        <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Order #ORD-{selectedOrder._id?.slice(-6).toUpperCase()}</h3>
                                    <p className="text-brand-lemon text-[10px] font-black uppercase tracking-widest mt-1">Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                {/* Status Overview */}
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOrder.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                                        <p className={`text-xs font-black uppercase tracking-widest ${selectedOrder.isPaid ? 'text-emerald-500' : 'text-orange-500'}`}>
                                            {selectedOrder.isPaid ? 'Verification Complete' : 'Awaiting Proof'}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Package className="w-4 h-4 text-brand-lemon" />
                                        Design Anthology
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                                                <div className="w-14 h-14 bg-slate-50 rounded-xl flex-shrink-0 relative overflow-hidden">
                                                    <Image src={getImageUrl(item.image)} alt={item.name} fill className="object-cover" unoptimized />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                                                    <div className="flex gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Size: {item.size || 'N/A'}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">GH₵ {(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Grand Total</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tighter">GH₵ {selectedOrder.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Logistics & Contact */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <User className="w-4 h-4 text-brand-lemon" />
                                            Patron Details
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-slate-900">{selectedOrder.customerName}</p>
                                            <p className="text-xs font-medium text-slate-500">{selectedOrder.customerPhone}</p>
                                            <p className="text-xs font-medium text-slate-500">{selectedOrder.customerEmail}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <LogOut className="w-4 h-4 text-brand-lemon rotate-90" />
                                            Dispatch Port
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-slate-900">{selectedOrder.shippingAddress || 'Digital Product / Studio Pickup'}</p>
                                            <p className="text-xs font-medium text-slate-500">{selectedOrder.shippingCity}, {selectedOrder.shippingRegion}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                {selectedOrder.notes && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <MessageSquare className="w-4 h-4 text-brand-lemon" />
                                            Special Requests
                                        </h4>
                                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl italic text-xs font-medium text-slate-600 leading-relaxed">
                                            "{selectedOrder.notes}"
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-full font-black text-[10px] uppercase tracking-widest hover:border-slate-300 transition-all"
                                >
                                    Return to Archive
                                </button>
                                <a
                                    href={`https://wa.me/${selectedOrder.customerPhone?.replace(/\D/g, '') || ''}`}
                                    target="_blank"
                                    className="flex-[2] py-4 bg-[#25D366] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                                >
                                    <WhatsAppIcon className="w-4 h-4" />
                                    Contact on WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
