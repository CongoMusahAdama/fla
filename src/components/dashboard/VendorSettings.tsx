
"use client";
import React from 'react';
import Image from 'next/image';
import { UploadCloud, Camera, ImageIcon, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
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
  handleImageUpload: (file: File, type: 'avatar' | 'banner' | 'doc') => void;
  handleUpdateVendorProfile: () => void;
  isVerifyingAccount?: boolean;
  setIsVerifyingAccount?: (val: boolean) => void;
}

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
  handleImageUpload,
  handleUpdateVendorProfile,
}) => {
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);

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
            // Show success toast or feedback
        } else {
            setVerificationError(data.message || 'Verification failed');
        }
    } catch (err) {
        setVerificationError('Service unavailable');
    } finally {
        setIsVerifying(false);
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
        <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Store Profile</h1>
            <p className="text-slate-500 text-sm mt-1">Customize how customers see your fashion brand.</p>
        </div>
        <div className="bg-white rounded-none border border-slate-100 p-8 md:p-12 space-y-10 shadow-sm">
            {/* Banner Upload */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Studio Banner (Background)</label>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recommended: 1200 x 400px</span>
                </div>
                <div className="relative h-48 bg-slate-50 rounded-none overflow-hidden group border-2 border-dashed border-slate-200 hover:border-brand-lemon transition-all">
                    {bannerImage ? (
                        <Image
                            src={getImageUrl(bannerImage)}
                            alt="Banner"
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
                            unoptimized={true}
                            className="object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/product-1.jpg';
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <UploadCloud className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload Landscape Background</p>
                        </div>
                    )}
                    <label className="absolute inset-0 bg-slate-900/40 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">Replace Background</p>
                        <input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                    </label>
                    {/* Mobile-only upload button */}
                    <label htmlFor="banner-upload" className="absolute bottom-4 right-4 md:hidden w-10 h-10 bg-white shadow-xl rounded-none flex items-center justify-center text-slate-900 cursor-pointer active:scale-90 transition-all">
                        <Camera className="w-4 h-4" />
                    </label>
                </div>
            </div>

            <div className="flex items-end gap-6 -mt-20 relative px-6">
                <div className="w-32 h-32 rounded-none bg-white p-2 shadow-2xl relative">
                    <div className="w-full h-full bg-slate-900 rounded-none flex items-center justify-center text-white relative group overflow-hidden">
                        {profileImage ? (
                            <Image
                                src={getImageUrl(profileImage)}
                                alt="Avatar"
                                fill
                                sizes="128px"
                                unoptimized={true}
                                className="object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/product-1.jpg';
                                }}
                            />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-white/20 group-hover:scale-110 transition-transform" />
                        )}
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera className="w-6 h-6 text-white" />
                            <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
                        </label>
                    </div>
                    {/* Mobile-only avatar camera button */}
                    <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 md:hidden w-8 h-8 bg-brand-lemon text-slate-900 rounded-none shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                        <Camera className="w-3.5 h-3.5" />
                    </label>
                </div>
                <div className="pb-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase leading-none mb-1">{shopName || 'Your Brand'}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-none uppercase tracking-widest">Premium Vendor</span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Established 2024</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Brand Name</label>
                    <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payout Method Type</label>
                    <select
                        value={user?.paymentMethods?.[0]?.type || (momoNetwork?.length > 3 ? 'momo' : 'bank')} 
                        onChange={(e) => {
                            setMomoNetwork(e.target.value === 'momo' ? 'MTN' : 'GCB');
                        }}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 appearance-none cursor-pointer"
                    >
                        <option value="momo">Mobile Money</option>
                        <option value="bank">Bank Account</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{momoNetwork?.length > 3 || ['MTN', 'VOD', 'ATL'].includes(momoNetwork) ? 'Network Provider' : 'Select Bank'}</label>
                    <select
                        value={momoNetwork}
                        onChange={(e) => setMomoNetwork(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 appearance-none cursor-pointer"
                    >
                        {momoNetwork?.length > 3 || ['MTN', 'VOD', 'ATL'].includes(momoNetwork) ? (
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
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={momoNumber}
                            onChange={(e) => {
                                setMomoNumber(e.target.value);
                                setVerificationError(null);
                            }}
                            placeholder={momoNetwork?.length > 3 ? "024XXXXXXX" : "XXXXXXXXXX"}
                            className={`flex-1 px-6 py-4 bg-slate-50 border ${verificationError ? 'border-red-200' : 'border-slate-100'} rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20`}
                        />
                        <button 
                            type="button"
                            onClick={handleVerifyAccount}
                            disabled={isVerifying}
                            className="px-6 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-none hover:bg-black transition-all active:scale-95 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                        >
                            {isVerifying ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : 'Verify'}
                        </button>
                    </div>
                    {verificationError && <p className="text-[9px] text-red-500 font-bold uppercase tracking-tight mt-1 ml-1">{verificationError}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                    <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Studio Address</label>
                    <input
                        type="text"
                        value={shopLocation}
                        onChange={(e) => setShopLocation(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Bio</label>
                    <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-none text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none"
                    />
                </div>

                {/* Business Registration Upload */}
                <div className="md:col-span-2 pt-6 border-t border-slate-50 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Compliance & Documentation</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Required for high-value sales (Above GH₵ 100)</p>
                        </div>
                        {businessRegistration ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-none border border-emerald-100">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Document Uploaded</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-none border border-orange-100">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Action Required</span>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        {businessRegistration ? (
                            <div className="relative h-40 bg-slate-50 rounded-none overflow-hidden border border-slate-100 group">
                                <Image
                                    src={getImageUrl(businessRegistration)}
                                    alt="Business Certificate"
                                    fill
                                    sizes="400px"
                                    className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                    unoptimized={true}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-slate-900" />
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Business Certificate</p>
                                    <label className="cursor-pointer bg-slate-900 text-white px-6 py-2 rounded-none text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                        Update Document
                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'doc')} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-4 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-none hover:border-brand-lemon transition-all cursor-pointer">
                                <UploadCloud className="w-8 h-8 text-slate-300" />
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Upload Business Registration</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF or Image (Max 5MB)</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'doc')} />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={handleUpdateVendorProfile}
                className="w-full mt-4 py-5 bg-slate-900 text-white rounded-none font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-lemon hover:text-slate-900 transition-all active:scale-95 border border-slate-800 shadow-xl shadow-slate-900/10"
            >
                Save Store Information
            </button>
        </div>
    </div>
  );
};
