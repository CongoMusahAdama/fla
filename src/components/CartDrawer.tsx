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
    const { isAuthenticated } = useAuth();
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

    // Prevent body scroll when open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isCartOpen]);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleMomoFlow = async () => {
        let selectedProvider = '';
        await Swal.fire({
            title: '<span class="text-xl font-bold text-slate-900">Select Network</span>',
            html: `
                <div class="grid grid-cols-3 gap-3 mb-2 mt-4">
                    <button id="cart-mtn" class="network-card flex flex-col items-center p-4 rounded-xl border-2 border-slate-100 hover:border-yellow-400 transition-all cursor-pointer group">
                        <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-yellow-400 p-1 shadow-sm group-hover:scale-105 transition-transform">
                            <img src="/payment-logos/mtn.png" alt="MTN" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">MTN MoMo</span>
                    </button>
                    <button id="cart-telecel" class="network-card flex flex-col items-center p-4 rounded-xl border-2 border-slate-100 hover:border-red-500 transition-all cursor-pointer group">
                        <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1 shadow-sm group-hover:scale-105 transition-transform border border-slate-50">
                            <img src="/payment-logos/telecel.png" alt="Telecel" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">Telecel Cash</span>
                    </button>
                    <button id="cart-at" class="network-card flex flex-col items-center p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 transition-all cursor-pointer group">
                        <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-blue-500 p-1 shadow-sm group-hover:scale-105 transition-transform">
                            <img src="/payment-logos/at.png" alt="AT" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">AT Money</span>
                    </button>
                </div>
            `,
            width: '95%',
            customClass: {
                popup: 'rounded-2xl shadow-2xl'
            },
            didOpen: () => {
                ['mtn', 'telecel', 'at'].forEach(c => {
                    document.getElementById(`cart-${c}`)?.addEventListener('click', () => {
                        selectedProvider = c.toUpperCase();
                        Swal.clickConfirm();
                    });
                });
            }
        });

        if (!selectedProvider) return;

        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-xl font-bold text-slate-900">Payment Details</span>',
            html: `
                <div class="text-left space-y-4">
                    <div class="bg-brand-lemon/10 p-4 rounded-xl text-center border border-brand-lemon/20">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Grand Total</p>
                        <p class="text-3xl font-black text-slate-900">GH₵${subtotal}</p>
                    </div>
                    <p class="text-xs font-bold text-slate-700">Send Mobile Money to:</p>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                            <span class="font-mono font-bold">0505112925</span>
                            <span class="text-[10px] bg-slate-100 px-2 py-1 rounded">MOMO 1</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                            <span class="font-mono font-bold">0256774847</span>
                            <span class="text-[10px] bg-slate-100 px-2 py-1 rounded">MOMO 2</span>
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
            width: '95%'
        });

        if (isConfirmed) {
            Swal.fire({
                title: 'Confirm Payment',
                text: 'Upload your screenshot to finalize order',
                input: 'file',
                confirmButtonText: 'Finish Order',
                confirmButtonColor: '#E5FF7F',
                customClass: {
                    confirmButton: '!text-slate-900 font-bold'
                }
            });
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;

        if (!isAuthenticated) {
            Swal.fire({
                title: 'Sign In Required',
                text: 'Please log in to proceed with your bag checkout.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Sign In Now',
                confirmButtonColor: '#0f172a',
                cancelButtonText: 'Later'
            }).then((result) => {
                if (result.isConfirmed) {
                    setIsCartOpen(false);
                    router.push('/auth?role=customer');
                }
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-xl font-bold text-slate-900">Confirm Order</span>',
            html: `
                <div class="text-left space-y-4 py-2">
                    <p class="text-xs text-slate-500 font-medium uppercase tracking-widest">Order Summary</p>
                    <div class="space-y-2 max-h-40 overflow-y-auto px-1">
                        ${cartItems.map(item => `
                            <div class="flex justify-between items-center text-xs">
                                <span class="font-bold text-slate-800">${item.name} (${item.size}) x${item.quantity}</span>
                                <span class="text-slate-600 font-mono">GH₵${item.price * item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center">
                        <span class="font-bold text-slate-900">Total payable:</span>
                        <span class="text-xl font-black text-slate-900 bg-brand-lemon px-2 rounded">GH₵${subtotal}</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed to Payment',
            confirmButtonColor: '#E5FF7F',
            customClass: {
                confirmButton: '!text-slate-900 font-bold',
                popup: 'rounded-2xl shadow-2xl'
            },
            cancelButtonText: 'Wait, Continue Shopping',
            cancelButtonColor: '#cbd5e1',
            width: '95%'
        });

        if (isConfirmed) {
            await handleMomoFlow();
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
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
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
