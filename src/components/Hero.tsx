
"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

const CATEGORIES = ['Electronics', 'Accessories', 'Beauty/cosmetics', 'Home goods', 'Food/beverages', 'Furniture', 'Children/Toys'];

const HERO_POOL_SIZE = 36;
const HERO_VISIBLE = 3;

type HeroProduct = {
    id: string;
    name: string;
    image: string;
};

const FALLBACK_POOL: HeroProduct[] = [
    { id: 'fb-1', name: 'Heritage print shirt', image: '/product-3.png' },
    { id: 'fb-2', name: 'Signature graphic tee', image: '/product-4.png' },
    { id: 'fb-3', name: 'Bold pattern top', image: '/product-5.png' },
    { id: 'fb-4', name: 'Classic kente style', image: '/product-1.jpg' },
    { id: 'fb-5', name: 'Urban streetwear', image: '/product-2.jpg' },
];

function pickForHour(pool: HeroProduct[], hour: number): HeroProduct[] {
    if (!pool.length) return FALLBACK_POOL.slice(0, HERO_VISIBLE);
    if (pool.length <= HERO_VISIBLE) return pool.slice(0, HERO_VISIBLE);

    const start = (hour * HERO_VISIBLE) % pool.length;
    const picked: HeroProduct[] = [];
    for (let i = 0; i < HERO_VISIBLE; i++) {
        picked.push(pool[(start + i) % pool.length]);
    }
    return picked;
}

const TILE_LAYOUT = [
    {
        span: 'col-span-2 row-span-1 sm:row-span-2',
        minH: 'min-h-[200px] sm:min-h-[380px] lg:min-h-[420px]',
    },
    {
        span: 'col-span-1 row-span-1',
        minH: 'min-h-[110px] sm:min-h-[180px]',
    },
    {
        span: 'col-span-1 row-span-1',
        minH: 'min-h-[110px] sm:min-h-[180px]',
    },
];

export default function Hero() {
    const [pool, setPool] = useState<HeroProduct[]>(FALLBACK_POOL);
    const [visible, setVisible] = useState<HeroProduct[]>(() => pickForHour(FALLBACK_POOL, new Date().getHours()));
    const [rotationKey, setRotationKey] = useState(0);

    const applyHourlyRotation = useCallback((productPool: HeroProduct[]) => {
        const hour = new Date().getHours();
        setVisible(pickForHour(productPool, hour));
        setRotationKey((k) => k + 1);
    }, []);

    useEffect(() => {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        fetch(`${api}/products?limit=${HERO_POOL_SIZE}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const list = Array.isArray(data) ? data : data?.products;
                if (!list?.length) return;

                const withImages = list
                    .filter((p: { images?: string[] }) => p.images?.[0])
                    .map((p: { _id: string; name: string; images?: string[] }) => ({
                        id: p._id,
                        name: p.name,
                        image: getImageUrl(p.images?.[0]),
                    }));

                if (withImages.length) setPool(withImages);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        applyHourlyRotation(pool);

        const now = new Date();
        const msToNextHour =
            (60 - now.getMinutes()) * 60 * 1000 -
            now.getSeconds() * 1000 -
            now.getMilliseconds();

        let hourlyTimer: ReturnType<typeof setInterval>;

        const alignTimer = setTimeout(() => {
            applyHourlyRotation(pool);
            hourlyTimer = setInterval(() => applyHourlyRotation(pool), 60 * 60 * 1000);
        }, msToNextHour);

        return () => {
            clearTimeout(alignTimer);
            if (hourlyTimer) clearInterval(hourlyTimer);
        };
    }, [pool, applyHourlyRotation]);

    return (
        <section className="relative w-full bg-[#FAFAF9] border-b border-slate-100">
            <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 xl:px-20 pt-28 md:pt-32 pb-14 md:pb-28">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-20 items-center">
                    {/* Products first on mobile */}
                    <div className="lg:col-span-7 xl:col-span-7 order-1 lg:order-2">
                        <div className="grid grid-cols-2 grid-rows-2 gap-2.5 sm:gap-4 lg:gap-5 max-w-lg mx-auto lg:max-w-none lg:mx-0">
                            {visible.map((product, i) => {
                                const layout = TILE_LAYOUT[i] ?? TILE_LAYOUT[2];
                                return (
                                    <Link
                                        key={`${rotationKey}-${product.id}`}
                                        href="/shop"
                                        className={`relative overflow-hidden rounded-xl sm:rounded-3xl bg-slate-100 shadow-sm border border-slate-100/80 group animate-in fade-in duration-500 ${layout.span} ${layout.minH}`}
                                    >
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                                            sizes={i === 0 ? '(max-width: 1024px) 90vw, 560px' : '(max-width: 1024px) 45vw, 280px'}
                                            priority={i === 0}
                                            unoptimized
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent pt-10 pb-2.5 px-3 sm:pb-3 sm:px-4">
                                            <p className="text-[11px] sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
                                                {product.name}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-5 xl:col-span-5 text-left order-2 lg:order-1">
                        <p className="text-sm font-medium text-slate-500 mb-4 sm:mb-5 tracking-wide">
                            Ghana&apos;s marketplace for everything you need
                        </p>
                        <h1 className="text-[1.75rem] sm:text-4xl xl:text-[3.25rem] font-bold text-slate-900 tracking-tight leading-[1.12] max-w-xl">
                            The fastest way to get{' '}
                            <span className="underline decoration-brand-lemon decoration-[3px] underline-offset-[6px]">
                                exactly
                            </span>{' '}
                            what you&apos;ve ordered
                        </h1>
                        <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                            Fashion, electronics, accessories, home goods &amp; more — from verified vendors nationwide.
                        </p>

                        <div className="mt-5 sm:mt-6 flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/shop?category=${encodeURIComponent(cat)}`}
                                    className="text-[11px] sm:text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-full hover:border-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>

                        {/* Side by side on mobile — opposite each other */}
                        <div className="mt-8 sm:mt-10 flex flex-row gap-3">
                            <Link
                                href="/shop"
                                className="flex-1 inline-flex items-center justify-center h-11 sm:h-12 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-black transition-colors"
                            >
                                Shop now
                            </Link>
                            <Link
                                href="/auth?role=vendor"
                                className="flex-1 inline-flex items-center justify-center h-11 sm:h-12 rounded-full border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Sell on FLA
                            </Link>
                        </div>

                        <ul className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-3">
                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                Verified vendors
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                <CreditCard className="w-4 h-4 text-slate-900 shrink-0" />
                                Secure payments
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                <div className="relative w-5 h-5 shrink-0">
                                    <Image src="/skynet.png" alt="" fill className="object-contain" />
                                </div>
                                Skynet delivery
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
