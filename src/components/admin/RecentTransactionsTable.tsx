"use client";
import React from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface Transaction {
    id: string;
    customerName: string;
    customerEmail: string;
    type: string;
    status: 'Approved' | 'Declined' | 'Pending';
    accountData: string;
    accountType: 'visa' | 'mastercard' | 'momo';
    date: string;
    amount: number;
}

export const RecentTransactionsTable = ({ orders }: { orders: any[] }) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Transform orders to transactions format
    const transactions = orders.map((order, index) => ({
        sn: index + 1,
        id: order._id.slice(-8).toUpperCase(),
        customerName: order.customerName || 'Guest User',
        customerEmail: order.customerEmail,
        customerImage: order.customerImage,
        type: 'Sale',
        status: order.isPaid ? 'Approved' : 'Pending',
        accountData: order.momoNumber || '050 000 0000',
        accountType: 'momo',
        date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }),
        amount: order.totalAmount
    }));

    const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    return (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest">Recent Transactions</h2>
            </div>
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900">
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5">S/N</th>
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5">Customer</th>
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5">Type</th>
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5">Account Data</th>
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5">Date</th>
                            <th className="px-8 py-5 text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/5 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedTransactions.map((tx, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6 text-xs font-black text-slate-400 tabular-nums">{tx.sn}</td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 shadow-sm relative">
                                            {tx.customerImage ? (
                                                <Image src={getImageUrl(tx.customerImage)} alt={tx.customerName} fill className="object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-xs font-black ${
                                                    tx.sn % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {tx.customerName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm tracking-tighter uppercase">{tx.customerName}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-wide">{tx.type}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        tx.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                                        tx.status === 'Declined' ? 'bg-rose-50 text-rose-600' : 
                                        'bg-amber-50 text-amber-600'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-3 bg-orange-500 rounded-sm" />
                                        <span className="text-xs font-black text-slate-900 tracking-tighter">{tx.accountData}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs font-black text-slate-500 tabular-nums">{tx.date}</td>
                                <td className="px-8 py-6 text-right font-black text-slate-900 tabular-nums">GH₵ {tx.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Displaying <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, transactions.length)}</span> of <span className="text-slate-900">{transactions.length}</span> Records
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                        >
                            Prev
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                        currentPage === i + 1 
                                            ? 'bg-slate-900 text-white shadow-lg' 
                                            : 'text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
