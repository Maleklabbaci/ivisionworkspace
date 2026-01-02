
import React, { useState, useMemo, useCallback, memo } from 'react';
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
      className={`bg-white p-4 rounded-[1.5rem] border shadow-sm transition-opacity flex items-center justify-between group cursor-pointer mb-2 active:opacity-60 select-none touch-manipulation ${
        isLate ? 'border-urgent bg-red-50/50' : 'border-slate-100'
      } hover-effect`}
    >
      <div className="flex items-center space-x-3 overflow-hidden flex-1 pointer-events-none">
        <div className={`w-1 h-8 rounded-full flex-shrink-0 ${
          task.status === TaskStatus.DONE ? 'bg-success' : 
          task.status === TaskStatus.BLOCKED || isLate ? 'bg-urgent' :
          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-200'
        }`}></div>
        <div className="truncate">
          <h4 className={`font-black text-slate-900 truncate text-[13px] tracking-tight ${task.status === TaskStatus.DONE ? 'opacity-30 line-through' : ''}`}>
            {task.title}
          </h4>
          <div className="flex items-center space-x-2 mt-0.5">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[100px]">
              {clientName}
            </p>
            <div className="flex items-center">
              <PriorityIcon />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 ml-2 pointer-events-none">
        {assignee && (
          <img 
            src={assignee.avatar} 
            className="w-6 h-6 rounded-lg object-cover border border-slate-100" 
            alt={assignee.name}
          />
        )}
        <ChevronRight size={14} className="text-slate-200" />
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
    <div className="flex flex-col space-y-5 overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Workflow</h2>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{tasks.length} missions</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl">
          <button onClick={() => setViewMode('list')} className={`p-2 px-4 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary font-black' : 'text-slate-300'}`}><List size={16} /></button>
          <button onClick={() => setViewMode('board')} className={`p-2 px-4 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-primary font-black' : 'text-slate-300'}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <div className="space-y-0 pb-20 overflow-y-auto no-scrollbar touch-pan-y will-change-transform">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => setSelectedTaskId(task.id)} 
            clientName={clientMap.get(task.clientId || '')?.name || 'Interne'} 
            assignee={userMap.get(task.assigneeId)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="py-20 text-center">
            <CheckSquare size={32} className="text-slate-100 mx-auto mb-3" />
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Aucune mission</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setFormData({ title: '', description: '', assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], status: TaskStatus.TODO, priority: 'medium' }); setEditingTask(null); setShowFormModal(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-[2.5rem] p-6 pb-[calc(20px+env(safe-area-inset-bottom))] modal-drawer max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">{clientMap.get(currentTask.clientId || '')?.name || 'Interne'}</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-tight break-words">{currentTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 active:bg-slate-100"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: TaskStatus.TODO, label: 'À faire', color: 'bg-slate-100 text-slate-500', icon: Clock },
                  { id: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'bg-primary text-white shadow-lg', icon: PlayCircle },
                  { id: TaskStatus.BLOCKED, label: 'Bloqué', color: 'bg-urgent text-white shadow-lg', icon: PauseCircle },
                  { id: TaskStatus.DONE, label: 'Terminé', color: 'bg-success text-white shadow-lg', icon: CheckCircle },
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => onUpdateStatus(currentTask.id, s.id)}
                    className={`flex items-center space-x-2 p-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${currentTask.status === s.id ? s.color : 'bg-slate-50 text-slate-400'}`}
                  >
                    <s.icon size={14} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Assigné</span>
                  <div className="flex items-center space-x-2">
                    <img src={userMap.get(currentTask.assigneeId)?.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                    <span className="font-bold text-slate-800 text-[10px] truncate">{userMap.get(currentTask.assigneeId)?.name}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Date</span>
                  <p className="font-bold text-slate-800 text-[10px] uppercase">{currentTask.dueDate}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Notes</span>
                <p className="text-slate-600 font-bold text-xs leading-relaxed">{currentTask.description || 'Aucune note.'}</p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button onClick={() => { setEditingTask(currentTask); setFormData(currentTask); setShowFormModal(true); setSelectedTaskId(null); }} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest active:bg-black">ÉDITER</button>
                <button onClick={() => { if(confirm('Supprimer ?')) { onDeleteTask(currentTask.id); setSelectedTaskId(null); } }} className="w-12 h-12 bg-red-50 text-urgent flex items-center justify-center rounded-2xl active:bg-red-100">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-[2000] bg-white animate-in slide-in-from-bottom duration-200 flex flex-col">
          <header className="px-5 py-4 flex items-center justify-between border-b border-slate-50 safe-pt">
            <button onClick={() => setShowFormModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
            <h3 className="font-black text-slate-900 uppercase text-xs">Mission</h3>
            <button onClick={handleSubmit} className="bg-primary text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg active:opacity-80">Enregistrer</button>
          </header>
          
          <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest px-1">Titre</label>
                <input type="text" className="w-full text-xl font-black outline-none placeholder-slate-100 text-slate-900" placeholder="Nom..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest px-1">Description</label>
                <textarea className="w-full h-32 text-xs font-bold outline-none placeholder-slate-200 resize-none text-slate-600 bg-slate-50 p-4 rounded-2xl" placeholder="Détails..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-300">Responsable</p>
                      <select className="w-full bg-transparent font-black text-[10px] outline-none text-slate-900" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-300">Client</p>
                      <select className="w-full bg-transparent font-black text-[10px] outline-none text-slate-900" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                        <option value="">Interne</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-300">Échéance</p>
                      <input type="date" className="w-full bg-transparent font-black text-[10px] outline-none text-slate-900" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-300">Urgence</p>
                      <select className="w-full bg-transparent font-black text-[10px] outline-none text-slate-900" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
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
