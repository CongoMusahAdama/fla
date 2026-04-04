
"use client";
import React from 'react';
import Image from 'next/image';
import { UploadCloud, Camera, ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface VendorSettingsProps {
  user: any;
  shopName: string;
  setShopName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  momoNumber: string;
  setMomoNumber: (val: string) => void;
  accountName: string;
  setAccountName: (val: string) => void;
  shopLocation: string;
  setShopLocation: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  bannerImage: string | null;
  profileImage: string | null;
  handleImageUpload: (file: File, type: 'avatar' | 'banner') => void;
  handleUpdateVendorProfile: () => void;
}

export const VendorSettings: React.FC<VendorSettingsProps> = ({
  user,
  shopName,
  setShopName,
  phone,
  setPhone,
  momoNumber,
  setMomoNumber,
  accountName,
  setAccountName,
  shopLocation,
  setShopLocation,
  bio,
  setBio,
  bannerImage,
  profileImage,
  handleImageUpload,
  handleUpdateVendorProfile
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
        <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Store Profile</h1>
            <p className="text-slate-500 text-sm mt-1">Customize how customers see your fashion brand.</p>
        </div>
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-12 space-y-10">
            {/* Banner Upload */}
            <div className="relative h-48 bg-slate-100 rounded-[32px] overflow-hidden group border border-slate-100">
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
                    <UploadCloud className="w-12 h-12 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                )}
                <label className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Change Banner</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                </label>
            </div>

            <div className="flex items-end gap-6 -mt-20 relative px-6">
                <div className="w-32 h-32 rounded-[32px] bg-white p-2 shadow-2xl">
                    <div className="w-full h-full bg-slate-900 rounded-[24px] flex items-center justify-center text-white relative group overflow-hidden">
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
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera className="w-6 h-6 text-white" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
                        </label>
                    </div>
                </div>
                <div className="pb-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase">{user?.shopName || 'Your Brand'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Premium Vendor Since 2024</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Brand Name</label>
                    <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MoMo Payout Number</label>
                    <input
                        type="text"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MoMo Account Name</label>
                    <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Studio Address</label>
                    <input
                        type="text"
                        value={shopLocation}
                        onChange={(e) => setShopLocation(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20"
                    />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Bio</label>
                    <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 resize-none"
                    />
                </div>
            </div>

            <button
                onClick={handleUpdateVendorProfile}
                className="w-full mt-4 py-5 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-lemon hover:text-slate-900 transition-all active:scale-95"
            >
                Save Store Information
            </button>
        </div>
    </div>
  );
};
