
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
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase text-sky-400 mb-2">iVISION ENGINE • CRYSTAL CORE</p>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="hidden md:flex items-center space-x-3 crystal-module px-6 py-3 rounded-2xl">
           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
           <span className="text-[11px] font-bold text-slate-400 uppercase">{currentUser.role}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleStats.map((s, i) => (
          <div key={i} className="crystal-module p-8 rounded-[2.5rem] flex flex-col justify-between h-40 md:h-48 group active-scale overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} blur-3xl opacity-50`}></div>
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} border border-white/5`}>
              <s.icon size={22} />
            </div>
            <div className="relative z-10 text-left">
              <p className="text-[11px] font-bold text-slate-500 uppercase">{s.label}</p>
              <p className="text-3xl md:text-4xl font-black text-white mt-1 tracking-tight">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div onClick={() => onNavigate('reports')} className="relative group cursor-pointer overflow-hidden rounded-[3rem] border border-white/10 p-1 bg-gradient-to-br from-white/5 to-transparent active-scale transition-all">
            <div className="bg-slate-950/40 backdrop-blur-3xl p-8 md:p-12 rounded-[2.9rem] flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-sky-400 border border-white/10 shadow-inner">
                  <BarChart3 size={32} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Intelligence Data</h3>
                  <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase">Analyse globale des performances v5.0</p>
                </div>
              </div>
              <ChevronRight className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[11px] font-bold uppercase text-slate-500">Flux Prioritaire</h3>
              <button onClick={() => onNavigate('tasks')} className="text-[10px] font-bold text-sky-400 uppercase px-5 py-2.5 rounded-full crystal-module active-scale">Explorer le flux</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 4).map(task => (
                <div key={task.id} onClick={() => onNavigate('tasks')} className="crystal-module p-6 rounded-[2rem] border-l-[6px] border-l-sky-500 active-scale flex items-center justify-between group">
                  <div className="truncate pr-6 flex-1 text-left">
                    <h4 className="font-bold text-white text-[13px] uppercase truncate group-hover:text-sky-400 transition-colors tracking-tight">{task.title}</h4>
                    <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase">{task.dueDate}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase flex-shrink-0 border border-white/5 ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-slate-400'}`}>
                    {task.priority || 'MED'}
                  </div>
                </div>
              ))}
              {relevantTasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
                <div className="crystal-module p-16 rounded-[3rem] text-center border-dashed border-2 border-white/5 w-full flex flex-col items-center col-span-2">
                  <Activity size={32} className="text-slate-800 mb-4" />
                  <p className="text-[11px] font-bold uppercase text-slate-700">Aucune émission de donnée</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Efficiency Card */}
        <div className="crystal-module p-12 rounded-[3.5rem] flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/5 blur-[80px] rounded-full group-hover:bg-sky-400/10 transition-colors"></div>
          <div className="relative">
            <div className="w-48 h-48 rounded-full border-[12px] border-white/5 border-t-sky-400 flex items-center justify-center shadow-[0_0_50px_rgba(14,165,233,0.1)]">
               <span className="text-5xl font-black text-white tracking-tighter">{productivityScore}<span className="text-2xl text-sky-400 opacity-60">%</span></span>
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Rendement iV</h4>
            <p className="text-slate-600 text-[11px] mt-3 font-bold uppercase">Efficacité opérationnelle calculée</p>
          </div>
          <button onClick={() => onNavigate('reports')} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase active-scale shadow-2xl hover:bg-sky-400 hover:text-white transition-all">Audit complet système</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
