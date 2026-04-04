
"use client";
import React from 'react';
import { Search, Bell, Menu, HelpCircle, User } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface VendorHeaderProps {
  activeSection: string;
  shopName?: string;
  profileImage?: string;
}

interface VendorMobileHeaderProps {
  activeSection: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const VendorHeader: React.FC<VendorHeaderProps> = ({
  activeSection,
  shopName,
  profileImage
}) => {
  return (
    <div className="hidden lg:flex items-center justify-between w-full">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
          {activeSection === 'dashboard' ? 'Studio Overview' : 
           activeSection === 'products' ? 'Design Inventory' :
           activeSection === 'orders' ? 'Logistics Ledger' :
           activeSection === 'wallet' ? 'Financial Ecosystem' :
           activeSection === 'settings' ? 'Brand Identity' :
           activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </h2>
        <p className="text-[10px] font-black text-brand-lemon bg-slate-900 px-3 py-1 rounded-full inline-block uppercase tracking-widest mt-1 shadow-xl shadow-slate-900/10">
          {shopName || 'Premium Studio Partner'}
        </p>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search designs or orders..."
            className="w-64 bg-slate-50 py-3.5 pl-12 pr-6 rounded-2xl border-none text-[11px] font-bold focus:ring-4 focus:ring-brand-lemon/10 transition-all shadow-inner group-hover:bg-slate-100 placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-slate-900" />
        </div>

        <button className="relative p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:bg-brand-lemon hover:shadow-xl hover:shadow-brand-lemon/20 group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-slate-900 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest line-clamp-1">{shopName}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Verified Vendor</p>
          </div>
          <div className="w-12 h-12 rounded-[20px] bg-slate-900 flex items-center justify-center text-brand-lemon font-black text-sm border-2 border-white shadow-2xl relative overflow-hidden group">
            {profileImage ? (
                <Image 
                    src={getImageUrl(profileImage)} 
                    alt="Avatar" 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized={true}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/product-1.jpg';
                    }}
                />
            ) : (
                <User className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VendorMobileHeader: React.FC<VendorMobileHeaderProps> = ({
  activeSection,
  setIsSidebarOpen
}) => {
  return (
    <div className="lg:hidden flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-3 bg-slate-900 text-brand-lemon rounded-2xl shadow-xl active:scale-90 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Studio HQ</h2>
      </div>
      <div className="w-10 h-10 rounded-xl bg-brand-lemon flex items-center justify-center text-slate-900 font-black text-xs border border-white shadow-lg">
        {activeSection === 'dashboard' ? <LayoutDashboard className="w-5 h-5" /> : 
         activeSection === 'products' ? <ShoppingBag className="w-5 h-5" /> :
         <User className="w-5 h-5" />}
      </div>
    </div>
  );
};

// Supporting icon for mobile header placeholder
const LayoutDashboard = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);

const ShoppingBag = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
