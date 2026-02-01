
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
            <div className="relative h-[450px] md:h-[550px] overflow-hidden">
                {/* Botanical Lifestyle Image */}
                <Image
                    src="/hero-rack.png"
                    alt="FLA Lifestyle Collection"
                    fill
                    className="object-contain md:object-center object-bottom scale-100 md:scale-90"
                    priority
                    quality={100}
                />

                {/* Subtle gradient for text readability - matching the soft botanical vibe */}
                <div className="absolute inset-0 bg-black/10 md:bg-transparent z-[5]" />

                {/* Content - Inspired by Pura Design */}
                <div className={`absolute bottom-12 md:bottom-24 left-8 md:left-16 z-10 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h1 className="font-heading text-4xl md:text-7xl font-bold text-white md:text-slate-900 tracking-tight leading-tight mb-8">
                        The Art of Style <br />
                        <span className="text-[#E5FF7F]">by FLA.</span>
                    </h1>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/shop">
                            <button className="bg-black text-white px-10 py-4 rounded-full text-xs font-bold hover:bg-slate-900 transition-all shadow-2xl cursor-pointer hover:scale-105 active:scale-95">
                                Shop Now
                            </button>
                        </Link>
                        <Link href="/auth?role=vendor">
                            <button className="bg-white/95 backdrop-blur-xl text-slate-900 border border-slate-200 px-10 py-4 rounded-full text-xs font-bold hover:bg-white transition-all duration-300 shadow-2xl cursor-pointer hover:scale-105 active:scale-95">
                                Sell Now
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
