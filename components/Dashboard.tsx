
import React, { useState } from 'react';
import { TrendingUp, CheckCircle, Sparkles, ArrowRight, Activity, Users, Target, MessageSquare, FileText, Briefcase } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus, ToastNotification } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  notifications: ToastNotification[];
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks, notifications, onNavigate }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Filtrage intelligent pour les missions de l'utilisateur qui ne sont pas terminées
  const myActiveTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== TaskStatus.DONE);
  
  // Calculs de performance opérationnelle
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    const context = `
      Opérations : ${tasks.length} missions au total. 
      Taux de complétion : ${completionRate}%. 
      Missions bloquées : ${blockedCount}. 
      Missions en cours : ${inProgressCount}.
      Analyse l'efficacité du flux de travail.
    `;
    const insight = await generateMarketingInsight(context);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-10 page-transition pb-24 max-w-full overflow-x-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl uppercase">Dashboard</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Workspace Opérationnel iVISION</p>
        </div>
        <div className="hidden md:flex bg-white p-2 rounded-3xl border border-slate-100 shadow-sm space-x-2">
            <button className="px-8 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30">Semaine</button>
            <button className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl">Mois</button>
        </div>
      </div>

      {/* CORE KPI GRID - 4 ÉTATS ET FLUX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
        {/* IA INSIGHT CARD */}
        <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl shadow-slate-900/30 text-white relative overflow-hidden group active-scale cursor-pointer transition-all border-4 border-slate-800" onClick={handleGetInsights}>
          <div className="relative z-10 h-full flex flex-col">
            <Sparkles size={28} className="text-primary mb-6" strokeWidth={2.5} />
            <p className="text-[11px] font-black uppercase opacity-50 tracking-[0.3em] mb-4">IA Performance</p>
            <p className="text-sm font-bold leading-relaxed line-clamp-4 italic">
                {loadingAi ? "Analyse du workflow en cours..." : (aiInsight || "Analysez l'efficacité de l'agence avec l'IA.")}
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/40 transition-all duration-700"></div>
        </div>

        {/* COMPLETION RATE */}
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <div className="w-16 h-16 bg-success/5 rounded-[2rem] flex items-center justify-center text-success mb-6 border border-success/5">
                 <CheckCircle size={32} strokeWidth={2.5} />
             </div>
             <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.3em]">Livrabilité</p>
             <p className="text-5xl font-black text-slate-900 tracking-tighter mt-2">{completionRate}%</p>
           </div>
           <div className="w-full bg-slate-50 h-2.5 rounded-full mt-8 overflow-hidden">
                <div className="bg-success h-full transition-all duration-1000 shadow-lg shadow-success/20" style={{ width: `${completionRate}%` }}></div>
           </div>
        </div>

        {/* BLOCKED MISSIONS (CRITICAL KPI) */}
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className={`w-16 h-16 ${blockedCount > 0 ? 'bg-urgent/10 text-urgent' : 'bg-slate-50 text-slate-200'} rounded-[2rem] flex items-center justify-center mb-6 border border-current/5`}>
               <Activity size={32} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.3em]">Bloquées</p>
                <p className={`text-5xl font-black tracking-tighter mt-2 ${blockedCount > 0 ? 'text-urgent' : 'text-slate-900'}`}>{blockedCount}</p>
            </div>
        </div>

        {/* ACTIVE FLOW */}
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="w-16 h-16 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mb-6 border border-primary/5">
               <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.3em]">En Cours</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter mt-2">{inProgressCount}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-1">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center space-x-4">
                    <Target size={24} className="text-primary" strokeWidth={3} />
                    <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">Focus Missions</h3>
                </div>
                <button 
                  onClick={() => onNavigate('tasks')}
                  className="text-[11px] font-black uppercase text-primary flex items-center active-scale transition-all hover:translate-x-2"
                >
                  Ouvrir Workflow <ArrowRight size={16} className="ml-2" />
                </button>
            </div>
            <div className="space-y-4">
              {myActiveTasks.length === 0 ? (
                <div className="p-24 text-center bg-white rounded-[4rem] border-4 border-slate-50 border-dashed text-slate-200 font-black text-xs uppercase tracking-[0.4em]">Flux de travail libéré</div>
              ) : (
                myActiveTasks.slice(0, 4).map(task => (
                  <div key={task.id} onClick={() => onNavigate('tasks')} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between active-scale cursor-pointer transition-all hover:border-primary/20 hover:shadow-2xl group">
                    <div className="flex items-center space-x-6 overflow-hidden">
                      <div className={`w-2 h-14 rounded-full shadow-lg ${
                        task.status === TaskStatus.BLOCKED ? 'bg-urgent shadow-urgent/20' : 
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-primary shadow-primary/20' : 
                        'bg-slate-200'
                      }`}></div>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-slate-900 text-xl tracking-tight group-hover:text-primary transition-colors truncate">{task.title}</h4>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                            task.status === TaskStatus.BLOCKED ? 'bg-urgent/10 text-urgent' : 
                            task.status === TaskStatus.IN_PROGRESS ? 'bg-primary/10 text-primary' : 
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {task.status}
                          </span>
                          <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{task.dueDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-100 group-hover:text-primary group-hover:bg-primary/5 transition-all flex-shrink-0">
                        <CheckCircle size={32} strokeWidth={2.5} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-10">
            <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-900 mb-10 uppercase tracking-[0.3em] text-[10px] text-slate-400 px-2 text-center">Outils & Accès</h3>
                <div className="grid grid-cols-2 gap-5">
                    {[
                        { label: 'Communication', icon: MessageSquare, path: 'chat', color: 'text-primary' },
                        { label: 'Collaborateurs', icon: Users, path: 'team', color: 'text-success' },
                        { label: 'Documentation', icon: FileText, path: 'files', color: 'text-warning' },
                        { label: 'CRM Clients', icon: Briefcase, path: 'clients', color: 'text-urgent' }
                    ].map(tool => (
                        <button 
                            key={tool.label}
                            onClick={() => onNavigate(tool.path as any)}
                            className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2.5rem] border-4 border-white hover:border-primary/10 hover:bg-white hover:shadow-xl transition-all active-scale"
                        >
                            <tool.icon size={28} className={`${tool.color} mb-3`} strokeWidth={2.5} />
                            <span className="font-black text-slate-900 text-[10px] uppercase tracking-widest leading-tight text-center">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-8 bg-slate-900 rounded-[3.5rem] border-4 border-slate-800 text-center">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">iVISION Workspace</p>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Opérations Alpha 2.1</p>
            </div>
          </section>
      </div>
    </div>
  );
};

export default Dashboard;
