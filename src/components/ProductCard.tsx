"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, X, ShoppingBag, Star, Zap, Shield, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import Swal from 'sweetalert2';

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    images: string[];
    imageLabels?: string[];
    duration: string;
    stock: number;
    index: number;
}

export default function ProductCard({ id, name, price, images, imageLabels, duration, stock, index }: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();

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
                price,
                image: images[0],
                size: selectedSize!,
                quantity: 1
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
        }, 500);
    };

    const handleBuyNow = async () => {
        if (!selectedSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Size Required',
                text: 'Please select a size to continue.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }

        // Guest check
        let guestInfo = null;
        if (!isAuthenticated) {
            const { value: formValues } = await Swal.fire({
                title: '<span class="text-2xl font-black text-slate-900 uppercase tracking-tighter">Delivery Details</span>',
                html: `
                    <div class="text-left py-4">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center border-b border-slate-100 pb-4">Checkout as Guest</p>
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    Full Name
                                </label>
                                <input id="guest-name" class="swal2-input !m-0 w-full !rounded-2xl !border-slate-100 !bg-slate-50 !px-4 !h-14 !text-sm focus:!ring-slate-900 focus:!border-slate-900" placeholder="Musah Adama">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.19-1.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    Phone Number
                                </label>
                                <input id="guest-phone" class="swal2-input !m-0 w-full !rounded-2xl !border-slate-100 !bg-slate-50 !px-4 !h-14 !text-sm focus:!ring-slate-900 focus:!border-slate-900" placeholder="024 000 0000">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    Delivery Address
                                </label>
                                <textarea id="guest-address" class="swal2-textarea !m-0 w-full !rounded-2xl !border-slate-100 !bg-slate-50 !px-4 !h-32 !text-sm focus:!ring-slate-900 focus:!border-slate-900" placeholder="e.g. Near Post Office, First floor..."></textarea>
                            </div>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                confirmButtonText: 'Continue to Payment',
                confirmButtonColor: '#E5FF7F',
                customClass: {
                    popup: 'rounded-[40px] px-4 md:px-8',
                    confirmButton: 'rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-[10px] !text-slate-900',
                    cancelButton: 'rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-[10px] !text-slate-400'
                },
                preConfirm: () => {
                    const name = (document.getElementById('guest-name') as HTMLInputElement).value;
                    const phone = (document.getElementById('guest-phone') as HTMLInputElement).value;
                    const address = (document.getElementById('guest-address') as HTMLTextAreaElement).value;
                    if (!name || !phone || !address) {
                        Swal.showValidationMessage('Please fill in all fields');
                        return false;
                    }
                    return { name, phone, address };
                }
            });

            if (!formValues) return;
            guestInfo = formValues;
        }

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
        // Step 1: choose method (Momo or WhatsApp)
        Swal.fire({
            title: 'Choose Checkout Method',
            html: `
                <div class="flex flex-col gap-3">
                    <button id="pay-momo" class="swal2-confirm swal2-styled" style="background-color: #E5FF7F; color: #0f172a; margin: 0; width: 100%;">
                        Pay with Mobile Money (MTN/Telecel)
                    </button>
                    <button id="xy-whatsapp" class="swal2-deny swal2-styled" style="background-color: #25D366; margin: 0; width: 100%;">
                        Buy via WhatsApp
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                const momoBtn = document.getElementById('pay-momo');
                const waBtn = document.getElementById('xy-whatsapp');

                momoBtn?.addEventListener('click', () => {
                    Swal.clickConfirm(); // Triggers the next steps logic
                    handleMomoFlow(guestInfo);
                });

                waBtn?.addEventListener('click', () => {
                    const message = `Hi, I want to buy ${name} (Size: ${selectedSize}) - GH₵${price}`;
                    window.open(`https://wa.me/233505112925?text=${encodeURIComponent(message)}`, '_blank');
                    Swal.close();
                });
            }
        });
    };

    const handleMomoFlow = async (guestInfo?: any) => {
        // Step 2: Select Provider with Logos (Visual Grid)
        let selectedProvider = '';

        await Swal.fire({
            title: '<span class="text-xl font-bold text-slate-900">Select Network</span>',
            html: `
                <div class="grid grid-cols-3 gap-3 mb-2 mt-4">
                    <button id="select-mtn" class="network-card flex flex-col items-center p-4 rounded-xl border-2 border-slate-100 hover:border-yellow-400 transition-all cursor-pointer group">
                        <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-yellow-400 p-1 shadow-sm group-hover:scale-105 transition-transform">
                            <img src="/payment-logos/mtn.png" alt="MTN" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">MTN MoMo</span>
                    </button>
                    <button id="select-telecel" class="network-card flex flex-col items-center p-4 rounded-xl border-2 border-slate-100 hover:border-red-500 transition-all cursor-pointer group">
                        <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1 shadow-sm group-hover:scale-105 transition-transform border border-slate-50">
                            <img src="/payment-logos/telecel.png" alt="Telecel" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">Telecel Cash</span>
                    </button>
                    <button id="select-at" class="network-card flex flex-col items-center p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 transition-all cursor-pointer group">
                        <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-blue-500 p-1 shadow-sm group-hover:scale-105 transition-transform">
                            <img src="/payment-logos/at.png" alt="AT" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">AT Money</span>
                    </button>
                </div>
                <p class="text-xs text-slate-400 mt-2 italic">Tap your network to continue</p>
                
                <style>
                    .network-card.active {
                        border-color: #E5FF7F !important;
                        background-color: #fafd9a10;
                    }
                </style>
            `,
            showConfirmButton: false, // Auto-advance or hide confirm
            didOpen: () => {
                const cards = ['mtn', 'telecel', 'at'];
                cards.forEach(c => {
                    const el = document.getElementById(`select-${c}`);
                    el?.addEventListener('click', () => {
                        selectedProvider = c.toUpperCase();
                        Swal.clickConfirm(); // resolve the promise
                    });
                });
            },
            width: '95%',
            padding: '2em',
            customClass: {
                popup: 'rounded-2xl shadow-2xl'
            }
        });

        if (!selectedProvider) return;

        const providerDisplay = selectedProvider === 'MTN' ? 'MTN Mobile Money' : (selectedProvider === 'TELECEL' ? 'Telecel Cash' : 'AT Money');

        // Step 3: Show Account Info & Upload Screenshot
        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-xl font-bold text-slate-900">Payment Details</span>',
            html: `
                <div class="text-left space-y-6 mt-2">
                    
                    <!-- Amount Display -->
                    <div class="flex flex-col items-center justify-center py-4 bg-brand-lemon/10 rounded-xl border border-brand-lemon/20">
                        <span class="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">Total Amount</span>
                        <span class="text-3xl font-black text-slate-900">GH₵${price}</span>
                    </div>

                    <!-- Payment Details Card -->
                    <div class="px-4">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <span class="text-sm font-bold text-slate-700">Send Mobile Money to:</span>
                        </div>
                        
                        <div class="space-y-3 pl-11">
                            <div class="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex justify-between items-center group hover:border-brand-lemon transition-colors">
                                <span id="momo-1" class="font-mono font-bold text-lg text-slate-800 tracking-wider">0505112925</span>
                                <button data-target="momo-1" class="copy-btn text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold group-hover:bg-brand-lemon group-hover:text-slate-900 transition-colors cursor-pointer border-none uppercase tracking-wide hover:shadow-sm">COPY</button>
                            </div>
                            <div class="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex justify-between items-center group hover:border-brand-lemon transition-colors">
                                <span id="momo-2" class="font-mono font-bold text-lg text-slate-800 tracking-wider">0256774847</span>
                                <button data-target="momo-2" class="copy-btn text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold group-hover:bg-brand-lemon group-hover:text-slate-900 transition-colors cursor-pointer border-none uppercase tracking-wide hover:shadow-sm">COPY</button>
                            </div>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-xs text-slate-400 font-medium">Merchant Name:</span>
                                <span class="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">FLA Bespoke</span>
                            </div>
                        </div>
                    </div>

                    <!-- Instructions -->
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                         <div class="text-blue-500 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                         <div class="text-xs text-blue-800 leading-relaxed text-left">
                            <span class="font-bold">Next Step:</span> After sending the money, please take a <span class="font-bold underline">screenshot</span> of the confirmation SMS or screen. You will need to upload it to confirm your order.
                         </div>
                    </div>

                </div>
            `,
            confirmButtonText: 'I Have Paid',
            confirmButtonColor: '#E5FF7F',
            customClass: {
                confirmButton: '!text-slate-900 font-bold',
                popup: 'rounded-2xl shadow-2xl'
            },
            showCancelButton: true,
            cancelButtonText: 'Wait, Cancel',
            cancelButtonColor: '#cbd5e1',
            width: '95%',
            padding: '2em',
            didOpen: () => {
                // Add simple copy functionality for the numbers
                document.querySelectorAll('.copy-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetId = (e.currentTarget as HTMLElement).getAttribute('data-target');
                        const text = document.getElementById(targetId!)?.innerText;
                        if (text) {
                            navigator.clipboard.writeText(text);
                            // Show mini tooltip/feedback manually or using simple Toast
                            const Toast = Swal.mixin({
                                toast: true,
                                position: 'top',
                                showConfirmButton: false,
                                timer: 1000,
                            });
                            Toast.fire({ icon: 'success', title: 'Copied!' });
                        }
                    });
                });
            }
        });

        if (isConfirmed) {
            // Step 4: Upload Screenshot
            const { value: file } = await Swal.fire({
                title: 'Confirm Payment',
                text: 'Upload your payment screenshot',
                input: 'file',
                inputAttributes: {
                    'accept': 'image/*',
                    'aria-label': 'Upload your payment screenshot'
                },
                confirmButtonText: 'Submit Order',
                confirmButtonColor: '#E5FF7F',
                customClass: {
                    confirmButton: '!text-slate-900 font-bold'
                },
                showCancelButton: true,
                inputValidator: (result) => {
                    return !result && 'You need to select a screenshot image!'
                }
            });

            if (file) {
                Swal.fire({
                    title: 'Order Received!',
                    html: `
                        <div class="text-center space-y-3">
                            <p class="text-sm text-slate-600">We are verifying your payment. You will receive a confirmation shortly.</p>
                            ${guestInfo ? `
                                <div class="bg-gray-50 p-4 rounded-xl text-left border border-gray-100 mt-4">
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delivering To:</p>
                                    <p class="text-xs font-bold text-slate-800">${guestInfo.name}</p>
                                    <p class="text-xs text-slate-500 mt-1">${guestInfo.address}</p>
                                    <p class="text-xs text-slate-500 mt-1 font-mono">${guestInfo.phone}</p>
                                </div>
                            ` : ''}
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#E5FF7F',
                    customClass: {
                        confirmButton: '!text-slate-900 font-bold'
                    }
                });
            }
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
                    {/* New Arrival Badge */}
                    <div className="absolute top-4 left-4 z-20 bg-[#DFEA73] text-[#2C3E02] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">
                        New Arrival
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                        <span className="text-[11px] font-black text-slate-900">4.9</span>
                        <Star className="w-3 h-3 fill-brand-lemon text-brand-lemon" />
                        <span className="text-[9px] font-black text-slate-400/40">(214)</span>
                    </div>

                    {/* Carousel Image */}
                    <div className="w-full h-full relative p-4">
                        <Image
                            src={images[currentImageIndex]}
                            alt={`${name} view ${currentImageIndex + 1}`}
                            fill
                            className={`object-contain transition-all duration-700 group-hover/image:scale-105 ${isSoldOut ? 'grayscale' : ''}`}
                        />
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3 px-1">
                    <h3 className="font-heading font-black text-slate-900 text-base md:text-lg leading-tight line-clamp-1 group-hover:text-brand-lemon transition-colors">
                        {name}
                    </h3>

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
                            <span className="text-[10px] font-black text-slate-900">4.9</span>
                        </div>
                    </div>

                    {/* Size Selection (Quick Access) */}
                    <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar" onClick={(e) => e.stopPropagation()}>
                        {['S', 'M', 'L', 'XL'].map(size => (
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
                            className="flex items-center justify-center py-3.5 px-6 rounded-full border border-slate-900 text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap touch-manipulation"
                        >
                            Learn More
                        </button>
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className="flex items-center justify-center py-3.5 px-6 rounded-full bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap touch-manipulation"
                        >
                            {isAdding ? '...' : 'Add to Cart'}
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
                    <div className="relative bg-white w-full max-w-4xl h-[92vh] md:h-auto md:max-h-[85vh] overflow-hidden rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-bottom md:zoom-in-95 duration-500">
                        {/* Mobile Handle */}
                        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200/50 rounded-full z-50" />

                        {/* Close Button - Desktop & Mobile fallback */}
                        <button
                            onClick={() => setIsDetailModalOpen(false)}
                            className="absolute top-5 right-5 z-50 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl text-slate-900 hover:bg-brand-lemon hover:scale-110 active:scale-95 transition-all outline-none"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Left: Gallery */}
                        <div className="w-full md:w-1/2 h-[45vh] md:h-auto relative bg-[#f8f8f8] group/gallery">
                            <Image
                                src={images[currentImageIndex]}
                                alt={name}
                                fill
                                className="object-cover md:object-contain p-4 transition-transform duration-700 group-hover/gallery:scale-105"
                            />
                            {/* Thumbnails */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 max-w-[90%] overflow-x-auto no-scrollbar shadow-lg">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-brand-lemon scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image src={img} alt="thumb" fill className="object-cover" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 overflow-y-auto h-full flex flex-col relative">
                            <div className="p-8 md:p-10 pb-32 md:pb-10 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 bg-brand-lemon px-3 py-1 rounded-full shadow-sm">Bespoke Collection</span>
                                        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                            <Zap className="w-3 h-3 fill-current" />
                                            Active Tailoring
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="font-heading text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tighter uppercase">{name}</h2>
                                        <div className="flex items-center gap-4">
                                            <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">GH₵{price}</p>
                                            <div className="h-6 w-[1px] bg-slate-100" />
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-brand-lemon text-brand-lemon" />
                                                <span className="text-xs font-black text-slate-900">4.9</span>
                                                <span className="text-[10px] font-bold text-slate-300 ml-1">(214 Reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Description */}
                                    <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100/50">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">The Narrative</h4>
                                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-left font-medium">
                                            Crafted with precision using premium bespoke tailoring techniques. This piece features our signature {name.toLowerCase()} design, combining traditional aesthetics with modern comfort. Every stitch is a testament to our commitment to excellence.
                                        </p>
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

                                    {/* Size Selection */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Silhouette</h4>
                                            <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest underline decoration-brand-lemon decoration-2 underline-offset-4">Size Guide</button>
                                        </div>
                                        <div className="flex gap-3">
                                            {['S', 'M', 'L', 'XL'].map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl font-black border-2 transition-all text-sm
                                                        ${selectedSize === size
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                                                            : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-white'
                                                        }
                                                    `}
                                                >
                                                    {size}
                                                </button>
                                            ))}
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
                                    className="flex-[1.5] py-5 rounded-3xl bg-brand-lemon text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(229,255,127,0.3)] hover:shadow-[0_20px_40px_rgba(229,255,127,0.4)] hover:scale-[1.02] transition-all active:scale-95"
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

