
"use client";
import React from 'react';
import { HelpCircle, ChevronRight, Package, Truck, Wallet, ShieldCheck } from 'lucide-react';

export const VendorHelp: React.FC = () => {
  const guides = [
    { title: 'Processing Orders', icon: Package, desc: 'How to handle new customer requests and manifest generation.' },
    { title: 'Global Logistics', icon: Truck, desc: 'Understanding inter-regional shipping and first-mile fees.' },
    { title: 'Earnings & Payouts', icon: Wallet, desc: 'Revenue cycles, escrow mechanisms, and MoMo withdrawals.' },
    { title: 'Verified Status', icon: ShieldCheck, desc: 'Becoming a Master Artisan and building brand trust.' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl">
        <div className="bg-slate-900 p-12 rounded-[56px] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-lemon/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10 max-w-2xl">
                <HelpCircle className="w-12 h-12 text-brand-lemon mb-8" />
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">Heritage Studio Support</h1>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">Everything you need to scale your legacy brand on the global stage. Expert guidance for modern artisans.</p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {guides.map((g, i) => (
                <button key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-brand-lemon transition-colors">
                            <g.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-1">{g.title}</h3>
                            <p className="text-xs text-slate-400 font-medium">{g.desc}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-slate-900 transition-colors" />
                </button>
            ))}
        </div>

        <div className="p-10 bg-brand-lemon/10 rounded-[48px] border border-brand-lemon/20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Need Bespoke Assistance?</h3>
                <p className="text-sm text-slate-600 font-medium">Our curator team is available for one-on-one technical support.</p>
            </div>
            <button className="bg-slate-900 text-brand-lemon px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Support Channel</button>
        </div>
    </div>
  );
};
