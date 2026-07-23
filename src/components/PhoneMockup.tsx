"use client";

import React from "react";
import Image from "next/image";
import ShopPhonePreview from "./ShopPhonePreview";

/** Hand + phone photo with live shop UI on the screen. */
export default function PhoneMockup() {
    return (
        <div className="relative w-[min(100%,340px)] sm:w-[400px] md:w-[440px] aspect-[4/5]">
            <div
                className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[85%] h-[65%] rounded-full bg-brand-lemon/15 blur-3xl pointer-events-none"
                aria-hidden
            />

            {/* Realistic hand holding phone */}
            <Image
                src="/hero/hand-phone.png"
                alt="Shop on FLA mobile"
                fill
                priority
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 340px, 440px"
            />

            {/* Shop UI — on top of the blank phone screen */}
            <div
                className="absolute z-10 overflow-hidden rounded-[1.2rem] sm:rounded-[1.35rem] shadow-sm ring-1 ring-black/5"
                style={{
                    top: "11%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "42%",
                    height: "58.5%",
                }}
            >
                <ShopPhonePreview variant="hero" />
            </div>
        </div>
    );
}
