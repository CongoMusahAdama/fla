
import { Scissors, ShieldCheck, Clock, Truck } from 'lucide-react';

export default function ProcessSection() {
    const steps = [
        {
            icon: <Scissors className="w-6 h-6 text-purple-600" />,
            title: "Bespoke Order",
            description: "Choose your fabric and design. Whether it's a simple cloth purchase or a full sewing service, you start the creation process."
        },
        {
            icon: <Clock className="w-6 h-6 text-purple-600" />,
            title: "Real-Time Tracking",
            description: "Track your garment's journey from fabric cutting to final stitching. Know exactly when your custom piece will be ready."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
            title: "Escrow Protection",
            description: "Your payment is held securely in escrow. Funds are only released when both you and the tailor are satisfied with the result."
        },
        {
            icon: <Truck className="w-6 h-6 text-purple-600" />,
            title: "Secure Delivery",
            description: "Once approved, your bespoke piece is professionally packaged and delivered directly to your doorstep in Tamale."
        }
    ];

    return (
        <section id="process" className="py-24 bg-slate-50 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-purple-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">
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
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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
