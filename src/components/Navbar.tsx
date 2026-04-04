"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, User, Headset, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const pathname = usePathname();
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

    const handleLogout = () => {
        Swal.fire({
            title: 'End Session?',
            text: "Are you sure you want to sign out?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0F172A',
            cancelButtonColor: '#F1F5F9',
            confirmButtonText: 'Yes, Sign Out',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[24px] border border-slate-100 shadow-xl',
                confirmButton: 'rounded-full px-6 py-2.5 uppercase text-[10px] font-black tracking-widest bg-slate-900 text-white',
                cancelButton: 'rounded-full px-6 py-2.5 uppercase text-[10px] font-black tracking-widest text-slate-500'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                router.push('/auth');
            }
        });
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);

        // Process pending wishlist item after auth
        if (isAuthenticated) {
            const pending = localStorage.getItem('pending_wishlist_item');
            if (pending) {
                try {
                    const item = JSON.parse(pending);
                    localStorage.removeItem('pending_wishlist_item');

                    const addToWishlist = async () => {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({ productId: item.id })
                        });

                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: `${item.name} added to wishlist`,
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    };
                    addToWishlist();
                } catch (e) {
                    console.error('Failed to process pending wishlist item', e);
                }
            }
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isAuthenticated]);

    // Hide Navbar on dashboard and admin routes - moved after hooks to avoid React error
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/dashboard')) {
        return null;
    }

    const menuItems = [
        { name: 'Home', href: '/' },
        { name: 'Shop', href: '/shop' },
        { name: 'Process', href: '/#process' },
        { name: 'About', href: '/about' },
    ];

    return (
        <header className="fixed w-full z-[100] transition-all duration-300 pointer-events-none">
            {/* Announcement Bar */}
            <div className="bg-black text-white py-2 px-4 transition-all duration-300 h-9 flex items-center justify-center relative pointer-events-auto">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                    AUTHENTIC CLOTHING LINE
                </p>
            </div>

            <nav className={`transition-all duration-300 border-b pointer-events-auto ${isScrolled
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
                                <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-32 opacity-100 mr-2' : 'w-0 opacity-0 overflow-hidden'}`}>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full px-3 py-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-slate-900"
                                        onKeyDown={handleSearch}
                                        autoFocus={isSearchOpen}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className="text-slate-700 p-1.5"
                                    aria-label="Search"
                                >
                                    {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                </button>

                                {isAuthenticated ? (
                                    <Link href={user?.role === 'vendor' || user?.role === 'admin' ? '/admin' : '/dashboard'} className="text-slate-700 p-1.5">
                                        <User className="h-4 w-4" />
                                    </Link>
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
                                        + Sell on FLA Purchase
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
                                                autoFocus={isSearchOpen}
                                            />
                                        </div>
                                        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-slate-700 p-2">
                                            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {isAuthenticated ? (
                                        <div className="flex items-center gap-2">
                                            <Link href={user?.role === 'vendor' || user?.role === 'admin' ? '/admin' : '/dashboard'} className="text-slate-700 p-2 hover:text-slate-900 transition-colors">
                                                <User className="h-5 w-5" />
                                            </Link>
                                             <button onClick={handleLogout} className="text-slate-400 p-2 hover:text-red-500 transition-colors">
                                                <LogOut className="h-4 w-4" />
                                            </button>
                                        </div>
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
            {isMenuOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-300 md:hidden pointer-events-auto">
                    <div className="absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500">
                        <div className="flex flex-col h-full p-8">
                            <div className="flex justify-between items-center mb-12">
                                <span className="font-heading text-2xl font-black uppercase tracking-widest">Menu</span>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors pointer-events-auto">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-col space-y-6">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-2xl font-black text-slate-900 uppercase tracking-tighter hover:text-brand-lemon transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                {(user?.role === 'admin' || user?.role === 'vendor') && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-2xl font-black text-brand-lemon uppercase tracking-tighter"
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
                                        className="block w-full py-4 px-6 bg-blue-600 text-white text-center rounded-full font-bold text-xs mb-4"
                                    >
                                        Sell on FLA Purchase
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        setIsSupportOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-slate-900 text-white text-center rounded-full font-bold text-xs hover:bg-slate-800 transition-colors"
                                >
                                    <Headset className="w-4 h-4 text-brand-lemon" />
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header >
    );
}
