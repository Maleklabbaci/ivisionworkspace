
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, CheckCircle, Sparkles, Target, AlertTriangle, ChevronRight, Zap, ArrowUpRight, Clock, Loader2, Activity, User as UserIcon } from 'lucide-react';
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

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
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
    let score = 0;
    tasks.forEach(t => {
        if (t.status === TaskStatus.DONE) score += 100;
        else if (t.status === TaskStatus.IN_PROGRESS) score += 50;
    });
    return Math.max(0, Math.min(100, Math.round(score / tasks.length)));
  }, [tasks]);

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const insight = await generateMarketingInsight(`Score: ${performanceScore}%. Tâches: ${tasks.length}`);
      setAiInsight(insight);
      setShowInsightModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const canViewCRM = hasAccess('canManageClients');
  const canViewReports = hasAccess('canViewReports');

  return (
    <div className="space-y-10 animate-in fade-in duration-700 w-full overflow-x-hidden">
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
            <div className="p-10">
              <p className="text-slate-700 font-medium leading-relaxed italic text-lg">"{aiInsight}"</p>
              <button onClick={() => setShowInsightModal(false)} className="w-full mt-10 py-4 bg-primary text-white font-bold rounded-xl uppercase text-xs tracking-wider active-scale">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Vue d'ensemble</h1>
          <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-1.5">{isAdmin ? "Command Center Administrator" : "Command Center Enterprise"}</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 self-start md:self-auto">
           <Clock size={14} className="text-vibrant-indigo" />
           <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Aujourd'hui</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-formal p-6 rounded-2xl group cursor-pointer" onClick={() => onNavigate('tasks')}>
            <div className={`w-10 h-10 ${overdueTasks.length > 0 ? 'bg-vibrant-rose/10 text-vibrant-rose' : 'bg-slate-100 text-slate-400'} rounded-xl flex items-center justify-center mb-6 transition-colors`}>
               <Clock size={18} />
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Retards Critiques</p>
            <p className={`text-4xl font-bold tracking-tighter mt-1 ${overdueTasks.length > 0 ? 'text-vibrant-rose' : 'text-slate-900'}`}>{overdueTasks.length}</p>
        </div>

        <div className="card-formal p-6 rounded-2xl group">
             <div className="w-10 h-10 bg-vibrant-emerald/10 text-vibrant-emerald rounded-xl flex items-center justify-center mb-6 transition-colors">
                 <CheckCircle size={18} />
             </div>
             <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Indice Santé</p>
             <p className="text-4xl font-bold text-slate-900 tracking-tighter mt-1 group-hover:text-vibrant-emerald transition-colors">{performanceScore}%</p>
        </div>

        {canViewCRM && (
          <div className="card-formal p-6 rounded-2xl group cursor-pointer" onClick={() => onNavigate('clients')}>
              <div className="w-10 h-10 bg-vibrant-sky/10 text-vibrant-sky rounded-xl flex items-center justify-center mb-6 transition-colors">
                <Target size={18} />
              </div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Actifs CRM</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tighter mt-1 group-hover:text-vibrant-sky transition-colors">{tasks.filter(t => t.clientId).length}</p>
          </div>
        )}

        {canViewReports && (
          <div className="bg-gradient-to-br from-slate-900 to-vibrant-indigo p-6 rounded-2xl shadow-xl text-white group cursor-pointer transition-all border border-slate-800 flex flex-col justify-between" onClick={handleGetInsights}>
              <Sparkles size={20} className={`${loadingAi ? 'animate-spin' : 'text-vibrant-amber'}`} />
              <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase truncate mr-2">{loadingAi ? "Analyse..." : "Insight IA"}</span>
                <ArrowUpRight size={16} />
              </div>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${canViewReports || isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
          <section className={`${canViewReports || isAdmin ? 'lg:col-span-2' : ''} space-y-4`}>
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Missions prioritaires</h3>
                <button onClick={() => onNavigate('tasks')} className="text-[10px] font-bold uppercase text-primary hover:text-vibrant-indigo transition-colors">Tout voir</button>
            </div>
            <div className={`grid ${!(canViewReports || isAdmin) ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}`}>
              {myActiveTasks.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed col-span-full">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aucune mission active</p>
                </div>
              ) : (
                myActiveTasks.slice(0, (canViewReports || isAdmin) ? 4 : 6).map((task) => (
                  <div key={task.id} className="card-formal p-5 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => onNavigate('tasks')}>
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <div className={`w-1 h-8 rounded-full flex-shrink-0 transition-all ${task.priority === 'high' ? 'bg-vibrant-rose' : 'bg-primary'}`}></div>
                      <div className="truncate">
                        <h4 className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">{task.title}</h4>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{task.dueDate}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                ))
              )}
            </div>

            {/* ADMIN ACTIVITY FEED - Below Tasks for better structure */}
            {isAdmin && (
               <div className="pt-8 space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center space-x-2">
                        <Activity size={16} className="text-primary" />
                        <span>Flux d'activités Global</span>
                      </h3>
                      <button onClick={() => onNavigate('team')} className="text-[10px] font-bold uppercase text-slate-400 hover:text-primary transition-colors">Gérer l'équipe</button>
                  </div>
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Aucune activité enregistrée.</p>
                        </div>
                    ) : (
                        activities.slice(0, 8).map((log) => (
                            <div key={log.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all">
                                <div className="flex items-center space-x-4">
                                    <img src={log.userAvatar} className="w-8 h-8 rounded-lg object-cover border border-slate-200" alt="" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">
                                            <span className="text-primary uppercase mr-1">{log.userName}</span>
                                            <span className="text-slate-500 font-medium lowercase tracking-tight">{log.action}</span>
                                        </p>
                                        <p className="text-[9px] font-black text-slate-300 uppercase mt-0.5 truncate max-w-[180px]">
                                            {log.target}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap ml-4">
                                    {log.timestamp}
                                </span>
                            </div>
                        ))
                    )}
                  </div>
               </div>
            )}
          </section>

          {(canViewReports || isAdmin) && (
            <section className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center text-center justify-center space-y-6 lg:sticky lg:top-8 self-start shadow-sm">
                  <TrendingUp size={32} className="text-vibrant-indigo" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xl uppercase tracking-tight">Rapports IA</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-2 leading-relaxed uppercase tracking-wider">Analyse profonde des KPIs marketing iVISION.</p>
                  </div>
                  <button onClick={() => onNavigate('reports')} className="w-full py-4 bg-white text-slate-900 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 hover:border-vibrant-indigo hover:text-vibrant-indigo transition-all shadow-sm active-scale">Consulter les analyses</button>
                  
                  {isAdmin && (
                    <div className="pt-6 w-full border-t border-slate-100">
                      <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                         <Zap size={14} className="text-vibrant-amber" />
                         <span>Quick Actions</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onNavigate('team')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center justify-center space-y-1 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <UserIcon size={14} className="text-primary" />
                           <span className="text-[8px] font-bold uppercase">Équipe</span>
                        </button>
                        <button onClick={() => onNavigate('settings')} className="p-3 bg-slate-50 rounded-xl flex flex-col items-center justify-center space-y-1 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <Activity size={14} className="text-vibrant-indigo" />
                           <span className="text-[8px] font-bold uppercase">Logs</span>
                        </button>
                      </div>
                    </div>
                  )}
            </section>
          )}
      </div>
    </div>
  );
};

export default Dashboard;
