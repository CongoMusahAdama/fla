
"use client";
import React from 'react';
import { Wallet, ArrowUpRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface VendorFinancesProps {
  user: any;
  dashboardData: any;
  commissionRate: number;
  handleWithdrawal: () => void;
}

export const VendorFinances: React.FC<VendorFinancesProps> = ({
  user,
  dashboardData,
  commissionRate,
  handleWithdrawal
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
        <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Direct Earnings</h1>
            <p className="text-slate-500 text-sm mt-1">Your funds are directly split and paid via Paystack.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-lemon/10 rounded-full blur-3xl" />
                <div className="flex justify-between items-start mb-8">
                    <Wallet className="w-12 h-12 text-brand-lemon" />
                    {user?.paystackSubaccountCode ? (
                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            Direct Payouts Active
                        </div>
                    ) : (
                        <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-amber-500 rounded-full" />
                            Setup Required
                        </div>
                    )}
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Net Earnings</p>
                <h3 className="text-4xl font-black text-brand-lemon mb-10">GH₵ {(dashboardData?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm py-3 border-t border-white/5">
                        <span className="text-slate-400">Platform Commission</span>
                        <span className="font-black text-brand-lemon">{commissionRate}% Per Sale</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 mt-2">
                        <p className="text-[10px] font-black text-brand-lemon uppercase tracking-widest mb-1">Settlement Account</p>
                        <p className="text-xs font-bold text-white uppercase">{user?.accountName || 'Primary Account'}</p>
                        <p className="text-sm font-black text-white tracking-widest">{user?.momoNumber || 'No Number Linked'}</p>
                        <p className="text-[9px] text-slate-500 mt-3 font-medium italic">Payments are split automatically at checkout and sent to your subaccount by Paystack.</p>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Withdrawal History</h3>
                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                    {(dashboardData?.withdrawalHistory || []).length > 0 ? (
                        dashboardData.withdrawalHistory.map((w: any, i: number) => (
                            <div key={i} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-slate-900 text-sm">GH₵ {w.netAmount?.toLocaleString() || w.amount.toLocaleString()}</p>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${w.status === 'processed' ? 'bg-emerald-100 text-emerald-600' :
                                            w.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {w.status}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 uppercase font-black">
                                        {new Date(w.createdAt).toLocaleDateString()} • {w.paymentMethod?.toUpperCase() || 'MOMO'}
                                        {w.adminCommission > 0 && ` • FEE: GH₵ ${w.adminCommission}`}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-xl ${w.status === 'processed' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">No withdrawals<br />recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
