
"use client";
import React from 'react';
import Image from 'next/image';
import { Package, Plus, Search, Edit2, Eye, EyeOff, Trash2, ShoppingBag, Clock, MapPin } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

export interface Product {
  id: any;
  name: string;
  price: string;
  image: string;
  images?: { url: string, label: string }[];
  status: string;
  sales: number;
  quantity: number;
  tailoringTime: string;
  region: string;
  description: string;
  category: string;
  imageLabels?: string[];
  sizes?: string[];
  hasSizes?: boolean;
  colors?: string[];
  hasColors?: boolean;
  isActive?: boolean;
}

interface VendorProductsProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: any) => void;
  onToggleStatus: (id: any, currentStatus: string) => void;
  onAddNew: () => void;
}

export const VendorProducts: React.FC<VendorProductsProps> = ({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddNew
}) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Manage Your Shop</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Refine your heritage designs and track global stock levels.</p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-3 bg-slate-900 text-brand-lemon px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          Stock New Item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
            <div className="aspect-[3/4] rounded-[28px] overflow-hidden bg-slate-50 relative mb-6 shadow-inner border border-slate-50">
              <Image
                src={getImageUrl(product.image)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized={true}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/product-1.jpg';
                }}
              />
              
              {product.isActive === false && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Hidden from Store</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate pr-4">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">GH₵ {product.price}</p>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                    product.quantity === 0 
                      ? 'text-red-500 bg-red-50' 
                      : product.status === 'Low Stock' 
                        ? 'text-orange-500 bg-orange-50' 
                        : 'text-emerald-500 bg-emerald-50'
                  }`}>
                    {product.quantity === 0 ? 'Sold Out' : product.status}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{product.tailoringTime || '3 Days'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 text-right">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      {product.region && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{product.region}</span>
                      )}
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-lemon" style={{ width: `${Math.min((product.sales || 0) * 10, 100)}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{(product.sales || 0)} Sales</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-2 border-t border-slate-50 mt-1">
                  <button
                    onClick={() => onEdit(product)}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
              </div>
            </div>

            {/* Quick Stock Indicator */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse ${
              product.quantity > 5 ? 'bg-emerald-400' : 'bg-red-400'
            }`} />
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Designs Found</h3>
            <p className="text-slate-400 text-sm mt-1 mb-8">Your digital atelier is currently empty.</p>
            <button
              onClick={onAddNew}
              className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Initialize Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
