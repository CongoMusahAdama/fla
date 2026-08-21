"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { GHANA_REGIONS } from '@/lib/ghana-regions';

type Props = {
  token: string | null;
  onCreated: () => void;
  onClose: () => void;
};

const STEPS = [
  { id: 1, title: 'Basic info' },
  { id: 2, title: 'Location & payout' },
  { id: 3, title: 'Plan & review' },
] as const;

const fieldClass =
  'w-full h-11 px-3.5 rounded-none bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors';

const labelClass = 'block text-[13px] font-medium text-slate-700 mb-1.5';

export default function AdminOnboardVendorForm({ token, onCreated, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [region, setRegion] = useState<string>(GHANA_REGIONS[0] || 'Greater Accra');
  const [location, setLocation] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [momoNumber, setMomoNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [planLabel, setPlanLabel] = useState('Sales access');
  const [planPrice, setPlanPrice] = useState('Free');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    temporaryPassword?: string;
    loginUrl?: string;
    agreementPath?: string;
    user?: { id?: string; _id?: string; shopName?: string };
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.logo;
      return next;
    });
  };

  const validateStep = (current: number) => {
    const errors: Record<string, string> = {};
    if (current === 1) {
      if (!name.trim()) errors.name = 'Contact name is required';
      if (!shopName.trim()) errors.shopName = 'Shop name is required';
      if (!email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email';
      if (!phone.trim()) errors.phone = 'Phone is required';
      if (!logoFile) errors.logo = 'Vendor logo is required';
    }
    if (current === 2) {
      if (!momoNumber.trim()) errors.momoNumber = 'MoMo number is required';
      if (!accountName.trim()) errors.accountName = 'Account name is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) throw new Error('Vendor logo is required');
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const formData = new FormData();
    formData.append('file', logoFile);
    const res = await fetch(`${api}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Logo upload failed');
    }
    const data = await res.json();
    if (!data?.url) throw new Error('Logo upload returned no URL');
    return data.url as string;
  };

  const handleSubmit = async () => {
    const step1Errors: Record<string, string> = {};
    if (!name.trim()) step1Errors.name = 'Contact name is required';
    if (!shopName.trim()) step1Errors.shopName = 'Shop name is required';
    if (!email.trim()) step1Errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) step1Errors.email = 'Enter a valid email';
    if (!phone.trim()) step1Errors.phone = 'Phone is required';
    if (!logoFile) step1Errors.logo = 'Vendor logo is required';
    if (Object.keys(step1Errors).length) {
      setFieldErrors(step1Errors);
      setStep(1);
      return;
    }

    const step2Errors: Record<string, string> = {};
    if (!momoNumber.trim()) step2Errors.momoNumber = 'MoMo number is required';
    if (!accountName.trim()) step2Errors.accountName = 'Account name is required';
    if (Object.keys(step2Errors).length) {
      setFieldErrors(step2Errors);
      setStep(2);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const profileImage = await uploadLogo();
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${api}/auth/admin/create-vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          phone,
          shopName,
          region,
          location,
          accountName,
          momoNumber,
          profileImage,
          paymentMethods: [
            {
              network: momoNetwork,
              accountNumber: momoNumber,
              accountName: accountName || name,
            },
          ],
          subscriptionPlan: 'lifetime',
          subscriptionLabel: planLabel,
          subscriptionPriceText: planPrice,
          subscriptionPriceGhs: 100,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create vendor');
      }

      const data = await res.json();
      setResult(data);
      onCreated();
      Swal.fire({
        icon: 'success',
        title: 'Vendor onboarded',
        text: 'Credentials sent. Open the agreement letter to preview and download the PDF — it is not emailed automatically.',
        timer: 3200,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Failed', err.message || 'Could not onboard vendor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const smsPreview = result
    ? `Login: ${result.loginUrl}\nEmail: ${email}\nTemp password: ${result.temporaryPassword}`
    : '';

  const copySms = async () => {
    if (!smsPreview) return;
    await navigator.clipboard.writeText(smsPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) {
    const vendorId = result.user?.id || result.user?._id;
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 px-5 py-6 sm:px-8 overflow-y-auto">
          <div className="border border-emerald-200 bg-emerald-50/60 p-5 mb-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">Vendor created</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {result.user?.shopName || shopName} can sign in and must change the temporary password.
              Products stay locked until KYC is approved.
            </p>
          </div>

          <div className="border border-slate-200 divide-y divide-slate-200 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 px-4 py-3">
              <span className="text-slate-500">Login URL</span>
              <span className="font-medium text-slate-900 break-all sm:text-right">{result.loginUrl}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 px-4 py-3">
              <span className="text-slate-500">Temp password</span>
              <span className="font-mono font-medium text-slate-900">{result.temporaryPassword}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 px-4 py-3">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900 break-all sm:text-right">{email}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-8 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={copySms}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-blue text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy credentials'}
          </button>
          {vendorId && (
            <a
              href={`/admin/vendors/${vendorId}/agreement`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-brand-lemon text-slate-900 text-sm font-medium hover:bg-brand-lemon-hover transition-colors"
            >
              <FileText className="w-4 h-4" />
              Preview & download agreement
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors sm:ml-auto"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-5 pt-5 pb-4 sm:px-8 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          {STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id);
                }}
                className={`flex items-center gap-2 min-w-0 ${s.id < step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`w-7 h-7 shrink-0 flex items-center justify-center text-xs font-semibold border ${
                    active
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : done
                        ? 'bg-brand-lemon text-slate-900 border-brand-lemon'
                        : 'bg-white text-slate-400 border-slate-300'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : s.id}
                </span>
                <span
                  className={`hidden sm:block text-[13px] font-medium truncate ${
                    active ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full bg-brand-blue transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="sm:hidden mt-2.5 text-[13px] font-medium text-slate-600">
          Step {step} of {STEPS.length}: {STEPS[step - 1].title}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 min-h-0 bg-white">
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-l-2 border-brand-blue pl-3">
              <h4 className="text-base font-semibold text-slate-900">Basic information</h4>
              <p className="text-sm text-slate-500 mt-0.5">
                Vendor logo is required and shown on the vendors list and storefront.
              </p>
            </div>

            <div>
              <label className={labelClass}>
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
                <div className="relative w-24 h-24 border border-slate-300 bg-slate-50 overflow-hidden shrink-0">
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
                      className="inline-flex items-center gap-2 h-11 px-4 border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-brand-blue hover:text-brand-blue transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {logoFile ? 'Change logo' : 'Upload logo'}
                    </button>
                    {logoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          onLogoSelected(null);
                          if (logoInputRef.current) logoInputRef.current.value = '';
                        }}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Square JPG/PNG/WebP works best. Max 8MB.</p>
                  {fieldErrors.logo && <p className="text-xs text-rose-600">{fieldErrors.logo}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="onboard-name">Contact name</label>
                <input id="onboard-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Full name" autoComplete="name" />
                {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-shop">Shop name</label>
                <input id="onboard-shop" value={shopName} onChange={(e) => setShopName(e.target.value)} className={fieldClass} placeholder="Studio or brand name" />
                {fieldErrors.shopName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.shopName}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-email">Email</label>
                <input id="onboard-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="vendor@email.com" autoComplete="email" />
                {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-phone">Phone (SMS)</label>
                <input id="onboard-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} placeholder="024XXXXXXX" inputMode="tel" autoComplete="tel" />
                {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="border-l-2 border-brand-blue pl-3">
              <h4 className="text-base font-semibold text-slate-900">Location & payout</h4>
              <p className="text-sm text-slate-500 mt-0.5">Used for logistics and Mobile Money settlements.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="onboard-region">Region</label>
                <select id="onboard-region" value={region} onChange={(e) => setRegion(e.target.value)} className={fieldClass}>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-location">City / location</label>
                <input id="onboard-location" value={location} onChange={(e) => setLocation(e.target.value)} className={fieldClass} placeholder="e.g. Accra, Madina" />
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-network">MoMo network</label>
                <select id="onboard-network" value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} className={fieldClass}>
                  <option value="MTN">MTN</option>
                  <option value="Vodafone">Vodafone</option>
                  <option value="AirtelTigo">AirtelTigo</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-momo">MoMo number</label>
                <input id="onboard-momo" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} className={fieldClass} placeholder="024XXXXXXX" inputMode="tel" />
                {fieldErrors.momoNumber && <p className="mt-1 text-xs text-rose-600">{fieldErrors.momoNumber}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="onboard-account">Account name</label>
                <input id="onboard-account" value={accountName} onChange={(e) => setAccountName(e.target.value)} className={fieldClass} placeholder="Name on MoMo wallet" />
                {fieldErrors.accountName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.accountName}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="border-l-2 border-brand-blue pl-3">
              <h4 className="text-base font-semibold text-slate-900">Subscription plan</h4>
              <p className="text-sm text-slate-500 mt-0.5">Shown on the vendor agreement letter.</p>
            </div>

            <div className="p-4 border border-brand-blue bg-brand-blue/[0.04]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900">Lifetime Plan</span>
                <Check className="w-4 h-4 text-brand-blue" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Free, permanent sales access — no payment, no renewals.</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">Free</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="onboard-plan-label">Plan label</label>
                <input id="onboard-plan-label" value={planLabel} onChange={(e) => setPlanLabel(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="onboard-plan-price">Price text</label>
                <input id="onboard-plan-price" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} className={fieldClass} />
              </div>
            </div>

            <div className="border border-slate-200">
              <div className="bg-brand-blue px-4 py-2.5">
                <p className="text-xs font-medium text-white/80 tracking-wide">Review summary</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-400">
                        {(shopName || name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{shopName || '—'}</p>
                    <p className="text-xs text-slate-500">Vendor logo ready</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <p><span className="text-slate-500">Contact</span> <span className="font-medium text-slate-900 ml-1">{name || '—'}</span></p>
                  <p><span className="text-slate-500">Shop</span> <span className="font-medium text-slate-900 ml-1">{shopName || '—'}</span></p>
                  <p className="sm:col-span-2"><span className="text-slate-500">Email</span> <span className="font-medium text-slate-900 ml-1 break-all">{email || '—'}</span></p>
                  <p><span className="text-slate-500">Phone</span> <span className="font-medium text-slate-900 ml-1">{phone || '—'}</span></p>
                  <p><span className="text-slate-500">Region</span> <span className="font-medium text-slate-900 ml-1">{region}</span></p>
                  <p><span className="text-slate-500">MoMo</span> <span className="font-medium text-slate-900 ml-1">{momoNetwork} · {momoNumber || '—'}</span></p>
                  <p><span className="text-slate-500">Plan</span> <span className="font-medium text-slate-900 ml-1">{planLabel}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={step === 1 ? onClose : goBack}
          className="inline-flex items-center gap-2 h-11 px-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 h-11 px-5 bg-brand-blue text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 h-11 px-5 bg-brand-blue text-brand-lemon text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Create vendor
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
