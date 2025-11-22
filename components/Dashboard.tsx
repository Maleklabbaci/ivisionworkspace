
import React, { useState } from 'react';
import { TrendingUp, CheckCircle, AlertCircle, Sparkles, PlusCircle, Calendar, MessageCircle, Clock, DollarSign, Info, Bell, Trash2 } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';
import { Task, User, ViewState, TaskStatus, UserRole, Message, ToastNotification } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  messages: Message[];
  notifications: ToastNotification[];
  onNavigate: (view: ViewState) => void;
  onDeleteTask: (taskId: string) => void;
  unreadMessageCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, tasks, messages, notifications, onNavigate, onDeleteTask, unreadMessageCount }) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Derived Metrics
  const myTasksToday = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== TaskStatus.DONE);
  const urgentTasks = tasks.filter(t => t.status !== TaskStatus.DONE && new Date(t.dueDate) <= new Date());
  
  // Calculate Finances from Tasks (Admin Only)
  const totalTaskValue = tasks.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const completedTaskValue = tasks.filter(t => t.status === TaskStatus.DONE).reduce((acc, curr) => acc + (curr.price || 0), 0);
  const potentialValue = totalTaskValue - completedTaskValue;
  
  // Completion Rate Calculation
  const relevantTasks = currentUser.role === UserRole.ADMIN ? tasks : tasks.filter(t => t.assigneeId === currentUser.id);
  const completedTasks = relevantTasks.filter(t => t.status === TaskStatus.DONE).length;
  const completionRate = relevantTasks.length > 0 ? Math.round((completedTasks / relevantTasks.length) * 100) : 0;

  // Sort tasks by date
  myTasksToday.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Tasks due this week for calendar button
  const tasksDueThisWeek = tasks.filter(t => {
      const date = new Date(t.dueDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return date >= today && date <= nextWeek && t.status !== TaskStatus.DONE;
  }).length;

  const handleGetInsights = async () => {
    setLoadingAi(true);
    const context = `
      KPIs actuels:
      - Chiffre d'affaires total prévu (Tâches): ${totalTaskValue} DA
      - Taux de complétion des tâches: ${completionRate}%
      - Tâches urgentes en attente: ${urgentTasks.length}
      - Prochaine deadline: ${myTasksToday[0]?.title || 'Aucune'}
    `;
    const insight = await generateMarketingInsight(context);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
        onDeleteTask(taskId);
    }
  };

  const isAdminOrPM = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER;

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Voici ce qui se passe aujourd'hui.</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm font-medium text-slate-800">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {urgentTasks.length > 0 && (
            <p className="text-xs text-urgent font-semibold flex items-center justify-end mt-1">
              <AlertCircle size={12} className="mr-1" /> {urgentTasks.length} tâches urgentes
            </p>
          )}
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => onNavigate('tasks')}
          className="bg-primary text-white p-5 rounded-xl shadow-md shadow-primary/20 hover:bg-blue-800 transition-all flex items-center justify-between group border border-primary"
        >
          <div className="flex flex-col items-start">
            <span className="font-bold">Créer une tâche</span>
            <span className="text-xs text-blue-100 opacity-80">Assigner à l'équipe</span>
          </div>
          <PlusCircle className="group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => onNavigate('tasks')}
          className="bg-white text-slate-700 border border-slate-200 p-5 rounded-xl hover:border-primary hover:text-primary transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex flex-col items-start">
            <span className="font-bold">Voir Calendrier</span>
            <span className="text-xs text-slate-400">
                {tasksDueThisWeek > 0 ? `${tasksDueThisWeek} tâches cette semaine` : "Aucune tâche cette semaine"}
            </span>
          </div>
          <Calendar className="text-slate-400 group-hover:text-primary transition-colors" />
        </button>

        <button 
          onClick={() => onNavigate('chat')}
          className={`bg-white p-5 rounded-xl border transition-all flex items-center justify-between group shadow-sm ${unreadMessageCount > 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}
        >
          <div className="flex flex-col items-start">
            <span className={`font-bold ${unreadMessageCount > 0 ? 'text-orange-700' : 'text-slate-700'}`}>
                Chat Équipe
            </span>
            <span className={`text-xs ${unreadMessageCount > 0 ? 'text-orange-600 font-semibold' : 'text-slate-400'}`}>
                {unreadMessageCount > 0 ? `${unreadMessageCount} messages non lus` : "Aucun nouveau message"}
            </span>
          </div>
          <div className="relative">
             <MessageCircle className={`${unreadMessageCount > 0 ? 'text-orange-500' : 'text-slate-400'} group-hover:text-primary transition-colors`} />
             {unreadMessageCount > 0 && (
                 <span className="absolute -top-2 -right-2 bg-urgent text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                     {unreadMessageCount}
                 </span>
             )}
          </div>
        </button>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isAdminOrPM && (
            <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-1 group/tooltip cursor-help">
                        <p className="text-sm font-medium text-slate-500">Volume d'Affaires (Total)</p>
                        <Info size={12} className="text-slate-400" />
                        <div className="absolute z-50 top-8 left-0 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                            <p className="font-bold mb-1 border-b border-slate-600 pb-1">Détail Financier :</p>
                            <ul className="space-y-1">
                                <li className="flex justify-between">
                                    <span>Terminé (Facturable):</span>
                                    <span className="font-mono text-success">{completedTaskValue} DA</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>En cours / À faire:</span>
                                    <span className="font-mono text-orange-400">{potentialValue} DA</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <span className="bg-blue-50 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">ESTIMÉ</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-bold text-slate-900">{totalTaskValue} <span className="text-base font-medium text-slate-500">DA</span></h3>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-2">
                     Basé sur les prix assignés aux tâches
                  </p>
                  
                  <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-slate-500">Tâches Facturables</p>
                    <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">DONE</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">{completedTaskValue} <span className="text-base font-medium text-slate-500">DA</span></h3>
                  <div className="mt-4 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-success h-full" style={{ width: `${totalTaskValue > 0 ? (completedTaskValue/totalTaskValue)*100 : 0}%` }}></div>
                  </div>
                </div>
            </>
        )}

        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${!isAdminOrPM ? 'md:col-span-3' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-slate-500">Productivité {isAdminOrPM ? 'Globale' : 'Personnelle'}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${completionRate > 50 ? 'bg-blue-50 text-primary' : 'bg-orange-50 text-orange-600'}`}>
              {completionRate}% COMPLÉTÉ
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{completedTasks}/{relevantTasks.length}</h3>
          <div className="mt-4 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
             <div className="bg-primary h-full" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Content Split: Tasks & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tasks of the day */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-slate-800 flex items-center">
              <CheckCircle size={18} className="mr-2 text-primary" />
              Mes Tâches du jour
            </h3>
            <button onClick={() => onNavigate('tasks')} className="text-xs font-semibold text-primary hover:underline">Voir tout</button>
          </div>
          
          <div className="p-0">
            {myTasksToday.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Sparkles className="mx-auto mb-3 opacity-50 text-primary" size={24} />
                <p>Tout est propre ! Aucune tâche en attente.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {myTasksToday.slice(0, 5).map(task => {
                   const isUrgent = new Date(task.dueDate) <= new Date();
                   return (
                    <div key={task.id} className={`p-4 transition-all flex items-center justify-between group border-l-4 ${
                        isUrgent 
                        ? 'bg-red-50/60 hover:bg-red-100/80 border-urgent' 
                        : 'hover:bg-slate-50 border-transparent'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          task.type === 'ads' ? 'bg-success' : task.type === 'content' ? 'bg-primary' : 'bg-purple-500'
                        }`} />
                        <div>
                          <h4 className={`text-sm font-semibold transition-colors ${isUrgent ? 'text-red-900' : 'text-slate-800 group-hover:text-primary'}`}>{task.title}</h4>
                          <p className={`text-xs truncate max-w-xs ${isUrgent ? 'text-red-700' : 'text-slate-500'}`}>{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                         <span className={`text-xs px-2 py-1 rounded font-medium ${
                           isUrgent ? 'bg-white text-urgent border border-red-100' : 'bg-slate-100 text-slate-500'
                         }`}>
                           {isUrgent ? 'Urgent' : task.dueDate}
                         </span>
                         {isAdminOrPM && task.price && (
                             <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                 {task.price} DA
                             </span>
                         )}
                         <div className="flex items-center space-x-2">
                             {isAdminOrPM && (
                                 <button 
                                    onClick={(e) => handleDelete(task.id, e)} 
                                    className={`transition-colors p-1 ${isUrgent ? 'text-red-400 hover:text-red-600' : 'text-slate-300 hover:text-urgent'}`}
                                    title="Supprimer"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                             )}
                             <button className={`transition-colors p-1 ${isUrgent ? 'text-red-400 hover:text-success' : 'text-slate-300 hover:text-success'}`}>
                                <CheckCircle size={18} />
                             </button>
                         </div>
                      </div>
                    </div>
                   );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications & AI */}
        <div className="space-y-6">
           {/* Next Deadline */}
           {urgentTasks.length > 0 && (
             <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="text-urgent mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="font-bold text-red-900 text-sm">Deadline imminente</h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      La tâche <span className="font-bold">"{urgentTasks[0].title}"</span> arrive à échéance.
                    </p>
                  </div>
                </div>
             </div>
           )}

           {/* AI Assistant */}
           <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <Sparkles size={60} className="text-white/5 -mt-2 -mr-2" />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="font-bold text-sm">Assistant IA</h3>
                </div>
              </div>
              
              {!aiInsight ? (
                <div className="relative z-10">
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">Besoin d'un conseil stratégique rapide sur vos tâches en cours ?</p>
                  <button 
                    onClick={handleGetInsights}
                    disabled={loadingAi}
                    className="w-full py-2.5 px-3 bg-primary hover:bg-blue-600 rounded-lg text-xs font-medium transition-colors text-white"
                  >
                    {loadingAi ? "Analyse en cours..." : "Analyser mes KPIs"}
                  </button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-10">
                   <div className="text-xs text-slate-300 leading-relaxed bg-white/10 p-3 rounded-lg mb-3 border border-white/5">
                      {aiInsight.split('\n').slice(0, 5).map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                      ))}
                   </div>
                   <button onClick={() => setAiInsight("")} className="text-[10px] text-slate-500 hover:text-white underline w-full text-center">Réinitialiser</button>
                </div>
              )}
           </div>

           {/* Notifications List - DYNAMIC */}
           <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                      <span className="bg-red-100 text-urgent text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                  )}
              </div>
              
              <div className="space-y-4">
                 {notifications.length === 0 ? (
                     <div className="text-center py-4 text-slate-400">
                         <Bell size={16} className="mx-auto mb-2 opacity-50"/>
                         <p className="text-xs">Rien à signaler.</p>
                     </div>
                 ) : (
                     notifications.slice(0, 3).map(notif => (
                        <div key={notif.id} className="flex items-start space-x-3 animate-in fade-in slide-in-from-right">
                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                notif.type === 'urgent' ? 'bg-urgent' : 
                                notif.type === 'success' ? 'bg-success' : 'bg-primary'
                            }`}></div>
                            <div>
                                <p className="text-xs text-slate-800 font-semibold">{notif.title}</p>
                                <p className="text-[10px] text-slate-500 leading-snug">{notif.message}</p>
                            </div>
                        </div>
                     ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
