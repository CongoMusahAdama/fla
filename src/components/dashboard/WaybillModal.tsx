
"use client";
import React, { useRef } from 'react';
import { X, Printer, Truck, MapPin, User, Package, Phone } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { getVendorDisplayLocation } from '@/lib/utils';

interface WaybillModalProps {
  order: any;
  vendor: any;
  onClose: () => void;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({ order, vendor, onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Waybill-${order._id.slice(-8).toUpperCase()}`,
  });

  if (!order) return null;

  const vendorLocation = getVendorDisplayLocation(vendor);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Waybill Manifest</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Ready for Skynet Express Handoff</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handlePrint()}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-brand-lemon rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
            >
              <Printer className="w-3.5 h-3.5" /> Print Waybill
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {/* Printable Area */}
          <div ref={componentRef} className="bg-white shadow-sm border border-slate-200 mx-auto w-full max-w-[400px] p-6 text-slate-900 print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none">FLA LOGISTICS</h1>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">In Partnership with Skynet</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waybill #</p>
                <p className="text-sm font-black uppercase tracking-tighter">ORD-{order._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Consignee (Receiver) - HIGH VISIBILITY */}
            <div className="mb-6 bg-slate-900 text-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5 text-brand-lemon" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lemon">Consignee (Receiver)</span>
              </div>
              <h2 className="text-2xl font-black uppercase leading-tight mb-1">{order.customerName}</h2>
              <div className="flex items-center gap-2 text-xl font-black">
                <Phone className="w-5 h-5 text-brand-lemon" />
                {order.customerPhone}
              </div>
            </div>

            {/* Route & Destination */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Truck className="w-3 h-3 text-slate-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Origin (Vendor)</span>
                </div>
                <p className="text-[10px] font-black uppercase truncate">{vendor.shopName || 'Studio'}</p>
                {vendorLocation && (
                  <p className="text-[9px] font-bold text-slate-500">{vendorLocation}</p>
                )}
              </div>
              <div className="p-3 border-2 border-slate-900 rounded-xl bg-white">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3 h-3 text-brand-lemon fill-brand-lemon" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-900">Destination</span>
                </div>
                <p className="text-[10px] font-black uppercase truncate">{order.shippingCity}</p>
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">{order.pickupPoint || 'Main Hub'}</p>
              </div>
            </div>

            {/* Address Details */}
            <div className="mb-6 p-4 border border-dashed border-slate-300 rounded-xl">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Full Shipping Address</span>
              <p className="text-[11px] font-bold leading-relaxed">
                {order.shippingAddress}
              </p>
            </div>

            {/* Package Content */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Consignment Details</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <table className="w-full text-[10px]">
                  <tbody>
                    {order.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-200 last:border-0">
                        <td className="py-1 font-black uppercase">{item.name}</td>
                        <td className="py-1 text-right font-bold text-slate-400">x{item.quantity}</td>
                      </tr>
                    ))}
                    {!order.items && (
                      <tr>
                        <td className="py-1 font-black uppercase">{order.productName}</td>
                        <td className="py-1 text-right font-bold text-slate-400">x1</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Barcode Placeholder / QR */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
              <div className="w-full h-12 bg-slate-100 rounded flex items-center justify-center mb-2 overflow-hidden">
                {/* Simulated Barcode */}
                <div className="flex gap-1 h-full items-center opacity-30">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="bg-black" style={{ width: `${Math.random() * 4 + 1}px`, height: '80%' }} />
                  ))}
                </div>
              </div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">FLA-LOG-{order._id.slice(-8).toUpperCase()}</p>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-6 text-center">
              <p className="text-[7px] font-bold text-slate-400 leading-tight">
                This waybill is generated by FLA Marketplace. Skynet Express is the designated carrier. 
                Seal all packages securely. Fragile items must be marked clearly.
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-brand-lemon/10 rounded-2xl border border-brand-lemon/20 flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-lemon rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Skynet Pro-Tip</p>
              <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
                Skynet recommends scaling this print to <span className="font-black text-slate-900">65%</span> if using A4 paper to ensure maximum clarity for their automated scanners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
