
"use client";
import React from 'react';
import { ShoppingBag, User, MapPin, Eye, Printer, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  canShowOrderWhatsApp,
  normalizeWhatsAppPhone,
  buildVendorToCustomerMessage,
  buildDisputeWhatsAppMessage,
  openWhatsAppChat,
  promptMissingWhatsAppContact,
} from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.502-5.485-1.454l-.394-.227-4.078 1.07 1.089-3.975-.249-.396A9.816 9.816 0 011.942 12.07C1.942 6.656 6.355 2.24 11.77 2.24s9.829 4.417 9.829 9.831c0 5.414-4.417 9.831-9.83 9.831m11.834-11.83c0-6.521-5.303-11.825-11.825-11.825C5.461 0 0 5.461 0 11.825c0 2.083.54 4.117 1.571 5.905L0 24l6.446-1.691c1.71 1.017 3.65 1.554 5.62 1.554 6.523 0 11.825-5.303 11.825-11.825" />
  </svg>
);

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  shippingCity: string;
  shippingRegion: string;
  shippingAddress: string;
  status: string;
  deliveryType: string;
  isPaid?: boolean;
  paymentProof?: string;
  items?: any[];
  pickupPoint?: string;
  carrier?: string;
  totalAmount: number;
  adminCommission: number;
  vendorShare: number;
}

interface VendorOrdersProps {
  orders: Order[];
  shopName?: string;
  onViewProof: (proof: string) => void;
  onShip: (id: string) => void;
  onUpdateStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onPrintLabel: (order: Order) => void;
}

export const VendorOrders: React.FC<VendorOrdersProps> = ({
  orders,
  shopName,
  onViewProof,
  onShip,
  onUpdateStatus,
  onDelete,
  onPrintLabel
}) => {
  const [activeTab, setActiveTab] = React.useState('All');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const chatWithCustomer = (order: Order) => {
    const phone = normalizeWhatsAppPhone(order.customerPhone);
    if (!phone) {
      promptMissingWhatsAppContact('customer');
      return;
    }
    openWhatsAppChat(phone, buildVendorToCustomerMessage(order, shopName));
  };

  const renderCustomerWhatsApp = (order: Order, className = '') => {
    if (!canShowOrderWhatsApp(order)) return null;
    return (
      <button
        type="button"
        onClick={() => chatWithCustomer(order)}
        className={`inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 ${className}`}
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        WhatsApp
      </button>
    );
  };

  const filteredOrders = React.useMemo(() => {
    const ordersArray = orders || [];
    switch (activeTab) {
      case 'In delivery':
        return ordersArray.filter(o => [
          'preparing_shipment', 
          'in_transit_to_first_mile', 
          'in_transit', 
          'arrived_at_first_mile', 
          'in_transit_to_last_mile', 
          'shipped'
        ].includes(o.status));
      case 'completed':
        return ordersArray.filter(o => ['delivered', 'completed'].includes(o.status));
      case 'cancelled':
        return ordersArray.filter(o => ['cancelled'].includes(o.status));
      default:
        return ordersArray;
    }
  }, [orders, activeTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page if orders length changes (e.g. on search/filter)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length]);

  const tabs = ['All', 'In delivery', 'completed', 'cancelled'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Order Ledger</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Track and fulfillment customer fashion requests across the global network.</p>
      </div>

      {/* Status Filtering Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
              activeTab === tab 
                ? 'bg-slate-900 text-brand-lemon border-slate-900 shadow-lg shadow-slate-900/10' 
                : 'bg-white text-slate-400 border-slate-50 hover:border-slate-100'
            }`}
          >
            {tab}
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === tab ? 'bg-brand-lemon/20 text-brand-lemon' : 'bg-slate-100 text-slate-400'}`}>
              {tab === 'All' ? (orders || []).length : 
               tab === 'In delivery' ? (orders || []).filter(o => ['preparing_shipment', 'in_transit_to_first_mile', 'in_transit', 'arrived_at_first_mile', 'in_transit_to_last_mile', 'shipped'].includes(o.status)).length :
               tab === 'completed' ? (orders || []).filter(o => ['delivered', 'completed'].includes(o.status)).length :
               tab === 'cancelled' ? (orders || []).filter(o => ['cancelled'].includes(o.status)).length : 0}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Mobile View: Cards */}
        <div className="grid md:hidden grid-cols-1 gap-6">
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order, i) => (
              <div key={order._id || i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-lemon" />
                    <span className="font-black text-slate-900 text-[10px] uppercase tracking-widest">#ORD-{order._id?.slice(-8)?.toUpperCase() || 'UNKNOWN'}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${
                    order.status === 'delivered' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : order.status === 'cancelled'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {order.status || 'Preprocessing'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{order.customerName || 'Anonymous Partner'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  {order.items && order.items.length > 0 && (
                    <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border border-slate-100 flex-shrink-0">
                      <img 
                        src={getImageUrl(order.items[0].image)} 
                        alt={order.items[0].name} 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = '/product-1.jpg'}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 uppercase text-[10px] truncate">{order.items?.[0]?.name || order.productName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                      {order.items?.[0]?.size || 'Standard'} • Qty: {order.items?.[0]?.quantity || 1}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-slate-900 font-black text-[9px] uppercase">
                            <MapPin className="w-3 h-3 text-brand-black" />
                            {order.shippingCity || 'Global Base'}
                        </div>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${order.deliveryType === 'inter-regional' ? 'bg-slate-900 text-white' : 'bg-brand-lemon text-slate-900'}`}>
                            {order.deliveryType === 'inter-regional' ? 'Inter-Region' : 'Intra-Region'}
                        </span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium italic mt-2 line-clamp-3 leading-snug">
                        {order.shippingAddress}
                    </p>
                  </div>
                </div>

                <div className={`pt-2 flex flex-wrap gap-2 transition-all duration-500`}>
                  {order.paymentProof && (
                    <button
                      onClick={() => onViewProof(order.paymentProof!)}
                      className="flex-1 h-11 bg-brand-lemon text-slate-900 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-lemon/10"
                    >
                      <Eye className="w-3.5 h-3.5" /> Receipt
                    </button>
                  )}
                  
                  {(order.status === 'disputed' || order.status === 'cancelled') ? (
                    <>
                      <WhatsAppButton
                        phone={order.customerPhone}
                        message={buildDisputeWhatsAppMessage({
                          orderRef: order._id.slice(-6).toUpperCase(),
                          category: 'dispute',
                          senderName: shopName,
                          talkingTo: 'customer',
                        })}
                        label="WhatsApp"
                        size="sm"
                        missingContactRole="customer"
                        className="flex-1 !py-0 h-11"
                      />
                      <Link
                        href={`/dispute/find?orderId=${order._id}`}
                        className="flex-1 h-11 bg-orange-500 text-white rounded-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
                      >
                        Dispute Center
                      </Link>
                    </>
                  ) : (
                    renderCustomerWhatsApp(order, 'flex-1 h-11 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20')
                  )}
                  <button
                    onClick={() => onUpdateStatus(order._id, order.status)}
                    className="flex-1 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10"
                  >
                    Update Phase
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 text-center rounded-[32px] border border-slate-100">
              <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No orders found</p>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800">Order Ref</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800">Customer Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800">Design Perspective</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800">Destiny (Shipping)</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800">Operational Phase</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-800">Financial Insight</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Studio Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order, i) => (
                  <tr key={order._id || i} className="hover:bg-slate-50/50 transition-all duration-300 group">
                    <td className="px-10 py-8 font-black text-slate-900 text-xs border-r border-slate-50 relative">
                      <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-lemon" />
                          #ORD-{order._id?.slice(-8)?.toUpperCase() || 'UNKNOWN'}
                      </div>
                    </td>
                    <td className="px-10 py-8 border-r border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-brand-lemon transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{order.customerName || 'Anonymous Partner'}</p>
                          {order.pickupPoint && (
                              <div className="flex items-center gap-1 mt-1.5">
                                  <MapPin className="w-3 h-3 text-brand-black" />
                                  <span className="text-[8px] font-black bg-brand-lemon/20 text-slate-900 px-1.5 py-0.5 rounded-md uppercase border border-brand-lemon/20">{order.pickupPoint}</span>
                              </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 font-bold text-slate-600 text-xs border-r border-slate-50 min-w-[200px]">
                      <div className="flex items-center gap-4">
                          {order.items && order.items.length > 0 && (
                              <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm">
                                  <img 
                                      src={getImageUrl(order.items[0].image)} 
                                      alt={order.items[0].name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => (e.target as HTMLImageElement).src = '/product-1.jpg'}
                                  />
                              </div>
                          )}
                          {order.items && order.items.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-black text-slate-900 uppercase text-[10px] line-clamp-1">{order.items[0].name}</span>
                              {order.items.length > 1 && (
                                <span className="text-[8px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter">+{order.items.length - 1} Collection Members</span>
                              )}
                              <span className="text-[10px] font-bold text-slate-400">Qty: {order.items[0].quantity} • {order.items[0].size || 'Standard'}</span>
                            </div>
                          ) : (
                            <span className="font-black text-slate-900 uppercase text-[10px]">{order.productName || 'Custom Craft'}</span>
                          )}
                      </div>
                    </td>
                    <td className="px-10 py-8 border-r border-slate-50 min-w-[320px]">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase">
                                <MapPin className="w-3.5 h-3.5 text-brand-black" />
                                {order.shippingCity || 'Global Base'}, {order.shippingRegion}
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter shadow-sm ${order.deliveryType === 'inter-regional' ? 'bg-slate-900 text-white' : 'bg-brand-lemon text-slate-900'}`}>
                                {order.deliveryType === 'inter-regional' ? 'Inter-Region' : 'Intra-Region'}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap">
                                {order.shippingAddress || 'Awaiting Detailed Explanation/Address...'}
                            </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 border-r border-slate-50">
                      <div className="flex flex-col gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit shadow-sm border ${
                          order.status === 'delivered' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border-red-100 ml-0'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {order.status || 'Preprocessing'}
                        </span>
                        
                        <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-100 flex flex-col gap-2 min-w-[180px] shadow-sm group-hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logistics</p>
                            <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg uppercase tracking-tighter shadow-xl shadow-slate-900/10">
                              {order.deliveryType === 'inter-regional' ? 'Inter-Region' : 'Intra-Region'}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                            Delivery fees are paid outside FLA — coordinate directly with the customer.
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 border-r border-slate-50 min-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-900 border-b border-slate-50 pb-1 mb-1">
                          <span className="uppercase text-slate-400">Gross:</span>
                          <span>GH₵ {order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-emerald-500">
                          <span className="uppercase text-slate-400">Net:</span>
                          <span>GH₵ {(order.vendorShare || (order.totalAmount * 0.9))?.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 pt-1 flex justify-between items-center text-[8px] font-black text-slate-300">
                          <span className="uppercase text-slate-400">Fee ({order.totalAmount > 0 ? (((order.adminCommission || (order.totalAmount * 0.1)) / order.totalAmount * 100)).toFixed(0) : '10'}%):</span>
                          <span>GH₵ {(order.adminCommission || (order.totalAmount * 0.1))?.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className={`flex justify-end gap-3 transition-all duration-500`}>
                        {order.paymentProof && (
                          <button
                            onClick={() => onViewProof(order.paymentProof!)}
                            className="w-11 h-11 bg-brand-lemon text-slate-900 rounded-2xl flex items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all group/btn active:scale-90"
                            title="Verify Receipt"
                          >
                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )}

                        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => onShip(order._id)}
                            className="px-6 py-3 bg-slate-900 text-brand-lemon rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 border border-white/10"
                          >
                            Initiate Launch
                          </button>
                        )}

                        {renderCustomerWhatsApp(order, 'px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20')}

                        <button
                          onClick={() => onPrintLabel(order)}
                          className="w-11 h-11 bg-white text-slate-400 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all active:scale-90"
                          title="Generate Manifest"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onUpdateStatus(order._id, order.status)}
                          className="px-6 py-3 bg-slate-100 text-slate-500 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                          Phase Update
                        </button>
                        
                        {(order.status === 'disputed' || order.status === 'cancelled') && (
                          <>
                            <WhatsAppButton
                              phone={order.customerPhone}
                              message={buildDisputeWhatsAppMessage({
                                orderRef: order._id.slice(-6).toUpperCase(),
                                category: 'dispute',
                                senderName: shopName,
                                talkingTo: 'customer',
                              })}
                              label="WhatsApp"
                              size="sm"
                              missingContactRole="customer"
                            />
                            <Link
                              href={`/dispute/find?orderId=${order._id}`}
                              className="px-6 py-3 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/10 active:scale-95 border border-white/10"
                            >
                              Dispute Center
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => onDelete(order._id)}
                          className="w-11 h-11 bg-white text-red-400 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                          title="Discard Reference"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-32 text-center bg-white">
                    <ShoppingBag className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter">Logistics Ledger Empty</h3>
                    <p className="text-slate-400 text-sm mt-1">Global sales will appear in this synchronized viewport.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span> Orders
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
    </div>
  );
};
