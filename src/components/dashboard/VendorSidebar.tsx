
"use client";
import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Eye, PlusCircle, 
  Settings, Wallet, MessageSquare, Bell, 
  ArrowLeft, LogOut, X, HelpCircle, Star
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VendorSidebarProps {
  activeSection: string;
  setActiveSection: (section: any) => void;
  handleLogout: () => void;
}

export const VendorSidebar: React.FC<VendorSidebarProps> = ({
  activeSection,
  setActiveSection,
  handleLogout
}) => {
  const { user } = useAuth();

  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Shop Maintenance', icon: ShoppingBag },
    { id: 'orders', label: 'Order Ledger', icon: Eye },
    { id: 'wallet', label: 'Payouts & Ledger', icon: Wallet },
    { id: 'reviews', label: 'Customer Feedback', icon: Star },
    { id: 'notifications', label: 'Alert Center', icon: Bell },
    { id: 'settings', label: 'Studio Identity', icon: Settings },
    { id: 'help', label: 'Mastery Guide', icon: HelpCircle },
  ];

  return (
    <div className="h-full flex flex-col p-6 md:p-8 relative bg-slate-900 text-white">
      <div className="flex justify-between items-center mb-8 md:mb-10">
        <Link href="/" className="font-heading text-2xl font-black tracking-tighter text-brand-lemon flex items-center gap-2">
          FLA <span className="text-white">STUDIO</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pr-2">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
            }}
            className={`
              w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300
              ${activeSection === item.id
                ? 'bg-brand-lemon text-slate-900 shadow-lg shadow-brand-lemon/10 shadow-inner'
                : 'text-slate-500 hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-slate-900' : 'text-slate-500'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl">
          <div className="w-10 h-10 bg-brand-lemon rounded-xl flex items-center justify-center text-slate-900 font-black flex-shrink-0">
            {user?.name?.[0] || 'V'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest truncate">{user?.name || 'Artisan'}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{user?.shopName || 'Studio Partner'}</p>
          </div>
        </div>
        
        <Link href="/">
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group mb-2 text-left">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Launch Store
          </button>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group text-left"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
