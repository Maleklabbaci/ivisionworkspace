
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, CheckCircle, Sparkles, Target, AlertTriangle, ChevronRight, Zap, ArrowUpRight, Clock, Loader2 } from 'lucide-react';
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

  const myActiveTasks = useMemo(() => {
    const active = (tasks || []).filter(t => t.status !== TaskStatus.DONE);
    return active.sort((a, b) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      const weightA = priorityWeight[a.priority || 'medium'];
      const weightB = priorityWeight[b.priority || 'medium'];
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks]);
  
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
        const timer = setTimeout(() => setShowCriticalPopup(true), 1500);
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* ALERTE RETARD */}
      {showCriticalPopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowCriticalPopup(false)}></div>
          <div className="relative bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 border-t-[14px] border-urgent p-10 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-urgent" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Urgences</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{overdueTasks.length} missions critiques</p>
              <button onClick={() => { setShowCriticalPopup(false); onNavigate('tasks'); }} className="w-full mt-10 py-5 bg-urgent text-white font-black rounded-2xl shadow-xl shadow-red-500/20 uppercase text-[10px] tracking-widest active-scale">INTERVENIR</button>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {showInsightModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowInsightModal(false)}></div>
          <div className="relative bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-10 bg-slate-900 text-white relative">
                <Sparkles size={32} className="text-primary mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Intelligence iV</h3>
                <p className="text-slate-500 font-bold text-[10px] mt-3 uppercase tracking-widest">Analyse Stratégique Automatisée</p>
            </div>
            <div className="p-10 space-y-8">
              <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{aiInsight}"</p>
              <button onClick={() => setShowInsightModal(false)} className="w-full py-5 bg-primary text-white font-black rounded-3xl uppercase text-[10px] tracking-[0.2em] active-scale border-4 border-white shadow-xl shadow-primary/20">MERCI iVISION</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Dashboard</h1>
          <p className="text-slate-300 font-bold text-[9px] uppercase tracking-[0.6em] mt-3">iV Command Center</p>
        </div>
        <div className="hidden lg:block">
           <div className="flex items-center space-x-3 bg-slate-50 px-5 py-3 rounded-2xl">
              <Clock size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 px-1">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group transition-all cursor-pointer" onClick={() => onNavigate('tasks')}>
            <div className={`w-14 h-14 ${overdueTasks.length > 0 ? 'bg-urgent text-white animate-pulse' : 'bg-slate-50 text-slate-300'} rounded-3xl flex items-center justify-center mb-8`}>
               <Clock size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">En retard</p>
                <p className={`text-5xl font-black tracking-tighter mt-1 ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-900'}`}>{overdueTasks.length}</p>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group">
             <div className="w-14 h-14 bg-success/10 rounded-3xl flex items-center justify-center text-success mb-8 group-hover:scale-110 transition-transform">
                 <CheckCircle size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Santé Globale</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter mt-1">{performanceScore}%</p>
             </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group" onClick={() => onNavigate('leads')}>
            <div className="w-14 h-14 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-8">
               <Target size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pipeline iV</p>
                <p className="text-5xl font-black text-slate-900 tracking-tighter mt-1">{tasks.filter(t => t.clientId).length}</p>
            </div>
        </div>

        <div 
          className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white group active-scale cursor-pointer transition-all border-4 border-white flex flex-col justify-between relative overflow-hidden" 
          onClick={handleGetInsights}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={100} />
            </div>
            <Sparkles size={24} className={`text-primary ${loadingAi ? 'animate-spin' : ''}`} />
            <div className="flex items-center justify-between mt-8 relative z-10">
              <span className="text-[11px] font-black tracking-[0.3em] uppercase">{loadingAi ? "Analyse..." : "Générer Insight"}</span>
              {loadingAi ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-1">
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight flex items-center">
                  <div className="w-2 h-5 bg-primary rounded-full mr-4"></div>
                  Missions en cours
                </h3>
                <button onClick={() => onNavigate('tasks')} className="text-[10px] font-black uppercase text-primary bg-primary/5 px-6 py-3 rounded-2xl active-scale">Voir l'ensemble</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {myActiveTasks.length === 0 ? (
                <div className="py-24 text-center bg-slate-50/50 rounded-[3rem] border-2 border-slate-100 border-dashed">
                  <CheckCircle size={48} className="mx-auto text-slate-200 mb-4 opacity-40" />
                  <p className="text-[11px] text-slate-300 font-black uppercase tracking-[0.3em]">Opérations terminées</p>
                </div>
              ) : (
                myActiveTasks.slice(0, 4).map((task, idx) => {
                  const isLate = task.dueDate && task.dueDate < today;
                  const priorityColor = task.priority === 'high' ? 'bg-urgent' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-primary';
                  
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => onNavigate('tasks')} 
                      style={{ animationDelay: `${idx * 100}ms` }}
                      className={`bg-white p-6 rounded-[2rem] border-2 flex items-center justify-between active-scale transition-all group hover:shadow-xl ${isLate ? 'border-urgent/10 bg-red-50/5' : 'border-slate-50 shadow-sm'}`}
                    >
                      <div className="flex items-center space-x-5 overflow-hidden">
                        <div className={`w-2 h-12 rounded-full flex-shrink-0 ${priorityColor} ${task.priority === 'high' ? 'animate-pulse' : ''}`}></div>
                        <div className="truncate">
                          <h4 className={`font-black text-slate-900 text-base truncate uppercase tracking-tight ${isLate ? 'text-urgent' : ''}`}>{task.title}</h4>
                          <div className="flex items-center space-x-3 mt-1.5">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{task.dueDate}</span>
                            {isLate && <span className="text-[8px] bg-urgent text-white px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">RETARD</span>}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-slate-200 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="bg-slate-50/50 p-10 rounded-[3.5rem] border-2 border-slate-100 flex flex-col items-center text-center justify-center group relative overflow-hidden min-h-[400px]">
                <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary mb-8 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                    <TrendingUp size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-2xl uppercase tracking-tighter leading-tight">Analytique<br/>Performances</h4>
                <p className="text-[11px] text-slate-400 font-bold mt-5 uppercase tracking-[0.2em] leading-relaxed">Intelligence augmentée iVISION<br/>pour le suivi des livrables.</p>
                <button onClick={() => onNavigate('reports')} className="mt-12 w-full py-5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[2rem] active-scale border-4 border-white shadow-2xl relative z-10">ACCÉDER AUX RAPPORTS</button>
          </section>
      </div>
    </div>
  );
};

export default Dashboard;
