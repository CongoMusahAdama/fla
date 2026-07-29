"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, X, MessageSquare, ShoppingBag, Star, Zap, Shield, Check, Heart, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getImageUrl, getOptimizedImage, getVendorDisplayLocation } from '@/lib/utils';
import { isVendorDocumented } from '@/lib/kyc';
import { VendorTrustBadge } from '@/components/VendorTrustBadge';
import { resolveStoreSlug, storeHomePath, storeProductPath } from '@/lib/storefront';
import { saveMarketplaceReturn } from '@/lib/marketplace-return';

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
    storeSlug?: string;
    hasSizes?: boolean;
    hasColors?: boolean;
    colors?: string[];
    vendorRegion?: string;
    vendorCity?: string;
    vendorBio?: string;
    vendorDocumented?: boolean;
    vendorTier?: 'low' | 'high';
}

export default React.memo(function ProductCard({ id, name, price, images, sizes = [], imageLabels, duration = '6-7 working days', stock, index, vendorId, initialWishlistState = false, description, vendorName, uniqueVendorId, storeSlug, hasSizes = true, hasColors = true, colors = [], vendorRegion, vendorCity, vendorBio, vendorDocumented, vendorTier }: ProductCardProps) {
    const isBatch = false;
    const currentPrice = price;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [vendorModal, setVendorModal] = useState<{
        shopName: string;
        uniqueVendorId?: string;
        bio?: string;
        profileImage?: string;
        location?: string | null;
        documented?: boolean;
    } | null>(null);
    const [vendorModalLoading, setVendorModalLoading] = useState(false);
    const { addToCart } = useCart();
    const { isAuthenticated, user, token } = useAuth();
    const [isWishlisted, setIsWishlisted] = useState(initialWishlistState);
    const [imgError, setImgError] = useState(false);
    const router = useRouter();

    const vendorDocStatus =
        vendorDocumented ??
        (vendorTier === 'high' ? true : vendorTier === 'low' ? false : undefined) ??
        (typeof vendorId === 'object' && vendorId !== null
            ? isVendorDocumented(vendorId as Parameters<typeof isVendorDocumented>[0])
            : false);

    const resolvedStoreSlug = resolveStoreSlug(storeSlug, vendorId);

    const openStoreProduct = () => {
        if (resolvedStoreSlug) {
            saveMarketplaceReturn(id);
            router.push(storeProductPath(resolvedStoreSlug, id));
            return;
        }
        setIsDetailModalOpen(true);
    };

    const handleVendorProfile = async (e: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (resolvedStoreSlug) {
            router.push(storeHomePath(resolvedStoreSlug));
            return;
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

        setVendorModalLoading(true);
        try {
            const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
            const response = await fetch(`${apiBase}/users/vendor/${validVendorId}/profile`);
            if (!response.ok) throw new Error('Failed to fetch vendor profile');
            const data = await response.json();
            const { vendor } = data;

            if (vendor.storeSlug) {
                router.push(storeHomePath(vendor.storeSlug));
                return;
            }

            setVendorModal({
                shopName: vendor.shopName || vendor.name || vendorName || 'Vendor',
                uniqueVendorId: vendor.uniqueVendorId,
                bio: vendor.bio,
                profileImage: vendor.profileImage ? getImageUrl(vendor.profileImage) : undefined,
                location: getVendorDisplayLocation(
                    { location: vendor.location || vendorCity, region: vendor.region },
                    vendorRegion,
                ),
                documented: isVendorDocumented({
                    vendorTier: vendor.vendorTier,
                    businessRegistration: vendor.businessRegistration,
                }),
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
        } finally {
            setVendorModalLoading(false);
        }
    };

    useEffect(() => {
        setImgError(false);
    }, [currentImageIndex, images]);

    // Modal body scroll lock
    useEffect(() => {
        if (!isDetailModalOpen && !vendorModal && !vendorModalLoading) return;

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, [isDetailModalOpen, vendorModal, vendorModalLoading]);


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
                tailoringTime: duration,
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

        // Close product sheet so delivery popup is not trapped behind it on mobile
        setIsDetailModalOpen(false);

        // Guest Checkout Flow
        if (!isAuthenticated) {
            const { isConfirmed: wantAccount, isDenied: wantGuest, isDismissed } = await Swal.fire({
                title: 'CHOOSE CHECKOUT',
                html: `
                    <div class="text-left space-y-4">
                        <div class="bg-brand-lemon/10 p-4 rounded-xl border border-brand-lemon/20">
                            <h4 class="font-black text-slate-900 mb-2">Create Account (Recommended)</h4>
                            <ul class="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                <li>Monetize your order and earn</li>
                                <li>Full buyer protection</li>
                                <li>Ability to open disputes</li>
                            </ul>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 class="font-black text-slate-500 mb-2">Guest Checkout</h4>
                            <ul class="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                <li>No buyer protection</li>
                                <li>Cannot open disputes</li>
                                <li>Receive SMS notification with vendor's WhatsApp</li>
                            </ul>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Create Account',
                denyButtonText: 'Buy without Account',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#0f172a',
                denyButtonColor: '#64748b',
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-6 md:p-8 bg-white w-full max-w-md',
                    title: 'text-xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    actions: 'flex flex-col gap-2 w-full mt-4',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-6 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all w-full m-0',
                    denyButton: 'bg-slate-100 text-slate-500 rounded-full px-6 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all w-full m-0',
                    cancelButton: 'hidden' // hide default cancel to use deny as guest
                }
            });

            if (wantAccount) {
                router.push('/auth?role=customer');
                return;
            } else if (wantGuest) {
                const { value: guestDetails } = await Swal.fire({
                    title: 'GUEST DETAILS',
                    html: `
                        <div class="text-left space-y-4 py-4">
                            <div class="space-y-2">
                                <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">WhatsApp Number</label>
                                <input id="guest-whatsapp" type="tel" placeholder="e.g. 024xxxxxxx" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Email Address</label>
                                <input id="guest-email" type="email" placeholder="e.g. you@example.com" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Continue',
                    cancelButtonText: 'Cancel',
                    preConfirm: () => {
                        const phone = (document.getElementById('guest-whatsapp') as HTMLInputElement).value;
                        const email = (document.getElementById('guest-email') as HTMLInputElement).value;
                        
                        if (!phone || !email) {
                            Swal.showValidationMessage('Please provide both WhatsApp number and Email');
                            return false;
                        }
                        return { phone, email };
                    },
                    customClass: {
                        popup: 'rounded-3xl border border-slate-100 shadow-2xl p-10 bg-white',
                        title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                        confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                        cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
                    },
                });

                if (!guestDetails) return; 
                
                processOrder(guestDetails);
                return;
            } else {
                return; // cancelled
            }
        } else {
            // User is authenticated
            processOrder(null);
        }

        function processOrder(guestInfo: { phone: string, email: string } | null) {
            // Made-to-order items may take longer to produce
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
                                 <p class="font-bold flex items-center gap-2"> Paystack Payment</p>
                                <p class="text-xs mt-1">You pay via Paystack at checkout. Delivery fees are arranged directly with the vendor.</p>
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
                        handleDeliveryDetails(guestInfo);
                    }
                });
            } else {
                handleDeliveryDetails(guestInfo);
            }
        }
    };


    const handleDeliveryDetails = async (guestInfo: { phone: string, email: string } | null = null) => {
        const { value: formValues, isConfirmed } = await Swal.fire({
            title: 'DELIVERY DETAILS',
            html: `
                <div class="text-left space-y-4 py-4">
                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Delivery Address</label>
                        <input id="quick-delivery-address" type="text" placeholder="e.g. 123 Main St, East Legon" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.address || ''}" />
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2 relative">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Search Location (Skynet)</label>
                            <input id="quick-delivery-city" type="text" placeholder="Start typing your area..." class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.location || ''}" autocomplete="off" />
                            <div id="location-suggestions" class="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-[100] hidden">
                                <!-- Suggestions will appear here -->
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Region</label>
                            <input id="quick-delivery-region" type="text" placeholder="e.g. Greater Accra" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.region || ''}" />
                        </div>
                    </div>
                    
                    <!-- Payment Summary -->
                    <div class="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Item Total (Pay Now)</span>
                            <span>GH₵ ${currentPrice.toLocaleString()}</span>
                        </div>
                        <p class="text-[9px] text-slate-500 font-bold leading-relaxed pt-1 border-t border-slate-200">
                            Delivery is <span class="text-slate-900">not charged on FLA</span>. Pay delivery directly to the vendor or courier.
                        </p>
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
                                    <button class="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors" data-name="${loc.name}" data-zone="${loc.zone}">
                                        <div class="flex flex-col">
                                            <span class="text-sm font-black text-slate-900">${loc.name}</span>
                                            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">${loc.zone} ${loc.cluster ? `(${loc.cluster})` : ''}</span>
                                        </div>
                                    </button>
                                `).join('');
                                suggestionsBox.classList.remove('hidden');

                                // Attach click events to suggestions
                                suggestionsBox.querySelectorAll('button').forEach(btn => {
                                    btn.addEventListener('click', () => {
                                        cityInput.value = btn.getAttribute('data-name') || '';
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
                    totalProductAmount: currentPrice
                };
            },
            customClass: {
                popup: 'rounded-3xl border border-slate-100 shadow-2xl p-10 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
            },
        });

        if (isConfirmed && formValues) {
            handleCheckoutFlow(formValues, guestInfo);
        }
    };

    const handleCheckoutFlow = async (deliveryDetails: { deliveryAddress: string, deliveryCity: string, deliveryRegion: string, totalProductAmount: number }, guestInfo: { phone: string, email: string } | null = null) => {
        try {
            if (guestInfo) {
                const { openWhatsAppChat, getFlaAdminWhatsAppPhone } = await import('@/lib/whatsapp');
                const message = `*GUEST ORDER*
*Product:* ${name} (x1)
*Size:* ${selectedSize || 'Universal'} | *Color:* ${selectedColor || 'Universal'}
*Total:* GH₵ ${deliveryDetails.totalProductAmount.toLocaleString()}
*Vendor:* ${vendorName || 'Unknown Vendor'}

*Guest Info*
*WhatsApp:* ${guestInfo.phone}
*Email:* ${guestInfo.email}

*Delivery Address*
${deliveryDetails.deliveryAddress}, ${deliveryDetails.deliveryCity}, ${deliveryDetails.deliveryRegion}`;

                openWhatsAppChat(getFlaAdminWhatsAppPhone(), message);
                return;
            }

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
                    image: images[0],
                    tailoringTime: duration,
                }],
                totalProductAmount: deliveryDetails.totalProductAmount,
                deliveryFee: 0,
                totalAmount: deliveryDetails.totalProductAmount,
                vendorId: (typeof vendorId === 'object' && vendorId !== null) ? (vendorId._id || vendorId.id) : vendorId,
                vendorName: vendorName,
                shippingAddress: deliveryDetails.deliveryAddress,
                shippingCity: deliveryDetails.deliveryCity,
                shippingRegion: deliveryDetails.deliveryRegion,
                customerName: user?.name,
                customerEmail: user?.email,
                customerPhone: user?.phone,
                customerId: user?._id || user?.id || user?.userId || null,
                paymentMethod: 'paystack',
                notes: 'Quick Buy Checkout (Skynet Express)'
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders`, {
                method: 'POST',
                headers,
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

    const thumbSrc = imgError
        ? '/product-1.jpg'
        : getOptimizedImage(images[0] || '/product-1.jpg', 480, 360);

    return (
        <>
            <div
                data-product-id={id}
                onClick={openStoreProduct}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '280px 420px' }}
                className="bg-white rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-200 cursor-pointer will-change-auto"
            >
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] bg-[#f7f8fa] overflow-hidden mb-2.5">
                    {/* New Arrival Badge & Sold Out Overlay */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
                        {!isSoldOut && (
                            <div className="bg-brand-lemon text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-sm w-fit">
                                New Arrival
                            </div>
                        )}
                        {isSoldOut && (
                            <div className="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.15em] border border-white/20 w-fit shadow-xl">
                                Sold Out
                            </div>
                        )}
                    </div>

                    {isSoldOut && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <span className="text-[80px] font-black text-slate-900/5 select-none tracking-tighter uppercase rotate-[-25deg]">SOLD</span>
                        </div>
                    )}

                    {/* Primary thumbnail only — no hover swap (avoids extra downloads + scroll jank) */}
                    <div className="w-full h-full relative">
                        <Image
                            src={thumbSrc}
                            alt={name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            loading={index < 4 ? 'eager' : 'lazy'}
                            decoding="async"
                            unoptimized
                            className={`object-cover ${isSoldOut ? 'grayscale contrast-[0.8] opacity-60' : ''}`}
                            onError={() => setImgError(true)}
                        />
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-1.5 px-2.5 sm:px-3 pb-2.5 sm:pb-3">
                    <h3 className="font-heading font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-brand-lemon transition-colors">
                        {name}
                    </h3>

                    {/* Vendor Link */}
                    {vendorName && (
                        <div
                            onClick={handleVendorProfile}
                            className="flex items-center gap-1.5 w-fit max-w-full cursor-pointer group/vendor relative z-30 -ml-0.5 px-1 py-0.5 rounded-lg hover:bg-slate-50 transition-all"
                        >
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover/vendor:text-slate-900 transition-colors truncate">
                                by <span className="underline decoration-brand-lemon decoration-2 underline-offset-2">{vendorName}</span>
                                {uniqueVendorId && <span className="text-slate-900 ml-1.5 bg-brand-lemon px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-sm">{uniqueVendorId}</span>}
                            </span>
                            <VendorTrustBadge documented={vendorDocStatus} />
                        </div>
                    )}

                    {/* Region & Shipping — single compact row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
                        {getVendorDisplayLocation({ location: vendorCity, region: vendorRegion }) && (
                            <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="w-3 h-3 text-brand-lemon shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-wide truncate">
                                    {getVendorDisplayLocation({ location: vendorCity, region: vendorRegion })}
                                </span>
                            </div>
                        )}
                        {duration && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-brand-lemon shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-wide">{duration}</span>
                            </div>
                        )}
                    </div>

                    {/* Feature Highlights — one row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1 text-slate-500">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-tight">Authentic</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                            <Shield className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-tight">Guaranteed</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <div className="flex flex-col">
                            <span className="text-slate-300 line-through text-[9px] font-bold leading-none">GH₵{Math.round(price * 1.15)}</span>
                            <span className="font-sans font-black text-slate-900 text-base tracking-tight">GH₵{price}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-[9px] font-black uppercase tracking-wide ${stock > 5 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {stock > 0 ? `${stock} Left` : 'Sold Out'}
                            </span>
                            <div className={`w-10 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden`}>
                                <div 
                                    className={`h-full rounded-full ${stock > 5 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                                    style={{ width: `${Math.min((stock / 20) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Size Selection (Quick Access) */}
                    {hasSizes && (
                        <div className="flex gap-1 mb-1 overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                            {(sizes && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL']).map(size => (
                                <button
                                    key={size}
                                    onClick={() => !isSoldOut && setSelectedSize(size)}
                                    disabled={isSoldOut}
                                    className={`flex-none w-7 h-7 rounded-lg text-[9px] font-black border transition-all active:scale-90
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
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={openStoreProduct}
                            className="flex items-center justify-center py-2.5 px-3 rounded-full border border-slate-900 text-[10px] font-bold text-slate-900 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] whitespace-nowrap touch-manipulation relative z-50 !cursor-pointer !pointer-events-auto"
                        >
                            Learn More
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex items-center justify-center py-2.5 px-3 rounded-full bg-brand-lemon text-slate-900 text-[10px] font-bold transition-all active:scale-[0.98] whitespace-nowrap touch-manipulation relative z-50 !cursor-pointer !pointer-events-auto"
                        >
                            Quick Checkout
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6 overscroll-none">
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setIsDetailModalOpen(false)}
                        aria-hidden
                    />
                    <div className="relative bg-white w-full max-w-5xl max-h-[94vh] md:max-h-[88vh] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom md:zoom-in-95 duration-300 pointer-events-auto overflow-hidden">
                        {/* Gallery */}
                        <div className="w-full md:w-[48%] bg-slate-50 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-100 relative">
                            <div className="relative w-full aspect-[5/4] max-h-[min(46vh,380px)] md:aspect-auto md:flex-1 md:min-h-[280px] md:max-h-none group/gallery">
                            {/* Mobile: close + wishlist — inset below rounded modal corner */}
                            <div className="md:hidden absolute top-8 right-4 z-20 flex gap-2">
                                <button
                                    type="button"
                                    onClick={toggleWishlist}
                                    className={`w-9 h-9 rounded-full bg-white/95 shadow-md border border-slate-100 flex items-center justify-center ${isWishlisted ? 'text-red-500' : 'text-slate-600'}`}
                                    aria-label="Wishlist"
                                >
                                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="w-9 h-9 rounded-full bg-white/95 shadow-md border border-slate-100 flex items-center justify-center text-slate-700"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                                <Image
                                    src={imgError ? '/product-1.jpg' : getOptimizedImage(images[currentImageIndex], 900)}
                                    alt={name}
                                    fill
                                    unoptimized
                                    className="object-contain p-4 md:p-10"
                                    onError={() => setImgError(true)}
                                />
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-white"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-white"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </>
                                )}
                                {/* Thumbnails overlaid on image — saves vertical space on mobile */}
                                {images.length > 1 && (
                                    <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 bg-gradient-to-t from-slate-900/50 via-slate-900/20 to-transparent pointer-events-none">
                                        <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
                                            {images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`flex flex-col items-center gap-1 shrink-0 transition-all ${idx === currentImageIndex ? 'scale-105' : 'opacity-75 hover:opacity-100'}`}
                                                >
                                                    <div className={`relative w-11 h-11 md:w-12 md:h-14 rounded-lg overflow-hidden border-2 shadow-sm ${idx === currentImageIndex ? 'border-white ring-2 ring-slate-900/30' : 'border-white/80'}`}>
                                                        <Image
                                                            src={getOptimizedImage(img, 96, 96)}
                                                            alt=""
                                                            fill
                                                            sizes="48px"
                                                            unoptimized
                                                            className="object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/product-1.jpg'; }}
                                                        />
                                                    </div>
                                                    {imageLabels?.[idx] && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wide text-white drop-shadow-sm">
                                                            {imageLabels[idx]}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Desktop: thumbnail strip below main image */}
                            {images.length > 1 && (
                                <div className="hidden md:flex px-4 py-3 gap-2 overflow-x-auto no-scrollbar bg-white border-t border-slate-100">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`flex flex-col items-center gap-1 shrink-0 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                                        >
                                            <div className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 ${idx === currentImageIndex ? 'border-slate-900' : 'border-transparent'}`}>
                                                <Image
                                                    src={getOptimizedImage(img, 96, 96)}
                                                    alt=""
                                                    fill
                                                    sizes="48px"
                                                    unoptimized
                                                    className="object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/product-1.jpg'; }}
                                                />
                                            </div>
                                            {imageLabels?.[idx] && (
                                                <span className="text-[10px] font-medium text-slate-500">{imageLabels[idx]}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mobile: key product info directly under gallery */}
                        <div className="md:hidden shrink-0 px-5 py-3 border-b border-slate-100 bg-white">
                            {vendorName && (
                                <button
                                    type="button"
                                    onClick={handleVendorProfile}
                                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-1"
                                >
                                    <span className="font-semibold text-slate-700">{vendorName}</span>
                                    <VendorTrustBadge documented={vendorDocStatus} size="sm" />
                                </button>
                            )}
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 flex-1">{name}</h2>
                                <p className="text-lg font-black text-slate-900 shrink-0">GH₵{price.toLocaleString()}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                                <span className={`font-semibold ${stock > 0 ? (stock <= 5 ? 'text-amber-600' : 'text-emerald-600') : 'text-red-500'}`}>
                                    {stock > 0 ? `${stock} in stock` : 'Sold out'}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {duration}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col min-h-0 bg-white">
                            <div className="hidden md:flex items-start justify-between gap-4 px-5 pt-5 md:px-8 md:pt-8 shrink-0">
                                <div className="min-w-0 flex-1">
                                    {vendorName && (
                                        <button
                                            type="button"
                                            onClick={handleVendorProfile}
                                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2"
                                        >
                                            <span className="font-medium">{vendorName}</span>
                                            <VendorTrustBadge documented={vendorDocStatus} size="sm" />
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900 leading-snug">{name}</h2>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={toggleWishlist}
                                        className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center transition-colors ${isWishlisted ? 'text-red-500 border-red-100 bg-red-50' : 'text-slate-400 hover:text-slate-700'}`}
                                        aria-label="Wishlist"
                                    >
                                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-8 py-4 space-y-5 md:space-y-6">
                                <div className="hidden md:flex flex-wrap items-baseline gap-x-4 gap-y-2">
                                    <p className="text-2xl md:text-3xl font-bold text-slate-900">GH₵{price.toLocaleString()}</p>
                                    <span className={`text-sm font-medium ${stock > 0 ? (stock <= 5 ? 'text-amber-600' : 'text-emerald-600') : 'text-red-500'}`}>
                                        {stock > 0 ? `${stock} in stock` : 'Sold out'}
                                    </span>
                                </div>

                                <div className="hidden md:flex flex-wrap gap-3 text-sm text-slate-500">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {duration}
                                    </span>
                                    {getVendorDisplayLocation({ location: vendorCity, region: vendorRegion }) && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {getVendorDisplayLocation({ location: vendorCity, region: vendorRegion })}
                                        </span>
                                    )}
                                </div>

                                {hasSizes && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 mb-2">
                                            Size{!selectedSize && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(sizes?.length ? sizes : ['S', 'M', 'L', 'XL']).map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[2.75rem] h-10 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                                        selectedSize === size
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasColors && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 mb-2">
                                            Color{!selectedColor && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(colors?.length ? colors : ['Black', 'White', 'Cream', 'Gold']).map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`h-10 px-3 rounded-lg text-sm font-medium border flex items-center gap-2 transition-colors ${
                                                        selectedColor === color
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                                    }`}
                                                >
                                                    <span
                                                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                                        style={{
                                                            backgroundColor: color.toLowerCase() === 'pattern' ? 'transparent' : color.toLowerCase(),
                                                            backgroundImage: color.toLowerCase() === 'pattern' ? 'conic-gradient(from 0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)' : 'none',
                                                        }}
                                                    />
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-slate-900 mb-2">Description</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {description || 'No description provided for this product.'}
                                    </p>
                                </div>

                                {vendorName && (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                                        <button
                                            type="button"
                                            onClick={handleVendorProfile}
                                            className="w-full flex items-center gap-3 text-left group"
                                        >
                                            <div className="w-11 h-11 rounded-xl bg-slate-900 text-brand-lemon flex items-center justify-center text-lg font-semibold shrink-0">
                                                {vendorName.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-slate-500">Sold by</p>
                                                <p className="text-sm font-semibold text-slate-900 truncate group-hover:underline">{vendorName}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                                        </button>
                                        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/80 pt-3">
                                            {vendorBio || 'Standard FLA buyer protection applies. FLA can help mediate disputes if needed.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 p-5 md:p-6 border-t border-slate-100 bg-white flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAdding || stock <= 0}
                                    className="flex-1 h-12 rounded-full border border-slate-300 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    {isAdding ? 'Adding…' : 'Add to bag'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={stock <= 0}
                                    className="flex-[1.2] h-12 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    Buy now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vendor profile modal — matches product modal style */}
            {(vendorModalLoading || vendorModal) && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 overscroll-none">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => !vendorModalLoading && setVendorModal(null)}
                        aria-hidden
                    />
                    <div className="relative bg-white w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
                            <h3 className="text-sm font-semibold text-slate-900">Vendor profile</h3>
                            <button
                                type="button"
                                onClick={() => setVendorModal(null)}
                                disabled={vendorModalLoading}
                                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {vendorModalLoading && !vendorModal ? (
                            <div className="py-16 flex items-center justify-center text-sm text-slate-500">
                                Loading vendor…
                            </div>
                        ) : vendorModal && (
                            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="relative shrink-0">
                                        {vendorModal.profileImage ? (
                                            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100">
                                                <Image src={vendorModal.profileImage} alt="" fill className="object-cover" unoptimized />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-slate-900 text-brand-lemon flex items-center justify-center text-xl font-semibold">
                                                {vendorModal.shopName.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1">
                                            <VendorTrustBadge documented={vendorModal.documented ?? false} size="sm" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-lg font-semibold text-slate-900 leading-snug">{vendorModal.shopName}</p>
                                        {vendorModal.uniqueVendorId && (
                                            <p className="text-xs text-slate-500 mt-1">ID: {vendorModal.uniqueVendorId}</p>
                                        )}
                                        {vendorModal.location && (
                                            <p className="text-sm text-slate-500 mt-2 inline-flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                {vendorModal.location}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {vendorModal.bio && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 mb-1.5">About</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{vendorModal.bio}</p>
                                    </div>
                                )}

                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Prep time</span>
                                        <span className="font-medium text-slate-900">{duration}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/80 pt-3">
                                        Payments are processed securely. FLA can help mediate disputes if needed.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
});

