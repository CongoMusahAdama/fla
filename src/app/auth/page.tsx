"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Mail, Lock, ChevronRight, ArrowLeft, Phone, MapPin,
    Store, Package, CreditCard, Upload, ArrowRight, MessageSquare, Check,
    Camera, Calendar, Users, Briefcase, FileText, ShieldCheck, Hash, Shield, ImagePlus
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Suspense } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { TermsAcceptanceScreen } from '@/components/auth/TermsAcceptanceScreen';
import { FLA_TERMS_VERSION } from '@/lib/fla-terms';
import { GHANA_REGIONS } from '@/lib/ghana-regions';

// Memoized Input Component to prevent re-renders of the entire page on every keystroke
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
                    className={`w-full ${Icon ? 'pl-10' : 'px-3.5'} ${isPassword ? 'pr-16' : 'pr-3.5'} h-12 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-lemon focus:ring-2 focus:ring-brand-lemon/30 outline-none touch-manipulation appearance-none relative z-10 !pointer-events-auto`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors p-1.5 cursor-pointer z-20 touch-manipulation"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        <span className="text-[10px] font-semibold uppercase tracking-wide">{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                )}
            </div>
        </div>
    );
});

AuthInput.displayName = 'AuthInput';

const FileInput = ({ label, onChange, value, icon: Icon, description }: any) => {
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onChange(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">{label}</label>
            <div className="relative group">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    accept="image/*,.pdf"
                />
                <label
                    htmlFor={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`w-full flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-100 border-dashed rounded-[24px] hover:border-slate-900 transition-all cursor-pointer group relative overflow-hidden min-h-[160px] ${preview ? 'border-none' : ''}`}
                >
                    {preview ? (
                        <div className="absolute inset-0 w-full h-full group">
                            <Image src={preview} alt="Preview" fill className="object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-white flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Change Image</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <React.Fragment>
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-all">
                                {Icon ? <Icon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-900">Click to upload {label}</p>
                                {description && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{description}</p>}
                            </div>
                        </React.Fragment>
                    )}
                </label>
            </div>
        </div>
    );
};

const LoginForm = ({ onLogin, onForgotPassword }: { onLogin: (id: string, pass: string) => void, onForgotPassword: () => void }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onLogin(identifier, password); }} className="space-y-5 animate-in fade-in duration-500">
            <AuthInput
                label="Email or Phone"
                type="text"
                placeholder="Example@mail.com"
                required
                value={identifier}
                onChange={setIdentifier}
                icon={Mail}
            />
            <div className="space-y-1.5">
                <AuthInput
                    label="Password"
                    type="password"
                    placeholder="8 characters"
                    required
                    value={password}
                    onChange={setPassword}
                    icon={Lock}
                />
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Forgot password?
                    </button>
                </div>
            </div>
            <button
                type="submit"
                className="w-full h-12 mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand-lemon text-slate-900 text-sm font-semibold tracking-wide hover:bg-brand-lemon-hover transition-all shadow-lg shadow-brand-lemon/25 active:scale-[0.98]"
            >
                Sign In now
                <ArrowRight className="w-4 h-4" />
            </button>
        </form>
    );
};

const ForgotPasswordForm = ({ onBack, onSubmit, onResetWithOTP }: { onBack: () => void, onSubmit: (email: string) => Promise<boolean>, onResetWithOTP: (email: string, code: string, pass: string) => void }) => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [newPassword, setNewPassword] = useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit(email);
        if (success) setStep('otp');
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 3) {
            const nextInput = document.getElementById(`reset-otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {step === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Reset Password</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Enter your email address and we'll send you a 4-digit code to reset your password.</p>
                    </div>

                    <AuthInput
                        label="Email Address"
                        type="email"
                        placeholder="you@email.com"
                        required
                        value={email}
                        onChange={setEmail}
                        icon={Mail}
                    />

                    <div className="space-y-3">
                        <button type="submit" className="w-full h-12 bg-brand-lemon text-slate-900 rounded-full font-semibold text-sm tracking-wide hover:bg-brand-lemon-hover transition-all shadow-lg shadow-brand-lemon/25 active:scale-[0.98] inline-flex items-center justify-center gap-2">
                            Get Reset Code
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="w-full py-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); onResetWithOTP(email, otp.join(''), newPassword); }} className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Enter Reset Code</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">A 4-digit code was sent to {email}</p>
                    </div>

                    <div className="flex gap-3 mb-4">
                        {otp.map((digit, i) => (
                            <input key={i} id={`reset-otp-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} className="w-full aspect-square bg-slate-50 border-none rounded-2xl text-2xl font-black text-center focus:ring-4 focus:ring-slate-900/10" required />
                        ))}
                    </div>

                    <AuthInput
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={newPassword}
                        onChange={setNewPassword}
                        icon={Lock}
                    />

                    <div className="space-y-3">
                        <button type="submit" className="w-full h-12 bg-brand-lemon text-slate-900 rounded-full font-semibold text-sm tracking-wide hover:bg-brand-lemon-hover transition-all shadow-lg shadow-brand-lemon/25 active:scale-[0.98] inline-flex items-center justify-center gap-2">
                            Update & Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="w-full py-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                            Change Email
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};



export const RegisterForm = ({ role, onSignup }: { role: UserRole, onSignup: (data: any) => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [region, setRegion] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // KYC Fields
    const [ghanaCardFront, setGhanaCardFront] = useState<File | null>(null);
    const [ghanaCardBack, setGhanaCardBack] = useState<File | null>(null);
    const [ghanaCardNumber, setGhanaCardNumber] = useState('');
    const [selfie, setSelfie] = useState<File | null>(null);
    const [digitalAddress, setDigitalAddress] = useState('');
    const [dob, setDob] = useState('');
    const [utilityBill, setUtilityBill] = useState<File | null>(null);
    const [utilityType, setUtilityType] = useState('');
    const [customUtilityName, setCustomUtilityName] = useState('');
    const [businessRegistration, setBusinessRegistration] = useState<File | null>(null);
    const [businessDescription, setBusinessDescription] = useState('');
    const [employeeCount, setEmployeeCount] = useState('1-5');
    const [yearsOfExistence, setYearsOfExistence] = useState('0-1');

    // Password Validation Rules (aligned with backend CreateUserDto)
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const allRulesPassed = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

    // Vendor Specific
    const [shopName, setShopName] = useState('');
    const [productTypes, setProductTypes] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([{
        type: 'momo',
        network: 'MTN',
        accountNumber: '',
        accountName: '',
        isLookingUp: false
    }]);

    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        };
    }, [logoPreview]);

    const onLogoSelected = (file: File | null) => {
        if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        if (!file) {
            setLogoFile(null);
            setLogoPreview(null);
            return;
        }
        if (!file.type.startsWith('image/')) {
            Swal.fire('Invalid file', 'Please upload an image (JPG, PNG, or WebP).', 'warning');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            Swal.fire('File too large', 'Logo must be under 8MB.', 'warning');
            return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleAccountNumberChange = async (index: number, value: string, network: string) => {
        const updated = [...paymentMethods];
        updated[index].accountNumber = value;
        
        // Reset name if number is too short
        if (value.length < 10) {
            updated[index].accountName = '';
            updated[index].isLookingUp = false;
            setPaymentMethods(updated);
            return;
        }

        updated[index].isLookingUp = true;
        setPaymentMethods([...updated]);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payments/lookup-name/${network}/${value}`);
            const data = await response.json();
            
            if (data.success && data.name) {
                updated[index].accountName = data.name;
            } else {
                updated[index].accountName = 'Name not found';
            }
        } catch (error) {
            console.error('Account lookup error:', error);
            updated[index].accountName = 'Verification service unavailable';
        } finally {
            updated[index].isLookingUp = false;
            setPaymentMethods([...updated]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (role === 'vendor' && !allRulesPassed) {
            Swal.fire({
                icon: 'warning',
                title: 'Weak Password',
                text: 'Please ensure your studio password meets all security requirements.',
                confirmButtonColor: '#0f172a'
            });
            return;
        }

        if (role === 'customer' && !turnstileToken) {
            Swal.fire({
                icon: 'warning',
                title: 'Security check',
                text: 'Please complete the verification checkbox before continuing.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }

        if (role === 'vendor' && !turnstileToken) {
            Swal.fire({
                icon: 'warning',
                title: 'Security check',
                text: 'Please complete the verification checkbox before creating your shop.',
                confirmButtonColor: '#F9CF5A',
            });
            return;
        }

        if (role === 'vendor' && !logoFile) {
            Swal.fire({
                icon: 'warning',
                title: 'Vendor logo required',
                text: 'Please upload your shop logo before completing registration.',
                confirmButtonColor: '#F9CF5A',
            });
            setStep(3);
            return;
        }

        onSignup({ 
            name, email, phone, location, region, password, confirmPassword, 
            shopName, productTypes, paymentMethods, turnstileToken,
            logoFile,
            kyc: {
                ghanaCardFront, ghanaCardBack, ghanaCardNumber, selfie, digitalAddress, 
                dob, utilityBill, utilityType: utilityType === 'Other' ? customUtilityName : utilityType,
                businessRegistration, employeeCount, yearsOfExistence,
                bio: businessDescription
            }
        });
    };

    const nextStep = () => {
        if (role === 'vendor' && step === 3 && !logoFile) {
            Swal.fire({
                icon: 'warning',
                title: 'Vendor logo required',
                text: 'Upload your shop logo to continue. It appears on your storefront and in admin lists.',
                confirmButtonColor: '#F9CF5A',
            });
            return;
        }
        if (role === 'vendor' && step === 3 && !shopName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Shop name required',
                text: 'Please enter your shop name.',
                confirmButtonColor: '#F9CF5A',
            });
            return;
        }
        setStep(prev => Math.min(prev + 1, role === 'vendor' ? 4 : 2));
    };
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const totalSteps = role === 'vendor' ? 4 : 2;

    const renderRegionSelect = () => (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">Region</label>
            <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-base md:text-sm transition-all focus:border-slate-900 outline-none appearance-none cursor-pointer"
                >
                    <option value="" disabled>Select your region</option>
                    {GHANA_REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Let's get started</h3>
                            <p className="text-sm text-slate-500">Provide your basic contact information to create your account.</p>
                        </div>
                        <div className="space-y-4">
                            <AuthInput label="Full Name" type="text" placeholder="Eg. Yasir Noori" required value={name} onChange={setName} icon={User} />
                            <AuthInput label="Email Address" type="email" placeholder="you@email.com" required value={email} onChange={setEmail} icon={Mail} />
                            <AuthInput label="Phone Number" type="tel" placeholder="024XXXXXXX" required value={phone} onChange={setPhone} icon={Phone} />
                            {renderRegionSelect()}
                            <AuthInput
                                label="City / Town"
                                type="text"
                                placeholder={role === 'vendor' ? 'Eg. Tamale' : 'Eg. East Legon'}
                                required
                                value={location}
                                onChange={setLocation}
                                icon={MapPin}
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Secure your account</h3>
                            <p className="text-sm text-slate-500">Create a strong password to protect your data.</p>
                        </div>
                        <div className="space-y-4">
                            <AuthInput label="Password" type="password" placeholder="••••••••" required value={password} onChange={setPassword} icon={Lock} />
                            <AuthInput label="Confirm Password" type="password" placeholder="••••••••" required value={confirmPassword} onChange={setConfirmPassword} icon={Lock} />
                            <div className="flex gap-2 pt-2">
                                <div className={`flex-1 h-1 rounded-full transition-all ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                <div className={`flex-1 h-1 rounded-full transition-all ${hasUppercase && hasLowercase ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                <div className={`flex-1 h-1 rounded-full transition-all ${hasNumber ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                <div className={`flex-1 h-1 rounded-full transition-all ${hasSpecialChar ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">8+ Chars • Upper & Lower • 1 Number • 1 Special</p>
                            
                            {role === 'customer' && (
                                <div className="pt-4 flex justify-center">
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                                        onSuccess={(token) => setTurnstileToken(token)}
                                        onExpire={() => setTurnstileToken(null)}
                                        onError={() => setTurnstileToken(null)}
                                        options={{ theme: 'light', size: 'normal' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 3:
                if (role === 'vendor') {
                    return (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">Business Profile</h3>
                                <p className="text-sm text-slate-500">Tell us about your shop. A logo is required for your storefront.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[13px] font-medium text-slate-600">
                                        Vendor logo <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        className="hidden"
                                        onChange={(e) => onLogoSelected(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        <div className="relative w-24 h-24 border border-slate-200 bg-slate-50 overflow-hidden shrink-0 rounded-xl">
                                            {logoPreview ? (
                                                <Image src={logoPreview} alt="Logo preview" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <ImagePlus className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2 w-full">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="h-10 px-4 rounded-full bg-brand-lemon text-slate-900 text-sm font-semibold hover:bg-brand-lemon-hover transition-colors"
                                                >
                                                    {logoFile ? 'Change logo' : 'Upload logo'}
                                                </button>
                                                {logoFile && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onLogoSelected(null);
                                                            if (logoInputRef.current) logoInputRef.current.value = '';
                                                        }}
                                                        className="h-10 px-4 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                JPG, PNG, or WebP · max 8MB. Shown on your storefront and in admin lists.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <AuthInput label="Shop Name" type="text" placeholder="Eg. FLA Boutique" required value={shopName} onChange={setShopName} icon={Store} />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Business Description <span className="font-medium text-slate-400">(optional)</span></label>
                                    <textarea 
                                        placeholder="Tell us about your fashion business..."
                                        value={businessDescription}
                                        onChange={(e) => setBusinessDescription(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all min-h-[88px] resize-none"
                                    />
                                </div>
                                <div className="rounded-xl bg-brand-lemon/20 border border-brand-lemon/40 px-4 py-3">
                                    <p className="text-xs text-slate-800 leading-relaxed">
                                        Ghana Card and other verification docs can be uploaded later in your dashboard — explore first, sell after approval.
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Final Step</h3>
                            <p className="text-sm text-slate-500">Provide your location and identity verification.</p>
                        </div>
                        <div className="space-y-4">
                            <AuthInput label="Ghana Card Number" type="text" placeholder="GHA-XXXXXXXXX-X" required value={ghanaCardNumber} onChange={setGhanaCardNumber} icon={Hash} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AuthInput label="Date of Birth" type="date" required value={dob} onChange={setDob} icon={Calendar} />
                                <AuthInput label="City / Town" type="text" placeholder="Eg. East Legon" required value={location} onChange={setLocation} icon={MapPin} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FileInput label="Ghana Card Front" value={ghanaCardFront} onChange={setGhanaCardFront} icon={CreditCard} description="Upload front" />
                                <FileInput label="Ghana Card Back" value={ghanaCardBack} onChange={setGhanaCardBack} icon={CreditCard} description="Upload back" />
                            </div>
                            <div className="pt-4 flex justify-center">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                                    onSuccess={(token) => setTurnstileToken(token)}
                                    onExpire={() => setTurnstileToken(null)}
                                    onError={() => setTurnstileToken(null)}
                                    options={{ theme: 'light', size: 'normal' }}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Payment Details</h3>
                            <p className="text-sm text-slate-500">Provide your primary MoMo account for receiving payments.</p>
                        </div>
                        <div className="space-y-6">
                            {paymentMethods.map((pm, index) => (
                                <div key={index} className="relative space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100 animate-in zoom-in-95 duration-300">
                                    {index > 0 && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const updated = paymentMethods.filter((_, i) => i !== index);
                                                setPaymentMethods(updated);
                                            }}
                                            className="absolute top-4 right-4 w-8 h-8 bg-white text-rose-500 rounded-full shadow-sm flex items-center justify-center hover:bg-rose-50 transition-all z-10"
                                        >
                                            <ArrowLeft className="w-4 h-4 rotate-45" /> {/* Using rotate as a delete icon if X not available or just use Trash if I have it */}
                                        </button>
                                    )}
                                    <div className="flex items-center gap-3 mb-2 px-1">
                                        <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-900">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                                            {index === 0 ? 'Primary Payout Method' : `Payout Method #${index + 1}`}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Payout Method Type</label>
                                            <select 
                                                value={pm.type || 'momo'} 
                                                onChange={(e) => {
                                                    const updated = [...paymentMethods];
                                                    (updated[index] as any).type = e.target.value;
                                                    updated[index].network = e.target.value === 'momo' ? 'MTN' : 'GCB';
                                                    setPaymentMethods(updated);
                                                }}
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="momo">Mobile Money</option>
                                                <option value="bank">Bank Account</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 ml-1">{pm.type === 'bank' ? 'Select Bank' : 'Network Provider'}</label>
                                            <select 
                                                value={pm.network} 
                                                onChange={(e) => {
                                                    const updated = [...paymentMethods];
                                                    updated[index].network = e.target.value;
                                                    setPaymentMethods(updated);
                                                }}
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                {pm.type === 'bank' ? (
                                                    <>
                                                        <option value="GCB">GCB Bank</option>
                                                        <option value="ECO">Ecobank Ghana</option>
                                                        <option value="ZEN">Zenith Bank</option>
                                                        <option value="ABS">Absa Bank</option>
                                                        <option value="FID">Fidelity Bank</option>
                                                        <option value="STA">Standard Chartered</option>
                                                        <option value="CAL">CalBank</option>
                                                        <option value="ACC">Access Bank</option>
                                                        <option value="GTB">GTBank</option>
                                                        <option value="UBA">UBA Ghana</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="MTN">MTN Mobile Money</option>
                                                        <option value="Vodafone">Vodafone Cash</option>
                                                        <option value="AirtelTigo">AirtelTigo Money</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <AuthInput 
                                            label={pm.type === 'bank' ? "Account Number" : "Mobile Number"} 
                                            type="tel" 
                                            placeholder={pm.type === 'bank' ? "XXXXXXXXXX" : "024XXXXXXX"} 
                                            required 
                                            value={pm.accountNumber} 
                                            onChange={(val: string) => handleAccountNumberChange(index, val, pm.network)} 
                                            icon={pm.type === 'bank' ? CreditCard : Phone} 
                                        />
                                    </div>

                                    <div className="relative">
                                        <AuthInput 
                                            label="Account Holder Name" 
                                            type="text" 
                                            placeholder="Eg. Yasir Noori" 
                                            required 
                                            value={pm.accountName} 
                                            onChange={(val: string) => {
                                                const updated = [...paymentMethods];
                                                updated[index].accountName = val;
                                                setPaymentMethods(updated);
                                            }} 
                                            icon={User}
                                        />
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                type="button"
                                onClick={() => setPaymentMethods([...paymentMethods, { type: 'momo', network: 'MTN', accountNumber: '', accountName: '', isLookingUp: false }])}
                                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4 rotate-45" /> Add Another Payout Method
                            </button>

                            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 space-y-2">
                                <p className="text-sm font-semibold text-slate-900">Almost there</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    After signup you can open your dashboard right away. Upload Ghana Card and verification docs anytime under Settings — selling unlocks after approval (usually 4–5 hours).
                                </p>
                            </div>

                            <div className="pt-2 flex justify-center">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                                    onSuccess={(token) => setTurnstileToken(token)}
                                    onExpire={() => setTurnstileToken(null)}
                                    onError={() => setTurnstileToken(null)}
                                    options={{ theme: 'light', size: 'normal' }}
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Progress Header */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Step {step}/{totalSteps}</span>
                    <div className="flex gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => {
                            const s = i + 1;
                            return (
                                <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'bg-brand-lemon w-5' : s < step ? 'bg-brand-blue w-1.5' : 'bg-slate-200 w-1.5'}`} />
                            );
                        })}
                    </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-lemon transition-all duration-500"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="p-4 sm:p-5">
                    {renderStepContent()}
                </div>

                <div className="shrink-0 bg-white px-4 sm:px-5 py-3.5 border-t border-slate-100 flex gap-3 z-10">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-5 h-11 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Back
                        </button>
                    )}
                    {step < totalSteps ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex-1 h-11 bg-brand-lemon text-slate-900 rounded-full text-sm font-semibold tracking-wide hover:bg-brand-lemon-hover transition-all shadow-md shadow-brand-lemon/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="flex-1 h-11 bg-brand-lemon text-slate-900 rounded-full text-sm font-semibold tracking-wide hover:bg-brand-lemon-hover transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Sign Up now <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

function AuthContent() {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<UserRole>('customer');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [pendingVendorEmail, setPendingVendorEmail] = useState('');
    const [pendingVendorPhone, setPendingVendorPhone] = useState('');
    const [pendingVendorPassword, setPendingVendorPassword] = useState('');
    const otpAutoSendDone = React.useRef(false);

    const [showTerms, setShowTerms] = useState(false);
    const [termsRole, setTermsRole] = useState<'customer' | 'vendor'>('customer');
    const [termsUserEmail, setTermsUserEmail] = useState('');
    const [termsPendingMessage, setTermsPendingMessage] = useState<string | undefined>();
    const [termsIsLoginFlow, setTermsIsLoginFlow] = useState(false);
    const [termsSubmitting, setTermsSubmitting] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const normalizePhoneForApi = (phone: string) => {
        let c = phone.replace(/\D/g, '');
        if (c.startsWith('233') && c.length >= 12) c = '0' + c.slice(3);
        else if (c.length === 9) c = '0' + c;
        return c;
    };

    const maskPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 4) return 'your phone';
        return `***${digits.slice(-4)}`;
    };

    const { login, signup, logout, acceptTerms } = useAuth();

    const needsTermsAcceptance = (userRole: UserRole, termsAcceptedAt?: string | Date | null) =>
        userRole !== 'admin' && !termsAcceptedAt;

    const openTermsGate = (userRole: UserRole, email: string, isLog: boolean, extraMessage?: string, termsAcceptedAt?: string | Date | null) => {
        if (!needsTermsAcceptance(userRole, termsAcceptedAt)) {
            showSuccess(isLog, userRole, extraMessage);
            return;
        }
        setShowOTP(false);
        setShowTerms(true);
        setTermsRole(userRole === 'vendor' ? 'vendor' : 'customer');
        setTermsUserEmail(email);
        setTermsIsLoginFlow(isLog);
        setTermsPendingMessage(extraMessage);
    };
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleForgotPassword = async (email: string): Promise<boolean> => {
        try {
            Swal.fire({
                title: 'SENDING...',
                html: '<div class="text-slate-600 text-sm">Requesting reset code</div>',
                didOpen: () => Swal.showLoading(),
                allowOutsideClick: false,
                customClass: { popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white', title: 'text-xl font-black text-slate-900 tracking-tighter uppercase' }
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/forgot-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'CODE SENT',
                    text: 'Please check your email for the 4-digit reset code.',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[32px]' }
                });
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'REQUEST FAILED',
                text: error.message || 'Something went wrong. Please try again later.',
                customClass: { popup: 'rounded-[32px]' }
            });
            return false;
        }
    };

    const handleResetWithOTP = async (email: string, code: string, pass: string) => {
        try {
            Swal.fire({
                title: 'RESETTING...',
                html: '<div class="text-slate-600 text-sm">Updating your security credentials</div>',
                didOpen: () => Swal.showLoading(),
                allowOutsideClick: false,
                customClass: { popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white' }
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/reset-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, password: pass })
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'SUCCESS',
                    text: 'Your password has been reset. You can now sign in.',
                    confirmButtonText: 'Great!',
                    customClass: { popup: 'rounded-[32px]' }
                });
                setShowForgotPassword(false);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'RESET FAILED',
                text: error.message || 'Verification failed. Please check your code.',
                customClass: { popup: 'rounded-[32px]' }
            });
        }
    };

    useEffect(() => {
        const urlRole = searchParams.get('role');
        const view = searchParams.get('view');

        if (urlRole === 'vendor') {
            setRole('vendor');
            localStorage.setItem('last_intended_role', 'vendor');
            if (view === 'register') setIsLogin(false);
            else if (view === 'login') setIsLogin(true);
        } else if (urlRole === 'customer') {
            setRole('customer');
            localStorage.setItem('last_intended_role', 'customer');
            if (view === 'register') setIsLogin(false);
            else if (view === 'login') setIsLogin(true);
        } else if (view === 'register') {
            setIsLogin(false);
        } else if (view === 'login') {
            setIsLogin(true);
        }
    }, [searchParams]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showOTP && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [showOTP, timer]);

    // Always trigger one SMS when the verify screen opens (registration SMS may have failed silently)
    useEffect(() => {
        if (!showOTP || !pendingVendorPhone || otpAutoSendDone.current) return;
        otpAutoSendDone.current = true;
        sendOtpToPhone(pendingVendorPhone, false).catch((err) => {
            console.error('Auto OTP send failed:', err);
            Swal.fire({
                icon: 'warning',
                title: 'SMS not sent',
                text: err.message || 'Tap RESEND to try again.',
                customClass: { popup: 'rounded-[32px]' },
            });
        });
    }, [showOTP, pendingVendorPhone]);

    const handleLogin = async (identifier: string, pass: string) => {
        try {
            const loggedInUser = await login(identifier, pass);
            openTermsGate(loggedInUser.role, loggedInUser.email, true, undefined, loggedInUser.termsAcceptedAt);
        } catch (error: any) {
            showError(error.message);
        }
    };

    const handleSignup = async (data: any) => {
        if (data.password !== data.confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Passwords do not match.' });
            return;
        }

        try {
            Swal.fire({
                title: role === 'vendor' ? 'Creating your shop…' : 'Creating your account...',
                html: role === 'vendor'
                    ? '<div class="text-slate-600 text-sm">Setting up your dashboard — verification docs can wait</div>'
                    : '<div class="text-slate-600 text-sm">Setting up your FLA account</div>',
                didOpen: () => Swal.showLoading(),
                allowOutsideClick: false,
                customClass: { popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white' }
            });

            const uploadFile = async (file: File | null) => {
                if (!file) return null;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/public`, {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) throw new Error('Document upload failed. Please try again.');
                const result = await res.json();
                return result.url;
            };

            let kycUrls: any = {};
            let profileImage: string | undefined;
            if (role === 'vendor') {
                if (!data.logoFile) {
                    throw new Error('Vendor logo is required. Please upload your shop logo.');
                }
                const uploadedLogo = await uploadFile(data.logoFile);
                if (!uploadedLogo) {
                    throw new Error('Logo upload failed. Please try again.');
                }
                profileImage = uploadedLogo;
                // KYC docs are optional at signup — vendors upload them later in the dashboard
                if (data.kyc?.ghanaCardFront) kycUrls.ghanaCardFront = await uploadFile(data.kyc.ghanaCardFront);
                if (data.kyc?.ghanaCardBack) kycUrls.ghanaCardBack = await uploadFile(data.kyc.ghanaCardBack);
                if (data.kyc?.selfie) kycUrls.selfie = await uploadFile(data.kyc.selfie);
                if (data.kyc?.utilityBill) kycUrls.utilityBill = await uploadFile(data.kyc.utilityBill);
                if (data.kyc?.businessRegistration) kycUrls.businessRegistration = await uploadFile(data.kyc.businessRegistration);
            } else if (data.kyc && role === 'customer') {
                if (data.kyc.ghanaCardFront) kycUrls.ghanaCardFront = await uploadFile(data.kyc.ghanaCardFront);
                if (data.kyc.ghanaCardBack) kycUrls.ghanaCardBack = await uploadFile(data.kyc.ghanaCardBack);
            }

            const kycData = {
                ghanaCardFront: kycUrls.ghanaCardFront,
                ghanaCardBack: kycUrls.ghanaCardBack,
                ...(role === 'vendor' ? {
                    shopName: data.shopName,
                    productTypes: data.productTypes,
                    paymentMethods: data.paymentMethods,
                    momoNumber: data.paymentMethods?.[0]?.accountNumber,
                    accountName: data.paymentMethods?.[0]?.accountName,
                    ghanaCardNumber: data.kyc.ghanaCardNumber,
                    selfie: kycUrls.selfie,
                    utilityBill: kycUrls.utilityBill,
                    businessRegistration: kycUrls.businessRegistration,
                    digitalAddress: data.kyc.digitalAddress,
                    dob: data.kyc.dob,
                    utilityType: data.kyc.utilityType,
                    employeeCount: data.kyc.employeeCount,
                    yearsOfExistence: data.kyc.yearsOfExistence,
                    bio: data.kyc.bio,
                    profileImage,
                } : {
                    ghanaCardNumber: data.kyc.ghanaCardNumber,
                    dob: data.kyc.dob,
                })
            };

            const result = await signup(
                data.name, data.email, data.phone, data.location, data.region, data.password, 
                role, kycData, data.turnstileToken
            );

            if (result.requiresEmailVerification) {
                await Swal.close();
                setPendingVendorEmail(data.email.toLowerCase().trim());
                setPendingVendorPhone(normalizePhoneForApi(data.phone || '') || data.phone || '');
                setPendingVendorPassword(data.password);
                otpAutoSendDone.current = false;
                setShowOTP(true);
                setTimer(60);
                setOtp(['', '', '', '']);
                const isResume = result.message?.includes('not verified');
                const phoneHint = data.phone ? maskPhone(data.phone) : 'your phone';
                Swal.fire({
                    icon: 'success',
                    iconColor: '#059669',
                    title: isResume ? 'VERIFY YOUR STUDIO' : 'CHECK YOUR PHONE',
                    html: `
                        <p class="text-slate-600 text-sm mb-3">${result.message || `A 4-digit verification code has been sent via SMS to ${phoneHint}.`}</p>
                        ${!result.message?.includes('could not send') ? '<p class="text-xs text-slate-500">Your studio account is not active until you enter this code. No confirmation SMS is sent until verification is complete.</p>' : ''}
                    `,
                    confirmButtonText: 'ENTER CODE',
                    customClass: { popup: 'rounded-[32px]' }
                });
                return;
            }

            await Swal.close();
            if (result.loginFailed) {
                Swal.fire({
                    icon: 'success',
                    iconColor: '#059669',
                    title: 'ACCOUNT CREATED',
                    text: result.message,
                    confirmButtonText: 'SIGN IN',
                    customClass: { popup: 'rounded-[32px]' },
                }).then(() => setIsLogin(true));
                return;
            }
            openTermsGate(result.user.role, result.user.email, false, result.message, result.user.termsAcceptedAt);
        } catch (error: any) {
            await Swal.close();
            const msg = error.message || '';
            if (
                role === 'vendor' &&
                (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('sign in'))
            ) {
                Swal.fire({
                    icon: 'info',
                    title: 'ACCOUNT EXISTS',
                    text: msg,
                    confirmButtonText: 'SIGN IN',
                    showCancelButton: true,
                    cancelButtonText: 'TRY DIFFERENT EMAIL',
                    customClass: { popup: 'rounded-[32px]' },
                }).then((r) => {
                    if (r.isConfirmed) setIsLogin(true);
                });
                return;
            }
            showError(msg);
        }
    };

    const showSuccess = (isLog: boolean, userRole: UserRole, extraMessage?: string) => {
        const defaultText = isLog
            ? 'Your fashion journey continues...'
            : userRole === 'customer'
                ? 'Welcome to FLA Purchase! A confirmation SMS has been sent to your phone.'
                : 'Welcome to the world of FLA Purchase.';
        Swal.fire({
            icon: 'success',
            iconColor: '#059669',
            title: isLog ? 'WELCOME BACK!' : 'ACCOUNT CREATED',
            text: extraMessage || defaultText,
            timer: 2500,
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                htmlContainer: 'text-slate-500 font-medium text-sm',
            }
        });
        setTimeout(() => {
            const redirectTo = searchParams.get('redirect');
            if (redirectTo) {
                // If the redirect starts with 'checkout', we might want to trigger something specifically, 
                // but usually just going back to the page works if the state is preserved (like the cart).
                router.push(redirectTo);
            } else if (userRole === 'admin') {
                router.push('/admin');
            } else if (userRole === 'vendor') {
                router.push('/vendor');
            } else {
                router.push('/dashboard');
            }
        }, 2000);
    };

    const showError = (msg?: string) => {
        Swal.fire({
            icon: 'error',
            iconColor: '#E11D48',
            title: 'AUTH FAILED',
            text: msg || 'Please check your credentials and try again.',
            confirmButtonText: 'TRY AGAIN',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2',
                htmlContainer: 'text-slate-500 font-medium text-sm mb-6',
                confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
            }
        });
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

    const sendOtpToPhone = async (phone: string, showToast: boolean) => {
        const normalized = normalizePhoneForApi(phone);
        if (!normalized) {
            throw new Error('Invalid phone number. Use Ghana format e.g. 0203154307');
        }

        const response = await fetch(`${apiBase}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: normalized }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to send verification SMS');
        }

        setTimer(60);
        if (showToast) {
            Swal.fire({
                icon: 'success',
                iconColor: '#059669',
                title: 'CODE SENT',
                text: `A verification code has been sent via SMS to ${maskPhone(normalized)}.`,
                timer: 2500,
                showConfirmButton: false,
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl p-8 bg-white',
                    title: 'text-xl font-black text-slate-900 tracking-tighter uppercase',
                },
            });
        }
    };

    const handleResendOtp = async () => {
        try {
            if (!pendingVendorPhone) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Phone number not found. Please try registering again.' });
                return;
            }
            await sendOtpToPhone(pendingVendorPhone, true);
        } catch (error: any) {
            console.error('Resend OTP error:', error);
            Swal.fire({
                icon: 'error',
                title: 'SMS not sent',
                text: error.message || 'Could not send verification SMS. Check mNotify credits and try again.',
                customClass: { popup: 'rounded-[32px]' },
            });
        }
    };

    const handleVerifyOtp = async () => {
        const code = otp.join('');
        if (code.length < 4) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Code',
                text: 'Please enter all 4 digits.',
                customClass: { popup: 'rounded-[32px]' }
            });
            return;
        }

        if (!pendingVendorPhone) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Phone number not found. Please try registering again.' });
            return;
        }

        if (!pendingVendorEmail) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Session expired. Please try registering again.' });
            return;
        }

        Swal.fire({
            title: 'VERIFYING...',
            html: '<div class="text-slate-600 text-sm">Please wait while we verify your code</div>',
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                title: 'text-xl font-black text-slate-900 tracking-tighter uppercase'
            }
        });

        try {
            const response = await fetch(`${apiBase}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: normalizePhoneForApi(pendingVendorPhone), code }),
            });

            const result = await response.json();

            if (result.success) {
                const loggedInUser = await login(pendingVendorEmail, pendingVendorPassword);
                await Swal.close();
                openTermsGate(
                    'vendor',
                    loggedInUser.email,
                    false,
                    'Your phone is verified. Accept the terms below to open your vendor hub.',
                    loggedInUser.termsAcceptedAt,
                );
            } else {
                Swal.fire({
                    icon: 'error',
                    iconColor: '#EF4444',
                    title: 'INVALID CODE',
                    text: result.message || 'The code you entered is incorrect or has expired.',
                    confirmButtonText: 'Try Again',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'rounded-[32px] border-none shadow-2xl p-10 bg-white',
                        title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4',
                        confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all'
                    }
                });
                // Clear OTP inputs
                setOtp(['', '', '', '']);
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: 'Could not verify OTP. Please try again.',
                customClass: { popup: 'rounded-[32px]' }
            });
        }
    };

    const handleTermsAgree = async () => {
        setTermsSubmitting(true);
        try {
            await acceptTerms(FLA_TERMS_VERSION);
            setShowTerms(false);
            showSuccess(termsIsLoginFlow, termsRole, termsPendingMessage);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Could not continue',
                text: error.message || 'Please try again.',
                customClass: { popup: 'rounded-[32px]' },
            });
        } finally {
            setTermsSubmitting(false);
        }
    };

    const handleTermsDisagree = async () => {
        await logout();
        setShowTerms(false);
        setIsLogin(true);
        Swal.fire({
            icon: 'info',
            title: 'Terms required',
            text: 'You must accept the Terms and Conditions to use FLA Purchase. You can register or sign in again when ready.',
            confirmButtonText: 'OK',
            customClass: { popup: 'rounded-[32px]' },
        });
    };

    return (
        <main className="relative min-h-screen bg-[#EEF1F5] flex items-start justify-center p-4 sm:p-6 md:p-8 md:py-10 overflow-y-auto no-scrollbar">
            <div className="relative w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-slate-900/8 overflow-hidden flex flex-col md:flex-row my-auto">
                {/* Brand panel */}
                <aside className={`relative md:w-[40%] shrink-0 bg-brand-lemon text-slate-900 flex flex-col px-8 md:px-10 overflow-y-auto no-scrollbar ${
                    !isLogin
                        ? 'justify-start pt-5 pb-8 md:pt-6 md:pb-10'
                        : 'justify-center py-8 md:py-12'
                }`}>
                    <div className="relative z-10 max-w-sm w-full mx-auto space-y-4 md:space-y-5">
                        {!isLogin && (
                            <div className="relative mx-auto mb-6 md:mb-8 mt-0 flex justify-center">
                                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden ring-[3px] ring-white/55 shadow-[0_10px_30px_rgba(15,39,68,0.12)]">
                                    <Image
                                        src="/hero/signup-shopper.webp"
                                        alt={role === 'vendor' ? 'Sell on FLA Purchase' : 'Shop on your phone with FLA'}
                                        fill
                                        sizes="208px"
                                        className="object-cover object-[center_18%] select-none"
                                        priority={false}
                                    />
                                </div>
                            </div>
                        )}
                        {isLogin ? (
                            <>
                                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                                    New to FLA?
                                </h2>
                                <p className="text-sm text-slate-800/75 leading-relaxed">
                                    Create a customer or vendor account and start shopping — or sell — on FLA Purchase.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(false);
                                        setShowForgotPassword(false);
                                    }}
                                    className="inline-flex items-center justify-center h-11 px-8 rounded-full border border-slate-900/40 text-sm font-semibold text-slate-900 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors"
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : role === 'vendor' ? (
                            <div className="space-y-3 md:space-y-4 pt-1 md:pt-2">
                                <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-brand-blue">
                                    Vendor guidelines
                                </p>
                                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                                    Before you register
                                </h2>
                                <p className="text-sm text-slate-800/70 leading-relaxed">
                                    Quick notes so your shop application moves smoothly.
                                </p>
                                <ul className="space-y-3.5 text-sm text-slate-800/85 leading-relaxed">
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>Start with basics: <strong className="font-medium text-slate-900">logo</strong>, shop name, and MoMo — you get dashboard access right away.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>Forgot documents? Upload <strong className="font-medium text-slate-900">Ghana Card + selfie</strong> later in Settings when ready.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>Explore your studio first — <strong className="font-medium text-slate-900">selling unlocks</strong> after KYC approval (usually 4–5 hours).</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>First month is <strong className="font-medium text-slate-900">GHS 10</strong>, then <strong className="font-medium text-slate-900">GHS 50/month</strong> (paid to FLA via MoMo).</span>
                                    </li>
                                </ul>
                                <p className="pt-1 text-sm text-slate-800/60">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setShowForgotPassword(false);
                                        }}
                                        className="font-semibold text-brand-blue hover:underline"
                                    >
                                        Log in
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 md:space-y-4 pt-1 md:pt-2">
                                <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-brand-blue">
                                    For shoppers
                                </p>
                                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                                    Shop with confidence
                                </h2>
                                <p className="text-sm text-slate-800/70 leading-relaxed">
                                    Create your account once — then order from verified vendors across Ghana.
                                </p>
                                <ul className="space-y-2.5 pt-0.5 text-sm text-slate-800/85 leading-relaxed">
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>Use a real phone number so order updates reach you.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>Browse the marketplace or a vendor’s storefront link.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                                        <span>Look for documented vendor badges for extra trust.</span>
                                    </li>
                                </ul>
                                <p className="pt-1 text-sm text-slate-800/60">
                                    Already signed up?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setShowForgotPassword(false);
                                        }}
                                        className="font-semibold text-brand-blue hover:underline"
                                    >
                                        Log in
                                    </button>
                                </p>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* Form panel */}
                <div className="flex-1 flex flex-col px-6 py-8 sm:px-10 md:px-12 md:py-10 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <Image
                                src="/logo.jpeg"
                                alt="FLA Logo"
                                width={36}
                                height={36}
                                className="h-9 w-9 object-contain rounded-lg shadow-sm"
                            />
                            <span className="text-sm font-semibold tracking-tight text-slate-900 group-hover:text-brand-lemon-hover transition-colors">
                                FLA Purchase
                            </span>
                        </Link>
                        <a
                            href="mailto:support@flamingo-store1.com"
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Help
                        </a>
                    </div>

                    <div className="w-full max-w-md mx-auto flex flex-col">
                        {showTerms ? (
                            <TermsAcceptanceScreen
                                role={termsRole}
                                userEmail={termsUserEmail}
                                onAgree={handleTermsAgree}
                                onDisagree={handleTermsDisagree}
                                isSubmitting={termsSubmitting}
                            />
                        ) : showOTP ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8">
                                    <div className="w-14 h-14 bg-brand-lemon/40 text-slate-900 rounded-2xl flex items-center justify-center mb-5">
                                        <MessageSquare className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Verify Studio</h2>
                                    <p className="text-sm text-slate-500">
                                        Code sent via SMS to {pendingVendorPhone ? maskPhone(pendingVendorPhone) : 'your phone'}. Enter the 4-digit code.
                                    </p>
                                </div>
                                <div className="flex gap-3 mb-8">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onPaste={handlePaste}
                                            className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-xl text-2xl font-bold text-center focus:ring-2 focus:ring-brand-lemon/30 focus:border-brand-lemon outline-none"
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={otp.join('').length < 4}
                                    className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand-lemon text-slate-900 rounded-full text-sm font-semibold tracking-wide mb-5 hover:bg-brand-lemon-hover transition-all shadow-lg shadow-brand-lemon/25 disabled:opacity-50"
                                >
                                    Verify & Launch Hub
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <div className="text-center">
                                    {timer > 0 ? (
                                        <p className="text-xs font-medium text-slate-400">Resend code in {timer}s</p>
                                    ) : (
                                        <button onClick={handleResendOtp} className="text-xs font-semibold text-slate-900 hover:underline">
                                            Didn&apos;t get the code? Resend
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <React.Fragment>
                                <header className="mb-6">
                                    <h2 className="text-3xl sm:text-[2rem] font-bold text-slate-900 tracking-tight mb-1.5">
                                        {showForgotPassword
                                            ? 'Reset password'
                                            : isLogin
                                                ? 'Welcome back'
                                                : role === 'vendor'
                                                    ? 'Create vendor account'
                                                    : 'Create account'}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {showForgotPassword
                                            ? 'We will send a code to reset your password.'
                                            : isLogin
                                                ? 'Sign in to access your FLA dashboard.'
                                                : 'Start your journey with FLA Purchase today.'}
                                    </p>
                                </header>

                                {!isLogin && !showForgotPassword && !searchParams.get('role') && (
                                    <div className="flex p-1 bg-slate-100 rounded-full mb-6">
                                        <button
                                            type="button"
                                            onClick={() => { setRole('customer'); localStorage.setItem('last_intended_role', 'customer'); }}
                                            className={`flex-1 py-2.5 text-xs font-semibold rounded-full transition-all ${role === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Customer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setRole('vendor'); localStorage.setItem('last_intended_role', 'vendor'); }}
                                            className={`flex-1 py-2.5 text-xs font-semibold rounded-full transition-all ${role === 'vendor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Vendor
                                        </button>
                                    </div>
                                )}

                                {showForgotPassword ? (
                                    <ForgotPasswordForm
                                        onBack={() => setShowForgotPassword(false)}
                                        onSubmit={handleForgotPassword}
                                        onResetWithOTP={handleResetWithOTP}
                                    />
                                ) : isLogin ? (
                                    <LoginForm
                                        onLogin={handleLogin}
                                        onForgotPassword={() => setShowForgotPassword(true)}
                                    />
                                ) : (
                                    <RegisterForm role={role} onSignup={handleSignup} />
                                )}

                                {/* Mobile switch — desktop uses the brand panel */}
                                {!showForgotPassword && (
                                    <p className="md:hidden mt-6 text-center text-sm text-slate-500">
                                        {isLogin ? (
                                            <>
                                                New here?{' '}
                                                <button type="button" onClick={() => setIsLogin(false)} className="font-semibold text-slate-900 hover:underline">
                                                    Create account
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                Already signed up?{' '}
                                                <button type="button" onClick={() => setIsLogin(true)} className="font-semibold text-slate-900 hover:underline">
                                                    Log in
                                                </button>
                                            </>
                                        )}
                                    </p>
                                )}
                            </React.Fragment>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#EEF1F5] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-brand-lemon border-t-transparent animate-spin" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
