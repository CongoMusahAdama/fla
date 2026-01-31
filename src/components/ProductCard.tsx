"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, X, ShoppingBag } from 'lucide-react';
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
                    router.push('/auth');
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
                                <textarea id="guest-address" class="swal2-textarea !m-0 w-full !rounded-2xl !border-slate-100 !bg-slate-50 !px-4 !h-32 !text-sm focus:!ring-slate-900 focus:!border-slate-900" placeholder="e.g. Near Tamale Post Office, First floor..."></textarea>
                            </div>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                confirmButtonText: 'Continue to Payment',
                confirmButtonColor: '#9333ea',
                showCancelButton: true,
                cancelButtonText: 'Cancel',
                cancelButtonColor: '#f1f5f9',
                customClass: {
                    popup: 'rounded-[40px] px-4 md:px-8',
                    confirmButton: 'rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-[10px]',
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
                        <p>This item requires <b class="text-purple-600">${duration}</b> to be tailored.</p>
                        <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 text-slate-700">
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
                    <button id="pay-momo" class="swal2-confirm swal2-styled" style="background-color: #9333ea; margin: 0; width: 100%;">
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
                        border-color: #9333ea !important;
                        background-color: #f5f3ff;
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
                    <div class="flex flex-col items-center justify-center py-4 bg-purple-50 rounded-xl border border-purple-100">
                        <span class="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Total Amount</span>
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
                            <div class="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex justify-between items-center group hover:border-purple-400 transition-colors">
                                <span id="momo-1" class="font-mono font-bold text-lg text-slate-800 tracking-wider">0505112925</span>
                                <button data-target="momo-1" class="copy-btn text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors cursor-pointer border-none uppercase tracking-wide hover:shadow-sm">COPY</button>
                            </div>
                            <div class="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex justify-between items-center group hover:border-purple-400 transition-colors">
                                <span id="momo-2" class="font-mono font-bold text-lg text-slate-800 tracking-wider">0256774847</span>
                                <button data-target="momo-2" class="copy-btn text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors cursor-pointer border-none uppercase tracking-wide hover:shadow-sm">COPY</button>
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
            confirmButtonColor: '#9333ea',
            showCancelButton: true,
            cancelButtonText: 'Wait, Cancel',
            cancelButtonColor: '#cbd5e1', // slate-300
            width: '95%',
            padding: '2em',
            customClass: {
                popup: 'rounded-2xl shadow-2xl'
            },
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
                confirmButtonColor: '#9333ea',
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
                    confirmButtonColor: '#9333ea'
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
                <div className="relative w-full aspect-square bg-[#f4f4f5] rounded-2xl overflow-hidden mb-4 group/image">
                    {/* Production Badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm text-slate-700">
                        <Clock className="w-3 h-3 text-brand-blue" />
                        {duration}
                    </div>

                    {/* View Label (Front/Back/Side) */}
                    {imageLabels && imageLabels[currentImageIndex] && (
                        <div className="absolute top-3 right-3 z-20 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm text-white">
                            {imageLabels[currentImageIndex]}
                        </div>
                    )}

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                        <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-slate-900 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wide text-xs">
                                Sold Out
                            </span>
                        </div>
                    )}

                    {/* Carousel Image */}
                    <div className="w-full h-full relative">
                        <Image
                            src={images[currentImageIndex]}
                            alt={`${name} view ${currentImageIndex + 1}`}
                            fill
                            className={`object-cover transition-all duration-500 ${isSoldOut ? 'grayscale' : ''}`}
                        />
                    </div>

                    {/* Navigation Arrows (Visible on Hover) */}
                    {images.length > 1 && !isSoldOut && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity z-20 shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-900" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity z-20 shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-900" />
                            </button>

                            {/* Dots Indicator */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-slate-900' : 'bg-slate-300'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Info */}
                <div className="mb-3">
                    <h3 className="font-heading font-bold text-slate-900 text-lg truncate">{name}</h3>
                    <div className="flex justify-between items-center mt-1">
                        <span className="font-sans font-semibold text-slate-600">GH₵{price}</span>
                        {!isSoldOut && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                {stock} Left
                            </span>
                        )}
                    </div>
                </div>

                {/* Size Actions */}
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1 no-scrollbar" onClick={(e) => e.stopPropagation()}>
                    {['S', 'M', 'L', 'XL'].map(size => (
                        <button
                            key={size}
                            onClick={() => !isSoldOut && setSelectedSize(size)}
                            disabled={isSoldOut}
                            className={`flex-none w-8 h-8 rounded-full text-xs font-bold border transition-all
                    ${selectedSize === size
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-400 border-gray-100 hover:border-slate-300'}
                  `}
                        >
                            {size}
                        </button>
                    ))}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={handleAddToCart}
                        disabled={isSoldOut || isAdding}
                        className="flex items-center justify-center gap-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-slate-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {isAdding ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={isSoldOut}
                        className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Buy Now
                    </button>
                </div>

            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                        onClick={() => setIsDetailModalOpen(false)}
                    />
                    <div className="relative bg-white w-full max-w-4xl h-fit md:max-h-[85vh] overflow-y-auto md:overflow-hidden rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsDetailModalOpen(false)}
                            className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-slate-900 hover:bg-white transition-all scale-100 hover:scale-110"
                        >
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        {/* Left: Gallery */}
                        <div className="w-full md:w-1/2 h-[350px] md:h-auto relative bg-[#f8f8f8]">
                            <Image
                                src={images[currentImageIndex]}
                                alt={name}
                                fill
                                className="object-cover"
                            />
                            {/* Thumbnails */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 px-3 py-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 max-w-[90%] overflow-x-auto no-scrollbar">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-8 h-10 md:w-10 md:h-14 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-purple-600 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image src={img} alt="thumb" fill className="object-cover" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2 md:px-3 py-1 rounded-full">New Collection</span>
                                <div className="flex items-center gap-1.5 text-slate-400 text-[9px] md:text-[10px] font-bold">
                                    <Clock className="w-3 h-3" />
                                    Ready in {duration}
                                </div>
                            </div>

                            <h2 className="font-heading text-xl md:text-3xl font-black text-slate-900 mb-1 md:mb-2 leading-tight">{name}</h2>
                            <p className="text-xl md:text-2xl font-black text-slate-900 mb-4 md:mb-6 font-sans">GH₵{price}</p>

                            <div className="space-y-5 md:space-y-6">
                                {/* Description */}
                                <div>
                                    <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2 text-left">The Narrative</h4>
                                    <p className="text-slate-600 text-[11px] md:text-xs leading-relaxed text-left">
                                        Crafted with precision using premium bespoke tailoring techniques. This piece features our signature {name.toLowerCase()} design, combining traditional aesthetics with modern comfort. Every stitch is a testament to our commitment to excellence.
                                    </p>
                                </div>

                                {/* Size Selection - Read Only for preview */}
                                <div>
                                    <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2 text-left">Available Silhouettes</h4>
                                    <div className="flex gap-2">
                                        {['S', 'M', 'L', 'XL'].map(size => (
                                            <div
                                                key={size}
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl font-bold border-2 border-slate-100 bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] md:text-xs"
                                            >
                                                {size}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Details List */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-100">
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mb-0.5">Fabrication</span>
                                        <span className="text-[10px] md:text-[11px] font-bold text-slate-900">100% Cotton Print</span>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mb-0.5">Tailoring Time</span>
                                        <span className="text-[10px] md:text-[11px] font-bold text-slate-900">{duration}</span>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mb-0.5">Origin</span>
                                        <span className="text-[10px] md:text-[11px] font-bold text-slate-900">Crafted in Tamale</span>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mb-0.5">Shipping</span>
                                        <span className="text-[10px] md:text-[11px] font-bold text-slate-900">Free Local Delivery</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
