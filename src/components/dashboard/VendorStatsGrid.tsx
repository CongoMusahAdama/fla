
"use client";
import React, { useState } from 'react';
import { Wallet, Clock, ShoppingBag, Package, TrendingUp, Eye, EyeOff } from 'lucide-react';

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
  const [showLifetimeRevenue, setShowLifetimeRevenue] = useState(false);

  const todayRevenue = Number(dashboardData?.todayRevenue || 0);
  const monthRevenue = Number(dashboardData?.monthRevenue || 0);
  const lifetimeRevenue = Number(dashboardData?.totalRevenue || 0) + Number(dashboardData?.pendingRevenue || 0);

  const stats: Stat[] = [
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
      {/* Revenue — today's earnings in plain sight; lifetime hidden until revealed */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Revenue Today</p>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-4">GH₵ {todayRevenue.toLocaleString()}</h3>
          <div className="flex flex-col gap-2">
            {dashboardData?.pendingRevenue > 0 && (
              <div className="flex items-center gap-2 text-emerald-100 text-[10px] font-black uppercase tracking-tighter">
                <TrendingUp className="w-3 h-3" />
                + GH₵ {Number(dashboardData.pendingRevenue).toLocaleString()} Pending
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowLifetimeRevenue((v) => !v)}
              className="inline-flex items-start gap-1.5 text-[10px] font-black uppercase tracking-tighter text-emerald-100/90 hover:text-white transition-colors w-fit text-left"
            >
              {showLifetimeRevenue ? <EyeOff className="w-3 h-3 mt-0.5 shrink-0" /> : <Eye className="w-3 h-3 shrink-0" />}
              {showLifetimeRevenue ? (
                <span className="flex flex-col gap-0.5">
                  <span>This month: GH₵ {monthRevenue.toLocaleString()}</span>
                  <span>Lifetime: GH₵ {lifetimeRevenue.toLocaleString()}</span>
                </span>
              ) : (
                'Show total'
              )}
            </button>
          </div>
        </div>
        <Wallet className="absolute top-0 right-0 p-8 w-32 h-32 text-white opacity-10" />
      </div>

      {stats.map((stat, idx) => (
        <div key={idx} className={`${stat.bg} p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl`}>
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
