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
    const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();
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
    const [formCategory, setFormCategory] = useState('For men');
    const [formQuantity, setFormQuantity] = useState('');
    const [formTailoring, setFormTailoring] = useState('');
    const [formRegion, setFormRegion] = useState('Greater Accra');
    const [formNarrative, setFormNarrative] = useState('');
    const [formImages, setFormImages] = useState<{ url: string, label: string }[]>([]);
    const [formSizes, setFormSizes] = useState<string[]>([]);
    const [formHasSizes, setFormHasSizes] = useState(true);

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
            if (isHydrated) router.push('/auth?role=vendor');
            return;
        }
        if (user?.role !== 'vendor' && user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const [stats, prods, ords, notifs, withdrawals, settings] = await Promise.all([
                    fetch(`${api}/dashboard/vendor/stats`, { credentials: 'include' }),
                    fetch(`${api}/products?vendorId=${user.id}`, { credentials: 'include' }),
                    fetch(`${api}/orders/vendor-orders`, { credentials: 'include' }),
                    fetch(`${api}/notifications/my-notifications`, { credentials: 'include' }),
                    fetch(`${api}/payments/withdrawals/my-history`, { credentials: 'include' }),
                    fetch(`${api}/settings`, { credentials: 'include' })
                ]);

                if (stats.ok) setDashboardData(await stats.json());
                if (prods.ok) {
                    const p = await prods.json();
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
                if (ords.ok) setVendorOrders(await ords.json());
                if (notifs.ok) setNotifications(await notifs.json());
                if (withdrawals.ok) {
                    const w = await withdrawals.json();
                    setDashboardData((prev: any) => ({ ...prev, withdrawalHistory: w }));
                }
                if (settings.ok) {
                   const s = await settings.json();
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
    }, [user, isAuthenticated, isLoading, isHydrated]);

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
                router.push('/');
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
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formName,
                    price: parseFloat(formPrice),
                    category: formCategory,
                    stock: parseInt(formQuantity) || 0,
                    description: formNarrative,
                    images: formImages.map(i => i.url),
                    imageLabels: formImages.map(i => i.label),
                    sizes: formSizes,
                    tailoringTime: formTailoring,
                    region: formRegion,
                    hasSizes: formHasSizes,
                    vendorId: user?.id,
                    vendorName: user?.shopName,
                    uniqueVendorId: user?.uniqueVendorId
                })
            });

            if (!res.ok) throw new Error("Save operation failed");
            
            const saved = await res.json();
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
                await fetch(`${api}/products/${id}`, { method: 'DELETE', credentials: 'include' });
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
                    headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${api}/upload`, { method: 'POST', credentials: 'include', body: formData });
            const data = await res.json();
            if (type === 'avatar') setProfileImage(data.url);
            else setBannerImage(data.url);
        } catch (err) {
            Swal.fire('Upload Failed', 'Visual asset could not be stored.', 'error');
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
        setFormCategory('For men');
        setFormQuantity('');
        setFormTailoring('');
        setFormRegion('Greater Accra');
        setFormNarrative('');
        setFormImages([]);
        setFormSizes([]);
        setFormHasSizes(true);
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
                            setFormImages(p.images || []);
                            setFormSizes(p.sizes || []);
                            setFormHasSizes(!!p.hasSizes);
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
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ status: r.value })
                                    });
                                    setVendorOrders(prev => prev.map(o => o._id === id ? { ...o, status: r.value } : o));
                                }
                            });
                        }}
                        onDelete={async (id) => {
                             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${id}`, { method: 'DELETE', credentials: 'include' });
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
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingProduct ? 'Refine Design' : 'Manifest New Design'}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure your artisanal masterpiece.</p>
                            </div>
                            <button onClick={() => setShowAddProduct(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10">
                            {/* Form fields... abbreviated for stability... */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Design Name</label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (GH₵)</label>
                                    <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">The Narrative (Description)</label>
                                <textarea value={formNarrative} onChange={(e) => setFormNarrative(e.target.value)} rows={4} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 resize-none" />
                            </div>
                            <button onClick={handleAddOrEditProduct} className="w-full py-6 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-lemon hover:text-slate-900 transition-all active:scale-95 mt-4">
                                {editingProduct ? 'UPDATE REPERTOIRE' : 'PUBLISH TO MARKETPLACE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
