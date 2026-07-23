'use client';

import { Package, ShieldCheck, Clock, Truck } from 'lucide-react';
import Link from 'next/link';

const steps = [
    {
        icon: Package,
        title: 'Place your order',
        description: 'Pick what you love from verified vendors — ready-made or made to order.',
    },
    {
        icon: Clock,
        title: 'Follow every step',
        description: 'See processing and delivery status in real time until it reaches you.',
    },
    {
        icon: ShieldCheck,
        title: 'Pay with protection',
        description: 'Split payment keeps funds secure for you, the vendor, and FLA.',
    },
    {
        icon: Truck,
        title: 'Get it delivered',
        description: 'Professionally packed and sent to your door across Ghana.',
    },
];

export default function ProcessSection() {
    return (
        <section id="process" className="relative overflow-hidden bg-white text-slate-900 border-t border-slate-100">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-lemon/20 blur-3xl" />
                <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand-blue/[0.04] blur-3xl" />
            </div>

            <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="max-w-2xl mb-12 md:mb-16">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-blue mb-4">
                        How it works
                    </p>
                    <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.1]">
                        Shop with confidence
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed max-w-lg">
                        From order to delivery — tracked, secured, and powered by split payments.
                    </p>
                </div>

                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <li
                                key={step.title}
                                className="group relative flex flex-col"
                            >
                                {index < steps.length - 1 && (
                                    <span
                                        className="hidden lg:block absolute top-7 left-[calc(3.5rem+0.5rem)] right-0 h-px bg-slate-200"
                                        aria-hidden
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-3 mb-5">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lemon text-slate-900 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
                                        <Icon className="w-6 h-6" strokeWidth={1.75} />
                                    </span>
                                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-300">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2 tracking-tight">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {step.description}
                                </p>
                            </li>
                        );
                    })}
                </ol>

                <div className="mt-12 md:mt-16 flex flex-wrap items-center gap-4">
                    <Link
                        href="/shop"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-brand-lemon px-7 text-sm font-semibold text-slate-900 hover:bg-brand-lemon-hover transition-colors"
                    >
                        Browse the shop
                    </Link>
                    <p className="text-sm text-slate-400">
                        Verified vendors · Secure checkout · Ghana-wide delivery
                    </p>
                </div>
            </div>
        </section>
    );
}
