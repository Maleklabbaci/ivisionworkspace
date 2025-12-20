
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Plus, LayoutGrid, List, CheckCircle, X, Trash2, Tag, ChevronRight, AlertCircle, Clock, CheckSquare, Loader2 } from 'lucide-react';
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

// Composant de carte optimisé (Lazy rendering friendly)
const TaskCard = memo(({ task, onClick, clientName }: { task: Task; onClick: () => void; clientName: string }) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm active-scale transition-all flex items-center justify-between group cursor-pointer mb-3"
  >
    <div className="flex items-center space-x-4 overflow-hidden">
      <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
        task.status === TaskStatus.DONE ? 'bg-success' : 
        task.status === TaskStatus.BLOCKED ? 'bg-urgent' :
        task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-300'
      }`}></div>
      <div className="overflow-hidden">
        <h4 className={`font-bold text-slate-900 truncate text-sm ${task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
          {task.title}
        </h4>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-widest truncate">
          {clientName}
        </p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-200 flex-shrink-0 ml-2" />
  </div>
));

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
    if (editingTask) onUpdateTask({ ...editingTask, ...formData } as Task);
    else onAddTask({ id: `temp-${Date.now()}`, ...formData } as Task);
    setShowFormModal(false);
    setFormData({ title: '', status: TaskStatus.TODO, assigneeId: currentUser.id });
  }, [formData, editingTask, onAddTask, onUpdateTask, currentUser.id]);

  // Distribution des tâches par statut
  const boardData = useMemo(() => ({
    [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.BLOCKED]: tasks.filter(t => t.status === TaskStatus.BLOCKED),
    [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE),
  }), [tasks]);

  const columns = [
    { status: TaskStatus.TODO, label: 'À faire', color: 'bg-slate-300', icon: Clock },
    { status: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'bg-primary', icon: CheckSquare },
    { status: TaskStatus.BLOCKED, label: 'Bloqué', color: 'bg-urgent', icon: AlertCircle },
    { status: TaskStatus.DONE, label: 'Terminé', color: 'bg-success', icon: CheckCircle },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 page-transition max-w-full overflow-hidden">
      {/* Header compact */}
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Workflow</h2>
            <div className="flex items-center space-x-2 mt-0.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{tasks.length} Missions</p>
            </div>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-[1.2rem] border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 px-5 rounded-xl transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => setViewMode('board')} 
            className={`p-2 px-5 rounded-xl transition-all flex items-center justify-center ${viewMode === 'board' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
          {viewMode === 'list' ? (
            <div className="pb-32 space-y-1 overflow-y-auto no-scrollbar max-h-full px-2">
              {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <Loader2 size={40} className="animate-spin mb-4" />
                      <p className="font-black uppercase text-[10px] tracking-widest">Aucune donnée</p>
                  </div>
              ) : (
                tasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => setSelectedTaskId(task.id)} 
                    clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="board-container -mx-4 px-4 pb-32 h-full flex items-start">
              {columns.map(col => (
                <div key={col.status} className="board-column flex-shrink-0 w-[85vw] md:w-[320px] snap-center h-full flex flex-col">
                  <div className="mb-5 flex items-center justify-between px-3 bg-white/50 py-2 rounded-2xl sticky top-0 z-10 backdrop-blur-sm">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-sm`}></div>
                      <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{col.label}</h3>
                    </div>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg text-slate-400">
                        {boardData[col.status].length}
                    </span>
                  </div>
                  <div className="space-y-0 px-1 overflow-y-auto no-scrollbar flex-1">
                    {boardData[col.status].length === 0 ? (
                      <div className="border-2 border-dashed border-slate-100 rounded-[2.5rem] h-32 flex flex-col items-center justify-center opacity-30">
                        <col.icon size={20} />
                        <span className="text-[8px] font-black mt-2 uppercase tracking-widest">Vide</span>
                      </div>
                    ) : (
                      boardData[col.status].map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            onClick={() => setSelectedTaskId(task.id)} 
                            clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => { setEditingTask(null); setFormData({ title: '', status: TaskStatus.TODO }); setShowFormModal(true); }}
        className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-[0_15px_45px_rgba(0,102,255,0.4)] flex items-center justify-center z-30 active-scale border-4 border-white"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Detail Modal Overlay (Mobile Optimized) */}
      {selectedTaskId && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-5xl p-8 animate-in slide-in-from-bottom duration-400 safe-pb shadow-[0_-15px_60px_rgba(0,0,0,0.1)]">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <header className="flex justify-between items-center mb-8">
               <h3 className="font-black text-xl tracking-tighter uppercase text-slate-400 text-sm">Détails Mission</h3>
               <button onClick={() => setSelectedTaskId(null)} className="p-3 bg-slate-50 rounded-2xl active-scale"><X size={20}/></button>
            </header>
            <div className="space-y-6">
              <h4 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter">
                  {tasks.find(t=>t.id===selectedTaskId)?.title}
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center space-x-2 border border-slate-100">
                    <div className={`w-2 h-2 rounded-full ${tasks.find(t=>t.id===selectedTaskId)?.status === TaskStatus.DONE ? 'bg-success' : 'bg-primary'}`}></div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{tasks.find(t=>t.id===selectedTaskId)?.status}</span>
                </div>
                <div className="bg-primary/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-primary border border-primary/10 tracking-widest">
                    Priorité: {tasks.find(t=>t.id===selectedTaskId)?.priority}
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-slate-600 font-bold text-sm leading-relaxed">
                    {tasks.find(t=>t.id===selectedTaskId)?.description || 'Aucune description rédigée.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => { if(confirm('Supprimer cette mission ?')) { onDeleteTask(selectedTaskId!); setSelectedTaskId(null); } }}
                   className="p-5 bg-red-50 text-red-500 font-black rounded-3xl active-scale text-[10px] uppercase tracking-widest"
                 >
                   Supprimer
                 </button>
                 <button 
                   onClick={() => { 
                       const t = tasks.find(x => x.id === selectedTaskId);
                       if(t) onUpdateStatus(t.id, t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE);
                       setSelectedTaskId(null);
                   }}
                   className="p-5 bg-primary text-white font-black rounded-3xl active-scale text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                 >
                   Changer État
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Mission Form (Full Screen Mobile) */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] bg-white animate-in slide-in-from-bottom duration-400 flex flex-col safe-pt">
          <header className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
            <button onClick={() => setShowFormModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale transition-all"><X size={22}/></button>
            <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm">Nouvelle Mission</h3>
            <button onClick={handleSubmit} className="text-primary font-black text-xs tracking-widest bg-primary/5 px-5 py-3 rounded-2xl active-scale">VALIDER</button>
          </header>
          <div className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-20">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Intitulé</label>
                <input 
                    type="text" 
                    className="w-full text-4xl font-black outline-none placeholder-slate-100 text-slate-900 caret-primary" 
                    placeholder="Titre du projet"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    autoFocus
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Description</label>
                <textarea 
                    className="w-full h-40 text-lg font-bold outline-none placeholder-slate-100 text-slate-500 resize-none leading-relaxed" 
                    placeholder="Expliquez les détails ici..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 pt-6">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Priorité</p>
                    <select className="bg-transparent font-black outline-none w-full text-slate-900" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                    </select>
                </div>
                <Tag size={18} className="text-slate-200" />
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Assigner à</p>
                    <select className="bg-transparent font-black outline-none w-full text-slate-900" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <Clock size={18} className="text-slate-200" />
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Client</p>
                    <select className="bg-transparent font-black outline-none w-full text-slate-900" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                    <option value="">Projet Interne</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <LayoutGrid size={18} className="text-slate-200" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
