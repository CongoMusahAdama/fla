"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldAlert,
  MessageSquare,
  ExternalLink,
  Package,
  MapPin,
  CreditCard,
  Phone,
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

type SupportDispute = {
  _id: string;
  orderId?: string;
  category?: string;
  description?: string;
  status?: string;
  messages?: unknown[];
  createdAt?: string;
};

type OrderSnapshot = {
  _id: string;
  createdAt?: string;
  status?: string;
  isPaid?: boolean;
  paidAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  vendorName?: string;
  items?: Array<{ name?: string; image?: string; quantity?: number; size?: string; price?: number }>;
  totalAmount?: number;
  vendorShare?: number;
  adminCommission?: number;
  shippingAddress?: string;
  shippingCity?: string;
  shippingRegion?: string;
  trackingNumber?: string;
  carrier?: string;
  disputeReason?: string;
  paymentId?: string;
};

interface AdminDisputeCaseCardProps {
  order: OrderSnapshot;
  supportDispute?: SupportDispute | null;
  onRefund: () => void;
  onRelease: () => void;
}

function SnapshotRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">{label}</span>
      <span className="text-[10px] font-bold text-slate-900 text-right break-all">{value || '—'}</span>
    </div>
  );
}

export function AdminDisputeCaseCard({
  order,
  supportDispute,
  onRefund,
  onRelease,
}: AdminDisputeCaseCardProps) {
  const orderRef = order._id.slice(-6).toUpperCase();
  const item = order.items?.[0];
  const disputeChatHref = supportDispute
    ? `/dispute/${supportDispute._id}`
    : `/dispute/find?orderId=${order._id}`;
  const messageCount = supportDispute?.messages?.length ?? 0;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex items-start gap-4">
          {item?.image && (
            <div className="relative w-16 h-20 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
              <Image src={getImageUrl(item.image)} alt={item.name || 'Product'} fill className="object-cover" sizes="64px" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Active dispute
            </p>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">#ORD-{orderRef}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Opened {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
            </p>
            {supportDispute && (
              <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Ledger: {supportDispute.status || 'pending'} · {messageCount} message{messageCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Link
            href={disputeChatHref}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-brand-lemon rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <MessageSquare className="w-4 h-4" />
            Open Dispute Center
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
          <button
            type="button"
            onClick={onRefund}
            className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
          >
            Refund customer
          </button>
          <button
            type="button"
            onClick={onRelease}
            className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
          >
            Release to vendor
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 md:divide-x divide-slate-100">
        <div className="p-6 space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Order snapshot
          </p>
          <SnapshotRow label="Item" value={item?.name || 'Multiple items'} />
          <SnapshotRow label="Qty / Size" value={item ? `${item.quantity ?? 1} · ${item.size || 'N/A'}` : '—'} />
          <SnapshotRow label="Gross" value={`GH₵ ${(order.totalAmount ?? 0).toLocaleString()}`} />
          <SnapshotRow label="Vendor net" value={`GH₵ ${(order.vendorShare ?? 0).toLocaleString()}`} />
          <SnapshotRow label="Platform fee" value={`GH₵ ${(order.adminCommission ?? 0).toLocaleString()}`} />
        </div>

        <div className="p-6 space-y-1 border-t md:border-t-0 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Payment & status
          </p>
          <SnapshotRow label="Order status" value={order.status} />
          <SnapshotRow label="Paid" value={order.isPaid ? 'Yes (Paystack)' : 'No'} />
          <SnapshotRow
            label="Paid at"
            value={order.paidAt ? new Date(order.paidAt).toLocaleString() : '—'}
          />
          <SnapshotRow label="Paystack ref" value={order.paymentId ? `…${String(order.paymentId).slice(-8)}` : '—'} />
        </div>

        <div className="p-6 space-y-1 border-t lg:border-t-0 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Parties
          </p>
          <SnapshotRow label="Customer" value={order.customerName} />
          <SnapshotRow label="Email" value={order.customerEmail} />
          <SnapshotRow label="Phone" value={order.customerPhone} />
          <SnapshotRow label="Vendor" value={order.vendorName} />
        </div>

        <div className="p-6 space-y-3 border-t lg:border-t-0 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Delivery & case notes
          </p>
          <SnapshotRow
            label="Address"
            value={[order.shippingAddress, order.shippingCity, order.shippingRegion].filter(Boolean).join(', ') || '—'}
          />
          <SnapshotRow label="Carrier" value={order.carrier} />
          <SnapshotRow label="Tracking" value={order.trackingNumber} />
          <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/80 mt-2">
            <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Customer reason (order)</p>
            <p className="text-[11px] text-slate-700 font-medium leading-relaxed italic">
              &quot;{order.disputeReason || 'No reason on order record'}&quot;
            </p>
          </div>
          {supportDispute && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Dispute ledger · {supportDispute.category || 'General'}
              </p>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {supportDispute.description || 'No description'}
              </p>
            </div>
          )}
          {!supportDispute && (
            <p className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              No Dispute Center thread yet — only order-level dispute flag. Ask parties to use FLA Dispute Chat for evidence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
