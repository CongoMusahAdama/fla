"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { 
    ShieldCheck, 
    Globe, 
    Users, 
    Rocket, 
    Lock, 
    Scale, 
    Flag, 
    Briefcase, 
    Code,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    Building2,
    Zap,
    X,
    Quote,
    MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    const [isFounderModalOpen, setIsFounderModalOpen] = useState(false);

    return (
        <main className="min-h-screen bg-white">
            {/* --- Hero Section --- */}
            <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 bg-slate-900" />
                
                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-8 leading-[0.9]">
                        Trust Built <br /> <span className="text-brand-lemon italic">into Trade.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-300 text-lg md:text-xl font-medium leading-relaxed mb-10">
                        We are a nationwide marketplace built to make buying and selling simple, secure, and accessible—without the need for a physical storefront.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/shop" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-lemon transition-all shadow-2xl">
                            Explore Marketplace
                        </Link>
                        <Link href="/auth?role=vendor" className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                            Become a Vendor
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- Core Values Section --- */}
            <section className="py-24 px-6 relative z-10 -mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-50 group hover:-translate-y-2 transition-all duration-500">
                            <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center mb-6 group-hover:bg-brand-lemon transition-colors">
                                <Globe className="w-6 h-6 text-white group-hover:text-slate-900" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Nationwide Reach</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Empowering vendors to reach customers across all of Ghana, breaking the boundaries of physical shop locations.
                            </p>
                        </div>
                        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-50 group hover:-translate-y-2 transition-all duration-500">
                            <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center mb-6 group-hover:bg-brand-lemon transition-colors">
                                <ShieldCheck className="w-6 h-6 text-white group-hover:text-slate-900" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Fraud Protection</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Confidence that every order is protected. From discovery to delivery, every step is transparent and secure.
                            </p>
                        </div>
                        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-50 group hover:-translate-y-2 transition-all duration-500">
                            <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center mb-6 group-hover:bg-brand-lemon transition-colors">
                                <TrendingUp className="w-6 h-6 text-white group-hover:text-slate-900" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Scale with Ease</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Structured and trackable processes that allow businesses to grow without the overhead of a physical storefront.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- What We Do Section --- */}
            <section className="py-24 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block">Our Purpose</span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">
                            Connecting Ghana <br /> Through <span className="text-slate-400">Trusted Trade.</span>
                        </h2>
                        <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            We connect vendors and customers on a single trusted platform, removing uncertainty from online buying and selling.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Vendors sell nationwide without a physical shop",
                                "Customers shop confidently from verified sellers",
                                "Payments are secured through trusted systems",
                                "Every order follows a trackable process"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-6 h-6 rounded-full bg-brand-lemon flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-4 h-4 text-slate-900" />
                                    </div>
                                    <span className="text-slate-900 font-black uppercase text-xs tracking-widest">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                            <Image
                                src="/image.png"
                                alt="Modern Commerce"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Our Mission Section --- */}
            <section className="py-32 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lemon/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-lemon/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-lemon mb-8 block">Our Mission</span>
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-10">
                        To build a trusted digital marketplace where anyone can trade safely, <span className="text-brand-lemon">anywhere in Ghana.</span>
                    </h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
                        We believe commerce should be simple, fair, and protected—no one should lose money because of lack of trust in a system.
                    </p>
                </div>
            </section>

            {/* --- How We Keep It Safe Section --- */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4">Built on Trust</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Security is at the foundation of our platform</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Lock, title: "Secure Payments", desc: "Processing via Paystack for absolute financial safety." },
                            { icon: Users, title: "Verified Vendors", desc: "Rigorous onboarding and verification checks for every shop." },
                            { icon: Scale, title: "Accountability", desc: "Structured order flow with responsibility at every step." },
                            { icon: Rocket, title: "Transparency", desc: "Full transaction history for both buyers and sellers." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                                <item.icon className="w-10 h-10 text-slate-300 group-hover:text-brand-lemon mb-6 transition-colors" />
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{item.title}</h4>
                                <p className="text-slate-500 text-xs leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Skynet Logistics Network (Premium Redesign) --- */}
            <section className="py-40 px-6 bg-[#f8fafc] relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-lemon/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-16 mb-24">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-[2px] bg-brand-lemon" />
                                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Strategic Logistics</span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85] mb-10">
                                Nationwide <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">Infrastructure.</span>
                            </h2>
                            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-2xl">
                                Our partnership with <span className="text-slate-900 font-black border-b-2 border-brand-lemon pb-1">Skynet Express</span> transforms the entire map of Ghana into your personal storefront window.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-6">
                            <div className="bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Network</p>
                                    <p className="text-base font-black text-emerald-500 uppercase flex items-center gap-2 justify-end">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Operational
                                    </p>
                                </div>
                                <div className="h-16 w-[1px] bg-slate-100" />
                                <div className="relative h-24 w-72">
                                    <Image 
                                        src="/skynet.png" 
                                        alt="Skynet Express" 
                                        fill 
                                        className="object-contain hover:scale-110 transition-transform duration-500" 
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-4">Trusted by 500+ Local Vendors</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[
                            { city: "Accra", name: "Head Office", address: "Adabla Plaza, Kokomlemle", tel: "0302230516", email: "p.norteye@skynetgh.com", region: "Greater Accra" },
                            { city: "Kumasi", name: "Kumasi Branch", address: "297 Hudson Road, Asokwa", tel: "0322005717", email: "e.barimah@skynetgh.com", region: "Ashanti" },
                            { city: "Takoradi", name: "Takoradi Branch", address: "Opp. Takoradi Airport", tel: "0558151515", email: "e.darkwa@skynetgh.com", region: "Western" },
                            { city: "Tamale", name: "Tamale Branch", address: "Yamusah Building, Tamale", tel: "0558161616", email: "t.damte@skynetgh.com", region: "Northern" },
                            { city: "Tema", name: "Tema Branch", address: "Community one, Tema", tel: "0362195280", email: "a.paintsil@skynetgh.com", region: "Greater Accra" },
                            { city: "Sunyani", name: "Sunyani Branch", address: "SSNIT Building, Sunyani", tel: "0551004444", email: "j.sanbir@skynetgh.com", region: "Bono" },
                            { city: "Koforidua", name: "Koforidua Branch", address: "SSNIT Office Complex", tel: "0352291442", email: "e.safoa@skynetgh.com", region: "Eastern" },
                            { city: "Wa", name: "Wa Branch", address: "Stanbic Bank Building", tel: "0303966467", email: "s.bulla@skynetgh.com", region: "Upper West" },
                            { city: "Cape Coast", name: "Cape Coast Branch", address: "SSNIT Office Complex", tel: "0302230516", email: "j.osei@skynetgh.com", region: "Central" },
                            { city: "Ho", name: "Ho Branch", address: "SSNIT Office Complex", tel: "0551002222", email: "s.nartey@skynetgh.com", region: "Volta" },
                            { city: "Bolgatanga", name: "Bolga Branch", address: "SSNIT Office Complex", tel: "0541674712", email: "z.issahaku@skynetgh.com", region: "Upper East" },
                            { city: "Tarkwa", name: "Tarkwa Branch", address: "SSNIT Building", tel: "0553906496", email: "p.tibil@skynetgh.com", region: "Western" }
                        ].map((branch, i) => (
                            <div key={i} className="group relative bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-3 transition-all duration-700 overflow-hidden">
                                {/* Interactive background accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:bg-brand-lemon transition-colors duration-700" />
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                            <Building2 className="w-6 h-6 text-brand-lemon" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-500">
                                            {branch.region}
                                        </span>
                                    </div>

                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 group-hover:text-slate-900">{branch.city}</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">{branch.name}</p>
                                    
                                    <div className="space-y-6 pt-8 border-t border-slate-50">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{branch.address}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                <Zap className="w-3.5 h-3.5 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900">{branch.tel}</p>
                                        </div>
                                        <div className="flex items-center gap-4 group/mail">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover/mail:bg-slate-900 transition-colors">
                                                <Code className="w-3.5 h-3.5 text-slate-400 group-hover/mail:text-brand-lemon" />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-400 lowercase truncate">{branch.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Ecosystem & Compliance --- */}
            <section className="py-24 px-6 bg-slate-900 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto mb-16 text-center lg:text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-lemon mb-4 block">Ecosystem & Compliance</span>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">Regulated & Integrated.</h2>
                    <p className="text-slate-400 text-sm font-medium">Operating under national legal frameworks and industry standards.</p>
                </div>

                {/* Infinite Logo Ticker */}
                <div className="relative w-full py-10 bg-slate-900/50 rounded-[40px] border border-white/5">
                    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                        <div className="flex animate-marquee whitespace-nowrap items-center gap-32 py-4">
                            {[
                                { src: "/paystack.png", name: "Paystack", width: 180 },
                                { src: "/skynet.png", name: "Skynet Express", width: 160 },
                                { src: "/mtn.png", name: "MTN Ghana", width: 140 },
                                { src: "/payment-logos/telecel.png", name: "Telecel", width: 180 },
                                { src: "/airteltigo.png", name: "AirtelTigo", width: 180 },
                                { src: "/visacard.png", name: "Visa / Mastercard", width: 160 },
                                // Duplicated set for infinite loop
                                { src: "/paystack.png", name: "Paystack", width: 180 },
                                { src: "/skynet.png", name: "Skynet Express", width: 160 },
                                { src: "/mtn.png", name: "MTN Ghana", width: 140 },
                                { src: "/payment-logos/telecel.png", name: "Telecel", width: 180 },
                                { src: "/airteltigo.png", name: "AirtelTigo", width: 180 },
                                { src: "/visacard.png", name: "Visa / Mastercard", width: 160 }
                            ].map((logo, i) => (
                                <div key={i} className="flex flex-col items-center gap-8 shrink-0 px-10 group">
                                    <div className="relative w-32 h-32 md:w-36 md:h-36 bg-white rounded-full overflow-hidden shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:shadow-[0_20px_60px_rgba(235,255,0,0.2)]">
                                        <Image
                                            src={logo.src}
                                            alt={logo.name}
                                            fill
                                            className="object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 group-hover:text-brand-lemon transition-colors duration-500">{logo.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-20 border-t border-white/5 max-w-7xl mx-auto">
                    <div className="text-center md:text-left">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Statutory Compliance</h5>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <Building2 className="w-4 h-4 text-brand-lemon" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Office of the Registrar of Companies</span>
                            </div>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <Flag className="w-4 h-4 text-brand-lemon" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Republic of Ghana Framework</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 60s linear infinite;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </section>

            {/* --- Our Story Section --- */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative aspect-square rounded-[60px] overflow-hidden shadow-2xl">
                        <Image
                            src="/hero-new.png"
                            alt="The Vision"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/20" />
                    </div>
                    <div className="space-y-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block">Our Story</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">
                            Solving the <br /> <span className="text-slate-400">Trust Problem.</span>
                        </h2>
                        <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
                            <p>
                                This platform was created to solve a real problem in online commerce—lack of trust. Too many buyers lose money due to unreliable sellers, and many vendors struggle to reach customers beyond their physical location.
                            </p>
                            <p>
                                We built a system that solves both sides of the problem by introducing structure, verification, and accountability. Every feature exists to make online trade safer and more reliable.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Team Section --- */}
            <section className="py-32 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-4 block">Our Team</span>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter">The People Behind the Vision</h2>
                    </div>
                    
                    <div className="max-w-xl mx-auto">
                        {/* Founder */}
                        <div className="flex flex-col items-center md:items-start group">
                            <div className="relative w-full aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl mb-8 group-hover:-translate-y-4 transition-transform duration-700">
                                <Image
                                    src="/fadilan.png"
                                    alt="Fadilan Salifu"
                                    fill
                                    className="object-cover transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                <div className="absolute bottom-10 left-10 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-lemon mb-2">Founder & CEO</p>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Fadilan Salifu</h3>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <p className="text-slate-500 font-medium leading-relaxed max-w-md">
                                    Fadilan is the founder of the platform and leads the overall vision, strategy, and business direction.
                                </p>
                                <button 
                                    onClick={() => setIsFounderModalOpen(true)}
                                    className="flex items-center gap-3 text-slate-900 font-black uppercase tracking-widest text-[10px] group/btn"
                                >
                                    <span>Read Story</span>
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Why Trust Us Section --- */}
            <section className="py-32 px-6 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                            Why People <br /> <span className="text-brand-lemon">Trust Us.</span>
                        </h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            We are building for long-term trust, not short-term gain. Every feature is designed with your safety in mind.
                        </p>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            "Transparent system design",
                            "Real founders and team",
                            "Verified integrations",
                            "Fraud prevention mechanisms",
                            "Structured delivery process",
                            "Legal compliance"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <CheckCircle2 className="w-5 h-5 text-brand-lemon" />
                                <span className="text-xs font-bold uppercase tracking-widest">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Closing Section --- */}
            <section className="py-40 px-6 text-center bg-white relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-slate-50" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-12">
                        We are not just <br /> <span className="text-slate-400">building a marketplace.</span>
                    </h2>
                    <div className="w-24 h-2 bg-brand-lemon mx-auto mb-12" />
                    <p className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
                        We are building trust into <br /> how people trade online.
                    </p>
                    <div className="mt-20">
                        <Link href="/shop" className="group relative inline-flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-brand-lemon translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="relative group-hover:text-slate-900 transition-colors">Start Shopping Now</span>
                            <ArrowRight className="relative w-4 h-4 group-hover:text-slate-900 group-hover:translate-x-2 transition-all" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- Founder Modal --- */}
            {isFounderModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsFounderModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl flex flex-col lg:flex-row animate-in zoom-in-95 duration-500">
                        <button 
                            onClick={() => setIsFounderModalOpen(false)}
                            className="absolute top-6 right-6 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center z-10 hover:bg-brand-lemon hover:text-slate-900 transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="lg:w-2/5 relative h-[400px] lg:h-auto">
                            <Image
                                src="/fadilan.png"
                                alt="Fadilan Salifu"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 text-white">
                                <p className="text-brand-lemon font-black uppercase tracking-widest text-xs mb-2">The Founder</p>
                                <h3 className="text-4xl font-black uppercase tracking-tighter">Fadilan Salifu</h3>
                            </div>
                        </div>

                        <div className="lg:w-3/5 p-10 md:p-16 space-y-10">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 block">About the CEO</span>
                                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Visionary Leadership.</h2>
                            </div>

                            <div className="space-y-8 relative">
                                <Quote className="absolute -top-10 -left-6 w-16 h-16 text-slate-100 -z-10" />
                                <div className="space-y-6 text-slate-600 text-lg font-medium leading-relaxed italic border-l-4 border-brand-lemon pl-8">
                                    <p>
                                        "Fadilan is the founder of the platform and leads the overall vision, strategy, and business direction."
                                    </p>
                                </div>
                                <div className="space-y-6 text-slate-500 text-base leading-relaxed">
                                    <p>
                                        He started this project with a clear goal: to create a trusted nationwide marketplace that allows anyone to sell without a storefront while protecting customers from fraud.
                                    </p>
                                    <p>
                                        Under his leadership, the platform has grown from a visionary concept into a robust ecosystem that prioritizes security, transparency, and accountability at every step of the transaction.
                                    </p>
                                    <p>
                                        He oversees growth, partnerships, and the long-term direction of the platform, ensuring that every feature exists to make online trade safer and more reliable for everyone in Ghana.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-10 grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <Rocket className="w-6 h-6 text-slate-900 mb-4" />
                                    <h5 className="font-black uppercase tracking-widest text-[10px] text-slate-900">Vision</h5>
                                    <p className="text-slate-500 text-[10px] font-medium mt-1">Leading nationwide digital trade innovation.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <ShieldCheck className="w-6 h-6 text-slate-900 mb-4" />
                                    <h5 className="font-black uppercase tracking-widest text-[10px] text-slate-900">Trust</h5>
                                    <p className="text-slate-500 text-[10px] font-medium mt-1">Ensuring absolute safety for every customer.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Footer / Legal --- */}
            <footer className="py-12 bg-slate-50 border-t border-slate-100 px-6 text-center">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        © 2026 All Rights Reserved • FLA Purchase
                    </p>
                    <p className="text-[9px] text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-wider">
                        This platform operates in accordance with the laws of the Republic of Ghana. All trademarks, logos, and third-party names belong to their respective owners and are used strictly for identification and integration purposes.
                    </p>
                </div>
            </footer>
        </main>
    );
}
