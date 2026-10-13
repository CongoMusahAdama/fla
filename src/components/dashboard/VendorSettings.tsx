"use client";
import React from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Camera,
  ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { useProductCategories } from '@/hooks/useProductCategories';
import {
  STORE_ACCENT_PRESETS,
  STORE_THEME_PRESETS,
  DEFAULT_STORE_ACCENT,
  DEFAULT_STORE_THEME,
  normalizeStoreHex,
} from '@/lib/store-theme';
import { AreaSuggest } from '@/components/AreaSuggest';
import { GHANA_REGIONS } from '@/lib/ghana-regions';

interface VendorSettingsProps {
  user: any;
  shopName: string;
  setShopName: (val: string) => void;
  storeCategory: string;
  setStoreCategory: (val: string) => void;
  storeAccentColor: string;
  setStoreAccentColor: (val: string) => void;
  storeThemeColor: string;
  setStoreThemeColor: (val: string) => void;
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
  shopArea: string;
  setShopArea: (val: string) => void;
  shopRegion: string;
  setShopRegion: (val: string) => void;
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
  startOnDocuments?: boolean;
}

export const VendorSettings: React.FC<VendorSettingsProps> = ({
  shopName,
  setShopName,
  storeCategory,
  setStoreCategory,
  storeAccentColor,
  setStoreAccentColor,
  storeThemeColor,
  setStoreThemeColor,
  phone,
  setPhone,
  shopLocation,
  setShopLocation,
  shopArea,
  setShopArea,
  shopRegion,
  setShopRegion,
  bio,
  setBio,
  bannerImage,
  profileImage,
  handleImageUpload,
  handleUpdateVendorProfile,
}) => {
  const { categories: categoryOptions } = useProductCategories({ includeAll: false });
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);

  return (
    <div className="w-full max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Store Profile</h1>
        <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
          Update your logo, shop name, area, and store look anytime.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 lg:p-12 space-y-8 shadow-sm">
        {(
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
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store category</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-left text-sm transition-all focus:ring-2 focus:ring-brand-lemon/20 outline-none flex items-center justify-between cursor-pointer"
                  >
                    <span className={storeCategory ? "text-slate-900 font-bold truncate" : "text-slate-400 font-bold truncate"}>
                      {storeCategory || "Select categories"}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${isCategoryDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 mt-2 p-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto space-y-1">
                        {categoryOptions.map((cat) => {
                          const selectedCats = storeCategory ? storeCategory.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                          const isSelected = selectedCats.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                let nextCats: string[];
                                if (isSelected) {
                                  nextCats = selectedCats.filter(c => c !== cat);
                                } else {
                                  nextCats = [...selectedCats, cat];
                                }
                                setStoreCategory(nextCats.join(', '));
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm rounded-xl transition-all flex items-center justify-between hover:bg-slate-50 ${
                                isSelected ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-600 font-medium'
                              }`}
                            >
                              <span className="truncate pr-2">{cat}</span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-950 shrink-0"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Shown on your storefront and used as the default when you add products.</p>
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                <select
                  value={shopRegion}
                  onChange={(e) => setShopRegion(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                >
                  <option value="">Select your region</option>
                  {GHANA_REGIONS.map((regionName) => (
                    <option key={regionName} value={regionName}>{regionName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area</label>
                <AreaSuggest
                  value={shopArea}
                  region={shopRegion}
                  onChange={setShopArea}
                  placeholder="Search Tamale, East Legon..."
                  inputClassName="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20 outline-none"
                />
                <p className="text-[10px] text-slate-400 ml-1">Search and tap your area. Add it if it is not in the list. Buyers use this to find your shop.</p>
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

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Store colors</h3>
                <p className="text-[10px] text-slate-400 mt-1">Customize your public storefront header and button accents.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Accent color</label>
                  <div className="flex flex-wrap gap-2">
                    {STORE_ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        onClick={() => setStoreAccentColor(preset.value)}
                        className={`w-9 h-9 rounded-xl border-2 transition-transform hover:scale-105 ${storeAccentColor === preset.value ? 'border-slate-900 scale-105' : 'border-transparent'}`}
                        style={{ backgroundColor: preset.value }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={normalizeStoreHex(storeAccentColor, DEFAULT_STORE_ACCENT)}
                    onChange={(e) => setStoreAccentColor(e.target.value)}
                    className="w-full h-10 rounded-xl cursor-pointer border border-slate-100"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Header theme</label>
                  <div className="flex flex-wrap gap-2">
                    {STORE_THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        onClick={() => setStoreThemeColor(preset.value)}
                        className={`w-9 h-9 rounded-xl border-2 transition-transform hover:scale-105 ${storeThemeColor === preset.value ? 'border-brand-lemon scale-105' : 'border-white/20'}`}
                        style={{ backgroundColor: preset.value }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={normalizeStoreHex(storeThemeColor, DEFAULT_STORE_THEME)}
                    onChange={(e) => setStoreThemeColor(e.target.value)}
                    className="w-full h-10 rounded-xl cursor-pointer border border-slate-100"
                  />
                </div>
              </div>
              <div
                className="rounded-2xl overflow-hidden border border-slate-100"
                style={{ backgroundColor: normalizeStoreHex(storeThemeColor, DEFAULT_STORE_THEME) }}
              >
                <div className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Preview</p>
                    <p className="text-white font-black uppercase tracking-tight truncate">{shopName || 'Your Store'}</p>
                  </div>
                  <span
                    className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 shrink-0"
                    style={{ backgroundColor: normalizeStoreHex(storeAccentColor, DEFAULT_STORE_ACCENT) }}
                  >
                    Shop now
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleUpdateVendorProfile}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-lemon hover:text-slate-900 transition-all border border-slate-800"
          >
            Save store information
          </button>
        </div>
      </div>
    </div>
  );
};
