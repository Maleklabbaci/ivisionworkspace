
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, CheckCircle, Sparkles, Target, AlertTriangle, 
  ChevronRight, Zap, ArrowUpRight, Clock, Loader2, 
  Activity, User as UserIcon, Layout as LayoutIcon, 
  Eye, EyeOff, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus, ToastNotification, UserRole, ActivityLog } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  activities?: ActivityLog[];
  notifications: ToastNotification[];
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks = [], activities = [], notifications, onNavigate }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  
  // Widget visibility state (persisted in local storage ideally, but local state for now)
  const [visibleWidgets, setVisibleWidgets] = useState({
    kpis: true,
    aiInsight: true,
    priorityTasks: true,
    activityLogs: true,
    performanceChart: true
  });

  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  const hasAccess = (permissionKey: string) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    return !!(currentUser.permissions as any)?.[permissionKey];
  };

  const overdueTasks = useMemo(() => 
    (tasks || []).filter(t => t?.dueDate && t.dueDate < today && t.status !== TaskStatus.DONE), 
  [tasks, today]);

  const myActiveTasks = useMemo(() => {
    const active = (tasks || []).filter(t => t.status !== TaskStatus.DONE);
    return active.sort((a, b) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      return (priorityWeight[a.priority || 'medium'] - priorityWeight[b.priority || 'medium']);
    });
  }, [tasks]);
  
  const performanceScore = useMemo(() => {
    if (!tasks || tasks.length === 0) return 100;
    let totalScore = 0;
    tasks.forEach(t => {
        if (t.status === TaskStatus.DONE) totalScore += 100;
        else if (t.status === TaskStatus.IN_PROGRESS) totalScore += 40;
        if (t.dueDate < today && t.status !== TaskStatus.DONE) totalScore -= 15;
    });
    const final = Math.round(totalScore / tasks.length);
    return Math.max(0, Math.min(100, final));
  }, [tasks, today]);

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const insight = await generateMarketingInsight(`Score Santé: ${performanceScore}%. Tâches totales: ${tasks.length}, Retards: ${overdueTasks.length}.`);
      setAiInsight(insight);
      setShowInsightModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleWidget = (widget: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({ ...prev, [widget]: !prev[widget] }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 w-full pb-20">
      {/* INSIGHT MODAL */}
      {showInsightModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInsightModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden modal-drawer">
            <div className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold tracking-tight uppercase">Intelligence iV</h3>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-1">Analyse Analytique</p>
                </div>
                <Sparkles size={24} className="text-vibrant-amber" />
            </div>
            <div className="p-10 text-center">
              <p className="text-slate-700 font-medium leading-relaxed italic text-lg">"{aiInsight}"</p>
              <button onClick={() => setShowInsightModal(false)} className="w-full mt-10 py-4 bg-primary text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest active-scale shadow-lg shadow-primary/20">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <LayoutIcon className="text-primary" size={24} />
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Accueil</h1>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-1.5 ml-1">
            {isAdmin ? "Command Center Administrator" : "Workspace Enterprise"}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsCustomizeMode(!isCustomizeMode)}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active-scale border-2 ${isCustomizeMode ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
          >
            {isCustomizeMode ? <CheckCircle size={14} /> : <LayoutIcon size={14} />}
            <span>{isCustomizeMode ? "Terminer" : "Personnaliser"}</span>
          </button>
          
          <div className="hidden sm:flex items-center space-x-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
             <Clock size={14} className="text-primary" />
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {/* CUSTOMIZE MODE OVERLAY BAR */}
      {isCustomizeMode && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex flex-wrap items-center justify-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2">Widgets actifs:</span>
          {[
            { id: 'kpis', label: 'Compteurs KPI', icon: BarChart3 },
            { id: 'aiInsight', label: 'Bannière IA', icon: Sparkles },
            { id: 'priorityTasks', label: 'Missions', icon: CheckCircle },
            { id: 'activityLogs', label: 'Journal', icon: Activity },
            { id: 'performanceChart', label: 'Graphique Score', icon: TrendingUp }
          ].map(w => (
            <button 
              key={w.id} 
              onClick={() => toggleWidget(w.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${visibleWidgets[w.id as keyof typeof visibleWidgets] ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500'}`}
            >
              {visibleWidgets[w.id as keyof typeof visibleWidgets] ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>{w.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* KPI GRID */}
      {visibleWidgets.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden" onClick={() => onNavigate('tasks')}>
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock size={120} />
              </div>
              <div className={`w-12 h-12 ${overdueTasks.length > 0 ? 'bg-red-50 text-urgent' : 'bg-slate-50 text-slate-400'} rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-colors`}>
                 <Clock size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Retards Critiques</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <p className={`text-4xl font-black tracking-tighter ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-900'}`}>{overdueTasks.length}</p>
                <span className="text-[10px] font-bold text-slate-300 uppercase">Missions</span>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp size={120} />
              </div>
               <div className="w-12 h-12 bg-emerald-50 text-success rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-colors">
                   <TrendingUp size={20} strokeWidth={2.5} />
               </div>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Santé Globale iV</p>
               <div className="flex items-baseline space-x-2 mt-2">
                 <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-success transition-colors">{performanceScore}%</p>
                 <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${performanceScore}%` }}></div>
                 </div>
               </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden" onClick={() => onNavigate('clients')}>
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target size={120} />
              </div>
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-colors">
                <Target size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Clients Actifs</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">
                  {new Set(tasks.filter(t => t.clientId).map(t => t.clientId)).size}
                </p>
                <span className="text-[10px] font-bold text-slate-300 uppercase">Comptes</span>
              </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all cursor-pointer relative overflow-hidden" onClick={() => onNavigate('leads')}>
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={120} />
              </div>
              <div className="w-12 h-12 bg-amber-50 text-vibrant-amber rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-colors">
                <Zap size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vitesse Pipeline</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-vibrant-amber transition-colors">
                  {tasks.filter(t => t.status === TaskStatus.DONE).length}
                </p>
                <span className="text-[10px] font-bold text-slate-300 uppercase">Succès</span>
              </div>
          </div>
        </div>
      )}

      {/* AI INSIGHT WIDGET */}
      {visibleWidgets.aiInsight && hasAccess('canViewReports') && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary p-1 rounded-[3rem] shadow-2xl group active-scale cursor-pointer overflow-hidden relative" onClick={handleGetInsights}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] pointer-events-none"></div>
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
                <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-tr from-vibrant-amber to-vibrant-orange rounded-3xl flex items-center justify-center shadow-lg shadow-vibrant-amber/20 group-hover:rotate-12 transition-transform duration-500">
                        {loadingAi ? <Loader2 className="animate-spin text-white" size={32} /> : <Sparkles className="text-white" size={32} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">Intelligence iV Flash</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center">
                            <span className="w-2 h-2 bg-success rounded-full animate-pulse mr-2"></span>
                            Prêt pour analyse instantanée
                        </p>
                    </div>
                </div>
                <button className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl group-hover:bg-primary group-hover:text-white transition-all flex items-center space-x-2">
                    <span>Générer Rapport IA</span>
                    <ArrowUpRight size={16} />
                </button>
            </div>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* PRIORITY TASKS WIDGET */}
          {visibleWidgets.priorityTasks && (
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="text-primary" size={20} />
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest leading-none">Missions prioritaires</h3>
                    </div>
                    <button onClick={() => onNavigate('tasks')} className="text-[10px] font-black uppercase text-primary hover:text-vibrant-indigo transition-colors tracking-widest">Flux complet</button>
                </div>
                
                <div className="space-y-4">
                  {myActiveTasks.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 border-dashed">
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Aucun blocage opérationnel</p>
                    </div>
                  ) : (
                    myActiveTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all" onClick={() => onNavigate('tasks')}>
                        <div className="flex items-center space-x-5 overflow-hidden">
                          <div className={`w-1.5 h-10 rounded-full flex-shrink-0 transition-all ${task.priority === 'high' ? 'bg-urgent shadow-lg shadow-urgent/20' : 'bg-primary'}`}></div>
                          <div className="truncate">
                            <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors leading-none">{task.title}</h4>
                            <div className="flex items-center mt-2 space-x-3">
                                <p className={`text-[9px] font-black uppercase tracking-widest ${task.dueDate < today ? 'text-urgent animate-pulse' : 'text-slate-400'}`}>
                                  {task.dueDate < today ? 'En retard' : `Échéance: ${task.dueDate}`}
                                </p>
                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{task.priority} Priority</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                            <ChevronRight size={18} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
          )}

          {/* ACTIVITY & SCORE WIDGETS */}
          <div className="space-y-10">
              
              {/* PERFORMANCE SCORE WIDGET */}
              {visibleWidgets.performanceChart && (
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center space-y-8 relative overflow-hidden group shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-[10px] border-slate-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-[10px] border-primary border-t-transparent animate-[spin_3s_linear_infinite] opacity-20"></div>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{performanceScore}%</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary border border-slate-100">
                             <TrendingUp size={18} />
                        </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">Productivité iV</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-3 leading-relaxed uppercase tracking-wider">Algorithme de performance en temps réel basé sur vos livrables.</p>
                    </div>
                    <button onClick={() => onNavigate('reports')} className="w-full py-5 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm active-scale">Rapports Complets</button>
                </div>
              )}

              {/* ACTIVITY LOGS WIDGET */}
              {visibleWidgets.activityLogs && isAdmin && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-3">
                            <Activity className="text-primary" size={20} />
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest leading-none">Journal iVISION</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                      {activities.length === 0 ? (
                          <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                              <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">Aucun mouvement iV</p>
                          </div>
                      ) : (
                          activities.slice(0, 4).map((log) => (
                              <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-50 flex items-center justify-between group hover:shadow-md transition-all">
                                  <div className="flex items-center space-x-4 truncate">
                                      <img src={log.userAvatar} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-sm" alt="" />
                                      <div className="truncate">
                                          <p className="text-[11px] font-black text-slate-900 tracking-tight truncate leading-tight">
                                              <span className="text-primary uppercase mr-1">{log.userName}</span>
                                              <span className="text-slate-500 lowercase">{log.action}</span>
                                          </p>
                                          <p className="text-[9px] font-bold text-slate-300 uppercase mt-1 truncate">
                                              {log.target}
                                          </p>
                                      </div>
                                  </div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg ml-3">
                                      {log.timestamp}
                                  </span>
                              </div>
                          ))
                      )}
                    </div>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
