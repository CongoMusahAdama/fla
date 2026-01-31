"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Mail, Lock, ChevronRight, ArrowLeft, Phone, MapPin,
    Store, Package, CreditCard, Upload, ArrowRight, MessageSquare
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<UserRole>('customer');

    // Common Fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [password, setPassword] = useState('');
    const [identifier, setIdentifier] = useState(''); // Email or Phone for login

    // Vendor Specific Fields
    const [shopName, setShopName] = useState('');
    const [productTypes, setProductTypes] = useState('');
    const [accountName, setAccountName] = useState('');
    const [paymentNumber, setPaymentNumber] = useState('');

    const { login, signup } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const urlRole = searchParams.get('role');
        const view = searchParams.get('view');

        if (urlRole === 'vendor') {
            setRole('vendor');
            setIsLogin(false);
        } else if (view === 'register') {
            setIsLogin(false);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(identifier, password);
            } else {
                const vendorData = role === 'vendor' ? {
                    shopName,
                    productTypes,
                    accountName,
                    phone: paymentNumber || phone,
                } : {};

                await signup(name, email, phone, location, password, role, vendorData);
            }

            Swal.fire({
                icon: 'success',
                title: isLogin ? 'Welcome Back!' : 'Account Created',
                text: 'Redirecting you to Fadlan...',
                timer: 2000,
                showConfirmButton: false
            });

            setTimeout(() => {
                router.push(role === 'vendor' ? '/admin' : '/shop');
            }, 2000);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong. Please try again.'
            });
        }
    };

    return (
        <main className="min-h-screen bg-[#E5E7EB]/30 flex items-start md:items-center justify-center p-4 md:p-8 pt-28 md:pt-24">
            <div className="bg-white w-full max-w-6xl min-h-[85vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

                {/* Left Column: The Form */}
                <div className="w-full md:w-[45%] p-8 md:p-16 flex flex-col justify-between relative bg-white">
                    {/* Brand Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-12">
                        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white rotate-45" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tighter text-slate-900 uppercase">Fadlan</span>
                    </Link>

                    <div className="flex-1 max-w-sm mx-auto w-full flex flex-col justify-center">
                        <header className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">
                                {isLogin ? 'Welcome Back' : 'Create an account'}
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">
                                {isLogin ? 'Welcome back! Please enter your details.' : "Let's get started on your fashion journey with us."}
                            </p>
                        </header>

                        {/* Role Selector Only for Signup */}
                        {!isLogin && (
                            <div className="flex p-1 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                                <button
                                    onClick={() => setRole('customer')}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === 'customer' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Customer
                                </button>
                                <button
                                    onClick={() => setRole('vendor')}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === 'vendor' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Vendor
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isLogin ? (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Email or Phone</label>
                                        <input
                                            type="text"
                                            placeholder="you@email.com"
                                            required
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Eg. Yasir Noori"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="you@email.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                                            <input
                                                type="tel"
                                                placeholder="024..."
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Location</label>
                                            <input
                                                type="text"
                                                placeholder="City"
                                                required
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {role === 'vendor' && (
                                        <div className="space-y-4 pt-2 border-t border-slate-50 mt-2">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-700 ml-1">Shop Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Eg. Fadlan Boutique"
                                                    required
                                                    value={shopName}
                                                    onChange={(e) => setShopName(e.target.value)}
                                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-700 ml-1">Momo / Account Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Billing Name"
                                                    required
                                                    value={accountName}
                                                    onChange={(e) => setAccountName(e.target.value)}
                                                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-4">
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-emerald-950 text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98]"
                                >
                                    {isLogin ? 'Sign In' : (role === 'vendor' ? 'Register Business' : 'Create Account')}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="w-full py-4 bg-[#E5FF7F] text-slate-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all"
                                >
                                    {isLogin ? 'Create Account' : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer Contact */}
                    <div className="mt-12 flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-tight">Help@Fadlan.com</span>
                    </div>
                </div>

                {/* Right Column: Visual Inspiration */}
                <div className="hidden md:flex w-[55%] relative p-10">
                    <div className="relative w-full h-full rounded-[40px] overflow-hidden group">
                        <Image
                            src="/hero-model.png"
                            alt="Fashion Inspiration"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-[3s]"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                        {/* Floating Decorative Elements */}
                        <div className="absolute top-10 right-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-white animate-in slide-in-from-top-4 duration-1000">
                            <span className="text-xs font-bold tracking-tight">Bespoke Excellence</span>
                        </div>

                        <div className="absolute bottom-20 left-12 max-w-sm">
                            <h3 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
                                The simplest way <br /> to manage <span className="text-[#E5FF7F]">your style.</span>
                            </h3>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                                <div className="w-2 h-2 rounded-full bg-white" />
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                            </div>
                        </div>

                        {/* Floating Navigation Elements as per image */}
                        <div className="absolute bottom-10 right-10 flex gap-4">
                            <button className="w-12 h-12 rounded-2xl bg-[#E5FF7F]/20 backdrop-blur-md flex items-center justify-center text-[#E5FF7F] border border-[#E5FF7F]/30 hover:bg-[#E5FF7F] hover:text-slate-900 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-white hover:text-slate-900 transition-all">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
            `}</style>
        </main>
    );
}
