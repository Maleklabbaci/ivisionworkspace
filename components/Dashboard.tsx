import React, { useState } from 'react';
import { TrendingUp, CheckCircle, Bell, Sparkles, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus, UserRole, ToastNotification } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  notifications: ToastNotification[];
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks, notifications, onNavigate }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== TaskStatus.DONE);
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0;

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    const context = `Productivity: ${completionRate}%. Tasks: ${tasks.length}.`;
    const insight = await generateMarketingInsight(context);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const showFinancials = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canViewFinancials;

  return (
    <div className="space-y-8 page-transition pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Hello, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">iVISION WORKSPACE</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-full active-scale"><Bell size={22} className="text-slate-400" /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group active-scale" onClick={handleGetInsights}>
          <div className="relative z-10">
            <Sparkles size={18} className="text-primary mb-2" />
            <p className="text-[11px] font-black uppercase opacity-40">IA INSIGHTS</p>
            <p className="text-xs font-bold leading-tight mt-1 line-clamp-2">{loadingAi ? "Analyzing..." : (aiInsight || "Tap to analyze flow")}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
        </div>
        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
           <TrendingUp size={18} className="text-primary mb-2" />
           <p className="text-[11px] font-black uppercase text-slate-400">Rate</p>
           <p className="text-2xl font-black text-slate-900">{completionRate}%</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-black text-slate-900">My Missions</h3>
            <button className="text-[11px] font-black uppercase text-primary flex items-center">See All <ArrowRight size={14} className="ml-1" /></button>
        </div>
        <div className="space-y-3">
          {myTasks.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] text-slate-300 font-bold text-xs uppercase tracking-widest">No active tasks</div>
          ) : (
            myTasks.slice(0, 3).map(task => (
              <div key={task.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between active-scale">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-urgent' : 'bg-primary'}`}></div>
                  <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                </div>
                <CheckCircle size={20} className="text-slate-100" />
              </div>
            ))
          )}
        </div>
      </section>

      {showFinancials && (
        <section className="bg-primary p-7 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-primary/30">
           <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black uppercase opacity-50 tracking-widest">Revenue Forecast</p>
                <h3 className="text-3xl font-black">{(tasks.reduce((a,c)=>a+(c.price||0),0)).toLocaleString()} DA</h3>
              </div>
              <DollarSign size={40} className="opacity-10" />
           </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;