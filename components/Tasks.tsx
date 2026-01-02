
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Plus, LayoutGrid, List, CheckCircle, X, ChevronRight, AlertCircle, Clock, CheckSquare, Loader2, Edit2, PlayCircle, PauseCircle, AlertTriangle, User as UserIcon, Calendar as CalendarIcon, Tag, Trash2, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react';
import { Task, TaskStatus, User, Client } from '../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  clientName: string;
  assignee?: User;
}

const TaskCard = memo(({ task, onClick, clientName, assignee }: TaskCardProps) => {
  const today = new Date().toISOString().split('T')[0];
  const isLate = task.dueDate < today && task.status !== TaskStatus.DONE;
  
  const PriorityIcon = () => {
    switch (task.priority) {
      case 'high': return <AlertTriangle size={12} className="text-urgent" fill="currentColor" fillOpacity={0.1} />;
      case 'medium': return <Clock size={12} className="text-orange-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-slate-200" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-[2rem] border shadow-sm transition-all flex items-center justify-between group cursor-pointer mb-3 active:scale-[0.99] select-none touch-manipulation ${
        isLate ? 'border-urgent/30 bg-red-50/20' : 'border-slate-50'
      } hover-effect`}
    >
      <div className="flex items-center space-x-4 overflow-hidden flex-1 pointer-events-none">
        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
          task.status === TaskStatus.DONE ? 'bg-success' : 
          task.status === TaskStatus.BLOCKED || isLate ? 'bg-urgent' :
          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-200'
        }`}></div>
        <div className="truncate">
          <h4 className={`font-black text-slate-900 truncate text-sm tracking-tight uppercase ${task.status === TaskStatus.DONE ? 'opacity-30 line-through' : ''}`}>
            {task.title}
          </h4>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] truncate max-w-[120px]">
              {clientName}
            </p>
            <div className="flex items-center space-x-2">
               <PriorityIcon />
               <span className={`text-[8px] font-black uppercase tracking-tighter ${isLate ? 'text-urgent' : 'text-slate-300'}`}>
                 {task.dueDate === today ? "Aujourd'hui" : task.dueDate}
               </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 ml-2 pointer-events-none">
        {assignee && (
          <img 
            src={assignee.avatar} 
            className="w-7 h-7 rounded-xl object-cover border border-slate-100 shadow-sm" 
            alt={assignee.name}
          />
        )}
        <ChevronRight size={16} className="text-slate-200 group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
});

interface TasksProps {
  tasks: Task[];
  users: User[];
  clients?: Client[];
  currentUser: User;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

const Tasks: React.FC<TasksProps> = ({ 
  tasks, users, clients = [], currentUser, 
  onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask 
}) => {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', description: '', assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], status: TaskStatus.TODO, priority: 'medium'
  });

  // Calculs temporels pour le filtrage
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  
  const endOfWeek = new Date();
  endOfWeek.setDate(todayDate.getDate() + 7);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
  
  const currentMonth = todayDate.getMonth();
  const currentYear = todayDate.getFullYear();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'today') return task.dueDate === todayStr;
      
      if (activeFilter === 'week') {
        return task.dueDate >= todayStr && task.dueDate <= endOfWeekStr;
      }
      
      if (activeFilter === 'month') {
        const d = new Date(task.dueDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      return true;
    });
  }, [tasks, activeFilter, todayStr, endOfWeekStr, currentMonth, currentYear]);

  // Compteurs pour les badges
  const counts = useMemo(() => ({
    all: tasks.length,
    today: tasks.filter(t => t.dueDate === todayStr).length,
    week: tasks.filter(t => t.dueDate >= todayStr && t.dueDate <= endOfWeekStr).length,
    month: tasks.filter(t => {
        const d = new Date(t.dueDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length
  }), [tasks, todayStr, endOfWeekStr, currentMonth, currentYear]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    if (editingTask) {
      onUpdateTask({ ...editingTask, ...formData } as Task);
    } else {
      onAddTask({ id: `temp-${Date.now()}`, ...formData } as Task);
    }
    setShowFormModal(false);
    setEditingTask(null);
  }, [formData, editingTask, onAddTask, onUpdateTask]);

  const currentTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

  const FilterButton = ({ id, label, count, icon: Icon }: { id: TimeFilter, label: string, count: number, icon: any }) => (
    <button 
      onClick={() => setActiveFilter(id)}
      className={`flex-1 flex flex-col items-center justify-center p-3 rounded-[1.8rem] transition-all border-2 ${
        activeFilter === id 
        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 z-10' 
        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-100'
      }`}
    >
      <Icon size={18} className="mb-1.5" strokeWidth={activeFilter === id ? 3 : 2} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      <span className={`text-[8px] font-bold mt-0.5 ${activeFilter === id ? 'text-white/60' : 'text-slate-300'}`}>({count})</span>
    </button>
  );

  return (
    <div className="flex flex-col space-y-6 overflow-hidden page-transition">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
        <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Workflow</h2>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1">iVISION Operations Center</p>
        </div>
      </div>

      {/* TABS TEMPORELS */}
      <div className="flex space-x-2 lg:space-x-4 p-1 overflow-x-auto no-scrollbar pb-2">
        <FilterButton id="all" label="Toutes" count={counts.all} icon={CheckSquare} />
        <FilterButton id="today" label="Jour" count={counts.today} icon={CalendarDays} />
        <FilterButton id="week" label="Semaine" count={counts.week} icon={CalendarRange} />
        <FilterButton id="month" label="Mois" count={counts.month} icon={CalendarCheck} />
      </div>

      <div className="space-y-0 pb-32 overflow-y-auto no-scrollbar touch-pan-y min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-6">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => setSelectedTaskId(task.id)} 
              clientName={clientMap.get(task.clientId || '')?.name || 'Interne'} 
              assignee={userMap.get(task.assigneeId)}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="py-32 text-center animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <CalendarIcon size={32} className="text-slate-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Aucune mission trouvée</h3>
            <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">Ajustez vos filtres ou créez une nouvelle tâche</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setFormData({ title: '', description: '', assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], status: TaskStatus.TODO, priority: 'medium' }); setEditingTask(null); setShowFormModal(true); }}
        className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 lg:right-12 w-16 h-16 bg-primary text-white rounded-3xl shadow-[0_20px_50px_rgba(0,102,255,0.3)] flex items-center justify-center z-40 active:scale-90 transition-all border-4 border-white"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* MODAL DÉTAILS - Optimisé PC */}
      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-[2.5rem] lg:rounded-[3rem] p-8 pb-[calc(24px+env(safe-area-inset-bottom))] modal-drawer shadow-2xl overflow-hidden max-w-xl mx-auto w-full">
            <header className="flex justify-between items-start mb-8">
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">{clientMap.get(currentTask.clientId || '')?.name || 'Projet Interne'}</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight uppercase">{currentTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale hover:bg-slate-100 transition-colors"><X size={24}/></button>
            </header>
            
            <div className="space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: TaskStatus.TODO, label: 'À faire', color: 'bg-slate-100 text-slate-500', icon: Clock },
                  { id: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'bg-primary text-white shadow-xl', icon: PlayCircle },
                  { id: TaskStatus.BLOCKED, label: 'Bloqué', color: 'bg-urgent text-white shadow-xl', icon: PauseCircle },
                  { id: TaskStatus.DONE, label: 'Terminé', color: 'bg-success text-white shadow-xl', icon: CheckCircle },
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => onUpdateStatus(currentTask.id, s.id)}
                    className={`flex items-center space-x-3 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentTask.status === s.id ? s.color : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <s.icon size={16} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block opacity-60">Responsable</span>
                  <div className="flex items-center space-x-3">
                    <img src={userMap.get(currentTask.assigneeId)?.avatar} className="w-8 h-8 rounded-xl object-cover shadow-sm" alt="" />
                    <span className="font-black text-slate-800 text-xs truncate uppercase">{userMap.get(currentTask.assigneeId)?.name}</span>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block opacity-60">Échéance</span>
                  <div className="flex items-center space-x-2 text-slate-800">
                    <CalendarIcon size={16} className="text-primary" />
                    <p className="font-black text-xs uppercase">{currentTask.dueDate}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 block opacity-60">Briefing & Notes</span>
                <p className="text-slate-600 font-bold text-sm leading-relaxed whitespace-pre-wrap">{currentTask.description || 'Aucune consigne spécifique enregistrée.'}</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button onClick={() => { setEditingTask(currentTask); setFormData(currentTask); setShowFormModal(true); setSelectedTaskId(null); }} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl text-xs uppercase tracking-[0.2em] active-scale border-4 border-white shadow-xl transition-all">ÉDITER LA MISSION</button>
                <button onClick={() => { if(confirm('Supprimer définitivement ?')) { onDeleteTask(currentTask.id); setSelectedTaskId(null); } }} className="w-20 h-20 bg-red-50 text-urgent flex items-center justify-center rounded-3xl active-scale border-4 border-white shadow-xl hover:bg-urgent hover:text-white transition-all">
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULAIRE - Optimisé PC */}
      {showFormModal && (
        <div className="fixed inset-0 z-[2000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowFormModal(false)}></div>
          <div className="relative bg-white rounded-t-[3rem] lg:rounded-[3rem] shadow-2xl w-full max-w-xl mx-auto overflow-hidden animate-in slide-in-from-bottom duration-300">
            <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 bg-white">
              <button onClick={() => setShowFormModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-tighter">Configuration Mission</h3>
              <button onClick={handleSubmit} className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active-scale border-2 border-white">ENREGISTRER</button>
            </header>
            
            <div className="p-10 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar pb-32">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 opacity-60">Objet du livrable</label>
                  <input type="text" className="w-full text-2xl font-black outline-none placeholder-slate-100 text-slate-900 bg-transparent border-b-2 border-slate-50 focus:border-primary transition-all pb-2" placeholder="Ex: Campagne Black Friday" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 opacity-60">Notes opérationnelles</label>
                  <textarea className="w-full h-40 text-sm font-bold outline-none placeholder-slate-200 resize-none text-slate-600 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 focus:bg-white transition-all" placeholder="Décrivez les objectifs..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest opacity-60">Collaborateur</p>
                        <select className="w-full bg-transparent font-black text-xs outline-none text-slate-900 appearance-none uppercase" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest opacity-60">Partenaire / CRM</p>
                        <select className="w-full bg-transparent font-black text-xs outline-none text-slate-900 appearance-none uppercase" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                          <option value="">PROJET INTERNE</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest opacity-60">Date d'échéance</p>
                        <input type="date" className="w-full bg-transparent font-black text-xs outline-none text-slate-900" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                      </div>
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest opacity-60">Priorité Stratégique</p>
                        <select className="w-full bg-transparent font-black text-xs outline-none text-slate-900 appearance-none uppercase" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                          <option value="low">Standard</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Urgent / Critique</option>
                        </select>
                      </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
