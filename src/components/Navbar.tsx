
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { cartCount, isCartOpen, setIsCartOpen, setIsSupportOpen } = useCart();
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const query = (e.target as HTMLInputElement).value;
            if (query.trim()) {
                router.push(`/shop?search=${encodeURIComponent(query)}`);
                setIsSearchOpen(false);
            }
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const menuItems = [
        { name: 'Home', href: '/' },
        { name: 'Shop', href: '/shop' },
        { name: 'Process', href: '/#process' },
        { name: 'About', href: '/about' },
    ];

    return (
        <header className="fixed w-full z-[100] transition-all duration-300">
            {/* Announcement Bar */}
            <div className="bg-black text-white text-center py-2 px-4 transition-all duration-300 overflow-hidden h-9 flex items-center justify-center">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                    Free delivery within Tamale
                </p>
            </div>

            <nav className={`transition-all duration-300 border-b ${isScrolled
                ? 'bg-white shadow-md border-gray-100 h-16 md:h-20'
                : 'bg-white/95 backdrop-blur-sm border-gray-200 h-20 md:h-24'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex justify-between items-center h-full relative">

                        {/* MOBILE VIEW (Logo Left, Icons Right) */}
                        <div className="flex md:hidden items-center justify-between w-full h-full px-1">
                            <Link href="/" className="flex-shrink-0 font-heading text-base font-black tracking-tighter text-slate-900 uppercase">
                                FLA<span className="text-slate-400">.</span>
                            </Link>

                            <div className="flex items-center -mr-1">
                                <button
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className="text-slate-700 p-1.5"
                                    aria-label="Search"
                                >
                                    <Search className="h-4 w-4" />
                                </button>

                                {isAuthenticated ? (
                                    <button onClick={logout} className="text-slate-400 p-1.5">
                                        <User className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <Link href="/auth" className="text-slate-700 p-1.5">
                                        <User className="h-4 w-4" />
                                    </Link>
                                )}

                                <button
                                    onClick={() => setIsCartOpen(!isCartOpen)}
                                    className="relative text-slate-700 p-1.5"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    <span className="absolute top-1 right-1 bg-black text-white text-[6px] font-bold h-3 w-3 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="ml-0.5 flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1.5 rounded-full shadow-lg"
                                >
                                    <span className="text-[8px] font-black uppercase tracking-tight">Menu</span>
                                    <Menu className="h-3 w-3" />
                                </button>
                            </div>
                        </div>

                        {/* DESKTOP VIEW (Centered Logo, Links Left/Right) */}
                        <div className="hidden md:flex justify-between items-center w-full h-full relative">
                            {/* Left side links */}
                            <div className={`flex flex-1 items-center space-x-8 transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                {['Home', 'Shop', 'Process'].map((item) => (
                                    <Link
                                        key={item}
                                        href={item === 'Home' ? '/' : item === 'Shop' ? '/shop' : '/#process'}
                                        className="font-sans text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-900 transition-colors"
                                    >
                                        + {item}
                                    </Link>
                                ))}
                                {!isAuthenticated && (
                                    <Link
                                        href="/auth?role=vendor"
                                        className="font-sans text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        + Sell on Fadlan
                                    </Link>
                                )}
                            </div>

                            {/* Centered Logo */}
                            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSearchOpen ? 'opacity-20 lg:opacity-100' : 'opacity-100'}`}>
                                <Link href="/" className="font-heading text-3xl font-black tracking-[0.2em] text-slate-900 uppercase">
                                    FLA.
                                </Link>
                            </div>

                            {/* Right side icons */}
                            <div className="flex flex-1 justify-end items-center">
                                <div className="hidden lg:flex items-center space-x-8 mr-12">
                                    <Link href="/about" className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-900">+ About</Link>
                                    <button onClick={() => setIsSupportOpen(true)} className="text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-slate-900">+ Contact</button>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <div className={`relative transition-all duration-500 ${isSearchOpen ? 'w-[300px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-slate-900"
                                                onKeyDown={handleSearch}
                                            />
                                        </div>
                                        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-slate-700 p-2">
                                            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {isAuthenticated ? (
                                        <button onClick={logout} className="text-slate-400 p-2 hover:text-red-500 transition-colors">
                                            <User className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <Link href="/auth" className="text-slate-700 p-2 hover:text-slate-900 transition-colors">
                                            <User className="h-5 w-5" />
                                        </Link>
                                    )}

                                    <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative text-slate-700 p-2 hover:text-slate-900 transition-colors">
                                        <ShoppingBag className="h-5 w-5" />
                                        <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Drawer */}
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className={`absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col h-full p-8">
                        <div className="flex justify-between items-center mb-12">
                            <span className="font-heading text-2xl font-black uppercase tracking-widest">Menu</span>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex flex-col space-y-6">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-2xl font-black text-slate-900 uppercase tracking-tighter hover:text-purple-600 transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            {(user?.role === 'admin' || user?.role === 'vendor') && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-2xl font-black text-purple-600 uppercase tracking-tighter"
                                >
                                    {user.role === 'admin' ? 'Dashboard' : 'Vendor Panel'}
                                </Link>
                            )}
                        </div>

                        <div className="mt-auto pt-10 border-t border-slate-100">
                            {!isAuthenticated && (
                                <Link
                                    href="/auth"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full py-4 px-6 bg-blue-600 text-white text-center rounded-2xl font-black uppercase tracking-widest text-[10px] mb-4"
                                >
                                    Sell on Fadlan
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    setIsSupportOpen(true);
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full py-4 px-6 bg-slate-900 text-white text-center rounded-2xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header >
    );
}
