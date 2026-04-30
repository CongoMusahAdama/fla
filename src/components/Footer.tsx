import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-black text-white py-16 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <Image 
                                src="/logo.jpeg" 
                                alt="FLA Logo" 
                                width={60} 
                                height={60} 
                                className="h-10 w-auto object-contain rounded-lg shadow-xl shadow-white/5"
                            />
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Exclusive lifestyle designs for the modern era. We combine authentic craftsmanship with real-time delivery and marketplace technology.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold text-white mb-4 uppercase text-xs tracking-widest">Shop</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/shop" className="hover:text-white transition-colors cursor-pointer">New Arrivals</Link></li>
                            <li><Link href="/shop" className="hover:text-white transition-colors cursor-pointer">Men</Link></li>
                            <li><Link href="/shop" className="hover:text-white transition-colors cursor-pointer">Women</Link></li>
                            <li><Link href="/shop" className="hover:text-white transition-colors cursor-pointer">Accessories</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold text-white mb-4 uppercase text-xs tracking-widest">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/about" className="hover:text-white transition-colors cursor-pointer">Our Story</Link></li>
                            <li><Link href="/#process" className="hover:text-white transition-colors cursor-pointer">Sustainability</Link></li>
                            <li><Link href="/#process" className="hover:text-white transition-colors cursor-pointer">Careers</Link></li>
                            <li><Link href="/#process" className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold text-white mb-4 uppercase text-xs tracking-widest">Newsletter</h4>
                        <p className="text-slate-400 text-sm mb-4">Subscribe for early access to new collections.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white text-sm text-white placeholder:text-slate-500"
                            />
                            <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer">
                                Join
                            </button>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                        &copy; {new Date().getFullYear()} FLA Purchase Marketplace. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {/* Social Icons Placeholder */}
                        <div className="w-4 h-4 bg-slate-800 rounded-full hover:bg-white transition-colors cursor-pointer"></div>
                        <div className="w-4 h-4 bg-slate-800 rounded-full hover:bg-white transition-colors cursor-pointer"></div>
                        <div className="w-4 h-4 bg-slate-800 rounded-full hover:bg-white transition-colors cursor-pointer"></div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
