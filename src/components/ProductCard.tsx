"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, X, MessageSquare, ShoppingBag, Star, Zap, Shield, Check, Heart, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';

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
    hasSizes?: boolean;
    vendorRegion?: string;
}

export default function ProductCard({ id, name, price, images, sizes = [], imageLabels, duration = '3 working days', stock, index, vendorId, initialWishlistState = false, description, rating = 0, reviewCount = 0, vendorName, uniqueVendorId, hasSizes = true, vendorRegion }: ProductCardProps) {
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



    const handleVendorProfile = async (e: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        let validVendorId = vendorId;
        if (typeof vendorId === 'object' && vendorId !== null) {
            validVendorId = vendorId._id || vendorId.id;
        }

        if (!validVendorId) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Vendor details pending',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        try {
            const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
            const response = await fetch(`${apiBase}/users/vendor/${validVendorId}/profile`);
            if (!response.ok) throw new Error('Failed to fetch vendor profile');
            const data = await response.json();
            const { vendor, stats } = data;

            const resolvedProfileImage = getImageUrl(vendor.profileImage);

            Swal.fire({
                html: `
                    <div class="flex flex-col -m-3 md:-m-6 overflow-hidden max-w-full">
                        <!-- Luxury Header -->
                        <div class="bg-slate-900 pt-12 pb-10 px-6 text-center relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                            </div>
                            
                            <div class="relative inline-block mb-4">
                                ${vendor.profileImage
                        ? `<img src="${resolvedProfileImage}" class="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] object-cover border-4 border-[#E5FF7F] shadow-2xl mx-auto">`
                        : `<div class="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-slate-800 flex items-center justify-center text-[#E5FF7F] border-4 border-slate-700 shadow-2xl mx-auto">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                       </div>`
                    }
                                <div class="absolute -bottom-1 -right-1 bg-[#E5FF7F] p-1.5 rounded-xl shadow-lg border-2 border-slate-900">
                                    <svg class="w-4 h-4 text-slate-900" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-center gap-1.5">
                                <h2 class="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">${vendor.shopName || vendor.name}</h2>
                                <span class="bg-[#E5FF7F]/10 text-[#E5FF7F] text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#E5FF7F]/20">
                                    ID: ${vendor.uniqueVendorId}
                                </span>
                            </div>

                            <div class="flex items-center justify-center gap-1.5 text-[#E5FF7F] text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                ${vendor.location || 'Accra, Ghana'}
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div class="bg-white px-4 md:px-6 py-8 -mt-6 rounded-t-[3rem] relative z-10 flex flex-col gap-6 md:gap-8">
                            <div class="text-center">
                                <p class="text-slate-500 text-xs md:text-sm font-medium leading-relaxed italic px-2">
                                    "${vendor.bio || "Your studio's narrative is shared here with patrons in the marketplace."}"
                                </p>
                            </div>

                            <!-- Contact Channels -->
                            <div class="flex flex-col gap-4">
                                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Contact Designer</h4>
                                <div class="grid grid-cols-2 gap-3">
                                    <a href="https://wa.me/${vendor.phone}" target="_blank" class="flex items-center justify-center gap-2 bg-emerald-500 text-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest">
                                        WhatsApp
                                    </a>
                                    <a href="tel:${vendor.phone}" class="flex items-center justify-center gap-2 bg-slate-900 text-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
                                        Call Store
                                    </a>
                                </div>
                            </div>

                            <!-- Performance Grid -->
                            <div class="grid grid-cols-2 gap-3 text-center">
                                <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex flex-col items-center">
                                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reliability</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-black text-slate-900">${vendor.fulfillmentRate || 99}%</span>
                                        <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex flex-col items-center">
                                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping</span>
                                    <span class="text-lg font-black text-slate-900">${vendor.averageTimeToShip || '2-4 Days'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                showCloseButton: true,
                showConfirmButton: false,
                width: window.innerWidth < 768 ? '95%' : '480px',
                background: 'white',
                padding: '0',
                customClass: {
                    popup: 'rounded-[3rem] overflow-hidden border-none mx-2',
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
                    localStorage.setItem('pending_wishlist_item', JSON.stringify({ id, name }));
                    router.push(`/auth?role=customer&redirect=${encodeURIComponent(window.location.pathname)}`);
                }
            });
            return;
        }

        if (hasSizes && !selectedSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Size Required',
                text: 'Please select a size to continue.',
                confirmButtonColor: '#0f172a', // slate-900
            });
            return;
        }
        setIsAdding(true);
        // Ensure vendorId is a string if it's an object
        const finalVendorId = (typeof vendorId === 'object' && vendorId !== null)
            ? (vendorId._id || vendorId.id)
            : vendorId;

        // Simulate network delay
        setTimeout(() => {
            addToCart({
                id,
                name,
                price: currentPrice,
                image: images[0],
                size: selectedSize || 'N/A',
                quantity: 1,
                vendorId: finalVendorId,
                vendorName: vendorName,
                vendorRegion: vendorRegion,
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
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.setItem('pending_wishlist_item', JSON.stringify({ id, name }));
                    router.push(`/auth?role=customer&redirect=${encodeURIComponent(window.location.pathname)}`);
                }
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

        if (hasSizes && !selectedSize) {
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
                    handleDeliveryDetails();
                }
            });
        } else {
            handleDeliveryDetails();
        }
    };


    const handleDeliveryDetails = async () => {
        const { value: formValues, isConfirmed } = await Swal.fire({
            title: 'DELIVERY DETAILS',
            html: `
                <div class="text-left space-y-4 py-4">
                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Delivery Address</label>
                        <input id="quick-delivery-address" type="text" placeholder="e.g. 123 Main St, East Legon" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.address || ''}" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">City</label>
                            <input id="quick-delivery-city" type="text" placeholder="e.g. Accra" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.location || ''}" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Region</label>
                            <input id="quick-delivery-region" type="text" placeholder="e.g. Greater Accra" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.region || ''}" />
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed to Payment',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const deliveryAddress = (document.getElementById('quick-delivery-address') as HTMLInputElement).value;
                const deliveryCity = (document.getElementById('quick-delivery-city') as HTMLInputElement).value;
                const deliveryRegion = (document.getElementById('quick-delivery-region') as HTMLInputElement).value;
                if (!deliveryAddress || !deliveryCity || !deliveryRegion) {
                    Swal.showValidationMessage('Please provide your complete delivery location');
                    return false;
                }
                return { deliveryAddress, deliveryCity, deliveryRegion };
            },
            customClass: {
                popup: 'rounded-[40px] border-none shadow-2xl p-10 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
            },
        });

        if (isConfirmed && formValues) {
            handlePaystackFlow(formValues);
        }
    };

    const handlePaystackFlow = async (deliveryDetails: { deliveryAddress: string, deliveryCity: string, deliveryRegion: string }) => {
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
                    size: selectedSize || 'Universal',
                    image: images[0]
                }],
                totalAmount: currentPrice,
                vendorId: (typeof vendorId === 'object' && vendorId !== null) ? (vendorId._id || vendorId.id) : vendorId,
                vendorName: vendorName,
                shippingAddress: deliveryDetails.deliveryAddress,
                shippingCity: deliveryDetails.deliveryCity,
                shippingRegion: deliveryDetails.deliveryRegion,
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
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized={true}
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
                        <div
                            onClick={handleVendorProfile}
                            className="flex items-center gap-2 w-fit cursor-pointer group/vendor relative z-30 -ml-1 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                        >
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover/vendor:text-slate-900 transition-colors">
                                by <span className="underline decoration-brand-lemon decoration-2 underline-offset-2">{vendorName}</span>
                                {uniqueVendorId && <span className="text-slate-900 ml-2 bg-brand-lemon px-2 py-0.5 rounded-full text-[8px] font-black shadow-sm">{uniqueVendorId}</span>}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/vendor:animate-pulse"></div>
                        </div>
                    )}

                    {/* Region Badge */}
                    {vendorRegion && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3 h-3 text-brand-lemon" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{vendorRegion}</span>
                        </div>
                    )}

                    {/* Feature Highlights */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-tight">Authentic Product</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-tight">Quality Guarantee</span>
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
                    {hasSizes && (
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
                    )}

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
                        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-200 rounded-full z-50" />

                        {/* Top Actions - Absolute */}
                        <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
                            <button
                                onClick={toggleWishlist}
                                className={`bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-sm border border-slate-100 transition-all active:scale-90 ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 rounded-full p-2.5 shadow-sm transition-all active:scale-95 border border-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Left: Gallery */}
                        <div className="w-full md:w-1/2 bg-[#f8f8f8] flex flex-col flex-shrink-0">
                            <div className="relative w-full h-[40vh] md:h-full group/gallery">
                                <Image
                                    src={imgError ? '/product-1.jpg' : getImageUrl(images[currentImageIndex])}
                                    alt={name}
                                    fill
                                    unoptimized={true}
                                    className="object-contain p-8 transition-all duration-700 group-hover/gallery:scale-105"
                                    onError={() => setImgError(true)}
                                />

                                {/* Image Count Indicator - Dash Style */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                    {images.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300'}`}
                                        />
                                    ))}
                                </div>

                                {/* Quick Gallery Nav - Desktop Only */}
                                <div className="hidden md:flex absolute inset-x-4 top-1/2 -translate-y-1/2 justify-between pointer-events-none">
                                    <button
                                        onClick={prevImage}
                                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-sm border border-slate-100 pointer-events-auto opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white active:scale-90"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-sm border border-slate-100 pointer-events-auto opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white active:scale-90"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
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
                                            sizes="64px"
                                            unoptimized={true}
                                            className="object-cover"

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
                        <div className="flex-1 flex flex-col relative overflow-y-auto overscroll-contain bg-white">
                            <div className="p-6 md:p-10 pb-32 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 px-3 py-1 rounded-full shadow-sm">Verified Design</span>
                                        <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                                            <Zap className="w-3 h-3 fill-current" />
                                            Marketplace Choice
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

                                {/* Size Selection - Refined */}
                                {hasSizes && (
                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Silhouette</h4>
                                                {!selectedSize && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                                            </div>
                                            <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase tracking-widest group/guide">
                                                <span className="underline decoration-brand-lemon decoration-2 underline-offset-4 group-hover/guide:text-brand-lemon transition-colors">Size Guide</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
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
                                )}

                                <div className="space-y-8">
                                    {/* Description Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-heading font-black text-xl text-slate-900 uppercase tracking-tighter">The Narrative</h3>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                <span className="text-[9px] font-black text-emerald-600 uppercase">Ethically Crafted</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm md:text-base leading-relaxed text-left font-medium opacity-90">
                                            {description || `Crafted with precision using premium bespoke tailoring techniques. This piece features our signature ${name.toLowerCase()} design, combining traditional aesthetics with modern comfort. Every stitch is a testament to our commitment to excellence.`}
                                        </p>

                                        {/* Trust Badges */}
                                        <div className="flex flex-wrap gap-4 py-2">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <Shield className="w-4 h-4 text-slate-900" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Authentic FLA</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <Zap className="w-4 h-4 text-slate-900" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Fast Customization</span>
                                            </div>
                                        </div>

                                        {/* Vendor Info Section - Luxury Card */}
                                        {vendorName && (
                                            <div
                                                onClick={handleVendorProfile}
                                                className="mt-4 flex items-center gap-4 p-5 bg-slate-900 text-white rounded-[2.5rem] cursor-pointer hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 group/vendor"
                                            >
                                                <div className="relative">
                                                    <div className="w-14 h-14 rounded-[1.5rem] bg-brand-lemon flex items-center justify-center text-slate-900 font-black text-2xl group-hover/vendor:scale-105 transition-transform">
                                                        {vendorName.charAt(0)}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Studio Partner</p>
                                                    <p className="text-lg font-black group-hover:text-brand-lemon transition-colors leading-none tracking-tight">
                                                        {vendorName}
                                                        {uniqueVendorId && <span className="text-[10px] text-brand-lemon/50 ml-2 font-black">#{uniqueVendorId}</span>}
                                                    </p>
                                                </div>
                                                <div className="bg-white/10 p-3 rounded-2xl group-hover/vendor:translate-x-1 transition-transform">
                                                    <ChevronRight className="w-5 h-5 text-brand-lemon" />
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
                            <div className="sticky bottom-0 left-0 right-0 p-6 md:p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex gap-4 z-50 mt-auto">
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

