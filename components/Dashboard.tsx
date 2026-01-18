
import React, { useState, useMemo } from 'react';
import { TrendingUp, Sparkles, Target, Zap, Clock, Loader2, ChevronRight, Activity } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks = [], onNavigate }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const overdueCount = useMemo(() => tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE).length, [tasks, today]);
  
  const stats = [
    { label: 'Retards', val: overdueCount, color: 'text-urgent', icon: Clock, bg: 'bg-urgent/10' },
    { label: 'Flux Actif', val: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: 'text-sky-400', icon: TrendingUp, bg: 'bg-sky-400/10' },
    { label: 'Comptes CRM', val: new Set(tasks.map(t => t.clientId)).size, color: 'text-emerald-400', icon: Target, bg: 'bg-emerald-400/10' },
    { label: 'Réussites', val: tasks.filter(t => t.status === TaskStatus.DONE).length, color: 'text-amber-400', icon: Zap, bg: 'bg-amber-400/10' }
  ];

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const insight = await generateMarketingInsight(`Context: ${tasks.length} missions, ${overdueCount} overdue.`);
      setAiInsight(insight);
    } catch (err) { console.error(err); } finally { setLoadingAi(false); }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2">iVISION INTELLIGENCE CORE</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="flex items-center space-x-3 glass px-4 py-2 rounded-2xl border-white/10">
           <Activity size={14} className="text-emerald-400 animate-pulse" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Système Opérationnel</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="glass-card p-6 rounded-[2rem] flex flex-col justify-between h-44 group">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{s.label}</p>
              <p className="text-4xl font-extrabold text-white mt-1 tracking-tighter">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div onClick={handleGetInsights} className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] p-[1px] bg-gradient-to-br from-sky-400/40 via-violet-500/40 to-indigo-500/40 shadow-2xl">
            <div className="bg-slate-950/40 backdrop-blur-3xl p-8 rounded-[2.45rem] flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl group-hover:rotate-6 transition-all duration-500">
                  {loadingAi ? <Loader2 className="animate-spin text-sky-500" size={28} /> : <Sparkles className="text-sky-500" size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">iVISION Analyst</h3>
                  <p className="text-slate-400 text-sm mt-1 font-medium leading-relaxed max-w-md">{aiInsight || "Analysez instantanément votre flux de travail pour optimiser vos performances stratégiques."}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Missions Prioritaires</h3>
              <button onClick={() => onNavigate('tasks')} className="text-[10px] font-bold text-sky-400 hover:text-white transition-colors uppercase tracking-widest px-3 py-1 rounded-full glass">Voir le flux</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 4).map(task => (
                <div key={task.id} onClick={() => onNavigate('tasks')} className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-violet-400/50 cursor-pointer group">
                  <div className="truncate pr-4">
                    <h4 className="font-bold text-white text-sm truncate group-hover:text-sky-400 transition-colors">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1.5 tracking-wider">{task.dueDate}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'bg-urgent/10 text-urgent' : 'bg-white/5 text-slate-500'}`}>
                    {task.priority || 'MED'}
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center glass rounded-3xl opacity-30 border-dashed border-white/10">
                   <Activity size={32} className="mb-3" />
                   <p className="text-xs font-bold uppercase tracking-widest">Flux totalement traité</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 blur-[60px] rounded-full"></div>
          <div className="relative">
            <div className="w-44 h-44 rounded-full border-[12px] border-white/5 border-t-sky-400 flex items-center justify-center rotate-[-45deg] group-hover:rotate-0 transition-transform duration-1000">
               <div className="rotate-[45deg] group-hover:rotate-0 transition-transform duration-1000">
                  <span className="text-5xl font-extrabold text-white tracking-tighter">84<span className="text-2xl text-sky-400">%</span></span>
               </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-white uppercase tracking-tight">Efficacité Globale</h4>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed font-medium px-4">Votre cycle de production est supérieur à la moyenne du secteur.</p>
          </div>
          <button onClick={() => onNavigate('reports')} className="w-full py-4.5 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-400 hover:text-white transition-all shadow-xl active-scale">Rapport Stratégique</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
