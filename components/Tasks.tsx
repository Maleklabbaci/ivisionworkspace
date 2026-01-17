
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Plus, CheckCircle, X, ChevronRight, Clock, CheckSquare, PlayCircle, PauseCircle, Calendar as CalendarIcon, Trash2, CalendarDays, CalendarRange, User as UserIcon } from 'lucide-react';
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
  
  return (
    <div 
      onClick={onClick}
      className={`card-formal p-5 rounded-2xl mb-3 flex flex-col space-y-4 group cursor-pointer active-scale ${isLate ? 'border-urgent/40' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${
            task.status === TaskStatus.DONE ? 'bg-success' : 
            task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-200'
          }`}></div>
          <div className="truncate">
            <h4 className={`font-bold text-slate-900 text-sm tracking-tight uppercase ${task.status === TaskStatus.DONE ? 'opacity-30 line-through' : ''}`}>
              {task.title}
            </h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{clientName}</p>
          </div>
        </div>
        {assignee && (
          <img src={assignee.avatar} className="w-8 h-8 rounded-lg object-cover border border-slate-100" alt="" />
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center space-x-2">
          <CalendarIcon size={12} className="text-slate-300" />
          <span className={`text-[9px] font-bold uppercase tracking-widest ${isLate ? 'text-urgent' : 'text-slate-400'}`}>
            {task.dueDate}
          </span>
        </div>
        <div className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
          task.status === TaskStatus.DONE ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'
        }`}>
          {task.status}
        </div>
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

const Tasks: React.FC<TasksProps> = ({ tasks, users, clients = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', assigneeId: currentUser.id });
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  // LOGIQUE DE FILTRAGE TEMPOREL CORRIGÉE
  const filteredTasks = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      if (activeFilter === 'today') {
          return tasks.filter(t => t.dueDate === todayStr);
      }
      
      if (activeFilter === 'week') {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextWeekStr = nextWeek.toISOString().split('T')[0];
          return tasks.filter(t => t.dueDate >= todayStr && t.dueDate <= nextWeekStr);
      }
      
      return tasks;
  }, [tasks, activeFilter]);

  const currentTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onAddTask({ ...formData, status: TaskStatus.TODO } as Task);
    setShowFormModal(false);
    setFormData({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', assigneeId: currentUser.id });
  };

  const FilterButton = ({ id, label, icon: Icon }: { id: 'all' | 'today' | 'week', label: string, icon: any }) => (
    <button 
      onClick={() => setActiveFilter(id)}
      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all border ${
        activeFilter === id ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
      }`}
    >
      <Icon size={14} />
      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Workflow missions</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1.5">Gestion opérationnelle iVISION</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <FilterButton id="all" label="Tout" icon={CheckSquare} />
        <FilterButton id="today" label="Aujourd'hui" icon={CalendarDays} />
        <FilterButton id="week" label="7 Jours" icon={CalendarRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-6">
        {filteredTasks.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-widest italic">Aucune mission pour cette période</p>
            </div>
        ) : (
            filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClick={() => setSelectedTaskId(task.id)} 
                clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} 
                assignee={userMap.get(task.assigneeId)}
              />
            ))
        )}
      </div>

      <button onClick={() => setShowFormModal(true)} className="fixed bottom-24 right-8 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center z-40 active-scale border border-white/20">
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* MODAL - AJOUT TACHE */}
      {showFormModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFormModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden modal-drawer">
             <header className="p-8 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-bold uppercase tracking-tight">Nouvelle Mission</h3>
               <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-400"><X size={20}/></button>
             </header>
             <form onSubmit={handleCreateTask} className="p-8 space-y-6">
                <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" placeholder="Titre de la mission" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <textarea className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none resize-none" placeholder="Briefing..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                        <option value="low">Priorité Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute / Urgente</option>
                    </select>
                </div>
                <button type="submit" className="w-full py-5 bg-primary text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest active-scale shadow-xl shadow-primary/20">CRÉER LA MISSION</button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL - VUE DÉTAILLÉE */}
      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden modal-drawer">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{clientMap.get(currentTask.clientId || '')?.name || 'Projet Interne'}</p>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">{currentTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={20}/></button>
            </header>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Assigné à</span>
                    <div className="flex items-center space-x-2">
                       <img src={userMap.get(currentTask.assigneeId)?.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                       <span className="text-xs font-bold text-slate-800">{userMap.get(currentTask.assigneeId)?.name}</span>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Échéance</span>
                    <span className="text-xs font-bold text-slate-800">{currentTask.dueDate}</span>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 min-h-[120px]">
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{currentTask.description || 'Aucun briefing spécifique.'}</p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                {currentTask.status !== TaskStatus.DONE ? (
                    <button onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); setSelectedTaskId(null); }} className="flex-1 py-4 bg-success text-white font-bold rounded-xl text-xs uppercase tracking-widest active-scale flex items-center justify-center space-x-2">
                        <CheckCircle size={18} /> <span>TERMINER</span>
                    </button>
                ) : (
                    <button onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.IN_PROGRESS); setSelectedTaskId(null); }} className="flex-1 py-4 bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest active-scale">
                        RELANCER
                    </button>
                )}
                <button onClick={() => { if(confirm('Révoquer définitivement cette mission ?')) { onDeleteTask(currentTask.id); setSelectedTaskId(null); } }} className="w-14 h-14 bg-red-50 text-urgent flex items-center justify-center rounded-xl border border-red-100 active-scale">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
