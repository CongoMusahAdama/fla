"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Heart,
  LogOut,
  ChevronDown,
  Zap,
  Tag,
  Clock,
  LayoutGrid,
} from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getFlaSupportPhoneDisplay, getFlaSupportTelHref } from '@/lib/support-contacts';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems, cartCount, isCartOpen, setIsCartOpen, setIsSupportOpen } = useCart();
  const { user, token, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const supportPhone = getFlaSupportPhoneDisplay();
  const supportTelHref = getFlaSupportTelHref();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState('All Product');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const catRef = useRef<HTMLDivElement>(null);
  const searchCatRef = useRef<HTMLDivElement>(null);
  const [searchCatOpen, setSearchCatOpen] = useState(false);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  // Keep navbar search fields in sync with URL (from shop links / previous searches)
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSearchCategory(searchParams.get('category') || 'All Product');
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setIsCatOpen(false);
      if (searchCatRef.current && !searchCatRef.current.contains(e.target as Node)) {
        setSearchCatOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setWishlistCount(0);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist/my-wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.products || data?.items || [];
        setWishlistCount(list.length);
      })
      .catch(() => {});
  }, [isAuthenticated, token, pathname]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSuggestionsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(
          `${api}/products/suggestions?search=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) setSuggestions(await res.json());
      } catch {
        /* ignore */
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = localStorage.getItem('pending_wishlist_item');
    if (!pending) return;
    try {
      const item = JSON.parse(pending);
      localStorage.removeItem('pending_wishlist_item');
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ productId: item.id }),
      }).then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `${item.name} added to wishlist`,
          showConfirmButton: false,
          timer: 3000,
        });
      });
    } catch {
      /* ignore */
    }
  }, [isAuthenticated, token]);

  const goToShop = (overrides?: {
    search?: string;
    category?: string;
    filter?: string;
    sort?: string;
    clearFilter?: boolean;
  }) => {
    const params = new URLSearchParams();
    const search = overrides?.search !== undefined ? overrides.search : searchQuery;
    const category = overrides?.category !== undefined ? overrides.category : searchCategory;
    const filter = overrides?.clearFilter
      ? ''
      : overrides?.filter !== undefined
        ? overrides.filter
        : '';
    const sort = overrides?.sort || '';

    if (search.trim()) params.set('search', search.trim());
    if (category && category !== 'All Product') params.set('category', category);
    if (filter) params.set('filter', filter);
    if (sort) params.set('sort', sort);

    const q = params.toString();
    router.push(q ? `/shop?${q}` : '/shop');
    setSuggestions([]);
    setIsMenuOpen(false);
    setIsCatOpen(false);
    setSearchCatOpen(false);
  };

  const runSearch = () => {
    goToShop({ clearFilter: true });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'End Session?',
      text: 'Are you sure you want to sign out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F172A',
      cancelButtonColor: '#F1F5F9',
      confirmButtonText: 'Yes, Sign Out',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        router.push('/auth');
      }
    });
  };

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/vendor') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/auth')
  ) {
    return null;
  }

  const accountHref =
    isAuthenticated && (user?.role === 'vendor' || user?.role === 'admin')
      ? '/admin'
      : isAuthenticated
        ? '/dashboard'
        : '/auth';

  const navLinks = [
    { name: 'Deals Today', href: '/shop?filter=On%20Discount', icon: Zap, kind: 'filter' as const, value: 'On Discount' },
    { name: 'Best Sellers', href: '/shop?filter=Best%20Seller', icon: Tag, kind: 'filter' as const, value: 'Best Seller' },
    { name: 'Shop', href: '/shop', icon: undefined, kind: 'plain' as const, value: '' },
    { name: 'Process', href: '/#process', icon: undefined, kind: 'plain' as const, value: '' },
    { name: 'About', href: '/about', icon: undefined, kind: 'plain' as const, value: '' },
  ];

  const browseCategories = PRODUCT_CATEGORIES.filter((c) => c !== 'All Product');
  const isShopPage = pathname === '/shop' || pathname?.startsWith('/shop/');

  return (
    <header
      className={`sticky top-0 z-[100] w-full bg-white transition-shadow ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      {/* Top bar */}
      <div className="border-b border-slate-100">
        <div
          className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
            isScrolled ? 'py-2 md:py-2.5' : 'py-3 md:py-4'
          }`}
        >
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
              <Image
                src="/logo.jpeg"
                alt="FLA"
                width={48}
                height={48}
                className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-xl"
                priority
              />
              <div className="hidden sm:block leading-tight">
                <span className="font-heading text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight block">
                  FLA
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Purchase
                </span>
              </div>
            </Link>

            {/* Search — hidden on shop (page has its own search) */}
            {!isShopPage && (
            <div className="relative flex-1 max-w-2xl mx-auto hidden md:block">
              <div className="flex items-stretch h-12 rounded-md border-2 border-brand-lemon overflow-hidden bg-white">
                <div className="relative shrink-0" ref={searchCatRef}>
                  <button
                    type="button"
                    onClick={() => setSearchCatOpen((v) => !v)}
                    className="h-full px-3 lg:px-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 bg-slate-50 border-r border-slate-200 hover:bg-slate-100"
                  >
                    <span className="max-w-[100px] truncate">
                      {searchCategory === 'All Product' ? 'All Categories' : searchCategory.split('/')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  {searchCatOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-slate-100 shadow-xl rounded-md z-[120]">
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSearchCategory(cat);
                            setSearchCatOpen(false);
                            goToShop({ category: cat, clearFilter: true });
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-brand-lemon/15 ${
                            searchCategory === cat ? 'bg-brand-lemon/20 text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          {cat === 'All Product' ? 'All Categories' : cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="I'm searching for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  className="flex-1 min-w-0 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={runSearch}
                  className="px-4 bg-brand-lemon text-slate-900 hover:bg-brand-lemon-hover transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              {(suggestions.length > 0 || isSuggestionsLoading) && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl rounded-md border border-slate-100 overflow-hidden z-[120]">
                  {isSuggestionsLoading ? (
                    <div className="p-5 flex justify-center">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-brand-lemon rounded-full animate-spin" />
                    </div>
                  ) : (
                    suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchQuery(s.text);
                          goToShop({ search: s.text, clearFilter: true });
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                      >
                        <span className="text-xs font-semibold text-slate-800">{s.text}</span>
                        <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {s.type}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            )}

            {/* Spacer when shop page has no center search */}
            {isShopPage && <div className="hidden md:block flex-1" />}

            {/* Right tools */}
            <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
              <a
                href={supportTelHref}
                className="hidden lg:flex flex-col items-end text-right leading-tight hover:opacity-80"
              >
                <span className="text-sm font-bold text-slate-900">{supportPhone}</span>
                <span className="text-[10px] font-medium text-slate-400">Support 24/7</span>
              </a>

              <Link href={accountHref} className="p-2 text-slate-700 hover:text-brand-lemon transition-colors" aria-label="Account">
                <User className="w-5 h-5" strokeWidth={1.75} />
              </Link>

              <Link
                href={isAuthenticated ? '/dashboard' : '/auth'}
                className="relative p-2 text-slate-700 hover:text-brand-lemon transition-colors hidden sm:inline-flex"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" strokeWidth={1.75} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-brand-lemon text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="flex items-center gap-2 p-1.5 sm:p-2 text-slate-700 hover:text-brand-lemon transition-colors"
              >
                <span className="relative">
                  <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-brand-lemon text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </span>
                <span className="hidden xl:flex flex-col items-start leading-tight text-left">
                  <span className="text-[10px] font-medium text-slate-400">Your Cart</span>
                  <span className="text-sm font-bold text-slate-900">
                    GH₵{cartTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </span>
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:inline-flex p-2 text-slate-400 hover:text-red-500"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 text-slate-800"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile search — hidden on shop */}
          {!isShopPage && (
            <div className="mt-3 md:hidden">
              <div className="flex h-11 rounded-md border-2 border-brand-lemon overflow-hidden">
                <input
                  type="text"
                  placeholder="I'm searching for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  className="flex-1 px-3 text-sm outline-none"
                />
                <button type="button" onClick={runSearch} className="px-3 bg-brand-lemon" aria-label="Search">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav — collapses on scroll to free vertical space */}
      <div
        className={`border-b border-slate-100 bg-white hidden md:block overflow-hidden transition-all duration-300 ease-out ${
          isScrolled ? 'max-h-0 opacity-0 border-transparent' : 'max-h-12 opacity-100'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-6">
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setIsCatOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-9 px-4 bg-brand-lemon text-slate-900 text-[11px] font-bold uppercase tracking-wide rounded-sm hover:bg-brand-lemon-hover transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Shop by Category
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCatOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-white border border-slate-100 shadow-xl rounded-md z-[120] py-1">
                {browseCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSearchCategory(cat);
                      goToShop({ category: cat, search: '', clearFilter: true });
                    }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-lemon/15 hover:text-slate-900"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className="flex items-center gap-5 lg:gap-7 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              if (link.kind === 'filter') {
                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() =>
                      goToShop({
                        search: '',
                        category: 'All Product',
                        filter: link.value,
                        clearFilter: false,
                      })
                    }
                    className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 hover:text-brand-lemon transition-colors"
                  >
                    {Icon ? <Icon className="w-3.5 h-3.5 text-brand-lemon" strokeWidth={2} /> : null}
                    {link.name}
                  </button>
                );
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 hover:text-brand-lemon transition-colors"
                >
                  {Icon ? <Icon className="w-3.5 h-3.5 text-brand-lemon" strokeWidth={2} /> : null}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 flex items-center gap-4">
            {!isAuthenticated && (
              <Link
                href="/auth?role=vendor&view=register"
                className="text-[12px] font-bold text-brand-lemon hover:text-brand-lemon-hover"
              >
                Sell on FLA
              </Link>
            )}
            <button
              type="button"
              onClick={() =>
                goToShop({
                  search: '',
                  category: 'All Product',
                  sort: 'latest',
                  clearFilter: true,
                })
              }
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-900"
            >
              <Clock className="w-3.5 h-3.5" />
              New arrivals
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] md:hidden">
          <div className="absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="font-heading text-xl font-bold">Menu</span>
              <button type="button" onClick={() => setIsMenuOpen(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Categories</p>
              {browseCategories.slice(0, 12).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSearchCategory(cat);
                    goToShop({ category: cat, search: '', clearFilter: true });
                  }}
                  className="py-2.5 text-left text-sm font-semibold text-slate-800 border-b border-slate-50"
                >
                  {cat}
                </button>
              ))}
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-6 mb-2">Explore</p>
              {navLinks.map((item) => (
                item.kind === 'filter' ? (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      goToShop({
                        search: '',
                        category: 'All Product',
                        filter: item.value,
                        clearFilter: false,
                      })
                    }
                    className="py-2.5 text-left text-sm font-semibold text-slate-800"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="py-2.5 text-sm font-semibold text-slate-800"
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
            <div className="mt-auto pt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSupportOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-md"
              >
                Contact Support
              </button>
              {!isAuthenticated && (
                <Link
                  href="/auth?role=vendor&view=register"
                  className="block w-full py-3 bg-brand-lemon text-slate-900 text-center text-xs font-bold rounded-md"
                >
                  Sell on FLA
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
