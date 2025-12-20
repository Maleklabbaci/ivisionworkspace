import React, { useState } from 'react';
import { TrendingUp, CheckCircle, Bell, Sparkles, Calendar, MessageCircle, DollarSign } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus, UserRole, Message, ToastNotification, Channel } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  messages: Message[];
  notifications: ToastNotification[];
  channels?: Channel[];
  onNavigate: (view: ViewState) => void;
  onDeleteTask: (taskId: string) => void;
  unreadMessageCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks, messages, notifications, onNavigate, onDeleteTask, unreadMessageCount }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const myTasksToday = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== TaskStatus.DONE);
  const urgentTasks = tasks.filter(t => t.status !== TaskStatus.DONE && new Date(t.dueDate) <= new Date());
  
  const totalTaskValue = tasks.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const relevantTasks = currentUser.role === UserRole.ADMIN ? tasks : tasks.filter(t => t.assigneeId === currentUser.id);
  const completedTasks = relevantTasks.filter(t => t.status === TaskStatus.DONE).length;
  const completionRate = relevantTasks.length > 0 ? Math.round((completedTasks / relevantTasks.length) * 100) : 0;

  const handleGetInsights = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    const context = `KPIs: Value ${totalTaskValue} DA, Rate ${completionRate}%, Urgent ${urgentTasks.length}`;
    const insight = await generateMarketingInsight(context);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const showFinancials = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canViewFinancials;

  return (
    <div className="space-y-6 max-w-7xl mx-auto page-transition px-1 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Salut, {currentUser.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 font-semibold text-sm">Prêt pour propulser iVISION ?</p>
        </div>
        <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-2">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl"><TrendingUp size={24} /></div>
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Productivité</span>
          </div>
          <h3 className="text-4xl font-black text-slate-900">{completionRate}%</h3>
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tight">Objectifs atteints</p>
        </div>

        {showFinancials && (
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success/10 text-success rounded-2xl"><DollarSign size={24} /></div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Finance</span>
            </div>
            <h3 className="text-4xl font-black text-slate-900">{(tasks.filter(t => t.status === TaskStatus.DONE).reduce((a,c)=>a+(c.price||0),0)).toLocaleString()} <span className="text-sm font-bold text-slate-400">DA</span></h3>
            <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tight">Volume facturable</p>
          </div>
        )}

        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-900/30 text-white relative overflow-hidden group cursor-pointer active-scale" onClick={handleGetInsights}>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={20} className="text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">IA STRATÉGIQUE</span>
            </div>
            {loadingAi ? (
              <div className="flex items-center space-x-1.5 py-4">
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            ) : (
              <p className="text-sm font-bold leading-relaxed line-clamp-3">{aiInsight || "Analyser vos données pour obtenir des recommandations stratégiques."}</p>
            )}
          </div>
          <Sparkles className="absolute -bottom-6 -right-6 text-white/5 group-hover:scale-110 transition-transform duration-700" size={140} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-900 flex items-center"><CheckCircle size={20} className="mr-2 text-primary" /> Missions Actives</h3>
          </div>
          <div className="p-3">
            {myTasksToday.length === 0 ? (
              <div className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Calme plat... 🏝️</div>
            ) : (
              myTasksToday.slice(0, 5).map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-50 rounded-3xl transition-all flex items-center justify-between group active-scale cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={`w-1.5 h-10 rounded-full ${task.priority === 'high' ? 'bg-urgent' : 'bg-primary'}`}></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">{task.type} • {task.dueDate}</p>
                    </div>
                  </div>
                  <CheckCircle size={20} className="text-slate-100 group-hover:text-success" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-6 flex items-center"><Bell size={20} className="mr-2 text-orange-500" /> Notifications</h3>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-6 uppercase tracking-widest">Tout est à jour</p>
            ) : (
              notifications.slice(0, 3).map(n => (
                <div key={n.id} className="flex space-x-3 items-start p-4 bg-slate-50 rounded-[1.5rem]">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.type === 'urgent' ? 'bg-urgent' : 'bg-primary'}`}></div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-none mb-1">{n.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;