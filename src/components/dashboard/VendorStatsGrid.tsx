
"use client";
import React from 'react';
import { Wallet, Clock, ShoppingBag, Package, TrendingUp } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  icon: any;
  color: string;
  bg: string;
  pattern: string;
  trend?: string;
  trendColor?: string;
}

interface VendorStatsGridProps {
  dashboardData: any;
  productsCount: number;
}

export const VendorStatsGrid: React.FC<VendorStatsGridProps> = ({
  dashboardData,
  productsCount
}) => {
  const stats: Stat[] = [
    { 
      label: 'Total Revenue', 
      value: `GH₵ ${((dashboardData?.totalRevenue || 0) + (dashboardData?.pendingRevenue || 0)).toLocaleString()}`, 
      icon: Wallet, 
      color: 'text-white', 
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-700', 
      pattern: 'opacity-10', 
      trend: dashboardData?.pendingRevenue > 0 ? `+ GH₵ ${dashboardData.pendingRevenue.toLocaleString()} Pending` : 'Lifetime Revenue',
      trendColor: 'text-emerald-100'
    },
    { 
      label: 'Active Orders', 
      value: (dashboardData?.activeOrders || '0').toString(), 
      icon: Clock, 
      color: 'text-white', 
      bg: 'bg-gradient-to-br from-blue-500 to-blue-700', 
      pattern: 'opacity-10',
      trend: 'Awaiting fulfillment',
      trendColor: 'text-blue-100'
    },
    { 
      label: 'Total Sales', 
      value: (dashboardData?.totalSales || '0').toString(), 
      icon: ShoppingBag, 
      color: 'text-white', 
      bg: 'bg-gradient-to-br from-violet-500 to-violet-700', 
      pattern: 'opacity-10',
      trend: 'Completed transactions',
      trendColor: 'text-violet-100'
    },
    { 
      label: 'Store Products', 
      value: productsCount.toString(), 
      icon: Package, 
      color: 'text-white', 
      bg: 'bg-gradient-to-br from-orange-500 to-orange-700', 
      pattern: 'opacity-10',
      trend: 'Active global listings',
      trendColor: 'text-orange-100'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, idx) => (
        <div key={idx} className={`${stat.bg} p-8 rounded-[40px] relative overflow-hidden shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl`}>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tighter mb-4">{stat.value}</h3>
            {stat.trend && (
              <div className={`flex items-center gap-2 ${stat.trendColor} text-[10px] font-black uppercase tracking-tighter`}>
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </div>
            )}
          </div>
          <stat.icon className={`absolute top-0 right-0 p-8 w-32 h-32 text-white ${stat.pattern}`} />
        </div>
      ))}
    </div>
  );
};
