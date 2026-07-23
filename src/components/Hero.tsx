"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { storeProductPath, resolveStoreSlug } from '@/lib/storefront';
import { useProductCategories } from '@/hooks/useProductCategories';
import { DEFAULT_PRODUCT_CATEGORY_LABELS } from '@/lib/product-categories';

const CATEGORY_FALLBACKS: Record<string, string> = {
  Electronics:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
  Accessories:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80',
  'Beauty/cosmetics':
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&q=80',
  'Home goods':
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&q=80',
  'Food/beverages':
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&q=80',
  Furniture:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80',
  'Children/Toys':
    'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop&q=80',
  Clothing:
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop&q=80',
  Shoes:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80',
  Bags:
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop&q=80',
  'Hardware items':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop&q=80',
  Kitchen:
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop&q=80',
};

const DEFAULT_CATEGORY_FALLBACK =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&q=80';

type DayProduct = {
  id: string;
  name: string;
  image: string;
  price?: number;
  category?: string;
  storeSlug?: string;
  vendorId?: string | { storeSlug?: string; _id?: string; id?: string };
};

type CategoryTile = {
  label: string;
  image: string;
};

/** Stable “today” index so hero images rotate once per calendar day. */
function daySeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

function pickToday(pool: DayProduct[], count: number): DayProduct[] {
  if (!pool.length) return [];
  const start = daySeed() % pool.length;
  const out: DayProduct[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

function productHref(p: DayProduct) {
  const slug = resolveStoreSlug(p.storeSlug, p.vendorId);
  if (slug) return storeProductPath(slug, p.id);
  return `/shop`;
}

function buildCategoryTiles(labels: string[], products: DayProduct[]): CategoryTile[] {
  const byCategory = new Map<string, string>();
  for (const p of products) {
    const cat = (p.category || '').trim();
    if (!cat || !p.image || byCategory.has(cat)) continue;
    byCategory.set(cat, p.image);
  }

  return labels.map((label) => ({
    label,
    image:
      byCategory.get(label) ||
      CATEGORY_FALLBACKS[label] ||
      DEFAULT_CATEGORY_FALLBACK,
  }));
}

export default function Hero() {
  const { categories } = useProductCategories({ includeAll: false });
  const [todayPicks, setTodayPicks] = useState<DayProduct[]>([]);
  const [categoryTiles, setCategoryTiles] = useState<CategoryTile[]>(() =>
    buildCategoryTiles(DEFAULT_PRODUCT_CATEGORY_LABELS.slice(0, 12), []),
  );

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const load = async () => {
      const tryUrls = [
        `${api}/products?limit=80&filter=${encodeURIComponent('Best Seller')}`,
        `${api}/products?limit=80&sort=latest`,
      ];

      let pool: DayProduct[] = [];

      for (const url of tryUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.products;
          if (!list?.length) continue;

          pool = list
            .filter((p: { images?: string[] }) => p.images?.[0])
            .map(
              (p: {
                _id: string;
                name: string;
                price?: number;
                category?: string;
                images?: string[];
                storeSlug?: string;
                vendorId?: string | { storeSlug?: string; _id?: string; id?: string };
              }) => ({
                id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                image: getImageUrl(p.images?.[0]),
                storeSlug: p.storeSlug,
                vendorId: p.vendorId,
              }),
            );

          if (pool.length) break;
        } catch {
          /* try next */
        }
      }

      if (pool.length) {
        setTodayPicks(pickToday(pool, 2));
      }
      setCategoryTiles(buildCategoryTiles(categories.slice(0, 12), pool));
    };

    load();
  }, [categories]);

  const main = todayPicks[0];
  const side = todayPicks[1];

  return (
    <section className="relative w-full overflow-hidden bg-[#f7f8fa]">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Dual promo — today’s product images */}
        <div className="grid lg:grid-cols-12 gap-4 md:gap-5">
          <Link
            href={main ? productHref(main) : '/shop'}
            className="lg:col-span-8 relative min-h-[260px] sm:min-h-[320px] lg:min-h-[380px] rounded-2xl overflow-hidden bg-slate-200 group block"
          >
            {main ? (
              <Image
                src={main.image}
                alt={main.name}
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10 lg:p-12 max-w-xl">
              <p className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-2">
                FLA
              </p>
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug text-balance">
                {main ? main.name : 'Everything you need, from trusted shops'}
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-sm leading-relaxed">
                {main?.price != null
                  ? `Today’s pick · GH₵${main.price.toLocaleString()}`
                  : 'Browse the marketplace or shop a vendor storefront — delivered across Ghana.'}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-white text-slate-900 text-sm font-semibold w-fit shadow-sm group-hover:bg-brand-lemon transition-colors">
                Shop now
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <div className="lg:col-span-4 grid grid-rows-2 gap-4 md:gap-5 min-h-[220px] lg:min-h-[380px]">
            <Link
              href={side ? productHref(side) : '/shop'}
              className="relative rounded-2xl overflow-hidden bg-slate-200 group block min-h-[140px]"
            >
              {side ? (
                <Image
                  src={side.image}
                  alt={side.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-lemon mb-1">
                  Top pick today
                </p>
                <p className="font-heading text-base font-bold text-white line-clamp-2">
                  {side?.name || 'Fresh from verified shops'}
                </p>
              </div>
            </Link>

            <Link
              href="/auth?role=vendor&view=register"
              className="relative rounded-2xl overflow-hidden bg-brand-lemon flex flex-col justify-between p-5 sm:p-6 group min-h-[140px]"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900/60">
                  Vendor partners
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 leading-tight">
                  Sell on FLA
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-800/75 leading-relaxed">
                  Register your shop and start selling on FLA.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 mt-3">
                Register as vendor <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <ShoppingBag className="pointer-events-none absolute -right-3 -bottom-3 w-28 h-28 text-slate-900/10" />
            </Link>
          </div>
        </div>

        {/* Browse by category — real product photos */}
        <div className="mt-10 md:mt-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Browse by category
            </h2>
            <Link
              href="/shop"
              className="text-sm font-semibold text-slate-500 hover:text-brand-lemon transition-colors inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4 sm:gap-5">
            {categoryTiles.map(({ label, image }) => (
              <Link
                key={label}
                href={`/shop?category=${encodeURIComponent(label)}`}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <span className="relative h-16 w-16 sm:h-[4.75rem] sm:w-[4.75rem] rounded-2xl overflow-hidden bg-slate-200 shadow-sm ring-1 ring-slate-100 group-hover:ring-brand-lemon group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300">
                  <Image
                    src={image}
                    alt={label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="80px"
                    unoptimized
                  />
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 group-hover:text-slate-900 leading-snug line-clamp-2 px-0.5 max-w-[5.75rem]">
                  {label.split('/')[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
