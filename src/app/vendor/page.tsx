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
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import Swal from 'sweetalert2';
import { Suspense } from 'react';

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
import { WaybillModal } from '@/components/dashboard/WaybillModal';


import { GHANA_REGIONS } from '@/lib/ghana-regions';
import { useProductCategories } from '@/hooks/useProductCategories';
import { storeHomePath, storefrontUrl } from '@/lib/storefront';

type VendorSection = 'dashboard' | 'products' | 'orders' | 'wallet' | 'reviews' | 'notifications' | 'settings' | 'help';

const VENDOR_SECTIONS: VendorSection[] = [
    'dashboard', 'products', 'orders', 'wallet', 'reviews', 'notifications', 'settings', 'help',
];

const SUBSCRIPTION_ONE_TIME_GHS = 100;

function VendorDashboardInner() {
    const { categories: PRODUCT_CATEGORIES } = useProductCategories({ includeAll: true });
    const { user, token, logout, updateUser, changePassword, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get('tab') as VendorSection | null;
    const [activeSection, setActiveSectionState] = useState<VendorSection>(
        tabFromUrl && VENDOR_SECTIONS.includes(tabFromUrl) ? tabFromUrl : 'dashboard',
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [vendorOrders, setVendorOrders] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    // Performance and Logic States
    const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [commissionRate, setCommissionRate] = useState(3);
    const [withdrawalMin, setWithdrawalMin] = useState(50);
    const [printingOrder, setPrintingOrder] = useState<any>(null);

    // Form States
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formCategory, setFormCategory] = useState('Electronics');
    const [formQuantity, setFormQuantity] = useState('');
    const vendorProductCategories = PRODUCT_CATEGORIES.filter((c) => c !== 'All Product');
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
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [payingSubscription, setPayingSubscription] = useState(false);

    const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

    const PRESET_COLORS = [
        { label: 'Black', hex: '#000000' },
        { label: 'White', hex: '#FFFFFF' },
        { label: 'Cream', hex: '#F5F5DC' },
        { label: 'Navy', hex: '#000080' },
        { label: 'Red', hex: '#EF4444' },
        { label: 'Emerald', hex: '#10B981' },
        { label: 'Coffee', hex: '#6F4E37' },
        { label: 'Gold', hex: '#FFD700' },
        { label: 'Grey', hex: '#9CA3AF' },
        { label: 'Pattern', pattern: true as const },
    ];

    // Profile States
    const [shopName, setShopName] = useState('');
    const [phone, setPhone] = useState('');
    const [momoNumber, setMomoNumber] = useState('');
    const [momoNetwork, setMomoNetwork] = useState('MTN');
    const [accountName, setAccountName] = useState('');
    const [shopLocation, setShopLocation] = useState('');
    const [bio, setBio] = useState('');
    const [storeCategory, setStoreCategory] = useState('');
    const [storeAccentColor, setStoreAccentColor] = useState('#F6B01E');
    const [storeThemeColor, setStoreThemeColor] = useState('#0f2744');
    const [profileImage, setProfileImage] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const [businessRegistration, setBusinessRegistration] = useState('');
    const [ghanaCardFront, setGhanaCardFront] = useState('');
    const [ghanaCardBack, setGhanaCardBack] = useState('');
    const [selfie, setSelfie] = useState('');

    const isPendingReview = user?.status === 'pending' && user?.role === 'vendor';
    const mustChangePassword = Boolean(user?.mustChangePassword);
    const canSell = Boolean(user?.kycApprovedAt);
    const awaitingKycApproval = Boolean(user?.kycSubmittedAt && !user?.kycApprovedAt);
    const needsKycUpload = !canSell && !awaitingKycApproval;
    // Self-registered vendors are active immediately — never hard-lock the whole dashboard.
    // Only force settings when admin still marked them pending (legacy) or password change required.
    const limitedMode = isPendingReview;
    const subscriptionEndsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
    const subscriptionDaysLeft = subscriptionEndsAt && !Number.isNaN(subscriptionEndsAt.getTime())
        ? Math.ceil((subscriptionEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;
    const paymentRequired = Boolean(user?.subscriptionPaymentRequired);
    // Legacy: approved + no endsAt + no paywall flag = grandfathered (still can upload)
    const subscriptionExpired =
        canSell &&
        (paymentRequired ||
            (subscriptionEndsAt != null && (subscriptionDaysLeft == null || subscriptionDaysLeft <= 0)));
    const subscriptionExpiringSoon =
        canSell && !subscriptionExpired && subscriptionDaysLeft != null && subscriptionDaysLeft <= 5;
    const canUploadProducts = canSell && !subscriptionExpired;
    // Flat GHS 100 one-time payment for sales access — paid once, kept forever.
    const subscriptionAmountDue = SUBSCRIPTION_ONE_TIME_GHS;

    const setActiveSection = (section: VendorSection) => {
        setActiveSectionState(section);
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        params.delete('subscription');
        params.delete('reference');
        params.delete('trxref');
        params.set('tab', section);
        router.replace(`/vendor?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        const tab = searchParams.get('tab') as VendorSection | null;
        if (tab && VENDOR_SECTIONS.includes(tab) && tab !== activeSection) {
            setActiveSectionState(tab);
        }
    }, [searchParams, activeSection]);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Return from Paystack subscription checkout
    useEffect(() => {
        if (typeof window === 'undefined' || !token) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('subscription') !== 'paid') return;

        const reference =
            params.get('reference') ||
            params.get('trxref') ||
            sessionStorage.getItem('fla_sub_ref') ||
            '';

        (async () => {
            try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                if (reference) {
                    const res = await fetch(`${api}/payments/subscription/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        credentials: 'include',
                        body: JSON.stringify({ reference }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data?.vendor) {
                        updateUser(data.vendor);
                    }
                    // Refresh session fields either way
                    const me = await fetch(`${api}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                        credentials: 'include',
                    });
                    if (me.ok) {
                        const payload = await me.json();
                        if (payload.user) updateUser(payload.user);
                    }
                    sessionStorage.removeItem('fla_sub_ref');

                    const activated =
                        res.ok &&
                        (data?.activated === true ||
                            data?.vendor?.subscriptionPaymentRequired === false ||
                            Boolean(data?.vendor?.subscriptionEndsAt));

                    if (activated) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Subscription active',
                            text: 'You can upload products now.',
                            customClass: { popup: 'rounded-[32px]' },
                        });
                    } else {
                        Swal.fire({
                            icon: 'info',
                            title: 'Payment pending',
                            text: 'We could not confirm payment yet. If you paid, wait a moment and refresh — or tap Pay again if the charge did not go through.',
                            customClass: { popup: 'rounded-[32px]' },
                        });
                    }
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'No payment reference',
                        text: 'Open Overview and tap Pay on Paystack to complete your subscription.',
                        customClass: { popup: 'rounded-[32px]' },
                    });
                }
            } catch {
                /* webhook may still activate — refresh on next login */
            } finally {
                router.replace('/vendor?tab=dashboard');
            }
        })();
    }, [token, updateUser, router]);

    useEffect(() => {
        if (isPendingReview) {
            setActiveSection('settings');
        }
    }, [isPendingReview]);

    const handleForcedPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            Swal.fire('Too short', 'Use at least 8 characters for your new password.', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire('Mismatch', 'New password and confirmation do not match.', 'warning');
            return;
        }
        setChangingPassword(true);
        try {
            await changePassword(tempPassword, newPassword);
            Swal.fire({
                icon: 'success',
                title: 'Password updated',
                text: 'You can now explore your dashboard. Upload verification docs to unlock product listing.',
                timer: 2500,
                showConfirmButton: false,
            });
            setTempPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            Swal.fire('Failed', err.message || 'Could not update password', 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    useEffect(() => {
        if (user) {
            setShopName(user.shopName || '');
            setPhone(user.phone || '');
            setMomoNumber(user.momoNumber || '');
            setAccountName(user.accountName || '');
            setMomoNetwork(user.paymentMethods?.[0]?.network || 'MTN');
            setShopLocation(user.location || '');
            setBio(user.bio || '');
            setStoreCategory(user.productTypes || '');
            setStoreAccentColor(user.storeAccentColor || '#F6B01E');
            setStoreThemeColor(user.storeThemeColor || '#0f2744');
            if (user.productTypes) setFormCategory(user.productTypes);
            setProfileImage(user.profileImage || '');
            setBannerImage(user.bannerImage || '');
            setBusinessRegistration(user.businessRegistration || '');
            setGhanaCardFront((user as any).ghanaCardFront || '');
            setGhanaCardBack((user as any).ghanaCardBack || '');
            setSelfie((user as any).selfie || '');
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
                    fetch(`${api}/orders/vendor-orders?page=1&limit=500`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
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
                        colors: prod.colors || [],
                        hasColors: prod.hasColors !== undefined ? prod.hasColors : true,
                        isActive: prod.isActive
                    })));
                }

                if (ordsRes.status === 'fulfilled' && ordsRes.value.ok) {
                    const data = await ordsRes.value.json();
                    setVendorOrders(data.orders || data);
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
            Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Please fill in all core fields (name, price, description).' });
            return;
        }

        if (formQuantity === '' || Number.isNaN(parseInt(formQuantity, 10))) {
            Swal.fire({
                icon: 'warning',
                title: 'Stock Required',
                text: 'Please enter your stock quantity before publishing or updating this product.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }

        if (parseInt(formQuantity, 10) < 0) {
            Swal.fire({ icon: 'warning', title: 'Invalid Stock', text: 'Stock quantity cannot be negative.' });
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
            
            await res.json();

            const refreshVendorProducts = async () => {
                if (!token || !user?.id) return;
                const productsRes = await fetch(`${api}/products?vendorId=${user.id}&showAll=true`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
                });
                if (!productsRes.ok) return;
                const p = await productsRes.json();
                setVendorProducts(p.map((prod: any) => ({
                    id: prod._id,
                    name: prod.name,
                    price: prod.price.toString(),
                    image: prod.images?.[0] || '/product-1.jpg',
                    images: prod.images?.map((img: string, idx: number) => ({
                        url: img,
                        label: prod.imageLabels?.[idx] || 'Product',
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
                    colors: prod.colors || [],
                    hasColors: prod.hasColors !== undefined ? prod.hasColors : true,
                    isActive: prod.isActive,
                })));
            };

            await refreshVendorProducts();
            setShowAddProduct(false);
            resetProductForm();
            setActiveSection('products');

            const wasEditing = Boolean(editingProduct);
            const result = await Swal.fire({
                icon: 'success',
                title: wasEditing ? 'PRODUCT UPDATED' : 'PRODUCT PUBLISHED',
                text: 'Your shop inventory has been refreshed.',
                showCancelButton: true,
                confirmButtonText: 'ADD ANOTHER',
                cancelButtonText: 'BACK TO SHOP',
                confirmButtonColor: '#0f172a',
                customClass: { popup: 'rounded-[32px]' },
            });

            if (result.isConfirmed) {
                resetProductForm();
                setShowAddProduct(true);
            }
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
                const response = await fetch(`${api}/products/${id}`, { 
                    method: 'DELETE', 
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include' 
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Deletion failed on server');
                }

                setVendorProducts(prev => prev.filter(p => p.id !== id));
                Swal.fire({
                    icon: 'success',
                    title: 'DISCARDED',
                    text: 'Design removed successfully.',
                    customClass: { popup: 'rounded-[32px]' }
                });
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'DELETION FAILED',
                    text: err.message || 'The server could not process the removal.',
                    customClass: { popup: 'rounded-[32px]' }
                });
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
                body: JSON.stringify({ 
                    shopName, 
                    phone, 
                    productTypes: storeCategory || undefined,
                    storeAccentColor: storeAccentColor || undefined,
                    storeThemeColor: storeThemeColor || undefined,
                    momoNumber, 
                    accountName, 
                    location: shopLocation, 
                    bio, 
                    ...(profileImage ? { profileImage } : {}),
                    ...(bannerImage ? { bannerImage } : {}),
                    businessRegistration: businessRegistration || undefined,
                    ghanaCardFront: ghanaCardFront || undefined,
                    ghanaCardBack: ghanaCardBack || undefined,
                    selfie: selfie || undefined,
                    paymentMethods: [{
                        network: momoNetwork,
                        accountNumber: momoNumber,
                        accountName: accountName
                    }]
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = Array.isArray(errData.message)
                    ? errData.message.join(', ')
                    : errData.message;
                throw new Error(msg || 'Could not save store information');
            }
            const updated = await res.json();
            updateUser(updated);
            // Keep local doc previews in sync with what we just saved
            if (ghanaCardFront) setGhanaCardFront(ghanaCardFront);
            if (ghanaCardBack) setGhanaCardBack(ghanaCardBack);
            if (selfie) setSelfie(selfie);
            if (businessRegistration) setBusinessRegistration(businessRegistration);
            const submitted = Boolean(updated.kycSubmittedAt || (ghanaCardFront && selfie));
            Swal.fire({
                icon: 'success',
                title: user?.status === 'pending' ? 'DETAILS SAVED' : submitted ? 'DOCS SUBMITTED' : 'IDENTITY UPDATED',
                text: user?.status === 'pending'
                    ? 'Your MoMo and shop details are saved. Paystack payout is linked only after admin approves your documents.'
                    : submitted
                    ? 'Documents received. Approval usually takes 4–5 hours. After approval, open Overview and tap Pay on Paystack to unlock uploads.'
                    : 'Your information has been successfully saved. Upload Ghana Card + selfie to submit for approval.',
                customClass: { popup: 'rounded-[32px]' },
            });
        } catch (err: any) {
            Swal.fire('Update Failed', err?.message || 'Internal synchronization error.', 'error');
        }
    };

    const startSubscriptionPayment = async () => {
        if (!token) {
            Swal.fire('Sign in required', 'Please log in again to pay.', 'warning');
            return;
        }
        setPayingSubscription(true);
        try {
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${api}/payments/subscription/initialize`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                throw new Error(msg || 'Could not start Paystack payment');
            }

            // Temporary gateway bypass — server unlocked without charging
            if (data.unlocked) {
                if (data.vendor) {
                    updateUser({
                        subscriptionPaymentRequired: Boolean(data.vendor.subscriptionPaymentRequired),
                        subscriptionEndsAt: data.vendor.subscriptionEndsAt ?? null,
                        subscriptionStartsAt: data.vendor.subscriptionStartsAt ?? null,
                        subscriptionLastPaidAt: data.vendor.subscriptionLastPaidAt ?? null,
                        subscriptionPlan: data.vendor.subscriptionPlan,
                        subscriptionLabel: data.vendor.subscriptionLabel,
                        subscriptionPriceText: data.vendor.subscriptionPriceText,
                        subscriptionPriceGhs: data.vendor.subscriptionPriceGhs,
                    });
                }
                await Swal.fire({
                    icon: 'success',
                    title: 'UPLOADS UNLOCKED',
                    text: data.message || 'You can upload products now.',
                    customClass: { popup: 'rounded-[32px]' },
                });
                setActiveSection('products');
                return;
            }

            if (data.reference) {
                sessionStorage.setItem('fla_sub_ref', data.reference);
            }
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
                return;
            }
            throw new Error('No Paystack checkout URL returned');
        } catch (err: any) {
            Swal.fire('Payment failed', err?.message || 'Could not open Paystack', 'error');
        } finally {
            setPayingSubscription(false);
        }
    };

    const handleImageUpload = async (file: File, type: 'avatar' | 'banner' | 'doc' | 'ghanaFront' | 'ghanaBack' | 'selfie') => {
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
            else if (type === 'banner') setBannerImage(data.url);
            else if (type === 'doc') setBusinessRegistration(data.url);
            else if (type === 'ghanaFront') setGhanaCardFront(data.url);
            else if (type === 'ghanaBack') setGhanaCardBack(data.url);
            else if (type === 'selfie') setSelfie(data.url);
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

    const handleToggleProductVisibility = async (id: any, isCurrentlyActive: boolean) => {
        try {
            const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${api}/products/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({ isActive: !isCurrentlyActive }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Could not update product visibility');
            }

            setVendorProducts((prev) =>
                prev.map((p) => (p.id === id ? { ...p, isActive: !isCurrentlyActive } : p)),
            );

            Swal.fire({
                icon: 'success',
                title: isCurrentlyActive ? 'PRODUCT HIDDEN' : 'PRODUCT VISIBLE',
                text: isCurrentlyActive
                    ? 'This item is hidden from the marketplace until you show it again.'
                    : 'This item is now visible in your store.',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[32px]' },
            });
        } catch (err: any) {
            Swal.fire('Update Failed', err.message || 'Could not change product visibility.', 'error');
        }
    };

    const handleMarkShipped = async (id: string) => {
         // Logic handled in modular component
    };

    const resetProductForm = () => {
        setEditingProduct(null);
        setFormName('');
        setFormPrice('');
        setFormCategory(user?.productTypes || 'Electronics');
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
        setCustomSizeInput('');
    };

    const addCustomSize = () => {
        const size = customSizeInput.trim();
        if (!size) return;
        if (!formSizes.includes(size)) {
            setFormSizes((prev) => [...prev, size]);
        }
        setCustomSizeInput('');
    };

    const addCustomColor = () => {
        const color = customColorInput.trim();
        if (!color) return;
        if (!formColors.includes(color)) {
            setFormColors((prev) => [...prev, color]);
        }
        setCustomColorInput('');
    };

    const renderContent = () => {
        if (isPendingReview && activeSection !== 'settings') {
            return (
                <div className="max-w-lg mx-auto py-16 text-center space-y-4">
                    <Clock className="w-12 h-12 text-brand-lemon mx-auto" />
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Application under review</h2>
                    <p className="text-sm text-slate-500">Use <strong>Fix Application</strong> in the menu to update your MoMo number, account name, and shop details before approval.</p>
                    <button
                        type="button"
                        onClick={() => setActiveSection('settings')}
                        className="px-8 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                    >
                        Open Fix Application
                    </button>
                </div>
            );
        }

        switch (activeSection) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        {/* Always-visible subscription status — Pay button lives here */}
                        {(paymentRequired || subscriptionExpired || subscriptionExpiringSoon || !canSell) && (
                            <div
                                className={`p-6 md:p-8 rounded-[32px] border space-y-4 ${
                                    canSell && (paymentRequired || subscriptionExpired)
                                        ? 'bg-orange-50 border-orange-200'
                                        : subscriptionExpiringSoon
                                          ? 'bg-amber-50 border-amber-200'
                                          : 'bg-slate-50 border-slate-200'
                                }`}
                            >
                                <div className="space-y-2">
                                    <p
                                        className={`text-[10px] font-black uppercase tracking-widest ${
                                            canSell && (paymentRequired || subscriptionExpired)
                                                ? 'text-orange-900'
                                                : subscriptionExpiringSoon
                                                  ? 'text-amber-900'
                                                  : 'text-slate-500'
                                        }`}
                                    >
                                        {!canSell
                                            ? 'Subscription payment'
                                            : paymentRequired || subscriptionExpired
                                              ? paymentRequired
                                                  ? 'Pay to unlock product uploads'
                                                  : 'Subscription due — new uploads locked'
                                              : `Subscription ends in ${subscriptionDaysLeft} day${subscriptionDaysLeft === 1 ? '' : 's'}`}
                                    </p>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {!canSell
                                            ? awaitingKycApproval
                                                ? `After your documents are approved, pay GHS ${subscriptionAmountDue} here via Paystack — one time, yours forever.`
                                                : `Upload your Business Registration, Ghana Card, and selfie in Studio Identity first. After approval, pay GHS ${subscriptionAmountDue} here via Paystack to unlock uploads for good.`
                                            : paymentRequired
                                              ? `Your documents are approved. Tap below to pay GHS ${subscriptionAmountDue} on Paystack — a one-time payment, uploads unlock automatically and never expire.`
                                              : subscriptionExpired
                                                ? `Pay GHS ${subscriptionAmountDue} via Paystack to unlock. Existing listings stay live.`
                                                : `Pay via Paystack — GHS ${subscriptionAmountDue}. One time only, then uploads stay unlocked for good.`}
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        GHS {subscriptionAmountDue}
                                        <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            one-time
                                        </span>
                                    </p>
                                </div>
                                {canSell && (paymentRequired || subscriptionExpired || subscriptionExpiringSoon) ? (
                                    <button
                                        type="button"
                                        onClick={startSubscriptionPayment}
                                        disabled={payingSubscription}
                                        className="h-12 px-8 rounded-full bg-brand-lemon text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-60 shadow-sm"
                                    >
                                        {payingSubscription
                                            ? 'Unlocking…'
                                            : `Unlock uploads (GHS ${subscriptionAmountDue})`}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection('settings')}
                                        className="h-11 px-6 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                                    >
                                        {awaitingKycApproval ? 'View studio identity' : 'Upload verification docs'}
                                    </button>
                                )}
                            </div>
                        )}
                        <VendorStatsGrid dashboardData={dashboardData} productsCount={vendorProducts.length} />
                    </div>
                );
            case 'products':
                if (!canSell) {
                    return (
                        <div className="max-w-xl mx-auto py-12 text-center space-y-4 bg-white rounded-[32px] border border-slate-100 p-10">
                            <ShieldAlert className="w-12 h-12 text-brand-lemon mx-auto" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                Product listing locked
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {awaitingKycApproval
                                    ? 'Your documents are under review. Approval usually takes 4–5 hours. After approval, open Overview and pay via Paystack to unlock uploads.'
                                    : 'Upload your Business Registration, Ghana Card, and selfie in Studio Identity first. After admin approval, open Overview and pay via Paystack to list products.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('settings')}
                                    className="px-8 py-3 bg-brand-lemon text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest"
                                >
                                    {awaitingKycApproval ? 'View studio identity' : 'Upload verification docs'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('dashboard')}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                                >
                                    Go to Overview
                                </button>
                            </div>
                        </div>
                    );
                }
                if (subscriptionExpired) {
                    return (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="max-w-xl mx-auto py-10 text-center space-y-4 bg-white rounded-[32px] border border-orange-100 p-10">
                                <ShieldAlert className="w-12 h-12 text-orange-500 mx-auto" />
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                    {paymentRequired ? 'Pay to unlock uploads' : 'Subscription due — uploads locked'}
                                </h2>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {paymentRequired
                                        ? `Documents approved. Pay GHS ${subscriptionAmountDue} via Paystack to unlock product uploads for 30 days — unlocks automatically after payment.`
                                        : `Pay GHS ${subscriptionAmountDue} via Paystack to renew. Existing listings stay live; new uploads unlock automatically after payment.`}
                                </p>
                                <button
                                    type="button"
                                    onClick={startSubscriptionPayment}
                                    disabled={payingSubscription}
                                    className="px-8 py-3 bg-brand-lemon text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                                >
                                    {payingSubscription
                                        ? 'Unlocking…'
                                        : `Unlock uploads (GHS ${subscriptionAmountDue})`}
                                </button>
                            </div>
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
                                    setCustomSizeInput('');
                                    setFormHasSizes(p.hasSizes !== undefined ? p.hasSizes : true);
                                    setFormHasColors(p.hasColors !== undefined ? p.hasColors : true);
                                    setFormColors(p.colors || []);
                                    setFormImageLabels(p.imageLabels || ['Front', 'Back', 'Side', 'Details']);
                                    setShowAddProduct(true);
                                }}
                                onDelete={handleDeleteProduct}
                                onToggleStatus={handleToggleProductVisibility}
                                onAddNew={() => {
                                    Swal.fire({
                                        icon: 'warning',
                                        title: 'One-time payment due',
                                        text: 'Pay your GHS 100 one-time FLA subscription (MoMo) to unlock uploads for good. Existing listings can still sell.',
                                    });
                                }}
                            />
                        </div>
                    );
                }
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
                            setCustomSizeInput('');
                            setFormHasSizes(p.hasSizes !== undefined ? p.hasSizes : true);
                            setFormHasColors(p.hasColors !== undefined ? p.hasColors : true);
                            setFormColors(p.colors || []);
                            setFormImageLabels(p.imageLabels || ['Front', 'Back', 'Side', 'Details']);
                            setShowAddProduct(true);
                        }}
                        onDelete={handleDeleteProduct}
                        onToggleStatus={handleToggleProductVisibility}
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
                                html: `
                                    <div class="space-y-4 text-left">
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phase Select</label>
                                            <select id="swal-status" class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold">
                                                <option value="processing">In Production</option>
                                                <option value="preparing_shipment">Preparing Shipment</option>
                                                <option value="in_transit">In Transit (Direct to Customer)</option>
                                                <option value="delivered">Shipment Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Carrier Details (Optional)</label>
                                            <input id="swal-carrier" type="text" placeholder="e.g. DHL, FedEx, VIP" class="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold">
                                        </div>
                                    </div>
                                `,
                                showCancelButton: true,
                                confirmButtonText: 'UPDATE',
                                focusConfirm: false,
                                preConfirm: () => {
                                    return {
                                        status: (document.getElementById('swal-status') as HTMLSelectElement).value,
                                        carrier: (document.getElementById('swal-carrier') as HTMLInputElement).value
                                    }
                                },
                                customClass: { popup: 'rounded-[32px] p-8' }
                            }).then(async r => {
                                if (r.isConfirmed && r.value) {
                                    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                                    const { status, carrier } = r.value;
                                    await fetch(`${api}/orders/${id}`, {
                                        method: 'PATCH',
                                        headers: { 
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify({ status, carrier })
                                    });
                                    const updated = vendorOrders.map(o => o._id === id ? { ...o, status, carrier } : o);
                                    setVendorOrders(updated);

                                    if (status === 'cancelled') {
                                        const order = updated.find(o => o._id === id);
                                        if (order?.customerPhone) {
                                            const { default: Swal } = await import('sweetalert2');
                                            const shop = user?.shopName || user?.name || 'FLA Vendor';
                                            const { buildVendorCancelledOrderToCustomerMessage, normalizeWhatsAppPhone, openWhatsAppChat } = await import('@/lib/whatsapp');
                                            const wa = await Swal.fire({
                                                title: 'Notify customer?',
                                                text: 'Open WhatsApp with a prefilled message about this cancellation.',
                                                icon: 'question',
                                                showCancelButton: true,
                                                confirmButtonText: 'OPEN WHATSAPP',
                                                cancelButtonText: 'LATER',
                                                confirmButtonColor: '#25D366',
                                                customClass: { popup: 'rounded-[32px]' },
                                            });
                                            if (wa.isConfirmed) {
                                                const phone = normalizeWhatsAppPhone(order.customerPhone);
                                                if (phone) {
                                                    openWhatsAppChat(phone, buildVendorCancelledOrderToCustomerMessage(order, shop));
                                                }
                                            }
                                        }
                                    }
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
                        onPrintLabel={setPrintingOrder}
                        shopName={user?.shopName || user?.name}
                    />
                );
            case 'wallet': return <VendorFinances user={user} dashboardData={dashboardData} commissionRate={commissionRate} handleWithdrawal={handleWithdrawal} />;
            case 'settings': return <VendorSettings user={user} shopName={shopName} setShopName={setShopName} storeCategory={storeCategory} setStoreCategory={setStoreCategory} storeAccentColor={storeAccentColor} setStoreAccentColor={setStoreAccentColor} storeThemeColor={storeThemeColor} setStoreThemeColor={setStoreThemeColor} phone={phone} setPhone={setPhone} momoNumber={momoNumber} setMomoNumber={setMomoNumber} momoNetwork={momoNetwork} setMomoNetwork={setMomoNetwork} accountName={accountName} setAccountName={setAccountName} shopLocation={shopLocation} setShopLocation={setShopLocation} bio={bio} setBio={setBio} bannerImage={bannerImage} profileImage={profileImage} businessRegistration={businessRegistration} ghanaCardFront={ghanaCardFront} ghanaCardBack={ghanaCardBack} selfie={selfie} handleImageUpload={handleImageUpload} handleUpdateVendorProfile={handleUpdateVendorProfile} startOnDocuments={needsKycUpload} />;
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

    if (mustChangePassword) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <form onSubmit={handleForcedPasswordChange} className="w-full max-w-md bg-white rounded-[32px] border border-slate-100 shadow-xl p-8 md:p-10 space-y-5">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-lemon mb-2">Security first</p>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Set your password</h1>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            Enter the temporary password from your SMS, then choose a new password you will remember.
                        </p>
                    </div>
                    <label className="block space-y-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Temporary password
                        <input
                          type="password"
                          required
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 normal-case tracking-normal"
                        />
                    </label>
                    <label className="block space-y-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        New password
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 normal-case tracking-normal"
                        />
                    </label>
                    <label className="block space-y-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Confirm new password
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 normal-case tracking-normal"
                        />
                    </label>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full py-4 rounded-full bg-slate-900 text-brand-lemon text-[11px] font-black uppercase tracking-widest disabled:opacity-60"
                    >
                      {changingPassword ? 'Saving…' : 'Save new password'}
                    </button>
                    <button type="button" onClick={handleLogout} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Sign out
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex">
            {/* Desktop Dashboard Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-slate-50 hidden lg:block z-40">
                <VendorSidebar activeSection={activeSection} setActiveSection={setActiveSection} handleLogout={handleLogout} limitedMode={limitedMode} />
            </aside>

            <main className="flex-1 lg:ml-80 min-h-screen relative">
                {/* Dashboard Navigation Channels */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-50 px-4 sm:px-6 md:px-12 py-4 md:py-6 flex items-center justify-between z-30 gap-3">
                    <VendorHeader activeSection={activeSection} shopName={user?.shopName || 'Studio'} profileImage={user?.profileImage} />
                    <VendorMobileHeader activeSection={activeSection} setIsSidebarOpen={setIsSidebarOpen} />
                </header>

                <div className="px-4 sm:px-6 md:px-12 py-8 md:py-10 pb-20 md:pb-24">
                    {isPendingReview && (
                        <div className="mb-8 p-6 md:p-8 bg-amber-50 border border-amber-100 rounded-[32px] space-y-2">
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Application pending approval</p>
                            <p className="text-sm text-amber-900/80 leading-relaxed">
                                Made a mistake during signup? Update your <strong>MoMo number</strong>, <strong>account holder name</strong>, and shop details below, then tap <strong>Save Store Information</strong>. You can log in anytime to fix this before we approve your shop.
                            </p>
                        </div>
                    )}
                    {!isPendingReview && mustChangePassword === false && needsKycUpload && (
                        <div className="mb-8 p-6 md:p-8 bg-brand-lemon/20 border border-brand-lemon/40 rounded-[32px] space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Welcome — explore your dashboard</p>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    Your shop is live for browsing. Upload Ghana Card + selfie under <strong>Settings → Studio Identity</strong> whenever you have the docs. Product listing stays locked until we approve (usually <strong>4–5 hours</strong>).
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('settings')}
                                    className="h-10 px-5 rounded-full bg-brand-blue text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                                >
                                    Complete verification
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('dashboard')}
                                    className="h-10 px-5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Look around first
                                </button>
                            </div>
                        </div>
                    )}
                    {!isPendingReview && awaitingKycApproval && (
                        <div className="mb-8 p-6 md:p-8 bg-sky-50 border border-sky-100 rounded-[32px] space-y-2">
                            <p className="text-[10px] font-black text-sky-800 uppercase tracking-widest">Documents under review</p>
                            <p className="text-sm text-sky-900/80 leading-relaxed">
                                Thanks — we received your documents. Expect approval within about <strong>4–5 hours</strong>. You can keep exploring; you will get an SMS when you can start selling.
                            </p>
                        </div>
                    )}
                    {canSell && subscriptionExpiringSoon && (
                        <div className="mb-8 p-6 md:p-8 bg-amber-50 border border-amber-200 rounded-[32px] space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                                    Subscription ends in {subscriptionDaysLeft} day{subscriptionDaysLeft === 1 ? '' : 's'}
                                </p>
                                <p className="text-sm text-amber-950/80 leading-relaxed">
                                    Renew via Paystack — GHS {subscriptionAmountDue}. When due, existing products stay live but new uploads lock until you pay.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={startSubscriptionPayment}
                                disabled={payingSubscription}
                                className="h-11 px-6 rounded-full bg-brand-blue text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                            >
                                {payingSubscription ? 'Unlocking…' : `Unlock uploads (GHS ${subscriptionAmountDue})`}
                            </button>
                        </div>
                    )}
                    {canSell && subscriptionExpired && (
                        <div className="mb-8 p-6 md:p-8 bg-orange-50 border border-orange-200 rounded-[32px] space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest">
                                    {paymentRequired
                                        ? 'Pay to unlock product uploads'
                                        : 'Subscription due — new uploads locked'}
                                </p>
                                <p className="text-sm text-orange-950/80 leading-relaxed">
                                    {paymentRequired
                                        ? `Your documents are approved. Pay GHS ${subscriptionAmountDue} via Paystack to open product uploads for 30 days. No admin MoMo — payment unlocks automatically.`
                                        : `Pay GHS ${subscriptionAmountDue} via Paystack to renew. Existing listings stay live and can still accept payment.`}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={startSubscriptionPayment}
                                disabled={payingSubscription}
                                className="h-11 px-6 rounded-full bg-brand-lemon text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-60"
                            >
                                {payingSubscription
                                    ? 'Unlocking…'
                                    : `Unlock uploads (GHS ${subscriptionAmountDue})`}
                            </button>
                        </div>
                    )}
                    {activeSection === 'dashboard' && (
                        <div className="mb-8 p-6 md:p-8 bg-brand-blue rounded-[32px] text-white space-y-4 shadow-sm">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lemon mb-1">
                                    Your public store link
                                </p>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    Copy this link from Overview anytime and share it with customers.
                                </p>
                            </div>
                            {user?.storeSlug ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-xs font-bold break-all">
                                        {storefrontUrl(user.storeSlug)}
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(storefrontUrl(user.storeSlug!));
                                                    Swal.fire({
                                                        toast: true,
                                                        position: 'top-end',
                                                        icon: 'success',
                                                        title: 'Store link copied',
                                                        showConfirmButton: false,
                                                        timer: 1800,
                                                    });
                                                } catch {
                                                    /* ignore */
                                                }
                                            }}
                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-brand-lemon text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy link
                                        </button>
                                        <a
                                            href={storeHomePath(user.storeSlug)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            Open
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <p className="text-sm text-amber-200">
                                        Store slug not assigned yet — open Studio Identity and save your shop name, or refresh after a minute.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection('settings')}
                                        className="h-10 px-5 rounded-full bg-brand-lemon text-slate-900 text-xs font-semibold"
                                    >
                                        Studio Identity
                                    </button>
                                </div>
                            )}
                            {subscriptionEndsAt && !subscriptionExpired && !subscriptionExpiringSoon && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                    Plan until {subscriptionEndsAt.toLocaleDateString()}
                                </p>
                            )}
                            {!subscriptionEndsAt && !user?.subscriptionPaymentRequired && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                    Lifetime access — no renewal needed
                                </p>
                            )}
                        </div>
                    )}
                    
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Interface Bridge */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                    <aside className="w-80 h-full bg-white animate-in slide-in-from-left duration-300 relative z-[201]" onClick={(e) => e.stopPropagation()}>
                        <VendorSidebar activeSection={activeSection} setActiveSection={(s) => { setActiveSection(s); setIsSidebarOpen(false); }} handleLogout={handleLogout} limitedMode={limitedMode} />
                    </aside>
                </div>
            )}

            {/* Product Design Studio (Modal) */}
            {showAddProduct && (canUploadProducts || editingProduct) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowAddProduct(false)} />
                    <div className="relative w-full max-w-4xl max-h-[92dvh] bg-white rounded-3xl md:rounded-[48px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-5 sm:p-6 md:p-8 border-b border-slate-50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 hidden sm:block">Configure your product details for the marketplace.</p>
                            </div>
                            <button onClick={() => setShowAddProduct(false)} className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 space-y-8 md:space-y-12">
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
                                                    <Image src={getImageUrl(formImages[idx])} alt={`Preview ${idx}`} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} className="rounded-3xl" unoptimized />
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                        <label className="cursor-pointer px-4 py-2 bg-white rounded-full text-[8px] font-black uppercase tracking-widest touch-manipulation">
                                                            Replace
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleFormImageUpload(file, idx);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormImages((prev) => {
                                                                const next = [...prev];
                                                                while (next.length <= idx) next.push('');
                                                                next[idx] = '';
                                                                return next;
                                                            })}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest touch-manipulation"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all touch-manipulation">
                                                    <Camera className="w-6 h-6 text-slate-300" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Upload</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFormImageUpload(file, idx);
                                                            e.target.value = '';
                                                        }}
                                                    />
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
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="p-price" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Price (GH₵)</label>
                                        {formPrice && (
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">
                                                Net: GH₵ {(parseFloat(formPrice) * (1 - commissionRate / 100)).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            id="p-price" 
                                            name="price" 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={formPrice} 
                                            onChange={(e) => setFormPrice(e.target.value)} 
                                            className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14 ${parseFloat(formPrice) > 100 && !businessRegistration ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100'}`} 
                                        />
                                        {parseFloat(formPrice) > 100 && !businessRegistration && (
                                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                                                <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Compliance Alert</p>
                                                    <p className="text-[11px] font-bold text-red-500 leading-relaxed">
                                                        Products priced above GH₵ 100 require a <span className="underline">Business Registration Certificate</span>. Please upload yours in Settings to avoid account termination.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {formPrice && (
                                            <div className="absolute right-4 top-[68px] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none w-48">
                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                                                    <span>Breakdown</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[10px] items-center">
                                                        <span className="text-slate-400">Admin ({commissionRate}%):</span>
                                                        <span className="text-red-400 font-bold">-GH₵ {(parseFloat(formPrice) * (commissionRate / 100)).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] items-center border-t border-white/5 pt-1.5">
                                                        <span className="text-slate-400">Vendor Share:</span>
                                                        <span className="text-emerald-400 font-black">GH₵ {(parseFloat(formPrice) * (1 - commissionRate / 100)).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Logistic Specs (Category, Stock, Tailoring, Region) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                                <div className="space-y-4">
                                    <label htmlFor="p-category" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Category</label>
                                    <select id="p-category" name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14">
                                        {vendorProductCategories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="p-stock" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Stock Vol. <span className="text-red-500">*</span></label>
                                    <input
                                        id="p-stock"
                                        name="stock"
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="20"
                                        value={formQuantity}
                                        onChange={(e) => setFormQuantity(e.target.value)}
                                        className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 h-14 ${formQuantity === '' ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'}`}
                                    />
                                    {formQuantity === '' && (
                                        <p className="text-[10px] font-bold text-red-500 ml-1">Stock quantity is required before you can publish.</p>
                                    )}
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
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {PRESET_SIZES.map((size) => (
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

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add custom size (e.g. 42, UK 9, Free Size)..."
                                                    value={customSizeInput}
                                                    onChange={(e) => setCustomSizeInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addCustomSize();
                                                        }
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addCustomSize}
                                                    className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {formSizes.filter((s) => !PRESET_SIZES.includes(s)).length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {formSizes.filter((s) => !PRESET_SIZES.includes(s)).map((size) => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            onClick={() => setFormSizes((prev) => prev.filter((s) => s !== size))}
                                                            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-slate-900 text-brand-lemon border-slate-900 shadow-lg"
                                                        >
                                                            {size} ×
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
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
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {PRESET_COLORS.map((color) => (
                                                    <button
                                                        key={color.label}
                                                        type="button"
                                                        onClick={() => setFormColors(prev => prev.includes(color.label) ? prev.filter(c => c !== color.label) : [...prev, color.label])}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${formColors.includes(color.label) ? 'bg-slate-900 text-brand-lemon border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        {'pattern' in color && color.pattern ? (
                                                            <div className="w-3 h-3 rounded-full border border-black/10 bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]" />
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                                                        )}
                                                        {color.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add custom color..."
                                                    value={customColorInput}
                                                    onChange={(e) => setCustomColorInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addCustomColor();
                                                        }
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addCustomColor}
                                                    className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {formColors.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Selected colors (before you publish)</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formColors.map((color) => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => setFormColors((prev) => prev.filter((c) => c !== color))}
                                                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-slate-900 text-brand-lemon border-slate-900 shadow-lg"
                                                            >
                                                                {color} ×
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label htmlFor="p-desc" className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1 cursor-pointer">Product Description</label>
                                <textarea id="p-desc" name="description" value={formNarrative} onChange={(e) => setFormNarrative(e.target.value)} rows={4} disabled={!!editingProduct} className={`w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-900/10 resize-none md:p-8 ${editingProduct ? 'blur-[4px] select-none pointer-events-none opacity-70' : ''}`} placeholder="Tell the story behind this product..." />
                            </div>
                            
                            <button onClick={handleAddOrEditProduct} className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-brand-lemon hover:text-slate-900 transition-all active:scale-95 mt-4">
                                {editingProduct ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Waybill Generator (Modal) */}
            {printingOrder && (
                <WaybillModal 
                    order={printingOrder} 
                    vendor={user} 
                    onClose={() => setPrintingOrder(null)} 
                />
            )}
        </div>
    );
}

export default function VendorDashboard() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-lemon rounded-full animate-spin" />
                </div>
            }
        >
            <VendorDashboardInner />
        </Suspense>
    );
}
