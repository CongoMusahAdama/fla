"use client";

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import { groupCartByVendor, setMultiCheckoutQueue } from '@/lib/cart-vendors';

export default function CartDrawer() {
    const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
    const { isAuthenticated, user, token } = useAuth();
    const router = useRouter();
    const drawerRef = useRef<HTMLDivElement>(null);
    const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isCartOpen) {
                setIsCartOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCartOpen, setIsCartOpen]);

    // Handle #cart hash to open cart automatically (useful for redirects after login)
    useEffect(() => {
        if (window.location.hash === '#cart' || window.location.hash === '#checkout-auto') {
            const isAuto = window.location.hash === '#checkout-auto';
            setIsCartOpen(true);
            // Clear the hash after opening
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            
            if (isAuto) {
                setTimeout(() => {
                    document.getElementById('cart-checkout-btn')?.click();
                }, 500);
            }
        }
    }, [setIsCartOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isCartOpen]);

    // When returning from Paystack via the browser "Back" button (bfcache restore,
    // common on mobile Safari), dismiss any leftover "Preparing payment…" loader.
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                Swal.close();
                setIsProcessingCheckout(false);
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);



    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);


    const handleCheckout = async () => {
        if (cartItems.length === 0 || isProcessingCheckout) return;

        let guestInfo: { phone: string, email: string } | null = null;

        if (!isAuthenticated) {
            setIsCartOpen(false);
            const { isConfirmed: wantAccount, isDenied: wantGuest, dismiss } = await Swal.fire({
                title: 'CHOOSE CHECKOUT',
                html: `
                    <div class="text-left space-y-4">
                        <div class="bg-brand-lemon/10 p-4 rounded-xl border border-brand-lemon/20">
                            <h4 class="font-black text-slate-900 mb-2">Sign In / Create Account (Recommended)</h4>
                            <ul class="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                <li>Monetize your order and earn</li>
                                <li>Full buyer protection</li>
                                <li>Ability to open disputes</li>
                            </ul>
                            <div class="mt-3 flex gap-2">
                                <button id="swal-signin-btn" class="flex-1 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Sign In</button>
                                <button id="swal-register-btn" class="flex-1 py-2.5 border-2 border-slate-900 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">Create Account</button>
                            </div>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 class="font-black text-slate-500 mb-2">Guest Checkout</h4>
                            <ul class="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                <li>Pay securely via Paystack</li>
                                <li>Receipt sent to your email</li>
                                <li>Receive SMS notification with vendor's WhatsApp</li>
                            </ul>
                        </div>
                    </div>
                `,
                showCancelButton: false,
                showConfirmButton: false,
                showDenyButton: true,
                denyButtonText: 'Buy without Account',
                denyButtonColor: '#64748b',
                didOpen: () => {
                    document.getElementById('swal-signin-btn')?.addEventListener('click', () => {
                        (Swal.getPopup() as any)?.__swalSignIn?.();
                        Swal.clickConfirm();
                        sessionStorage.setItem('fla_checkout_intent', 'signin');
                    });
                    document.getElementById('swal-register-btn')?.addEventListener('click', () => {
                        Swal.clickConfirm();
                        sessionStorage.setItem('fla_checkout_intent', 'register');
                    });
                },
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-6 md:p-8 bg-white w-full max-w-md',
                    title: 'text-xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    actions: 'flex flex-col gap-2 w-full mt-4',
                    denyButton: 'bg-slate-100 text-slate-500 rounded-full px-6 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all w-full m-0',
                }
            });

            if (wantAccount) {
                const intent = sessionStorage.getItem('fla_checkout_intent') || 'register';
                sessionStorage.removeItem('fla_checkout_intent');
                if (intent === 'signin') {
                    router.push('/auth?role=customer&view=login&redirect=/#checkout-auto');
                } else {
                    router.push('/auth?role=customer&view=register&redirect=/#checkout-auto');
                }
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
                guestInfo = guestDetails;
            } else {
                return; // cancelled
            }
        } else {
            setIsCartOpen(false);
        }

        const vendorGroups = groupCartByVendor(cartItems);
        if (vendorGroups.length === 0) {
            Swal.fire({
                title: 'CANNOT CHECK OUT',
                text: 'Some items are missing vendor information. Remove them and add again from the shop.',
                icon: 'warning',
            });
            return;
        }

        const multiVendor = vendorGroups.length > 1;

        const { value: formValues, isConfirmed } = await Swal.fire({
            title: multiVendor ? 'CONFIRM YOUR ORDERS' : 'CONFIRM YOUR ORDER',
            html: `
                <div class="text-left space-y-5 py-4">
                    ${multiVendor ? `
                    <div class="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p class="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">${vendorGroups.length} studios in your bag</p>
                        <p class="text-xs text-amber-900 font-medium leading-relaxed">You will complete <strong>${vendorGroups.length} separate Paystack payments</strong> — one per vendor. Each studio gets their own order and SMS.</p>
                    </div>
                    ` : ''}
                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">${multiVendor ? 'By studio' : 'Order Summary'}</p>
                        <div class="space-y-3 max-h-48 overflow-y-auto">
                            ${vendorGroups.map(group => `
                                <div class="bg-white p-3 rounded-xl border border-slate-100">
                                    <div class="flex justify-between items-center mb-2 pb-2 border-b border-slate-50">
                                        <span class="text-[10px] font-black text-slate-900 uppercase tracking-widest">${group.vendorName}</span>
                                        <span class="text-xs font-black text-slate-900">GH₵ ${group.subtotal.toLocaleString()}</span>
                                    </div>
                                    ${group.items.map(item => `
                                        <div class="flex justify-between items-center text-sm py-1">
                                            <div class="flex flex-col">
                                                <span class="font-bold text-slate-800 text-xs">${item.name}</span>
                                                <span class="text-slate-400 text-[9px] uppercase font-bold">
                                                    ${item.size !== 'N/A' ? `Size: ${item.size}` : ''}
                                                    ${item.color !== 'N/A' ? ` | ${item.color}` : ''}
                                                </span>
                                            </div>
                                            <span class="text-[10px] font-black text-slate-500">×${item.quantity}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Delivery Address</label>
                            <input id="delivery-address" type="text" placeholder="e.g. 123 Main St, East Legon" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.address || ''}" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2 relative">
                                <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Search Location (Skynet)</label>
                                <input id="delivery-city" type="text" placeholder="Start typing your area..." class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.location || ''}" autocomplete="off" />
                                <div id="location-suggestions-cart" class="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-[100] hidden">
                                    <!-- Suggestions -->
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Region</label>
                                <input id="delivery-region" type="text" placeholder="e.g. Greater Accra" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" value="${user?.region || ''}" />
                            </div>
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div class="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Item Total (Pay Now)</span>
                            <span>GH₵ ${subtotal.toLocaleString()}</span>
                        </div>
                        <p class="text-[9px] text-slate-500 font-bold leading-relaxed pt-1 border-t border-slate-200">
                            Delivery costs are <span class="text-slate-900">not charged on FLA</span>. Arrange and pay delivery directly with the vendor or courier.
                        </p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: multiVendor ? `Pay studio 1 of ${vendorGroups.length}` : 'Pay with MoMo / Card',
            cancelButtonText: 'Continue Shopping',
            buttonsStyling: false,
            didOpen: () => {
                const cityInput = document.getElementById('delivery-city') as HTMLInputElement;
                const suggestionsBox = document.getElementById('location-suggestions-cart') as HTMLDivElement;
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

                document.addEventListener('click', (e) => {
                    if (!cityInput.contains(e.target as Node) && !suggestionsBox.contains(e.target as Node)) {
                        suggestionsBox.classList.add('hidden');
                    }
                });
            },
            preConfirm: () => {
                const deliveryAddress = (document.getElementById('delivery-address') as HTMLInputElement).value;
                const deliveryCity = (document.getElementById('delivery-city') as HTMLInputElement).value;
                const deliveryRegion = (document.getElementById('delivery-region') as HTMLInputElement).value;
                
                if (!deliveryAddress || !deliveryCity || !deliveryRegion) {
                    Swal.showValidationMessage('Please fill in your complete delivery details');
                    return false;
                }
                return { 
                    deliveryAddress, 
                    deliveryCity, 
                    deliveryRegion, 
                    totalProductAmount: subtotal
                };
            },
            customClass: {
                popup: 'rounded-[40px] border-none shadow-2xl p-8 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4',
                htmlContainer: 'text-slate-600',
                confirmButton: 'bg-slate-900 text-white rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
            },
            width: '90%',
            backdrop: 'rgba(15, 23, 42, 0.7)'
        });

        if (isConfirmed && formValues) {
            setIsProcessingCheckout(true);
            try {
                // Guest checkout goes through Paystack just like a logged-in user.
                // The WhatsApp number is for SMS notification only (handled by backend).
                // The email is used by Paystack to send the payment receipt.

                Swal.fire({
                    title: 'PREPARING PAYMENT...',
                    text: 'Connecting to secure gateway...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                    customClass: {
                        popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                        title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4'
                    }
                });

                const checkoutPayload = {
                    shippingAddress: formValues.deliveryAddress,
                    shippingCity: formValues.deliveryCity,
                    shippingRegion: formValues.deliveryRegion,
                    // Use guest details if not authenticated, otherwise use logged-in user details
                    customerName: guestInfo ? `Guest (${guestInfo.phone})` : user?.name,
                    customerEmail: guestInfo ? guestInfo.email : user?.email,
                    customerPhone: guestInfo ? guestInfo.phone : user?.phone,
                    // customerId comes from JWT on the server — do not send in body
                    notes: `Delivery to ${formValues.deliveryCity}`,
                    vendorGroups: vendorGroups.map(group => ({
                        vendorId: group.vendorId,
                        vendorName: group.vendorName,
                        items: group.items.map(item => ({
                            productId: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color,
                            image: item.image,
                            tailoringTime: item.tailoringTime,
                        })),
                    })),
                };

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/checkout-cart`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify(checkoutPayload)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to initialize payment');
                }

                const result = await response.json();
                const orderIds = (result.orders || []).map((o: { orderId: string }) => o.orderId);

                if (result.multiVendor && orderIds.length > 1) {
                    setMultiCheckoutQueue(orderIds);
                }

                const firstPayment = result.orders?.[0]?.paymentLink;
                if (!firstPayment) {
                    throw new Error('No payment link returned');
                }

                cartItems.forEach(item => removeFromCart(item.id, item.size, item.color));
                setIsCartOpen(false);

                // Close the loading modal before leaving so a browser "Back" from
                // Paystack doesn't restore a stuck "Preparing payment…" screen.
                Swal.close();
                window.location.href = firstPayment;

            } catch (error: any) {
                console.error('Checkout error:', error);
                setIsProcessingCheckout(false);
                Swal.fire({
                    title: 'CHECKOUT FAILED',
                    text: error.message || 'An error occurred during checkout. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest shadow-lg'
                    }
                });
            }
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-in fade-in duration-300"
                    aria-hidden="true"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-slate-900" />
                        <h2 className="font-heading font-bold text-lg text-slate-900">Your Bag</h2>
                        <span className="bg-slate-100 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                            <div>
                                <p className="font-heading font-bold text-slate-900 text-lg">Your bag is empty</p>
                                <p className="text-slate-500 text-sm mt-1">Looks like you haven't added anything yet.</p>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-colors"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 group">
                                {/* Image */}
                                <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                                    <Image
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        fill
                                        unoptimized={true}
                                        className="object-cover"

                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/product-1.jpg';
                                        }}
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-heading font-bold text-slate-900 text-sm line-clamp-2">{item.name}</h3>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.size, item.color)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.size !== 'N/A' && <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Size: <span className="text-slate-900">{item.size}</span></p>}
                                            {item.color !== 'N/A' && <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Color: <span className="text-slate-900">{item.color}</span></p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.size, item.color, -1)}
                                                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold text-slate-900 w-3 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.size, item.color, 1)}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm">GH₵{item.price * item.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                            <span className="font-heading font-black text-xl text-slate-900">GH₵{subtotal}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mb-4">Shipping and taxes calculated at checkout.</p>
                        <button
                            id="cart-checkout-btn"
                            onClick={handleCheckout}
                            className="w-full py-4 bg-brand-lemon text-slate-900 font-bold rounded-full hover:bg-brand-lemon/90 transition-all shadow-lg active:scale-[0.98]"
                        >
                            Checkout Now
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
