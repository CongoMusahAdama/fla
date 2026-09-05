"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Store } from 'lucide-react';
import Swal from 'sweetalert2';
import { getImageUrl } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getMarketplaceReturn, markMarketplaceScrollRestore } from '@/lib/marketplace-return';
import { storeHomePath } from '@/lib/storefront';

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function ProductContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = String(params?.productId || '');
  const refCode = searchParams.get('ref');
  const { addToCart } = useCart();
  const { isAuthenticated, user, token } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refereeStore, setRefereeStore] = useState<{ name: string; refereeStoreSlug: string } | null>(null);

  const goBackToMarketplace = () => {
    const ret = getMarketplaceReturn();
    markMarketplaceScrollRestore(ret);
    router.push(ret.path, { scroll: false });
  };

  // Fetches the plain product, then (if arriving via a referral link) the referee's markup
  // for it — sequentially, in one state update. These used to be two independent effects
  // each calling setProduct; whichever fetch happened to resolve last silently won,
  // sometimes clobbering the marked-up price back to the vendor's plain price.
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const productRes = await fetch(`${apiBase()}/products/${encodeURIComponent(productId)}`);
        if (!productRes.ok) throw new Error('Product not found');
        let p = await productRes.json();

        if (refCode) {
          try {
            const priceRes = await fetch(
              `${apiBase()}/referral/product-price/${encodeURIComponent(refCode)}/${encodeURIComponent(productId)}`,
            );
            if (priceRes.ok) {
              const pricing = await priceRes.json();
              if (pricing?.sellPrice) {
                p = { ...p, price: pricing.sellPrice };
              }
            }
          } catch {
            // ignore — buyer just sees the vendor's plain price, no referral markup applied
          }
        }

        if (cancelled) return;
        setProduct(p);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, refCode]);

  useEffect(() => {
    if (!refCode) {
      setRefereeStore(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/referral/resolve/${encodeURIComponent(refCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) setRefereeStore(data);
        }
      } catch {
        // ignore — falls back to the normal marketplace/store back links
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refCode]);

  const hasSizes = product?.hasSizes !== false && (product?.sizes?.length ?? 0) > 0;
  const hasColors = product?.hasColors !== false && (product?.colors?.length ?? 0) > 0;
  const soldOut = (product?.stock ?? 0) <= 0;
  const images = product?.images?.length ? product.images : ['/placeholder.png'];

  const vendorIdStr =
    typeof product?.vendorId === 'object' && product?.vendorId
      ? product.vendorId._id
      : typeof product?.vendorId === 'string'
        ? product.vendorId
        : undefined;
        
  const shopName = typeof product?.vendorId === 'object' && product?.vendorId?.shopName 
    ? product.vendorId.shopName 
    : product?.vendorName || 'Store';
    
  const storeSlug = typeof product?.vendorId === 'object' && product?.vendorId?.storeSlug 
    ? product.vendorId.storeSlug 
    : product?.storeSlug;

  const handleAddToCart = () => {
    if (!product || soldOut) return;
    if (hasSizes && !selectedSize) {
      Swal.fire({ icon: 'warning', title: 'Size Required', confirmButtonColor: '#0f172a' });
      return;
    }
    if (hasColors && !selectedColor) {
      Swal.fire({ icon: 'warning', title: 'Color Required', confirmButtonColor: '#0f172a' });
      return;
    }

    setIsAdding(true);
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: images[0],
      size: selectedSize || 'N/A',
      color: selectedColor || 'N/A',
      quantity: 1,
      vendorId: vendorIdStr,
      vendorName: shopName,
      vendorRegion: product.region,
      tailoringTime: product.tailoringTime,
      refereeCode: refCode || undefined
    });
    setIsAdding(false);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Added to cart', showConfirmButton: false, timer: 2500 });
  };

  const processCheckout = async (guestInfo: { phone: string, email?: string } | null) => {
    if (!product) return;
    if (hasSizes && !selectedSize) {
      Swal.fire({ icon: 'warning', title: 'Size Required', confirmButtonColor: '#0f172a' });
      return;
    }
    if (hasColors && !selectedColor) {
      Swal.fire({ icon: 'warning', title: 'Color Required', confirmButtonColor: '#0f172a' });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Delivery details',
      html: `
        <input id="swal-address" class="swal2-input" placeholder="Delivery address">
        <input id="swal-city" class="swal2-input" placeholder="City">
        <input id="swal-region" class="swal2-input" placeholder="Region">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Pay with MoMo',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const deliveryAddress = (document.getElementById('swal-address') as HTMLInputElement)?.value;
        const deliveryCity = (document.getElementById('swal-city') as HTMLInputElement)?.value;
        const deliveryRegion = (document.getElementById('swal-region') as HTMLInputElement)?.value;
        if (!deliveryAddress || !deliveryCity || !deliveryRegion) {
          Swal.showValidationMessage('Please fill all delivery fields');
          return null;
        }
        return { deliveryAddress, deliveryCity, deliveryRegion };
      },
    });

    if (!formValues) return;

    try {
      Swal.fire({ title: 'PREPARING PAYMENT...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const orderData = {
        items: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: selectedSize || 'Universal',
            color: selectedColor || 'Universal',
            image: images[0],
            tailoringTime: product.tailoringTime,
          },
        ],
        totalProductAmount: product.price,
        deliveryFee: 0,
        totalAmount: product.price,
        vendorId: vendorIdStr,
        vendorName: shopName,
        shippingAddress: formValues.deliveryAddress,
        shippingCity: formValues.deliveryCity,
        shippingRegion: formValues.deliveryRegion,
        customerName: guestInfo ? `Guest (${guestInfo.phone})` : user?.name,
        customerEmail: guestInfo ? guestInfo.email : user?.email,
        customerPhone: guestInfo ? guestInfo.phone : user?.phone,
        paymentMethod: 'paystack',
        notes: 'Direct Product Checkout',
        refereeCode: refCode || undefined,
        // Return to the referral context (the referee's storefront, or this same product
        // page if that's not loaded yet) for referral purchases, regardless of guest vs
        // signed-in — otherwise the buyer lands back on the vendor's plain store, or the
        // generic dashboard, losing the referral price/context entirely.
        callbackPath: refCode
          ? refereeStore?.refereeStoreSlug
            ? `/ref/${refereeStore.refereeStoreSlug}`
            : `/product/${product._id}?ref=${refCode}`
          : storeSlug
            ? storeHomePath(storeSlug)
            : '/shop',
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${apiBase()}/orders`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to initialize payment');
      }

      const { paymentLink } = await response.json();
      Swal.close();
      window.location.href = paymentLink;
    } catch (e: any) {
      Swal.fire('Payment Error', e.message, 'error');
    }
  };

  const handleBuyNow = async () => {
    if (!product || soldOut) return;
    if (hasSizes && !selectedSize) {
      Swal.fire({ icon: 'warning', title: 'Size Required', confirmButtonColor: '#0f172a' });
      return;
    }
    if (hasColors && !selectedColor) {
      Swal.fire({ icon: 'warning', title: 'Color Required', confirmButtonColor: '#0f172a' });
      return;
    }
    if (!isAuthenticated) {
      const { isConfirmed: wantAccount, isDenied: wantGuest } = await Swal.fire({
        title: 'CHOOSE CHECKOUT',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-brand-lemon/10 p-4 rounded-xl border border-brand-lemon/20">
                    <h4 class="font-black text-slate-900 mb-2">Sign In / Create Account (Recommended)</h4>
                    <div class="mt-3 flex gap-2">
                        <button id="swal-signin-btn" class="flex-1 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Sign In</button>
                        <button id="swal-register-btn" class="flex-1 py-2.5 border-2 border-slate-900 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">Create Account</button>
                    </div>
                </div>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 class="font-black text-slate-500 mb-2">Guest Checkout</h4>
                </div>
            </div>
        `,
        showCancelButton: false,
        showConfirmButton: false,
        showDenyButton: true,
        denyButtonText: 'Buy without Account',
        didOpen: () => {
            document.getElementById('swal-signin-btn')?.addEventListener('click', () => {
                (Swal.getPopup() as any)?.__swalSignIn?.();
                Swal.clickConfirm();
                sessionStorage.setItem('fla_checkout_intent', 'signin');
            });
            document.getElementById('swal-register-btn')?.addEventListener('click', () => {
                Swal.clickConfirm();
                sessionStorage.setItem('fla_checkout_intent', 'register');
            });
        }
      });

      if (wantAccount) {
          const intent = sessionStorage.getItem('fla_checkout_intent') || 'register';
          sessionStorage.removeItem('fla_checkout_intent');
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          if (intent === 'signin') {
              router.push(`/auth?role=customer&view=login&redirect=${returnUrl}`);
          } else {
              router.push(`/auth?role=customer&view=register&redirect=${returnUrl}`);
          }
          return;
      } else if (wantGuest) {
          const { value: guestDetails } = await Swal.fire({
              title: 'GUEST DETAILS',
              html: `
                  <div class="text-left space-y-4 py-4">
                      <div class="space-y-2">
                          <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">WhatsApp Number</label>
                          <input id="guest-whatsapp" type="tel" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                  </div>
              `,
              preConfirm: () => {
                  const phone = (document.getElementById('guest-whatsapp') as HTMLInputElement).value;
                  if (!phone) { Swal.showValidationMessage('Please provide your WhatsApp number'); return false; }
                  return { phone };
              }
          });
          if (!guestDetails) return;
          processCheckout(guestDetails);
      }
    } else {
      processCheckout(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Product not found</h1>
        <p className="text-slate-500 text-sm">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-4 flex items-center justify-between gap-3">
        {refereeStore ? (
          <Link href={`/ref/${refereeStore.refereeStoreSlug}`} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {refereeStore.name}'s store
          </Link>
        ) : (
          <>
            <button type="button" onClick={goBackToMarketplace} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to marketplace
            </button>
            {storeSlug && (
              <Link href={storeHomePath(storeSlug)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900">
                <Store className="w-4 h-4" /> {shopName}
              </Link>
            )}
          </>
        )}
      </div>

      <section className="max-w-6xl mx-auto px-4 py-6 md:py-10 grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <Image src={getImageUrl(images[imageIndex])} alt={product.name} fill unoptimized className={`object-contain p-6 ${soldOut ? 'opacity-50 grayscale' : ''}`} />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setImageIndex(i)} className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 ${imageIndex === i ? 'border-brand-lemon' : 'border-transparent hover:border-slate-200'}`}>
                  <Image src={getImageUrl(img)} alt="Thumb" fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-4">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-slate-900">GHS {product.price.toFixed(2)}</span>
              {soldOut && <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600">Sold Out</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 py-6 border-y border-slate-200">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tailoring Time</p>
              <p className="text-sm font-semibold text-slate-900">{product.tailoringTime || 'Immediate'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Stock</p>
              <p className={`text-sm font-semibold ${soldOut ? 'text-red-600' : 'text-slate-900'}`}>
                {soldOut ? 'Sold out' : `${product.stock} available`}
              </p>
            </div>
            {(product.vendorLocation || product.region) && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-semibold text-slate-900">{product.vendorLocation || product.region}</p>
              </div>
            )}
          </div>

          <div className="py-8 space-y-8 flex-1">
            {hasSizes && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">Size</span>
                  {selectedSize && <span className="text-xs font-semibold text-slate-500">{selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`h-12 px-6 rounded-2xl text-sm font-bold border-2 transition-all ${selectedSize === s ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {hasColors && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">Color</span>
                  {selectedColor && <span className="text-xs font-semibold text-slate-500">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button key={c} onClick={() => setSelectedColor(c)} className={`h-12 px-6 rounded-2xl text-sm font-bold border-2 transition-all ${selectedColor === c ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="pt-4">
                <span className="block text-xs font-black uppercase tracking-widest text-slate-900 mb-3">Details</span>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>

          <div className="pt-6 mt-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleAddToCart} disabled={soldOut || isAdding} className="flex-1 h-14 bg-white border-2 border-slate-400 shadow-sm text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl hover:border-slate-900 hover:shadow-md transition-all disabled:opacity-50">
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
              <button onClick={handleBuyNow} disabled={soldOut} className="flex-1 h-14 bg-brand-lemon text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-lemon-hover shadow-xl shadow-brand-lemon/20 transition-all disabled:opacity-50">
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function StandaloneProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-brand-lemon border-t-transparent animate-spin rounded-full"></div></div>}>
            <ProductContent />
        </Suspense>
    );
}
