"use client";

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
    const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const drawerRef = useRef<HTMLDivElement>(null);

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
        if (window.location.hash === '#cart') {
            setIsCartOpen(true);
            // Clear the hash after opening
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
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

    const getImageUrl = (url: string) => {
        if (!url || url === '/product-1.jpg') return '/product-1.jpg';
        if (url.startsWith('http') || url.startsWith('data:')) return url;

        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
        const baseUrl = apiBase.replace('/api', '');

        // Backend uploads
        if (url.startsWith('/uploads')) {
            return `${baseUrl}${url}`;
        }

        // Frontend static assets
        if (url.startsWith('/')) return url;

        return `${baseUrl}/uploads/${url}`;
    };


    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;

        if (!isAuthenticated) {
            setIsCartOpen(false); // Close cart before showing modal
            Swal.fire({
                title: 'SIGN IN REQUIRED',
                text: 'Please log in to proceed with your bag checkout.',
                icon: 'info',
                iconColor: '#0F172A',
                showCancelButton: true,
                confirmButtonText: 'Sign In Now',
                cancelButtonText: 'Later',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-8 md:p-12 bg-white',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                    htmlContainer: 'text-slate-500 font-medium text-sm mb-8',
                    confirmButton: 'bg-slate-900 text-white rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2',
                    cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/auth?role=customer&redirect=/#cart');
                }
            });
            return;
        }

        setIsCartOpen(false); // Close cart before showing modal

        const { value: formValues, isConfirmed } = await Swal.fire({
            title: 'CONFIRM YOUR ORDER',
            html: `
                <div class="text-left space-y-6 py-4">
                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Order Summary</p>
                        <div class="space-y-2.5 max-h-48 overflow-y-auto">
                            ${cartItems.map(item => `
                                <div class="flex justify-between items-center text-sm bg-white p-3 rounded-xl">
                                    <span class="font-bold text-slate-900">${item.name} <span class="text-slate-400 text-xs">(${item.size})</span> <span class="text-brand-lemon text-xs">×${item.quantity}</span></span>
                                    <span class="text-slate-900 font-black">GH₵${item.price * item.quantity}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Choose Pickup Point</label>
                        <select id="pickup-point" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20">
                            <option value="">Select a pickup location...</option>
                            <option value="FLA Studio HQ - East Legon">FLA Studio HQ - East Legon</option>
                            <option value="Circle - VVIP Station">Circle - VVIP Station</option>
                            <option value="Kumasi - Bantama Branch">Kumasi - Bantama Branch</option>
                            <option value="Takoradi - Zenith Bank Area">Takoradi - Zenith Bank Area</option>
                            <option value="Tamale - Modern City Hotel Area">Tamale - Modern City Hotel Area</option>
                            <option value="Ho - Central Market">Ho - Central Market</option>
                        </select>
                        <p class="text-[10px] text-slate-400 mt-1 pl-1">Choose where you'll collect your package.</p>
                    </div>

                    <div class="border-t-2 border-dashed border-slate-200 pt-4 flex justify-between items-center">
                        <span class="font-black text-slate-900 uppercase tracking-wider text-sm">Total Payable:</span>
                        <span class="text-2xl font-black text-slate-900 bg-brand-lemon px-4 py-2 rounded-xl shadow-sm">GH₵${subtotal}</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Pay with MoMo / Card',
            cancelButtonText: 'Continue Shopping',
            buttonsStyling: false,
            preConfirm: () => {
                const pickupPoint = (document.getElementById('pickup-point') as HTMLSelectElement).value;
                if (!pickupPoint) {
                    Swal.showValidationMessage('Please select a pickup point');
                    return false;
                }
                return { pickupPoint };
            },
            customClass: {
                popup: 'rounded-[40px] border-none shadow-2xl p-10 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                htmlContainer: 'text-slate-600',
                confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
            },
            width: '90%',
            backdrop: 'rgba(15, 23, 42, 0.7)'
        });

        if (isConfirmed) {
            try {
                const token = localStorage.getItem('fla_token');

                Swal.fire({
                    title: 'PREPARING PAYMENT...',
                    text: 'Connecting to secure MoMo gateway...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                    customClass: {
                        popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                        title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4'
                    }
                });

                const orderData = {
                    items: cartItems.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        size: item.size,
                        image: item.image
                    })),
                    totalAmount: subtotal,
                    vendorId: (typeof cartItems[0]?.vendorId === 'object' && cartItems[0]?.vendorId !== null)
                        ? (cartItems[0].vendorId as any)._id || (cartItems[0].vendorId as any).id
                        : cartItems[0]?.vendorId,
                    vendorName: cartItems[0]?.vendorName,
                    shippingAddress: user?.address || 'Pickup at Studio',
                    shippingCity: user?.location || 'Accra',
                    shippingRegion: 'Greater Accra',
                    customerName: user?.name,
                    customerEmail: user?.email,
                    customerPhone: user?.phone,
                    pickupPoint: formValues.pickupPoint,
                    paymentMethod: 'paystack',
                    notes: 'Order via Paystack'
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

                // Clear cart locally before redirect
                cartItems.forEach(item => removeFromCart(item.id, item.size));
                setIsCartOpen(false);

                // Redirect to Flutterwave
                window.location.href = paymentLink;

            } catch (error: any) {
                console.error('Checkout error:', error);
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
                            <div key={`${item.id}-${item.size}`} className="flex gap-4 group">
                                {/* Image */}
                                <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                                    <Image
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
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
                                                onClick={() => removeFromCart(item.id, item.size)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Size: <span className="font-bold text-slate-700">{item.size}</span></p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.size, -1)}
                                                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold text-slate-900 w-3 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.size, 1)}
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
