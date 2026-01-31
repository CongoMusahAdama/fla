
export default function ProblemSolution() {
    return (
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="text-brand-blue font-bold tracking-wider uppercase mb-2">The Problem</div>
                        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
                            Tired of seeing <br />
                            <span className="text-gray-500 line-through decoration-red-500 decoration-4">"Out of Stock"</span>?
                        </h2>
                        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                            Standard retail fails you when your size is gone. We flip the script.
                            We don't hold inventory that runs out. We hold potential.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-2xl">🚫</span>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Standard Retail</h4>
                                    <p className="text-sm text-slate-400">Inventory based. When it's gone, it's gone.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-brand-blue/10 rounded-lg border border-brand-blue/30">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <h4 className="font-bold text-brand-blue mb-1">The Fadlan Way</h4>
                                    <p className="text-sm text-slate-300">On-demand. If the fabric exists, your size exists.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-brand-blue/20 rounded-full blur-3xl"></div>
                        <div className="relative bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                                <div className="w-32 h-4 bg-slate-700 rounded animate-pulse"></div>
                                <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">IN STOCK</div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-8 bg-slate-600 rounded w-3/4"></div>
                                <div className="h-32 bg-slate-700 rounded w-full"></div>
                                <button className="w-full py-4 bg-brand-blue rounded-lg font-bold text-white mt-4 hover:bg-blue-500 transition-colors">
                                    Start Production
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
