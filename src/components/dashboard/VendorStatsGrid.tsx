"use client";
import React from 'react';
import { Package } from 'lucide-react';

interface VendorStatsGridProps {
  dashboardData?: any;
  productsCount: number;
}

export const VendorStatsGrid: React.FC<VendorStatsGridProps> = ({
  productsCount
}) => {
  return (
    <div className="mb-12">
      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-slate-200 max-w-sm">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Store Products</p>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-4">{productsCount}</h3>
          <p className="text-[10px] font-black uppercase tracking-tighter text-orange-100">Active listings</p>
        </div>
        <Package className="absolute top-0 right-0 p-8 w-32 h-32 text-white opacity-10" />
      </div>
    </div>
  );
};
