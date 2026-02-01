
import { CreditCard, Scissors, Truck, CheckCircle } from 'lucide-react';

export default function Workflow() {
    const steps = [
        {
            id: 1,
            title: "Confirm & Escrow",
            description: "Payment is held securely. Production only begins once your order is confirmed.",
            icon: CreditCard,
        },
        {
            id: 2,
            title: "Real-Time Crafting",
            description: "Watch as our tailors cut and sew your garment. Updates sent to your phone.",
            icon: Scissors,
        },
        {
            id: 3,
            title: "QC & Delivery",
            description: "Final quality check by master tailors before it flies to your doorstep.",
            icon: Truck,
        },
    ];

    return (
        <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        From Digital to Physical
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Transparency is our luxury. Track your garment from the first cut to the final stitch.
                    </p>
                </div>

                <div className="relative grid md:grid-cols-3 gap-12">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-10"></div>

                    {steps.map((step) => (
                        <div key={step.id} className="relative flex flex-col items-center text-center group">
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-gray-100 mb-8 group-hover:scale-110 transition-transform duration-300 group-hover:border-brand-lemon group-hover:bg-brand-lemon/5">
                                <step.icon className="w-10 h-10 text-slate-900 group-hover:text-slate-900 transition-colors" />
                            </div>
                            <div className="absolute top-0 right-1/4 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CheckCircle className="w-6 h-6 text-brand-lemon bg-slate-900 rounded-full" />
                            </div>

                            <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-slate-600 leading-relaxed px-4">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
