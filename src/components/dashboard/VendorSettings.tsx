"use client";
import React from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Camera,
  ImageIcon,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface VendorSettingsProps {
  user: any;
  shopName: string;
  setShopName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  momoNumber: string;
  setMomoNumber: (val: string) => void;
  momoNetwork: string;
  setMomoNetwork: (val: string) => void;
  accountName: string;
  setAccountName: (val: string) => void;
  shopLocation: string;
  setShopLocation: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  bannerImage: string | null;
  profileImage: string | null;
  businessRegistration: string | null;
  ghanaCardFront?: string | null;
  ghanaCardBack?: string | null;
  selfie?: string | null;
  handleImageUpload: (file: File, type: 'avatar' | 'banner' | 'doc' | 'ghanaFront' | 'ghanaBack' | 'selfie') => void;
  handleUpdateVendorProfile: () => void;
  isVerifyingAccount?: boolean;
  setIsVerifyingAccount?: (val: boolean) => void;
  /** Jump straight to documents when vendor still needs KYC upload */
  startOnDocuments?: boolean;
}

type WizardStep = 'brand' | 'payout' | 'documents';

const STEPS: { id: WizardStep; label: string; hint: string }[] = [
  { id: 'brand', label: 'Brand', hint: 'Logo, banner & shop details' },
  { id: 'payout', label: 'Payout', hint: 'MoMo or bank for settlements' },
  { id: 'documents', label: 'Documents', hint: 'Ghana Card & selfie to sell' },
];

export const VendorSettings: React.FC<VendorSettingsProps> = ({
  user,
  shopName,
  setShopName,
  phone,
  setPhone,
  momoNumber,
  setMomoNumber,
  momoNetwork,
  setMomoNetwork,
  accountName,
  setAccountName,
  shopLocation,
  setShopLocation,
  bio,
  setBio,
  bannerImage,
  profileImage,
  businessRegistration,
  ghanaCardFront,
  ghanaCardBack,
  selfie,
  handleImageUpload,
  handleUpdateVendorProfile,
  startOnDocuments = false,
}) => {
  const needsDocs = !user?.kycApprovedAt && !user?.kycSubmittedAt;
  const [step, setStep] = React.useState<WizardStep>(
    startOnDocuments || needsDocs ? 'documents' : 'brand',
  );
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (startOnDocuments || needsDocs) {
      setStep('documents');
    }
  }, [startOnDocuments, needsDocs]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const docsReady = Boolean(ghanaCardFront && selfie);
  const isMomo = momoNetwork?.length > 3 || ['MTN', 'VOD', 'ATL', 'Vodafone', 'AirtelTigo'].includes(momoNetwork);

  const handleVerifyAccount = async () => {
    if (!momoNumber || momoNumber.length < 10) {
      setVerificationError('Please enter a valid account number');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${api}/payments/lookup-name/${momoNetwork}/${momoNumber}`);
      const data = await res.json();

      if (data.success) {
        setAccountName(data.name);
      } else {
        setVerificationError(data.message || 'Verification failed');
      }
    } catch {
      setVerificationError('Service unavailable');
    } finally {
      setIsVerifying(false);
    }
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].id);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id);
  };

  return (
    <div className="w-full max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Store Profile</h1>
        <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
          {needsDocs
            ? 'Finish these 3 short steps — documents unlock selling after admin approval.'
            : 'Update your brand, payout, and verification details.'}
        </p>
      </div>

      {/* Step indicator */}
      <nav aria-label="Profile setup steps" className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 md:p-5 shadow-sm">
        <ol className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            const done = i < stepIndex || (s.id === 'documents' && Boolean(user?.kycApprovedAt || user?.kycSubmittedAt));
            return (
              <li key={s.id} className="min-w-[9.5rem] sm:min-w-0 shrink-0 sm:shrink">
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`w-full text-left rounded-xl px-3 sm:px-4 py-3 sm:py-4 transition-colors border ${
                    active
                      ? 'bg-brand-lemon/25 border-brand-lemon text-slate-900'
                      : done
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest block">
                    Step {i + 1}
                  </span>
                  <span className="text-sm font-bold block mt-0.5">{s.label}</span>
                  <span className="hidden sm:block text-[11px] text-slate-500 mt-1 leading-snug">{s.hint}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 lg:p-12 space-y-8 shadow-sm min-h-[480px]">
        {step === 'brand' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Brand identity</h2>
              <p className="text-xs text-slate-500 mt-1">How customers see your shop on FLA.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Studio Banner</label>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">1200 × 400px</span>
              </div>
              <div className="relative h-48 bg-slate-50 rounded-2xl overflow-hidden group border-2 border-dashed border-slate-200 hover:border-brand-lemon transition-all">
                {bannerImage ? (
                  <Image
                    src={getImageUrl(bannerImage)}
                    alt="Banner"
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-8 h-8 text-slate-300" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload background</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-slate-900/40 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
                    Replace
                  </p>
                  <input
                    id="banner-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                  />
                </label>
                <label
                  htmlFor="banner-upload"
                  className="absolute bottom-3 right-3 md:hidden w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center text-slate-900 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>
            </div>

            <div className="flex items-end gap-5 -mt-14 relative px-4">
              <div className="w-28 h-28 rounded-2xl bg-white p-2 shadow-xl relative shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-white relative group overflow-hidden">
                  {profileImage ? (
                    <Image src={getImageUrl(profileImage)} alt="Avatar" fill sizes="112px" unoptimized className="object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-white/20" />
                  )}
                  <label className="absolute inset-0 bg-slate-900/60 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
                    />
                  </label>
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 md:hidden w-8 h-8 bg-brand-lemon text-slate-900 rounded-2xl shadow-lg flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </label>
              </div>
              <div className="pb-2 min-w-0">
                <h3 className="text-lg font-black text-slate-900 uppercase leading-none truncate">{shopName || 'Your Brand'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Shop logo & name</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Brand Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Address</label>
                <input
                  type="text"
                  value={shopLocation}
                  onChange={(e) => setShopLocation(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'payout' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Payout details</h2>
              <p className="text-xs text-slate-500 mt-1">Where FLA sends your share of each sale.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payout Method Type</label>
                <select
                  value={user?.paymentMethods?.[0]?.type || (isMomo ? 'momo' : 'bank')}
                  onChange={(e) => {
                    setMomoNetwork(e.target.value === 'momo' ? 'MTN' : 'GCB');
                  }}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 appearance-none cursor-pointer outline-none"
                >
                  <option value="momo">Mobile Money</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {isMomo ? 'Network Provider' : 'Select Bank'}
                </label>
                <select
                  value={momoNetwork}
                  onChange={(e) => setMomoNetwork(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 appearance-none cursor-pointer outline-none"
                >
                  {isMomo ? (
                    <>
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="Vodafone">Vodafone Cash</option>
                      <option value="AirtelTigo">AirtelTigo Money</option>
                    </>
                  ) : (
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
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={momoNumber}
                    onChange={(e) => {
                      setMomoNumber(e.target.value);
                      setVerificationError(null);
                    }}
                    placeholder={isMomo ? '024XXXXXXX' : 'XXXXXXXXXX'}
                    className={`w-full sm:flex-1 px-5 py-3.5 bg-slate-50 border ${verificationError ? 'border-red-200' : 'border-slate-100'} rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAccount}
                    disabled={isVerifying}
                    className="h-12 sm:h-auto px-5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center sm:min-w-[100px] shrink-0"
                  >
                    {isVerifying ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {verificationError && (
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-tight mt-1 ml-1">{verificationError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'documents' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Verification documents</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Required before listing products · approval usually 4–5 hours after you save.
                </p>
              </div>
              {user?.kycApprovedAt ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Approved to sell</span>
                </div>
              ) : user?.kycSubmittedAt ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 rounded-2xl border border-sky-100 shrink-0">
                  <Clock className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Under review</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Upload required</span>
                </div>
              )}
            </div>

            {!user?.kycApprovedAt && !user?.kycSubmittedAt && (
              <div className="rounded-xl bg-brand-lemon/20 border border-brand-lemon/40 px-4 py-3 text-sm text-slate-800">
                Tap each card to upload. You need at least <strong>Ghana Card (front)</strong> and a{' '}
                <strong>selfie with ID</strong>, then hit Save below.
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-5 lg:gap-6">
              {(
                [
                  { key: 'ghanaFront' as const, label: 'Ghana Card (front)', value: ghanaCardFront, required: true },
                  { key: 'ghanaBack' as const, label: 'Ghana Card (back)', value: ghanaCardBack, required: false },
                  { key: 'selfie' as const, label: 'Selfie with ID', value: selfie, required: true },
                ] as const
              ).map((doc) => (
                <label
                  key={doc.key}
                  className={`relative block aspect-[4/3] min-h-[180px] bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed cursor-pointer hover:border-brand-lemon transition-colors ${
                    doc.value ? 'border-emerald-300' : doc.required ? 'border-orange-200' : 'border-slate-200'
                  }`}
                >
                  {doc.value ? (
                    <Image src={getImageUrl(doc.value)} alt={doc.label} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <Camera className="w-6 h-6 text-slate-300" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{doc.label}</span>
                      {doc.required && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-orange-500">Required</span>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], doc.key)}
                  />
                </label>
              ))}
            </div>

            <div className="relative">
              {businessRegistration ? (
                <div className="relative h-36 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group">
                  <Image
                    src={getImageUrl(businessRegistration)}
                    alt="Business Certificate"
                    fill
                    sizes="400px"
                    className="object-cover opacity-60"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <FileText className="w-7 h-7 text-slate-900" />
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Business Certificate</p>
                    <label className="cursor-pointer bg-slate-900 text-white px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest">
                      Update
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'doc')}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-brand-lemon transition-all cursor-pointer">
                  <UploadCloud className="w-7 h-7 text-slate-300" />
                  <div className="text-center px-4">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Business registration</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Optional · PDF or image</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'doc')}
                  />
                </label>
              )}
            </div>

            {needsDocs && !docsReady && (
              <p className="text-xs text-orange-600 font-semibold">
                Upload the required documents above before saving so we can start your review.
              </p>
            )}
          </div>
        )}

        {/* Wizard footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-slate-100">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:justify-end">
            {step !== 'documents' ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-brand-lemon text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-brand-lemon/90 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleUpdateVendorProfile}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-lemon hover:text-slate-900 transition-all border border-slate-800"
            >
              {step === 'documents' && needsDocs ? 'Save & submit for review' : 'Save store information'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
