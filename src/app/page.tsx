
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";
import Link from 'next/link';
import { Filter, ChevronRight, LayoutGrid, List } from 'lucide-react';

export default function Home() {
  const products = [
    {
      id: "1",
      name: "Tribal Print Shirt",
      price: 850,
      images: [
        "/product-1.jpg",
        "/product-3.png",
        "/product-4.png"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 8,
    },
    {
      id: "2",
      name: "Geometric Print Shirt",
      price: 750,
      images: [
        "/product-3.png",
        "/product-1.jpg",
        "/product-5.png"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 12,
    },
    {
      id: "3",
      name: "Abstract Circle Print",
      price: 900,
      images: [
        "/product-2.jpg",
        "/product-4.png",
        "/product-5.png"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 10,
    },
    {
      id: "4",
      name: "Forest Night Print",
      price: 950,
      images: [
        "/product-4.png",
        "/product-1.jpg",
        "/product-2.jpg"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 7,
    },
    {
      id: "5",
      name: "Brushstroke Print Polo",
      price: 650,
      images: [
        "/product-5.png",
        "/product-3.png",
        "/product-4.png"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 15,
    },
    {
      id: "6",
      name: "Oxford Cotton Shirt",
      price: 450,
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1549117122-3cd2269a84b5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "24h",
      stock: 12,
    },
    {
      id: "7",
      name: "Geometric Block Print",
      price: 850,
      images: [
        "/product-3.png",
        "/product-2.jpg",
        "/product-5.png"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 9,
    },
    {
      id: "8",
      name: "Brushstroke Art Print",
      price: 700,
      images: [
        "/product-5.png",
        "/product-1.jpg",
        "/product-4.png"
      ],
      imageLabels: ["Front", "Back", "Side"],
      duration: "3 working days",
      stock: 11,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />

      <section className="w-full px-4 md:px-8 py-10 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-12">

          {/* Sidebar - Hidden on Mobile */}
          <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Category</h3>
              <div className="space-y-2">
                {['All Product', 'For Men', 'For Women'].map((cat, i) => (
                  <button key={cat} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}>
                    <span className={i === 0 ? 'opacity-100' : 'opacity-50'}>
                      {i === 0 ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    </span>
                    {cat}
                    {i === 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">12</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Filters</h3>
              <div className="space-y-1">
                {['New Arrival', 'Best Seller', 'On Discount'].map((filter) => (
                  <button key={filter} className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:text-slate-900 flex justify-between items-center group cursor-pointer">
                    {filter}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue" />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Areas */}
          <div className="flex-1">
            {/* Mobile Categories - Luxury Scroll */}
            <div className="md:hidden mb-12">
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="font-heading text-2xl font-black text-slate-900 uppercase tracking-tighter">Collections</h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-lemon animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">New Arrivals</span>
                </div>
              </div>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                {['All Product', 'For Men', 'For Women', 'Accessories', 'Limited'].map((cat, i) => (
                  <button
                    key={cat}
                    className={`flex-none px-7 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap active:scale-95 ${i === 0
                      ? 'bg-slate-900 text-brand-lemon shadow-[0_15px_30px_rgba(0,0,0,0.15)] ring-1 ring-slate-800'
                      : 'bg-white text-slate-400 border border-slate-100'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h2 className="font-heading text-xl md:text-2xl font-black text-slate-900 uppercase">New Arrivals</h2>
              <div className="flex gap-2">
                <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-900 active:bg-slate-50 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors"><List className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} {...product} index={index} />
              ))}
            </div>

            {/* Explore More Button */}
            <div className="flex justify-center mt-20">
              <Link href="/shop">
                <button className="group flex items-center gap-3 px-16 py-4 bg-brand-lemon rounded-full text-xs font-bold text-slate-900 hover:bg-black hover:text-white transition-all duration-500 shadow-xl hover:shadow-2xl cursor-pointer">
                  Explore More Collection
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProcessSection />

      <Footer />
    </main>
  );
}
