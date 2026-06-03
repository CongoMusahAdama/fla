"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
    User, Mail, Lock, ChevronRight, ArrowLeft, Phone, MapPin,
    Store, Package, CreditCard, Upload, ArrowRight, MessageSquare, Check,
    Camera, Calendar, Users, Briefcase, FileText, ShieldCheck, Hash, Shield
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Suspense } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { TermsAcceptanceScreen } from '@/components/auth/TermsAcceptanceScreen';
import { FLA_TERMS_VERSION } from '@/lib/fla-terms';

// Memoized Input Component to prevent re-renders of the entire page on every keystroke
const AuthInput = React.memo(({ label, type, placeholder, value, onChange, required, icon: Icon }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-bold text-slate-700 ml-1">{label}</label>}
            <div className="relative group z-10">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors pointer-events-none">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    type={inputType}
                    placeholder={placeholder}
                    required={required}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full ${Icon ? 'pl-11' : 'px-4'} ${isPassword ? 'pr-20' : 'pr-4'} py-4 bg-white border-2 border-slate-100 rounded-2xl text-base md:text-sm transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none touch-manipulation appearance-none relative z-10 !pointer-events-auto`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors p-2 cursor-pointer z-20 touch-manipulation"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">{showPassword ? 'Hide' : 'Show'}</span>
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
        <form onSubmit={(e) => { e.preventDefault(); onLogin(identifier, password); }} className="space-y-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-4">
                <AuthInput
                    label="Email or Phone"
                    type="text"
                    placeholder="you@email.com"
                    required
                    value={identifier}
                    onChange={setIdentifier}
                    icon={User}
                />
                <div className="space-y-1">
                    <AuthInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={setPassword}
                        icon={Lock}
                    />
                    <div className="flex justify-end px-1">
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>
                </div>
            </div>
            <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-emerald-950 text-white rounded-full font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98]">
                    Sign In
                </button>
            </div>
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
                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-full font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                            Get Reset Code
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Login
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
                        <button type="submit" className="w-full py-4 bg-emerald-950 text-white rounded-full font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98]">
                            Update & Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center gap-2"
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
    const [paymentMethods, setPaymentMethods] = useState<any[]>([{
        type: 'momo',
        network: 'MTN',
        accountNumber: '',
        accountName: '',
        isLookingUp: false
    }]);

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

        if (!turnstileToken && role !== 'vendor') { // Vendors have Turnstile on Step 5
             // Skip check here for vendors as they check in step 5 submit or we can check step 5 here
        }

        onSignup({ 
            name, email, phone, location, region, password, confirmPassword, 
            shopName, productTypes, paymentMethods, turnstileToken,
            kyc: {
                ghanaCardFront, ghanaCardBack, ghanaCardNumber, selfie, digitalAddress, 
                dob, utilityBill, utilityType: utilityType === 'Other' ? customUtilityName : utilityType,
                businessRegistration, employeeCount, yearsOfExistence,
                bio: businessDescription
            }
        });
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, role === 'vendor' ? 6 : 2));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const totalSteps = role === 'vendor' ? 6 : 2;

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
                                        <option value="Greater Accra">Greater Accra</option>
                                        <option value="Ashanti">Ashanti</option>
                                        <option value="Western">Western</option>
                                        <option value="Western North">Western North</option>
                                        <option value="Central">Central</option>
                                        <option value="Eastern">Eastern</option>
                                        <option value="Volta">Volta</option>
                                        <option value="Oti">Oti</option>
                                        <option value="Northern">Northern</option>
                                        <option value="North East">North East</option>
                                        <option value="Savannah">Savannah</option>
                                        <option value="Upper East">Upper East</option>
                                        <option value="Upper West">Upper West</option>
                                        <option value="Bono">Bono</option>
                                        <option value="Bono East">Bono East</option>
                                        <option value="Ahafo">Ahafo</option>
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            {role === 'customer' && (
                                <AuthInput label="Location" type="text" placeholder="Eg. East Legon, Accra" required value={location} onChange={setLocation} icon={MapPin} />
                            )}
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
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Business Profile</h3>
                                <p className="text-sm text-slate-500">Tell us about your fashion studio and where you are located.</p>
                            </div>
                            <div className="space-y-4">
                                <AuthInput label="Shop Name" type="text" placeholder="Eg. FLA Boutique" required value={shopName} onChange={setShopName} icon={Store} />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Business Description</label>
                                    <textarea 
                                        placeholder="Tell us about your fashion business, specialties, and experience..."
                                        value={businessDescription}
                                        onChange={(e) => setBusinessDescription(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all min-h-[100px] resize-none"
                                    />
                                </div>
                                <AuthInput label="Digital Address" type="text" placeholder="GA-123-4567" required value={digitalAddress} onChange={setDigitalAddress} icon={MapPin} />
                                <AuthInput label="Date of Birth" type="date" required value={dob} onChange={setDob} icon={Calendar} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">No. of Employees</label>
                                        <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer">
                                            <option value="1-5">1 - 5</option>
                                            <option value="6-20">6 - 20</option>
                                            <option value="21-50">21 - 50</option>
                                            <option value="50+">50+</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Years of Existence</label>
                                        <select value={yearsOfExistence} onChange={(e) => setYearsOfExistence(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer">
                                            <option value="0-1">0 - 1 year</option>
                                            <option value="1-3">1 - 3 years</option>
                                            <option value="3-5">3 - 5 years</option>
                                            <option value="5+">5+ years</option>
                                        </select>
                                    </div>
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
                                <AuthInput label="Location" type="text" placeholder="City" required value={location} onChange={setLocation} icon={MapPin} />
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
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Identity Verification</h3>
                            <p className="text-sm text-slate-500">Provide your Ghana Card details for secure identity validation.</p>
                        </div>
                        <div className="space-y-4">
                            <AuthInput label="Ghana Card Number" type="text" placeholder="GHA-XXXXXXXXX-X" required value={ghanaCardNumber} onChange={setGhanaCardNumber} icon={Hash} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileInput label="Ghana Card Front" value={ghanaCardFront} onChange={setGhanaCardFront} icon={CreditCard} description="Upload front" />
                                <FileInput label="Ghana Card Back" value={ghanaCardBack} onChange={setGhanaCardBack} icon={CreditCard} description="Upload back" />
                                <div className="md:col-span-2">
                                    <FileInput label="Selfie Snapshot" value={selfie} onChange={setSelfie} icon={Camera} description="Face match verification photo" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Final Documents</h3>
                            <p className="text-sm text-slate-500">Submit your business registration and address proof.</p>
                        </div>

                        {/* Compliance Notice for GHS 100 Policy */}
                        <div className="p-5 bg-amber-50 border-2 border-amber-100 rounded-[24px] space-y-2 animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-2 text-amber-900">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Pricing Compliance Policy</span>
                            </div>
                            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                <strong className="font-bold">Attention:</strong> Vendors intending to sell products priced <strong className="font-bold underline">above GHS 100</strong> are required to upload a Business Registration Certificate. Accounts found selling high-value items without documentation are subject to immediate termination.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 ml-1">Utility Document Type</label>
                                <select 
                                    value={utilityType} 
                                    onChange={(e) => setUtilityType(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select Document Type</option>
                                    <option value="Electricity">Electricity Bill</option>
                                    <option value="Water">Water Bill</option>
                                    <option value="Gas">Gas Bill</option>
                                    <option value="Landline">Landline Phone Bill</option>
                                    <option value="Wages">Wages Slip</option>
                                    <option value="Other">Other (Please Specify)</option>
                                </select>
                            </div>
                            
                            {utilityType && (
                                <React.Fragment>
                                    {utilityType === 'Other' && (
                                        <AuthInput 
                                            label="Specify Document Name" 
                                            type="text" 
                                            placeholder="Eg. Tenancy Agreement" 
                                            required 
                                            value={customUtilityName} 
                                            onChange={setCustomUtilityName} 
                                            icon={FileText} 
                                        />
                                    )}

                                    <div className="animate-in fade-in zoom-in-95 duration-300">
                                        <FileInput 
                                            label={utilityType === 'Other' ? (customUtilityName || 'Utility Document') : `${utilityType} Bill`} 
                                            value={utilityBill} 
                                            onChange={setUtilityBill} 
                                            icon={FileText} 
                                            description={`Proof of ${utilityType.toLowerCase()} (less than 4 months)`} 
                                        />
                                    </div>
                                </React.Fragment>
                            )}
                            <FileInput label="Business Registration" value={businessRegistration} onChange={setBusinessRegistration} icon={Briefcase} description="Certificate of registration (Optional)" />
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
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-8">
            {/* Progress Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step}/{totalSteps}</span>
                    <div className="flex gap-1">
                        {Array.from({ length: totalSteps }).map((_, i) => {
                            const s = i + 1;
                            return (
                                <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${s === step ? 'bg-slate-900 w-4' : s < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            );
                        })}
                    </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[#D8F800] transition-all duration-500" 
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            {/* Form Content Card */}
            <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden">
                {/* Scrollable Content Area */}
                <div className="flex-1 p-6 md:p-12 overflow-y-auto max-h-[65vh] md:max-h-[60vh] scrollbar-hide">
                    {renderStepContent()}
                </div>

                {/* Sticky Navigation Buttons */}
                <div className="sticky bottom-0 bg-white/80 backdrop-blur-md px-6 md:px-12 py-6 md:py-8 border-t border-slate-50 flex gap-3 md:gap-4 z-10">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-6 md:px-10 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm tracking-wide hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Back
                        </button>
                    )}
                    {step < totalSteps ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="flex-1 py-4 bg-[#D8F800] text-slate-900 rounded-2xl font-black text-sm tracking-wide hover:bg-[#c6e400] transition-all shadow-xl shadow-[#D8F800]/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Complete Registration <Check className="w-5 h-5" />
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
            if (view !== 'login') setIsLogin(false);
        } else if (urlRole === 'customer') {
            setRole('customer');
            localStorage.setItem('last_intended_role', 'customer');
            if (view === 'register') setIsLogin(false);
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
                title: role === 'vendor' ? 'Registering your studio...' : 'Creating your account...',
                html: role === 'vendor'
                    ? '<div class="text-slate-600 text-sm">Uploading documents and sending verification SMS</div>'
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
            if (data.kyc && role === 'vendor') {
                kycUrls.ghanaCardFront = await uploadFile(data.kyc.ghanaCardFront);
                kycUrls.ghanaCardBack = await uploadFile(data.kyc.ghanaCardBack);
                kycUrls.selfie = await uploadFile(data.kyc.selfie);
                kycUrls.utilityBill = await uploadFile(data.kyc.utilityBill);
                kycUrls.businessRegistration = await uploadFile(data.kyc.businessRegistration);
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
        <main className="min-h-screen bg-[#E5E7EB]/30 flex items-start md:items-center justify-center p-0 md:p-8 pt-20 md:pt-24">
            <div className="bg-white w-full max-w-6xl min-h-screen md:min-h-[85vh] rounded-none md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
                <div className="w-full p-8 md:p-16 flex flex-col justify-between relative bg-white">
                    <Link href="/" className="inline-flex items-center gap-3 mb-8">
                        <Image 
                            src="/logo.jpeg" 
                            alt="FLA Logo" 
                            width={40} 
                            height={40} 
                            className="h-10 w-auto object-contain rounded-xl shadow-lg shadow-slate-200/50"
                        />
                    </Link>

                    <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center">
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
                                    <div className="w-16 h-16 bg-[#D8F800]/20 text-slate-900 rounded-[24px] flex items-center justify-center mb-6">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Verify Studio</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Code sent via SMS to {pendingVendorPhone ? maskPhone(pendingVendorPhone) : 'your phone'}. Enter the 4-digit code from the text message.
                                    </p>
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
                                        {isLogin ? 'WELCOME BACK' : (role === 'vendor' ? 'REGISTER YOUR SHOP' : 'REGISTER TO PURCHASE')}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium tracking-tight">
                                        {isLogin ? 'Sign in to access your fashion dashboard.' : 'Start your journey with FLA Purchase today.'}
                                    </p>
                                </header>

                                {!isLogin && !searchParams.get('role') && (
                                    <div className="flex p-1 bg-slate-50 rounded-full mb-6 border border-slate-100">
                                        <button onClick={() => { setRole('customer'); localStorage.setItem('last_intended_role', 'customer'); }} className={`flex-1 py-2 text-[10px] font-bold rounded-full transition-all ${role === 'customer' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Customer</button>
                                        <button onClick={() => { setRole('vendor'); localStorage.setItem('last_intended_role', 'vendor'); }} className={`flex-1 py-2 text-[10px] font-bold rounded-full transition-all ${role === 'vendor' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Vendor</button>
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

                                {!showForgotPassword && (
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsLogin(!isLogin)}
                                            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-full font-bold text-xs uppercase tracking-widest hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm"
                                        >
                                            {isLogin ? 'New here? Create Account' : 'Already have an account? Sign In'}
                                        </button>
                                    </div>
                                )}
                            </React.Fragment>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center md:justify-start gap-2 text-slate-300">
                        <Mail className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Help@FlaPurchase.com</span>
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
