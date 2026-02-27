"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, Truck, CheckCircle2, Clock, MapPin, ChevronLeft, ShieldCheck, Box } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function OrderTracking() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/track/${id}`);
                if (res.ok) {
                    setOrder(await res.json());
                }
            } catch (err) {
                console.error("Tracking fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrder();
    }, [id]);

    const getImageUrl = (url: string | undefined | null) => {
        if (!url || url === '/product-1.jpg') return '/product-1.jpg';
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBase.replace(/\/api\/?$/, '');

        if (url.startsWith('/uploads/')) return `${baseUrl}${url}`;
        if (url.startsWith('uploads/')) return `${baseUrl}/${url}`;
        if (url.startsWith('/')) return url;

        return `${baseUrl}/uploads/${url}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-lemon rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locating Package...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="text-center space-y-6">
                    <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto" />
                    <h1 className="text-2xl font-black text-slate-900 uppercase">Track Not Found</h1>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">We couldn't find a record for this ID. Please check your shipping label or verification email.</p>
                    <Link href="/">
                        <button className="px-8 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest mt-4">Return Home</button>
                    </Link>
                </div>
            </div>
        );
    }

    const steps = [
        { label: 'Confirmed', status: 'confirmed', icon: Clock, desc: 'Payment verified and studio notified.' },
        { label: 'Processing', status: 'processing', icon: Box, desc: 'Your fashion piece is being prepared.' },
        { label: 'Shipped', status: 'shipped', icon: Truck, desc: 'Package is with our courier partner.' },
        { label: 'Delivered', status: 'delivered', icon: CheckCircle2, desc: 'Design has reached its destination.' }
    ];

    const currentStatusIndex = steps.findIndex(s => s.status === (order.status || 'confirmed').toLowerCase());
    const isPaid = order.isPaid;

    return (
        <main className="min-h-screen bg-[#FDFDFF]">
            {/* Header */}
            <header className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                </Link>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">FLA TRACKING HUB</h1>
                <div className="w-10" />
            </header>

            <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-12 pb-32">
                {/* ID Card section */}
                <div className="bg-slate-900 rounded-[48px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Package className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPaid ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                                    {isPaid ? 'Verified Paid' : 'Pending Proof'}
                                </span>
                                <span className="text-slate-400 font-bold">•</span>
                                <span className="text-[10px] font-black text-brand-lemon uppercase tracking-widest">#ORD-{id?.toString().slice(-8).toUpperCase()}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">{order.status || 'PROCESSING'}</h2>
                            <p className="text-slate-400 text-sm font-medium">Hello, {order.customerName}. Your signature design is on the move.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/10 min-w-[240px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                            <p className="text-lg font-black leading-tight uppercase mb-4">{order.shippingCity}, {order.shippingRegion}</p>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-lemon transition-all duration-1000" style={{ width: `${((currentStatusIndex + 1) / steps.length) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="grid md:grid-cols-[1fr_320px] gap-8">
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight ml-4">Live Journey</h3>
                        <div className="bg-white rounded-[48px] border border-slate-100 p-8 md:p-12 shadow-sm space-y-12">
                            {steps.map((step, idx) => {
                                const isCompleted = idx <= currentStatusIndex;
                                const isCurrent = idx === currentStatusIndex;
                                return (
                                    <div key={idx} className="relative flex gap-8">
                                        {idx !== steps.length - 1 && (
                                            <div className={`absolute top-12 left-6 w-0.5 h-full ${idx < currentStatusIndex ? 'bg-slate-900' : 'bg-slate-100'}`} />
                                        )}
                                        <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${isCurrent ? 'bg-slate-900 text-brand-lemon shadow-xl rotate-3' : isCompleted ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-200'}`}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1 pt-1">
                                            <h4 className={`text-lg font-black uppercase tracking-tight ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</h4>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Studio Manifest</h3>
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden relative flex-shrink-0 border border-slate-100">
                                        {item.image ? (
                                            <Image
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                fill
                                                unoptimized={true}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{item.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.size || 'ONE SIZE'} • {item.quantity} UNIT</p>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-6 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Payout Value</p>
                                <p className="text-2xl font-black text-slate-900">GH₵ {order.totalAmount?.toLocaleString()}</p>
                            </div>
                        </div>

                        {(order.trackingNumber || order.carrier) && (
                            <div className="p-10 bg-brand-lemon rounded-[48px] shadow-xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <Truck className="w-6 h-6 text-slate-900" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Courier Info</h3>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest mb-1">Tracking Number</p>
                                    <p className="text-lg font-black text-slate-900 tracking-widest">{order.trackingNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest mb-1">Carrier</p>
                                    <p className="text-sm font-black text-slate-900 uppercase">{order.carrier || 'FLA Logistics'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
