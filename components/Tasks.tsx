
import React, { useState, useMemo, useCallback, memo } from 'react';
// Added Trash2 to imports
import { Plus, LayoutGrid, List, CheckCircle, X, ChevronRight, AlertCircle, Clock, CheckSquare, Loader2, Edit2, PlayCircle, PauseCircle, AlertTriangle, User as UserIcon, Calendar as CalendarIcon, Tag, Trash2 } from 'lucide-react';
import { Task, TaskStatus, User, Client } from '../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  clientName: string;
  assignee?: User;
}

const TaskCard = memo(({ task, onClick, clientName, assignee }: TaskCardProps) => {
  const isLate = task.dueDate < new Date().toISOString().split('T')[0] && task.status !== TaskStatus.DONE;
  
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
      className={`bg-white p-4 rounded-[2rem] border shadow-sm active-scale transition-all flex items-center justify-between group cursor-pointer mb-3 ${isLate ? 'border-urgent border-2' : 'border-slate-50 hover:border-primary/20'}`}
    >
      <div className="flex items-center space-x-4 overflow-hidden flex-1">
        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
          task.status === TaskStatus.DONE ? 'bg-success' : 
          task.status === TaskStatus.BLOCKED || isLate ? 'bg-urgent' :
          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-200'
        }`}></div>
        <div className="truncate">
          <h4 className={`font-black text-slate-900 truncate text-sm tracking-tight ${task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
            {task.title}
          </h4>
          <div className="flex items-center space-x-2 mt-0.5">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[120px]">
              {clientName}
            </p>
            <div className="w-1 h-1 rounded-full bg-slate-100" />
            <div className="flex items-center">
              <PriorityIcon />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 ml-2">
        {assignee && (
          <img 
            src={assignee.avatar} 
            className="w-7 h-7 rounded-xl object-cover border-2 border-slate-50 shadow-sm" 
            alt={assignee.name}
          />
        )}
        <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors" />
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

const Tasks: React.FC<TasksProps> = ({ 
  tasks, users, clients = [], currentUser, 
  onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '', description: '', assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], status: TaskStatus.TODO, priority: 'medium'
  });

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

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Workflow</h2>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{tasks.length} missions actives</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-2xl">
          <button onClick={() => setViewMode('list')} className={`p-2.5 px-5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary font-black' : 'text-slate-300 font-bold'}`}><List size={18} /></button>
          <button onClick={() => setViewMode('board')} className={`p-2.5 px-5 rounded-xl transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-primary font-black' : 'text-slate-300 font-bold'}`}><LayoutGrid size={18} /></button>
        </div>
      </div>

      <div className="space-y-1">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => setSelectedTaskId(task.id)} 
            clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} 
            assignee={userMap.get(task.assigneeId)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={32} className="text-slate-200" />
            </div>
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Aucune mission pour le moment</p>
          </div>
        )}
      </div>

      {/* Bouton d'ajout flottant */}
      <button 
        onClick={() => { setFormData({ title: '', description: '', assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], status: TaskStatus.TODO, priority: 'medium' }); setEditingTask(null); setShowFormModal(true); }}
        className="fixed bottom-[calc(100px+env(safe-area-inset-bottom))] right-6 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-[0_15px_45px_rgba(0,102,255,0.4)] flex items-center justify-center z-40 active-scale border-4 border-white"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* POP-UP DÉTAILS DE MISSION */}
      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-[3rem] p-8 pb-[calc(40px+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-400 max-h-[95vh] overflow-y-auto no-scrollbar">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{clientMap.get(currentTask.clientId || '')?.name || 'Projet Interne'}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{currentTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
            </div>
            
            <div className="space-y-8">
              {/* Statuts */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: TaskStatus.TODO, label: 'À faire', color: 'bg-slate-100 text-slate-500', icon: Clock },
                  { id: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'bg-primary text-white shadow-lg shadow-primary/20', icon: PlayCircle },
                  { id: TaskStatus.BLOCKED, label: 'Bloqué', color: 'bg-urgent text-white shadow-lg shadow-urgent/20', icon: PauseCircle },
                  { id: TaskStatus.DONE, label: 'Terminé', color: 'bg-success text-white shadow-lg shadow-success/20', icon: CheckCircle },
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => onUpdateStatus(currentTask.id, s.id)}
                    className={`flex items-center space-x-3 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentTask.status === s.id ? s.color : 'bg-slate-50 text-slate-400 border border-transparent'}`}
                  >
                    <s.icon size={16} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Infos Clés */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <UserIcon size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Assigné</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img src={userMap.get(currentTask.assigneeId)?.avatar} className="w-8 h-8 rounded-xl object-cover" alt="" />
                    <span className="font-bold text-slate-800 text-xs">{userMap.get(currentTask.assigneeId)?.name}</span>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <CalendarIcon size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Échéance</span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs uppercase">{currentTask.dueDate}</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-6 bg-slate-50 rounded-[2rem]">
                <div className="flex items-center space-x-2 mb-3 text-slate-400">
                  <Tag size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Détails</span>
                </div>
                <p className="text-slate-600 font-bold text-sm leading-relaxed">{currentTask.description || 'Aucune description spécifiée.'}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button onClick={() => { setEditingTask(currentTask); setFormData(currentTask); setShowFormModal(true); setSelectedTaskId(null); }} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl active-scale">Modifier la mission</button>
                <button onClick={() => { if(confirm('Supprimer définitivement ?')) { onDeleteTask(currentTask.id); setSelectedTaskId(null); } }} className="w-16 h-16 bg-red-50 text-urgent flex items-center justify-center rounded-3xl active-scale">
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMULAIRE MISSION */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] bg-white animate-in slide-in-from-bottom duration-400 flex flex-col">
          <header className="px-6 py-5 flex items-center justify-between border-b border-slate-50 safe-pt">
            <button onClick={() => setShowFormModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale transition-colors"><X size={24}/></button>
            <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm">{editingTask ? 'Modifier' : 'Initialiser'} Mission</h3>
            <button onClick={handleSubmit} className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20 active-scale">VALIDER</button>
          </header>
          
          <div className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Titre de la mission</label>
                <input type="text" className="w-full text-3xl font-black outline-none placeholder-slate-100 text-slate-900" placeholder="Ex: Audit SEO..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Description stratégique</label>
                <textarea className="w-full h-40 text-sm font-bold outline-none placeholder-slate-200 resize-none text-slate-600 bg-slate-50 p-6 rounded-3xl focus:bg-white border border-transparent focus:border-primary/10 transition-all" placeholder="Détaillez les objectifs ici..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Responsable</p>
                    <select className="w-full bg-transparent font-black text-xs outline-none text-slate-900" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Client associé</p>
                    <select className="w-full bg-transparent font-black text-xs outline-none text-slate-900" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                      <option value="">Projet Interne</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Échéance</p>
                    <input type="date" className="w-full bg-transparent font-black text-xs outline-none text-slate-900" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Niveau d'urgence</p>
                    <select className="w-full bg-transparent font-black text-xs outline-none text-slate-900" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                      <option value="low">Basse priorité</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute urgence</option>
                    </select>
                  </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
