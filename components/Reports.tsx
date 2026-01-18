
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Task, User, TaskStatus } from '../types';
import { BarChart3, TrendingUp, Target, Wand2, Sparkles, Loader2, ArrowUpRight, Activity } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';

const Reports: React.FC<any> = ({ tasks = [], leads = [], currentUser }) => {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [strategyReport, setStrategyReport] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    return {
      completion: total ? Math.round((done / total) * 100) : 0,
      pipeline: leads.reduce((acc: number, curr: any) => acc + (Number(curr.valueMin) || 0), 0),
      conversion: leads.length ? Math.round((leads.filter((l: any) => l.status === 'qualified').length / leads.length) * 100) : 0
    };
  }, [tasks, leads]);

  const taskData = useMemo(() => [
    { name: 'TODO', val: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#F472B6' },
    { name: 'WORK', val: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#EC4899' },
    { name: 'DONE', val: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#BE185D' }
  ].filter(d => d.val > 0), [tasks]);

  const handleAnalyticMagic = async () => {
    setIsAnalysing(true);
    try {
      const insight = await generateMarketingInsight(`KPIs: Completion ${stats.completion}%, Pipeline ${stats.pipeline} DZD.`);
      setStrategyReport(insight);
    } catch (err) { console.error(err); } finally { setIsAnalysing(false); }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400 mb-2">ANALYTICS ENGINE</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Rapports</h2>
        </div>
        <button onClick={handleAnalyticMagic} disabled={isAnalysing} className="px-10 py-5 bg-pink-400 text-white font-black rounded-2xl shadow-2xl shadow-pink-500/30 active-scale flex items-center space-x-3 text-[11px] tracking-[0.2em] uppercase transition-all hover:scale-105">
          {isAnalysing ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>}
          <span>{isAnalysing ? "Calcul..." : "Stratégie IA"}</span>
        </button>
      </div>

      {strategyReport && (
        <div className="glass p-12 rounded-[4rem] border border-pink-400/20 shadow-2xl animate-fade-in bg-gradient-to-br from-pink-400/10 via-slate-900/40 to-transparent relative overflow-hidden group">
           <div className="absolute -top-12 -right-12 w-44 h-44 bg-pink-400/10 blur-[60px] rounded-full group-hover:bg-pink-400/20 transition-all duration-700"></div>
           <div className="flex items-center space-x-4 mb-10 relative z-10">
             <div className="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20} /></div>
             <h4 className="font-black text-pink-400 text-[11px] uppercase tracking-[0.3em]">Directives IA Stratégiques</h4>
           </div>
           <p className="text-2xl font-extrabold text-white leading-tight italic border-l-4 border-pink-400 pl-10 relative z-10 max-w-4xl tracking-tight">{strategyReport}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Taux Complétion', val: `${stats.completion}%`, color: 'text-pink-400', icon: TrendingUp, bg: 'bg-pink-400/10' },
          { label: 'Lead Conversion', val: `${stats.conversion}%`, color: 'text-emerald-400', icon: Target, bg: 'bg-emerald-400/10' },
          { label: 'Pipeline Total', val: `${Math.round(stats.pipeline / 1000)}k`, color: 'text-sky-400', icon: BarChart3, bg: 'bg-sky-400/10' }
        ].map((s, i) => (
          <div key={i} className="glass-card p-8 rounded-[3rem] border border-white/5 flex items-center justify-between group">
             <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
               <h4 className={`text-3xl font-extrabold ${s.color} mt-2 tracking-tighter`}>{s.val}</h4>
             </div>
             <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:rotate-12`}>
                <s.icon size={22} />
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="glass p-12 rounded-[4rem] border border-white/5 min-h-[450px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-12 flex items-center relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400 mr-4 shadow-[0_0_10px_#f472b6]" /> Cycle de Production
            </h3>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={taskData} cx="50%" cy="50%" innerRadius={90} outerRadius={125} paddingAngle={10} dataKey="val">
                       {taskData.map((e, idx) => <Cell key={idx} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', color: '#fff', fontSize: '10px', fontWeight: '800' }} />
                 </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="glass p-12 rounded-[4rem] border border-white/5 min-h-[450px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-12 flex items-center relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-4 shadow-[0_0_10px_#38bdf8]" /> Intensité du Flux
            </h3>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={taskData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', color: '#fff', fontSize: '10px', fontWeight: '800' }} />
                    <Bar dataKey="val" fill="#F472B6" radius={[15, 15, 0, 0]} barSize={50}>
                       {taskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;
