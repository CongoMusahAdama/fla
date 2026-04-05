"use client";
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, ShoppingBag, Wallet, Star,
    Bell, User, HelpCircle, LogOut, Plus, Search,
    Menu, X, ChevronRight, ArrowUpRight, TrendingUp,
    Clock, CheckCircle2, ShieldAlert, MessageSquare, Truck,
    Image as ImageIcon, Edit2, Trash2, Camera, UploadCloud,
    Eye, EyeOff, ArrowLeft, Printer, MapPin, Copy, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import Swal from 'sweetalert2';

// Modular Components
import { VendorSidebar } from '@/components/dashboard/VendorSidebar';
import { VendorHeader, VendorMobileHeader } from '@/components/dashboard/VendorHeader';
import { VendorStatsGrid } from '@/components/dashboard/VendorStatsGrid';
import { VendorProducts, Product } from '@/components/dashboard/VendorProducts';
import { VendorOrders } from '@/components/dashboard/VendorOrders';
import { VendorFinances } from '@/components/dashboard/VendorFinances';
import { VendorSettings } from '@/components/dashboard/VendorSettings';
import { VendorNotifications } from '@/components/dashboard/VendorNotifications';
import { VendorHelp } from '@/components/dashboard/VendorHelp';

const GHANA_REGIONS = [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 
    'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah', 
    'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
];

type VendorSection = 'dashboard' | 'products' | 'orders' | 'wallet' | 'reviews' | 'notifications' | 'settings' | 'help';



export default function VendorDashboard() {
    const { user, token, logout, updateUser, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<VendorSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [vendorOrders, setVendorOrders] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);
    
    // Performance and Logic States
    const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [commissionRate, setCommissionRate] = useState(10);
    const [withdrawalMin, setWithdrawalMin] = useState(50);
    const [printingOrder, setPrintingOrder] = useState<any>(null);

    // Form States
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formCategory, setFormCategory] = useState('Electronics');
    const [formQuantity, setFormQuantity] = useState('');
    const [formTailoring, setFormTailoring] = useState('');
    const [formRegion, setFormRegion] = useState('Greater Accra');
    const [formNarrative, setFormNarrative] = useState('');
    const [formImages, setFormImages] = useState<string[]>([]);
    const [formSizes, setFormSizes] = useState<string[]>([]);
    const [formHasSizes, setFormHasSizes] = useState(true);
    const [formHasColors, setFormHasColors] = useState(true);
    const [formColors, setFormColors] = useState<string[]>([]);
    const [formImageLabels, setFormImageLabels] = useState<string[]>(['Front', 'Back', 'Side', 'Details']);
    const [customColorInput, setCustomColorInput] = useState('');

    // Profile States
    const [shopName, setShopName] = useState('');
    const [phone, setPhone] = useState('');
    const [momoNumber, setMomoNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [shopLocation, setShopLocation] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [bannerImage, setBannerImage] = useState('');

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (user) {
            setShopName(user.shopName || '');
            setPhone(user.phone || '');
            setMomoNumber(user.momoNumber || '');
            setAccountName(user.accountName || '');
            setShopLocation(user.location || '');
            setBio(user.bio || '');
            setProfileImage(user.profileImage || '');
            setBannerImage(user.bannerImage || '');
        }
    }, [user]);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            if (isHydrated) router.push('/auth?view=login&role=vendor');
            return;
        }
        if (user?.role !== 'vendor' && user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        const fetchData = async () => {
            if (!token) return;
            try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const results = await Promise.allSettled([
                    fetch(`${api}/dashboard/vendor/stats`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
                    fetch(`${api}/products?vendorId=${user.id}&showAll=true`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
                    fetch(`${api}/orders/vendor-orders`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
                    fetch(`${api}/notifications/my-notifications`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
                    fetch(`${api}/payments/withdrawals/my-history`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
                    fetch(`${api}/settings`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' })
                ]);

                const [statsRes, prodsRes, ordsRes, notifsRes, withdrawalsRes, settingsRes] = results;

                if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                    setDashboardData(await statsRes.value.json());
                }

                if (prodsRes.status === 'fulfilled' && prodsRes.value.ok) {
                    const p = await prodsRes.value.json();
                    setVendorProducts(p.map((prod: any) => ({
                        id: prod._id,
                        name: prod.name,
                        price: prod.price.toString(),
                        image: prod.images?.[0] || '/product-1.jpg',
                        images: prod.images?.map((img: string, idx: number) => ({
                            url: img,
                            label: prod.imageLabels?.[idx] || 'Product'
                        })) || [],
                        status: prod.stock < 10 ? 'Low Stock' : 'In Stock',
                        sales: 0,
                        quantity: prod.stock,
                        tailoringTime: prod.tailoringTime || '3 Days',
                        region: prod.region || 'Greater Accra',
                        description: prod.description || '',
                        category: prod.category || 'T-Shirt',
                        imageLabels: prod.imageLabels || [],
                        sizes: prod.sizes || [],
                        hasSizes: prod.hasSizes !== undefined ? prod.hasSizes : true,
                        isActive: prod.isActive
                    })));
                }

                if (ordsRes.status === 'fulfilled' && ordsRes.value.ok) {
                    setVendorOrders(await ordsRes.value.json());
                }

                if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
                    setNotifications(await notifsRes.value.json());
                }

                if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.ok) {
                    const w = await withdrawalsRes.value.json();
                    setDashboardData((prev: any) => ({ ...prev, withdrawalHistory: w }));
                }

                if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
                    const s = await settingsRes.value.json();
                   if (s.platform_commission) setCommissionRate(Number(s.platform_commission));
                   if (s.withdrawal_minimum) setWithdrawalMin(Number(s.withdrawal_minimum));
                }
            } catch (err) {
                console.error("Data Sync Failure:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, token, isAuthenticated, isLoading, isHydrated]);

    const handleLogout = () => {
        Swal.fire({
            title: 'END SESSION?',
            text: "Are you sure you want to log out of your studio dashboard?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0F172A',
            confirmButtonText: 'LOGOUT',
            customClass: { popup: 'rounded-[32px]' }
        }).then((r) => {
            if (r.isConfirmed) {
                logout();
                router.push('/auth?view=login&role=vendor');
            }
        });
    };

    const handleAddOrEditProduct = async () => {
        if (!formName || !formPrice || !formNarrative) {
            Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Please fill in all core fields.' });
            return;
        }

        try {
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const method = editingProduct ? 'PATCH' : 'POST';
            const url = editingProduct ? `${api}/products/${editingProduct.id}` : `${api}/products`;

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formName,
                    price: parseFloat(formPrice),
                    category: formCategory,
                    stock: parseInt(formQuantity) || 0,
                    description: formNarrative,
                    images: formImages.filter(url => url !== ''),
                    sizes: formHasSizes ? formSizes : [],
                    hasSizes: formHasSizes,
                    colors: formHasColors ? formColors : [],
                    hasColors: formHasColors,
                    imageLabels: formImages.map((url, idx) => url !== '' ? formImageLabels[idx] : null).filter(l => l !== null),
                    tailoringTime: formTailoring,
                    region: formRegion,
                    vendorId: user?.id,
                    vendorName: user?.shopName,
                    uniqueVendorId: user?.uniqueVendorId
                })
            });

            if (!res.ok) throw new Error("Save operation failed");
            
            const savedData = await res.json();
            // Refresh logic context...
            Swal.fire({ icon: 'success', title: 'STORE UPDATED', customClass: { popup: 'rounded-[32px]' } });
            setShowAddProduct(false);
            // Refresh products (simulated here)
            window.location.reload();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Operational Failure', text: 'Could not synchronize product.' });
        }
    };

    const handleDeleteProduct = async (id: any) => {
        const r = await Swal.fire({
            title: 'DELETE DESIGN?',
            text: "This removal is permanent and cannot be reversed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'CONFIRM DELETE',
            customClass: { popup: 'rounded-[32px]' }
        });

        if (r.isConfirmed) {
            try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                await fetch(`${api}/products/${id}`, { 
                    method: 'DELETE', 
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include' 
                });
                setVendorProducts(prev => prev.filter(p => p.id !== id));
                Swal.fire('Discarded!', 'Design removed.', 'success');
            } catch (err) {
                Swal.fire('Error', 'Deletion failed.', 'error');
            }
        }
    };

    const handleWithdrawal = async () => {
        const bal = user?.walletBalance || 0;
        if (bal < withdrawalMin) {
            Swal.fire({ icon: 'info', title: 'BALANCE TOO LOW', text: `Minimum GH₵ ${withdrawalMin} required.` });
            return;
        }

        const { value: amount } = await Swal.fire({
            title: 'PAYOUT REQUEST',
            input: 'number',
            inputValue: bal,
            inputLabel: 'Amount (GH₵)',
            showCancelButton: true,
            confirmButtonText: 'WITHDRAW',
            customClass: { popup: 'rounded-[32px]' }
        });

        if (amount && parseFloat(amount) <= bal) {
            try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                await fetch(`${api}/payments/withdrawals/request`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ amount: parseFloat(amount), paymentMethod: 'momo' })
                });
                Swal.fire({ icon: 'success', title: 'REQUEST RECEIVED', customClass: { popup: 'rounded-[32px]' } });
            } catch (err) {
                Swal.fire('Error', 'Request failed.', 'error');
            }
        }
    };

    const handleUpdateVendorProfile = async () => {
        try {
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${api}/auth/profile`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ shopName, phone, momoNumber, accountName, location: shopLocation, bio, profileImage, bannerImage })
            });

            if (!res.ok) throw new Error("Sync failed");
            const updated = await res.json();
            updateUser(updated);
            Swal.fire({ icon: 'success', title: 'IDENTITY UPDATED', customClass: { popup: 'rounded-[32px]' } });
        } catch (err) {
            Swal.fire('Update Failed', 'Internal synchronization error.', 'error');
        }
    };

    const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
        try {
            if (!token) {
                Swal.fire('Authentication Required', 'Please log in again to upload images.', 'warning');
                return;
            }
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${api}/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include', 
                body: formData 
            });

            if (!res.ok) {
               const errData = await res.json().catch(() => ({}));
               throw new Error(errData.message || 'Server rejected the upload');
            }

            const data = await res.json();
            if (type === 'avatar') setProfileImage(data.url);
            else setBannerImage(data.url);
        } catch (err: any) {
            Swal.fire('Upload Failed', err.message || 'Visual asset could not be stored.', 'error');
        }
    };

    const handleFormImageUpload = async (file: File, index: number) => {
        try {
            if (!token) {
                Swal.fire('Authentication Required', 'Please log in again to upload products.', 'warning');
                return;
            }
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${api}/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include', 
                body: formData 
            });

            if (!res.ok) {
               const errData = await res.json().catch(() => ({}));
               throw new Error(errData.message || 'Server rejected the upload');
            }

            const data = await res.json();
            
            setFormImages(prev => {
                const newImages = [...prev];
                while (newImages.length <= index) {
                    newImages.push('');
                }
                newImages[index] = data.url;
                return newImages;
            });
        } catch (err: any) {
            Swal.fire('Upload Failed', err.message || 'Product image could not be stored.', 'error');
        }
    };

    const handleToggleVisibility = async (id: any, status: boolean) => {
        // Logic handled in modular component
    };

    const handleMarkShipped = async (id: string) => {
         // Logic handled in modular component
    };

    const handleQuickSetFee = async (id: string, fee: number) => {
        // Logic handled in modular component
    };

    const resetProductForm = () => {
        setEditingProduct(null);
        setFormName('');
        setFormPrice('');
        setFormCategory('Electronics');
        setFormQuantity('');
        setFormTailoring('');
        setFormRegion('Greater Accra');
        setFormNarrative('');
        setFormImages([]);
        setFormSizes([]);
        setFormHasSizes(true);
        setFormHasColors(true);
        setFormColors([]);
        setFormImageLabels(['Front', 'Back', 'Side', 'Details']);
        setCustomColorInput('');
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <div className="space-y-12 animate-in fade-in duration-700">
                      <VendorStatsGrid dashboardData={dashboardData} productsCount={vendorProducts.length} />
                    </div>
                );
            case 'products':
                return (
                    <VendorProducts 
                        products={vendorProducts}
                        onEdit={(p) => { 
                            setEditingProduct(p);
                            setFormName(p.name);
                            setFormPrice(p.price);
                            setFormCategory(p.category);
                            setFormQuantity(p.quantity.toString());
                            setFormTailoring(p.tailoringTime);
                            setFormRegion(p.region);
                            setFormNarrative(p.description);
                            setFormImages(p.images?.map((img: any) => typeof img === 'string' ? img : img.url) || []);
                            setFormSizes(p.sizes || []);
                            setFormHasSizes(true);
                            setFormHasColors(true);
                            setFormColors((p as any).colors || []);
                            setFormImageLabels(p.imageLabels || ['Front', 'Back', 'Side', 'Details']);
                            setShowAddProduct(true);
                        }}
                        onDelete={handleDeleteProduct}
                        onToggleStatus={() => {}}
                        onAddNew={() => { resetProductForm(); setShowAddProduct(true); }}
                    />
                );
            case 'orders':
                return (
                    <VendorOrders 
                        orders={vendorOrders}
                        onViewProof={(proof) => {
                            Swal.fire({
                                title: 'Payment Proof',
                                imageUrl: getImageUrl(proof),
                                imageAlt: 'Payment Screenshot',
                                confirmButtonText: 'CLOSE',
                                buttonsStyling: false,
                                customClass: {
                                    popup: 'rounded-[32px] p-8',
                                    confirmButton: 'bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest'
                                }
                            });
                        }}
                        onShip={() => {}}
                        onUpdateStatus={(id) => {
                            Swal.fire({
                                title: 'Update Progress',
                                text: 'Update the fulfillment status of this design.',
                                icon: 'info',
                                input: 'select',
                                inputOptions: {
                                    'processing': 'Processing',
                                    'shipped': 'Shipped',
                                    'delivered': 'Delivered',
                                    'cancelled': 'Cancelled'
                                },
                                confirmButtonText: 'UPDATE',
                                customClass: { popup: 'rounded-[32px]' }
                            }).then(async r => {
                                if (r.isConfirmed && r.value) {
                                    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                                    await fetch(`${api}/orders/${id}`, {
                                        method: 'PATCH',
                                        headers: { 
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify({ status: r.value })
                                    });
                                    setVendorOrders(prev => prev.map(o => o._id === id ? { ...o, status: r.value } : o));
                                }
                            });
                        }}
                        onDelete={async (id) => {
                             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${id}`, { 
                                 method: 'DELETE', 
                                 headers: { 'Authorization': `Bearer ${token}` },
                                 credentials: 'include' 
                             });
                             if (res.ok) setVendorOrders(prev => prev.filter(o => o._id !== id));
                        }}
                        onQuickSetFee={handleQuickSetFee}
                        onPrintLabel={setPrintingOrder}
                    />
                );
            case 'wallet': return <VendorFinances user={user} dashboardData={dashboardData} commissionRate={commissionRate} handleWithdrawal={handleWithdrawal} />;
            case 'settings': return <VendorSettings user={user} shopName={shopName} setShopName={setShopName} phone={phone} setPhone={setPhone} momoNumber={momoNumber} setMomoNumber={setMomoNumber} accountName={accountName} setAccountName={setAccountName} shopLocation={shopLocation} setShopLocation={setShopLocation} bio={bio} setBio={setBio} bannerImage={bannerImage} profileImage={profileImage} handleImageUpload={handleImageUpload} handleUpdateVendorProfile={handleUpdateVendorProfile} />;
            case 'notifications': return <VendorNotifications notifications={notifications} />;
            case 'help': return <VendorHelp />;
            default: return null;
        }
    };

    if (!isHydrated || isLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-lemon rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Studio...</p>
                </div>
            </div>
        );
    }

    if (user?.status === 'pending' && user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-brand-lemon/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Clock className="w-12 h-12 text-slate-900" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Verification Pending</h1>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10">Our curators are reviewing your studio application. You'll be notified via email once approved.</p>
                    <button onClick={handleLogout} className="w-full py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Sign Out</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex">
            {/* Desktop Dashboard Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-slate-50 hidden lg:block z-40">
                <VendorSidebar activeSection={activeSection} setActiveSection={setActiveSection} handleLogout={handleLogout} />
            </aside>

            <main className="flex-1 lg:ml-80 min-h-screen relative">
                {/* Dashboard Navigation Channels */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-50 px-6 md:px-12 py-6 flex items-center justify-between z-30">
                    <VendorHeader activeSection={activeSection} shopName={user?.shopName || 'Studio'} profileImage={user?.profileImage} />
                    <VendorMobileHeader activeSection={activeSection} setIsSidebarOpen={setIsSidebarOpen} />
                </header>

                <div className="px-6 md:px-12 py-10 pb-32">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Interface Bridge */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                    <aside className="w-80 h-full bg-white animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
                        <VendorSidebar activeSection={activeSection} setActiveSection={(s) => { setActiveSection(s); setIsSidebarOpen(false); }} handleLogout={handleLogout} />
                    </aside>
                </div>
            )}

            {/* Product Design Studio (Modal) */}
            {showAddProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowAddProduct(false)} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configure your product details for the marketplace.</p>
                            </div>
                            <button onClick={() => setShowAddProduct(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
                            {/* Visual Assets (Images) */}
                            <div className="space-y-6">
                                <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">Visualization (Images)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[0, 1, 2, 3].map((idx) => (
                                        <div key={idx} className="relative aspect-square rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group">
                                            {/* Image Label Selector */}
                                            <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-sm border border-slate-100 z-10">
                                                <select
                                                    value={formImageLabels[idx] || 'Front'}
                                                    onChange={(e) => {
                                                        const newLabels = [...formImageLabels];
                                                        newLabels[idx] = e.target.value;
                                                        setFormImageLabels(newLabels);
                                                    }}
                                                    className="w-full bg-transparent border-none text-[8px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer text-slate-600"
                                                >
                                                    <option value="Front">Front View</option>
                                                    <option value="Back">Back View</option>
                                                    <option value="Side">Side Profile</option>
                                                    <option value="Details">Details/Art</option>
                                                    <option value="Lifestyle">Lifestyle</option>
                                                </select>
                                            </div>

                                            {formImages[idx] ? (
                                                <div className="absolute inset-0">
                                                    <Image src={formImages[idx]} alt={`Preview ${idx}`} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="rounded-3xl" />
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                        <label className="cursor-pointer px-4 py-2 bg-white rounded-full text-[8px] font-black uppercase tracking-widest">Replace
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFormImageUpload(e.target.files[0], idx)} />
                                                        </label>
                                                        <button onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))} className="px-4 py-2 bg-red-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Delete</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                                                    <Camera className="w-6 h-6 text-slate-300" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Upload</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFormImageUpload(e.target.files[0], idx)} />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Core Identity (Name, Price, Category) */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label htmlFor="p-name" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Product Name</label>
                                    <input id="p-name" name="name" type="text" placeholder="e.g. Traditional Smock" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14" />
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="p-price" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Price (GH₵)</label>
                                    <input id="p-price" name="price" type="number" placeholder="0.00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14" />
                                </div>
                            </div>

                            {/* Logistic Specs (Category, Stock, Tailoring, Region) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="space-y-4">
                                    <label htmlFor="p-category" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Category</label>
                                    <select id="p-category" name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14">
                                        <option value="Electronics">Electronics</option>
                                        <option value="Home goods">Home goods</option>
                                        <option value="Beauty/cosmetics">Beauty/cosmetics</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Used items">Used items</option>
                                        <option value="Wholesaler">Wholesaler</option>
                                        <option value="For men">For men</option>
                                        <option value="For women">For women</option>
                                        <option value="Children/Toys">Children/Toys</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Food/beverages">Food/beverages</option>
                                        <option value="Hardware items">Hardware items</option>
                                        <option value="Refurbished items">Refurbished items</option>
                                        <option value="Unisex">Unisex</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="p-stock" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Stock Vol.</label>
                                    <input id="p-stock" name="stock" type="number" placeholder="20" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14" />
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="p-tailoring" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Prep Time</label>
                                    <input id="p-tailoring" name="tailoringTime" type="text" placeholder="e.g., 3-5 Days" value={formTailoring} onChange={(e) => setFormTailoring(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14" />
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="p-region" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Studio Region</label>
                                    <select id="p-region" name="region" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14">
                                        {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Dimensional & Variety Specs (Sizes & Colors) */}
                            <div className="grid md:grid-cols-2 gap-12">
                                {/* Sizes Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">Size Availability</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400">{formHasSizes ? 'ACTIVE' : 'INACTIVE'}</span>
                                            <button type="button" onClick={() => setFormHasSizes(!formHasSizes)} className={`w-12 h-6 rounded-full transition-all relative ${formHasSizes ? 'bg-slate-900' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formHasSizes ? 'left-[26px]' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {formHasSizes && (
                                        <div className="flex flex-wrap gap-2">
                                            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Custom'].map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => setFormSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formSizes.includes(size) ? 'bg-slate-900 text-brand-lemon border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Colors Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">Color Options</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400">{formHasColors ? 'ACTIVE' : 'INACTIVE'}</span>
                                            <button type="button" onClick={() => setFormHasColors(!formHasColors)} className={`w-12 h-6 rounded-full transition-all relative ${formHasColors ? 'bg-slate-900' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formHasColors ? 'left-[26px]' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {formHasColors && (
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: 'Black', hex: '#000000' },
                                                { label: 'White', hex: '#FFFFFF' },
                                                { label: 'Cream', hex: '#F5F5DC' },
                                                { label: 'Navy', hex: '#000080' },
                                                { label: 'Red', hex: '#EF4444' },
                                                { label: 'Emerald', hex: '#10B981' },
                                                { label: 'Coffee', hex: '#6F4E37' },
                                                { label: 'Gold', hex: '#FFD700' },
                                                { label: 'Grey', hex: '#9CA3AF' }
                                            ].map((color) => (
                                                <button
                                                    key={color.label}
                                                    type="button"
                                                    onClick={() => setFormColors(prev => prev.includes(color.label) ? prev.filter(c => c !== color.label) : [...prev, color.label])}
                                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${formColors.includes(color.label) ? 'bg-slate-900 text-brand-lemon border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                                >
                                                    <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                                                    {color.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setFormColors(prev => prev.includes('Pattern') ? prev.filter(c => c !== 'Pattern') : [...prev, 'Pattern'])}
                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${formColors.includes('Pattern') ? 'bg-slate-900 text-brand-lemon border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="w-3 h-3 rounded-full border border-black/10 bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]" />
                                                Pattern
                                            </button>

                                            <div className="flex gap-2 w-full mt-4">
                                                <input
                                                    type="text"
                                                    placeholder="Add custom color..."
                                                    value={customColorInput}
                                                    onChange={(e) => setCustomColorInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (customColorInput.trim()) {
                                                                if (!formColors.includes(customColorInput.trim())) {
                                                                    setFormColors((prev) => [...prev, customColorInput.trim()]);
                                                                }
                                                                setCustomColorInput('');
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (customColorInput.trim()) {
                                                            if (!formColors.includes(customColorInput.trim())) {
                                                                setFormColors((prev) => [...prev, customColorInput.trim()]);
                                                            }
                                                            setCustomColorInput('');
                                                        }
                                                    }}
                                                    className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label htmlFor="p-desc" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Product Description</label>
                                <textarea id="p-desc" name="description" value={formNarrative} onChange={(e) => setFormNarrative(e.target.value)} rows={4} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 resize-none md:p-8" placeholder="Tell the story behind this product..." />
                            </div>
                            
                            <button onClick={handleAddOrEditProduct} className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-brand-lemon hover:text-slate-900 transition-all active:scale-95 mt-4">
                                {editingProduct ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
