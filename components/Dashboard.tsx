
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, CheckCircle, Sparkles, ArrowRight, Activity, Users, Target, MessageSquare, FileText, Briefcase, AlertTriangle, X, ChevronRight, Zap, ArrowUpRight } from 'lucide-react';
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

  // Utilisation de l'heure locale pour éviter les décalages UTC/Fuseau horaire
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  
  const overdueTasks = useMemo(() => 
    tasks.filter(t => t?.dueDate && t.dueDate < today && t.status !== TaskStatus.DONE), 
  [tasks, today]);

  const myActiveTasks = useMemo(() => 
    tasks.filter(t => t?.assigneeId === currentUser?.id && t.status !== TaskStatus.DONE), 
  [tasks, currentUser?.id]);
  
  const completionRate = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const blockedCount = useMemo(() => 
    tasks.filter(t => t.status === TaskStatus.BLOCKED).length, 
  [tasks]);

  // Alerte critique : Une seule fois par session
  useEffect(() => {
    if (overdueTasks.length > 0) {
      const hasSeenAlert = sessionStorage.getItem('ivision_alert_v1');
      if (!hasSeenAlert) {
        // Petit délai pour laisser le dashboard s'afficher avant le popup
        const timer = setTimeout(() => setShowCriticalPopup(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [overdueTasks.length]);

  const closeAlert = () => {
    setShowCriticalPopup(false);
    sessionStorage.setItem('ivision_alert_v1', 'true');
  };

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const context = `Opérations : ${tasks.length} missions. Retards : ${overdueTasks.length}. Bloquées : ${blockedCount}.`;
      const insight = await generateMarketingInsight(context);
      setAiInsight(insight);
      setShowInsightModal(true);
    } catch (err) {
      console.error("Dashboard IA Error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8 page-transition pb-16 max-w-full">
      {/* POP-UP RETARD CRITIQUE */}
      {showCriticalPopup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={closeAlert}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 border-b-8 border-urgent">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-urgent" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Missions en péril</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{overdueTasks.length} retards critiques identifiés</p>
              
              <div className="mt-8 space-y-3">
                <button onClick={() => { closeAlert(); onNavigate('tasks'); }} className="w-full py-4 bg-urgent text-white font-black rounded-2xl shadow-xl shadow-red-500/20 uppercase text-[10px] tracking-widest active-scale">RÉGULARISER</button>
                <button onClick={closeAlert} className="w-full py-3 text-slate-300 font-black uppercase text-[9px] tracking-widest">Ignorer pour l'instant</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {showInsightModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowInsightModal(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 border border-slate-100">
            <div className="p-10 bg-slate-900 text-white relative">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/40">
                  <Zap size={24} className="text-white" fill="white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Analyse Stratégique</h3>
                <p className="text-slate-500 font-bold text-[9px] mt-2 uppercase tracking-widest">Brainstorming iVISION AI</p>
            </div>
            <div className="p-10 space-y-6 bg-white">
              <div className="space-y-4">
                {aiInsight.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <div key={idx} className="flex items-start space-x-4 animate-in fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900 font-black text-[10px] flex-shrink-0 mt-0.5 border border-slate-100">
                      {idx + 1}
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowInsightModal(false)} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/20 active-scale uppercase text-[10px] tracking-[0.2em] border-4 border-white">FERMER</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Dashboard</h1>
          <p className="text-slate-300 font-bold text-[8px] uppercase tracking-[0.5em] mt-1">Status opérationnel : {tasks.length > 0 ? 'ACTIF' : 'ATTENTE'}</p>
        </div>
        <div className="hidden lg:flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 p-2 px-4 rounded-xl border border-slate-100">
            <div className={`w-2 h-2 rounded-full animate-pulse ${tasks.length > 0 ? 'bg-success' : 'bg-orange-400'}`}></div>
            <span>Système iV Connecté</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        <div onClick={() => overdueTasks.length > 0 && setShowCriticalPopup(true)} className={`p-6 rounded-[2.2rem] border shadow-sm flex flex-col justify-between active-scale cursor-pointer transition-all hover-effect ${overdueTasks.length > 0 ? 'bg-red-50 border-urgent/20' : 'bg-white border-slate-50'}`}>
            <div className={`w-12 h-12 ${overdueTasks.length > 0 ? 'bg-urgent text-white' : 'bg-slate-50 text-slate-300'} rounded-2xl flex items-center justify-center mb-6`}>
               <AlertTriangle size={22} />
            </div>
            <div>
                <p className={`text-[9px] font-black uppercase tracking-widest ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-400'}`}>Retards</p>
                <p className={`text-4xl font-black tracking-tighter mt-1 ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-900'}`}>{overdueTasks.length}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group">
             <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success mb-6 group-hover:scale-110 transition-transform">
                 <CheckCircle size={22} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Efficacité</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{completionRate}%</p>
             </div>
        </div>

        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-50 shadow-sm flex flex-col justify-between hover-effect group">
            <div className={`w-12 h-12 ${blockedCount > 0 ? 'bg-urgent/10 text-urgent' : 'bg-slate-50 text-slate-200'} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}>
               <Activity size={22} />
            </div>
            <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Bloqués</p>
                <p className={`text-4xl font-black tracking-tighter mt-1 ${blockedCount > 0 ? 'text-urgent' : 'text-slate-900'}`}>{blockedCount}</p>
            </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.2rem] shadow-xl text-white group active-scale cursor-pointer transition-all border-4 border-white flex flex-col justify-between relative overflow-hidden" onClick={handleGetInsights}>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <Sparkles size={20} className={`text-primary mb-4 ${loadingAi ? 'animate-spin' : ''}`} />
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-black tracking-widest uppercase">{loadingAi ? "Analyse..." : "IA Insight"}</span>
                <ArrowUpRight size={16} className="text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center">
                  <div className="w-1.5 h-4 bg-primary rounded-full mr-3"></div>
                  Missions Prioritaires
                </h3>
                <button onClick={() => onNavigate('tasks')} className="text-[9px] font-black uppercase text-primary bg-primary/5 px-4 py-2 rounded-xl">Tout voir</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {myActiveTasks.length === 0 ? (
                <div className="p-16 text-center bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                  <CheckCircle size={40} className="mx-auto text-slate-200 mb-4 opacity-30" />
                  <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Aucune mission en cours</p>
                </div>
              ) : (
                myActiveTasks.slice(0, 4).map(task => {
                  const isLate = task.dueDate && task.dueDate < today;
                  return (
                    <div key={task.id} onClick={() => onNavigate('tasks')} className={`bg-white p-5 rounded-3xl border flex items-center justify-between active-scale transition-all group hover-effect ${isLate ? 'border-urgent/30 bg-red-50/10' : 'border-slate-50 shadow-sm'}`}>
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${isLate ? 'bg-urgent' : 'bg-primary'}`}></div>
                        <div className="truncate">
                          <h4 className={`font-black text-slate-900 text-sm truncate uppercase tracking-tight ${isLate ? 'text-urgent' : ''}`}>{task.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{task.dueDate || 'Sans date'}</p>
                            {isLate && <span className="text-[8px] bg-urgent text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">RETARD</span>}
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

          <section className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center justify-center relative overflow-hidden group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
                    <TrendingUp size={24} />
                </div>
                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight">Analytique<br/>Avancée</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest">Suivi complet des KPIs d'agence.</p>
                <button onClick={() => onNavigate('reports')} className="mt-8 px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl active-scale border-4 border-white">ACCÉDER</button>
          </section>
      </div>
    </div>
  );
};

export default Dashboard;
