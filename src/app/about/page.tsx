"use client";

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Target, Zap, Lightbulb, Eye, Goal, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[#FDFCFB] pt-32 md:pt-36">
            {/* Gallery Section - Moved to Top */}
            <section className="pb-8 md:pb-12 max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="relative aspect-square md:aspect-[4/3] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl group">
                        <Image
                            src="/hero-new.png"
                            alt="The Identity"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute bottom-10 left-10">
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">The Modern Creator</h4>
                        </div>
                    </div>
                    <div className="relative aspect-square md:aspect-[4/3] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl group">
                        <Image
                            src="/image.png"
                            alt="Bespoke Quality"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute bottom-10 left-10">
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Bespoke Excellence</h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* Inspiration Layout Section */}
            <section className="py-24 px-6 relative">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 block">About Us</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                        Unveiling Our Identity, <br /> Vision and Values
                    </h2>
                    <p className="max-w-2xl mx-auto text-slate-500 text-sm md:text-base font-medium leading-relaxed">
                        We're passionate about fashion innovation. With years of experience in the industry, we've established ourselves as leaders in providing high-quality custom apparel solutions on a secure digital marketplace.
                    </p>
                </div>

                {/* Values Bar - Dark Card */}
                <div className="max-w-4xl mx-auto -mb-16 relative z-20">
                    <div className="bg-slate-900 rounded-[32px] md:rounded-[48px] p-8 md:p-12 shadow-2xl flex flex-wrap justify-between items-center gap-8 md:gap-4">
                        <div className="flex flex-col items-center gap-3 flex-1 min-w-[120px]">
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Escrow Safety</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1 min-w-[120px]">
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white">
                                <Zap className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Efficient</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1 min-w-[120px]">
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white">
                                <Target className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Precision</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1 min-w-[120px]">
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white">
                                <Lightbulb className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Innovation</span>
                        </div>
                    </div>
                </div>

                {/* Vision & Mission White Card */}
                <div className="max-w-6xl mx-auto bg-white rounded-[48px] md:rounded-[64px] pt-32 pb-16 px-8 md:px-20 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-0 w-full relative">
                        {/* Vertical Divider for MD+ */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-100 -translate-x-1/2" />

                        {/* Vision */}
                        <div className="md:pr-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Vision</h3>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                To lead the way in custom apparel manufacturing by delivering innovative, sustainable, and cost-effective solutions that empower creators and delight style enthusiasts globally.
                            </p>
                        </div>

                        {/* Mission */}
                        <div className="md:pl-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                                    <Goal className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Mission</h3>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                To leverage our expertise, resources, and secure digital technology to manufacture bespoke clothing products that exceed industry standards, ensuring safety and trust at every stitch.
                            </p>
                        </div>
                    </div>

                    <div className="mt-20">
                        <Link href="/shop" className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-600 transition-all shadow-xl shadow-slate-200">
                            Explore the collection
                        </Link>
                    </div>
                </div>
            </section>
            {/* Platform Narrative Text Footer */}
            <section className="py-24 bg-slate-50 text-center px-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-slate-500 italic text-lg leading-relaxed mb-10">
                        "Our platform connects customers with creative clothing vendors on one secure digital platform. We empower fashion creators and clothing brands to reach more customers while giving shoppers access to personalized, high-quality apparel — all in one convenient platform."
                    </p>
                    <div className="w-12 h-1 bg-purple-600 mx-auto" />
                </div>
            </section>
        </main>
    );
}
