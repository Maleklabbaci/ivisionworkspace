import React, { useState, useMemo, useCallback } from 'react';
import { Plus, LayoutGrid, List, CheckCircle, X, Trash2, Tag, Check, ChevronRight, Calendar, User as UserIcon } from 'lucide-react';
import { Task, TaskStatus, User, Client, UserRole } from '../types';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    assigneeId: currentUser.id,
    dueDate: new Date().toISOString().split('T')[0],
    status: TaskStatus.TODO,
    priority: 'medium'
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title?.trim()) e.title = "Titre obligatoire";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editingTask) {
      onUpdateTask({ ...editingTask, ...formData } as Task);
    } else {
      onAddTask({ id: `temp-${Date.now()}`, ...formData } as Task);
    }
    setShowFormModal(false);
  }, [formData, editingTask, onAddTask, onUpdateTask]);

  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none";

  return (
    <div className="h-full flex flex-col space-y-6 page-transition">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Missions</h2>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}><List size={18} /></button>
          <button onClick={() => setViewMode('board')} className={`p-2 rounded-xl transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}><LayoutGrid size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-12">
        {tasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => setSelectedTaskId(task.id)}
            className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm active-scale transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-urgent' : 'bg-primary'}`}></div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-900 truncate">{task.title}</h4>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 tracking-widest">
                  {clientMap.get(task.clientId || '')?.name || 'Projet Interne'} • {task.status}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-primary transition-colors">
              <ChevronRight size={18} />
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => { setEditingTask(null); setFormData({ title: '', assigneeId: currentUser.id, status: TaskStatus.TODO }); setFormErrors({}); setShowFormModal(true); }}
        className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center z-[35] border-4 border-white active-scale"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* MODAL FORMULAIRE - Z-Index 100 pour couvrir la nav */}
      {showFormModal && (
        <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-bottom duration-500 flex flex-col pb-[env(safe-area-inset-bottom)]">
          <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20 safe-top">
            <button onClick={() => setShowFormModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={20}/></button>
            <h3 className="font-black text-slate-900 tracking-tight uppercase text-sm">{editingTask ? 'Editer' : 'Nouvelle mission'}</h3>
            <button onClick={handleSubmit} className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 active-scale">VALIDER</button>
          </header>
          <form className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-2">Titre du projet</label>
                <input type="text" className={`${inputClasses} ${formErrors.title ? 'border-urgent bg-red-50' : ''}`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Campagne Hiver 2025" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-2">Description</label>
                <textarea className={`${inputClasses} min-h-[160px] resize-none py-5`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Détails de la mission..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-3xl border border-slate-100 p-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Priorité</label>
                  <select className="w-full bg-transparent border-none font-black text-slate-900 text-sm outline-none cursor-pointer" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute 🔥</option>
                  </select>
                </div>
                <div className="bg-slate-50 rounded-3xl border border-slate-100 p-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Responsable</label>
                  <select className="w-full bg-transparent border-none font-black text-slate-900 text-sm outline-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DETAIL - Z-Index 100 pour couvrir la nav */}
      {selectedTaskId && selectedTask && (
        <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-bottom duration-500 flex flex-col pb-[env(safe-area-inset-bottom)]">
          <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-20 safe-top">
            <button onClick={() => setSelectedTaskId(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={20}/></button>
            <div className="flex space-x-2">
              <button onClick={() => { setEditingTask(selectedTask); setFormData(selectedTask); setShowFormModal(true); }} className="p-3 bg-slate-50 text-slate-600 rounded-2xl active-scale hover:bg-primary/10 hover:text-primary"><Tag size={20}/></button>
              <button onClick={() => { if(confirm('Supprimer cette mission ?')) { onDeleteTask(selectedTask.id); setSelectedTaskId(null); } }} className="p-3 bg-red-50 text-urgent rounded-2xl active-scale"><Trash2 size={20}/></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
            <div className="space-y-4">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${selectedTask.priority === 'high' ? 'bg-red-50 text-urgent ring-1 ring-red-100' : 'bg-primary/5 text-primary ring-1 ring-primary/10'}`}>
                {selectedTask.priority} priority
              </div>
              <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{selectedTask.title}</h3>
            </div>
            
            <div className="p-8 bg-slate-50 rounded-[2.5rem] text-sm text-slate-600 leading-relaxed font-bold border border-slate-100">
              {selectedTask.description || "Aucune description détaillée n'a été rédigée."}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">STATUS ACTUEL</span>
                <select className="bg-transparent border-none p-0 font-black text-primary text-base outline-none cursor-pointer" value={selectedTask.status} onChange={e => onUpdateStatus(selectedTask.id, e.target.value as TaskStatus)}>
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">RESPONSABLE</span>
                <div className="flex items-center space-x-3">
                  <img src={userMap.get(selectedTask.assigneeId)?.avatar} className="w-8 h-8 rounded-xl border-2 border-white shadow-sm" />
                  <span className="text-xs font-black text-slate-700 truncate">{userMap.get(selectedTask.assigneeId)?.name}</span>
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