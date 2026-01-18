
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, Trash2, GripVertical, CheckCircle2, MoreHorizontal, Briefcase, User as UserIcon, Type as TypeIcon, AlertTriangle, Layers, Info } from 'lucide-react';
import { Task, TaskStatus, User, Client } from '../types';

const TaskCard = ({ task, onClick, clientName, assignee, onDragStart }: any) => {
  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="glass-card p-5 rounded-2xl mb-3 group cursor-grab active:cursor-grabbing border border-white/5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 truncate">
          <GripVertical size={14} className="text-slate-700 group-hover:text-violet-400 transition-colors" />
          <div className="truncate">
            <h4 className={`font-bold text-white text-[13px] tracking-tight truncate ${task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
              {task.title}
            </h4>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-1.5 truncate">{clientName}</p>
          </div>
        </div>
        {assignee && (
          <img src={assignee.avatar} className="w-7 h-7 rounded-lg border border-white/10 shadow-sm" alt="" />
        )}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <CalendarIcon size={12} className="text-violet-400" />
          <span>{task.dueDate}</span>
        </div>
        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'text-urgent bg-urgent/10' : 'text-slate-600'}`}>
          {task.priority || 'MED'}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tasks, users, clients, onDrop, onTaskClick, onDragStart }: any) => {
  const [isOver, setIsOver] = useState(false);
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c: any) => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map<string, User>(users.map((u: any) => [u.id, u])), [users]);

  const colorConfig = {
    [TaskStatus.TODO]: { color: 'text-slate-400', bg: 'bg-slate-400/10', line: 'border-slate-400/20' },
    [TaskStatus.IN_PROGRESS]: { color: 'text-violet-400', bg: 'bg-violet-400/10', line: 'border-violet-400/20' },
    [TaskStatus.DONE]: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', line: 'border-emerald-400/20' },
  };

  const config = colorConfig[status] || colorConfig[TaskStatus.TODO];

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(e.dataTransfer.getData('taskId'), status); }}
      className={`flex flex-col h-full min-h-[550px] rounded-[2.5rem] transition-all duration-300 relative ${isOver ? 'bg-white/5 scale-[1.01] shadow-2xl' : 'bg-slate-900/30 border border-white/5'}`}
    >
      <div className="p-7 flex items-center justify-between sticky top-0 bg-transparent z-10">
        <div className="flex items-center space-x-3">
          <div className={`w-2.5 h-2.5 rounded-full ${config.color.replace('text', 'bg')} shadow-[0_0_12px] ${config.color.replace('text', 'shadow')}`}></div>
          <h3 className="font-black text-white text-[11px] uppercase tracking-[0.2em]">{status}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-500 glass px-3.5 py-1 rounded-full">{tasks.length}</span>
      </div>
      
      <div className="flex-1 px-5 pb-8 overflow-y-auto no-scrollbar">
        {tasks.map((task: any) => (
          <TaskCard 
            key={task.id} task={task} onDragStart={onDragStart}
            onClick={() => onTaskClick(task.id)} 
            clientName={clientMap.get(task.clientId || '')?.name || 'Interne'} 
            assignee={userMap.get(task.assigneeId)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
            <CheckCircle2 size={28} className="mb-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Flux Vide</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Tasks = ({ tasks, users, clients = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', 
    description: '', 
    dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', 
    assigneeId: currentUser.id, 
    type: 'content', 
    clientId: '' 
  });
  
  const tasksByStatus = useMemo(() => ({
      [TaskStatus.TODO]: tasks.filter((t: any) => t.status === TaskStatus.TODO || !t.status),
      [TaskStatus.IN_PROGRESS]: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.DONE]: tasks.filter((t: any) => t.status === TaskStatus.DONE),
  }), [tasks]);

  const currentTask = tasks.find((t: any) => t.id === selectedTaskId);

  const closeModals = () => {
    setViewMode('list');
    setSelectedTaskId(null);
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex justify-between items-end px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400 mb-2">OPERATIONAL FLOW</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">Missions</h2>
          </div>
          <button 
            onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'content', clientId: '' }); setViewMode('add'); }} 
            className="w-14 h-14 bg-violet-400 text-white rounded-2xl shadow-xl shadow-violet-400/20 active-scale hover:rotate-90 transition-all flex items-center justify-center"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map(status => (
              <KanbanColumn 
                key={status} status={status} tasks={tasksByStatus[status]} 
                users={users} clients={clients} 
                onDragStart={(e: any, id: any) => { e.dataTransfer.setData('taskId', id); }} 
                onDrop={(id: any, st: any) => onUpdateStatus(id, st)} 
                onTaskClick={setSelectedTaskId} 
              />
          ))}
        </div>
      </div>

      {/* MODAL AJOUT/EDITION - FIXÉ */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] p-8 md:p-14 animate-fade-in">
               <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-none">{viewMode === 'add' ? 'Déployer Mission' : 'Configuration'}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Paramètres opérationnels iVISION</p>
                  </div>
                  <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={24}/></button>
               </div>
               
               <form onSubmit={(e) => {
                   e.preventDefault();
                   if (viewMode === 'edit' && formData.id) onUpdateTask(formData);
                   else onAddTask({ ...formData, status: TaskStatus.TODO });
                   closeModals();
               }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><TypeIcon size={12} className="mr-2 text-violet-400"/> Titre du livrable</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-violet-400 transition-all text-sm" placeholder="Ex: Campagne Display Q4" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Info size={12} className="mr-2 text-violet-400"/> Description / Brief</label>
                    <textarea className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-medium text-white outline-none focus:border-violet-400 transition-all text-sm h-32 resize-none" placeholder="Détails stratégiques..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><UserIcon size={12} className="mr-2 text-violet-400"/> Responsable</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                          {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Briefcase size={12} className="mr-2 text-violet-400"/> Client CRM</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                          <option value="">Interne iVISION</option>
                          {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><CalendarIcon size={12} className="mr-2 text-violet-400"/> Échéance</label>
                      <input type="date" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-violet-400 text-sm" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><AlertTriangle size={12} className="mr-2 text-violet-400"/> Priorité</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Layers size={12} className="mr-2 text-violet-400"/> Type</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                          <option value="content">Contenu</option>
                          <option value="ads">Publicité</option>
                          <option value="social">Social</option>
                          <option value="seo">SEO</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-6 bg-violet-400 text-white font-black rounded-3xl shadow-xl active-scale uppercase text-[11px] tracking-[0.3em] mt-4 transition-all hover:bg-violet-500">
                    Confirmer Déploiement
                  </button>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAILS - FIXÉ */}
      {selectedTaskId && currentTask && viewMode === 'list' && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-xl">
            <div className="relative glass w-full transform rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] p-8 md:p-14 animate-fade-in">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight uppercase leading-tight">{currentTask.title}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Détails de la mission iVISION</p>
                </div>
                <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={24}/></button>
              </div>
              
              <div className="space-y-8">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4">Briefing</h4>
                   <p className="text-sm text-slate-300 leading-relaxed font-medium">{currentTask.description || "Aucun brief spécifique."}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 glass-card rounded-2xl border border-white/5 text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Échéance</p>
                      <p className="text-xs font-bold text-white uppercase">{currentTask.dueDate}</p>
                    </div>
                    <div className="p-5 glass-card rounded-2xl border border-white/5 text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Priorité</p>
                      <p className={`text-xs font-black uppercase ${currentTask.priority === 'high' ? 'text-urgent' : 'text-white'}`}>{currentTask.priority || 'Medium'}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4 pt-4">
                  <button onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl shadow-xl hover:bg-violet-400 hover:text-white transition-all uppercase text-[10px] tracking-widest">Modifier Configuration</button>
                  <button onClick={() => { if(confirm('Révoquer cette mission ?')) { onDeleteTask(currentTask.id); closeModals(); } }} className="w-full py-5 bg-urgent/10 text-urgent font-black rounded-2xl hover:bg-urgent/20 transition-all uppercase text-[10px] tracking-widest">Révoquer Mission</button>
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
