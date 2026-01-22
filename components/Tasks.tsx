
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, CheckCircle2, RotateCcw, Check, Sparkles, Briefcase, Trash2, Video, Palette, Globe, Megaphone, Send, Layers, Filter, ChevronDown, ChevronUp, MousePointer2, ListChecks, Square, Edit2, User as UserIcon, AlertTriangle, Archive, ChevronRight } from 'lucide-react';
import { Task, TaskStatus, User, Client, Project, UserRole, TaskType } from '../types';
import Modal from './Modal';

const TYPE_CONFIG: Record<TaskType, { color: string; bg: string; border: string; icon: any; label: string; accent: string }> = {
  video: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: Video, label: 'VIDEO', accent: 'bg-rose-500' },
  design: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Palette, label: 'DESIGN', accent: 'bg-amber-500' },
  website: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: Globe, label: 'WEBSITE', accent: 'bg-emerald-500' },
  ads: { color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20', icon: Megaphone, label: 'ADS', accent: 'bg-sky-500' },
  post: { color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', icon: Send, label: 'POST', accent: 'bg-violet-500' },
  admin: { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: Layers, label: 'ADMIN', accent: 'bg-slate-500' },
  content: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: Video, label: 'CONTENT', accent: 'bg-rose-500' },
};

const TaskCard = ({ task, onClick, projectName, assignee, onUpdateStatus, isSelected, isSelectionMode, onToggleSelect }: any) => {
  const isDone = task.status === TaskStatus.DONE;
  const config = TYPE_CONFIG[task.type as TaskType] || TYPE_CONFIG.admin;
  
  return (
    <div 
      onClick={(e) => {
        if (isSelectionMode) {
          e.stopPropagation();
          onToggleSelect(task.id);
        } else {
          onClick();
        }
      }}
      className={`relative p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 active-scale text-left flex flex-col justify-between min-h-[180px] bg-[#0A0F1E] ${isSelected ? 'border-sky-500 ring-4 ring-sky-500/10' : 'border-white/5'} ${isDone ? 'opacity-50 grayscale hover:opacity-80' : 'cursor-pointer hover:bg-white/[0.02]'}`}
    >
      {isSelectionMode && (
        <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-sky-500 border-sky-500' : 'bg-white/5 border-white/10'}`}>
          {isSelected && <Check size={14} strokeWidth={4} className="text-white" />}
        </div>
      )}

      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${config.accent}`}></div>

      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bg} ${config.color} border border-white/5`}>
          <config.icon size={11} strokeWidth={3} />
          <span className="text-[9px] font-black tracking-widest uppercase">{config.label}</span>
        </div>
        
        {!isSelectionMode && (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-[9px] font-black text-sky-400">
               {assignee?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-1">
        <h4 className="font-bold text-white text-[17px] leading-tight group-hover:text-sky-400 transition-colors">
          {task.title}
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider opacity-60">
          {projectName || 'INTERNE iVISION'}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 px-1">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
          <CalendarIcon size={14} className="text-slate-600" />
          <span>{task.dueDate}</span>
        </div>
        
        {!isSelectionMode && (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onUpdateStatus(task.id, isDone ? TaskStatus.IN_PROGRESS : TaskStatus.DONE); 
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active-scale border ${isDone ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500 hover:text-white' : 'bg-white/5 text-slate-600 border-white/10 hover:bg-emerald-500 hover:text-white hover:border-none'}`}
            title={isDone ? "Réactiver la mission" : "Marquer comme terminé"}
          >
            {isDone ? <RotateCcw size={16} strokeWidth={3} /> : <Check size={16} strokeWidth={4} />}
          </button>
        )}
      </div>
    </div>
  );
};

const Tasks = ({ tasks = [], users, clients = [], projects = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask, onBatchUpdateStatus, onBatchUpdateTasks, onBatchDelete }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'batch_edit'>('list');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '' 
  });

  const [batchFormData, setBatchFormData] = useState<Partial<Task>>({});
  
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c: any) => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map<string, User>(users.map((u: any) => [u.id, u])), [users]);
  const projectMap = useMemo(() => new Map<string, Project>(projects.map((p: any) => [p.id, p])), [projects]);

  const activeTasks = useMemo(() => tasks.filter((t: Task) => t.status !== TaskStatus.DONE), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t: Task) => t.status === TaskStatus.DONE), [tasks]);

  const groupedActiveTasks = useMemo(() => {
    let filtered = activeTasks;
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t: Task) => {
        const taskType = t.type as string;
        if (typeFilter === 'video' && taskType === 'content') return true;
        return taskType === typeFilter;
      });
    }

    const groups: Record<string, Task[]> = {};
    filtered.forEach((t: Task) => {
      const cId = t.clientId || 'internal';
      if (!groups[cId]) groups[cId] = [];
      groups[cId].push(t);
    });
    return groups;
  }, [activeTasks, typeFilter]);

  const currentTask = tasks?.find((t: any) => t.id === selectedTaskId);
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canEditThisTask = isAdmin || currentUser.permissions?.canEditAllTasks || currentTask?.assigneeId === currentUser.id;

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };

  return (
    <div className="relative pb-32">
      <div className="space-y-16 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 px-4">
          <div className="text-left space-y-1">
            <p className="text-[11px] font-black uppercase text-sky-500 tracking-[0.4em]">OPERATIONAL HUB</p>
            <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tight leading-none">Missions</h2>
          </div>
          
          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
             <div className="flex bg-[#0A0F1E] p-1 rounded-full border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
                <button onClick={() => setTypeFilter('all')} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Tous</button>
                {(Object.keys(TYPE_CONFIG) as Array<TaskType>).map(type => {
                  if (type === 'content') return null;
                  const Icon = TYPE_CONFIG[type].icon;
                  return (
                    <button key={type} onClick={() => setTypeFilter(type)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center space-x-2 ${typeFilter === type ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                      <Icon size={12} className={typeFilter === type ? 'text-slate-950' : 'text-slate-600'} />
                      <span>{TYPE_CONFIG[type].label}</span>
                    </button>
                  );
                })}
             </div>
             <div className="flex items-center space-x-4">
                <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedTaskIds([]); }} className={`flex items-center space-x-3 px-8 h-16 rounded-[1.25rem] border font-black uppercase text-[11px] tracking-widest transition-all active-scale ${isSelectionMode ? 'bg-sky-500 text-white border-sky-500' : 'bg-[#0A0F1E] text-slate-400 border-white/5 hover:bg-white/5'}`}>
                  <ListChecks size={20} />
                  <span>{isSelectionMode ? 'ANNULER' : 'SÉLECTION'}</span>
                </button>
                {!isSelectionMode && (
                  <button onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '' }); setViewMode('add'); }} className="w-16 h-16 bg-sky-500 text-white rounded-[1.25rem] shadow-[0_0_30px_rgba(14,165,233,0.3)] active-scale flex items-center justify-center transition-all hover:scale-105"><Plus size={32} strokeWidth={3} /></button>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-24 px-4">
          {(Object.entries(groupedActiveTasks) as [string, Task[]][]).map(([clientId, clientTasks]) => {
            const client = clientMap.get(clientId);
            return (
              <section key={clientId} className="animate-slide-up">
                <div className="flex flex-col text-left mb-10">
                   <div className="flex items-center space-x-8">
                     <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">{clientId === 'internal' ? 'INTERNE iVISION' : client?.name.toUpperCase()}</h3>
                     <div className="hidden md:block h-px bg-white/5 flex-1 mt-4"></div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {clientTasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} isSelectionMode={isSelectionMode} isSelected={selectedTaskIds.includes(task.id)} onToggleSelect={toggleTaskSelection} />
                  ))}
                </div>
              </section>
            );
          })}

          {Object.keys(groupedActiveTasks).length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center glass rounded-[4rem] border-dashed border-2 border-white/5 mx-4">
              <CheckCircle2 size={64} className="text-slate-700 mb-6" />
              <p className="text-[12px] font-black uppercase tracking-[0.5em]">Aucun flux opérationnel détecté</p>
            </div>
          )}

          {/* Archive Section */}
          {completedTasks.length > 0 && (
            <section className="pt-20 border-t border-white/5">
              <button onClick={() => setShowArchived(!showArchived)} className="flex items-center justify-between w-full group mb-10 text-left">
                <div className="flex items-center space-x-6">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10 group-hover:text-emerald-400 transition-colors"><Archive size={28}/></div>
                   <div>
                     <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Missions Terminées</h3>
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-2">{completedTasks.length} ARCHIVÉES</p>
                   </div>
                </div>
                <div className={`w-12 h-12 rounded-xl glass flex items-center justify-center text-slate-500 transition-transform duration-500 ${showArchived ? 'rotate-90 text-emerald-400' : ''}`}><ChevronRight size={24}/></div>
              </button>
              
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} isSelectionMode={isSelectionMode} isSelected={selectedTaskIds.includes(task.id)} onToggleSelect={toggleTaskSelection} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* MODALS & FLOATING BARS (REUSED) */}
      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={() => { setViewMode('list'); setSelectedTaskId(null); }} title={viewMode === 'add' ? 'Indexation Mission' : 'Mise à jour Protocol'}>
        <form onSubmit={(e) => { e.preventDefault(); if (viewMode === 'edit' && formData.id) onUpdateTask(formData); else onAddTask({ ...formData, status: TaskStatus.TODO }); setViewMode('list'); }} className="space-y-8 text-left">
            <div className="space-y-2"><label className="label-iv">Objet de la Mission</label><input required className="input-iv" placeholder="Titre stratégique..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="label-iv">Typologie Flux</label><select className="input-iv appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})}><option value="video">VIDEO CONTENT</option><option value="design">GRAPHIC DESIGN</option><option value="website">WEB DEVELOPMENT</option><option value="ads">ADVERTISING & PERFORMANCE</option><option value="post">SOCIAL POSTING</option><option value="admin">ADMINISTRATION</option></select></div>
              <div className="space-y-2"><label className="label-iv">Timeline / Deadline</label><input type="date" required className="input-iv" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="label-iv">Responsable iV</label><select className="input-iv appearance-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>{users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div className="space-y-2"><label className="label-iv">Projet Architecture</label><select className="input-iv appearance-none cursor-pointer" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}><option value="">INTERNE iVISION</option>{projects.map((p: Project) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="space-y-2"><label className="label-iv">Briefing Technique</label><textarea className="input-iv h-32 resize-none leading-relaxed" placeholder="Détails opérationnels..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <button type="submit" className="w-full py-7 bg-sky-500 text-white font-black rounded-[2.5rem] shadow-2xl active-scale uppercase text-[12px] tracking-[0.3em] mt-4 hover:bg-sky-400 transition-all">{viewMode === 'add' ? 'Déployer la Mission' : 'Sauvegarder'}</button>
         </form>
      </Modal>

      <Modal isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} onClose={() => setSelectedTaskId(null)} title={currentTask?.title}>
        <div className="space-y-10 text-left">
           <div className="flex flex-wrap gap-3">
             <div className={`px-4 py-2 rounded-2xl inline-flex items-center space-x-3 ${TYPE_CONFIG[currentTask?.type as TaskType]?.bg} ${TYPE_CONFIG[currentTask?.type as TaskType]?.color} border ${TYPE_CONFIG[currentTask?.type as TaskType]?.border}`}><span className="text-[11px] font-black tracking-[0.2em] uppercase">{TYPE_CONFIG[currentTask?.type as TaskType]?.label}</span></div>
             <div className="px-4 py-2 rounded-2xl inline-flex items-center space-x-3 bg-white/5 text-slate-400 border border-white/10"><CalendarIcon size={16}/><span className="text-[11px] font-black tracking-[0.1em]">{currentTask?.dueDate}</span></div>
           </div>
           <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5"><h4 className="label-iv mb-5 text-sky-400 uppercase font-black text-[10px]">Briefing Technique</h4><p className="text-[15px] md:text-lg text-slate-300 leading-relaxed font-medium">{currentTask?.description || "Aucun briefing détaillé disponible."}</p></div>
           <div className="flex flex-col gap-4 pt-4">
            {currentTask?.status !== TaskStatus.DONE && canEditThisTask && (
              <button onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); setSelectedTaskId(null); }} className="w-full py-7 bg-emerald-500 text-white font-black rounded-[2rem] shadow-xl uppercase text-[12px] tracking-[0.4em] active-scale flex items-center justify-center space-x-4">MISSION ACCOMPLIE</button>
            )}
            <div className="flex gap-4">
              {canEditThisTask && <button onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} className="flex-1 py-5 bg-white/5 text-white border border-white/10 font-black rounded-3xl uppercase text-[11px] tracking-[0.2em]">Modifier Protocol</button>}
              {(isAdmin || currentUser.permissions?.canDeleteTasks) && <button onClick={() => { if(confirm('Révoquer définitivement ?')) { onDeleteTask(currentTask?.id); setSelectedTaskId(null); } }} className="w-20 py-5 bg-rose-500/10 text-rose-400 font-black rounded-3xl border border-rose-500/10 flex items-center justify-center"><Trash2 size={24} /></button>}
            </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
