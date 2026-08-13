"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/lib/utils';
import { ArrowLeft, Download, Loader2, Printer, Send } from 'lucide-react';
import Swal from 'sweetalert2';

type LetterData = {
  vendor: any;
  generatedAt: string;
  platform: { name: string; legalName: string; website: string };
};

export default function VendorAgreementPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<LetterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'admin') {
      router.replace('/auth');
      return;
    }
    if (!id || !token) return;

    (async () => {
      try {
        const res = await fetch(`${api}/users/admin/${id}/agreement-letter`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Could not load agreement');
        }
        setData(await res.json());
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      }
    })();
  }, [id, token, user, isLoading, router, api]);

  const downloadPdf = async () => {
    if (!token || !id) return;
    setDownloading(true);
    try {
      // Prefer /download path; fall back to legacy .pdf route
      let res = await fetch(`${api}/users/admin/${id}/agreement-letter/download`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) {
        res = await fetch(`${api}/users/admin/${id}/agreement-letter.pdf`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Could not generate PDF (${res.status})`);
      }
      const blob = await res.blob();
      if (!blob.size) {
        throw new Error('PDF was empty — try again or use Print');
      }
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `FLA-Vendor-Agreement.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      Swal.fire('Download failed', e.message || 'Could not download PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const sendToVendor = async () => {
    if (!token || !id) return;
    setSending(true);
    try {
      const res = await fetch(`${api}/users/admin/${id}/agreement-letter/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Could not email agreement');
      Swal.fire({
        icon: 'success',
        title: 'Agreement sent',
        text: `PDF emailed to ${body.email || 'the vendor'}.`,
      });
    } catch (e: any) {
      Swal.fire('Send failed', e.message || 'Could not email PDF', 'error');
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-600 font-bold">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-sm font-medium text-slate-400">Loading agreement…</p>
      </main>
    );
  }

  const v = data.vendor;
  const shop = v.shopName || v.name || 'Vendor';
  const starts = v.subscriptionStartsAt ? new Date(v.subscriptionStartsAt).toLocaleDateString() : '—';
  const ends = v.subscriptionEndsAt ? new Date(v.subscriptionEndsAt).toLocaleDateString() : '—';
  const plan = v.subscriptionLabel || (v.subscriptionPlan === 'monthly' ? 'Monthly Partner Plan' : v.subscriptionPlan === 'annual' ? 'Annual Partner Plan' : 'Intro month');
  const price = v.subscriptionPriceText || 'GHS 100 / month';

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">
      <div className="print:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to admin
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-slate-500 mr-auto sm:mr-2 hidden sm:block">
            Preview below · download, print, or email to vendor
          </p>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 h-10 px-4 bg-brand-blue text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
          <button
            type="button"
            onClick={sendToVendor}
            disabled={sending}
            className="inline-flex items-center gap-2 h-10 px-4 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Email to vendor
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-10 px-4 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <article className="max-w-[210mm] mx-auto my-8 print:my-0 bg-white shadow-xl print:shadow-none p-10 md:p-14 text-slate-900">
        <header className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpeg" alt="FLA" width={64} height={64} className="object-contain" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">FLA Purchase</p>
              <h1 className="text-2xl font-semibold tracking-tight">Vendor Agreement</h1>
              <p className="text-xs text-slate-500 mt-1">{data.platform.legalName}</p>
            </div>
          </div>
          <div className="text-right">
            {v.profileImage || v.bannerImage ? (
              <div className="relative w-16 h-16 overflow-hidden border border-slate-200 ml-auto mb-2">
                <Image
                  src={getImageUrl(v.profileImage || v.bannerImage)}
                  alt={shop}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-brand-lemon text-slate-900 font-semibold text-2xl flex items-center justify-center ml-auto mb-2">
                {String(shop).charAt(0)}
              </div>
            )}
            <p className="text-xs font-semibold">{shop}</p>
            <p className="text-[10px] text-slate-500">{v.uniqueVendorId || ''}</p>
          </div>
        </header>

        <p className="text-sm leading-relaxed text-slate-600 mb-8">
          This Vendor Partnership Agreement (&quot;Agreement&quot;) is entered into as of{' '}
          <strong>{new Date(data.generatedAt).toLocaleDateString()}</strong> between{' '}
          <strong>{data.platform.name}</strong> (&quot;Platform&quot;) and <strong>{shop}</strong>{' '}
          (&quot;Vendor&quot;), represented by <strong>{v.name || '—'}</strong>.
        </p>

        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">
            1. Parties
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 border border-slate-200 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-400 mb-2">Platform</p>
              <p className="font-semibold">{data.platform.name}</p>
              <p className="text-slate-600">{data.platform.legalName}</p>
              <p className="text-slate-500 text-xs mt-1">{data.platform.website}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4">
              <p className="text-[10px] font-semibold uppercase text-slate-400 mb-2">Vendor</p>
              <p className="font-semibold">{shop}</p>
              <p className="text-slate-600">{v.name}</p>
              <p className="text-slate-500 text-xs mt-1">{v.email} · {v.phone}</p>
              <p className="text-slate-500 text-xs">{[v.location, v.region].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">
            2. Subscription plan
          </h2>
          <table className="w-full text-sm border border-slate-200 overflow-hidden">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold bg-slate-50 w-1/3">Plan</td>
                <td className="p-3">{plan}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold bg-slate-50">Type</td>
                <td className="p-3 uppercase text-xs font-semibold tracking-widest">{v.subscriptionPlan || 'intro'}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold bg-slate-50">Commercial terms</td>
                <td className="p-3">{price}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold bg-slate-50">Start date</td>
                <td className="p-3">{starts}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold bg-slate-50">End / renewal</td>
                <td className="p-3">{ends}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8 text-sm text-slate-600 space-y-3 leading-relaxed">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 text-slate-900">
            3. Key terms
          </h2>
          <p>
            <strong className="text-slate-900">Marketplace & storefront.</strong> Vendor may sell through the FLA marketplace and a dedicated storefront URL once identity documents are approved by FLA and the subscription fee is paid via Paystack.
          </p>
          <p>
            <strong className="text-slate-900">Onboarding & KYC.</strong> Vendor must upload valid identification and supporting business documents after first login. Product listing unlocks after FLA admin approval and successful subscription payment (GHS 100 / month).
          </p>
          <p>
            <strong className="text-slate-900">Payments.</strong> Customer payments are processed via FLA&apos;s payment provider with an agreed platform split; Vendor payouts settle to the registered MoMo/bank account on file.
          </p>
          <p>
            <strong className="text-slate-900">Conduct.</strong> Vendor agrees to fulfil orders accurately, honour stated lead times, and comply with FLA policies, including dispute resolution.
          </p>
          <p>
            <strong className="text-slate-900">Credentials.</strong> Vendor will change the temporary password provided at onboarding and keep account access secure.
          </p>
        </section>

        <section className="mt-16 grid md:grid-cols-2 gap-10">
          <div>
            <div className="h-16 border-b border-slate-400 mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">FLA authorized signature</p>
            <p className="text-xs text-slate-400 mt-1">Date: _______________</p>
          </div>
          <div>
            <div className="h-16 border-b border-slate-400 mb-2" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Vendor signature — {shop}</p>
            <p className="text-xs text-slate-400 mt-1">Date: _______________</p>
          </div>
        </section>

        <footer className="mt-12 pt-4 border-t border-slate-200 text-[9px] text-slate-400 uppercase tracking-widest text-center">
          Generated {new Date(data.generatedAt).toLocaleString()} · Confidential partnership document
        </footer>
      </article>
    </main>
  );
}
