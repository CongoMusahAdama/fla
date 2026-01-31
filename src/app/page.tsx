
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

      <section className="w-full px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12">

          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8">

            {/* Categories */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 mb-4 text-lg">Category</h3>
              <div className="space-y-2">
                {['All Product', 'For Men', 'For Women'].map((cat, i) => (
                  <button key={cat} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}>
                    {/* Simple Icons placeholder logic */}
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

          {/* Main Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-bold text-slate-900">New Arrivals</h2>
              <div className="flex gap-2">
                <button className="p-2 bg-white rounded-lg shadow-sm text-slate-900"><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-slate-900"><List className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} {...product} index={index} />
              ))}
            </div>

            {/* Explore More Button */}
            <div className="flex justify-center mt-20">
              <Link href="/shop">
                <button className="group flex items-center gap-3 px-16 py-4 bg-purple-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-black transition-all duration-500 shadow-xl hover:shadow-2xl cursor-pointer">
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
