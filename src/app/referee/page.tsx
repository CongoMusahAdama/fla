"use client";

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, User, Phone, MapPin, Upload, CreditCard, Music2, Ghost } from 'lucide-react';
import Swal from 'sweetalert2';
import { Suspense } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { GHANA_REGIONS } from '@/lib/ghana-regions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function uploadFile(file: File | null): Promise<string | undefined> {
    if (!file) return undefined;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/upload/public`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Document upload failed. Please try again.');
    const result = await res.json();
    return result.url;
}

const DocUpload = ({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) => (
    <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-slate-600">{label}</label>
        <label className="flex items-center gap-3 h-12 px-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-brand-lemon transition-all">
            <Upload className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 truncate">{file ? file.name : `Upload ${label.toLowerCase()}`}</span>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
            />
        </label>
    </div>
);

const AuthInput = React.memo(({ label, type, placeholder, value, onChange, required, icon: Icon }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[13px] font-medium text-slate-600">
                    {label}
                </label>
            )}
            <div className="relative group z-10">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    type={inputType}
                    placeholder={placeholder}
                    required={required}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full ${Icon ? 'pl-10' : 'px-3.5'} ${isPassword ? 'pr-16' : 'pr-3.5'} h-12 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-lemon focus:ring-2 focus:ring-brand-lemon/30 outline-none`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors p-1.5 cursor-pointer z-20"
                    >
                        <span className="text-[10px] font-semibold uppercase tracking-wide">{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                )}
            </div>
        </div>
    );
});
AuthInput.displayName = 'AuthInput';

function RefereeAuthContent() {
    const { login, isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [region, setRegion] = useState('');
    const [tiktokLink, setTiktokLink] = useState('');
    const [snapchatLink, setSnapchatLink] = useState('');
    const [momoNetwork, setMomoNetwork] = useState('MTN');
    const [momoNumber, setMomoNumber] = useState('');
    const [momoAccountName, setMomoAccountName] = useState('');
    const [isLookingUpMomo, setIsLookingUpMomo] = useState(false);
    const [selfie, setSelfie] = useState<File | null>(null);

    const handleMomoNumberChange = async (value: string) => {
        setMomoNumber(value);
        if (value.length < 10) return;
        setIsLookingUpMomo(true);
        try {
            const response = await fetch(`${API_URL}/payments/lookup-name/${momoNetwork}/${value}`);
            const data = await response.json();
            // Only pre-fill on a real match — never overwrite what the user may have already typed,
            // and don't block them if the lookup service can't verify the name.
            if (data.success && data.name) setMomoAccountName(data.name);
        } catch {
            // Lookup unavailable — account name stays editable so they can enter it manually.
        } finally {
            setIsLookingUpMomo(false);
        }
    };

    useEffect(() => {
        if (!isLoading && isAuthenticated && user?.role === 'referee') {
            router.push('/referee/dashboard');
        }
    }, [isAuthenticated, isLoading, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loggedUser = await login(email, password);
            if (loggedUser.role === 'referee') {
                router.push('/referee/dashboard');
            } else {
                Swal.fire({ icon: 'error', title: 'Access Denied', text: 'This login is for referees only.' });
            }
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Login Failed', text: error.message || 'Invalid credentials' });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!region) {
            Swal.fire({ icon: 'warning', title: 'Region required', text: 'Please select your region.' });
            return;
        }
        if (!momoNumber || momoNumber.length < 10 || !momoAccountName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Payout details required', text: 'Please enter your MoMo/bank number and account holder name so we can pay your commissions.' });
            return;
        }
        if (!selfie) {
            Swal.fire({ icon: 'warning', title: 'ID verification required', text: 'Please upload a selfie for identity verification.' });
            return;
        }
        setLoading(true);
        try {
            const selfieUrl = await uploadFile(selfie);

            const res = await fetch(`${API_URL}/referral/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    region,
                    tiktokLink: tiktokLink.trim() || undefined,
                    snapchatLink: snapchatLink.trim() || undefined,
                    paymentMethod: { network: momoNetwork, accountNumber: momoNumber, accountName: momoAccountName },
                    selfie: selfieUrl,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Application submitted!', text: data.message || 'Your account is under review — we will notify you once approved.' });
                setIsLogin(true);
            } else {
                Swal.fire({ icon: 'error', title: 'Registration Failed', text: data.message || 'Could not register' });
            }
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Something went wrong.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#EEF1F5] flex items-start justify-center p-4 sm:p-6 md:p-8 md:py-10 overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-xl flex flex-col md:flex-row my-auto overflow-hidden">
                
                {/* Brand Panel */}
                <aside className="relative md:w-[40%] shrink-0 bg-brand-lemon text-slate-900 flex flex-col px-8 md:px-10 justify-center py-10">
                    <div className="space-y-4 md:space-y-5">
                        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                            FLA Referrals
                        </h2>
                        <p className="text-sm text-slate-800/75 leading-relaxed">
                            Become an affiliate and earn 2% commission on every product you sell through your unique link.
                        </p>
                        <ul className="space-y-3.5 text-sm text-slate-800/85 leading-relaxed pt-2">
                            <li className="flex gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                <span>Get a personal storefront link.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                <span>Share products on your social media.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                <span>Track your earnings in real-time.</span>
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Form Panel */}
                <div className="flex-1 flex flex-col px-6 py-8 sm:px-10 md:px-12 md:py-10 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-8">
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <Image src="/logo.jpeg" alt="FLA Logo" width={36} height={36} className="h-9 w-9 rounded-lg shadow-sm" />
                            <span className="text-sm font-semibold tracking-tight text-slate-900">FLA Purchase</span>
                        </Link>
                    </div>

                    <div className="w-full max-w-md mx-auto">
                        <header className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                                {isLogin ? 'Referee Login' : 'Become a Referee'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isLogin ? 'Access your affiliate dashboard.' : 'Sign up to start earning.'}
                            </p>
                        </header>

                        {isLogin ? (
                            <form onSubmit={handleLogin} className="space-y-5">
                                <AuthInput label="Email" type="email" placeholder="you@email.com" required value={email} onChange={setEmail} icon={Mail} />
                                <AuthInput label="Password" type="password" placeholder="••••••••" required value={password} onChange={setPassword} icon={Lock} />
                                <button type="submit" disabled={loading} className="w-full h-12 mt-2 bg-brand-lemon text-slate-900 rounded-full font-semibold shadow-lg hover:bg-brand-lemon-hover flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? 'Signing in...' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <p className="text-center text-sm text-slate-500 mt-4">
                                    New here? <button type="button" onClick={() => setIsLogin(false)} className="font-semibold text-slate-900 hover:underline">Register</button>
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-5">
                                <AuthInput label="Full Name" type="text" placeholder="John Doe" required value={name} onChange={setName} icon={User} />
                                <AuthInput label="Email" type="email" placeholder="you@email.com" required value={email} onChange={setEmail} icon={Mail} />
                                <AuthInput label="Phone Number" type="tel" placeholder="055XXXXXXX" required value={phone} onChange={setPhone} icon={Phone} />
                                <AuthInput label="Password" type="password" placeholder="••••••••" required value={password} onChange={setPassword} icon={Lock} />

                                <div className="space-y-1.5">
                                    <label className="block text-[13px] font-medium text-slate-600">Region</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <select
                                            required
                                            value={region}
                                            onChange={(e) => setRegion(e.target.value)}
                                            className="w-full h-12 pl-10 pr-3.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 appearance-none focus:border-brand-lemon focus:ring-2 focus:ring-brand-lemon/30 outline-none"
                                        >
                                            <option value="">Select your region</option>
                                            {GHANA_REGIONS.map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <AuthInput label="TikTok Link (optional)" type="text" placeholder="https://tiktok.com/@yourhandle" value={tiktokLink} onChange={setTiktokLink} icon={Music2} />
                                <AuthInput label="Snapchat Link (optional)" type="text" placeholder="https://snapchat.com/add/yourhandle" value={snapchatLink} onChange={setSnapchatLink} icon={Ghost} />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[13px] font-medium text-slate-600">Network</label>
                                        <select
                                            value={momoNetwork}
                                            onChange={(e) => setMomoNetwork(e.target.value)}
                                            className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 appearance-none focus:border-brand-lemon focus:ring-2 focus:ring-brand-lemon/30 outline-none"
                                        >
                                            <option value="MTN">MTN Mobile Money</option>
                                            <option value="Vodafone">Vodafone Cash</option>
                                            <option value="AirtelTigo">AirtelTigo Money</option>
                                        </select>
                                    </div>
                                    <AuthInput label="MoMo Number" type="tel" placeholder="024XXXXXXX" required value={momoNumber} onChange={handleMomoNumberChange} icon={CreditCard} />
                                </div>
                                {isLookingUpMomo && (
                                    <p className="text-xs -mt-3 text-slate-400">Verifying account…</p>
                                )}
                                <AuthInput label="Account Holder Name" type="text" placeholder="Name on the MoMo/bank account" required value={momoAccountName} onChange={setMomoAccountName} icon={User} />

                                <DocUpload label="Selfie" file={selfie} onChange={setSelfie} />

                                <button type="submit" disabled={loading} className="w-full h-12 mt-2 bg-brand-lemon text-slate-900 rounded-full font-semibold shadow-lg hover:bg-brand-lemon-hover flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <p className="text-center text-sm text-slate-500 mt-4">
                                    Already have an account? <button type="button" onClick={() => setIsLogin(true)} className="font-semibold text-slate-900 hover:underline">Log In</button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function RefereeAuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div></div>}>
            <RefereeAuthContent />
        </Suspense>
    );
}
