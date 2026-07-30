"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, Store } from 'lucide-react';
import Swal from 'sweetalert2';
import { getImageUrl, getVendorDisplayLocation } from '@/lib/utils';
import { storeHomePath } from '@/lib/storefront';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import {
  getMarketplaceReturn,
  markMarketplaceScrollRestore,
} from '@/lib/marketplace-return';
import { getStoreReturn, markStoreScrollRestore } from '@/lib/store-return';
import { resolveStoreTheme } from '@/lib/store-theme';

type ProductDetail = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  hasSizes?: boolean;
  hasColors?: boolean;
  stock?: number;
  tailoringTime?: string;
  vendorId?: string | { _id?: string; shopName?: string; storeSlug?: string; location?: string; region?: string };
  vendorName?: string;
  storeSlug?: string;
  region?: string;
  vendorLocation?: string;
};

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function StoreProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || '');
  const productId = String(params?.productId || '');
  const { addToCart } = useCart();
  const { isAuthenticated, user, token } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [storeVendor, setStoreVendor] = useState<{
    storeAccentColor?: string;
    storeThemeColor?: string;
    productTypes?: string;
  } | null>(null);
  const [shopName, setShopName] = useState('Store');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!slug || !productId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [storeRes, productRes] = await Promise.all([
          fetch(`${apiBase()}/users/store/${encodeURIComponent(slug)}`),
          fetch(`${apiBase()}/products/${encodeURIComponent(productId)}`),
        ]);

        if (!storeRes.ok) throw new Error('Store not found');
        if (!productRes.ok) throw new Error('Product not found');

        const storeData = await storeRes.json();
        const p: ProductDetail = await productRes.json();

        const vendorObj = typeof p.vendorId === 'object' && p.vendorId ? p.vendorId : null;
        const productVendorId =
          vendorObj?._id || (typeof p.vendorId === 'string' ? p.vendorId : null);
        const storeVendorId = storeData.vendor?._id;

        if (
          productVendorId &&
          storeVendorId &&
          String(productVendorId) !== String(storeVendorId)
        ) {
          throw new Error('This product is not part of this store');
        }

        if (cancelled) return;
        setProduct(p);
        setStoreVendor(storeData.vendor || null);
        setShopName(storeData.vendor?.shopName || storeData.vendor?.name || p.vendorName || 'Store');
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, productId]);

  const hasSizes = product?.hasSizes !== false && (product?.sizes?.length ?? 0) > 0;
  const hasColors = product?.hasColors !== false && (product?.colors?.length ?? 0) > 0;
  const soldOut = (product?.stock ?? 0) <= 0;
  const images = product?.images?.length ? product.images : ['/product-1.jpg'];

  const vendorIdStr =
    typeof product?.vendorId === 'object' && product?.vendorId
      ? product.vendorId._id
      : typeof product?.vendorId === 'string'
        ? product.vendorId
        : undefined;

  const location = getVendorDisplayLocation({
    location: product?.vendorLocation,
    region: product?.region,
  });

  const handleAddToCart = () => {
    if (!product || soldOut) return;
    if (hasSizes && !selectedSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Size Required',
        text: 'Please select a size to continue.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }
    if (hasColors && !selectedColor) {
      Swal.fire({
        icon: 'warning',
        title: 'Color Required',
        text: 'Please select a color to continue.',
        confirmButtonColor: '#0f172a',
      });
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
      vendorName: product.vendorName || shopName,
      vendorRegion: product.region,
      tailoringTime: product.tailoringTime,
    });
    setIsAdding(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Added to cart',
      showConfirmButton: false,
      timer: 2500,
    });
  };

  const handleBuyNow = async () => {
    if (!product || soldOut) return;
    if (!isAuthenticated) {
      const { isConfirmed: wantAccount, isDenied: wantGuest, isDismissed } = await Swal.fire({
        title: 'CHOOSE CHECKOUT',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-brand-lemon/10 p-4 rounded-xl border border-brand-lemon/20">
                    <h4 class="font-black text-slate-900 mb-2">Sign In / Create Account (Recommended)</h4>
                    <ul class="text-xs text-slate-700 space-y-1 list-disc pl-4">
                        <li>Monetize your order and earn</li>
                        <li>Full buyer protection</li>
                        <li>Ability to open disputes</li>
                    </ul>
                    <div class="mt-3 flex gap-2">
                        <button id="swal-signin-btn" class="flex-1 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Sign In</button>
                        <button id="swal-register-btn" class="flex-1 py-2.5 border-2 border-slate-900 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">Create Account</button>
                    </div>
                </div>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 class="font-black text-slate-500 mb-2">Guest Checkout</h4>
                    <ul class="text-xs text-slate-500 space-y-1 list-disc pl-4">
                        <li>Pay securely via Paystack</li>
                        <li>Receipt sent to your email</li>
                        <li>Receive SMS notification with vendor's WhatsApp</li>
                    </ul>
                </div>
            </div>
        `,
        showCancelButton: false,
        showConfirmButton: false,
        showDenyButton: true,
        denyButtonText: 'Buy without Account',
        denyButtonColor: '#64748b',
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
        },
        customClass: {
            popup: 'rounded-[32px] border-none shadow-2xl p-6 md:p-8 bg-white w-full max-w-md',
            title: 'text-xl font-black text-slate-900 tracking-tighter uppercase mb-2',
            actions: 'flex flex-col gap-2 w-full mt-4',
            denyButton: 'bg-slate-100 text-slate-500 rounded-full px-6 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all w-full m-0',
        }
      });

      if (wantAccount) {
          const intent = sessionStorage.getItem('fla_checkout_intent') || 'register';
          sessionStorage.removeItem('fla_checkout_intent');
          const returnUrl = encodeURIComponent(window.location.pathname);
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
                          <input id="guest-whatsapp" type="tel" placeholder="e.g. 024xxxxxxx" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                      </div>
                      <div class="space-y-2">
                          <label class="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Email Address</label>
                          <input id="guest-email" type="email" placeholder="e.g. you@example.com" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-lemon/20" />
                      </div>
                  </div>
              `,
              showCancelButton: true,
              confirmButtonText: 'Continue',
              cancelButtonText: 'Cancel',
              preConfirm: () => {
                  const phone = (document.getElementById('guest-whatsapp') as HTMLInputElement).value;
                  const email = (document.getElementById('guest-email') as HTMLInputElement).value;
                  
                  if (!phone || !email) {
                      Swal.showValidationMessage('Please provide both WhatsApp number and Email');
                      return false;
                  }
                  return { phone, email };
              },
              customClass: {
                  popup: 'rounded-3xl border border-slate-100 shadow-2xl p-10 bg-white',
                  title: 'text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6',
                  confirmButton: 'bg-slate-900 text-white rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mx-2 shadow-lg',
                  cancelButton: 'bg-slate-100 text-slate-500 rounded-full px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all mx-2'
              },
          });

          if (!guestDetails) return;
          processCheckout(guestDetails);
          return;
      } else {
          return; // dismissed
      }
    } else {
      processCheckout(null);
    }
  };

  const processCheckout = async (guestInfo: { phone: string, email: string } | null) => {

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
      Swal.fire({
        title: 'PREPARING PAYMENT...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

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
        vendorName: product.vendorName || shopName,
        shippingAddress: formValues.deliveryAddress,
        shippingCity: formValues.deliveryCity,
        shippingRegion: formValues.deliveryRegion,
        customerName: guestInfo ? \`Guest (\${guestInfo.phone})\` : user?.name,
        customerEmail: guestInfo ? guestInfo.email : user?.email,
        customerPhone: guestInfo ? guestInfo.phone : user?.phone,
        customerId: guestInfo ? null : (user?._id || user?.id || user?.userId),
        isGuestCheckout: !!guestInfo,
        guestWhatsApp: guestInfo?.phone || null,
        paymentMethod: 'paystack',
        notes: 'Storefront Checkout',
      };

      const response = await fetch(`${apiBase()}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-[4/5] bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-slate-200 rounded-xl" />
            <div className="h-6 w-1/3 bg-slate-200 rounded-xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
          Product not found
        </h1>
        <p className="text-slate-500 text-sm">{error}</p>
        <Link
          href={storeHomePath(slug)}
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-lemon text-slate-900 rounded-full text-xs font-black uppercase tracking-widest"
        >
          Back to store
        </Link>
      </main>
    );
  }

  const theme = resolveStoreTheme(storeVendor);

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            const ret = getMarketplaceReturn();
            markMarketplaceScrollRestore(ret);
            router.push(ret.path, { scroll: false });
          }}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to marketplace
        </button>
        <button
          type="button"
          onClick={() => {
            const ret = getStoreReturn(slug);
            markStoreScrollRestore(ret);
            router.push(ret.path, { scroll: false });
          }}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900"
        >
          <Store className="w-4 h-4" />
          {shopName}
        </button>
      </div>

      <section className="max-w-6xl mx-auto px-4 py-6 md:py-10 grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <Image
              src={getImageUrl(images[imageIndex])}
              alt={product.name}
              fill
              unoptimized
              className={`object-contain p-6 ${soldOut ? 'opacity-50 grayscale' : ''}`}
              priority
            />
            {soldOut && (
              <span className="absolute top-4 left-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                Sold out
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                    i === imageIndex ? '' : 'border-transparent'
                  }`}
                  style={i === imageIndex ? { borderColor: theme.accent } : undefined}
                >
                  <Image src={getImageUrl(img)} alt="" fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <button
              type="button"
              onClick={() => {
                const ret = getStoreReturn(slug);
                markStoreScrollRestore(ret);
                router.push(ret.path, { scroll: false });
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue"
            >
              by {shopName}
            </button>
            <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">
              {product.name}
            </h1>
            <p className="mt-3 text-2xl font-black text-slate-900">
              GHS {Number(product.price).toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-400">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                  soldOut
                    ? 'text-slate-400'
                    : (product.stock ?? 0) <= 5
                      ? 'text-orange-500'
                      : 'text-emerald-600'
                }`}
              >
                {soldOut
                  ? 'Sold out'
                  : (product.stock ?? 0) <= 5
                    ? `Only ${product.stock} left`
                    : `${product.stock} in stock`}
              </span>
              {location && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5 text-brand-lemon" />
                  {location}
                </span>
              )}
              {product.tailoringTime && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5 text-brand-lemon" />
                  {product.tailoringTime}
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          {hasSizes && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || []).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
                      selectedSize === size
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasColors && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.colors || []).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
                      selectedColor === color
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={soldOut || isAdding}
              onClick={handleAddToCart}
              className="flex-1 px-8 py-4 rounded-full text-slate-900 text-[11px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: theme.accent }}
            >
              Add to cart
            </button>
            <button
              type="button"
              disabled={soldOut}
              onClick={handleBuyNow}
              className="flex-1 px-8 py-4 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              Buy now
            </button>
          </div>

          <Link
            href="/shop"
            className="inline-block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
          >
            Browse FLA marketplace →
          </Link>
        </div>
      </section>

      <div className="text-center pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Powered by{' '}
          <Link href="/" className="text-brand-blue hover:text-slate-900">
            FLA
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
