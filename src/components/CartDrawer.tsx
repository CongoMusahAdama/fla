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
        if (url.startsWith('http')) return url;

        // Backend uploads
        if (url.startsWith('/uploads')) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
            return `${baseUrl}${url}`;
        }

        // Frontend static assets
        if (url.startsWith('/')) return url;

        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
        return `${baseUrl}/uploads/${url}`;
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleMomoFlow = async () => {
        // Fetch vendor details for the first item (assuming all items from same vendor)
        let vendorPaymentMethods: Array<{ network: string; accountNumber: string; accountName: string }> = [];

        if (cartItems.length > 0 && cartItems[0].vendorId) {
            try {
                const token = localStorage.getItem('fla_token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/users/${cartItems[0].vendorId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const vendorData = await response.json();
                    vendorPaymentMethods = vendorData.paymentMethods || [];
                }
            } catch (error) {
                console.error('Error fetching vendor details:', error);
            }
        }

        let selectedProvider = '';
        await Swal.fire({
            title: 'SELECT PAYMENT NETWORK',
            html: `
                <div class="grid grid-cols-3 gap-4 mb-2 mt-6">
                    <button id="cart-mtn" class="network-card flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
                        <div class="w-14 h-14 mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-yellow-400 p-2 shadow-md group-hover:scale-110 transition-transform">
                            <img src="/payment-logos/mtn.png" alt="MTN" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-black text-slate-700 uppercase tracking-wider">MTN MoMo</span>
                    </button>
                    <button id="cart-telecel" class="network-card flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:shadow-lg transition-all cursor-pointer group">
                        <div class="w-14 h-14 mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-white p-2 shadow-md group-hover:scale-110 transition-transform border border-slate-100">
                            <img src="/payment-logos/telecel.png" alt="Telecel" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-black text-slate-700 uppercase tracking-wider">Telecel Cash</span>
                    </button>
                    <button id="cart-tigo" class="network-card flex flex-col items-center p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group">
                        <div class="w-14 h-14 mb-3 rounded-xl overflow-hidden flex items-center justify-center bg-blue-500 p-2 shadow-md group-hover:scale-110 transition-transform">
                            <img src="/payment-logos/tigo.png" alt="Tigo" class="w-full h-full object-contain" />
                        </div>
                        <span class="text-[10px] font-black text-slate-700 uppercase tracking-wider">Tigo Cash</span>
                    </button>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4'
            },
            backdrop: 'rgba(15, 23, 42, 0.7)',
            didOpen: () => {
                ['mtn', 'telecel', 'tigo'].forEach(c => {
                    document.getElementById(`cart-${c}`)?.addEventListener('click', () => {
                        selectedProvider = c.toUpperCase();
                        Swal.close();
                    });
                });
            }
        });

        if (!selectedProvider) return;

        // Find matching payment method from vendor or use defaults
        let momoNumber = '';
        let accountName = '';

        const vendorMethod = vendorPaymentMethods.find(m => m.network === selectedProvider);

        if (vendorMethod) {
            // Vendor has this payment method set up
            momoNumber = vendorMethod.accountNumber;
            accountName = vendorMethod.accountName;
        } else {
            // Use default numbers based on selected network
            if (selectedProvider === 'MTN') {
                momoNumber = '0256774847';
                accountName = 'Unity Purchase Store';
            } else if (selectedProvider === 'TELECEL') {
                momoNumber = '0505112925';
                accountName = 'Unity Purchase Store';
            } else if (selectedProvider === 'TIGO') {
                momoNumber = '0256774847'; // Default
                accountName = 'Unity Purchase Store';
            } else {
                momoNumber = '0256774847';
                accountName = 'Unity Purchase Store';
            }
        }

        const { isConfirmed } = await Swal.fire({
            title: 'PAYMENT DETAILS',
            html: `
                <div class="text-left space-y-6">
                    <div class="bg-gradient-to-br from-brand-lemon to-yellow-300 p-6 rounded-2xl text-center border-2 border-yellow-400 shadow-lg">
                        <p class="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Amount to Pay</p>
                        <p class="text-4xl font-black text-slate-900">GH₵${subtotal}</p>
                    </div>
                    
                    <div class="bg-slate-900 p-5 rounded-2xl text-white">
                        <p class="text-[10px] font-black uppercase tracking-widest mb-3 text-brand-lemon">📱 Send ${selectedProvider} Money To:</p>
                        <div class="flex justify-between items-center p-4 bg-white/10 backdrop-blur rounded-xl mb-3">
                            <div>
                                <p class="font-mono font-black text-2xl text-white">${momoNumber}</p>
                                <p class="text-xs text-slate-300 mt-1">${accountName}</p>
                            </div>
                            <span class="text-[10px] bg-brand-lemon text-slate-900 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">${selectedProvider}</span>
                        </div>
                    </div>

                    <div class="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl">
                        <p class="text-xs font-black text-blue-900 uppercase tracking-wide mb-2">⚠️ Important Instructions:</p>
                        <ol class="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Send <strong>GH₵${subtotal}</strong> to the number above</li>
                            <li>Take a <strong>screenshot</strong> of the payment confirmation</li>
                            <li>Click "I Have Paid" and upload your screenshot</li>
                            <li>Your order will be processed once verified</li>
                        </ol>
                    </div>
                </div>
            `,
            confirmButtonText: 'I Have Paid',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[40px] shadow-2xl p-10 bg-slate-50 border-none',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                cancelButton: 'bg-slate-200 text-slate-600 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all mx-2'
            },
            width: '90%',
            backdrop: 'rgba(15, 23, 42, 0.7)'
        });

        if (isConfirmed) {
            const { value: file } = await Swal.fire({
                title: 'CONFIRM PAYMENT',
                text: 'Upload your payment screenshot to finalize your order',
                input: 'file',
                inputAttributes: {
                    accept: 'image/*',
                    'aria-label': 'Upload payment screenshot'
                },
                confirmButtonText: 'Finish Order',
                showCancelButton: true,
                cancelButtonText: 'Go Back',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                    title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4',
                    htmlContainer: 'text-slate-600 text-sm mb-6',
                    confirmButton: 'bg-brand-lemon text-slate-900 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:shadow-lg transition-all mx-2',
                    cancelButton: 'bg-slate-200 text-slate-600 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all mx-2'
                },
                backdrop: 'rgba(15, 23, 42, 0.7)'
            });

            if (file) {
                try {
                    const token = localStorage.getItem('fla_token');

                    // Show uploading message
                    Swal.fire({
                        title: 'UPLOADING PROOF...',
                        text: 'Please wait while we process your payment screenshot',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading(),
                        customClass: {
                            popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                            title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4'
                        }
                    });

                    // Upload screenshot first
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('Failed to upload payment screenshot');
                    }

                    const uploadData = await uploadResponse.json();
                    const paymentProofUrl = uploadData.url || uploadData.path || uploadData.filename;

                    // Create order with payment proof
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
                        vendorId: cartItems[0]?.vendorId,
                        shippingAddress: user?.address || 'Pickup at Studio',
                        shippingCity: user?.location || 'Accra',
                        shippingRegion: 'Greater Accra',
                        paymentMethod: `MOMO - ${selectedProvider}`,
                        paymentProof: paymentProofUrl,
                        notes: 'Order from main bag'
                    };

                    console.log('Creating order with data:', orderData);
                    console.log('Payment proof URL:', paymentProofUrl);

                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(orderData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
                        throw new Error(errorMessage);
                    }

                    Swal.fire({
                        title: 'ORDER COMPLETED! 🎉',
                        html: `
                            <div class="text-center space-y-4">
                                <p class="text-slate-600 text-sm">Your bespoke items are now in the tailoring queue.</p>
                                <div class="bg-brand-lemon/10 p-4 rounded-2xl border border-brand-lemon/20">
                                    <p class="text-xs font-bold text-slate-700">We'll notify you once your order is ready for delivery!</p>
                                </div>
                            </div>
                        `,
                        icon: 'success',
                        iconColor: '#E5FF7F',
                        confirmButtonText: 'View My Orders',
                        buttonsStyling: false,
                        customClass: {
                            popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                            title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4',
                            confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg'
                        }
                    });

                    // Clear cart
                    cartItems.forEach(item => removeFromCart(item.id, item.size));
                    setIsCartOpen(false);
                    router.push('/dashboard');
                } catch (error: any) {
                    console.error('Order creation error:', error);
                    Swal.fire({
                        title: 'SUBMISSION FAILED',
                        html: `
                            <div class="text-left space-y-3">
                                <p class="text-slate-600 text-sm">${error.message || 'An error occurred while processing your order.'}</p>
                                <div class="bg-red-50 p-3 rounded-xl border border-red-100">
                                    <p class="text-xs text-red-600">Please try again or contact support if the issue persists.</p>
                                </div>
                            </div>
                        `,
                        icon: 'error',
                        iconColor: '#EF4444',
                        confirmButtonText: 'Try Again',
                        buttonsStyling: false,
                        customClass: {
                            popup: 'rounded-[40px] shadow-2xl p-10 bg-white border-none',
                            title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4',
                            confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg'
                        }
                    });
                }
            }
        }
    };

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
                    router.push('/auth?role=customer');
                }
            });
            return;
        }

        setIsCartOpen(false); // Close cart before showing modal

        const { isConfirmed } = await Swal.fire({
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
                    <div class="border-t-2 border-dashed border-slate-200 pt-4 flex justify-between items-center">
                        <span class="font-black text-slate-900 uppercase tracking-wider text-sm">Total Payable:</span>
                        <span class="text-2xl font-black text-slate-900 bg-brand-lemon px-4 py-2 rounded-xl shadow-sm">GH₵${subtotal}</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed to Payment',
            cancelButtonText: 'Continue Shopping',
            buttonsStyling: false,
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
