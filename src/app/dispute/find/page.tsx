"use client";
import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function FindDisputeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token } = useAuth();
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId || !token) return;

        const findDispute = async () => {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            try {
                const res = await fetch(`${apiBase}/support/my-disputes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const disputes = await res.json();
                    const dispute = disputes.find((d: any) => d.orderId === orderId);
                    if (dispute) {
                        router.replace(`/dispute/${dispute._id}`);
                    } else {
                        alert('Dispute not found for this order.');
                        router.back();
                    }
                }
            } catch (err) {
                console.error(err);
                router.back();
            }
        };

        findDispute();
    }, [orderId, token, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locating Ledger...</p>
            </div>
        </div>
    );
}

export default function FindDispute() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            </div>
        }>
            <FindDisputeContent />
        </Suspense>
    );
}
