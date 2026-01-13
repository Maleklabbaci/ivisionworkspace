
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, CheckCircle, Sparkles, Activity, Target, AlertTriangle, X, ChevronRight, Zap, ArrowUpRight, Clock } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus, ToastNotification } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  notifications: ToastNotification[];
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks = [], notifications, onNavigate }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [showCriticalPopup, setShowCriticalPopup] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const overdueTasks = useMemo(() => 
    (tasks || []).filter(t => t?.dueDate && t.dueDate < today && t.status !== TaskStatus.DONE), 
  [tasks, today]);

  // TRI : Priorité Haute d'abord, puis par date d'échéance
  const myActiveTasks = useMemo(() => {
    const active = (tasks || []).filter(t => t?.assigneeId === currentUser?.id && t.status !== TaskStatus.DONE);
    return active.sort((a, b) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      const weightA = priorityWeight[a.priority || 'medium'];
      const weightB = priorityWeight[b.priority || 'medium'];
      
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks, currentUser?.id]);
  
  const performanceScore = useMemo(() => {
    if (!tasks || tasks.length === 0) return 100;
    let score = 0;
    tasks.forEach(t => {
        if (t.status === TaskStatus.DONE) score += 100;
        else if (t.status === TaskStatus.IN_PROGRESS) score += 50;
        else if (t.status === TaskStatus.BLOCKED) score -= 20;
        if (t.dueDate < today && t.status !== TaskStatus.DONE) score -= 30;
    });
    return Math.max(0, Math.min(100, Math.round(score / tasks.length)));
  }, [tasks, today]);

  useEffect(() => {
    if (overdueTasks.length > 0) {
      const hasSeenAlert = sessionStorage.getItem('ivision_alert_v2');
      if (!hasSeenAlert) {
        const timer = setTimeout(() => setShowCriticalPopup(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [overdueTasks.length]);

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const context = `Score: ${performanceScore}%. Missions: ${tasks.length}. Retards: ${overdueTasks.length}.`;
      const insight = await generateMarketingInsight(context);
      setAiInsight(insight);
      setShowInsightModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8 page-transition pb-20">
      {/* ALERTE RETARD */}
      {showCriticalPopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowCriticalPopup(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 border-t-[12px] border-urgent p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-urgent" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Urgences</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{overdueTasks.length} missions en retard critique</p>
              <button onClick={() => { setShowCriticalPopup(false); onNavigate('tasks'); }} className="w-full mt-8 py-5 bg-urgent text-white font-black rounded-2xl shadow-xl shadow-red-500/20 uppercase text-[10px] tracking-widest active-scale">RÉGULARISER MAINTENANT</button>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {showInsightModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowInsightModal(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-10 bg-slate-900 text-white">
                <Sparkles size={32} className="text-primary mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Analyse Stratégique</h3>
            </div>
            <div className="p-10 space-y-6">
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{aiInsight}</p>
              <button onClick={() => setShowInsightModal(false)} className="w-full py-5 bg-primary text-white font-black rounded-3xl uppercase text-[10px] tracking-widest active-scale">OK, COMPRIS</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-1">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Dashboard</h1>
        <p className="text-slate-300 font-bold text-[8px] uppercase tracking-[0.5em] mt-1">iVISION OPERATIONAL COMMAND</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group transition-all cursor-pointer" onClick={() => onNavigate('tasks')}>
            <div className={`w-12 h-12 ${overdueTasks.length > 0 ? 'bg-urgent text-white' : 'bg-slate-50 text-slate-300'} rounded-2xl flex items-center justify-center mb-6`}>
               <Clock size={22} />
            </div>
            <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Retards</p>
                <p className={`text-4xl font-black tracking-tighter mt-1 ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-900'}`}>{overdueTasks.length}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group">
             <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success mb-6 group-hover:scale-110 transition-transform">
                 <CheckCircle size={22} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Score Santé</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{performanceScore}%</p>
             </div>
        </div>

        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group" onClick={() => onNavigate('leads')}>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
               <Target size={22} />
            </div>
            <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Leads Actifs</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{tasks.filter(t => t.clientId).length}</p>
            </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.2rem] shadow-xl text-white group active-scale cursor-pointer transition-all border-4 border-white flex flex-col justify-between" onClick={handleGetInsights}>
            <Sparkles size={20} className={`text-primary ${loadingAi ? 'animate-spin' : ''}`} />
            <div className="flex items-center justify-between mt-6">
              <span className="text-[10px] font-black tracking-widest uppercase">{loadingAi ? "IA..." : "Insight IA"}</span>
              <ArrowUpRight size={16} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center">
                  <div className="w-1.5 h-4 bg-primary rounded-full mr-3"></div>
                  Missions Prioritaires
                </h3>
                <button onClick={() => onNavigate('tasks')} className="text-[9px] font-black uppercase text-primary bg-primary/5 px-4 py-2 rounded-xl">Voir tout</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {myActiveTasks.length === 0 ? (
                <div className="p-16 text-center bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                  <CheckCircle size={40} className="mx-auto text-slate-200 mb-4 opacity-30" />
                  <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Zéro mission en cours</p>
                </div>
              ) : (
                myActiveTasks.slice(0, 4).map(task => {
                  const isLate = task.dueDate && task.dueDate < today;
                  const priorityColor = task.priority === 'high' ? 'bg-urgent' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-primary';
                  
                  return (
                    <div key={task.id} onClick={() => onNavigate('tasks')} className={`bg-white p-5 rounded-3xl border flex items-center justify-between active-scale transition-all group hover-effect ${isLate ? 'border-urgent/30 bg-red-50/10' : 'border-slate-50 shadow-sm'}`}>
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${priorityColor} ${task.priority === 'high' ? 'animate-pulse' : ''}`}></div>
                        <div className="truncate">
                          <h4 className={`font-black text-slate-900 text-sm truncate uppercase tracking-tight ${isLate ? 'text-urgent' : ''}`}>{task.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{task.dueDate}</p>
                            {task.priority === 'high' && <span className="text-[8px] bg-urgent text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">URGENT</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-100 group-hover:text-primary transition-colors" />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center justify-center group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm group-hover:rotate-12 transition-transform">
                    <TrendingUp size={24} />
                </div>
                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Analyse<br/>Performance</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest">Suivi des KPIs stratégiques.</p>
                <button onClick={() => onNavigate('reports')} className="mt-8 px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl active-scale border-4 border-white shadow-xl">ACCÉDER</button>
          </section>
      </div>
    </div>
  );
};

export default Dashboard;
