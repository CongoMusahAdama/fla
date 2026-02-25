"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const AuthInput = React.memo(({ label, type, placeholder, value, onChange, required, icon: Icon }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-bold text-slate-700 ml-1">{label}</label>}
            <div className="relative group">
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
                    className={`w-full ${Icon ? 'pl-11' : 'px-4'} ${isPassword ? 'pr-20' : 'pr-4'} py-4 bg-white border-2 border-slate-100 rounded-2xl text-base md:text-sm transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors p-2"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                )}
            </div>
        </div>
    );
});
AuthInput.displayName = 'AuthInput';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Mismatch',
                text: 'Passwords do not match.',
                customClass: { popup: 'rounded-[32px]' }
            });
            return;
        }

        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Request',
                text: 'Reset token is missing.',
                customClass: { popup: 'rounded-[32px]' }
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'PASSWORD RESET',
                    text: 'Your password has been updated successfully. You can now log in.',
                    customClass: { popup: 'rounded-[32px]' }
                });
                router.push('/auth?type=login');
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'RESET FAILED',
                text: error.message || 'The reset link might be invalid or expired.',
                customClass: { popup: 'rounded-[32px]' }
            });
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Invalid Link</h2>
                    <p className="text-slate-500 font-medium">This password reset link is invalid or has expired.</p>
                    <Link href="/auth" className="inline-flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest hover:gap-3 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back to Auth
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#E5E7EB]/30 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg p-12 md:p-16 rounded-[48px] shadow-2xl border border-gray-100 space-y-10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-900 text-brand-lemon rounded-[24px] flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">New Password</h2>
                    <p className="text-sm text-slate-500 font-medium">Create a new secure password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <AuthInput
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={setPassword}
                        icon={Lock}
                    />
                    <AuthInput
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        icon={Lock}
                    />

                    <div className="pt-4 space-y-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                        <Link
                            href="/auth"
                            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-full font-bold text-xs uppercase tracking-widest text-center block hover:border-slate-300 hover:text-slate-900 transition-all"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
