
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Plus, LayoutGrid, List, CheckCircle, X, Trash2, Tag, ChevronRight, AlertCircle, Clock, CheckSquare, Loader2, Edit2, PlayCircle, PauseCircle, Users, Calendar, Flag } from 'lucide-react';
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
      className={`bg-white p-4 rounded-[1.8rem] border shadow-sm active-scale transition-all flex items-center justify-between group cursor-pointer mb-2.5 ${isLate ? 'border-urgent border-2 animate-pulse-subtle' : 'border-slate-50 hover:border-primary/20 hover:shadow-md'}`}
    >
      <div className="flex items-center space-x-3.5 overflow-hidden">
        <div className={`w-1 h-9 rounded-full flex-shrink-0 ${
          task.status === TaskStatus.DONE ? 'bg-success' : 
          task.status === TaskStatus.BLOCKED || isLate ? 'bg-urgent' :
          task.status === TaskStatus.IN_PROGRESS ? 'bg-primary' : 'bg-slate-300'
        }`}></div>
        <div className="overflow-hidden">
          <div className="flex items-center space-x-2">
            <h4 className={`font-bold text-slate-900 truncate text-[13px] ${task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
              {task.title}
            </h4>
            {isLate && <span className="text-[7px] bg-urgent text-white px-1.5 py-0.5 rounded font-black uppercase">URGENT</span>}
          </div>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-widest truncate">
            {clientName}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
         <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
           task.status === TaskStatus.BLOCKED ? 'bg-urgent/10 text-urgent' : 
           task.status === TaskStatus.IN_PROGRESS ? 'bg-primary/10 text-primary' : 
           task.status === TaskStatus.DONE ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'
         }`}>
           {task.status}
         </span>
         <ChevronRight size={12} className="text-slate-200" />
      </div>
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
    setFormData({ title: '', status: TaskStatus.TODO, assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], priority: 'medium' });
  }, [formData, editingTask, onAddTask, onUpdateTask, currentUser.id]);

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

  const currentTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

  return (
    <div className="h-full flex flex-col space-y-5 page-transition max-w-full overflow-hidden">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Workflow</h2>
            <div className="flex items-center space-x-2 mt-0.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{tasks.length} ACTIVES</p>
            </div>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setViewMode('list')} className={`p-1.5 px-4 rounded-xl transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}><List size={16} /></button>
          <button onClick={() => setViewMode('board')} className={`p-1.5 px-4 rounded-xl transition-all flex items-center justify-center ${viewMode === 'board' ? 'bg-white shadow-sm text-primary' : 'text-slate-300'}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
          {viewMode === 'list' ? (
            <div className="pb-32 space-y-1 overflow-y-auto no-scrollbar max-h-full px-2">
              {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <Loader2 size={32} className="animate-spin mb-4 text-slate-300" />
                      <p className="font-black uppercase text-[9px] tracking-widest text-slate-400">Flux vide</p>
                  </div>
              ) : (
                tasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} />
                ))
              )}
            </div>
          ) : (
            <div className="board-container -mx-4 px-4 pb-32 h-full flex items-start overflow-x-auto">
              {columns.map(col => (
                <div key={col.status} className="board-column flex-shrink-0 w-[80vw] md:w-[280px] snap-center h-full flex flex-col">
                  <div className="mb-4 flex items-center justify-between px-4 bg-slate-50/50 py-2.5 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-sm ring-4 ring-white`}></div>
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{col.label}</h3>
                    </div>
                    <span className="text-[9px] font-black bg-white px-1.5 py-0.5 rounded-md text-slate-400 border border-slate-50">{boardData[col.status].length}</span>
                  </div>
                  <div className="space-y-0 px-1 overflow-y-auto no-scrollbar flex-1 pb-10">
                    {boardData[col.status].length === 0 ? (
                      <div className="border-2 border-dashed border-slate-100 rounded-[2rem] h-28 flex flex-col items-center justify-center opacity-30">
                        <col.icon size={16} className="text-slate-300" />
                      </div>
                    ) : (
                      boardData[col.status].map(task => (
                        <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <button 
        onClick={() => { setEditingTask(null); setFormData({ title: '', status: TaskStatus.TODO, assigneeId: currentUser.id, dueDate: new Date().toISOString().split('T')[0], priority: 'medium' }); setShowFormModal(true); }}
        className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 md:absolute md:bottom-8 md:right-8 w-14 h-14 bg-primary text-white rounded-2xl shadow-[0_15px_45px_rgba(0,102,255,0.4)] flex items-center justify-center z-30 active-scale border-4 border-white transition-all hover:scale-105"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {selectedTaskId && currentTask && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedTaskId(null)}></div>
          <div className="relative bg-white rounded-t-5xl md:rounded-5xl md:mb-10 md:mx-auto md:max-w-xl p-8 animate-in slide-in-from-bottom duration-400 safe-pb shadow-[0_-15px_60px_rgba(0,0,0,0.2)]">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <header className="flex justify-between items-center mb-8">
               <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Détails Mission</h3>
               <div className="flex items-center space-x-2">
                 <button onClick={() => { setEditingTask(currentTask); setFormData(currentTask); setShowFormModal(true); setSelectedTaskId(null); }} className="p-3 bg-slate-50 text-slate-600 rounded-2xl active-scale"><Edit2 size={18}/></button>
                 <button onClick={() => setSelectedTaskId(null)} className="p-3 bg-slate-50 rounded-2xl active-scale"><X size={18}/></button>
               </div>
            </header>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">{currentTask.title}</h4>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{clientMap.get(currentTask.clientId || '')?.name || 'Projet Interne'} • ÉCHÉANCE : {currentTask.dueDate}</p>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Changer l'état</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: TaskStatus.TODO, label: 'À faire', color: 'slate', icon: Clock },
                    { id: TaskStatus.IN_PROGRESS, label: 'En cours', color: 'primary', icon: PlayCircle },
                    { id: TaskStatus.BLOCKED, label: 'Bloqué', color: 'urgent', icon: PauseCircle },
                    { id: TaskStatus.DONE, label: 'Terminé', color: 'success', icon: CheckCircle },
                  ].map((status) => {
                    const isActive = currentTask.status === status.id;
                    const colorClass = 
                      status.color === 'primary' ? 'bg-primary text-white shadow-primary/20' : 
                      status.color === 'urgent' ? 'bg-urgent text-white shadow-urgent/20' : 
                      status.color === 'success' ? 'bg-success text-white shadow-success/20' : 
                      'bg-slate-200 text-slate-600 shadow-slate-200/20';

                    return (
                      <button 
                        key={status.id}
                        onClick={() => { onUpdateStatus(currentTask.id, status.id); setSelectedTaskId(null); }}
                        className={`flex items-center justify-center space-x-2 p-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest transition-all active-scale border-4 ${isActive ? `${colorClass} border-white shadow-lg` : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                      >
                        <status.icon size={16} strokeWidth={3} />
                        <span>{status.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 max-h-[100px] overflow-y-auto">
                <p className="text-slate-600 font-bold text-xs leading-relaxed">{currentTask.description || 'Aucune consigne rédigée.'}</p>
              </div>

              <div className="grid grid-cols-1">
                 <button onClick={() => { if(confirm('Supprimer cette mission ?')) { onDeleteTask(selectedTaskId!); setSelectedTaskId(null); } }} className="p-4 text-urgent font-black active-scale text-[9px] uppercase tracking-[0.3em] hover:bg-red-50 rounded-2xl transition-colors">
                   Révoquer la mission
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-[120] bg-white animate-in slide-in-from-bottom duration-400 flex flex-col safe-pt md:max-w-2xl md:mx-auto md:shadow-2xl md:rounded-[3rem] md:my-10 md:h-[calc(100vh-80px)]">
          <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
            <button onClick={() => { setShowFormModal(false); setEditingTask(null); }} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 active-scale"><X size={20}/></button>
            <h3 className="font-black text-slate-900 tracking-tighter uppercase text-xs">{editingTask ? 'Éditer' : 'Initialiser'} Mission</h3>
            <button onClick={handleSubmit} className="text-primary font-black text-[10px] tracking-widest bg-primary/5 px-5 py-2.5 rounded-xl active-scale">VALIDER</button>
          </header>
          <div className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-32 bg-white">
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] px-1 opacity-70">Intitulé</label>
                <input 
                  type="text" 
                  className="w-full text-3xl font-black outline-none placeholder-slate-200 text-slate-900 caret-primary bg-transparent" 
                  placeholder="Ex: Refonte UI..." 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  autoFocus 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] px-1 opacity-70">Description</label>
                <textarea 
                  className="w-full h-32 text-base font-bold outline-none placeholder-slate-100 text-slate-600 resize-none leading-relaxed bg-transparent" 
                  placeholder="Objectifs et contraintes..." 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between transition-all">
                <div className="w-full">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest opacity-60">Client</p>
                    <select className="bg-transparent font-black outline-none w-full text-slate-900 cursor-pointer text-xs" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                        <option value="">Interne</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between transition-all">
                <div className="w-full">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest opacity-60">Assigné à</p>
                    <select className="bg-transparent font-black outline-none w-full text-slate-900 cursor-pointer text-xs" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between transition-all">
                <div className="w-full">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest opacity-60">Échéance</p>
                    <input 
                      type="date" 
                      className="bg-transparent font-black outline-none w-full text-slate-900 cursor-pointer text-xs" 
                      value={formData.dueDate} 
                      onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                    />
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between transition-all">
                <div className="w-full">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest opacity-60">Priorité</p>
                    <select className="bg-transparent font-black outline-none w-full text-slate-900 cursor-pointer text-xs" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Urgent</option>
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
