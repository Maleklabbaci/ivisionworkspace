
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, CheckCircle2, History, Check, Sparkles, Briefcase, Trash2, Video, Palette, Globe, Megaphone, Send, Layers, Filter, ChevronDown, ChevronUp, MousePointer2, ListChecks, Square, Edit2, User as UserIcon, AlertTriangle } from 'lucide-react';
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

const TaskCard = ({ task, onClick, projectName, assignee, onComplete, isSelected, isSelectionMode, onToggleSelect }: any) => {
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
      className={`relative p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 active-scale text-left flex flex-col justify-between min-h-[180px] bg-[#0A0F1E] ${isSelected ? 'border-sky-500 ring-4 ring-sky-500/10' : 'border-white/5'} ${isDone ? 'opacity-40 grayscale' : 'cursor-pointer hover:bg-white/[0.02]'}`}
    >
      {/* Selection Overlay */}
      {isSelectionMode && (
        <div className={`absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-sky-500 border-sky-500' : 'bg-white/5 border-white/10'}`}>
          {isSelected && <Check size={14} strokeWidth={4} className="text-white" />}
        </div>
      )}

      {/* Left Accent Bar */}
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${config.accent}`}></div>

      {/* Top Row: Type & Assignee */}
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
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#0A0F1E] translate-x-1/4 -translate-y-1/4 shadow-sm"></div>
          </div>
        )}
      </div>

      {/* Middle Row: Title & Subtitle */}
      <div className="flex-1 px-1">
        <h4 className="font-bold text-white text-[17px] leading-tight group-hover:text-sky-400 transition-colors">
          {task.title}
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-wider opacity-60">
          {projectName || 'INTERNE iVISION'}
        </p>
      </div>
      
      {/* Bottom Row: Date & Action */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 px-1">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
          <CalendarIcon size={14} className="text-slate-600" />
          <span>{task.dueDate}</span>
        </div>
        
        {!isSelectionMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active-scale border ${isDone ? 'bg-emerald-500 text-white border-none' : 'bg-white/5 text-slate-600 border-white/10 hover:bg-emerald-500 hover:text-white hover:border-none'}`}
          >
            <Check size={16} strokeWidth={4} />
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
  
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '' 
  });

  const [batchFormData, setBatchFormData] = useState<Partial<Task>>({});
  
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c: any) => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map<string, User>(users.map((u: any) => [u.id, u])), [users]);
  const projectMap = useMemo(() => new Map<string, Project>(projects.map((p: any) => [p.id, p])), [projects]);

  const groupedTasks = useMemo(() => {
    let filtered = (tasks || []).filter((t: Task) => t.status !== TaskStatus.DONE);
    
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
  }, [tasks, typeFilter]);

  const currentTask = tasks?.find((t: any) => t.id === selectedTaskId);
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canEditThisTask = isAdmin || currentUser.permissions?.canEditAllTasks || currentTask?.assigneeId === currentUser.id;

  const closeModals = () => { setViewMode('list'); setSelectedTaskId(null); };

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBatchUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onBatchUpdateTasks && selectedTaskIds.length > 0) {
      onBatchUpdateTasks(selectedTaskIds, batchFormData);
      setIsSelectionMode(false);
      setSelectedTaskIds([]);
      setViewMode('list');
    }
  };

  return (
    <div className="relative pb-32">
      <div className="space-y-16 animate-fade-in">
        {/* Header exact design */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 px-4">
          <div className="text-left space-y-1">
            <p className="text-[11px] font-black uppercase text-sky-500 tracking-[0.4em]">OPERATIONAL HUB</p>
            <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tight leading-none">Missions</h2>
          </div>
          
          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
             {/* Pill Filter Bar */}
             <div className="flex bg-[#0A0F1E] p-1 rounded-full border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setTypeFilter('all')}
                  className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  Tous
                </button>
                {(Object.keys(TYPE_CONFIG) as Array<TaskType>).map(type => {
                  if (type === 'content') return null;
                  const Icon = TYPE_CONFIG[type].icon;
                  return (
                    <button 
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center space-x-2 ${typeFilter === type ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Icon size={12} className={typeFilter === type ? 'text-slate-950' : 'text-slate-600'} />
                      <span>{TYPE_CONFIG[type].label}</span>
                    </button>
                  );
                })}
             </div>

             <div className="flex items-center space-x-4">
                <button 
                  onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedTaskIds([]); }}
                  className={`flex items-center space-x-3 px-8 h-16 rounded-[1.25rem] border font-black uppercase text-[11px] tracking-widest transition-all active-scale ${isSelectionMode ? 'bg-sky-500 text-white border-sky-500' : 'bg-[#0A0F1E] text-slate-400 border-white/5 hover:bg-white/5'}`}
                >
                  <ListChecks size={20} />
                  <span>{isSelectionMode ? 'ANNULER' : 'SÉLECTION'}</span>
                </button>

                {!isSelectionMode && (
                  <button 
                    onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '' }); setViewMode('add'); }} 
                    className="w-16 h-16 bg-sky-500 text-white rounded-[1.25rem] shadow-[0_0_30px_rgba(14,165,233,0.3)] active-scale flex items-center justify-center transition-all hover:scale-105"
                  >
                    <Plus size={32} strokeWidth={3} />
                  </button>
                )}
             </div>
          </div>
        </div>

        {/* Client Groups Design */}
        <div className="space-y-24 px-4">
          {Object.entries(groupedTasks).map(([clientId, clientTasks]) => {
            const client = clientMap.get(clientId);
            return (
              <section key={clientId} className="animate-slide-up">
                <div className="flex flex-col text-left mb-10">
                   <div className="flex items-center space-x-8">
                     <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                       {clientId === 'internal' ? 'INTERNE iVISION' : client?.name.toUpperCase()}
                     </h3>
                     <div className="hidden md:block h-px bg-white/5 flex-1 mt-4"></div>
                   </div>
                   <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        <span className="text-[11px] text-sky-500 font-black uppercase tracking-[0.2em]">{clientTasks.length} ACTIVES</span>
                      </div>
                      <span className="text-slate-700 font-black">•</span>
                      <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">{client?.company?.toUpperCase() || 'CRYSTAL CORE'}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {clientTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => setSelectedTaskId(task.id)}
                      projectName={projectMap.get(task.projectId || '')?.name}
                      assignee={userMap.get(task.assigneeId)}
                      onComplete={(id: string) => onUpdateStatus(id, TaskStatus.DONE)}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onToggleSelect={toggleTaskSelection}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {Object.keys(groupedTasks).length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center opacity-20 text-center glass rounded-[4rem] border-dashed border-2 border-white/5 mx-4">
              <CheckCircle2 size={64} className="text-slate-700 mb-6" />
              <p className="text-[12px] font-black uppercase tracking-[0.5em]">Aucun flux opérationnel détecté</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {isSelectionMode && selectedTaskIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-4xl animate-crystalPop">
          <div className="bg-[#0A0F1E]/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border-2 border-sky-500/30 shadow-[0_30px_70px_rgba(0,0,0,0.6)] flex items-center justify-between gap-6">
             <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <span className="text-2xl font-black">{selectedTaskIds.length}</span>
                </div>
                <div className="text-left hidden sm:block">
                   <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none">Flux Sélectionné</h4>
                   <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mt-2">Moteur de modification iVISION</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setBatchFormData({}); setViewMode('batch_edit'); }}
                  className="px-6 py-5 bg-white text-slate-950 font-black rounded-2xl uppercase text-[10px] tracking-widest active-scale flex items-center space-x-3 shadow-xl hover:bg-sky-400 hover:text-white transition-all"
                >
                  <Edit2 size={18} strokeWidth={3} />
                  <span className="hidden sm:inline">MODIFIER</span>
                </button>
                <button 
                  onClick={() => { if(onBatchUpdateStatus) onBatchUpdateStatus(selectedTaskIds, TaskStatus.DONE); setIsSelectionMode(false); setSelectedTaskIds([]); }}
                  className="px-6 py-5 bg-emerald-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest active-scale flex items-center space-x-3 shadow-xl hover:bg-emerald-400 transition-all"
                >
                  <Check size={18} strokeWidth={3} />
                  <span className="hidden sm:inline">TERMINER</span>
                </button>
                <button 
                  onClick={() => { if(confirm('Révoquer ce lot ?')) { onBatchDelete(selectedTaskIds); setIsSelectionMode(false); setSelectedTaskIds([]); } }}
                  className="w-14 h-14 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center active-scale hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 size={24} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Multi-Modification */}
      <Modal isOpen={viewMode === 'batch_edit'} onClose={() => setViewMode('list')} title="Mise à jour Protocol" subtitle={`Modification groupée de ${selectedTaskIds.length} missions`}>
        <form onSubmit={handleBatchUpdateSubmit} className="space-y-8 text-left">
           <div className="p-6 bg-sky-400/5 rounded-[2rem] border border-sky-400/10 flex items-center space-x-4">
              <AlertTriangle className="text-sky-400" size={24}/>
              <p className="text-[11px] font-bold text-slate-300 uppercase leading-relaxed">Les modifications seront appliquées instantanément à tout le lot sélectionné.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-iv">Nouvelle Timeline</label>
                <input type="date" className="input-iv" onChange={e => setBatchFormData({...batchFormData, dueDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="label-iv">Nouveau Responsable iV</label>
                <select className="input-iv appearance-none cursor-pointer" onChange={e => setBatchFormData({...batchFormData, assigneeId: e.target.value})}>
                   <option value="">Conserver les responsables actuels</option>
                   {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-iv">Typologie de Flux</label>
                <select className="input-iv appearance-none cursor-pointer" onChange={e => setBatchFormData({...batchFormData, type: e.target.value as TaskType})}>
                  <option value="">Conserver la typologie</option>
                  <option value="video">VIDEO CONTENT</option>
                  <option value="design">GRAPHIC DESIGN</option>
                  <option value="website">WEB DEVELOPMENT</option>
                  <option value="ads">ADVERTISING & ADS</option>
                  <option value="post">SOCIAL POSTING</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Niveau de Priorité</label>
                <select className="input-iv appearance-none cursor-pointer" onChange={e => setBatchFormData({...batchFormData, priority: e.target.value as any})}>
                  <option value="">Conserver la priorité actuelle</option>
                  <option value="low">BASSE</option>
                  <option value="medium">MOYENNE</option>
                  <option value="high">HAUTE / CRITIQUE</option>
                </select>
              </div>
           </div>

           <button type="submit" className="w-full py-7 bg-sky-500 text-white font-black rounded-[2rem] shadow-2xl active-scale uppercase text-[12px] tracking-[0.4em] transition-all hover:bg-sky-400">
              DÉPLOYER LES MODIFICATIONS
           </button>
        </form>
      </Modal>

      {/* Modal Add Mission */}
      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={closeModals} title={viewMode === 'add' ? 'Indexation Mission' : 'Mise à jour Protocol'}>
        <form onSubmit={(e) => { e.preventDefault(); if (viewMode === 'edit' && formData.id) onUpdateTask(formData); else onAddTask({ ...formData, status: TaskStatus.TODO }); closeModals(); }} className="space-y-8 text-left">
            <div className="space-y-2">
              <label className="label-iv">Objet de la Mission</label>
              <input required className="input-iv" placeholder="Titre stratégique..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-iv">Typologie Flux</label>
                <select className="input-iv appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})}>
                  <option value="video">VIDEO CONTENT</option>
                  <option value="design">GRAPHIC DESIGN</option>
                  <option value="website">WEB DEVELOPMENT</option>
                  <option value="ads">ADVERTISING & PERFORMANCE</option>
                  <option value="post">SOCIAL POSTING</option>
                  <option value="admin">ADMINISTRATION</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Timeline / Deadline</label>
                <input type="date" required className="input-iv" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-iv">Responsable iV</label>
                <select className="input-iv appearance-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>{users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Partenaire CRM</label>
                <select className="input-iv appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}><option value="">INTERNE iVISION</option>{clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-iv">Briefing Technique</label>
              <textarea className="input-iv h-32 resize-none leading-relaxed" placeholder="Détails opérationnels..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            
            <button type="submit" className="w-full py-7 bg-sky-500 text-white font-black rounded-[2.5rem] shadow-2xl active-scale uppercase text-[12px] tracking-[0.3em] mt-4 hover:bg-sky-400 transition-all">
              {viewMode === 'add' ? 'Déployer la Mission' : 'Sauvegarder'}
            </button>
         </form>
      </Modal>

      {/* Modal View Detail */}
      <Modal isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} onClose={closeModals} title={currentTask?.title}>
        <div className="space-y-10 text-left">
           <div className="flex flex-wrap gap-3">
             <div className={`px-4 py-2 rounded-2xl inline-flex items-center space-x-3 ${TYPE_CONFIG[currentTask?.type as TaskType]?.bg} ${TYPE_CONFIG[currentTask?.type as TaskType]?.color} border ${TYPE_CONFIG[currentTask?.type as TaskType]?.border}`}>
                {React.createElement(TYPE_CONFIG[currentTask?.type as TaskType]?.icon || Layers, { size: 16, strokeWidth: 3 })}
                <span className="text-[11px] font-black tracking-[0.2em] uppercase">{TYPE_CONFIG[currentTask?.type as TaskType]?.label}</span>
             </div>
             <div className="px-4 py-2 rounded-2xl inline-flex items-center space-x-3 bg-white/5 text-slate-400 border border-white/10">
                <CalendarIcon size={16} strokeWidth={3} />
                <span className="text-[11px] font-black tracking-[0.1em]">{currentTask?.dueDate}</span>
             </div>
           </div>

           <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 text-left">
             <h4 className="label-iv mb-5 text-sky-400 flex items-center uppercase font-black text-[10px] tracking-widest">Briefing Technique</h4>
             <p className="text-[15px] md:text-lg text-slate-300 leading-relaxed font-medium">
               {currentTask?.description || "Aucun briefing détaillé disponible pour cette mission."}
             </p>
           </div>
           
           <div className="flex flex-col gap-4 pt-4">
            {currentTask?.status !== TaskStatus.DONE && canEditThisTask && (
              <button 
                onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); closeModals(); }} 
                className="w-full py-7 bg-emerald-500 text-white font-black rounded-[2rem] shadow-xl uppercase text-[12px] tracking-[0.4em] active-scale flex items-center justify-center space-x-4 transition-all hover:bg-emerald-400"
              >
                <Check size={24} strokeWidth={4} />
                <span>MISSION ACCOMPLIE</span>
              </button>
            )}

            <div className="flex gap-4">
              {canEditThisTask && (
                <button 
                  onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} 
                  className="flex-1 py-5 bg-white/5 text-white border border-white/10 font-black rounded-3xl uppercase text-[11px] tracking-[0.2em] active-scale hover:bg-white/10 transition-all"
                >
                  Modifier Protocol
                </button>
              )}
              {(isAdmin || currentUser.permissions?.canDeleteTasks) && (
                <button 
                  onClick={() => { if(confirm('Révoquer définitivement cette mission ?')) { onDeleteTask(currentTask?.id); closeModals(); } }} 
                  className="w-20 py-5 bg-rose-500/10 text-rose-500 font-black rounded-3xl border border-rose-500/10 active-scale flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
