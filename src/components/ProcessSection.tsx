
import { Package, ShieldCheck, Clock, Truck } from 'lucide-react';

export default function ProcessSection() {
    const steps = [
        {
            icon: <Package className="w-6 h-6 text-slate-900" />,
            title: "Direct Order",
            description: "Choose your favorite item and quantity. Whether it's an exclusive brand or a custom print, you start the purchase process."
        },
        {
            icon: <Clock className="w-6 h-6 text-slate-900" />,
            title: "Real-Time Tracking",
            description: "Track your order's journey from processing to final delivery. Know exactly when your authentic item will be ready."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-slate-900" />,
            title: "Split Payment Protection",
            description: "Your payment is secured. Funds are only settled to the vendor when both you and the vendor confirm successful delivery."
        },
        {
            icon: <Truck className="w-6 h-6 text-slate-900" />,
            title: "Secure Delivery",
            description: "Once approved, your item is professionally packaged and delivered directly to your doorstep."
        }
    ];

    return (
        <section id="process" className="py-24 bg-slate-50 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="bg-brand-lemon text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full inline-block">
                        How It Works
                    </span>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                        The FLA Process
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Experience true transparency with our print-on-demand service. From the cutting table to your closet, every step is tracked and secured.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default border border-slate-100/50">
                            <div className="w-12 h-12 bg-brand-lemon rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {step.icon}
                            </div>
                            <h3 className="font-heading font-bold text-lg text-slate-900 mb-3">
                                {step.title}
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
