
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Plus, CheckCircle, X, ChevronRight, Clock, CheckSquare, PlayCircle, PauseCircle, AlertTriangle, Calendar as CalendarIcon, Trash2, CalendarDays, CalendarRange, CalendarCheck, User as UserIcon, Briefcase, Tag, AlertCircle } from 'lucide-react';
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
  
  const getPriorityInfo = () => {
    switch(task.priority) {
      case 'high': return { label: 'URGENT', color: 'text-urgent', bg: 'bg-red-50' };
      case 'medium': return { label: 'NORMAL', color: 'text-orange-500', bg: 'bg-orange-50' };
      default: return { label: 'BASSE', color: 'text-slate-400', bg: 'bg-slate-50' };
    }
  };

  const priority = getPriorityInfo();

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-[2.2rem] border shadow-sm transition-all flex flex-col space-y-4 group cursor-pointer mb-4 active-scale select-none ${
        isLate ? 'border-urgent/30 bg-red-50/10 shadow-red-500/5' : 'border-slate-50'
      } hover-effect`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
            task.status === TaskStatus.DONE ? 'bg-success' : 
            task.status === TaskStatus.BLOCKED || isLate ? 'bg-urgent' :
            task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-200'
          }`}></div>
          <div className="truncate">
            <h4 className={`font-black text-slate-900 truncate text-sm tracking-tight uppercase ${task.status === TaskStatus.DONE ? 'opacity-30 line-through' : ''}`}>
              {task.title}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
               <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${priority.bg} ${priority.color}`}>
                 {priority.label}
               </span>
               <span className="text-[10px] text-slate-300 font-bold">•</span>
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">
                 {clientName}
               </p>
            </div>
          </div>
        </div>
        
        {assignee && (
          <img 
            src={assignee.avatar} 
            className="w-9 h-9 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0" 
            alt={assignee.name} 
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50/50">
        <div className="flex items-center space-x-2">
          <CalendarIcon size={12} className={isLate ? 'text-urgent' : 'text-slate-300'} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${isLate ? 'text-urgent animate-pulse' : 'text-slate-400'}`}>
            {task.dueDate === today ? "AUJOURD'HUI" : task.dueDate}
          </span>
        </div>
        <div className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
          task.status === TaskStatus.DONE ? 'bg-success/10 text-success' :
          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary/10 text-primary' :
          'bg-slate-100 text-slate-400'
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
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const endOfWeekStr = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0];
  }, []);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', description: '', assigneeId: currentUser.id, dueDate: todayStr, status: TaskStatus.TODO, priority: 'medium'
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'today') return task.dueDate === todayStr || (task.dueDate < todayStr && task.status !== TaskStatus.DONE);
      if (activeFilter === 'week') return task.dueDate >= todayStr && task.dueDate <= endOfWeekStr;
      if (activeFilter === 'month') {
        const d = new Date(task.dueDate); const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [tasks, activeFilter, todayStr, endOfWeekStr]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    if (editingTask) onUpdateTask({ ...editingTask, ...formData } as Task);
    else onAddTask({ ...formData } as Task);
    setShowFormModal(false);
    setEditingTask(null);
  }, [editingTask, formData, onAddTask, onUpdateTask]);

  const currentTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

  const FilterButton = ({ id, label, icon: Icon, count }: { id: TimeFilter, label: string, icon: any, count: number }) => (
    <button 
      onClick={() => setActiveFilter(id)}
      className={`flex-1 flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all border-2 ${
        activeFilter === id ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-slate-50 border-transparent text-slate-400'
      }`}
    >
      <Icon size={18} className="mb-1.5" strokeWidth={activeFilter === id ? 3 : 2} />
      <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
      <span className={`text-[8px] font-bold mt-1 ${activeFilter === id ? 'text-white/60' : 'text-slate-300'}`}>({count})</span>
    </button>
  );

  return (
    <div className="flex flex-col space-y-8 overflow-hidden page-transition pb-20">
      <div className="px-1">
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Workflow</h2>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2">iVISION OPERATIONAL COMMAND CENTER</p>
      </div>

      <div className="flex space-x-3 p-1 overflow-x-auto no-scrollbar">
        <FilterButton id="all" label="Global" icon={CheckSquare} count={tasks.length} />
        <FilterButton id="today" label="Focus" icon={CalendarDays} count={tasks.filter(t => t.dueDate <= todayStr && t.status !== TaskStatus.DONE).length} />
        <FilterButton id="week" label="Semaine" icon={CalendarRange} count={tasks.filter(t => t.dueDate >= todayStr && t.dueDate <= endOfWeekStr).length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-6 px-1">
        {filteredTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => setSelectedTaskId(task.id)} 
            clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} 
            assignee={userMap.get(task.assigneeId)}
          />
        ))}

        {filteredTasks.length === 0 && (
          <div className="col-span-full py-40 text-center animate-in fade-in">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon size={32} className="text-slate-200" />
             </div>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune mission pour cette période</p>
          </div>
        )}
      </div>

      <button onClick={() => { setFormData({ title: '', description: '', assigneeId: currentUser.id, dueDate: todayStr, status: TaskStatus.TODO, priority: 'medium' }); setEditingTask(null); setShowFormModal(true); }} className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-2xl flex items-center justify-center z-40 border-4 border-white active-scale">
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* MODAL DÉTAILS - AMÉLIORATION CHECK DONNÉES */}
      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-[3rem] lg:rounded-[3rem] p-8 pb-[calc(24px+env(safe-area-inset-bottom))] modal-drawer shadow-2xl w-full max-w-xl mx-auto overflow-hidden">
            <header className="flex justify-between items-start mb-8">
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">{clientMap.get(currentTask.clientId || '')?.name || 'Projet Interne'}</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{currentTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
            </header>
            
            <div className="space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
              {/* STATUS SELECTORS (BIG BUTTONS) */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: TaskStatus.TODO, label: 'À faire', color: 'bg-slate-100 text-slate-400', active: 'bg-blue-400 text-white shadow-blue-500/20', icon: Clock },
                  { id: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'bg-slate-100 text-slate-400', active: 'bg-primary text-white shadow-primary/20', icon: PlayCircle },
                  { id: TaskStatus.BLOCKED, label: 'Bloqué', color: 'bg-slate-100 text-slate-400', active: 'bg-urgent text-white shadow-red-500/20', icon: PauseCircle },
                  { id: TaskStatus.DONE, label: 'Terminé', color: 'bg-slate-100 text-slate-400', active: 'bg-success text-white shadow-green-500/20', icon: CheckCircle },
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => { onUpdateStatus(currentTask.id, s.id); setSelectedTaskId(null); }}
                    className={`flex items-center space-x-3 p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentTask.status === s.id ? s.active : s.color}`}
                  >
                    <s.icon size={18} strokeWidth={3} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* INFO GRID */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Assigné à</span>
                    <div className="flex items-center space-x-3">
                       <img src={userMap.get(currentTask.assigneeId)?.avatar} className="w-8 h-8 rounded-xl object-cover" alt="" />
                       <span className="text-xs font-black text-slate-900 uppercase truncate">{userMap.get(currentTask.assigneeId)?.name}</span>
                    </div>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Deadline</span>
                    <div className="flex items-center space-x-2">
                       <CalendarIcon size={16} className="text-primary" />
                       <span className="text-xs font-black text-slate-900">{currentTask.dueDate}</span>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Briefing de mission</span>
                <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{currentTask.description || 'Aucune consigne spécifique.'}</p>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button onClick={() => { setEditingTask(currentTask); setFormData(currentTask); setShowFormModal(true); setSelectedTaskId(null); }} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl text-xs uppercase tracking-widest active-scale border-4 border-white shadow-xl">ÉDITER LA MISSION</button>
                <button onClick={() => { if(confirm('Supprimer cette mission ?')) { onDeleteTask(currentTask.id); setSelectedTaskId(null); } }} className="w-20 h-20 bg-red-50 text-urgent flex items-center justify-center rounded-3xl active-scale border-4 border-white shadow-xl transition-all">
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL - CORRECTION VISUELLE */}
      {showFormModal && (
        <div className="fixed inset-0 z-[2000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowFormModal(false)}></div>
          <div className="relative bg-white rounded-t-[3rem] lg:rounded-[3rem] shadow-2xl w-full max-w-xl mx-auto overflow-hidden animate-in slide-in-from-bottom">
            <header className="px-8 py-6 flex items-center justify-between border-b border-slate-50 bg-white">
              <button onClick={() => setShowFormModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">{editingTask ? 'CONFIGURER' : 'NOUVELLE MISSION'}</h3>
              <button onClick={handleSubmit} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active-scale border-4 border-white shadow-xl shadow-primary/20">ENREGISTRER</button>
            </header>
            
            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar pb-32">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Objet du livrable</label>
                  <input type="text" className="w-full text-2xl font-black outline-none border-b-2 border-slate-100 focus:border-primary pb-3 text-slate-900 placeholder-slate-100 bg-transparent transition-all" placeholder="Titre de la mission..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Consignes & Détails</label>
                  <textarea className="w-full h-40 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 outline-none focus:bg-white transition-all text-sm font-bold text-slate-700 resize-none" placeholder="Description détaillée..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Responsable</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase outline-none border border-slate-100 appearance-none text-slate-700" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Client iVISION</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase outline-none border border-slate-100 appearance-none text-slate-700" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                      <option value="">PROJET INTERNE</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Date Limite</label>
                    <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] outline-none border border-slate-100 text-slate-700" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Priorité</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase outline-none border border-slate-100 appearance-none text-slate-700" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                      <option value="low">Standard</option>
                      <option value="medium">Modérée</option>
                      <option value="high">Critique / Urgent</option>
                    </select>
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
