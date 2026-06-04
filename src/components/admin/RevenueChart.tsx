"use client";
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const data = [
    { name: '12 Feb', gross: 60000, net: 35000 },
    { name: '12 Mar', gross: 68000, net: 32000 },
    { name: '9 Apr', gross: 75000, net: 45000 },
    { name: '7 May', gross: 55000, net: 38000 },
    { name: '11 Jun', gross: 62000, net: 42000 },
    { name: '9 Jul', gross: 78000, net: 48000 },
    { name: '13 Aug', gross: 82000, net: 52000 },
    { name: '10 Sept', gross: 88000, net: 58000 },
    { name: '8 Oct', gross: 92000, net: 62000 },
    { name: '12 Nov', gross: 95000, net: 65000 },
    { name: '10 Dec', gross: 85000, net: 55000 },
    { name: '7 Jan', gross: 82000, net: 60000 },
];

export const RevenueChart = ({ initialData = [] }: { initialData?: any[] }) => {
    const [year, setYear] = React.useState('2024');
    const [view, setView] = React.useState('Growth'); 
    const [chartData, setChartData] = React.useState(initialData.length > 0 ? initialData : data);

    // Sync with props
    React.useEffect(() => {
        if (initialData.length > 0) {
            setChartData(initialData);
        }
    }, [initialData]);

    // Simulate data change on filter (Simulation logic)
    React.useEffect(() => {
        if (initialData.length === 0) return; // Only simulate if we have data or want to play with it
        
        const factor = view === 'Decline' ? 0.7 : 1.0;
        const newData = (initialData.length > 0 ? initialData : data).map(item => ({
            ...item,
            gross: Math.floor(item.gross * factor * (year === '2023' ? 0.9 : 1)),
            net: Math.floor(item.net * factor * (year === '2023' ? 0.85 : 1))
        }));
        setChartData(newData);
    }, [year, view]);

    return (
        <div className="bg-white p-8 md:p-10 border border-slate-100 shadow-sm rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex flex-wrap items-start gap-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-600 rounded-sm" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Volume</p>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">GH₵ {(chartData.reduce((acc, curr) => acc + curr.gross, 0) / 20).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                <TrendingUp className="w-3 h-3" /> {view === 'Decline' ? '- 12.4%' : '+ 3.12%'} <span className="text-slate-300">vs last year</span>
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-slate-200 rounded-sm" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Volume</p>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">GH₵ {(chartData.reduce((acc, curr) => acc + curr.net, 0) / 20).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                <TrendingUp className="w-3 h-3" /> {view === 'Decline' ? '- 8.1%' : '+ 1.54%'} <span className="text-slate-300">vs last year</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <select 
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="appearance-none px-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:border-slate-200 transition-all cursor-pointer focus:ring-0 outline-none"
                        >
                            <option value="2024">This Year</option>
                            <option value="2023">Last Year</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative group">
                        <select 
                            value={view}
                            onChange={(e) => setView(e.target.value)}
                            className="appearance-none px-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:border-slate-200 transition-all cursor-pointer focus:ring-0 outline-none"
                        >
                            <option value="Growth">Growth</option>
                            <option value="Decline">Decline</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="gross" 
                            stroke="#4f46e5" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorGross)" 
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1000}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="net" 
                            stroke="#e2e8f0" 
                            strokeWidth={2}
                            fill="transparent" 
                            dot={{ r: 4, fill: '#cbd5e1', strokeWidth: 2, stroke: '#fff' }}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
