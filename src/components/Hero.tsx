
"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative w-full bg-white pt-24 md:pt-40 pb-20 overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                {/* Content Header */}
                <div className="flex flex-col items-center text-center mb-10 relative">
                    {/* Play Badge - Desktop Only */}
                    <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 flex-col items-center gap-4 group cursor-pointer z-20">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                             <svg viewBox="0 0 100 100" className="absolute w-full h-full animate-spin-slow">
                                <path id="curve" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                <text className="text-[9px] font-black uppercase tracking-[0.2em] fill-slate-300 group-hover:fill-slate-900 transition-colors">
                                    <textPath xlinkHref="#curve">Learn about us through this video • </textPath>
                                </text>
                            </svg>
                            <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-1" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] max-w-5xl uppercase animate-in fade-in slide-in-from-top duration-700">
                        The Fastest Way <br /> To Get <span className="text-brand-lemon">Exactly</span> <br /> What You've Ordered
                    </h1>

                    <div className="flex flex-row justify-center gap-4 mt-12 w-full px-6 md:px-0">
                        <Link href="/shop" className="flex-1 md:flex-none md:w-36 bg-slate-900 text-white py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center">
                            Shop Now
                        </Link>
                        <Link href="/auth?role=vendor" className="flex-1 md:flex-none md:w-36 bg-white text-slate-900 border-2 border-slate-900 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center">
                            Sell Now
                        </Link>
                    </div>

                    {/* Avatar Group - Desktop Only */}
                    <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 items-center -space-x-4 z-20">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-14 h-14 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-xl">
                                <Image src={`/hero/${i === 1 ? 'sunglasses' : i === 2 ? 'center' : 'green'}.png`} alt="User" width={56} height={56} className="object-cover" />
                            </div>
                        ))}
                        <div className="w-14 h-14 rounded-full border-4 border-white bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-xl">
                            +
                        </div>
                    </div>
                </div>

                {/* Dynamic Image Grid - Now with Mobile Collage */}
                <div className="relative grid grid-cols-5 gap-2 md:gap-6 items-end h-[350px] md:h-[650px] mt-4 md:mt-0">
                    
                    {/* Far Left - Column 1 */}
                    <div className="flex flex-col gap-2 md:gap-6 h-full justify-between">
                        <div className="relative flex-1 rounded-[16px] md:rounded-[40px] overflow-hidden group shadow-sm">
                            <Image src="/hero/orange.png" alt="Fashion" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                        </div>
                        <div className="relative h-1/4 md:h-1/3 rounded-[16px] md:rounded-[40px] overflow-hidden bg-brand-lemon group shadow-sm">
                             <Image src="/hero/blue.png" alt="Fashion" fill className="object-cover" />
                        </div>
                    </div>

                    {/* Inner Left - Column 2 */}
                    <div className="relative h-[80%] md:h-[95%] rounded-[16px] md:rounded-[40px] overflow-hidden group shadow-lg">
                         <div className="absolute top-0 left-0 right-0 h-4 md:h-14 bg-white/20 backdrop-blur-xl rounded-t-[16px] md:rounded-t-[40px] z-10" />
                         <Image src="/hero/green.png" alt="Fashion" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    </div>

                    {/* Center Piece - Column 3 */}
                    <div className="relative flex flex-col gap-2 md:gap-6 h-full justify-center">
                        <div className="relative h-[70%] md:h-[65%] rounded-[16px] md:rounded-[40px] overflow-hidden shadow-2xl group border-[4px] md:border-[12px] border-white z-10">
                             <Image src="/hero/center.png" alt="Fashion" fill className="object-cover" />
                        </div>
                        <div className="hidden md:flex justify-center -mt-10 z-20">
                            <Link href="/shop" className="bg-slate-900 text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl hover:bg-black transition-all group">
                                Explore <ArrowRight className="w-4 h-4 text-brand-lemon group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Inner Right - Column 4 */}
                    <div className="relative h-[80%] md:h-[95%] rounded-[16px] md:rounded-[40px] overflow-hidden group shadow-lg">
                        <div className="absolute top-0 left-0 right-0 h-4 md:h-14 bg-white/20 backdrop-blur-xl rounded-t-[16px] md:rounded-t-[40px] z-10" />
                        <Image src="/hero/blue.png" alt="Fashion" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    </div>

                    {/* Far Right - Column 5 */}
                    <div className="flex flex-col gap-2 md:gap-6 h-full justify-between">
                         <div className="relative h-[70%] md:h-[65%] rounded-[16px] md:rounded-[40px] overflow-hidden group shadow-sm">
                             <Image src="/hero/sunglasses.png" alt="Fashion" fill className="object-cover" />
                        </div>
                        <div className="relative flex-1 rounded-[16px] md:rounded-[40px] overflow-hidden bg-slate-900 group shadow-sm">
                             <Image src="/hero/green.png" alt="Fashion" fill className="object-cover" />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
