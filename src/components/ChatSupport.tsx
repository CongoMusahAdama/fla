
"use client";
import React from 'react';
import { Phone, X, Headset } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ChatSupport() {
    const { isSupportOpen, setIsSupportOpen } = useCart();

    return (
    return (
        <div className="fixed bottom-6 right-6 z-[50] flex flex-col items-end pointer-events-none">
            {/* Support Box */}
            {isSupportOpen && (
                <div className="mb-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto origin-bottom-right">
                    {/* Header */}
                    <div className="bg-slate-900 p-5 text-white">
                        <h3 className="font-heading text-lg font-bold">Contact Support</h3>
                        <p className="text-white/60 text-xs">Call us for immediate assistance</p>
                    </div>

                    {/* Phone Numbers Only */}
                    <div className="p-4 space-y-3">
                        <a
                            href="tel:0256774847"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">025 677 4847</p>
                                <p className="text-[10px] text-slate-500 font-medium">Customer Service</p>
                            </div>
                        </a>

                        <a
                            href="tel:0505112925"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">050 511 2925</p>
                                <p className="text-[10px] text-slate-500 font-medium">Secondary Line</p>
                            </div>
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Available 9am — 6pm</p>
                    </div>
                </div>
            )}

            {/* Chat Button with Text (Desktop) / Icon (Mobile) */}
            <button
                onClick={() => setIsSupportOpen(!isSupportOpen)}
                className={`flex items-center gap-3 px-4 md:px-6 h-14 rounded-full shadow-2xl transition-all duration-300 group pointer-events-auto ${isSupportOpen ? 'bg-slate-900 border border-brand-lemon/30' : 'bg-slate-900 hover:scale-105 active:scale-95'
                    }`}
            >
                <div className="relative">
                    {isSupportOpen ? (
                        <X className="w-5 h-5 text-brand-lemon transition-transform duration-300" />
                    ) : (
                        <Headset className="w-5 h-5 text-brand-lemon transition-transform duration-300 group-hover:rotate-12" />
                    )}
                </div>
                <span className="hidden md:block text-brand-lemon text-xs font-bold tracking-wider uppercase">
                    {isSupportOpen ? 'Close' : 'Contact Support'}
                </span>
            </button>
        </div>
    );
}
