"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
    ArrowLeft, Send, Image as ImageIcon, 
    ShieldAlert, CheckCircle2, XCircle, 
    MessageSquare, Clock, User as UserIcon,
    AlertCircle, Download
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';

export default function DisputeCenter() {
    const { id } = useParams();
    const { user, token, isAuthenticated } = useAuth();
    const router = useRouter();
    const [dispute, setDispute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchDispute = React.useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${apiBase}/support/dispute/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDispute(data);
            }
        } catch (err) {
            console.error('Error fetching dispute:', err);
        } finally {
            setLoading(false);
        }
    }, [id, token, apiBase]);

    useEffect(() => {
        fetchDispute();
        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchDispute, 10000);
        return () => clearInterval(interval);
    }, [fetchDispute]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dispute?.messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!message.trim() && attachments.length === 0) || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(`${apiBase}/support/dispute/${id}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message, attachments })
            });

            if (res.ok) {
                setMessage('');
                setAttachments([]);
                fetchDispute();
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            Swal.fire({ title: 'Uploading Evidence...', didOpen: () => { Swal.showLoading(); } });
            const res = await fetch(`${apiBase}/uploads/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const { url } = await res.json();
                setAttachments(prev => [...prev, url]);
                Swal.close();
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to upload image', 'error');
        }
    };

    const handleResolve = async (resolution: 'refund' | 'release') => {
        const result = await Swal.fire({
            title: `CONFIRM RESOLUTION`,
            text: `Are you sure you want to ${resolution === 'refund' ? 'REFUND the customer' : 'RELEASE funds to the vendor'}? This action is final.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: resolution === 'refund' ? 'YES, REFUND' : 'YES, RELEASE',
            confirmButtonColor: resolution === 'refund' ? '#ef4444' : '#10b981',
            customClass: { popup: 'rounded-[32px]' }
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${apiBase}/orders/${dispute.orderId}/resolve-dispute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ resolution })
                });

                if (res.ok) {
                    await fetch(`${apiBase}/support/dispute/${id}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: 'resolved' })
                    });
                    
                    Swal.fire('Resolved', `Dispute has been resolved via ${resolution}.`, 'success');
                    fetchDispute();
                } else {
                    throw new Error('Resolution failed');
                }
            } catch (err: any) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
        </div>
    );

    if (!dispute) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />
            <h1 className="text-xl font-black text-slate-900 uppercase">Dispute Not Found</h1>
            <button onClick={() => router.back()} className="mt-4 text-slate-500 font-bold underline">Go Back</button>
        </div>
    );

    const isAdmin = user?.role === 'admin';
    const isVendor = user?.role === 'vendor';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50 p-4 md:p-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-900" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Dispute Ledger</h1>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    dispute.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                    {dispute.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Order #{dispute.orderId.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                    {isAdmin && dispute.status !== 'resolved' && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleResolve('refund')}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                            >
                                Refund
                            </button>
                            <button 
                                onClick={() => handleResolve('release')}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                            >
                                Release
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid md:grid-cols-3 gap-6">
                {/* Chat Section */}
                <div className="md:col-span-2 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-180px)]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Initial Description */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Dispute Initiated</span>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{dispute.category}</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{dispute.description}</p>
                        </div>

                        {/* Messages */}
                        {dispute.messages?.map((msg: any, i: number) => (
                            <div key={i} className={`flex ${String(msg.senderId) === String(user?.id) ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${String(msg.senderId) === String(user?.id) ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {msg.senderRole === 'admin' ? '🛡️ SYSTEM ADMIN' : msg.senderRole === 'vendor' ? '👨‍💼 VENDOR' : '👤 CUSTOMER'}
                                        </span>
                                        <span className="text-[9px] text-slate-300 font-bold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm font-medium ${
                                        String(msg.senderId) === String(user?.id)
                                            ? 'bg-slate-900 text-white rounded-tr-none' 
                                            : msg.senderRole === 'admin'
                                                ? 'bg-brand-lemon text-slate-900 rounded-tl-none'
                                                : 'bg-slate-100 text-slate-600 rounded-tl-none'
                                    }`}>
                                        {msg.message}
                                        {msg.attachments?.length > 0 && (
                                            <div className="mt-3 grid grid-cols-1 gap-2">
                                                {msg.attachments.map((att: string, j: number) => (
                                                    <div key={j} className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                                                        <Image src={att} alt="Evidence" fill className="object-cover" unoptimized />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    {dispute.status !== 'resolved' && (
                        <div className="p-4 bg-white border-t border-slate-50">
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {attachments.map((att, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                                            <Image src={att} alt="Attachment" fill className="object-cover" unoptimized />
                                            <button 
                                                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            >
                                                <XCircle className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <label className="p-3 bg-slate-50 rounded-full cursor-pointer hover:bg-slate-100 transition-colors">
                                    <ImageIcon className="w-5 h-5 text-slate-400" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                                <input 
                                    type="text" 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message or evidence details..."
                                    className="flex-1 bg-slate-50 rounded-full px-6 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={(!message.trim() && attachments.length === 0) || isSending}
                                    className="p-3 bg-slate-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                        <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Dispute Status</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${dispute.status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-xs font-bold text-slate-600">Pending Review</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${dispute.messages?.length > 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                <span className="text-xs font-bold text-slate-600">Evidence Collection</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${dispute.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className="text-xs font-bold text-slate-600">Resolution Complete</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
                        <AlertCircle className="absolute -right-2 -bottom-2 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
                        <h2 className="text-[10px] font-black text-brand-lemon uppercase tracking-[0.2em] mb-2">Rules of Conduct</h2>
                        <ul className="text-[11px] space-y-3 text-slate-400 font-medium">
                            <li className="flex gap-2">
                                <span className="text-brand-lemon">•</span>
                                Be respectful to all parties.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-lemon">•</span>
                                Provide clear picture evidence.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-lemon">•</span>
                                Admin decision is final.
                            </li>
                        </ul>
                    </div>

                    {isAdmin && (
                        <div className="bg-brand-lemon rounded-[32px] p-6 text-slate-900">
                            <ShieldAlert className="w-6 h-6 mb-2" />
                            <h2 className="text-[10px] font-black uppercase tracking-widest mb-1">Admin Tools</h2>
                            <p className="text-xs font-medium mb-4 opacity-70">You are monitoring this dispute. Your role is to determine the fair outcome.</p>
                            <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                View Full Transaction Logs
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
