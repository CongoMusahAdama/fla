
export default function ProblemSolution() {
    return (
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="text-brand-lemon font-black tracking-[0.2em] uppercase mb-4 text-xs">The Problem</div>
                        <h2 className="font-heading text-4xl md:text-6xl font-black mb-8 leading-tight">
                            Tired of seeing <br />
                            <span className="text-slate-500 line-through decoration-brand-lemon decoration-4">"Out of Stock"</span>?
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 leading-relaxed font-medium">
                            Standard retail fails when your size is gone. <br className="hidden md:block" />
                            We don't hold inventory. We hold potential.
                        </p>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">🚫</div>
                                <div>
                                    <h4 className="font-bold text-white mb-1 uppercase text-xs tracking-widest">Standard Retail</h4>
                                    <p className="text-sm text-slate-400">Inventory based. When it's gone, it's gone.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-5 bg-brand-lemon/10 rounded-2xl border border-brand-lemon/20">
                                <div className="w-10 h-10 rounded-full bg-brand-lemon flex items-center justify-center text-slate-900 flex-shrink-0">✅</div>
                                <div>
                                    <h4 className="font-bold text-brand-lemon mb-1 uppercase text-xs tracking-widest">The FLA Way</h4>
                                    <p className="text-sm text-slate-300">On-demand. If the fabric exists, your size exists.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-brand-lemon/10 rounded-full blur-3xl"></div>
                        <div className="relative bg-slate-800 p-8 rounded-[32px] border border-slate-700 shadow-2xl overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lemon/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-lemon/10 transition-colors" />
                            <div className="flex items-center justify-between mb-8 border-b border-slate-700/50 pb-6">
                                <div className="w-32 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
                                <div className="px-4 py-1.5 bg-brand-lemon text-slate-900 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-lg shadow-brand-lemon/20">IN STOCK</div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-10 bg-slate-700/50 rounded-xl w-3/4"></div>
                                <div className="h-40 bg-slate-700/30 rounded-2xl w-full border border-slate-700/50"></div>
                                <button className="w-full py-5 bg-brand-lemon rounded-2xl font-black text-[10px] text-slate-900 mt-6 hover:shadow-xl hover:shadow-brand-lemon/10 transition-all uppercase tracking-[0.2em] transform active:scale-[0.98]">
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
