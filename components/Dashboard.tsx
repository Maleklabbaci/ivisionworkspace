
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

  const stats = [
    { label: 'Retard', val: overdueCount, color: 'text-rose-500', icon: Clock, bg: 'bg-rose-500/10', allowed: true },
    { label: 'Flux Actif', val: relevantTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: 'text-sky-400', icon: TrendingUp, bg: 'bg-sky-400/10', allowed: true },
    { label: 'CRM', val: clients.length, color: 'text-emerald-400', icon: Target, bg: 'bg-emerald-400/10', allowed: isAdminOrManager || !!currentUser.permissions?.canManageClients },
    { label: 'Done', val: relevantTasks.filter(t => t.status === TaskStatus.DONE).length, color: 'text-amber-400', icon: Zap, bg: 'bg-amber-400/10', allowed: true }
  ];

  const visibleStats = stats.filter(s => s.allowed);

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2">iVISION ENGINE</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight uppercase">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="hidden md:flex items-center space-x-3 glass px-4 py-2 rounded-2xl border-white/10">
           <Activity size={14} className="text-emerald-400 animate-pulse" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{currentUser.role}</span>
        </div>
      </header>

      {/* Stats Grid - 2 cols on mobile, 4 on PC */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleStats.map((s, i) => (
          <div key={i} className="glass-card p-5 md:p-8 rounded-[2rem] flex flex-col justify-between h-36 md:h-48 group active-scale">
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${s.bg} flex items-center justify-center ${s.color}`}>
              <s.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl md:text-4xl font-black text-white mt-1 tracking-tighter">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Action Banner */}
          <div onClick={() => onNavigate('reports')} className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] p-[1px] bg-gradient-to-br from-sky-400/20 via-slate-800 to-indigo-500/20 active-scale transition-all">
            <div className="bg-slate-950/60 backdrop-blur-3xl p-6 md:p-10 rounded-[2.45rem] flex items-center justify-between">
              <div className="flex items-center space-x-5 md:space-x-8">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-white/5 rounded-2xl flex items-center justify-center text-sky-400">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight">Intelligence Data</h3>
                  <p className="text-slate-500 text-[10px] md:text-sm mt-1 uppercase font-black tracking-widest">Voir l'analyse globale</p>
                </div>
              </div>
              <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Flux Prioritaire</h3>
              <button onClick={() => onNavigate('tasks')} className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-4 py-2 rounded-full glass active-scale">Tout voir</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 3).map(task => (
                <div key={task.id} onClick={() => onNavigate('tasks')} className="glass-card p-5 rounded-2xl border-l-4 border-l-violet-500 active-scale flex items-center justify-between">
                  <div className="truncate pr-4">
                    <h4 className="font-black text-white text-[13px] uppercase truncate">{task.title}</h4>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-widest uppercase">{task.dueDate}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-slate-600'}`}>
                    {task.priority || 'MED'}
                  </div>
                </div>
              ))}
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
                <div className="glass p-12 rounded-[2.5rem] text-center opacity-30 border-2 border-dashed border-white/5">
                  <Zap size={24} className="mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Noyau Inactif</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Efficiency Card */}
        <div className="glass p-10 md:p-12 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden active-scale transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 blur-[60px] rounded-full"></div>
          <div className="relative">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-[10px] md:border-[15px] border-white/5 border-t-sky-400 flex items-center justify-center shadow-[0_0_40px_rgba(14,165,233,0.1)]">
               <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">{productivityScore}<span className="text-xl md:text-2xl text-sky-400">%</span></span>
            </div>
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight">Efficacité iV</h4>
            <p className="text-slate-500 text-[10px] md:text-xs mt-3 uppercase font-black tracking-widest px-4">Algorithme de complétion</p>
          </div>
          <button onClick={() => onNavigate('reports')} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active-scale shadow-xl">Audit complet</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
