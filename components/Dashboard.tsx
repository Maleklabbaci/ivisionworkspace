
import React, { useMemo } from 'react';
import { TrendingUp, Target, Zap, Clock, ChevronRight, Activity, BarChart3, ListChecks } from 'lucide-react';
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
  const canViewReports = isAdminOrManager || !!currentUser.permissions?.canViewReports;
  
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

  const stats = [
    { label: 'Retard', val: overdueCount, color: 'text-rose-500', icon: Clock, bg: 'bg-rose-500/10', allowed: true },
    { label: 'Flux Actif', val: relevantTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: 'text-sky-400', icon: TrendingUp, bg: 'bg-sky-400/10', allowed: true },
    { label: 'CRM', val: clients.length, color: 'text-emerald-400', icon: Target, bg: 'bg-emerald-400/10', allowed: isAdminOrManager || !!currentUser.permissions?.canManageClients },
    { label: 'Done', val: relevantTasks.filter(t => t.status === TaskStatus.DONE).length, color: 'text-amber-400', icon: Zap, bg: 'bg-amber-400/10', allowed: true }
  ];

  const visibleStats = stats.filter(s => s.allowed);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[10px] font-black uppercase text-sky-400 mb-1 tracking-widest">iVISION ENGINE • CRYSTAL CORE</p>
          <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="hidden md:flex items-center space-x-3 crystal-module px-6 py-3 rounded-2xl">
           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{currentUser.role}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-1">
        {visibleStats.map((s, i) => (
          <div key={i} className="crystal-module p-6 md:p-8 rounded-[1.75rem] md:rounded-[2.5rem] flex flex-col justify-between h-36 md:h-48 group active-scale overflow-hidden relative text-left">
            <div className={`absolute top-0 right-0 w-20 h-20 ${s.bg} blur-2xl opacity-40`}></div>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[1rem] md:rounded-2xl ${s.bg} flex items-center justify-center ${s.color} border border-white/5`}>
              <s.icon size={18} />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-tight">{s.label}</p>
              <p className="text-2xl md:text-4xl font-black text-white mt-0.5 tracking-tighter leading-none">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 px-1">
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          <div onClick={() => canViewReports ? onNavigate('reports') : onNavigate('tasks')} className="relative group cursor-pointer overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-white/10 p-1 bg-gradient-to-br from-white/5 to-transparent active-scale transition-all shadow-lg">
            <div className="bg-slate-950/40 backdrop-blur-3xl p-6 md:p-12 rounded-[1.9rem] md:rounded-[2.9rem] flex items-center justify-between">
              <div className="flex items-center space-x-5 md:space-x-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center text-sky-400 border border-white/10 shadow-inner">
                  {canViewReports ? <BarChart3 size={24} /> : <ListChecks size={24} />}
                </div>
                <div className="text-left">
                  <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight leading-none">{canViewReports ? "Intelligence Data" : "Missions Actives"}</h3>
                  <p className="text-slate-500 text-[9px] mt-1.5 font-bold uppercase tracking-tight">{canViewReports ? "Analyse globale des performances v5.0" : "Suivi de votre production opérationnelle"}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-600 group-hover:text-white transition-all" size={20} />
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Flux Prioritaire</h3>
              <button onClick={() => onNavigate('tasks')} className="text-[9px] font-black text-sky-400 uppercase px-4 py-2 rounded-xl crystal-module active-scale">Tout voir</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 4).map(task => (
                <div key={task.id} onClick={() => onNavigate('tasks')} className="crystal-module p-5 rounded-[1.5rem] md:rounded-[2rem] border-l-[4px] border-l-sky-500 active-scale flex items-center justify-between group">
                  <div className="truncate pr-4 flex-1 text-left">
                    <h4 className="font-bold text-white text-[12px] uppercase truncate group-hover:text-sky-400 transition-colors tracking-tight">{task.title}</h4>
                    <p className="text-[9px] text-slate-600 font-bold mt-1.5 uppercase tracking-tighter">{task.dueDate}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase flex-shrink-0 border border-white/5 ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-slate-400'}`}>
                    {task.priority || 'MED'}
                  </div>
                </div>
              ))}
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
                <div className="crystal-module p-12 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center border-dashed border-2 border-white/5 w-full flex flex-col items-center col-span-2 opacity-30">
                  <Activity size={28} className="text-slate-800 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-none">Aucun flux actif</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="crystal-module p-10 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/5 blur-[80px] rounded-full"></div>
          <div className="relative">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-[10px] border-white/5 border-t-sky-400 flex items-center justify-center shadow-[0_0_40px_rgba(14,165,233,0.1)]">
               <span className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">{productivityScore}<span className="text-xl text-sky-400 opacity-60">%</span></span>
            </div>
          </div>
          <div>
            <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">Rendement iV</h4>
            <p className="text-slate-600 text-[10px] mt-2 font-black uppercase tracking-tight">Efficacité calculée</p>
          </div>
          <button 
            onClick={() => canViewReports ? onNavigate('reports') : onNavigate('tasks')} 
            className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase active-scale shadow-2xl hover:bg-sky-400 hover:text-white transition-all tracking-widest"
          >
            {canViewReports ? "Audit Système" : "Vérifier Missions"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
