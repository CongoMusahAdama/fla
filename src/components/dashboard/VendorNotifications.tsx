
"use client";
import React from 'react';
import { Bell, MessageSquare } from 'lucide-react';

interface VendorNotificationsProps {
  notifications: any[];
}

export const VendorNotifications: React.FC<VendorNotificationsProps> = ({
  notifications
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
        <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Alert Center</h1>
            <p className="text-slate-500 text-sm mt-1">Stay updated with your sales and system alerts.</p>
        </div>
        <div className="space-y-4">
            {notifications.length > 0 ? (
                notifications.map((n, i) => (
                    <div key={n._id || i} className={`p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex gap-5 items-start hover:shadow-md transition-shadow ${!n.isRead ? 'border-brand-lemon' : ''}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-brand-lemon text-slate-900' : 'bg-slate-50 text-slate-300'}`}>
                            <Bell className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">{n.title}</h3>
                                <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-20 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                    <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No new alerts.</p>
                    <p className="text-slate-300 text-xs mt-1">We'll notify you here about sales and system updates.</p>
                </div>
            )}
        </div>
    </div>
  );
};
