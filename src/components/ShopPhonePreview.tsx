"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, MapPin } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

type PreviewProduct = {
    _id?: string;
    name: string;
    price: number;
    images?: string[];
    vendorName?: string;
};

const FALLBACK_PRODUCTS: PreviewProduct[] = [
    { name: "Heritage Kente", price: 450, images: ["/product-1.jpg"], vendorName: "FLA Vendor" },
    { name: "Urban Thread", price: 320, images: ["/product-2.jpg"], vendorName: "FLA Vendor" },
    { name: "Signature Print", price: 580, images: ["/product-3.png"], vendorName: "FLA Vendor" },
    { name: "Classic Fit", price: 275, images: ["/product-4.png"], vendorName: "FLA Vendor" },
];

type Props = {
    variant?: "default" | "hero";
};

export default function ShopPhonePreview({ variant = "default" }: Props) {
    const [products, setProducts] = useState<PreviewProduct[]>(FALLBACK_PRODUCTS);
    const hero = variant === "hero";

    useEffect(() => {
        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        fetch(`${api}/products?limit=4`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const list = Array.isArray(data) ? data : data?.products;
                if (list?.length) {
                    setProducts(list.slice(0, 4));
                }
            })
            .catch(() => {});
    }, []);

    return (
        <div className={`w-full h-full flex flex-col overflow-hidden select-none ${hero ? "bg-[#F5F2ED]" : "bg-[#F5F2ED]"}`}>
            {/* Status bar */}
            <div className={`flex items-center justify-between shrink-0 ${hero ? "px-5 pt-3 pb-1.5" : "px-4 pt-2 pb-1"}`}>
                <span className={`font-semibold text-slate-900 ${hero ? "text-[11px]" : "text-[9px]"}`}>9:41</span>
                <div className="flex items-center gap-1">
                    <div className={`rounded-sm border border-slate-900/80 ${hero ? "w-4 h-2" : "w-3 h-1.5"}`} />
                    <div className={`rounded-full bg-slate-900 ${hero ? "w-1.5 h-1.5" : "w-1 h-1"}`} />
                </div>
            </div>

            {/* Nav */}
            <div className={`flex items-center justify-between bg-white border-b border-slate-100 shrink-0 ${hero ? "px-4 py-2.5" : "px-3 py-2"}`}>
                <div className="flex items-center gap-2">
                    <div className={`rounded-lg overflow-hidden relative ${hero ? "w-7 h-7" : "w-5 h-5"}`}>
                        <Image src="/logo.jpeg" alt="FLA" fill className="object-cover" unoptimized />
                    </div>
                    <span className={`font-bold text-slate-900 ${hero ? "text-[11px]" : "text-[8px]"}`}>FLA Shop</span>
                </div>
                <ShoppingBag className={hero ? "w-5 h-5" : "w-3.5 h-3.5"} />
            </div>

            {/* Header */}
            <div className={`shrink-0 ${hero ? "px-4 pt-4 pb-2" : "px-3 pt-3 pb-2"}`}>
                <h2 className={`font-bold text-slate-900 leading-none ${hero ? "text-xl" : "text-[13px]"}`}>Shop</h2>
                <p className={`text-slate-400 font-medium mt-1 ${hero ? "text-[10px]" : "text-[7px]"}`}>Home › Shop</p>
            </div>

            {/* Search */}
            <div className={`shrink-0 ${hero ? "px-4 pb-3" : "px-3 pb-2"}`}>
                <div className="relative">
                    <input
                        readOnly
                        placeholder="Search products..."
                        className={`w-full bg-white border border-slate-200 rounded-full text-slate-500 pointer-events-none font-medium ${
                            hero ? "pl-4 pr-9 py-2.5 text-[11px]" : "pl-3 pr-7 py-1.5 text-[7px]"
                        }`}
                    />
                    <Search className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 ${hero ? "w-4 h-4" : "w-2.5 h-2.5"}`} />
                </div>
            </div>

            {/* Categories */}
            <div className={`flex gap-1.5 overflow-hidden shrink-0 ${hero ? "px-4 pb-3" : "px-3 pb-2"}`}>
                {["All", "Fashion", "Beauty", "Electronics"].map((cat, i) => (
                    <span
                        key={cat}
                        className={`rounded-full font-semibold whitespace-nowrap ${
                            hero ? "px-3 py-1 text-[10px]" : "px-2 py-0.5 text-[6px]"
                        } ${
                            i === 0
                                ? "bg-slate-900 text-brand-lemon"
                                : "bg-white text-slate-500 border border-slate-100"
                        }`}
                    >
                        {cat}
                    </span>
                ))}
            </div>

            {/* Products */}
            <div className={`flex-1 overflow-hidden ${hero ? "px-3 pb-3" : "px-2 pb-2"}`}>
                <div className={`grid grid-cols-2 h-full content-start ${hero ? "gap-2" : "gap-1.5"}`}>
                    {products.map((product, idx) => (
                        <div
                            key={product._id || idx}
                            className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm"
                        >
                            <div className="relative aspect-[3/4] bg-slate-100">
                                <Image
                                    src={getImageUrl(product.images?.[0])}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div className={hero ? "p-2" : "p-1.5"}>
                                <p className={`font-semibold text-slate-900 truncate leading-tight ${hero ? "text-[10px]" : "text-[6px]"}`}>
                                    {product.name}
                                </p>
                                <p className={`font-bold text-slate-900 ${hero ? "text-[11px] mt-0.5" : "text-[7px] mt-0.5"}`}>
                                    GH₵ {product.price}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Region hint */}
            <div className={`flex items-center gap-1 text-slate-400 shrink-0 ${hero ? "px-4 pb-2 text-[9px]" : "px-3 pb-1 text-[6px]"}`}>
                <MapPin className={hero ? "w-3 h-3" : "w-2 h-2"} />
                <span>Greater Accra · All regions</span>
            </div>

            <Link
                href="/shop"
                className={`bg-slate-900 text-brand-lemon rounded-full font-semibold text-center shrink-0 hover:bg-black transition-colors ${
                    hero ? "mx-4 mb-4 py-2.5 text-[11px]" : "mx-3 mb-3 py-2 text-[7px]"
                }`}
            >
                Browse Shop
            </Link>
        </div>
    );
}
