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

    vendorName?: string;
    uniqueVendorId?: string;
    hasSizes?: boolean;
    hasColors?: boolean;
    colors?: string[];
    vendorRegion?: string;
    vendorBio?: string;
}

export default function ProductCard({ id, name, price, images, sizes = [], imageLabels, duration = '6-7 working days', stock, index, vendorId, initialWishlistState = false, description, vendorName, uniqueVendorId, hasSizes = true, hasColors = true, colors = [], vendorRegion, vendorBio }: ProductCardProps) {
    const isBatch = false;
    const currentPrice = price;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { addToCart } = useCart();
    const { isAuthenticated, user, token } = useAuth();
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
            const resolvedBannerImage = vendor.bannerImage ? getImageUrl(vendor.bannerImage) : null;

            Swal.fire({
                html: `
                    <div class="flex flex-col -m-3 md:-m-6 overflow-hidden max-w-full">
                        <!-- Luxury Header -->
                        <div class="relative pt-12 pb-10 px-6 text-center overflow-hidden min-h-[180px] flex flex-col items-center justify-center">
                            ${resolvedBannerImage 
                                ? `<img src="${resolvedBannerImage}" class="absolute inset-0 w-full h-full object-cover" />
                                   <div class="absolute inset-0 bg-slate-900/60"></div>`
                                : `<div class="absolute inset-0 bg-slate-900"></div>
                                   <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                       <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                                   </div>`
                            }
                            
                            <div class="relative inline-block mb-4">
                                ${vendor.profileImage
                                    ? `<img src="${resolvedProfileImage}" class="w-24 h-24 md:w-28 md:h-28 rounded-none object-cover border-2 border-[#E5FF7F] shadow-2xl mx-auto relative z-10">`
                                    : `<div class="w-24 h-24 md:w-28 md:h-28 rounded-none bg-slate-800 flex items-center justify-center text-[#E5FF7F] border-2 border-slate-700 shadow-2xl mx-auto relative z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                       </div>`
                                }
                                <div class="absolute -bottom-1 -right-1 bg-[#E5FF7F] p-1.5 rounded-none shadow-lg border-2 border-slate-900 z-20">
                                    <svg class="w-4 h-4 text-slate-900" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-center gap-1.5 relative z-10">
                                <h2 class="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">${vendor.shopName || vendor.name}</h2>
                                <span class="bg-[#E5FF7F]/10 text-[#E5FF7F] text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-none border border-[#E5FF7F]/20 backdrop-blur-md">
                                    ID: ${vendor.uniqueVendorId}
                                </span>
                            </div>

                            <div class="flex items-center justify-center gap-1.5 text-[#E5FF7F] text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-3 relative z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                ${vendor.location || 'Accra, Ghana'}
                            </div>
                        </div>

                        <!-- Content Area -->
                        <div class="bg-white px-4 md:px-6 py-8 -mt-6 rounded-none relative z-10 flex flex-col gap-6 md:gap-8 border-x border-slate-100">
                            <div class="text-center">
                                <p class="text-slate-500 text-xs md:text-sm font-medium leading-relaxed italic px-2">
                                    "${vendor.bio || "Your studio's narrative is shared here with patrons in the marketplace."}"
                                </p>
                            </div>

                            <!-- Performance Grid -->
                            <div class="flex justify-center">
                                <div class="bg-slate-50 w-full px-10 py-5 rounded-none border border-slate-100 flex flex-col items-center shadow-sm">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Shipping Time</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl font-black text-slate-900">${duration || '6-7 Days'}</span>
                                        <div class="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></div>
                                    </div>
                                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60 italic">Secure Split Pay</span>
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
                    popup: 'rounded-none overflow-hidden border border-slate-100 mx-2 shadow-2xl',
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
                confirmButtonColor: '#0f172a',
            });
            return;
        }

        if (hasColors && !selectedColor) {
            Swal.fire({
                icon: 'warning',
                title: 'Color Required',
                text: 'Please select a color to continue.',
                confirmButtonColor: '#0f172a',
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
                color: selectedColor || 'N/A',
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
            const method = isWishlisted ? 'DELETE' : 'POST';
            const url = isWishlisted
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist/${id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
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

        if (hasColors && !selectedColor) {
            Swal.fire({
                icon: 'warning',
                title: 'Color Required',
                text: 'Please select a color to continue.',
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
                             <p class="font-bold flex items-center gap-2"> Split Payment Protection</p>
                            <p class="text-xs mt-1">Your payment is settled to the vendor upon successful delivery confirmation.</p>
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
        let selectedDeliveryFee = 0;
        let selectedLocationName = '';

        const { value: formValues, isConfirmed } = await Swal.fire({
            title: 'DELIVERY DETAILS',
            html: `
                <div class="text-left space-y-4 py-4">
                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Delivery Address</label>
                        <input id="quick-delivery-address" type="text" placeholder="e.g. 123 Main St, East Legon" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.address || ''}" />
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2 relative">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Search Location (Skynet)</label>
                            <input id="quick-delivery-city" type="text" placeholder="Start typing your area..." class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.location || ''}" autocomplete="off" />
                            <div id="location-suggestions" class="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-none border border-slate-100 overflow-hidden z-[100] hidden">
                                <!-- Suggestions will appear here -->
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Region</label>
                            <input id="quick-delivery-region" type="text" placeholder="e.g. Greater Accra" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.region || ''}" />
                        </div>
                    </div>
                    
                    <!-- Fee Summary -->
                    <div id="delivery-fee-summary" class="mt-6 p-4 rounded-none bg-slate-50 border border-slate-100 space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Item Price</span>
                            <span>GH₵ ${currentPrice.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span class="flex items-center gap-1">Delivery Fee <span class="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-none ml-1">Pay on Delivery</span></span>
                            <span id="display-delivery-fee">GH₵ 0.00</span>
                        </div>
                        <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
                            <div class="flex flex-col">
                                <span class="text-sm font-black text-slate-900 uppercase">Payable Now</span>
                                <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Digital Payment for Item Only</span>
                            </div>
                            <span id="display-total-amount" class="text-lg font-black text-slate-900">GH₵ ${currentPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed to Payment',
            cancelButtonText: 'Cancel',
            didOpen: () => {
                const cityInput = document.getElementById('quick-delivery-city') as HTMLInputElement;
                const suggestionsBox = document.getElementById('location-suggestions') as HTMLDivElement;
                const regionInput = document.getElementById('quick-delivery-region') as HTMLInputElement;
                const feeDisplay = document.getElementById('display-delivery-fee') as HTMLSpanElement;
                const totalDisplay = document.getElementById('display-total-amount') as HTMLSpanElement;

                let timeout: NodeJS.Timeout;

                cityInput.addEventListener('input', (e) => {
                    const query = (e.target as HTMLInputElement).value;
                    clearTimeout(timeout);
                    if (query.length < 2) {
                        suggestionsBox.classList.add('hidden');
                        return;
                    }

                    timeout = setTimeout(async () => {
                        try {
                            const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
                            const response = await fetch(`${apiBase}/logistics/locations/search?q=${encodeURIComponent(query)}`);
                            const locations = await response.json();

                            if (locations.length > 0) {
                                suggestionsBox.innerHTML = locations.map((loc: any) => `
                                    <button class="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors" data-name="${loc.name}" data-fee="${loc.deliveryFee}" data-zone="${loc.zone}">
                                        <div class="flex flex-col">
                                            <span class="text-sm font-black text-slate-900">${loc.name}</span>
                                            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">${loc.zone} ${loc.cluster ? `(${loc.cluster})` : ''}</span>
                                        </div>
                                        <span class="text-xs font-black text-brand-lemon bg-slate-900 px-2 py-1 rounded-lg">GH₵ ${loc.deliveryFee}</span>
                                    </button>
                                `).join('');
                                suggestionsBox.classList.remove('hidden');

                                // Attach click events to suggestions
                                suggestionsBox.querySelectorAll('button').forEach(btn => {
                                    btn.addEventListener('click', (ev) => {
                                        const name = btn.getAttribute('data-name') || '';
                                        const fee = parseInt(btn.getAttribute('data-fee') || '0');
                                        const zone = btn.getAttribute('data-zone') || '';

                                        cityInput.value = name;
                                        selectedLocationName = name;
                                        selectedDeliveryFee = fee;
                                        
                                        // Auto-fill region if we can infer it or just leave for user
                                        // Update displays
                                        feeDisplay.textContent = `GH₵ ${fee.toLocaleString()}.00`;
                                        totalDisplay.textContent = `GH₵ ${currentPrice.toLocaleString()}.00`;
                                        
                                        suggestionsBox.classList.add('hidden');
                                    });
                                });
                            } else {
                                suggestionsBox.classList.add('hidden');
                            }
                        } catch (err) {
                            console.error('Search error:', err);
                        }
                    }, 300);
                });

                // Close suggestions on outside click
                document.addEventListener('click', (e) => {
                    if (!cityInput.contains(e.target as Node) && !suggestionsBox.contains(e.target as Node)) {
                        suggestionsBox.classList.add('hidden');
                    }
                });
            },
            preConfirm: () => {
                const deliveryAddress = (document.getElementById('quick-delivery-address') as HTMLInputElement).value;
                const deliveryCity = (document.getElementById('quick-delivery-city') as HTMLInputElement).value;
                const deliveryRegion = (document.getElementById('quick-delivery-region') as HTMLInputElement).value;
                
                if (!deliveryAddress || !deliveryCity || !deliveryRegion) {
                    Swal.showValidationMessage('Please provide your complete delivery location');
                    return false;
                }
                
                return { 
                    deliveryAddress, 
                    deliveryCity, 
                    deliveryRegion, 
                    deliveryFee: selectedDeliveryFee,
                    totalProductAmount: currentPrice
                };
            },
            customClass: {
                popup: 'rounded-none border border-slate-100 shadow-2xl p-10 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                confirmButton: 'bg-slate-900 text-white rounded-none px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                cancelButton: 'bg-slate-100 text-slate-500 rounded-none px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
            },
        });

        if (isConfirmed && formValues) {
            handleCheckoutFlow(formValues);
        }
    };

    const handleCheckoutFlow = async (deliveryDetails: { deliveryAddress: string, deliveryCity: string, deliveryRegion: string, deliveryFee: number, totalProductAmount: number }) => {
        try {

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
                    color: selectedColor || 'Universal',
                    image: images[0]
                }],
                totalProductAmount: deliveryDetails.totalProductAmount,
                deliveryFee: deliveryDetails.deliveryFee,
                totalAmount: deliveryDetails.totalProductAmount + deliveryDetails.deliveryFee,
                vendorId: (typeof vendorId === 'object' && vendorId !== null) ? (vendorId._id || vendorId.id) : vendorId,
                vendorName: vendorName,
                shippingAddress: deliveryDetails.deliveryAddress,
                shippingCity: deliveryDetails.deliveryCity,
                shippingRegion: deliveryDetails.deliveryRegion,
                customerName: user?.name,
                customerEmail: user?.email,
                customerPhone: user?.phone,
                customerId: user?._id || user?.id || user?.userId,
                paymentMethod: 'paystack',
                notes: 'Quick Buy Checkout (Skynet Express)'
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to initialize payment');
            }

            const { paymentLink } = await response.json();
            
            // Close the loading modal right before redirecting. 
            // This prevents it from being stuck open if the user clicks "Back" in their browser.
            Swal.close();
            
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
                className={`bg-white p-4 rounded-none group hover:shadow-2xl transition-all duration-700 ease-out border border-slate-100 hover:border-slate-300 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
                    }`}>
                {/* Image Container */}
                <div className="relative w-full aspect-[4/5] bg-[#F7F7F7] rounded-none overflow-hidden mb-5 group/image transition-all duration-500 hover:shadow-inner">
                    {/* New Arrival Badge & Sold Out Overlay */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        {!isSoldOut && (
                            <div className="bg-[#DFEA73] text-[#2C3E02] text-[10px] font-black px-3 py-1.5 rounded-none uppercase tracking-tighter shadow-sm w-fit">
                                New Arrival
                            </div>
                        )}
                        {isSoldOut && (
                            <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-none uppercase tracking-[0.2em] border border-white/20 w-fit shadow-xl">
                                Sold Out
                            </div>
                        )}
                    </div>

                    {isSoldOut && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <span className="text-[120px] font-black text-slate-900/5 select-none tracking-tighter uppercase rotate-[-25deg]">SOLD</span>
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
                            className="flex items-center gap-2 w-fit cursor-pointer group/vendor relative z-30 -ml-1 p-2 rounded-none hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                        >
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover/vendor:text-slate-900 transition-colors">
                                by <span className="underline decoration-brand-lemon decoration-2 underline-offset-2">{vendorName}</span>
                                {uniqueVendorId && <span className="text-slate-900 ml-2 bg-brand-lemon px-2 py-0.5 rounded-none text-[8px] font-black shadow-sm">{uniqueVendorId}</span>}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/vendor:animate-pulse"></div>
                        </div>
                    )}

                    {/* Region & Shipping Info Badge */}
                    <div className="flex items-center gap-4 text-slate-400">
                        {vendorRegion && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-brand-lemon" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{vendorRegion}</span>
                            </div>
                        )}
                        {duration && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-brand-lemon" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{duration}</span>
                            </div>
                        )}
                    </div>

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

                    <div className="flex justify-between items-center pt-2 pb-3 border-b border-slate-50 mb-3">
                        <div className="flex flex-col">
                            <span className="text-slate-300 line-through text-[9px] font-bold">GH₵{Math.round(price * 1.15)}</span>
                            <span className="font-sans font-black text-slate-900 text-base md:text-lg tracking-tight -mt-1">GH₵{price}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stock > 5 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {stock > 0 ? `${stock} Left` : 'Sold Out'}
                            </span>
                            <div className={`w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden`}>
                                <div 
                                    className={`h-full rounded-full ${stock > 5 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                                    style={{ width: `${Math.min((stock / 20) * 100, 100)}%` }}
                                />
                            </div>
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
                                    className={`flex-none w-8 h-8 rounded-none text-[10px] font-black border transition-all active:scale-90
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
                            className="flex items-center justify-center py-3.5 px-6 rounded-none border border-slate-900 text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] whitespace-nowrap touch-manipulation relative z-50 !cursor-pointer !pointer-events-auto"
                        >
                            Learn More
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex items-center justify-center py-3.5 px-6 rounded-none bg-brand-lemon text-slate-900 text-[11px] font-bold transition-all active:scale-[0.98] whitespace-nowrap touch-manipulation relative z-50 !cursor-pointer !pointer-events-auto"
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
                    <div className="relative bg-white w-full max-w-4xl h-[92vh] md:h-[85vh] rounded-none shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom md:zoom-in-95 duration-500 pointer-events-auto overflow-hidden border border-slate-100">
                        {/* Top Actions - Absolute */}
                        <div className="absolute top-6 right-6 z-[60] flex items-center gap-3">
                            <button
                                onClick={toggleWishlist}
                                className={`w-12 h-12 bg-white/95 backdrop-blur-xl flex items-center justify-center rounded-none shadow-2xl border border-slate-100 transition-all hover:scale-110 active:scale-90 ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-12 h-12 bg-white/95 backdrop-blur-xl flex items-center justify-center text-slate-900 rounded-none shadow-2xl transition-all hover:scale-110 active:scale-90 border border-slate-100"
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
                                        className={`relative flex-shrink-0 w-12 h-16 md:w-14 md:h-20 rounded-none overflow-hidden border-2 transition-all duration-300 ${idx === currentImageIndex
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
                            <div className="p-6 md:p-10 pb-32">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="px-4 py-1.5 bg-slate-900 text-[9px] font-black uppercase tracking-[0.2em] text-brand-lemon rounded-none shadow-xl shadow-slate-900/10 border border-slate-800">
                                            Verified Design
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                            <Zap className="w-3.5 h-3.5 fill-current" />
                                            Marketplace Choice
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="font-heading text-3xl md:text-5xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase">{name}</h2>
                                        <div className="flex items-end justify-between border-b border-slate-100 pb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price Point</span>
                                                <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">GH₵{price}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`px-4 py-1.5 rounded-none inline-flex items-center gap-2 ${stock > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-none ${stock > 5 ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {stock > 0 ? `${stock} PIECES IN STOCK` : 'SOLD OUT'}
                                                    </span>
                                                </div>
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
                                                        className={`min-w-[3.5rem] h-12 md:h-14 px-4 rounded-none font-black border-2 transition-all text-xs md:text-sm
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

                                {/* Color Selection (NEW) */}
                                {hasColors && (
                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Finish</h4>
                                                {!selectedColor && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {(() => {
                                                const safeColors = (Array.isArray(colors) && colors.length > 0) ? colors : ['Black', 'White', 'Cream', 'Gold'];
                                                return safeColors.map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setSelectedColor(color)}
                                                        className={`h-12 md:h-14 px-5 rounded-none font-black border-2 transition-all text-xs flex items-center gap-2
                                                            ${selectedColor === color
                                                                ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                                                                : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-white hover:scale-105'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`w-3 h-3 rounded-none border border-black/10`} style={{ 
                                                            backgroundColor: color.toLowerCase() === 'pattern' ? 'transparent' : color.toLowerCase(),
                                                            backgroundImage: color.toLowerCase() === 'pattern' ? 'conic-gradient(from 0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)' : 'none'
                                                        }} />
                                                        {color}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div className="space-y-6 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Storytelling</span>
                                                <h3 className="font-heading font-black text-2xl text-slate-900 uppercase tracking-tighter">The Narrative</h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 rounded-none border border-emerald-100 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ethically Crafted</span>
                                            </div>
                                        </div>
                                        
                                        <div className="relative p-6 bg-slate-50/50 rounded-none border border-slate-100 overflow-hidden">
                                            {/* Luxury Pattern */}
                                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="narrativeGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#narrativeGrid)" /></svg>
                                            </div>
                                            
                                            <p className="relative z-10 text-slate-600 text-sm md:text-base leading-relaxed text-left font-medium">
                                                {description || `Crafted with precision using premium heritage craftsmanship techniques. This piece features our signature ${name.toLowerCase()} design, combining traditional aesthetics with modern comfort. Every detail is a testament to our commitment to excellence.`}
                                            </p>
                                        </div>

                                        {/* Trust Badges */}
                                        <div className="flex flex-wrap gap-4 py-2">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <div className="w-8 h-8 rounded-none bg-slate-50 flex items-center justify-center">
                                                    <Shield className="w-4 h-4 text-slate-900" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Authentic FLA</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <div className="w-8 h-8 rounded-none bg-slate-50 flex items-center justify-center">
                                                    <Zap className="w-4 h-4 text-slate-900" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Fast Customization</span>
                                            </div>
                                        </div>

                                        {/* Vendor Info Section - Luxury Card */}
                                        {vendorName && (
                                            <div className="space-y-4">
                                                <div
                                                    onClick={handleVendorProfile}
                                                    className="mt-6 flex items-center gap-5 p-6 bg-slate-900 text-white rounded-none cursor-pointer hover:bg-black active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/20 group/vendor relative overflow-hidden"
                                                >
                                                    {/* Subtle Pattern Background */}
                                                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                                                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="vendorGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#vendorGrid)" /></svg>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-none bg-brand-lemon flex items-center justify-center text-slate-900 font-black text-3xl group-hover/vendor:scale-105 transition-transform duration-500">
                                                            {vendorName.charAt(0)}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-none border-[3px] border-slate-900 flex items-center justify-center">
                                                            <Check className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 relative z-10">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Studio Partner</p>
                                                        <p className="text-xl font-black group-hover:text-brand-lemon transition-colors leading-none tracking-tight uppercase">
                                                            {vendorName}
                                                        </p>
                                                        {uniqueVendorId && <span className="text-[9px] text-brand-lemon/40 font-black tracking-widest mt-1 inline-block">#{uniqueVendorId}</span>}
                                                    </div>
                                                    <div className="bg-white/10 w-12 h-12 flex items-center justify-center rounded-none group-hover/vendor:bg-brand-lemon group-hover/vendor:text-slate-900 transition-all duration-500">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                </div>

                                                {/* Refund & Store Policy Section (Transparent for Paystack Compliance) */}
                                                <div className="bg-slate-50 rounded-none p-6 border border-slate-100 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Store & Refund Policy</h4>
                                                        <div className="px-2 py-1 bg-brand-lemon text-slate-900 text-[8px] font-black rounded-md uppercase tracking-widest">Mediator Protected</div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-slate-600 text-xs leading-relaxed font-medium">
                                                            {vendorBio || "The vendor has not specified a detailed policy yet. By purchasing, you agree to the standard FLA mediation terms."}
                                                        </p>
                                                        <div className="pt-2 flex items-start gap-2 border-t border-slate-200/50">
                                                            <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                                            <p className="text-[9px] text-slate-400 italic leading-tight">
                                                                Funds are split directly to vendors. FLA acts as a mediator to assist in dispute resolution and fund retrieval if needed.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-4 rounded-none bg-white border border-slate-100 shadow-sm">
                                            <Clock className="w-5 h-5 text-slate-900" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prep Time</span>
                                                <span className="text-[11px] font-black text-slate-900">{duration}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 rounded-none bg-white border border-slate-100 shadow-sm">
                                            <Shield className="w-5 h-5 text-slate-900" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quality</span>
                                                <span className="text-[11px] font-black text-slate-900">Signature</span>
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
                                    className="flex-1 py-5 rounded-none bg-slate-50 border border-slate-200 font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    {isAdding ? 'Adding...' : 'Add to Bag'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="flex-[1.5] py-5 rounded-none bg-brand-lemon text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-brand-lemon/20 hover:scale-[1.02] transition-all active:scale-95 relative overflow-hidden group/btn"
                                >
                                    <span className="relative z-10">Quick Checkout</span>
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

