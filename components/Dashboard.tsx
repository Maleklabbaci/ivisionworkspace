
import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Sparkles, ArrowRight, Activity, Users, Target, MessageSquare, FileText, Briefcase, AlertTriangle, X, ChevronRight, Zap } from 'lucide-react';
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
  const [showInsightModal, setShowInsightModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  
  const overdueTasks = tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE);
  const myActiveTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== TaskStatus.DONE);
  
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;

  useEffect(() => {
    if (overdueTasks.length > 0) {
      setShowCriticalPopup(true);
    }
  }, [overdueTasks.length]);

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    const context = `Opérations : ${tasks.length} missions. Retards : ${overdueTasks.length}. Bloquées : ${blockedCount}. Utilisateur : ${currentUser.name}, Role : ${currentUser.role}.`;
    const insight = await generateMarketingInsight(context);
    setAiInsight(insight);
    setLoadingAi(false);
    setShowInsightModal(true);
  };

  return (
    <div className="space-y-6 page-transition pb-16 max-w-full overflow-x-hidden">
      {/* POP-UP RETARD CRITIQUE */}
      {showCriticalPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/20 backdrop-blur-md animate-in fade-in" onClick={() => setShowCriticalPopup(false)}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 border-2 border-urgent">
            <div className="p-5 bg-urgent text-white text-center">
              <AlertTriangle size={24} className="mx-auto mb-2" />
              <h3 className="text-lg font-black uppercase tracking-tighter">Retard Détecté</h3>
              <p className="text-[8px] font-black opacity-80 uppercase tracking-widest">{overdueTasks.length} missions critiques</p>
            </div>
            <div className="p-5">
              <button onClick={() => { setShowCriticalPopup(false); onNavigate('tasks'); }} className="w-full py-3.5 bg-urgent text-white font-black rounded-xl shadow-lg uppercase text-[8px] tracking-widest active-scale">VOIR MISSIONS</button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP IA INSIGHT */}
      {showInsightModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowInsightModal(false)}></div>
          <div className="relative bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,102,255,0.3)] w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-primary/10">
            <div className="p-8 bg-gradient-to-br from-primary to-blue-700 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                  <Zap size={24} className="text-white" fill="white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Analyse IA</h3>
                <p className="text-white/70 font-bold text-[9px] mt-2 uppercase tracking-widest">Recommandations Stratégiques</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                {aiInsight.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <div key={idx} className="flex items-start space-x-3 group">
                    <div className="w-6 h-6 bg-primary/5 rounded-lg flex items-center justify-center text-primary font-black text-[10px] mt-0.5 group-hover:bg-primary group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{line.replace(/^\d+\.\s*/, '')}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowInsightModal(false)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 active-scale uppercase text-[9px] tracking-widest mt-4"
              >
                COMPRIS, JE M'EN OCCUPE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Aperçu</h1>
          <p className="text-slate-300 font-bold text-[7px] uppercase tracking-[0.4em] mt-0.5">Monitoring iVISION actif</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
        <div className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between active-scale cursor-pointer transition-all ${overdueTasks.length > 0 ? 'bg-red-50 border-urgent/10' : 'bg-white border-slate-50'}`} onClick={() => overdueTasks.length > 0 && setShowCriticalPopup(true)}>
            <div className={`w-9 h-9 ${overdueTasks.length > 0 ? 'bg-urgent text-white' : 'bg-slate-50 text-slate-300'} rounded-xl flex items-center justify-center mb-4`}>
               <AlertTriangle size={18} />
            </div>
            <div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-300'}`}>Alertes</p>
                <p className={`text-3xl font-black tracking-tighter mt-0.5 ${overdueTasks.length > 0 ? 'text-urgent' : 'text-slate-900'}`}>{overdueTasks.length}</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex flex-col justify-between">
           <div>
             <div className="w-9 h-9 bg-success/5 rounded-xl flex items-center justify-center text-success mb-4">
                 <CheckCircle size={18} />
             </div>
             <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Complétion</p>
             <p className="text-3xl font-black text-slate-900 tracking-tighter mt-0.5">{completionRate}%</p>
           </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex flex-col justify-between">
            <div className={`w-9 h-9 ${blockedCount > 0 ? 'bg-urgent/10 text-urgent' : 'bg-slate-50 text-slate-200'} rounded-xl flex items-center justify-center mb-4`}>
               <Activity size={18} />
            </div>
            <div>
                <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Bloquées</p>
                <p className={`text-3xl font-black tracking-tighter mt-0.5 ${blockedCount > 0 ? 'text-urgent' : 'text-slate-900'}`}>{blockedCount}</p>
            </div>
        </div>

        <div 
          className="bg-slate-900 p-5 rounded-3xl shadow-lg text-white group active-scale cursor-pointer transition-all border-2 border-slate-800 flex flex-col justify-between relative overflow-hidden" 
          onClick={handleGetInsights}
        >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <Sparkles size={16} className={`text-primary mb-2 ${loadingAi ? 'animate-spin' : ''}`} />
                <p className="text-[7px] font-black uppercase opacity-50 tracking-[0.2em]">IA Insight</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black tracking-widest uppercase">{loadingAi ? "Analyse..." : "Générer"}</span>
                <ChevronRight size={14} className="text-primary" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-1">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Missions Prioritaires</h3>
                <button onClick={() => onNavigate('tasks')} className="text-[8px] font-black uppercase text-primary active-scale">Tout voir</button>
            </div>
            <div className="space-y-2">
              {myActiveTasks.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed text-slate-300 font-black text-[9px] uppercase tracking-widest">Flux libéré</div>
              ) : (
                myActiveTasks.slice(0, 3).map(task => {
                  const isLate = task.dueDate < today;
                  return (
                    <div key={task.id} onClick={() => onNavigate('tasks')} className={`bg-white p-4 rounded-2xl border flex items-center justify-between active-scale transition-all ${isLate ? 'border-urgent animate-pulse-subtle' : 'border-slate-50'}`}>
                      <div className="flex items-center space-x-3 truncate">
                        <div className={`w-1 h-7 rounded-full flex-shrink-0 ${isLate ? 'bg-urgent' : 'bg-primary'}`}></div>
                        <div className="truncate">
                          <h4 className={`font-black text-slate-900 text-xs truncate ${isLate ? 'text-urgent' : ''}`}>{task.title}</h4>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{task.dueDate}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-100" />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center justify-center">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
                    <TrendingUp size={18} />
                </div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Statistiques Agence</h4>
                <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Analyse profonde des données.</p>
                <button onClick={() => onNavigate('reports')} className="mt-4 px-6 py-2.5 bg-white border border-slate-100 text-slate-900 font-black text-[8px] uppercase tracking-widest rounded-lg shadow-sm active-scale">Analytique</button>
          </section>
      </div>
    </div>
  );
};

export default Dashboard;
