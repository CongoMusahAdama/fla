"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Search, ShoppingBag, Copy, Check } from 'lucide-react';
import Swal from 'sweetalert2';

export default function RefereeStorefront() {
    const { slug } = useParams();
    const router = useRouter();
    const [storeData, setStoreData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyProductLink = async (e: React.MouseEvent, productId: string, refereeCode: string) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/product/${productId}?ref=${refereeCode}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(productId);
            setTimeout(() => setCopiedId((id) => (id === productId ? null : id)), 2000);
        } catch {
            // clipboard unavailable — silently ignore
        }
    };

    useEffect(() => {
        if (slug) fetchStore();
    }, [slug]);

    // Checkout return — buyer is sent back here (not to /dashboard) after paying via this referral link.
    useEffect(() => {
        if (typeof window === 'undefined' || !slug) return;
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order_id');
        const paid = params.get('paid');
        if (!orderId || paid !== '1') return;

        const seenKey = `fla_ref_paid_${orderId}`;
        if (sessionStorage.getItem(seenKey)) {
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }
        sessionStorage.setItem(seenKey, '1');
        window.history.replaceState({}, '', window.location.pathname);

        Swal.fire({
            icon: 'success',
            iconColor: '#059669',
            title: 'Payment received',
            html: `
                <p class="text-slate-600 text-sm leading-relaxed">
                    Thank you for shopping through <strong>${storeData?.referee?.name || 'this'}</strong>'s picks.
                    A receipt will be sent to your email. The vendor may contact you on WhatsApp about delivery.
                </p>
            `,
            confirmButtonText: 'Keep browsing',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl p-8 bg-white',
                title: 'text-xl font-black text-slate-900 tracking-tighter uppercase',
                confirmButton:
                    'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all',
            },
        });
    }, [slug, storeData?.referee?.name]);

    const fetchStore = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/store/public/${slug}`);
            if (res.ok) {
                setStoreData(await res.json());
            } else {
                router.replace('/shop'); // Redirect if not found
            }
        } catch (error) {
            console.error('Failed to load store', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1F5] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div>
            </div>
        );
    }

    if (!storeData) return null;

    const filteredProducts = storeData.products.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#EEF1F5] flex flex-col">
            {/* Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.jpeg" alt="FLA" width={32} height={32} className="rounded-lg shadow-sm" />
                        <span className="font-bold text-slate-900 tracking-tight hidden sm:block">FLA Purchase</span>
                    </Link>
                    <div className="flex-1 max-w-md mx-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-lemon/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Store Profile */}
            <div className="bg-brand-blue text-white py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="w-20 h-20 bg-brand-lemon text-slate-900 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-4 shadow-xl shadow-brand-lemon/20">
                        {storeData.referee.name.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                        {storeData.referee.name}'s Picks
                    </h1>
                    <p className="text-white/70 max-w-lg mx-auto">
                        Curated products recommended by {storeData.referee.name}. Shop quality items from verified FLA vendors.
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Recommended Products <span className="text-sm font-medium text-slate-500 ml-2">({filteredProducts.length})</span></h2>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {filteredProducts.map((product: any) => {
                            const productUrl = `/product/${product._id}?ref=${storeData.referee.refereeCode}`;
                            return (
                                <Link href={productUrl} key={product._id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/50 flex flex-col">
                                    <div className="aspect-[4/5] relative bg-slate-100 overflow-hidden">
                                        <Image src={product.images[0] || '/placeholder.png'} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors" />
                                        <button
                                            type="button"
                                            onClick={(e) => handleCopyProductLink(e, product._id, storeData.referee.refereeCode)}
                                            aria-label="Copy product link"
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                                        >
                                            {copiedId === product._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1 line-clamp-1">{product.vendorName}</p>
                                        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-3 flex-1 group-hover:text-brand-lemon-hover transition-colors">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-bold text-slate-900">GHS {product.price.toFixed(2)}</span>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-brand-lemon group-hover:text-slate-900 transition-colors">
                                                <ShoppingBag className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
                        <p className="text-slate-500 text-sm">We couldn't find any products matching your search.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
