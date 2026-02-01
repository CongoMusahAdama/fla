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

import { Suspense } from 'react';

// Memoized Input Component to prevent re-renders of the entire page on every keystroke
const AuthInput = React.memo(({ label, type, placeholder, value, onChange, required, icon: Icon }: any) => {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-bold text-slate-700 ml-1">{label}</label>}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full ${Icon ? 'pl-11' : 'px-4'} py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm transition-all focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-50 outline-none`}
                />
            </div>
        </div>
    );
});

AuthInput.displayName = 'AuthInput';

const LoginForm = ({ onLogin }: { onLogin: (id: string, pass: string) => void }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onLogin(identifier, password); }} className="space-y-4 animate-in fade-in duration-500">
            <AuthInput
                label="Email or Phone"
                type="text"
                placeholder="you@email.com"
                required
                value={identifier}
                onChange={setIdentifier}
                icon={User}
            />
            <AuthInput
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={setPassword}
                icon={Lock}
            />
            <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-emerald-950 text-white rounded-full font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98]">
                    Sign In
                </button>
            </div>
        </form>
    );
};

const RegisterForm = ({ role, onSignup }: { role: UserRole, onSignup: (data: any) => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Vendor Specific
    const [shopName, setShopName] = useState('');
    const [productTypes, setProductTypes] = useState('');
    const [accountName, setAccountName] = useState('');
    const [paymentNumber, setPaymentNumber] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSignup({ name, email, phone, location, password, confirmPassword, shopName, productTypes, accountName, paymentNumber });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[45vh] md:max-h-none pr-1 custom-scrollbar pb-4">
                <AuthInput label="Full Name" type="text" placeholder="Eg. Yasir Noori" required value={name} onChange={setName} icon={User} />
                <AuthInput label="Email Address" type="email" placeholder="you@email.com" required value={email} onChange={setEmail} icon={Mail} />
                <div className="grid grid-cols-2 gap-4">
                    <AuthInput label="Phone" type="tel" placeholder="024..." required value={phone} onChange={setPhone} icon={Phone} />
                    <AuthInput label="Location" type="text" placeholder="City" required value={location} onChange={setLocation} icon={MapPin} />
                </div>

                {role === 'vendor' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 mt-2">
                        <AuthInput label="Shop Name" type="text" placeholder="Eg. FLA Boutique" required value={shopName} onChange={setShopName} icon={Store} />
                        <AuthInput label="MoMo Number" type="tel" placeholder="024XXXXXXX" required value={paymentNumber} onChange={setPaymentNumber} icon={Phone} />
                        <AuthInput label="Momo / Account Name" type="text" placeholder="Billing Name" required value={accountName} onChange={setAccountName} icon={CreditCard} />
                    </div>
                )}

                <AuthInput label="Password" type="password" placeholder="••••••••" required value={password} onChange={setPassword} icon={Lock} />
                <AuthInput label="Confirm Password" type="password" placeholder="••••••••" required value={confirmPassword} onChange={setConfirmPassword} icon={Lock} />
            </div>
            <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-emerald-950 text-white rounded-full font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98]">
                    {role === 'vendor' ? 'Register Business' : 'Create Account'}
                </button>
            </div>
        </form>
    );
};

function AuthContent() {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<UserRole>('customer');

    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);

    const { login, signup } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const urlRole = searchParams.get('role');
        const view = searchParams.get('view');

        if (urlRole === 'vendor') {
            setRole('vendor');
            localStorage.setItem('last_intended_role', 'vendor');
            setIsLogin(false);
        } else if (urlRole === 'customer') {
            setRole('customer');
            localStorage.setItem('last_intended_role', 'customer');
        } else if (view === 'register') {
            setIsLogin(false);
        }
    }, [searchParams]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showOTP && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [showOTP, timer]);

    const handleLogin = async (identifier: string, pass: string) => {
        try {
            await login(identifier, pass);
            showSuccess(true);
        } catch (error) {
            showError();
        }
    };

    const handleSignup = async (data: any) => {
        if (data.password !== data.confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Passwords do not match.' });
            return;
        }

        try {
            const vendorData = role === 'vendor' ? {
                shopName: data.shopName,
                productTypes: data.productTypes,
                accountName: data.accountName,
                momoNumber: data.paymentNumber,
            } : {};

            await signup(data.name, data.email, data.phone, data.location, data.password, role, vendorData);

            if (role === 'vendor') {
                setShowOTP(true);
                Swal.fire({
                    icon: 'info',
                    title: 'Verification Needed',
                    text: `We've sent a 4-digit code to ${data.email}.`,
                    customClass: { popup: 'rounded-[32px]' }
                });
            } else {
                showSuccess(false);
            }
        } catch (error) {
            showError();
        }
    };

    const showSuccess = (isLog: boolean) => {
        Swal.fire({
            icon: 'success',
            title: isLog ? 'Welcome Back!' : 'Account Created',
            text: 'Redirecting you to FLA...',
            timer: 2000,
            showConfirmButton: false
        });
        setTimeout(() => {
            router.push(role === 'vendor' ? '/vendor' : '/dashboard');
        }, 2000);
    };

    const showError = () => {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Something went wrong.' });
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedData = e.clipboardData.getData('Text').slice(0, 4);
        if (/^\d{1,4}$/.test(pastedData)) {
            const newOtp = [...otp];
            pastedData.split('').forEach((char, i) => {
                newOtp[i] = char;
            });
            setOtp(newOtp);
        }
    };

    const handleResendOtp = () => {
        setTimer(60);
        Swal.fire({
            icon: 'success',
            title: 'OTP Resent',
            text: 'Please check your email again.',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[32px]' }
        });
    };

    const handleVerifyOtp = async () => {
        const code = otp.join('');
        if (code.length < 4) return;
        Swal.fire({ title: 'Verifying...', didOpen: () => Swal.showLoading(), allowOutsideClick: false, customClass: { popup: 'rounded-[32px]' } });
        setTimeout(() => {
            Swal.fire({ icon: 'success', title: 'Vandor Verified! 🎉', text: 'Your business account is now active.', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-[32px]' } });
            setTimeout(() => { router.push('/vendor'); }, 2000);
        }, 1500);
    };

    return (
        <main className="min-h-screen bg-[#E5E7EB]/30 flex items-start md:items-center justify-center p-4 md:p-8 pt-28 md:pt-24">
            <div className="bg-white w-full max-w-6xl min-h-[85vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                <div className="w-full md:w-[45%] p-8 md:p-16 flex flex-col justify-between relative bg-white">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white rotate-45" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tighter text-slate-900 uppercase">FLA</span>
                    </Link>

                    <div className="flex-1 max-w-sm mx-auto w-full flex flex-col justify-center">
                        {showOTP ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8">
                                    <div className="w-16 h-16 bg-[#D8F800]/20 text-slate-900 rounded-[24px] flex items-center justify-center mb-6">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Verify Studio</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">A code was sent to your email.</p>
                                </div>
                                <div className="flex gap-3 mb-8">
                                    {otp.map((digit, i) => (
                                        <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onPaste={handlePaste} className="w-full aspect-square bg-slate-50 border-none rounded-2xl text-2xl font-black text-center focus:ring-4 focus:ring-[#D8F800]/20" />
                                    ))}
                                </div>
                                <button onClick={handleVerifyOtp} disabled={otp.join('').length < 4} className="w-full py-5 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] mb-6 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50">
                                    Verify & Launch Hub
                                </button>
                                <div className="text-center">
                                    {timer > 0 ? (
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resend code in {timer}s</p>
                                    ) : (
                                        <button onClick={handleResendOtp} className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:underline">Didn't get the code? Resend</button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <React.Fragment>
                                <header className="mb-6">
                                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-1">
                                        {isLogin ? 'WELCOME BACK' : (role === 'vendor' ? 'NEW STUDIO' : 'JOIN THE TRIBE')}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium tracking-tight">
                                        {isLogin ? 'Sign in to access your fashion dashboard.' : 'Start your journey with FLA Logistics today.'}
                                    </p>
                                </header>

                                {!searchParams.get('role') && (
                                    <div className="flex p-1 bg-slate-50 rounded-full mb-6 border border-slate-100">
                                        <button onClick={() => { setRole('customer'); localStorage.setItem('last_intended_role', 'customer'); }} className={`flex-1 py-2 text-[10px] font-bold rounded-full transition-all ${role === 'customer' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Customer</button>
                                        <button onClick={() => { setRole('vendor'); localStorage.setItem('last_intended_role', 'vendor'); }} className={`flex-1 py-2 text-[10px] font-bold rounded-full transition-all ${role === 'vendor' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Vendor</button>
                                    </div>
                                )}

                                {isLogin ? (
                                    <LoginForm onLogin={handleLogin} />
                                ) : (
                                    <RegisterForm role={role} onSignup={handleSignup} />
                                )}

                                <div className="space-y-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="w-full py-4 bg-[#D8F800] text-slate-900 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98]"
                                    >
                                        {isLogin ? 'Create Account' : 'Sign In'}
                                    </button>
                                </div>
                            </React.Fragment>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center md:justify-start gap-2 text-slate-300">
                        <Mail className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Help@FLA.com</span>
                    </div>
                </div>

                <div className="hidden md:flex w-[55%] relative p-10">
                    <div className="relative w-full h-full rounded-[40px] overflow-hidden group">
                        <Image src="/hero-model.png" alt="Fashion Inspiration" fill className="object-cover group-hover:scale-105 transition-transform duration-[3s]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                        <div className="absolute top-10 right-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-white">
                            <span className="text-xs font-bold tracking-tight">Bespoke Excellence</span>
                        </div>
                        <div className="absolute bottom-20 left-12 max-w-sm">
                            <h3 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
                                The simplest way <br /> to manage <span className="text-[#E5FF7F]">your style.</span>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
            `}</style>
        </main>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <AuthContent />
        </Suspense>
    );
}
