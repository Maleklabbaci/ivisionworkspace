
import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Sparkles, ArrowRight, Activity, Users, Target, MessageSquare, FileText, Briefcase, AlertTriangle, X } from 'lucide-react';
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
  const [showCriticalPopup, setShowCriticalPopup] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  
  // Missions en retard critique (date dépassée et non terminée)
  const overdueTasks = tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE);
  const myActiveTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== TaskStatus.DONE);
  
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;

  useEffect(() => {
    if (overdueTasks.length > 0) {
      setShowCriticalPopup(true);
    }
  }, [overdueTasks.length]);

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    const context = `Opérations : ${tasks.length} missions. Retards : ${overdueTasks.length}. Bloquées : ${blockedCount}.`;
    const insight = await generateMarketingInsight(context);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-8 page-transition pb-20 max-w-full overflow-x-hidden">
      {/* MODAL CRITIQUE D'URGENCE */}
      {showCriticalPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowCriticalPopup(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(255,59,48,0.3)] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-urgent">
            <div className="p-6 bg-urgent text-white flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 animate-bounce">
                <AlertTriangle size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Retard Critique</h3>
              <p className="text-white/80 font-bold text-[9px] mt-1 uppercase tracking-widest">{overdueTasks.length} missions hors délais</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1.5">
                {overdueTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3.5 bg-red-50 rounded-2xl border border-red-100">
                    <span className="font-bold text-slate-800 text-[11px] truncate">{t.title}</span>
                    <span className="text-[9px] font-black text-urgent">{t.dueDate}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => { setShowCriticalPopup(false); onNavigate('tasks'); }}
                className="w-full py-4 bg-urgent text-white font-black rounded-2xl shadow-xl shadow-urgent/30 active-scale uppercase text-[9px] tracking-widest"
              >
                RÉSOUDRE MAINTENANT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 md:text-5xl uppercase">Dashboard</h1>
          <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.4em] mt-1">Monitoring iVISION actif</p>
        </div>
        <div className="hidden md:flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm space-x-1">
            <button className="px-6 py-3 bg-primary text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">Semaine</button>
            <button className="px-6 py-3 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl">Mois</button>
        </div>
      </div>

      {/* CORE KPI GRID - Tighter Gaps */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        {/* KPI RETARDS */}
        <div 
          className={`p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transition-all active-scale cursor-pointer ${overdueTasks.length > 0 ? 'bg-red-50 border-urgent/20 shadow-urgent/5' : 'bg-white border-slate-100'}`}
          onClick={() => overdueTasks.length > 0 && setShowCriticalPopup(true)}
        >
            <div className={`w-12 h-12 ${overdueTasks.length > 0 ? 'bg-urgent text-white' : 'bg-slate-50 text-slate-300'} rounded-2xl flex items-center justify-center mb-5 border border-white/20 shadow-md`}>
               <AlertTriangle size={24} strokeWidth={2.5} className={overdueTasks.length > 0 ? 'animate-pulse' : ''} />
            </div>
            <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-300'}`}>Urgences</p>
                <p className={`text-4xl font-black tracking-tighter mt-1 ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-900'}`}>{overdueTasks.length}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <div className="w-12 h-12 bg-success/5 rounded-2xl flex items-center justify-center text-success mb-5 border border-success/5">
                 <CheckCircle size={24} strokeWidth={2.5} />
             </div>
             <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Complétion</p>
             <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{completionRate}%</p>
           </div>
           <div className="w-full bg-slate-50 h-2 rounded-full mt-6 overflow-hidden">
                <div className="bg-success h-full transition-all duration-1000 shadow-md shadow-success/10" style={{ width: `${completionRate}%` }}></div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className={`w-12 h-12 ${blockedCount > 0 ? 'bg-urgent/10 text-urgent' : 'bg-slate-50 text-slate-200'} rounded-2xl flex items-center justify-center mb-5 border border-current/5`}>
               <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Bloquées</p>
                <p className={`text-4xl font-black tracking-tighter mt-1 ${blockedCount > 0 ? 'text-urgent' : 'text-slate-900'}`}>{blockedCount}</p>
            </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-slate-900/10 text-white relative overflow-hidden group active-scale cursor-pointer transition-all border-2 border-slate-800" onClick={handleGetInsights}>
          <div className="relative z-10 h-full flex flex-col">
            <Sparkles size={20} className="text-primary mb-5" strokeWidth={2.5} />
            <p className="text-[9px] font-black uppercase opacity-50 tracking-[0.2em] mb-2">IA Insight</p>
            <p className="text-[11px] font-bold leading-relaxed line-clamp-3">
                {loadingAi ? "Analyse..." : (aiInsight || "Générer l'analyse stratégique.")}
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-700"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6 px-3">
                <div className="flex items-center space-x-3">
                    <Target size={18} className="text-primary" strokeWidth={3} />
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Focus Missions</h3>
                </div>
                <button onClick={() => onNavigate('tasks')} className="text-[9px] font-black uppercase text-primary flex items-center active-scale transition-all hover:translate-x-1">
                  Tous <ArrowRight size={14} className="ml-1" />
                </button>
            </div>
            <div className="space-y-3">
              {myActiveTasks.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-slate-50 border-dashed text-slate-200 font-black text-[10px] uppercase tracking-[0.3em]">Flux libéré</div>
              ) : (
                myActiveTasks.slice(0, 4).map(task => {
                  const isLate = task.dueDate < today && task.status !== TaskStatus.DONE;
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => onNavigate('tasks')} 
                      className={`bg-white p-5 rounded-[2rem] border shadow-sm flex items-center justify-between active-scale cursor-pointer transition-all group overflow-hidden ${isLate ? 'border-urgent border-2 animate-pulse-subtle' : 'border-slate-100 hover:border-primary/10'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-1.5 h-10 rounded-full shadow-sm ${
                          isLate ? 'bg-urgent shadow-urgent/20' :
                          task.status === TaskStatus.BLOCKED ? 'bg-urgent/60' : 
                          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 
                          'bg-slate-200'
                        }`}></div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-black text-slate-900 text-sm tracking-tight group-hover:text-primary transition-colors ${isLate ? 'text-urgent' : ''}`}>{task.title}</h4>
                            {isLate && (
                              <span className="bg-urgent text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">RETARD</span>
                            )}
                          </div>
                          <div className="flex items-center mt-1 space-x-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{task.status}</p>
                            <div className="h-0.5 w-0.5 bg-slate-200 rounded-full"></div>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isLate ? 'text-urgent' : 'text-slate-300'}`}>{task.dueDate}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLate ? 'bg-urgent/10 text-urgent' : 'bg-slate-50 text-slate-100 group-hover:text-primary'}`}>
                          {isLate ? <AlertTriangle size={20} strokeWidth={2.5} /> : <CheckCircle size={20} strokeWidth={2.5} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-900 mb-6 uppercase tracking-[0.2em] text-[9px] text-slate-300 px-1 text-center">Raccourcis iV</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Chat', icon: MessageSquare, path: 'chat', color: 'text-primary' },
                        { label: 'Team', icon: Users, path: 'team', color: 'text-success' },
                        { label: 'Files', icon: FileText, path: 'files', color: 'text-warning' },
                        { label: 'CRM', icon: Briefcase, path: 'clients', color: 'text-urgent' }
                    ].map(tool => (
                        <button 
                            key={tool.label}
                            onClick={() => onNavigate(tool.path as any)}
                            className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-[1.8rem] border-2 border-white hover:border-primary/10 hover:bg-white hover:shadow-lg transition-all active-scale"
                        >
                            <tool.icon size={22} className={`${tool.color} mb-2`} strokeWidth={2.5} />
                            <span className="font-black text-slate-900 text-[8px] uppercase tracking-widest leading-tight text-center">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-6 bg-slate-900 rounded-[2.5rem] border-2 border-slate-800 text-center">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">iVISION Workspace</p>
                <p className="text-white/30 text-[8px] font-bold uppercase tracking-widest">v2.3 • Monitoring On</p>
            </div>
          </section>
      </div>
    </div>
  );
};

export default Dashboard;
