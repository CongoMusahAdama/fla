"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, X, MessageSquare, ShoppingBag, Star, Zap, Shield, Check, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import Swal from 'sweetalert2';

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    images: string[];
    sizes?: string[];
    imageLabels?: string[];
    duration?: string;
    stock: number;
    index: number;
    vendorId?: string | any;
    initialWishlistState?: boolean;
    description?: string;
    rating?: number;
    reviewCount?: number;
    vendorName?: string;
    uniqueVendorId?: string;
}

export default function ProductCard({ id, name, price, images, sizes = [], imageLabels, duration = '3 working days', stock, index, vendorId, initialWishlistState = false, description, rating = 0, reviewCount = 0, vendorName, uniqueVendorId }: ProductCardProps) {
    const isBatch = false;
    const currentPrice = price;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { addToCart } = useCart();
    const { isAuthenticated, user } = useAuth();
    const [isWishlisted, setIsWishlisted] = useState(initialWishlistState);
    const [imgError, setImgError] = useState(false);
    const router = useRouter();

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

        // Default to backend upload if just filename
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
        return `${baseUrl}/uploads/${url}`;
    };

    const handleVendorProfile = async (e: React.MouseEvent) => {
        e.stopPropagation();

        let validVendorId = vendorId;
        if (typeof vendorId === 'object' && vendorId !== null) {
            validVendorId = vendorId._id || vendorId.id;
        }

        if (!validVendorId) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/vendor/${validVendorId}/profile`);
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
                                <span class="bg-[#E5FF7F]/10 text-[#E5FF7F] text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#E5FF7F]/20">
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
            console.error(error);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Could not load vendor profile',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    useEffect(() => {
        setImgError(false);
    }, [currentImageIndex, images]);


    const isSoldOut = stock === 0;

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            Swal.fire({
                title: 'Sign In Required',
                text: 'Please log in to add items to your shopping bag.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Sign In Now',
                confirmButtonColor: '#0f172a',
                cancelButtonText: 'Later'
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/auth?role=customer');
                }
            });
            return;
        }

        if (!selectedSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Size Required',
                text: 'Please select a size to continue.',
                confirmButtonColor: '#0f172a', // slate-900
            });
            return;
        }
        setIsAdding(true);
        // Simulate network delay
        setTimeout(() => {
            addToCart({
                id,
                name,
                price: currentPrice,
                image: images[0],
                size: selectedSize!,
                quantity: 1,
                vendorId: vendorId,
            });
            setIsAdding(false);
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            })

            Toast.fire({
                icon: 'success',
                title: 'Added to cart'
            })
        }, 100);
    };

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            Swal.fire({
                title: 'Sign In Required',
                text: 'Join FLA to save your favorite bespoke designs.',
                icon: 'info',
                confirmButtonText: 'Join Now',
                confirmButtonColor: '#0f172a'
            });
            return;
        }

        try {
            const token = localStorage.getItem('fla_token');
            const method = isWishlisted ? 'DELETE' : 'POST';
            const url = isWishlisted
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist/${id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: isWishlisted ? undefined : JSON.stringify({ productId: id })
            });

            if (response.ok) {
                setIsWishlisted(!isWishlisted);
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: 'success',
                    title: isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist'
                });
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    };

    const handleBuyNow = async () => {
        // Batch Logic
        const actionLabel = isBatch ? 'Join Batch Group' : 'Delivery Details';

        if (!selectedSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Size Required',
                text: 'Please select a size to continue.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }

        // Enforce Authentication - No Guest Checkout
        if (!isAuthenticated) {
            Swal.fire({
                title: 'Sign In Required',
                text: 'Please sign in or create an account to track your order.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Sign In / Register',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#0f172a',
                cancelButtonColor: '#cbd5e1'
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/auth?role=customer');
                }
            });
            return;
        }

        // Proceed directly to payment since we know they are authenticated
        // No guestInfo needed as user is authenticated
        const guestInfo = null;

        // Check if item is Made to Order (e.g. takes time) and warn about Escrow
        // We assume simple check: if stock > 0 but needs time, or just based on duration text
        const isMadeToOrder = duration && !duration.toLowerCase().includes('ready') && !duration.toLowerCase().includes('stock');

        if (isMadeToOrder) {
            Swal.fire({
                title: 'Made to Order',
                icon: 'info',
                html: `
                    <div class="text-left text-sm space-y-3">
                        <p>This item requires <b class="text-slate-900 font-bold underline decoration-brand-lemon decoration-2">${duration}</b> to be tailored.</p>
                        <div class="bg-brand-lemon/10 p-3 rounded-lg border border-brand-lemon/20 text-slate-700">
                            <p class="font-bold flex items-center gap-2"> Escrow Protected</p>
                            <p class="text-xs mt-1">Your funds are held in escrow until delivery.</p>
                        </div>
                        <p class="text-center font-bold text-slate-900 mt-2">Do you accept?</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Accept & Pay',
                cancelButtonText: 'Decline',
                confirmButtonColor: '#0f172a',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    startPaymentFlow(guestInfo);
                }
            });
        } else {
            startPaymentFlow(guestInfo);
        }
    };

    const startPaymentFlow = (guestInfo?: any) => {
        // Step 1: choose method (Flutterwave or WhatsApp)
        Swal.fire({
            title: 'Choose Checkout Method',
            html: `
                <div class="flex flex-col gap-3">
                    <button id="pay-paystack" class="swal2-confirm swal2-styled" style="background-color: #E5FF7F; color: #0f172a; margin: 0; width: 100%;">
                        Pay with MoMo (MTN, Telecel, AT) / Card
                    </button>
                    <button id="xy-whatsapp" class="swal2-deny swal2-styled" style="background-color: #25D366; margin: 0; width: 100%;">
                        Buy via WhatsApp
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                const paystackBtn = document.getElementById('pay-paystack');
                const waBtn = document.getElementById('xy-whatsapp');

                paystackBtn?.addEventListener('click', () => {
                    Swal.clickConfirm();
                    handlePaystackFlow();
                });

                waBtn?.addEventListener('click', () => {
                    const message = `Hi, I want to buy ${name} (Size: ${selectedSize}) - GH₵${price}`;
                    window.open(`https://wa.me/233505112925?text=${encodeURIComponent(message)}`, '_blank');
                    Swal.close();
                });
            }
        });
    };

    const handlePaystackFlow = async () => {
        try {
            const token = localStorage.getItem('fla_token');

            Swal.fire({
                title: 'PREPARING PAYMENT...',
                text: 'Connecting to secure MoMo gateway...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const orderData = {
                items: [{
                    productId: id,
                    name: name,
                    price: currentPrice,
                    quantity: 1,
                    size: selectedSize,
                    image: images[0]
                }],
                totalAmount: currentPrice,
                vendorId: vendorId,
                shippingAddress: 'Registered Address',
                shippingCity: 'Accra',
                shippingRegion: 'Greater Accra',
                customerName: user?.name,
                customerEmail: user?.email,
                customerPhone: user?.phone,
                paymentMethod: 'paystack',
                notes: 'Quick Buy Checkout (Paystack)'
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to initialize payment');
            }

            const { paymentLink } = await response.json();
            window.location.href = paymentLink;

        } catch (error: any) {
            Swal.fire('Payment Error', error.message, 'error');
        }
    };

    useEffect(() => {
        // Staggered animation based on product index
        const delay = 200 + (index * 100); // Start at 200ms, add 100ms per product
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [index]);

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleMouseEnter = () => {
        if (images.length > 1 && !isSoldOut) {
            setCurrentImageIndex(1);
        }
    };

    const handleMouseLeave = () => {
        if (images.length > 1 && !isSoldOut) {
            setCurrentImageIndex(0);
        }
    };

    return (
        <>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => setIsDetailModalOpen(true)}
                className={`bg-white p-4 rounded-3xl group hover:shadow-xl transition-all duration-700 ease-out border border-transparent hover:border-gray-100 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
                    }`}>
                {/* Image Container */}
                <div className="relative w-full aspect-[4/5] bg-[#F7F7F7] rounded-3xl overflow-hidden mb-5 group/image transition-all duration-500 hover:shadow-inner">
                    {/* New Arrival Badge & Sold Out Overlay */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        {!isSoldOut && (
                            <div className="bg-[#DFEA73] text-[#2C3E02] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm w-fit">
                                New Arrival
                            </div>
                        )}
                        {isSoldOut && (
                            <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-white/20 w-fit shadow-xl">
                                Sold Out
                            </div>
                        )}
                    </div>

                    {isSoldOut && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <span className="text-[120px] font-black text-slate-900/5 select-none tracking-tighter uppercase rotate-[-25deg]">SOLD</span>
                        </div>
                    )}

                    {/* Rating Badge */}
                    {!isSoldOut && (
                        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                            <span className="text-[11px] font-black text-slate-900">{rating || 4.9}</span>
                            <Star className="w-3 h-3 fill-brand-lemon text-brand-lemon" />
                            <span className="text-[9px] font-black text-slate-400/40">({reviewCount || 214})</span>
                        </div>
                    )}

                    {/* Carousel Image */}
                    <div className="w-full h-full relative p-4">
                        <Image
                            src={imgError ? '/product-1.jpg' : getImageUrl(images[currentImageIndex])}
                            alt={`${name} view ${currentImageIndex + 1}`}
                            fill
                            unoptimized
                            className={`object-contain transition-all duration-700 group-hover/image:scale-105 ${isSoldOut ? 'grayscale contrast-[0.8] opacity-60' : ''}`}
                            onError={() => setImgError(true)}
                        />
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3 px-1">
                    <h3 className="font-heading font-black text-slate-900 text-base md:text-lg leading-tight line-clamp-1 group-hover:text-brand-lemon transition-colors">
                        {name}
                    </h3>

                    {/* Vendor Link */}
                    {vendorName && (
                        <div onClick={handleVendorProfile} className="flex items-center gap-1.5 w-fit cursor-pointer group/vendor">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/vendor:text-slate-600">
                                by {vendorName}
                                {uniqueVendorId && <span className="text-[#E5FF7F] ml-1 bg-slate-900/10 px-1.5 py-0.5 rounded text-[8px] font-black">${uniqueVendorId}</span>}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        </div>
                    )}

                    {/* Feature Highlights */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Zap className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Customized Tailoring</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Premium Fabric Choice</span>
                        </div>
                    </div>

                    {/* Price & Rating Summary (Mobile First) */}
                    <div className="flex justify-between items-center pt-2 pb-3 border-b border-slate-50 mb-3">
                        <div className="flex flex-col">
                            <span className="text-slate-300 line-through text-[9px] font-bold">GH₵{Math.round(price * 1.15)}</span>
                            <span className="font-sans font-black text-slate-900 text-base md:text-lg tracking-tight -mt-1">GH₵{price}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                            <Star className="w-2.5 h-2.5 fill-brand-lemon text-brand-lemon" />
                            <span className="text-[10px] font-black text-slate-900">{rating || 4.9}</span>
                        </div>
                    </div>

                    {/* Size Selection (Quick Access) */}
                    <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        {(sizes && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL']).map(size => (
                            <button
                                key={size}
                                onClick={() => !isSoldOut && setSelectedSize(size)}
                                disabled={isSoldOut}
                                className={`flex-none w-8 h-8 rounded-lg text-[10px] font-black border transition-all active:scale-90
                                    ${selectedSize === size
                                        ? 'bg-brand-lemon text-slate-900 border-brand-lemon shadow-sm'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                    }
                                `}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-2 mt-4 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsDetailModalOpen(true)}
                            className="flex items-center justify-center py-3.5 px-6 rounded-full border border-slate-900 text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] whitespace-nowrap touch-manipulation relative z-50 !cursor-pointer !pointer-events-auto"
                        >
                            Learn More
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex items-center justify-center py-3.5 px-6 rounded-full bg-brand-lemon text-slate-900 text-[11px] font-bold transition-all active:scale-[0.98] whitespace-nowrap touch-manipulation relative z-50 !cursor-pointer !pointer-events-auto"
                        >
                            Quick Checkout
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-8">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500"
                        onClick={() => setIsDetailModalOpen(false)}
                    />
                    <div className="relative bg-white w-full max-w-4xl h-[92vh] md:h-[85vh] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom md:zoom-in-95 duration-500 pointer-events-auto overflow-hidden">
                        {/* Mobile Handle */}
                        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200/50 rounded-full z-50 py-4" />

                        {/* Close Button - Enhanced for Mobile */}
                        <button
                            onClick={() => setIsDetailModalOpen(false)}
                            className="absolute top-4 right-4 z-50 bg-white/50 backdrop-blur-md hover:bg-white text-slate-900 rounded-full p-2.5 shadow-sm transition-all active:scale-95 border border-white/20"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Left: Gallery */}
                        <div className="w-full md:w-1/2 bg-[#f8f8f8] flex flex-col justify-between">
                            <div className="relative w-full h-[40vh] md:h-[60vh] flex-1">
                                <Image
                                    src={imgError ? '/product-1.jpg' : getImageUrl(images[currentImageIndex])}
                                    alt={name}
                                    fill
                                    unoptimized
                                    className="object-contain p-6 transition-transform duration-700 hover:scale-105"
                                    onError={() => setImgError(true)}
                                />
                            </div>

                            {/* Thumbnails - Now properly positioned below image */}
                            <div className="w-full px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar items-center justify-center bg-white border-t border-slate-100/50">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`relative flex-shrink-0 w-12 h-16 md:w-14 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${idx === currentImageIndex
                                            ? 'border-brand-lemon shadow-lg shadow-brand-lemon/20 scale-105 opacity-100 ring-2 ring-brand-lemon/20'
                                            : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105 bg-slate-100'
                                            }`}
                                    >
                                        <Image
                                            src={getImageUrl(img)}
                                            alt="thumb"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/product-1.jpg';
                                            }}
                                        />
                                        {imageLabels && imageLabels[idx] && (
                                            <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-1">
                                                <span className="text-[7px] font-black text-white uppercase tracking-tighter bg-black/50 px-1 rounded-sm backdrop-blur-sm">
                                                    {imageLabels[idx]}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 flex flex-col relative overflow-y-auto overscroll-contain min-h-0 bg-white">
                            <div className="p-6 md:p-10 pb-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 bg-brand-lemon px-3 py-1 rounded-full shadow-sm">Bespoke Collection</span>
                                        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                            <Zap className="w-3 h-3 fill-current" />
                                            Active Tailoring
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="font-heading text-2xl md:text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tighter uppercase">{name}</h2>
                                        <div className="flex items-center gap-4">
                                            <p className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter">GH₵{price}</p>
                                            <div className="h-6 w-[1px] bg-slate-100" />
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-brand-lemon text-brand-lemon" />
                                                <span className="text-xs font-black text-slate-900">{rating || 4.9}</span>
                                                <span className="text-[10px] font-bold text-slate-300 ml-1">({reviewCount || 214} Reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Size Selection - Moved Up for Visibility */}
                                <div className="space-y-4 pt-2 border-t border-slate-50">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Silhouette</h4>
                                        <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest underline decoration-brand-lemon decoration-2 underline-offset-4">Size Guide</button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {(() => {
                                            const safeSizes = (Array.isArray(sizes) && sizes.length > 0) ? sizes : ['S', 'M', 'L', 'XL', '2XL', '3XL'];
                                            return safeSizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[3.5rem] h-12 md:h-14 px-4 rounded-2xl font-black border-2 transition-all text-xs md:text-sm
                                                        ${selectedSize === size
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                                                            : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-white hover:scale-105'
                                                        }
                                                    `}
                                                >
                                                    {size}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Description with Dynamic Data */}
                                    <div className="space-y-4">
                                        <h3 className="font-heading font-black text-xl text-slate-900 uppercase tracking-tighter">The Narrative</h3>
                                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-left font-medium">
                                            {description || `Crafted with precision using premium bespoke tailoring techniques. This piece features our signature ${name.toLowerCase()} design, combining traditional aesthetics with modern comfort. Every stitch is a testament to our commitment to excellence.`}
                                        </p>

                                        {/* Vendor Info Section */}
                                        {vendorName && (
                                            <div
                                                onClick={handleVendorProfile}
                                                className="mt-6 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100 group/vendor"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover/vendor:bg-slate-900 group-hover/vendor:text-white transition-colors">
                                                    {vendorName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designed By</p>
                                                    <p className="text-sm font-bold text-slate-900 group-hover/vendor:underline decoration-brand-lemon decoration-2 underline-offset-2">
                                                        {vendorName}
                                                        {uniqueVendorId && <span className="text-[10px] text-slate-400 ml-2 font-black">({uniqueVendorId})</span>}
                                                    </p>
                                                </div>
                                                <div className="ml-auto">
                                                    <div className="bg-brand-lemon text-[9px] font-black px-2 py-1 rounded text-slate-900 uppercase">View Profile</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <Clock className="w-5 h-5 text-slate-900" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tailoring</span>
                                                <span className="text-[11px] font-black text-slate-900">{duration}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <Shield className="w-5 h-5 text-slate-900" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quality</span>
                                                <span className="text-[11px] font-black text-slate-900">Bespoke</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions - Sticky Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4 z-50">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAdding}
                                    className="flex-1 py-5 rounded-3xl bg-slate-50 border border-slate-200 font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    {isAdding ? 'Adding...' : 'Add to Bag'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="flex-[1.5] py-5 rounded-3xl bg-brand-lemon text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    Quick Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

