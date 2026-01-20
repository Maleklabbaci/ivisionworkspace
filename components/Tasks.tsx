
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, CheckCircle2, Layers, Type as TypeIcon, User as UserIcon, Archive, ChevronDown, ChevronUp, History, Check, Sparkles, ArrowRight, Briefcase } from 'lucide-react';
import { Task, TaskStatus, User, Client, Project, UserRole } from '../types';
import Modal from './Modal';

const TaskCard = ({ task, onClick, clientName, projectName, assignee, onDragStart, canEdit, onComplete }: any) => {
  const isDone = task.status === TaskStatus.DONE;
  
  return (
    <div 
      draggable={canEdit && !isDone}
      onDragStart={(e) => canEdit && !isDone && onDragStart(e, task.id)}
      onClick={onClick}
      className={`crystal-module p-3 rounded-2xl mb-3 group relative overflow-hidden border border-white/5 active-scale transition-all hover:bg-white/5 ${canEdit && !isDone ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDone ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 text-left">
          <h4 className={`font-black text-white text-[11px] uppercase tracking-tight truncate leading-none group-hover:text-sky-400 transition-colors`}>
            {task.title}
          </h4>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-[7px] text-slate-500 font-black uppercase truncate tracking-widest">{clientName}</p>
            {projectName && (
              <span className="text-[7px] text-sky-400/30 font-black uppercase flex items-center truncate">
                <div className="w-1 h-1 rounded-full bg-sky-400/20 mx-1" /> {projectName}
              </span>
            )}
          </div>
          
          {!isDone && (
            <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center space-x-1.5 text-[7px] font-black text-slate-600 uppercase tracking-widest">
                <CalendarIcon size={8} className="text-sky-400" />
                <span>{task.dueDate}</span>
              </div>
              <div className={`px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest border border-white/5 ${task.priority === 'high' ? 'text-rose-500 bg-rose-500/10 border-rose-500/10' : 'text-slate-600 bg-white/5'}`}>
                {task.priority || 'MED'}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end justify-between h-full space-y-4">
          {assignee && (
            <div className="w-6 h-6 rounded-lg border border-white/10 overflow-hidden flex-shrink-0 shadow-sm">
              <img src={assignee.avatar} className="w-full h-full object-cover" alt="" />
            </div>
          )}
          
          {!isDone && canEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
              className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 shadow-lg active-scale group/check"
              title="Terminer maintenant"
            >
              <Check size={18} strokeWidth={3} className="group-hover/check:scale-125 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tasks, users, clients, projects, onDrop, onTaskClick, onDragStart, currentUser, onUpdateStatus }: any) => {
  const [isOver, setIsOver] = useState(false);
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c: any) => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map<string, User>(users.map((u: any) => [u.id, u])), [users]);
  const projectMap = useMemo(() => new Map<string, Project>(projects.map((p: any) => [p.id, p])), [projects]);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canEditAny = isAdmin || currentUser.permissions?.canEditAllTasks;

  const colorConfig = {
    [TaskStatus.TODO]: 'text-slate-500',
    [TaskStatus.IN_PROGRESS]: 'text-sky-400',
    [TaskStatus.DONE]: 'text-emerald-400',
  };

  const color = colorConfig[status] || 'text-slate-400';

  return (
    <div 
      onDragOver={(e) => { if (!canEditAny) return; e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { if (!canEditAny) return; e.preventDefault(); setIsOver(false); onDrop(e.dataTransfer.getData('taskId'), status); }}
      className={`flex flex-col h-full min-h-[400px] rounded-[2rem] transition-all duration-300 relative flex-shrink-0 w-[280px] md:w-auto overflow-hidden ${isOver ? 'bg-white/[0.04] scale-[1.01] border-sky-500/30 shadow-2xl' : 'bg-slate-900/30 border border-white/5'}`}
    >
      <div className="p-5 pb-3 flex items-center justify-between sticky top-0 bg-transparent z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`}></div>
          <h3 className={`font-black ${color} text-[9px] uppercase tracking-widest`}>{status}</h3>
        </div>
        <span className="text-[8px] font-black text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{tasks.length}</span>
      </div>
      
      <div className="flex-1 px-3 pb-8 overflow-y-auto no-scrollbar pt-2">
        {tasks.map((task: any) => (
          <TaskCard 
            key={task.id} task={task} onDragStart={onDragStart}
            onClick={() => onTaskClick(task.id)} 
            clientName={clientMap.get(task.clientId || '')?.name || 'iVISION'} 
            projectName={projectMap.get(task.projectId || '')?.name}
            assignee={userMap.get(task.assigneeId)}
            canEdit={canEditAny || task.assigneeId === currentUser.id}
            onComplete={(id: string) => onUpdateStatus(id, TaskStatus.DONE)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-10">
            <CheckCircle2 size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

const Tasks = ({ tasks, users, clients = [], projects = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [showArchives, setShowArchives] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'content', clientId: '', projectId: '' });
  
  const tasksByStatus = useMemo(() => ({
      [TaskStatus.TODO]: tasks.filter((t: any) => t.status === TaskStatus.TODO || !t.status),
      [TaskStatus.IN_PROGRESS]: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.DONE]: tasks.filter((t: any) => t.status === TaskStatus.DONE),
  }), [tasks]);

  // Groupement des archives par client
  // Fixed type error by explicitly typing useMemo and provide an initial value with type casting
  const archivedByClient = useMemo((): Record<string, Task[]> => {
    const doneTasks = tasksByStatus[TaskStatus.DONE] as Task[];
    return doneTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
      const cId = task.clientId || 'internal';
      if (!acc[cId]) acc[cId] = [];
      acc[cId].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasksByStatus]);

  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c: any) => [c.id, c])), [clients]);

  const currentTask = tasks.find((t: any) => t.id === selectedTaskId);
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canCreate = isAdmin || currentUser.permissions?.canCreateTasks;
  const canDelete = isAdmin || currentUser.permissions?.canDeleteTasks;
  const canEditThisTask = isAdmin || currentUser.permissions?.canEditAllTasks || currentTask?.assigneeId === currentUser.id;

  const closeModals = () => { setViewMode('list'); setSelectedTaskId(null); };

  return (
    <div className="relative pb-24">
      <div className="space-y-10 animate-fade-in">
        {/* Header Compact */}
        <div className="flex justify-between items-end px-2">
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2 leading-none">FLUX OPÉRATIONNEL</p>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Missions</h2>
          </div>
          <div className="flex items-center space-x-3">
             <button 
              onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'content', clientId: '', projectId: '' }); setViewMode('add'); }} 
              className="w-12 h-12 bg-sky-500 text-white rounded-2xl shadow-xl active-scale flex items-center justify-center transition-all hover:scale-110 hover:rotate-90"
            >
              <Plus size={30} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Board Principal (Uniquement À Faire et En Cours) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
          {[TaskStatus.TODO, TaskStatus.IN_PROGRESS].map(status => (
            <KanbanColumn 
              key={status}
              status={status} 
              tasks={tasksByStatus[status]} 
              users={users} clients={clients} projects={projects}
              currentUser={currentUser}
              onDragStart={(e: any, id: any) => { e.dataTransfer.setData('taskId', id); }} 
              onDrop={(id: any, st: any) => onUpdateStatus(id, st)} 
              onTaskClick={setSelectedTaskId} 
              onUpdateStatus={onUpdateStatus}
            />
          ))}
          
          {/* Drop Zone Terminé (Pour archiver) */}
          <div 
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); onUpdateStatus(e.dataTransfer.getData('taskId'), TaskStatus.DONE); }}
            className="md:col-span-2 border-2 border-dashed border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center opacity-40 hover:opacity-100 hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-all group active-scale"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Archive size={32} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-400">Glisser ici pour archiver la mission</p>
          </div>
        </div>

        {/* SECTION ARCHIVES GROUPÉES PAR CLIENT */}
        <div className="mt-16 px-2">
           <button 
             onClick={() => setShowArchives(!showArchives)}
             className="w-full py-6 glass rounded-[2rem] flex items-center justify-between px-8 active-scale transition-all border border-white/5 hover:bg-white/[0.04]"
           >
             <div className="flex items-center space-x-4 text-slate-500">
                <History size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Archives du Système</span>
                <span className="text-[9px] bg-white/5 px-3 py-1 rounded-full border border-white/5">{tasksByStatus[TaskStatus.DONE].length}</span>
             </div>
             {showArchives ? <ChevronUp size={20} className="text-slate-600"/> : <ChevronDown size={20} className="text-slate-600"/>}
           </button>

           {showArchives && (
             <div className="mt-6 space-y-10 animate-slide-up">
                {/* Fixed type errors by casting the entries result to [string, Task[]][] to ensure clientTasks is typed correctly */}
                {(Object.entries(archivedByClient) as [string, Task[]][]).map(([clientId, clientTasks]) => (
                  <div key={clientId} className="space-y-4">
                    <div className="flex items-center space-x-3 px-4">
                      <Briefcase size={14} className="text-sky-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {clientId === 'internal' ? 'INTERNE iVISION' : clientMap.get(clientId)?.name} 
                        <span className="ml-2 text-slate-600 opacity-50">({clientTasks.length})</span>
                      </h4>
                      <div className="flex-1 h-px bg-white/5"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {clientTasks.map((task: Task) => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/5 active-scale"
                        >
                          <div className="truncate pr-4 text-left">
                             <h5 className="text-[10px] font-bold text-slate-500 uppercase truncate group-hover:text-emerald-400 transition-colors">{task.title}</h5>
                             <p className="text-[8px] text-slate-700 font-black uppercase mt-1.5 tracking-tighter truncate">{task.dueDate}</p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 opacity-40">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {tasksByStatus[TaskStatus.DONE].length === 0 && (
                  <div className="py-16 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucune archive disponible</p>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>

      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={closeModals} title={viewMode === 'add' ? 'Planification' : 'Configuration'}>
        <form onSubmit={(e) => { e.preventDefault(); if (viewMode === 'edit' && formData.id) onUpdateTask(formData); else onAddTask({ ...formData, status: TaskStatus.TODO }); closeModals(); }} className="space-y-6">
            <div className="space-y-1.5"><label className="label-iv text-[9px]">Désignation de la mission</label><input required className="input-iv h-12 text-sm" placeholder="Titre stratégique" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="space-y-1.5"><label className="label-iv text-[9px]">Spécifications & Briefing</label><textarea className="input-iv h-32 resize-none text-sm leading-relaxed" placeholder="Instructions détaillées..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5"><label className="label-iv text-[9px]">Assigné à</label><select className="input-iv h-12 text-sm" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>{users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div className="space-y-1.5"><label className="label-iv text-[9px]">Priorité</label><select className="input-iv h-12 text-sm" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option></select></div>
            </div>
            <button type="submit" className="w-full py-5 bg-sky-500 text-white font-black rounded-2xl shadow-xl active-scale uppercase text-[11px] tracking-[0.2em] mt-6 hover:bg-sky-400 transition-all">Confirmer l'Indexation</button>
         </form>
      </Modal>

      <Modal isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} onClose={closeModals} title={currentTask?.title}>
        <div className="space-y-8">
           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-left relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 blur-[50px] group-hover:bg-sky-400/10 transition-all"></div>
             <h4 className="label-iv mb-4 text-sky-400 text-[10px] flex items-center"><Sparkles size={14} className="mr-2" /> Briefing Opérationnel</h4>
             <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">{currentTask?.description || "Aucun brief disponible."}</p>
           </div>
           
           <div className="flex flex-col gap-4 pt-2">
            {currentTask?.status !== TaskStatus.DONE && canEditThisTask && (
              <button 
                onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); closeModals(); }} 
                className="w-full py-8 bg-emerald-500 text-white font-black rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] uppercase text-[12px] md:text-[14px] tracking-[0.3em] active-scale flex items-center justify-center space-x-4 transition-all hover:bg-emerald-400 group/bigbtn"
              >
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center group-hover/bigbtn:scale-110 transition-transform">
                  <Check size={28} strokeWidth={4} />
                </div>
                <span>MISSION ACCOMPLIE</span>
                <ArrowRight size={20} className="opacity-0 group-hover/bigbtn:opacity-100 group-hover/bigbtn:translate-x-2 transition-all" />
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              {currentTask?.status !== TaskStatus.DONE && canEditThisTask && (
                <button 
                  onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} 
                  className="flex-1 py-5 bg-white/5 text-white border border-white/10 font-black rounded-2xl uppercase text-[10px] tracking-widest active-scale hover:bg-white/10 transition-all"
                >
                  Détails & Edition
                </button>
              )}
              {canDelete && (
                <button 
                  onClick={() => { if(confirm('Révoquer définitivement cette mission ?')) { onDeleteTask(currentTask?.id); closeModals(); } }} 
                  className="flex-1 py-5 bg-rose-500/5 text-rose-500 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-rose-500/10 active-scale hover:bg-rose-500/10 transition-all"
                >
                  Supprimer
                </button>
              )}
            </div>

            {currentTask?.status === TaskStatus.DONE && (
              <button 
                onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.TODO); closeModals(); }} 
                className="flex-1 py-6 bg-emerald-500/10 text-emerald-500 font-black rounded-2xl uppercase text-[11px] tracking-widest border border-emerald-500/10 active-scale hover:bg-emerald-500/20 transition-all flex items-center justify-center space-x-3"
              >
                <History size={20} />
                <span>Restaurer (Sortir des archives)</span>
              </button>
            )}
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
