"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { resolveStoreSlug, storeHomePath } from '@/lib/storefront';
import { getShuftiKycStatus, kycToneClasses } from '@/lib/kyc';
import {
    LayoutDashboard, Users, ShoppingBag, Settings, LogOut, ArrowLeft,
    Wallet, Package, Truck, MessageSquare, BarChart3, ShieldCheck, ShieldAlert,
    CheckCircle2, XCircle, Eye, EyeOff, Search,
    ArrowUpRight, Download, Menu, X, Trash2, Shield, Clock, TrendingUp, Phone, Plus, User, Store,
    CreditCard, Camera, FileText, ExternalLink, Link2, Tag, Megaphone
} from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { RegisterForm } from '@/app/auth/page';
import AdminOnboardVendorForm from '@/components/admin/AdminOnboardVendorForm';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { RecentTransactionsTable } from '@/components/admin/RecentTransactionsTable';
import { AdminDisputeCaseCard } from '@/components/admin/AdminDisputeCaseCard';
import { DEFAULT_PRODUCT_CATEGORY_LABELS, normalizeCategoryList } from '@/lib/product-categories';
import AdminBillboards from '@/components/admin/AdminBillboards';

function formatKycDetailValue(value: unknown): string {
    if (value == null || value === '') return '—';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return '—';
}

function isProbablyImageUrl(url: string): boolean {
    const u = url.toLowerCase();
    if (u.includes('/raw/upload/') || u.includes('/video/upload/')) return false;
    if (/\.(pdf|doc|docx|zip)(\?|#|$)/i.test(u)) return false;
    return true;
}

type AdminSection = 'dashboard' | 'vendors' | 'customers' | 'orders' | 'products' | 'disputes' | 'delivery' | 'settings' | 'reports' | 'kyc' | 'referees' | 'billboards';

/** Products API may return vendorId as ObjectId string or populated user object. */
function resolveProductVendorId(product: { vendorId?: string | { _id?: string } | null }): string {
    const v = product.vendorId;
    if (!v) return '';
    if (typeof v === 'object') return String(v._id ?? '');
    return String(v);
}

function resolveProductStoreSlug(
    product: { storeSlug?: string; vendorId?: string | { storeSlug?: string; _id?: string } | null },
    users: Array<{ _id?: string; storeSlug?: string }> = [],
): string | null {
    const fromProduct = resolveStoreSlug(product.storeSlug, product.vendorId);
    if (fromProduct) return fromProduct;
    const vendorId = resolveProductVendorId(product);
    if (!vendorId) return null;
    const vendor = users.find((u) => String(u._id) === vendorId);
    return vendor?.storeSlug?.trim() || null;
}

function VendorAvatar({
    profileImage,
    name,
    shopName,
    size = 40,
}: {
    profileImage?: string | null;
    name?: string;
    shopName?: string;
    size?: number;
}) {
    const initial = (shopName || name || 'V').charAt(0).toUpperCase();
    const src = profileImage ? getImageUrl(profileImage) : null;
    const showImage = Boolean(src && src !== '/product-1.jpg');
    return (
        <div
            className="bg-slate-900 text-white overflow-hidden relative border border-slate-200 shrink-0 flex items-center justify-center font-semibold"
            style={{ width: size, height: size }}
        >
            {showImage ? (
                <Image src={src!} alt={shopName || name || 'Vendor'} fill sizes={`${size}px`} className="object-cover" unoptimized />
            ) : (
                <span className="text-sm">{initial}</span>
            )}
        </div>
    );
}

function countVendorProducts(products: any[] | undefined, vendorId: string): number {
    const id = String(vendorId);
    return (products || []).filter((p) => resolveProductVendorId(p) === id).length;
}

function getOrderCommissionMeta(
    order: { totalAmount?: number; adminCommission?: number; vendorShare?: number; commissionRate?: number },
    defaultRate = 6,
) {
    const gross = Number(order.totalAmount) || 0;
    const storedRate = Number(order.commissionRate);
    const rate =
        storedRate > 0
            ? storedRate
            : gross > 0 && order.adminCommission != null
              ? (order.adminCommission / gross) * 100
              : defaultRate;
    const fee =
        order.adminCommission != null && order.adminCommission >= 0
            ? order.adminCommission
            : gross * (rate / 100);
    const net =
        order.vendorShare != null && order.vendorShare >= 0 ? order.vendorShare : gross - fee;
    const rateLabel = rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(1);
    return { gross, rate, rateLabel, fee, net };
}

export default function AdminDashboard() {
    const { user, token, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedKycVendor, setSelectedKycVendor] = useState<any>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [allDisputes, setAllDisputes] = useState<any[]>([]);
    const [kycVendors, setKycVendors] = useState<any[]>([]);
    const [kycFilter, setKycFilter] = useState<'pending' | 'active' | 'rejected' | 'all'>('all');
    const [selectedKycReferee, setSelectedKycReferee] = useState<any>(null);
    const [kycReferees, setKycReferees] = useState<any[]>([]);
    const [kycRefereeFilter, setKycRefereeFilter] = useState<'pending' | 'active' | 'rejected' | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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
        password: Math.random().toString(36).slice(-8)
    });

    const [settings, setSettings] = useState({
        platformCommission: 3,
        withdrawalMinimum: 50,
        automatedPayouts: true,
        vendorAutoApproval: false,
        maintenanceMode: false,
        productCategories: [...DEFAULT_PRODUCT_CATEGORY_LABELS] as string[],
    });
    const [newCategoryName, setNewCategoryName] = useState('');

    // Pagination States
    const [vendorsPage, setVendorsPage] = useState(1);
    const [customersPage, setCustomersPage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);
    const [productsPage, setProductsPage] = useState(1);
    const [dashboardTab, setDashboardTab] = useState<'graph' | 'transactions' | 'activity'>('graph');
    const itemsPerPage = 8;

    const disputeByOrderId = useMemo(() => {
        const map = new Map<string, any>();
        (allDisputes || []).forEach((d: any) => {
            const oid = String(d.orderId?._id ?? d.orderId ?? '');
            if (oid) map.set(oid, d);
        });
        return map;
    }, [allDisputes]);

    const updateSettings = async (updates: Partial<typeof settings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings); // Optimistic update

        try {

            // Map frontend key to backend key
            const backendUpdates: any = {};
            if (updates.platformCommission !== undefined) backendUpdates.platform_commission = updates.platformCommission;
            if (updates.withdrawalMinimum !== undefined) backendUpdates.withdrawal_minimum = updates.withdrawalMinimum;
            if (updates.maintenanceMode !== undefined) backendUpdates.maintenance_mode = updates.maintenanceMode;
            if (updates.automatedPayouts !== undefined) backendUpdates.automated_payouts = updates.automatedPayouts;
            if (updates.vendorAutoApproval !== undefined) backendUpdates.vendor_auto_approval = updates.vendorAutoApproval;
            if (updates.productCategories !== undefined) {
                backendUpdates.product_categories = normalizeCategoryList(updates.productCategories);
            }

            if (Object.keys(backendUpdates).length > 0) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/settings`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify(backendUpdates)
                });

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Settings Saved',
                    showConfirmButton: false,
                    timer: 2000
                });
            }

            console.log('Settings updated on backend:', backendUpdates);
        } catch (error) {
            console.error('Failed to update settings', error);
            // Revert on failure
            setSettings(settings);
            Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not save settings to server.' });
        }
    };

    const refreshData = async () => {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fla_token') : null);
        if (!authToken) return;
        setLoading(true);
        try {

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            };

            const [statsRes, ordersRes, usersRes, productsRes, allDisputesRes, settingsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/dashboard/admin/stats`, { headers, credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders?page=1&limit=500`, { headers, credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users`, { headers, credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products?showAll=true`, { headers, credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/support/my-disputes`, { headers, credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/settings`, { headers, credentials: 'include' })
            ]);

            if (statsRes.ok) setAdminData(await statsRes.json());
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setAllOrders(ordersData.orders ? ordersData.orders : (Array.isArray(ordersData) ? ordersData : []));
            }
            if (usersRes.ok) setAllUsers(await usersRes.json());
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                const list = Array.isArray(productsData)
                    ? productsData
                    : Array.isArray(productsData?.products)
                        ? productsData.products
                        : [];
                setAllProducts(list);
            }
            if (allDisputesRes.ok) setAllDisputes(await allDisputesRes.json());
            if (settingsRes.ok) {
                const fetchedSettings = await settingsRes.json();
                setSettings(prev => ({
                    ...prev,
                    platformCommission: fetchedSettings.platform_commission ?? prev.platformCommission,
                    withdrawalMinimum: fetchedSettings.withdrawal_minimum ?? prev.withdrawalMinimum,
                    maintenanceMode: fetchedSettings.maintenance_mode ?? prev.maintenanceMode,
                    automatedPayouts: fetchedSettings.automated_payouts ?? prev.automatedPayouts,
                    vendorAutoApproval: fetchedSettings.vendor_auto_approval ?? prev.vendorAutoApproval,
                    productCategories: normalizeCategoryList(
                        fetchedSettings.product_categories ?? prev.productCategories,
                    ),
                }));
            }

            const kycRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/admin/kyc`, { headers, credentials: 'include' });
            if (kycRes.ok) setKycVendors(await kycRes.json());

            const kycRefereesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/admin/referees/kyc`, { headers, credentials: 'include' });
            if (kycRefereesRes.ok) setKycReferees(await kycRefereesRes.json());
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
            setHasLoadedOnce(true);
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'End Session?',
            text: "Are you sure you want to sign out of the Admin HQ?",
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
                router.push('/auth?view=login');
            }
        });
    };

    useEffect(() => {
        if (isAuthLoading) return;

        if (typeof window !== 'undefined') {
            if (isAuthenticated) {
                if (user?.role === 'customer') {
                    router.push('/dashboard');
                    return;
                }
                if (user?.role === 'vendor') {
                    router.push('/vendor');
                    return;
                }
            }

            if (!isAuthenticated) {
                router.push('/auth');
                return;
            }

            if (user?.role !== 'admin') {
                router.push('/auth');
                return;
            }
            
            // If already authenticated and admin, fetch data
            refreshData();
        }
    }, [isAuthenticated, user, token, router, isAuthLoading]);

    const handleUpdateUserStatus = async (userId: string, status: string) => {
        const actionText = status === 'active' ? 'ACTIVATE this user?' : 'SUSPEND this user?';
        const confirmButtonText = status === 'active' ? 'YES, ACTIVATE' : 'YES, SUSPEND';
        const confirmButtonColor = status === 'active' ? '#0F172A' : '#E11D48';

        const result = await Swal.fire({
            title: 'CONFIRM STATUS CHANGE',
            text: `Are you sure you want to ${actionText}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmButtonColor,
            cancelButtonColor: '#F1F5F9',
            cancelButtonText: '<span style="color: #64748b">CANCEL</span>',
            confirmButtonText: confirmButtonText,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                title: 'text-xl font-black text-slate-900 tracking-tighter uppercase',
                htmlContainer: 'text-slate-500 font-medium text-sm'
            }
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update user status');

            await refreshData();

            Swal.fire({
                icon: 'success',
                title: 'USER UPDATED',
                text: `Status successfully changed to ${status}`,
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[32px]' }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message });
        }
    };

    const handleKYCAction = async (userId: string, status: 'active' | 'rejected') => {
        const isReferee = kycReferees.some((r) => r._id === userId);
        const actionText = status === 'active' ? `APPROVE this ${isReferee ? 'referee' : 'vendor'}?` : 'REJECT this application?';
        const confirmButtonText = status === 'active' ? 'YES, APPROVE' : 'YES, REJECT';
        const confirmButtonColor = status === 'active' ? '#0F172A' : '#E11D48';

        const result = await Swal.fire({
            title: 'CONFIRM ACTION',
            text: `Are you sure you want to ${actionText}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmButtonColor,
            cancelButtonColor: '#F1F5F9',
            cancelButtonText: '<span style="color: #64748b">CANCEL</span>',
            confirmButtonText: confirmButtonText,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                title: 'text-xl font-black text-slate-900 tracking-tighter uppercase',
                htmlContainer: 'text-slate-500 font-medium text-sm'
            }
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/admin/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update KYC status');

            if (status === 'active' && isReferee) {
                Swal.fire({
                    icon: 'success',
                    title: 'REFEREE APPROVED',
                    text: 'Their Paystack payout account is being linked and they have been notified by SMS.',
                    timer: 2500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[32px]' },
                });
            } else if (status === 'active') {
                const agreementUrl = `/admin/vendors/${userId}/agreement`;
                const next = await Swal.fire({
                    icon: 'success',
                    title: 'VENDOR APPROVED',
                    html: 'Documents approved — uploads are unlocked immediately, free of charge.<br/><br/>Next: <strong>preview and download</strong> the partnership agreement.',
                    showCancelButton: true,
                    confirmButtonText: 'Review & download letter',
                    cancelButtonText: 'Later',
                    confirmButtonColor: '#0F2744',
                    cancelButtonColor: '#E2E8F0',
                    customClass: {
                        popup: 'rounded-[32px] border-none shadow-2xl',
                        title: 'text-xl font-black text-slate-900 tracking-tighter uppercase',
                        htmlContainer: 'text-slate-500 font-medium text-sm',
                    },
                });
                if (next.isConfirmed) {
                    window.open(agreementUrl, '_blank', 'noopener,noreferrer');
                }
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'KYC REJECTED',
                    text: 'The registration has been declined.',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[32px]' },
                });
            }

            await refreshData();
            const optimisticUpdate = (prev: any) =>
                prev && prev._id === userId
                    ? {
                        ...prev,
                        status,
                        ...(status === 'active'
                            ? { kycApprovedAt: prev.kycApprovedAt || new Date().toISOString() }
                            : {}),
                    }
                    : prev;
            setSelectedKycVendor(optimisticUpdate);
            setSelectedKycReferee(optimisticUpdate);
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Action Failed', text: error.message });
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
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
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
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ isActive: !currentStatus })
            });
            await refreshData();
            Swal.fire({
                icon: 'success',
                title: !currentStatus ? 'PRODUCT ACTIVATED' : 'PRODUCT HIDDEN',
                timer: 1500,
                showConfirmButton: false
            });
            setSelectedProduct((prev: any) =>
                prev && prev._id === productId ? { ...prev, isActive: !currentStatus } : prev,
            );
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
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/products/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
                });
                await refreshData();
                setSelectedProduct(null);
                Swal.fire('Purged!', 'Design removed from archives.', 'success');
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleResolveDispute = async (orderId: string, resolution: 'refund' | 'release') => {
        const result = await Swal.fire({
            title: resolution === 'refund' ? 'REFUND CUSTOMER?' : 'RELEASE TO VENDOR?',
            text: resolution === 'refund'
                ? "Marks the dispute resolved for the customer. Process any Paystack refund manually if needed."
                : "Marks the dispute resolved in favor of the vendor. Paystack payment already went to the vendor at checkout.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'CONFIRM RESOLUTION',
            buttonsStyling: false,
            customClass: {
                confirmButton: `px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest mr-4 ${resolution === 'refund' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`,
                cancelButton: 'bg-slate-100 text-slate-400 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest'
            }
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/${orderId}/resolve-dispute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ resolution })
                });

                if (!response.ok) throw new Error('Failed to resolve dispute');

                await refreshData();
                Swal.fire('Resolved!', `Dispute has been settled via ${resolution}.`, 'success');
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleAdminCreateVendor = async (data: any) => {
        setIsSubmitting(true);
        try {
            Swal.fire({
                title: 'Onboarding Vendor...',
                html: '<div class="text-slate-600 text-sm">Uploading documents and creating profile...</div>',
                didOpen: () => Swal.showLoading(),
                allowOutsideClick: false,
                customClass: { popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white' }
            });

            const uploadFile = async (file: File | null) => {
                if (!file) return null;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/public`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!res.ok) throw new Error('Document upload failed. Please try again.');
                const result = await res.json();
                return result.url;
            };

            const ghanaCardFrontUrl = await uploadFile(data.kyc?.ghanaCardFront);
            const ghanaCardBackUrl = await uploadFile(data.kyc?.ghanaCardBack);
            const selfieUrl = await uploadFile(data.kyc?.selfie);
            const utilityBillUrl = await uploadFile(data.kyc?.utilityBill);
            const businessRegistrationUrl = await uploadFile(data.kyc?.businessRegistration);

            const vendorData = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                region: data.region,
                password: data.password,
                shopName: data.shopName,
                productTypes: data.productTypes,
                paymentMethods: [{
                    type: 'momo',
                    network: data.momoProvider || 'MTN',
                    accountNumber: data.momoNumber,
                    accountName: data.accountName || data.name
                }],
                ghanaCardFront: ghanaCardFrontUrl,
                ghanaCardBack: ghanaCardBackUrl,
                ghanaCardNumber: data.kyc?.ghanaCardNumber,
                selfie: selfieUrl,
                digitalAddress: data.kyc?.digitalAddress,
                dob: data.kyc?.dob,
                utilityBill: utilityBillUrl,
                utilityType: data.kyc?.utilityType,
                businessRegistration: businessRegistrationUrl,
                employeeCount: data.kyc?.employeeCount,
                yearsOfExistence: data.kyc?.yearsOfExistence,
                bio: data.kyc?.bio,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/admin/create-vendor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(vendorData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create vendor');
            }

            await refreshData();
            setShowAddVendorModal(false);

            Swal.fire({
                icon: 'success',
                title: 'VENDOR CREATED',
                text: 'Vendor has been successfully onboarded with auto-approved KYC.',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[32px]' }
            });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Action Failed', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Admin HQ...</p>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    if (loading && !hasLoadedOnce) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading dashboard data...</p>
            </div>
        );
    }

    const sidebarItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'kyc', label: 'KYC Approvals', icon: ShieldCheck },
        { id: 'referees', label: 'Referee Approvals', icon: Link2 },
        { id: 'vendors', label: 'Vendors', icon: Store },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'billboards', label: 'Billboards', icon: Megaphone },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    const statsCards = [
        { id: 'orders' as const, label: 'Platform Commission', value: `GH₵ ${adminData?.totalCommission?.toLocaleString() || '0'}`, icon: ShieldCheck, iconWrap: 'bg-violet-50', iconColor: 'text-violet-600' },
        { id: 'orders' as const, label: 'Total Revenue', value: `GH₵ ${adminData?.totalRevenue?.toLocaleString() || '0'}`, icon: Wallet, iconWrap: 'bg-amber-50', iconColor: 'text-amber-600' },
        { id: 'orders' as const, label: 'Total Orders', value: adminData?.totalOrders?.toString() || '0', icon: ShoppingBag, iconWrap: 'bg-sky-50', iconColor: 'text-sky-600' },
        { id: 'vendors' as const, label: 'Total Vendors', value: adminData?.totalVendors?.toString() || '0', icon: ShieldCheck, iconWrap: 'bg-fuchsia-50', iconColor: 'text-fuchsia-600' },
        { id: 'products' as const, label: 'Total Products', value: adminData?.totalProducts?.toString() || '0', icon: Package, iconWrap: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    ];

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                            {statsCards.map((stat, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveSection(stat.id)}
                                    className="bg-white p-4 md:p-5 rounded-none border border-slate-200 relative group hover:border-slate-400 hover:bg-slate-50 transition-colors text-left outline-none focus:ring-2 focus:ring-slate-900/10"
                                >
                                    <div className={`w-8 h-8 md:w-9 md:h-9 ${stat.iconWrap} rounded-none flex items-center justify-center mb-3 md:mb-4`}>
                                        <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                                    </div>
                                    <p className="text-slate-500 text-[11px] md:text-xs font-medium tracking-wide leading-none mb-1.5 md:mb-2">{stat.label}</p>
                                    <p className="text-lg md:text-2xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
                                </button>
                            ))}
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-100 gap-8">
                            <button 
                                onClick={() => setDashboardTab('graph')}
                                className={`pb-4 text-sm font-semibold tracking-tight transition-all relative ${dashboardTab === 'graph' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Revenue Analytics
                                {dashboardTab === 'graph' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in slide-in-from-bottom-1" />}
                            </button>
                            <button 
                                onClick={() => setDashboardTab('transactions')}
                                className={`pb-4 text-sm font-semibold tracking-tight transition-all relative ${dashboardTab === 'transactions' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Recent Transactions
                                {dashboardTab === 'transactions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in slide-in-from-bottom-1" />}
                            </button>
                            <button 
                                onClick={() => setDashboardTab('activity')}
                                className={`pb-4 text-sm font-semibold tracking-tight transition-all relative ${dashboardTab === 'activity' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Platform Activity
                                {dashboardTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in slide-in-from-bottom-1" />}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="animate-in fade-in duration-500">
                            {dashboardTab === 'graph' && <RevenueChart initialData={adminData?.chartData || []} />}
                            
                            {dashboardTab === 'transactions' && (
                                <RecentTransactionsTable orders={allOrders} />
                            )}

                            {dashboardTab === 'activity' && (
                                <div className="bg-white border border-slate-200 rounded-none overflow-hidden flex flex-col min-h-[500px]">
                                    <div className="p-8 border-b border-slate-200 flex justify-between items-center">
                                        <h2 className="font-semibold text-slate-900 text-sm tracking-tight">System Audit Log</h2>
                                        <BarChart3 className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <div className="flex-1 p-12 text-center text-slate-300 flex flex-col items-center justify-center">
                                        <Shield className="w-16 h-16 mb-4 opacity-10" />
                                        <p className="text-xs font-black uppercase tracking-widest">Activity Audit Logs</p>
                                        <p className="text-[10px] mt-1">Real-time system events will appear here.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'kyc': {
                const kycStatusStyles: Record<string, string> = {
                    pending: 'bg-orange-50 text-orange-700 border-orange-100',
                    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
                    banned: 'bg-slate-900 text-white border-slate-900',
                };
                const kycStatusLabels: Record<string, string> = {
                    pending: 'Pending',
                    active: 'Approved',
                    rejected: 'Rejected',
                    banned: 'Suspended',
                };
                const getKycBucket = (v: any): 'pending' | 'active' | 'rejected' | 'all' => {
                    if (v.status === 'rejected' || v.status === 'banned') return 'rejected';
                    if (v.kycApprovedAt) return 'active';
                    if (v.status === 'pending' || (Boolean(v.kycSubmittedAt) && !v.kycApprovedAt)) return 'pending';
                    return 'all';
                };

                const getKycDisplayStatus = (v: any): { label: string; className: string } => {
                    if (v.status === 'rejected') {
                        return { label: 'Rejected', className: kycStatusStyles.rejected };
                    }
                    if (v.status === 'banned') {
                        return { label: 'Suspended', className: kycStatusStyles.banned };
                    }
                    if (v.kycApprovedAt) {
                        return { label: 'Approved', className: kycStatusStyles.active };
                    }
                    if (v.kycSubmittedAt) {
                        return { label: 'Docs under review', className: kycStatusStyles.pending };
                    }
                    if (v.status === 'pending') {
                        return { label: 'Pending', className: kycStatusStyles.pending };
                    }
                    return { label: 'No docs yet', className: 'bg-sky-50 text-sky-700 border-sky-100' };
                };

                const filteredKycVendors = (kycFilter === 'all'
                    ? kycVendors
                    : kycVendors.filter((v) => getKycBucket(v) === kycFilter)
                ).filter((v) => {
                    if (!searchQuery.trim()) return true;
                    const momo = v.paymentMethods?.[0];
                    const q = searchQuery.toLowerCase();
                    return [
                        v.name,
                        v.email,
                        v.shopName,
                        v.phone,
                        v.location,
                        v.region,
                        v.uniqueVendorId,
                        v.ghanaCardNumber,
                        momo?.accountNumber,
                        momo?.network,
                    ].some((f) => f?.toLowerCase().includes(q));
                });
                const pendingKycCount = kycVendors.filter((v) => getKycBucket(v) === 'pending').length;
                const approvedKycCount = kycVendors.filter((v) => getKycBucket(v) === 'active').length;
                const rejectedKycCount = kycVendors.filter((v) => getKycBucket(v) === 'rejected').length;

                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">KYC & Compliance</h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {filteredKycVendors.length} record{filteredKycVendors.length === 1 ? '' : 's'}
                                    {searchQuery.trim() ? ' matching search' : ''}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white px-4 py-3 border border-slate-200 flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[11px] font-medium text-slate-500">Pending</p>
                                        <p className="text-lg font-semibold text-slate-900 leading-none mt-0.5">{pendingKycCount}</p>
                                    </div>
                                    <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="bg-white px-4 py-3 border border-slate-200 flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[11px] font-medium text-slate-500">Approved</p>
                                        <p className="text-lg font-semibold text-slate-900 leading-none mt-0.5">{approvedKycCount}</p>
                                    </div>
                                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex flex-wrap gap-2">
                                {([
                                    { id: 'all', label: 'All' },
                                    { id: 'pending', label: 'Pending' },
                                    { id: 'active', label: 'Approved' },
                                    { id: 'rejected', label: 'Rejected' },
                                ] as const).map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setKycFilter(tab.id)}
                                        className={`h-9 px-3.5 text-sm font-medium border transition-colors ${
                                            kycFilter === tab.id
                                                ? 'bg-brand-blue text-white border-brand-blue'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className="ml-1.5 opacity-70">
                                            {tab.id === 'all'
                                                ? kycVendors.length
                                                : tab.id === 'pending'
                                                    ? pendingKycCount
                                                    : tab.id === 'active'
                                                        ? approvedKycCount
                                                        : tab.id === 'rejected'
                                                            ? rejectedKycCount
                                                            : 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full sm:max-w-xs sm:ml-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Search KYC records…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-white border border-slate-300 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 overflow-hidden">
                            <div className="admin-table-scroll">
                                <table className="w-full text-left border-collapse min-w-[860px]">
                                    <thead>
                                        <tr className="bg-brand-blue">
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">S/N</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Vendor</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Contact</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Location</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Docs</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Status</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredKycVendors.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                                                    {kycFilter === 'pending'
                                                        ? 'No pending vendor registrations.'
                                                        : 'No KYC records match this filter.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredKycVendors.map((v, i) => {
                                                const kyc = getShuftiKycStatus(v);
                                                const kycDisplay = getKycDisplayStatus(v);
                                                const docCount = [
                                                    v.ghanaCardFront,
                                                    v.ghanaCardBack,
                                                    v.selfie,
                                                    v.utilityBill,
                                                    v.businessRegistration,
                                                ].filter(Boolean).length;
                                                return (
                                                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-5 py-4 text-xs font-medium text-slate-400 tabular-nums">{i + 1}</td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <VendorAvatar profileImage={v.profileImage} name={v.name} shopName={v.shopName} size={40} />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{v.shopName || v.name}</p>
                                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{v.uniqueVendorId || `#${String(v._id).slice(-6)}`}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <p className="text-sm text-slate-800 truncate max-w-[180px]">{v.name}</p>
                                                            <p className="text-xs text-slate-500 truncate max-w-[180px]">{v.email}</p>
                                                            <p className="text-xs text-slate-400">{v.phone || '—'}</p>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                            {[v.location, v.region].filter(Boolean).join(', ') || '—'}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm font-medium text-slate-800">{docCount}/5</span>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">{kyc.label}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium border ${kycDisplay.className}`}>
                                                                {kycDisplay.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setSelectedKycVendor(v);
                                                                }}
                                                                className="inline-flex items-center gap-1.5 h-9 px-3 border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-brand-blue hover:text-brand-blue transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'referees': {
                const refereeStatusStyles: Record<string, string> = {
                    pending: 'bg-orange-50 text-orange-700 border-orange-100',
                    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
                    banned: 'bg-slate-900 text-white border-slate-900',
                };
                const getRefereeBucket = (v: any): 'pending' | 'active' | 'rejected' | 'all' => {
                    if (v.status === 'rejected' || v.status === 'banned') return 'rejected';
                    if (v.kycApprovedAt) return 'active';
                    if (v.status === 'pending' || (Boolean(v.kycSubmittedAt) && !v.kycApprovedAt)) return 'pending';
                    return 'all';
                };
                const getRefereeDisplayStatus = (v: any): { label: string; className: string } => {
                    if (v.status === 'rejected') return { label: 'Rejected', className: refereeStatusStyles.rejected };
                    if (v.status === 'banned') return { label: 'Suspended', className: refereeStatusStyles.banned };
                    if (v.kycApprovedAt) return { label: 'Approved', className: refereeStatusStyles.active };
                    if (v.kycSubmittedAt) return { label: 'Docs under review', className: refereeStatusStyles.pending };
                    return { label: 'Pending', className: refereeStatusStyles.pending };
                };

                const filteredKycReferees = (kycRefereeFilter === 'all'
                    ? kycReferees
                    : kycReferees.filter((v) => getRefereeBucket(v) === kycRefereeFilter)
                ).filter((v) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return [v.name, v.email, v.phone, v.region, v.refereeCode].some((f) => f?.toLowerCase?.().includes(q));
                });
                const pendingRefereeCount = kycReferees.filter((v) => getRefereeBucket(v) === 'pending').length;
                const approvedRefereeCount = kycReferees.filter((v) => getRefereeBucket(v) === 'active').length;
                const rejectedRefereeCount = kycReferees.filter((v) => getRefereeBucket(v) === 'rejected').length;

                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Referee Approvals</h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {filteredKycReferees.length} record{filteredKycReferees.length === 1 ? '' : 's'}
                                    {searchQuery.trim() ? ' matching search' : ''}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white px-4 py-3 border border-slate-200 flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[11px] font-medium text-slate-500">Pending</p>
                                        <p className="text-lg font-semibold text-slate-900 leading-none mt-0.5">{pendingRefereeCount}</p>
                                    </div>
                                    <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="bg-white px-4 py-3 border border-slate-200 flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[11px] font-medium text-slate-500">Approved</p>
                                        <p className="text-lg font-semibold text-slate-900 leading-none mt-0.5">{approvedRefereeCount}</p>
                                    </div>
                                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex flex-wrap gap-2">
                                {([
                                    { id: 'all', label: 'All' },
                                    { id: 'pending', label: 'Pending' },
                                    { id: 'active', label: 'Approved' },
                                    { id: 'rejected', label: 'Rejected' },
                                ] as const).map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setKycRefereeFilter(tab.id)}
                                        className={`h-9 px-3.5 text-sm font-medium border transition-colors ${
                                            kycRefereeFilter === tab.id
                                                ? 'bg-brand-blue text-white border-brand-blue'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className="ml-1.5 opacity-70">
                                            {tab.id === 'all'
                                                ? kycReferees.length
                                                : tab.id === 'pending'
                                                    ? pendingRefereeCount
                                                    : tab.id === 'active'
                                                        ? approvedRefereeCount
                                                        : rejectedRefereeCount}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full sm:max-w-xs sm:ml-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Search referees…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-white border border-slate-300 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 overflow-hidden">
                            <div className="admin-table-scroll">
                                <table className="w-full text-left border-collapse min-w-[780px]">
                                    <thead>
                                        <tr className="bg-brand-blue">
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">S/N</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Referee</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Contact</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Region</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Selfie</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Status</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredKycReferees.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                                                    {kycRefereeFilter === 'pending' ? 'No pending referee applications.' : 'No referee records match this filter.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredKycReferees.map((v, i) => {
                                                const display = getRefereeDisplayStatus(v);
                                                return (
                                                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-5 py-4 text-xs font-medium text-slate-400 tabular-nums">{i + 1}</td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-full bg-brand-lemon text-slate-900 flex items-center justify-center font-black shrink-0">
                                                                    {(v.name || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{v.name}</p>
                                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{v.refereeCode || `#${String(v._id).slice(-6)}`}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs text-slate-500 truncate max-w-[180px]">{v.email}</p>
                                                            <p className="text-xs text-slate-400">{v.phone || '—'}</p>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-600">{v.region || '—'}</td>
                                                        <td className="px-5 py-4 text-sm font-medium text-slate-800">{v.selfie ? 'Submitted' : '—'}</td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium border ${display.className}`}>
                                                                {display.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="inline-flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setSelectedKycReferee(v);
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 h-9 px-3 border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-brand-blue hover:text-brand-blue transition-colors"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    View
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDeleteUser(v._id);
                                                                    }}
                                                                    className="inline-flex items-center justify-center h-9 w-9 border border-slate-300 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                                    aria-label="Delete referee"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'vendors':
                const filteredVendors = (allUsers || []).filter(u => 
                    u.role === 'vendor' && (
                        !searchQuery ||
                        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
                const paginatedVendors = (filteredVendors || []).slice((vendorsPage - 1) * itemsPerPage, vendorsPage * itemsPerPage);
                const vendorsTotalPages = Math.ceil((filteredVendors || []).length / itemsPerPage);

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
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setVendorsPage(1); }}
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
                            {paginatedVendors.map((u, i) => (
                                <div key={u._id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-4 min-w-0">
                                            <VendorAvatar profileImage={u.profileImage} name={u.name} shopName={u.shopName} size={56} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{u.shopName || u.name}</p>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${u.vendorTier === 'high' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {u.vendorTier === 'high' ? 'High Tier' : 'Low Tier'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : u.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`} />
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.status || 'Active'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 tabular-nums flex-shrink-0">
                                            #{(vendorsPage - 1) * itemsPerPage + i + 1}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-y border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">{countVendorProducts(allProducts, u._id)} Products</span>
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

                        {filteredVendors.length > 0 && (
                            <div className="md:hidden px-2 py-6 bg-slate-50 border border-slate-100 rounded-[24px] flex flex-col justify-between items-center gap-4 mb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Displaying <span className="text-slate-900">{(vendorsPage - 1) * itemsPerPage + 1} - {Math.min(vendorsPage * itemsPerPage, filteredVendors.length)}</span> of <span className="text-slate-900">{filteredVendors.length}</span> Studios
                                </p>
                                {vendorsTotalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setVendorsPage(prev => Math.max(1, prev - 1))}
                                            disabled={vendorsPage === 1}
                                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                        >
                                            Prev
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(vendorsTotalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setVendorsPage(i + 1)}
                                                    className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                                        vendorsPage === i + 1
                                                            ? 'bg-slate-900 text-white shadow-lg'
                                                            : 'text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setVendorsPage(prev => Math.min(vendorsTotalPages, prev + 1))}
                                            disabled={vendorsPage === vendorsTotalPages}
                                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden md:flex flex-col bg-white rounded-none border border-slate-200 overflow-hidden">
                            <div className="admin-table-scroll">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-brand-blue">
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">S/N</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Studio Profile</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Contact & Location</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Inventory</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Settlement Channel</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedVendors.map((u, i) => (
                                            <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 text-xs font-black text-slate-400 tabular-nums">{(vendorsPage - 1) * itemsPerPage + i + 1}</td>
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="flex items-center gap-6">
                                                    <VendorAvatar profileImage={u.profileImage} name={u.name} shopName={u.shopName} size={44} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-slate-900 text-base mb-1">{u.shopName || u.name}</p>
                                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${u.vendorTier === 'high' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                {u.vendorTier === 'high' ? 'High Tier' : 'Low Tier'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : u.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`} />
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.status || 'Active'}</p>
                                                        </div>
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
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-brand-lemon" />
                                                    <span className="text-sm font-black text-slate-900">{countVendorProducts(allProducts, u._id)}</span>
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
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-lemon text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" /> Approve Studio
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateUserStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')}
                                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                                                        >
                                                            {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                                        </button>
                                                    )}

                                                    <button 
                                                        onClick={() => handleDeleteUser(u._id)} 
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        {vendorsTotalPages > 1 && (
                            <div className="hidden md:flex px-10 py-6 bg-slate-50 border-t border-slate-100 flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">
                                    Displaying <span className="text-slate-900">{(vendorsPage - 1) * itemsPerPage + 1} - {Math.min(vendorsPage * itemsPerPage, filteredVendors.length)}</span> of <span className="text-slate-900">{filteredVendors.length}</span> Studios
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setVendorsPage(prev => Math.max(1, prev - 1))}
                                        disabled={vendorsPage === 1}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(vendorsTotalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setVendorsPage(i + 1)}
                                                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                                    vendorsPage === i + 1
                                                        ? 'bg-slate-900 text-white shadow-lg'
                                                        : 'text-slate-400 hover:bg-slate-200'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setVendorsPage(prev => Math.min(vendorsTotalPages, prev + 1))}
                                        disabled={vendorsPage === vendorsTotalPages}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'customers':
                const filteredPatrons = (allUsers || []).filter(u => 
                    u.role === 'customer' && (
                        !searchQuery ||
                        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
                const paginatedPatrons = (filteredPatrons || []).slice((customersPage - 1) * itemsPerPage, customersPage * itemsPerPage);
                const totalPatronPages = Math.ceil((filteredPatrons || []).length / itemsPerPage);

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
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCustomersPage(1); }}
                                    className="w-full pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-lemon/10 md:min-w-[340px] shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Mobile Grid View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {paginatedPatrons.map((u) => (
                                <div key={u._id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden relative border-2 border-white shadow-md">
                                            {u.profileImage ? <Image src={getImageUrl(u.profileImage)} alt={u.name} fill sizes="56px" className="object-cover" /> : u.name?.[0] || 'U'}
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
                        <div className="hidden md:block bg-white rounded-none border border-slate-200 overflow-hidden">
                            <div className="admin-table-scroll">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-brand-blue">
                                    <tr>
                                        <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">S/N</th>
                                        <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Customer Profile</th>
                                        <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Contact & Location</th>
                                        <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedPatrons.map((u, i) => (
                                        <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 text-xs font-black text-slate-400 tabular-nums">{(customersPage - 1) * itemsPerPage + i + 1}</td>
                                            <td className="px-8 py-6 border-r border-slate-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white overflow-hidden relative border border-slate-100/10">
                                                        {u.profileImage ? <Image src={getImageUrl(u.profileImage)} alt={u.name} fill sizes="40px" className="object-cover" /> : u.name?.[0] || 'U'}
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
                                                    <button 
                                                        onClick={() => handleUpdateUserStatus(u._id, u.status === 'suspended' ? 'active' : 'suspended')} 
                                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                                                    >
                                                        {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                                    </button>

                                                    <button 
                                                        onClick={() => handleDeleteUser(u._id)} 
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        {totalPatronPages > 1 && (
                            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Displaying <span className="text-slate-900">{(customersPage - 1) * itemsPerPage + 1} - {Math.min(customersPage * itemsPerPage, filteredPatrons.length)}</span> of <span className="text-slate-900">{filteredPatrons.length}</span> Patrons
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCustomersPage(prev => Math.max(1, prev - 1))}
                                        disabled={customersPage === 1}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPatronPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCustomersPage(i + 1)}
                                                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                                    customersPage === i + 1 
                                                        ? 'bg-slate-900 text-white shadow-lg' 
                                                        : 'text-slate-400 hover:bg-slate-200'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCustomersPage(prev => Math.min(totalPatronPages, prev + 1))}
                                        disabled={customersPage === totalPatronPages}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'products': {
                const productList = Array.isArray(allProducts) ? allProducts : [];
                const filteredProducts = productList.filter((p) => {
                    const q = searchQuery.toLowerCase().trim();
                    if (!q) return true;
                    const vendor = (allUsers || []).find((u) => String(u._id) === resolveProductVendorId(p));
                    return [p.name, p.category, p.vendorName, vendor?.shopName, vendor?.name, p._id].some((f) =>
                        String(f || '').toLowerCase().includes(q),
                    );
                });
                const productsPerPage = 10;
                const productsTotalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
                const safeProductsPage = Math.min(productsPage, productsTotalPages);
                const paginatedProducts = filteredProducts.slice(
                    (safeProductsPage - 1) * productsPerPage,
                    safeProductsPage * productsPerPage,
                );
                const pageWindow = (() => {
                    const pages: (number | '…')[] = [];
                    const total = productsTotalPages;
                    const current = safeProductsPage;
                    if (total <= 7) {
                        for (let i = 1; i <= total; i++) pages.push(i);
                        return pages;
                    }
                    pages.push(1);
                    if (current > 3) pages.push('…');
                    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
                    if (current < total - 2) pages.push('…');
                    pages.push(total);
                    return pages;
                })();

                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Marketplace Inventory</h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
                                    {searchQuery.trim() ? ' matching search' : ' in catalog'}
                                </p>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search name, category, vendor…"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setProductsPage(1); }}
                                    className="w-full sm:min-w-[320px] h-11 pl-10 pr-4 bg-white border border-slate-300 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 overflow-hidden">
                            <div className="admin-table-scroll">
                                <table className="w-full text-left border-collapse min-w-[720px]">
                                    <thead>
                                        <tr className="bg-brand-blue">
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">S/N</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Product</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Vendor</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Store link</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Category</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Price</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide">Status</th>
                                            <th className="px-5 py-3.5 text-[11px] font-medium text-white/75 tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-16 text-center text-sm text-slate-400">
                                                    {productList.length === 0 ? 'No products found.' : 'No products match your search.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedProducts.map((p, i) => {
                                                const vendor = (allUsers || []).find((u) => String(u._id) === resolveProductVendorId(p));
                                                const vendorLabel = p.vendorName || vendor?.shopName || vendor?.name || '—';
                                                const storeSlug = resolveProductStoreSlug(p, allUsers || []);
                                                return (
                                                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-5 py-4 text-xs font-medium text-slate-400 tabular-nums">
                                                            {(safeProductsPage - 1) * productsPerPage + i + 1}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="relative w-12 h-14 bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                                    <Image
                                                                        src={getImageUrl(p.images?.[0])}
                                                                        alt={p.name || 'Product'}
                                                                        fill
                                                                        sizes="48px"
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[220px]">{p.name}</p>
                                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">#{String(p._id).slice(-8).toUpperCase()}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-700 max-w-[160px] truncate">{vendorLabel}</td>
                                                        <td className="px-5 py-4">
                                                            {storeSlug ? (
                                                                <Link
                                                                    href={storeHomePath(storeSlug)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline max-w-[180px]"
                                                                    title={`/store/${storeSlug}`}
                                                                >
                                                                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="truncate">/store/{storeSlug}</span>
                                                                    <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                                                </Link>
                                                            ) : (
                                                                <span className="text-sm text-slate-400">No link yet</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-600">{p.category || '—'}</td>
                                                        <td className="px-5 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                            GH₵ {Number(p.price || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium border ${
                                                                p.isActive
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}>
                                                                {p.isActive ? 'Active' : 'Hidden'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedProduct(p)}
                                                                className="inline-flex items-center gap-1.5 h-9 px-3 border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-brand-blue hover:text-brand-blue transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredProducts.length > 0 && (
                                <div className="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50">
                                    <p className="text-xs text-slate-500">
                                        Showing{' '}
                                        <span className="font-semibold text-slate-800">
                                            {(safeProductsPage - 1) * productsPerPage + 1}–{Math.min(safeProductsPage * productsPerPage, filteredProducts.length)}
                                        </span>{' '}
                                        of <span className="font-semibold text-slate-800">{filteredProducts.length}</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setProductsPage((prev) => Math.max(1, prev - 1))}
                                            disabled={safeProductsPage === 1}
                                            className="h-9 px-3 border border-slate-300 bg-white text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                                        >
                                            Prev
                                        </button>
                                        {pageWindow.map((page, idx) =>
                                            page === '…' ? (
                                                <span key={`e-${idx}`} className="w-9 text-center text-slate-400 text-xs">…</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() => setProductsPage(page)}
                                                    className={`w-9 h-9 text-xs font-medium border transition-colors ${
                                                        safeProductsPage === page
                                                            ? 'bg-brand-blue text-white border-brand-blue'
                                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ),
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setProductsPage((prev) => Math.min(productsTotalPages, prev + 1))}
                                            disabled={safeProductsPage === productsTotalPages}
                                            className="h-9 px-3 border border-slate-300 bg-white text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            case 'orders':
            case 'delivery': {
                const isDelivery = activeSection === 'delivery';
                const displayOrders = isDelivery
                    ? (allOrders || []).filter(o => ['processing', 'shipped', 'delivered'].includes(o.status))
                    : (allOrders || []);
                
                const filteredOrders = (displayOrders || []).filter(o => 
                    o._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                const paginatedOrders = (filteredOrders || []).slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
                const ordersTotalPages = Math.ceil((filteredOrders || []).length / itemsPerPage);

                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                    {isDelivery ? 'Logistics & Dispatch' : 'Order Ledger'}
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    {isDelivery ? 'Monitor shipping tracking and final deliveries.' : 'Paystack-paid orders and platform order history.'}
                                </p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setOrdersPage(1); }}
                                    className="w-full pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-lemon/10 md:min-w-[340px] shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Mobile Grid View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {paginatedOrders.map((o) => (
                                <div key={o._id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {o.items?.[0] && (
                                                <div className="relative w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                                                    <Image src={getImageUrl(o.items[0].image)} alt="Product" fill sizes="48px" className="object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">#ORD-{o._id.slice(-6).toUpperCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                                                {o.items?.[0] && (
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                                                        {[
                                                            o.items[0].size && `Size: ${o.items[0].size}`,
                                                            o.items[0].color && `Color: ${o.items[0].color}`,
                                                        ].filter(Boolean).join(' · ') || 'No size/color'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter bg-slate-100 text-slate-600">
                                            {(o.status || 'pending').replace(/_/g, ' ')}
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
                                            <span className="text-emerald-600">GH₵ {getOrderCommissionMeta(o, settings.platformCommission).fee.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(o)}
                                        className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 mt-2 hover:bg-slate-900 hover:text-white transition-all"
                                    >
                                        Order Itemization & Details
                                    </button>
                                </div>
                            ))}
                            {paginatedOrders.length === 0 && (
                                <p className="text-center text-sm text-slate-400 py-12">No orders found.</p>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:flex flex-col bg-white rounded-none border border-slate-200 overflow-hidden">
                            <div className="admin-table-scroll">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-brand-blue">
                                        <tr>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Preview / Reference</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Customer</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Payment Breakdown</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Order Status</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide text-right">Context</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedOrders.map((o) => {
                                            const commission = getOrderCommissionMeta(o, settings.platformCommission);
                                            return (
                                            <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                    <div className="flex items-center gap-4">
                                                        {o.items?.[0] && (
                                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm relative">
                                                                <Image src={getImageUrl(o.items[0].image)} alt="Product" fill sizes="56px" className="object-cover" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm">#ORD-{o._id.slice(-6).toUpperCase()}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                                                            {o.items?.[0] && (
                                                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 max-w-[180px]">
                                                                    {[
                                                                        o.items[0].size && `Size: ${o.items[0].size}`,
                                                                        o.items[0].color && `Color: ${o.items[0].color}`,
                                                                    ].filter(Boolean).join(' · ') || null}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                    <p className="text-xs font-black text-slate-700">{o.customerName || 'Guest'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{o.customerEmail}</p>
                                                </td>
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center gap-4">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">Gross</span>
                                                            <span className="text-sm font-black text-slate-900 tabular-nums">GH₵ {commission.gross.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-4">
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase">Fee ({commission.rateLabel}%)</span>
                                                            <span className="text-[10px] font-black text-emerald-600 tabular-nums">GH₵ {commission.fee.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-4 pt-1 border-t border-slate-100">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">Vendor Net</span>
                                                            <span className="text-[10px] font-black text-slate-900 tabular-nums">GH₵ {commission.net.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-r border-slate-50">
                                                    <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter bg-slate-100 text-slate-700">
                                                        {(o.status || 'pending').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedOrder(o)}
                                                        className="px-5 py-2 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {ordersTotalPages > 1 && (
                            <div className="px-4 md:px-10 py-6 bg-white border border-slate-200 rounded-2xl md:rounded-none flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">
                                    Showing <span className="text-slate-900">{(ordersPage - 1) * itemsPerPage + 1} - {Math.min(ordersPage * itemsPerPage, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span> Orders
                                </p>
                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                    <button
                                        onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                                        disabled={ordersPage === 1}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1 flex-wrap justify-center max-w-[280px] md:max-w-none">
                                        {Array.from({ length: ordersTotalPages }, (_, i) => i + 1)
                                            .filter((page) => {
                                                if (ordersTotalPages <= 9) return true;
                                                if (page === 1 || page === ordersTotalPages) return true;
                                                return Math.abs(page - ordersPage) <= 2;
                                            })
                                            .map((page, idx, arr) => {
                                                const prev = arr[idx - 1];
                                                const showEllipsis = prev != null && page - prev > 1;
                                                return (
                                                    <span key={page} className="inline-flex items-center gap-1">
                                                        {showEllipsis && (
                                                            <span className="w-6 text-center text-slate-300 text-[10px] font-black">…</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setOrdersPage(page)}
                                                            className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                                                ordersPage === page
                                                                    ? 'bg-slate-900 text-white shadow-lg'
                                                                    : 'text-slate-400 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                    </div>
                                    <button
                                        onClick={() => setOrdersPage(prev => Math.min(ordersTotalPages, prev + 1))}
                                        disabled={ordersPage === ordersTotalPages}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'disputes': {
                const disputedOrders = (allOrders || []).filter(o => o.status === 'disputed');
                const q = searchQuery.trim().toLowerCase();
                const filteredDisputedOrders = disputedOrders.filter((o) => {
                    if (!q) return true;
                    const itemNames = o.items?.map((i: { name?: string }) => i.name).join(' ');
                    return [
                        o._id,
                        o.customerName,
                        o.customerEmail,
                        o.vendorName,
                        itemNames,
                    ].some((f) => f?.toLowerCase().includes(q));
                });
                const filteredDisputeLedgers = (allDisputes || []).filter((d) => {
                    if (!q) return true;
                    return [d.orderId, d.category, d.description, d.status].some((f) =>
                        String(f ?? '').toLowerCase().includes(q),
                    );
                });
                const openLedgerCount = (allDisputes || []).filter(d => d.status === 'pending').length;
                const resolvedLedgerCount = (allDisputes || []).filter(d => d.status === 'resolved').length;

                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end gap-6 flex-wrap">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Dispute Resolution Center</h1>
                                <p className="text-slate-500 text-sm">
                                    Review the order snapshot, mediate in Dispute Center, then close the case for the customer or vendor.
                                </p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disputed orders</p>
                                    <p className="text-2xl font-black text-slate-900">{disputedOrders.length}</p>
                                </div>
                                <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-right">
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Open ledgers</p>
                                    <p className="text-2xl font-black text-orange-600">{openLedgerCount}</p>
                                </div>
                                <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 shadow-sm text-right">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resolved ledgers</p>
                                    <p className="text-2xl font-black text-emerald-600">{resolvedLedgerCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="search"
                                placeholder="Search disputes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white py-3 pl-11 pr-4 rounded-2xl border border-slate-100 text-xs font-bold focus:ring-2 focus:ring-brand-lemon/20 transition-all shadow-sm"
                            />
                        </div>

                        {filteredDisputedOrders.length > 0 ? (
                            <div className="space-y-8">
                                {filteredDisputedOrders.map((o) => (
                                    <AdminDisputeCaseCard
                                        key={o._id}
                                        order={o}
                                        supportDispute={disputeByOrderId.get(String(o._id))}
                                        onRefund={() => handleResolveDispute(o._id, 'refund')}
                                        onRelease={() => handleResolveDispute(o._id, 'release')}
                                    />
                                ))}
                            </div>
                        ) : disputedOrders.length > 0 ? (
                            <div className="py-12 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No disputed orders match your search</p>
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200 mx-4 md:mx-0">
                                <ShieldCheck className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No disputed orders</p>
                                <p className="text-[10px] text-slate-300 mt-1">Orders with status &quot;disputed&quot; appear here with full snapshots.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">All dispute ledgers</h2>
                            <div className="bg-white rounded-none border border-slate-200 overflow-hidden">
                                <div className="admin-table-scroll">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-brand-blue">
                                        <tr>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Order ref</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Category</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide">Status</th>
                                            <th className="px-8 py-4 text-[11px] font-medium text-white/75 tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredDisputeLedgers.length > 0 ? (
                                            filteredDisputeLedgers.map((dispute) => (
                                                <tr key={dispute._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6 border-r border-slate-50">
                                                        <p className="font-black text-slate-900 text-sm uppercase">
                                                            #ORD-{String(dispute.orderId).slice(-8).toUpperCase()}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                                                            Opened {new Date(dispute.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-6 border-r border-slate-50">
                                                        <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{dispute.category}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-1">{dispute.description}</p>
                                                    </td>
                                                    <td className="px-8 py-6 border-r border-slate-50">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            dispute.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                            {dispute.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Link
                                                            href={`/dispute/${dispute._id}`}
                                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-brand-lemon rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            Open Dispute Center
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-16 text-center">
                                                    <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                        {(allDisputes || []).length > 0
                                                            ? 'No dispute ledgers match your search'
                                                            : 'No dispute ledgers on file'}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'reports':
                const reportCustomers = (allUsers || []).filter(u => u.role === 'customer');
                const newCustomersThisMonth = (reportCustomers || []).filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length;
                const activeCustomers = (reportCustomers || []).filter(u => u.status === 'active').length;

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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 md:p-8 rounded-none border border-slate-200">
                                <p className="text-slate-500 text-xs font-medium tracking-wide mb-2">Total Customers</p>
                                <p className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">{reportCustomers.length}</p>
                                <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-medium">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>+12% vs last month</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 md:p-8 rounded-none border border-slate-200">
                                <p className="text-slate-500 text-xs font-medium tracking-wide mb-2">New Signups (This Month)</p>
                                <p className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">{newCustomersThisMonth}</p>
                                <div className="mt-4 text-slate-500 text-xs font-medium">
                                    <span>Fresh arrivals to the platform</span>
                                </div>
                            </div>
                            <div className="bg-white p-6 md:p-8 rounded-none border border-slate-200">
                                <p className="text-slate-500 text-xs font-medium tracking-wide mb-2">Active Accounts</p>
                                <p className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">{activeCustomers}</p>
                                <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-medium">
                                    <div className="w-2 h-2 rounded-none bg-slate-900"></div>
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
            case 'billboards': {
                const vendors = (Array.isArray(allUsers) ? allUsers : []).filter(
                    (u: any) => u.role === 'vendor',
                );
                return (
                    <AdminBillboards
                        token={token}
                        vendors={vendors}
                        products={Array.isArray(allProducts) ? allProducts : []}
                    />
                );
            }
            case 'settings':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">System Configuration</h1>
                                <p className="text-slate-500 text-sm">Control platform variables, fees, and operational status.</p>
                            </div>
                            <div className="self-start shrink-0 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3" />
                                All Systems Operational
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {/* Financial Settings */}
                            <div className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
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
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">Platform Commission</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Global adjustable fee taken from every sale.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={settings.platformCommission}
                                                onChange={(e) => updateSettings({ platformCommission: Number(e.target.value) })}
                                                className="w-20 px-3 py-2 text-center font-black bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                                            />
                                            <span className="text-xs font-black text-slate-400">%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">Withdrawal Minimum</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Min amount allowed for payouts.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400">GH₵</span>
                                            <input
                                                type="number"
                                                value={settings.withdrawalMinimum}
                                                onChange={(e) => updateSettings({ withdrawalMinimum: Number(e.target.value) })}
                                                className="w-20 px-3 py-2 text-center font-black bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                                            />
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
                            <div className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
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

                            {/* Product categories */}
                            <div className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-brand-lemon/80 rounded-xl flex items-center justify-center text-slate-900">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Product Categories</h3>
                                        <p className="text-xs text-slate-400 font-bold">Shown on shop, home, navbar, and vendor product forms.</p>
                                    </div>
                                </div>
                                <form
                                    className="flex flex-col sm:flex-row gap-3 mb-5"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const name = newCategoryName.trim();
                                        if (!name) return;
                                        if (name.toLowerCase() === 'all product' || name.toLowerCase() === 'all') {
                                            Swal.fire({ icon: 'info', title: '"All" is reserved', text: 'That label is used as a filter, not a category.' });
                                            return;
                                        }
                                        if (settings.productCategories.some((c) => c.toLowerCase() === name.toLowerCase())) {
                                            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Category already exists', showConfirmButton: false, timer: 1800 });
                                            return;
                                        }
                                        const next = normalizeCategoryList([...settings.productCategories, name]);
                                        setNewCategoryName('');
                                        updateSettings({ productCategories: next });
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="e.g. Sports & outdoors"
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-lemon/30 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add category
                                    </button>
                                </form>
                                <div className="flex flex-wrap gap-2">
                                    {settings.productCategories.map((cat) => (
                                        <span
                                            key={cat}
                                            className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                                        >
                                            {cat}
                                            <button
                                                type="button"
                                                aria-label={`Remove ${cat}`}
                                                onClick={() => {
                                                    const next = settings.productCategories.filter((c) => c !== cat);
                                                    if (!next.length) {
                                                        Swal.fire({ icon: 'warning', title: 'Keep at least one', text: 'You need at least one product category.' });
                                                        return;
                                                    }
                                                    updateSettings({ productCategories: next });
                                                }}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Profile */}
                            <div className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Admin Profile</h3>
                                        <p className="text-xs text-slate-400 font-bold">Update your credentials.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                        <Link href="/" className="flex items-center gap-3">
                            <Image 
                                src="/logo.jpeg" 
                                alt="FLA HQ" 
                                width={40} 
                                height={40} 
                                className="object-contain rounded-xl shadow-lg shadow-brand-lemon/10"
                                style={{ width: 'auto', height: '40px' }}
                            />
                            <span className="text-xl font-bold tracking-tight text-brand-lemon">HQ</span>
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
                                    w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-semibold tracking-tight transition-all duration-300
                                    ${activeSection === item.id
                                        ? 'bg-brand-lemon text-slate-900 shadow-lg shadow-brand-lemon/10 shadow-inner'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
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
                                <p className="text-sm font-semibold tracking-tight truncate">{user.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium truncate">System Admin</p>
                            </div>
                        </div>
                        <Link href="/">
                            <button className="w-full flex items-center gap-4 px-6 py-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl text-sm font-semibold tracking-tight transition-all group mb-2 text-left">
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Launch Store
                            </button>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-3.5 text-red-400 hover:bg-red-500/10 rounded-2xl text-sm font-semibold tracking-tight transition-all group text-left"
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
                            <p className="text-sm font-semibold text-slate-900 tracking-tight">{user?.name}</p>
                            <p className="text-[10px] font-medium text-brand-lemon bg-slate-900 px-2.5 py-0.5 rounded-full inline-block tracking-wide mt-0.5">System Administrator</p>
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
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                                {sidebarItems.find(i => i.id === activeSection)?.label}
                            </h1>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {(activeSection === 'dashboard' || activeSection === 'vendors') && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddVendorModal(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-brand-lemon rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm md:hidden"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add vendor
                                </button>
                            )}
                            <div className="hidden md:flex gap-3">
                                {(activeSection === 'dashboard' || activeSection === 'vendors') && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddVendorModal(true)}
                                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-brand-lemon rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add vendor
                                    </button>
                                )}
                                <Link href="/">
                                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Launch Store
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </header>

                    {renderSection()}
                </div>
            </main>
            {/* Add Vendor Modal */}
            {showAddVendorModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <button
                        type="button"
                        aria-label="Close overlay"
                        className="absolute inset-0 cursor-default"
                        onClick={() => setShowAddVendorModal(false)}
                    />
                    <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-none rounded-t-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 h-[92dvh] sm:h-auto sm:max-h-[min(880px,90vh)] flex flex-col border border-slate-200">
                        <div className="shrink-0 px-5 py-4 sm:px-8 sm:py-5 bg-brand-blue text-white flex justify-between items-center gap-4">
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-xl font-semibold tracking-tight truncate">Onboard vendor</h3>
                                <p className="text-white/65 text-sm mt-0.5">Create account, send credentials, then preview & download agreement</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddVendorModal(false)}
                                className="w-9 h-9 shrink-0 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col">
                            <AdminOnboardVendorForm
                                token={token}
                                onCreated={() => refreshData()}
                                onClose={() => setShowAddVendorModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500"
                        onClick={() => setSelectedOrder(null)}
                    />
                    <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500 overflow-hidden">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-6 right-6 z-50 bg-slate-100 text-slate-900 rounded-full p-2.5 shadow-sm hover:bg-slate-900 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-brand-lemon text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">Order Log</span>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${selectedOrder.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {selectedOrder.isPaid ? 'Payment Verified' : 'Awaiting Settlement'}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">#ORD-{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Recorded on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Customer & Shipping */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <User className="w-3 h-3" /> Patron Contact
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-900 text-base">{selectedOrder.customerName || 'Anonymous Guest'}</p>
                                            <p className="text-sm font-medium text-slate-600">{selectedOrder.customerEmail}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Truck className="w-3 h-3" /> Delivery Destination
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-900 text-sm">{selectedOrder.shippingAddress}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedOrder.shippingCity}, {selectedOrder.shippingRegion}</p>
                                        </div>
                                    </div>

                                </div>

                                {/* Financial Summary */}
                                <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Wallet className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 relative z-10">Commission Breakdown</h3>
                                    <div className="space-y-6 relative z-10">
                                        {(() => {
                                            const commission = getOrderCommissionMeta(selectedOrder, settings.platformCommission);
                                            return (
                                                <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-xs font-bold uppercase">Order Gross Total</span>
                                            <span className="text-xl font-black">GH₵ {commission.gross.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-red-400 pb-4 border-b border-white/10">
                                            <span className="text-[10px] font-black uppercase">App Commission ({commission.rateLabel}%)</span>
                                            <span className="font-black">- GH₵ {commission.fee.toLocaleString()}</span>
                                        </div>
                                        <div className="pt-4 flex justify-between items-center">
                                            <span className="text-brand-lemon text-xs font-black uppercase">Vendor Net Share</span>
                                            <span className="text-2xl font-black text-brand-lemon">GH₵ {commission.net.toLocaleString()}</span>
                                        </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Itemized List */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchased Designs</h3>
                                <div className="bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden">
                                    {/* Mobile View: Cards */}
                                    <div className="md:hidden divide-y divide-slate-100">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white p-6 space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-20 bg-slate-50 rounded-xl overflow-hidden relative flex-shrink-0 shadow-sm border border-slate-100">
                                                        <Image src={getImageUrl(item.image)} alt={item.name} fill sizes="64px" className="object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-slate-900 text-[13px] uppercase tracking-tighter truncate">{item.name}</h4>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {item.size && (
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">SIZE: {item.size}</span>
                                                            )}
                                                            {item.color && (
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">COLOR: {item.color}</span>
                                                            )}
                                                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black uppercase tracking-widest">QTY: {item.quantity}</span>
                                                        </div>
                                                        <p className="text-sm font-black text-slate-900 mt-3 tabular-nums">GH₵ {item.price.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-brand-blue">
                                                <tr>
                                                    <th className="px-6 py-4 text-[11px] font-medium text-white/75 tracking-wide">Product</th>
                                                    <th className="px-6 py-4 text-[11px] font-medium text-white/75 tracking-wide">Variation</th>
                                                    <th className="px-6 py-4 text-[11px] font-medium text-white/75 tracking-wide text-center">Qty</th>
                                                    <th className="px-6 py-4 text-[11px] font-medium text-white/75 tracking-wide text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedOrder.items?.map((item: any, idx: number) => (
                                                    <tr key={idx} className="bg-white">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-16 bg-slate-50 rounded-lg overflow-hidden relative flex-shrink-0">
                                                                    <Image src={getImageUrl(item.image)} alt={item.name} fill sizes="48px" className="object-cover" />
                                                                </div>
                                                                <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{item.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                {item.size && (
                                                                    <span className="text-xs font-bold text-slate-600 uppercase">Size: {item.size}</span>
                                                                )}
                                                                {item.color && (
                                                                    <span className="text-xs font-bold text-slate-600 uppercase">Color: {item.color}</span>
                                                                )}
                                                                {!item.size && !item.color && (
                                                                    <span className="text-xs font-bold text-slate-400 uppercase">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-slate-900 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="font-black text-slate-900">GH₵ {item.price.toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="flex flex-col md:flex-row gap-4 pt-6">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="flex-1 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-full active:scale-95 transition-all"
                                >
                                    Close Archive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedProduct && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <button
                        type="button"
                        aria-label="Close product details"
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setSelectedProduct(null)}
                    />
                    <div className="relative bg-white w-full sm:max-w-3xl border border-slate-200 shadow-2xl max-h-[92dvh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="shrink-0 px-5 py-4 sm:px-6 bg-brand-blue text-white flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs text-white/60 mb-1">Product details</p>
                                <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{selectedProduct.name}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="w-9 h-9 shrink-0 bg-white/10 hover:bg-white/20 flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5">
                                <div className="relative aspect-[3/4] sm:aspect-auto sm:h-56 bg-slate-100 border border-slate-200 overflow-hidden">
                                    <Image
                                        src={getImageUrl(selectedProduct.images?.[0])}
                                        alt={selectedProduct.name || 'Product'}
                                        fill
                                        sizes="180px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500 mb-1">Price</p>
                                            <p className="font-semibold text-slate-900">GH₵ {Number(selectedProduct.price || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500 mb-1">Status</p>
                                            <p className={`font-semibold ${selectedProduct.isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                {selectedProduct.isActive ? 'Active' : 'Hidden'}
                                            </p>
                                        </div>
                                        <div className="border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500 mb-1">Category</p>
                                            <p className="font-semibold text-slate-900">{selectedProduct.category || '—'}</p>
                                        </div>
                                        <div className="border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500 mb-1">Stock</p>
                                            <p className="font-semibold text-slate-900">
                                                {selectedProduct.stock ?? selectedProduct.quantity ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 p-3">
                                        <p className="text-[11px] text-slate-500 mb-1">Vendor</p>
                                        <p className="font-semibold text-slate-900">
                                            {selectedProduct.vendorName
                                                || (allUsers || []).find((u) => String(u._id) === resolveProductVendorId(selectedProduct))?.shopName
                                                || '—'}
                                        </p>
                                    </div>
                                    {(() => {
                                        const slug = resolveProductStoreSlug(selectedProduct, allUsers || []);
                                        return (
                                            <div className="border border-slate-200 p-3">
                                                <p className="text-[11px] text-slate-500 mb-1">Store link</p>
                                                {slug ? (
                                                    <Link
                                                        href={storeHomePath(slug)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline break-all"
                                                    >
                                                        /store/{slug}
                                                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                    </Link>
                                                ) : (
                                                    <p className="font-semibold text-slate-400">No link yet</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <div className="border border-slate-200 p-3">
                                        <p className="text-[11px] text-slate-500 mb-1">Product ID</p>
                                        <p className="font-mono text-xs text-slate-700 break-all">{selectedProduct._id}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedProduct.description && (
                                <div className="border border-slate-200 p-4">
                                    <p className="text-[11px] text-slate-500 mb-2">Description</p>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                                </div>
                            )}

                            {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                                <div>
                                    <p className="text-[11px] text-slate-500 mb-2">Gallery</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {selectedProduct.images.map((img: string, idx: number) => (
                                            <div key={idx} className="relative w-16 h-20 shrink-0 border border-slate-200 bg-slate-50 overflow-hidden">
                                                <Image src={getImageUrl(img)} alt="" fill sizes="64px" className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 flex flex-col sm:flex-row gap-2">
                            <button
                                type="button"
                                onClick={() => handleToggleProductStatus(selectedProduct._id, selectedProduct.isActive)}
                                className="inline-flex items-center justify-center gap-2 h-11 px-4 border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:bg-slate-100"
                            >
                                {selectedProduct.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {selectedProduct.isActive ? 'Hide listing' : 'Show listing'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteProduct(selectedProduct._id)}
                                className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-blue text-white text-sm font-medium hover:bg-slate-800 sm:ml-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedKycVendor && typeof document !== 'undefined' && createPortal((() => {
                const v = selectedKycVendor;
                const kyc = getShuftiKycStatus(v);
                const momo = v.paymentMethods?.[0];
                const detail = (label: string, value?: unknown) => (
                    <div className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                        <span className="text-[11px] font-medium text-slate-500 shrink-0">{label}</span>
                        <span className="text-sm font-medium text-slate-900 text-right break-all">{formatKycDetailValue(value)}</span>
                    </div>
                );
                const docs = [
                    { label: 'Ghana Card (F)', value: v.ghanaCardFront, icon: CreditCard },
                    { label: 'Ghana Card (B)', value: v.ghanaCardBack, icon: CreditCard },
                    { label: 'Selfie', value: v.selfie, icon: Camera },
                    { label: 'Utility Bill', value: v.utilityBill, icon: FileText },
                    { label: 'Business Reg.', value: v.businessRegistration, icon: FileText },
                ];
                return (
                    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="KYC details">
                        <button
                            type="button"
                            aria-label="Close KYC details"
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedKycVendor(null)}
                        />
                        <div className="relative z-10 bg-white w-full sm:max-w-4xl min-h-[50vh] border border-slate-200 shadow-2xl max-h-[92dvh] overflow-hidden flex flex-col">
                            <div className="shrink-0 px-5 py-4 sm:px-6 bg-brand-blue text-white flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-white/60 mb-1">KYC details</p>
                                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{v.shopName || v.name || 'Vendor'}</h2>
                                    <p className="text-sm text-white/70 mt-0.5 truncate">{v.email || '—'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedKycVendor(null)}
                                    className="w-9 h-9 shrink-0 bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
                                <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium border ${
                                        v.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100'
                                            : v.status === 'active' && !v.kycApprovedAt ? 'bg-sky-50 text-sky-700 border-sky-100'
                                            : v.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : v.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {v.status === 'pending'
                                            ? 'Pending'
                                            : v.status === 'active' && !v.kycApprovedAt
                                                ? (v.kycSubmittedAt ? 'Docs under review' : 'Exploring — no docs yet')
                                                : v.status === 'active'
                                                    ? 'Cleared to sell'
                                                    : v.status === 'rejected'
                                                        ? 'Rejected'
                                                        : (v.status || 'Unknown')}
                                    </span>
                                    <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium border ${kycToneClasses[kyc.tone] || kycToneClasses.slate} border-transparent`}>
                                        {kyc.label}
                                    </span>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Contact & location</p>
                                        {detail('Full name', v.name)}
                                        {detail('Phone', v.phone)}
                                        {detail('Location', v.location)}
                                        {detail('Region', v.region)}
                                        {detail('Digital address', v.digitalAddress)}
                                    </div>
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Business profile</p>
                                        {detail('Shop name', v.shopName)}
                                        {detail('Product types', v.productTypes)}
                                        {detail('Employees', v.employeeCount)}
                                        {detail('Years active', v.yearsOfExistence)}
                                        {detail('Vendor tier', v.vendorTier)}
                                        {detail('Vendor ID', v.uniqueVendorId)}
                                    </div>
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Identity</p>
                                        {detail('Ghana Card No.', v.ghanaCardNumber)}
                                        {detail('Date of birth', v.dob)}
                                        {detail('Utility type', v.utilityType)}
                                        {detail('Registered', v.createdAt ? new Date(v.createdAt).toLocaleString() : null)}
                                        {detail('KYC approved', v.kycApprovedAt ? new Date(v.kycApprovedAt).toLocaleString() : null)}
                                    </div>
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Payout details</p>
                                        {detail('MoMo network', momo?.network)}
                                        {detail('MoMo number', v.momoNumber || momo?.accountNumber)}
                                        {detail('Account name', v.accountName || momo?.accountName)}
                                        {detail('Store slug', v.storeSlug ? `/store/${v.storeSlug}` : null)}
                                    </div>
                                    <div className="border border-slate-200 p-4 sm:col-span-2">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Subscription</p>
                                        {detail('Plan', v.subscriptionLabel || v.subscriptionPlan)}
                                        {detail('Price', v.subscriptionPriceText || (v.subscriptionPriceGhs ? `GHS ${v.subscriptionPriceGhs}` : null))}
                                        {detail('Starts', v.subscriptionStartsAt ? new Date(v.subscriptionStartsAt).toLocaleDateString() : null)}
                                        {detail('Ends', v.subscriptionEndsAt ? new Date(v.subscriptionEndsAt).toLocaleDateString() : null)}
                                        {detail(
                                            'Status',
                                            !v.subscriptionEndsAt
                                                ? 'Not set'
                                                : new Date(v.subscriptionEndsAt).getTime() > Date.now()
                                                    ? 'Active'
                                                    : 'Expired — uploads locked',
                                        )}
                                    </div>
                                </div>

                                {v.bio ? (
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Business description</p>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{String(v.bio)}</p>
                                    </div>
                                ) : null}

                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 mb-3">Submitted documents</p>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {docs.map((doc, i) => {
                                            const DocIcon = doc.icon;
                                            const rawUrl = typeof doc.value === 'string' ? doc.value : '';
                                            const href = rawUrl ? getImageUrl(rawUrl) : '';
                                            const showPreview = Boolean(href && isProbablyImageUrl(href));
                                            return (
                                                <div key={i} className="space-y-1.5">
                                                    <p className="text-[10px] font-medium text-slate-500">{doc.label}</p>
                                                    {href ? (
                                                        <button
                                                            type="button"
                                                            className="relative aspect-[4/3] w-full bg-slate-50 border border-slate-200 overflow-hidden group"
                                                            onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
                                                        >
                                                            {showPreview ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={href}
                                                                    alt={doc.label}
                                                                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500">
                                                                    <FileText className="w-6 h-6" />
                                                                    <span className="text-[10px] font-medium">Open file</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="aspect-[4/3] bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                                                            <DocIcon className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 flex flex-col sm:flex-row flex-wrap gap-2">
                                {(v.status === 'pending' || (v.status === 'active' && !v.kycApprovedAt)) && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleKYCAction(v._id, 'active')}
                                            className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-blue text-brand-lemon text-sm font-medium hover:bg-slate-800"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> {v.kycSubmittedAt ? 'Approve docs — allow selling' : 'Approve shop'}
                                        </button>
                                        {v.status === 'pending' && (
                                            <button
                                                type="button"
                                                onClick={() => handleKYCAction(v._id, 'rejected')}
                                                className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject KYC
                                            </button>
                                        )}
                                    </>
                                )}
                                {v.status === 'active' && v.kycApprovedAt && (
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateUserStatus(v._id, 'banned')}
                                        className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                                    >
                                        <ShieldAlert className="w-4 h-4" /> Suspend vendor
                                    </button>
                                )}
                                {(v.status === 'rejected' || v.status === 'banned') && (
                                    <button
                                        type="button"
                                        onClick={() => handleKYCAction(v._id, 'active')}
                                        className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Re-approve
                                    </button>
                                )}
                                <a
                                    href={`/admin/vendors/${v._id}/agreement`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 h-11 px-4 border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:bg-slate-100"
                                >
                                    <FileText className="w-4 h-4" /> Preview & download agreement
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setSelectedKycVendor(null)}
                                    className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-blue text-white text-sm font-medium hover:bg-slate-800 sm:ml-auto"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })(), document.body)}

            {selectedKycReferee && typeof document !== 'undefined' && createPortal((() => {
                const v = selectedKycReferee;
                const momo = v.paymentMethods?.[0];
                const detail = (label: string, value?: unknown) => (
                    <div className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                        <span className="text-[11px] font-medium text-slate-500 shrink-0">{label}</span>
                        <span className="text-sm font-medium text-slate-900 text-right break-all">{formatKycDetailValue(value)}</span>
                    </div>
                );
                const docs = [
                    { label: 'Ghana Card (F)', value: v.ghanaCardFront, icon: CreditCard },
                    { label: 'Ghana Card (B)', value: v.ghanaCardBack, icon: CreditCard },
                    { label: 'Selfie', value: v.selfie, icon: Camera },
                ];
                return (
                    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Referee details">
                        <button
                            type="button"
                            aria-label="Close referee details"
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedKycReferee(null)}
                        />
                        <div className="relative z-10 bg-white w-full sm:max-w-3xl min-h-[50vh] border border-slate-200 shadow-2xl max-h-[92dvh] overflow-hidden flex flex-col">
                            <div className="shrink-0 px-5 py-4 sm:px-6 bg-brand-blue text-white flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-white/60 mb-1">Referee details</p>
                                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{v.name || 'Referee'}</h2>
                                    <p className="text-sm text-white/70 mt-0.5 truncate">{v.email || '—'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedKycReferee(null)}
                                    className="w-9 h-9 shrink-0 bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
                                <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex px-2.5 py-1 text-[11px] font-medium border ${
                                        v.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100'
                                            : v.status === 'active' && v.kycApprovedAt ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : v.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {v.status === 'pending'
                                            ? 'Pending'
                                            : v.status === 'active' && v.kycApprovedAt
                                                ? 'Approved'
                                                : v.status === 'rejected'
                                                    ? 'Rejected'
                                                    : (v.status || 'Unknown')}
                                    </span>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Contact & location</p>
                                        {detail('Full name', v.name)}
                                        {detail('Phone', v.phone)}
                                        {detail('Region', v.region)}
                                        {detail('Referral code', v.refereeCode)}
                                        {detail('Store link', v.refereeStoreSlug ? `/ref/${v.refereeStoreSlug}` : null)}
                                        {v.tiktokLink ? (
                                            <div className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                                                <span className="text-[11px] font-medium text-slate-500 shrink-0">TikTok</span>
                                                <a href={v.tiktokLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-blue hover:underline text-right break-all">
                                                    {v.tiktokLink}
                                                </a>
                                            </div>
                                        ) : detail('TikTok', null)}
                                        {v.snapchatLink ? (
                                            <div className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                                                <span className="text-[11px] font-medium text-slate-500 shrink-0">Snapchat</span>
                                                <a href={v.snapchatLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-blue hover:underline text-right break-all">
                                                    {v.snapchatLink}
                                                </a>
                                            </div>
                                        ) : detail('Snapchat', null)}
                                    </div>
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Payout details</p>
                                        {detail('Network', momo?.network)}
                                        {detail('Number', momo?.accountNumber)}
                                        {detail('Account name', momo?.accountName)}
                                        {detail('Paystack subaccount', v.paystackSubaccountCode)}
                                    </div>
                                    <div className="border border-slate-200 p-4">
                                        <p className="text-[11px] font-semibold text-slate-500 mb-2">Identity</p>
                                        {detail('Registered', v.createdAt ? new Date(v.createdAt).toLocaleString() : null)}
                                        {detail('Approved', v.kycApprovedAt ? new Date(v.kycApprovedAt).toLocaleString() : null)}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 mb-3">Submitted documents</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {docs.map((doc, i) => {
                                            const DocIcon = doc.icon;
                                            const rawUrl = typeof doc.value === 'string' ? doc.value : '';
                                            const href = rawUrl ? getImageUrl(rawUrl) : '';
                                            const showPreview = Boolean(href && isProbablyImageUrl(href));
                                            return (
                                                <div key={i} className="space-y-1.5">
                                                    <p className="text-[10px] font-medium text-slate-500">{doc.label}</p>
                                                    {href ? (
                                                        <button
                                                            type="button"
                                                            className="relative aspect-[4/3] w-full bg-slate-50 border border-slate-200 overflow-hidden group"
                                                            onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
                                                        >
                                                            {showPreview ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={href}
                                                                    alt={doc.label}
                                                                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500">
                                                                    <FileText className="w-6 h-6" />
                                                                    <span className="text-[10px] font-medium">Open file</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="aspect-[4/3] bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                                                            <DocIcon className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 flex flex-col sm:flex-row flex-wrap gap-2">
                                {(v.status === 'pending' || (v.status === 'active' && !v.kycApprovedAt)) && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleKYCAction(v._id, 'active')}
                                            className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-blue text-brand-lemon text-sm font-medium hover:bg-slate-800"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Approve referee
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleKYCAction(v._id, 'rejected')}
                                            className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject application
                                        </button>
                                    </>
                                )}
                                {v.status === 'active' && v.kycApprovedAt && (
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateUserStatus(v._id, 'banned')}
                                        className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                                    >
                                        <ShieldAlert className="w-4 h-4" /> Suspend referee
                                    </button>
                                )}
                                {(v.status === 'rejected' || v.status === 'banned') && (
                                    <button
                                        type="button"
                                        onClick={() => handleKYCAction(v._id, 'active')}
                                        className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Re-approve
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDeleteUser(v._id);
                                        setSelectedKycReferee(null);
                                    }}
                                    className="inline-flex items-center justify-center gap-2 h-11 px-4 border border-rose-200 bg-white text-rose-600 text-sm font-medium hover:bg-rose-50"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete referee
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedKycReferee(null)}
                                    className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-blue text-white text-sm font-medium hover:bg-slate-800 sm:ml-auto"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })(), document.body)}
        </div>
    );
}
