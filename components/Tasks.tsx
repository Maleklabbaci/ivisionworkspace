
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, CheckCircle2, RotateCcw, Check, Sparkles, Briefcase, Trash2, Video, Palette, Globe, Megaphone, Send, Layers, Filter, ChevronDown, ChevronUp, MousePointer2, ListChecks, Square, Edit2, User as UserIcon, AlertTriangle, Archive, ChevronRight, Zap } from 'lucide-react';
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
  const isBlocked = task.status === TaskStatus.BLOCKED;
  const isUrgent = task.priority === 'high' && !isDone;
  const config = TYPE_CONFIG[task.type as TaskType] || TYPE_CONFIG.admin;
  
  return (
    <div 
      onClick={() => isSelectionMode ? onToggleSelect(task.id) : onClick()}
      className={`relative p-6 rounded-[1.5rem] border transition-all duration-500 ${
        isBlocked ? 'border-rose-500 bg-rose-500/10 animate-pulse-subtle shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 
        isUrgent ? 'border-amber-500 bg-amber-500/5 animate-pulse-subtle shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 
        'border-white/5 bg-[#0A0F1E]'
      } ${isDone ? 'opacity-50 grayscale' : 'cursor-pointer hover:bg-white/[0.04]'} ${isSelected ? 'ring-4 ring-sky-500/20' : ''}`}
    >
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${isBlocked ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : isUrgent ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : config.accent}`}></div>

      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          isBlocked ? 'bg-rose-500 text-white' : 
          isUrgent ? 'bg-amber-500 text-slate-950' :
          config.bg + ' ' + config.color
        } border border-white/5 shadow-sm`}>
          {isBlocked ? <AlertTriangle size={11} strokeWidth={3} /> : isUrgent ? <Zap size={11} strokeWidth={3}/> : <config.icon size={11} strokeWidth={3} />}
          <span className="text-[9px] font-black tracking-widest uppercase">{isBlocked ? 'BLOQUÉ' : isUrgent ? 'URGENT' : config.label}</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-black text-slate-400">
           {assignee?.name?.substring(0, 2).toUpperCase() || 'AD'}
        </div>
      </div>

      <div className="text-left">
        <h4 className={`font-bold text-[17px] leading-tight transition-colors ${isBlocked ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-white'}`}>{task.title}</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider opacity-60 truncate">{projectName || 'INTERNE iVISION'}</p>
      </div>
      
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
        <div className={`flex items-center space-x-2 text-[11px] font-bold uppercase tracking-tight ${isUrgent ? 'text-amber-500' : 'text-slate-500'}`}>
          <CalendarIcon size={14} />
          <span>{task.dueDate}</span>
        </div>
        {!isSelectionMode && (
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, isDone ? TaskStatus.IN_PROGRESS : TaskStatus.DONE); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active-scale ${isDone ? 'bg-sky-500 text-white shadow-lg' : 'bg-white/5 text-slate-600 hover:bg-emerald-500 hover:text-white border border-white/10'}`}>
            {isDone ? <RotateCcw size={16} strokeWidth={3} /> : <Check size={18} strokeWidth={4} />}
          </button>
        )}
      </div>
    </div>
  );
};

const Tasks = ({ tasks = [], users = [], clients = [], projects = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '', status: TaskStatus.TODO
  });

  // Added explicit casting to avoid 'unknown' type errors when map is called on destructured props
  const clientMap = useMemo(() => new Map<string, Client>((clients as any[]).map((c: any) => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map<string, User>((users as any[]).map((u: any) => [u.id, u])), [users]);
  const projectMap = useMemo(() => new Map<string, Project>((projects as any[]).map((p: any) => [p.id, p])), [projects]);

  const groupedActiveTasks = useMemo(() => {
    const active = tasks.filter((t: Task) => t.status !== TaskStatus.DONE);
    const filtered = typeFilter === 'all' ? active : active.filter(t => t.type === typeFilter);
    const groups: Record<string, Task[]> = {};
    filtered.forEach(t => { const id = t.clientId || 'internal'; if (!groups[id]) groups[id] = []; groups[id].push(t); });
    return groups;
  }, [tasks, typeFilter]);

  const currentTask = tasks?.find((t: any) => t.id === selectedTaskId);

  return (
    <div className="relative pb-32">
      <div className="space-y-16 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 px-4">
          <div className="text-left space-y-2"><p className="text-[11px] font-black uppercase text-sky-500 tracking-[0.4em]">OPERATIONAL HUB</p><h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tight leading-none">Missions</h2></div>
          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
             <div className="flex bg-[#0A0F1E] p-1.5 rounded-full border border-white/10 w-full overflow-x-auto no-scrollbar shadow-inner">
                <button onClick={() => setTypeFilter('all')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all ${typeFilter === 'all' ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-white'}`}>Tous</button>
                {(Object.keys(TYPE_CONFIG) as Array<TaskType>).map(type => (
                  <button key={type} onClick={() => setTypeFilter(type)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all flex items-center space-x-2 ${typeFilter === type ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-white'}`}>
                    <span>{TYPE_CONFIG[type].label}</span>
                  </button>
                ))}
             </div>
             <button onClick={() => setViewMode('add')} className="w-16 h-16 bg-sky-500 text-white rounded-[1.5rem] shadow-2xl active-scale flex items-center justify-center hover:scale-105 hover:bg-sky-400 transition-all"><Plus size={36} strokeWidth={3} /></button>
          </div>
        </div>

        <div className="space-y-24 px-4">
          {Object.entries(groupedActiveTasks).map(([clientId, clientTasks]) => (
              <section key={clientId} className="animate-slide-up">
                <div className="flex flex-col text-left mb-12"><div className="flex items-center space-x-10"><h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">{clientId === 'internal' ? 'INTERNE iVISION' : clientMap.get(clientId)?.name.toUpperCase()}</h3><div className="h-px bg-white/5 flex-1 mt-4"></div></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {clientTasks.map(task => (<TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} />))}
                </div>
              </section>
          ))}
          
          {tasks.filter(t => t.status === TaskStatus.DONE).length > 0 && (
            <section className="pt-24 border-t border-white/5">
              <button onClick={() => setShowArchived(!showArchived)} className="flex items-center justify-between w-full group mb-12 text-left">
                <div className="flex items-center space-x-8"><div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 border border-white/10 group-hover:text-emerald-400 transition-all shadow-inner"><Archive size={36}/></div><div><h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Archives</h3><p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-3">MISSIONS TERMINÉES</p></div></div>
                <div className={`w-14 h-14 rounded-2xl glass flex items-center justify-center text-slate-500 transition-all duration-500 ${showArchived ? 'rotate-90 text-emerald-400 shadow-emerald-500/10' : ''}`}><ChevronRight size={28}/></div>
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
                  {tasks.filter(t => t.status === TaskStatus.DONE).map(task => (<TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} />))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={() => { setViewMode('list'); setSelectedTaskId(null); }} title={viewMode === 'add' ? 'Indexation Mission' : 'Mise à jour Protocol'}>
        <form onSubmit={(e) => { e.preventDefault(); if (viewMode === 'edit') onUpdateTask(formData); else onAddTask(formData); setViewMode('list'); }} className="space-y-8 text-left p-2">
            <div><label className="label-iv">Objet Stratégique</label><input required className="input-iv" placeholder="Titre de la mission..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="label-iv">Typologie Flux</label><select className="input-iv appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})}><option value="video">VIDEO CONTENT</option><option value="design">GRAPHIC DESIGN</option><option value="website">WEB DEVELOPMENT</option><option value="ads">ADVERTISING & PERFORMANCE</option></select></div>
              <div><label className="label-iv">Statut Opérationnel</label><select className="input-iv appearance-none cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value={TaskStatus.TODO}>À FAIRE</option><option value={TaskStatus.IN_PROGRESS}>EN COURS</option><option value={TaskStatus.BLOCKED}>BLOQUÉ</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="label-iv">Responsable iV</label><select className="input-iv appearance-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>{users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label className="label-iv">Deadline</label><input type="date" required className="input-iv" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
            </div>
            <div><label className="label-iv">Spécificités Techniques</label><textarea className="input-iv h-40 resize-none leading-relaxed" placeholder="Détails de production..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <button type="submit" className="w-full py-8 bg-sky-500 text-white font-black rounded-[2rem] uppercase text-[12px] tracking-[0.3em] active-scale shadow-2xl shadow-sky-500/20 transition-all hover:bg-sky-400">Déployer Mission</button>
         </form>
      </Modal>

      <Modal isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} onClose={() => setSelectedTaskId(null)} title={currentTask?.title}>
        <div className="space-y-12 text-left p-2">
           <div className={`p-10 rounded-[3rem] border shadow-inner ${currentTask?.status === TaskStatus.BLOCKED ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5'}`}><h4 className="label-iv mb-6 opacity-40">Détails Opérationnels</h4><p className="text-[17px] text-slate-200 leading-relaxed font-medium">{currentTask?.description || "Aucun briefing disponible."}</p></div>
           <div className="flex flex-col gap-5">
            {currentTask?.status !== TaskStatus.DONE && <button onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); setSelectedTaskId(null); }} className="w-full py-8 bg-emerald-500 text-slate-950 font-black rounded-[2rem] uppercase text-[12px] tracking-widest active-scale shadow-2xl shadow-emerald-500/20">MARQUER COMME TERMINÉ</button>}
            <div className="flex gap-4">
              <button onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} className="flex-1 py-6 glass text-white font-black rounded-[2rem] border border-white/10 uppercase text-[11px] tracking-widest active-scale">Éditer Dossier</button>
              <button onClick={() => { if(confirm('Révoquer définitivement cette mission ?')) { onDeleteTask(currentTask?.id); setSelectedTaskId(null); } }} className="w-20 py-6 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-[2rem] flex items-center justify-center active-scale transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={28}/></button>
            </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
