
import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { Plus, LayoutGrid, List, CheckCircle, X, ChevronRight, AlertCircle, Clock, CheckSquare, Loader2, Edit2, PlayCircle, PauseCircle } from 'lucide-react';
import { Task, TaskStatus, User, Client } from '../types';

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

const TaskCard = memo(({ task, onClick, clientName }: { task: Task; onClick: () => void; clientName: string }) => {
  const isLate = task.dueDate < new Date().toISOString().split('T')[0] && task.status !== TaskStatus.DONE;
  
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-4 rounded-3xl border shadow-sm active-scale transition-all flex items-center justify-between group cursor-pointer mb-2.5 ${isLate ? 'border-urgent border-2' : 'border-slate-50 hover:border-primary/20'}`}
    >
      <div className="flex items-center space-x-4 overflow-hidden">
        <div className={`w-1 h-8 rounded-full flex-shrink-0 ${
          task.status === TaskStatus.DONE ? 'bg-success' : 
          task.status === TaskStatus.BLOCKED || isLate ? 'bg-urgent' :
          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-300'
        }`}></div>
        <div className="truncate">
          <h4 className={`font-bold text-slate-900 truncate text-sm ${task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
            {task.title}
          </h4>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">
            {clientName}
          </p>
        </div>
      </div>
      <ChevronRight size={14} className="text-slate-200" />
    </div>
  );
});

const Tasks: React.FC<TasksProps> = ({ 
  tasks, users, clients = [], currentUser, 
  onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
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
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Workflow</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tasks.length} missions</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl">
          <button onClick={() => setViewMode('list')} className={`p-2 px-4 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}><List size={18} /></button>
          <button onClick={() => setViewMode('board')} className={`p-2 px-4 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}><LayoutGrid size={18} /></button>
        </div>
      </div>

      <div className="space-y-1">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} />
        ))}
        {tasks.length === 0 && <div className="py-20 text-center text-slate-300 font-black text-xs uppercase tracking-widest opacity-30">Aucune mission</div>}
      </div>

      <button 
        onClick={() => { setShowFormModal(true); setEditingTask(null); }}
        className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center z-40 active-scale border-4 border-white"
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-[40px] p-8 pb-[calc(24px+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight pr-4">{currentTask.title}</h3>
              <button onClick={() => setSelectedTaskId(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: TaskStatus.TODO, label: 'À faire', color: 'bg-slate-100 text-slate-500', icon: Clock },
                  { id: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'bg-primary text-white', icon: PlayCircle },
                  { id: TaskStatus.BLOCKED, label: 'Bloqué', color: 'bg-urgent text-white', icon: PauseCircle },
                  { id: TaskStatus.DONE, label: 'Terminé', color: 'bg-success text-white', icon: CheckCircle },
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => onUpdateStatus(currentTask.id, s.id)}
                    className={`flex items-center space-x-2 p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${currentTask.status === s.id ? s.color : 'bg-slate-50 text-slate-400 opacity-60'}`}
                  >
                    <s.icon size={14} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl">
                <p className="text-slate-600 font-bold text-sm leading-relaxed">{currentTask.description || 'Pas de description.'}</p>
              </div>

              <div className="flex space-x-2">
                <button onClick={() => { setEditingTask(currentTask); setFormData(currentTask); setShowFormModal(true); setSelectedTaskId(null); }} className="flex-1 p-4 bg-slate-100 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest">Modifier</button>
                <button onClick={() => { if(confirm('Supprimer ?')) { onDeleteTask(currentTask.id); setSelectedTaskId(null); } }} className="flex-1 p-4 bg-red-50 text-urgent font-black rounded-2xl text-[10px] uppercase tracking-widest">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-[120] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <header className="px-6 py-4 flex items-center justify-between border-b border-slate-50 safe-pt">
            <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-400"><X size={20}/></button>
            <h3 className="font-black text-xs uppercase tracking-widest">Mission</h3>
            <button onClick={handleSubmit} className="text-primary font-black text-xs uppercase tracking-widest">Valider</button>
          </header>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <input type="text" className="w-full text-2xl font-black outline-none placeholder-slate-200" placeholder="Titre..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <textarea className="w-full h-32 text-sm font-bold outline-none placeholder-slate-200 resize-none" placeholder="Description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              
              <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Échéance</p>
                    <input type="date" className="w-full bg-transparent font-bold outline-none" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Priorité</p>
                    <select className="w-full bg-transparent font-bold outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Urgent</option>
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
