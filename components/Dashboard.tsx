
import React, { useMemo } from 'react';
import { TrendingUp, Target, Zap, Clock, ChevronRight, Activity, BarChart3 } from 'lucide-react';
import { Task, User, ViewState, TaskStatus, UserRole, Client } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  clients: Client[];
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks = [], clients = [], onNavigate }) => {
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const isAdminOrManager = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER;
  
  const relevantTasks = useMemo(() => {
    if (isAdminOrManager) return tasks;
    return tasks.filter(t => t.assigneeId === currentUser.id);
  }, [tasks, currentUser, isAdminOrManager]);

  const overdueCount = useMemo(() => relevantTasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE).length, [relevantTasks, today]);
  
  const productivityScore = useMemo(() => {
    if (relevantTasks.length === 0) return 0;
    const completed = relevantTasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((completed / relevantTasks.length) * 100);
  }, [relevantTasks]);

  const performanceInsight = useMemo(() => {
    if (overdueCount > 0) return `Alerte : ${overdueCount} missions en retard. Nécessite une réallocation des ressources.`;
    if (productivityScore > 80) return "Excellente vélocité. Le flux opérationnel est optimal.";
    return "Système stable. Continuez le suivi des objectifs trimestriels.";
  }, [overdueCount, productivityScore]);

  const stats = [
    { label: 'En retard', val: overdueCount, color: 'text-urgent', icon: Clock, bg: 'bg-urgent/10', allowed: true },
    { label: 'Flux Actif', val: relevantTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: 'text-sky-400', icon: TrendingUp, bg: 'bg-sky-400/10', allowed: true },
    { label: 'Partenaires CRM', val: clients.length, color: 'text-emerald-400', icon: Target, bg: 'bg-emerald-400/10', allowed: isAdminOrManager || !!currentUser.permissions?.canManageClients },
    { label: 'Terminées', val: relevantTasks.filter(t => t.status === TaskStatus.DONE).length, color: 'text-amber-400', icon: Zap, bg: 'bg-amber-400/10', allowed: true }
  ];

  const visibleStats = stats.filter(s => s.allowed);

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-1 md:mb-2">iVISION PERFORMANCE ENGINE</p>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="hidden md:flex items-center space-x-3 glass px-4 py-2 rounded-2xl border-white/10">
           <Activity size={14} className="text-emerald-400 animate-pulse" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flux Réel - {currentUser.role}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {visibleStats.map((s, i) => (
          <div key={i} className="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col justify-between h-32 md:h-44 group">
            <div className={`w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110`}>
              <s.icon size={16} className="md:w-[20px]" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{s.label}</p>
              <p className="text-2xl md:text-4xl font-extrabold text-white mt-0.5 md:mt-1 tracking-tighter">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          <div onClick={() => onNavigate('reports')} className="relative group cursor-pointer overflow-hidden rounded-[1.8rem] md:rounded-[2.5rem] p-[1px] bg-gradient-to-br from-sky-400/20 via-slate-800 to-indigo-500/20 shadow-2xl">
            <div className="bg-slate-950/40 backdrop-blur-3xl p-5 md:p-8 rounded-[1.75rem] md:rounded-[2.45rem] flex items-center justify-between">
              <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-sky-400 shadow-2xl transition-all duration-500 flex-shrink-0">
                  <BarChart3 size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-xl font-extrabold text-white tracking-tight">Analyse de Performance</h3>
                  <p className="text-slate-400 text-[10px] md:text-sm mt-0.5 md:mt-1 font-medium leading-snug max-w-md truncate md:whitespace-normal">
                    {performanceInsight}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full glass flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all flex-shrink-0">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Missions Prioritaires</h3>
              <button onClick={() => onNavigate('tasks')} className="text-[8px] md:text-[10px] font-bold text-sky-400 hover:text-white transition-colors uppercase tracking-widest px-3 py-1 rounded-full glass">Flux complet</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 4).map(task => (
                <div key={task.id} onClick={() => onNavigate('tasks')} className="glass-card p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between border-l-2 md:border-l-4 border-l-violet-400/50 cursor-pointer group">
                  <div className="truncate pr-3">
                    <h4 className="font-bold text-white text-[12px] md:text-sm truncate group-hover:text-sky-400 transition-colors uppercase md:normal-case">{task.title}</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-wider">{task.dueDate}</p>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded md:px-2 md:py-1 md:rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${task.priority === 'high' ? 'bg-urgent/10 text-urgent' : 'bg-white/5 text-slate-500'}`}>
                    {task.priority || 'MED'}
                  </div>
                </div>
              ))}
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
                <div className="col-span-2 glass p-8 rounded-2xl text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">Toutes les missions sont complétées</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-sky-400/5 blur-[40px] md:blur-[60px] rounded-full"></div>
          <div className="relative">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-[8px] md:border-[12px] border-white/5 border-t-sky-400 flex items-center justify-center rotate-[-45deg] group-hover:rotate-0 transition-transform duration-1000">
               <div className="rotate-[45deg] group-hover:rotate-0 transition-transform duration-1000">
                  <span className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter">{productivityScore}<span className="text-xl md:text-2xl text-sky-400">%</span></span>
               </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm md:text-lg font-extrabold text-white uppercase tracking-tight">Efficacité Globale</h4>
            <p className="text-slate-500 text-[10px] md:text-xs mt-2 md:mt-3 leading-relaxed font-medium px-2 md:px-4">Indicateur de complétion mathématique des flux assignés.</p>
          </div>
          <button onClick={() => onNavigate('reports')} className="w-full py-3.5 md:py-4.5 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] hover:bg-sky-400 hover:text-white transition-all shadow-xl active-scale">Détails de la Donnée</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
