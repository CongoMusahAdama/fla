
"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    return (
        <section className="relative w-full z-0">
            <div className="relative h-[550px] md:h-[650px] overflow-hidden">
                {/* Botanical Lifestyle Image */}
                <Image
                    src="/image copy.png"
                    alt="FLA Purchase Hero Collection"
                    fill
                    className="object-cover object-[center_10%]"
                    priority
                    quality={100}
                />

                {/* Content Contrast Layer */}
                <div className="absolute inset-0 bg-black/20 z-[5]" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-[6] hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-[6] md:hidden" />

                {/* Content - Inspired by Pura Design */}
                <div className={`absolute bottom-12 md:bottom-24 left-8 md:left-16 z-10 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h1 className="font-heading text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
                        SHOP WITH CONFIDENCE <br />
                        <span className="text-[#E5FF7F]">BY FLA PURCHASE</span>
                    </h1>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/shop" className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold hover:bg-slate-900 transition-all shadow-2xl cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center touch-manipulation">
                            Shop Now
                        </Link>
                        <Link href="/auth?role=vendor" className="bg-white/95 backdrop-blur-xl text-slate-900 border border-slate-200 px-10 py-4 rounded-full text-xs font-bold hover:bg-white transition-all duration-300 shadow-2xl cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center touch-manipulation">
                            Sell Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
