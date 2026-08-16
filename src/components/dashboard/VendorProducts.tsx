
"use client";
import React from 'react';
import Image from 'next/image';
import { Package, Plus, Search, Edit2, Eye, EyeOff, Trash2, ShoppingBag, Clock, MapPin, Link2, X, Instagram } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { TableSearch } from '@/components/ui/TableSearch';
import { matchesTableSearch } from '@/lib/table-search';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useAuth } from '@/context/AuthContext';

interface ReferralSelector {
  _id: string;
  name: string;
  refereeCode: string;
  phone?: string;
  socialMediaLinks: string[];
  selectedAt: string;
}

function ReferralSelectorsModal({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const { token } = useAuth();
  const [selectors, setSelectors] = React.useState<ReferralSelector[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/referral/vendor/product-selectors/${productId}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setSelectors(await res.json());
      } catch (err) {
        console.error('Error loading referral selectors:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, token]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-lg max-h-[85dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="shrink-0 px-6 py-5 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-white/60 mb-1">Referral partners</p>
            <h2 className="text-lg font-semibold truncate">{productName}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 shrink-0 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
            </div>
          ) : selectors.length === 0 ? (
            <div className="text-center py-10">
              <Link2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No referees have picked this product yet.</p>
            </div>
          ) : (
            selectors.map((s) => (
              <div key={s._id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{s.refereeCode}</p>
                  </div>
                  <WhatsAppButton
                    phone={s.phone}
                    message={`Hi ${s.name}, thanks for featuring "${productName}" on your FLA store! Would love to send you a giveaway to create content with.`}
                    size="sm"
                    missingContactRole="referee"
                  />
                </div>
                {s.socialMediaLinks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                    {s.socialMediaLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-brand-blue hover:underline truncate max-w-full"
                      >
                        <Instagram className="w-3 h-3 shrink-0" /> {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
  onToggleStatus: (id: any, isActive: boolean) => void;
  onAddNew: () => void;
}

export const VendorProducts: React.FC<VendorProductsProps> = ({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddNew
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectorsFor, setSelectorsFor] = React.useState<Product | null>(null);

  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      matchesTableSearch(searchQuery, p.name, p.category, p.region, p.status, p.price, p.tailoringTime),
    );
  }, [products, searchQuery]);

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

      <TableSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products by name, category, region..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.length > 0 ? filteredProducts.map((product) => (
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
                    onClick={() => onToggleStatus(product.id, product.isActive !== false)}
                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      product.isActive === false
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    {product.isActive === false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {product.isActive === false ? 'Show' : 'Hide'}
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
              </div>
              <button
                onClick={() => setSelectorsFor(product)}
                className="w-full py-2.5 bg-white border border-slate-100 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Link2 className="w-3 h-3" />
                Referral Partners
              </button>
            </div>

            {/* Quick Stock Indicator */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse ${
              product.quantity > 5 ? 'bg-emerald-400' : 'bg-red-400'
            }`} />
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">
              {products.length > 0 ? 'No products match your search' : 'No Designs Found'}
            </h3>
            <p className="text-slate-400 text-sm mt-1 mb-8">
              {products.length > 0 ? 'Try a different keyword.' : 'Your digital atelier is currently empty.'}
            </p>
            {products.length === 0 && (
              <button
                onClick={onAddNew}
                className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Initialize Store
              </button>
            )}
          </div>
        )}
      </div>

      {selectorsFor && (
        <ReferralSelectorsModal
          productId={selectorsFor.id}
          productName={selectorsFor.name}
          onClose={() => setSelectorsFor(null)}
        />
      )}
    </div>
  );
};
