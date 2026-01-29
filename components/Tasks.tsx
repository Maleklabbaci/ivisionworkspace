
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, CheckCircle2, RotateCcw, Check, Trash2, Video, Palette, Globe, Megaphone, Send, Layers, ChevronRight, Zap, HelpCircle, CheckSquare, Save, User as UserIcon, ListChecks, Filter, Eye, EyeOff, AlertCircle, AlertTriangle, Search } from 'lucide-react';
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
      className={`relative p-5 rounded-[1.75rem] border transition-all duration-300 ${
        isBlocked ? 'border-rose-500 bg-rose-600/10 ring-4 ring-rose-500/20 animate-pulse-subtle shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 
        isUrgent ? 'animate-urgent-glow border-amber-500 bg-amber-500/5' : 
        'border-white/5 bg-[#0A0F1E]/60'
      } ${isDone ? 'opacity-40 grayscale-[0.6]' : 'active:bg-white/[0.08] cursor-pointer'} ${isSelected ? 'ring-4 ring-sky-500/40 border-sky-400 bg-sky-500/10' : ''}`}
    >
      {isSelectionMode && (
        <div className={`absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' : 'bg-white/5 border-white/10 text-transparent'}`}>
           <Check size={16} strokeWidth={4} />
        </div>
      )}

      <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full ${isBlocked ? 'bg-rose-500 shadow-[0_0_20px_#f43f5e]' : isUrgent ? 'bg-amber-500 shadow-[0_0_20px_#f59e0b]' : config.accent}`}></div>

      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full ${
          isBlocked ? 'bg-rose-500 text-white font-black' : 
          isUrgent ? 'bg-amber-500 text-slate-950 font-black' :
          config.bg + ' ' + config.color
        } border border-white/5`}>
          {isBlocked ? <AlertTriangle size={10} strokeWidth={4} /> : isUrgent ? <Zap size={10} strokeWidth={3} fill="currentColor" /> : <config.icon size={10} strokeWidth={3} />}
          <span className="text-[8px] font-black tracking-[0.1em] uppercase">{isBlocked ? 'ALERTE ROUGE' : isUrgent ? 'PRIORITÉ HAUTE' : config.label}</span>
        </div>
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[9px] font-black text-slate-400 border border-white/5 uppercase">
           {assignee?.name?.substring(0, 2) || 'iV'}
        </div>
      </div>

      <div className="text-left pr-4">
        <h4 className={`font-black text-[15px] leading-tight transition-colors ${isBlocked ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-white'}`}>{task.title}</h4>
        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1.5 tracking-widest truncate">{projectName || 'Interne'}</p>
      </div>
      
      {!isSelectionMode && (
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/5">
          <div className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-tight ${isBlocked ? 'text-rose-500' : isUrgent ? 'text-amber-500 font-black' : 'text-slate-600'}`}>
            <CalendarIcon size={12} />
            <span>{task.dueDate}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, isDone ? TaskStatus.IN_PROGRESS : TaskStatus.DONE); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active-scale ${isDone ? 'bg-emerald-500 text-white shadow-lg' : isBlocked ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/5 text-slate-600 hover:text-white border border-white/10'}`}>
            {isDone ? <RotateCcw size={16} strokeWidth={3} /> : <Check size={18} strokeWidth={4} />}
          </button>
        </div>
      )}
    </div>
  );
};

const Tasks = ({ tasks = [], users = [], clients = [], projects = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onBulkUpdateTasks, onDeleteTask }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'bulk'>('list');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [personalViewOnly, setPersonalViewOnly] = useState(!currentUser.permissions?.canViewAllTasks);
  
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '', status: TaskStatus.TODO
  });

  const [bulkData, setBulkData] = useState<any>({ status: '', priority: '', assigneeId: '', type: '', dueDate: '', projectId: '', clientId: '' });

  const userMap = useMemo(() => new Map<string, User>((users as any[]).map((u: any) => [u.id, u])), [users]);
  const clientMap = useMemo(() => new Map<string, Client>((clients as any[]).map((c: any) => [c.id, c])), [clients]);
  const projectMap = useMemo(() => new Map<string, Project>((projects as any[]).map((p: any) => [p.id, p])), [projects]);

  const canSwitchView = !!currentUser.permissions?.canViewAllTasks || currentUser.role === UserRole.ADMIN;

  const filteredTasksBase = useMemo(() => {
    let base = tasks;
    
    // Filtre Vue Personnelle
    if (personalViewOnly) {
      base = base.filter((t: Task) => t.assigneeId === currentUser.id);
    }
    
    // Barre de recherche globale (Titre, Description, Responsable)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      base = base.filter((t: Task) => {
        const assignee = userMap.get(t.assigneeId);
        return (
          t.title.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch) ||
          (assignee && assignee.name.toLowerCase().includes(lowerSearch))
        );
      });
    }
    
    return base;
  }, [tasks, personalViewOnly, currentUser.id, searchTerm, userMap]);

  const groupedActiveTasks = useMemo(() => {
    const active = filteredTasksBase.filter((t: Task) => t.status !== TaskStatus.DONE);
    const filtered = typeFilter === 'all' ? active : active.filter(t => t.type === typeFilter);
    const groups: Record<string, Task[]> = {};
    filtered.forEach(t => { const id = t.clientId || 'internal'; if (!groups[id]) groups[id] = []; groups[id].push(t); });
    return groups;
  }, [filteredTasksBase, typeFilter]);

  const toggleSelect = (id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };

  const applyBulkEdit = () => {
    const updates: any = {};
    Object.keys(bulkData).forEach(key => { if (bulkData[key]) updates[key] = bulkData[key]; });
    if (Object.keys(updates).length > 0) onBulkUpdateTasks(selectedTaskIds, updates);
    setSelectedTaskIds([]);
    setIsSelectionMode(false);
    setViewMode('list');
    setBulkData({ status: '', priority: '', assigneeId: '', type: '', dueDate: '', projectId: '', clientId: '' });
  };

  const applyBulkDelete = () => {
    if (confirm(`Révoquer ${selectedTaskIds.length} missions ?`)) {
      selectedTaskIds.forEach(id => onDeleteTask(id));
      setSelectedTaskIds([]);
      setIsSelectionMode(false);
    }
  };

  const currentTask = tasks?.find((t: any) => t.id === selectedTaskId);

  return (
    <div className="relative pb-40">
      <div className="space-y-10 animate-fade-in px-1">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2">
          <div className="text-left space-y-4">
              <p className="text-[10px] font-black uppercase text-sky-400 tracking-[0.4em] leading-none">OPERATION COMMAND</p>
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight leading-none">Missions</h2>
              
              {canSwitchView && (
                <button 
                  onClick={() => setPersonalViewOnly(!personalViewOnly)}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-all active-scale ${personalViewOnly ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 'bg-sky-400/10 border-sky-400/20 text-sky-400'}`}
                >
                  {personalViewOnly ? <EyeOff size={16}/> : <Eye size={16}/>}
                  <span className="text-[10px] font-black uppercase tracking-widest">{personalViewOnly ? 'Mes Missions Uniquement' : 'Vue Globale Active'}</span>
                </button>
              )}
          </div>

          <div className="flex flex-col items-end gap-5 w-full md:w-auto">
             <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-end">
                <div className="relative group w-full sm:w-80">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="TITRE, RESPONSABLE..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-400 transition-all placeholder-slate-700" 
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedTaskIds([]); }} 
                    className={`h-14 px-6 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center space-x-3 shadow-2xl ${isSelectionMode ? 'bg-sky-500 text-white' : 'glass text-slate-500'}`}
                  >
                    {isSelectionMode ? <X size={20}/> : <CheckSquare size={20}/>}
                    <span className="hidden sm:inline">{isSelectionMode ? 'Annuler' : 'Sélection Lot'}</span>
                  </button>
                  <button onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'video', status: TaskStatus.TODO }); setViewMode('add'); }} className="w-14 h-14 bg-sky-500 text-white rounded-2xl shadow-xl active-scale flex items-center justify-center transition-transform hover:scale-105">
                    <Plus size={32} strokeWidth={3} />
                  </button>
                </div>
             </div>
             
             <div className="flex bg-slate-950/40 p-1.5 rounded-full border border-white/5 w-full overflow-x-auto no-scrollbar shadow-inner backdrop-blur-xl">
                <button onClick={() => setTypeFilter('all')} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>Tous</button>
                {(Object.keys(TYPE_CONFIG) as Array<TaskType>).map(type => (
                  <button key={type} onClick={() => setTypeFilter(type)} className={`px-5 py-3 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === type ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>
                    <span>{TYPE_CONFIG[type].label}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-16 px-1">
          {(Object.entries(groupedActiveTasks) as any[]).map(([clientId, clientTasks]) => (
              <section key={clientId} className="animate-slide-up text-left">
                <div className="flex items-center space-x-4 mb-6">
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter truncate">{clientId === 'internal' ? 'INTERNE' : clientMap.get(clientId)?.name.toUpperCase()}</h3>
                   <div className="h-px bg-white/5 flex-1"></div>
                   <span className="text-[10px] font-black text-slate-700 uppercase">{(clientTasks as any[]).length} Flux</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {(clientTasks as any[]).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => { setSelectedTaskId(task.id); setViewMode('list'); }} 
                      isSelected={selectedTaskIds.includes(task.id)} 
                      isSelectionMode={isSelectionMode} 
                      onToggleSelect={toggleSelect} 
                      projectName={projectMap.get(task.projectId || '')?.name} 
                      assignee={userMap.get(task.assigneeId)} 
                      onUpdateStatus={onUpdateStatus} 
                    />
                  ))}
                </div>
              </section>
          ))}

          {Object.keys(groupedActiveTasks).length === 0 && searchTerm && (
            <div className="py-20 glass rounded-[3rem] border-dashed border-2 border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
              <Search size={40} className="mb-4 text-slate-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucun résultat pour "{searchTerm}"</p>
            </div>
          )}
          
          {filteredTasksBase.filter(t => t.status === TaskStatus.DONE).length > 0 && (
            <section className="pt-16 border-t border-white/5">
              <button onClick={() => setShowArchived(!showArchived)} className="flex items-center justify-between w-full group mb-8 text-left px-2">
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-slate-600 border border-white/5 group-hover:text-emerald-400 transition-all shadow-inner"><RotateCcw size={28}/></div>
                  <div><h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Archives</h3><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">Missions Terminées</p></div>
                </div>
                <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 transition-all duration-500 ${showArchived ? 'rotate-90 text-emerald-400 shadow-emerald-500/10' : ''}`}><ChevronRight size={20}/></div>
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                  {filteredTasksBase.filter(t => t.status === TaskStatus.DONE).map(task => (<TaskCard key={task.id} task={task} onClick={() => { setSelectedTaskId(task.id); setViewMode('list'); }} isSelected={selectedTaskIds.includes(task.id)} isSelectionMode={isSelectionMode} onToggleSelect={toggleSelect} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} />))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* CONSOLE D'ACTION MOBILE */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] w-[94%] max-w-2xl bg-slate-900 border border-sky-500/40 rounded-[2.5rem] p-4 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-slide-up backdrop-blur-3xl ring-8 ring-slate-950/50">
           <div className="flex items-center space-x-4 pl-4">
             <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-sky-500/20">{selectedTaskIds.length}</div>
             <p className="hidden sm:block text-[10px] font-black text-white uppercase tracking-widest leading-none">Cibles<br/>Sélectionnées</p>
           </div>
           <div className="flex items-center space-x-2">
             <button onClick={() => setViewMode('bulk')} className="px-7 py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase active-scale shadow-xl hover:bg-sky-400 hover:text-white transition-all">MODIFIER LOT</button>
             <button onClick={applyBulkDelete} className="w-14 h-14 glass text-rose-500 rounded-2xl flex items-center justify-center active-scale border border-rose-500/10 hover:bg-rose-500/10"><Trash2 size={24}/></button>
             <button onClick={() => { setSelectedTaskIds([]); setIsSelectionMode(false); }} className="w-14 h-14 glass text-slate-500 rounded-2xl flex items-center justify-center active-scale"><X size={24}/></button>
           </div>
        </div>
      )}

      {/* MODAL MODIFICATION COLLECTIVE */}
      <Modal isOpen={viewMode === 'bulk'} onClose={() => setViewMode('list')} title="Mise à jour Lot" subtitle={`Réglage global de ${selectedTaskIds.length} missions`}>
         <div className="space-y-8 text-left p-1">
            <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-start space-x-4">
               <div className="w-10 h-10 rounded-2xl bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0"><HelpCircle size={20}/></div>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Les champs vides ne seront pas modifiés. L'ordre sera propagé instantanément.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="label-iv">Nouveau Statut</label>
                <select className="input-iv" value={bulkData.status} onChange={e => setBulkData({...bulkData, status: e.target.value})}>
                  <option value="">-- Conserver l'état --</option>
                  <option value={TaskStatus.TODO}>À FAIRE</option>
                  <option value={TaskStatus.IN_PROGRESS}>EN COURS</option>
                  <option value={TaskStatus.BLOCKED}>BLOQUÉ</option>
                  <option value={TaskStatus.DONE}>TERMINÉ</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Niveau Priorité</label>
                <select className="input-iv" value={bulkData.priority} onChange={e => setBulkData({...bulkData, priority: e.target.value})}>
                  <option value="">-- Conserver priorité --</option>
                  <option value="low">BASSE</option>
                  <option value="medium">NORMALE</option>
                  <option value="high">URGENTE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="label-iv">Réassignation Expert</label>
                <select className="input-iv" value={bulkData.assigneeId} onChange={e => setBulkData({...bulkData, assigneeId: e.target.value})}>
                  <option value="">-- Conserver expert --</option>
                  {users.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Délai d'Exécution (Deadline)</label>
                <input type="date" className="input-iv" value={bulkData.dueDate} onChange={e => setBulkData({...bulkData, dueDate: e.target.value})} />
              </div>
            </div>

            <button onClick={applyBulkEdit} className="w-full py-7 bg-sky-500 text-white font-black rounded-3xl shadow-2xl active-scale uppercase text-[11px] tracking-[0.2em] mt-4 hover:bg-sky-400 transition-all flex items-center justify-center space-x-3">
               <Save size={18} />
               <span>Propager l'Ordre de Masse</span>
            </button>
         </div>
      </Modal>

      {/* MODAL AJOUT/EDITION */}
      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={() => { setViewMode('list'); setSelectedTaskId(null); }} title={viewMode === 'add' ? 'Indexation Mission' : 'Dossier Technique'}>
        <form onSubmit={(e) => { e.preventDefault(); if (viewMode === 'edit') onUpdateTask(formData); else onAddTask(formData); setViewMode('list'); setSelectedTaskId(null); }} className="space-y-6 text-left p-1">
            <div className="space-y-2">
              <label className="label-iv">Intitulé Stratégique</label>
              <input required className="input-iv" placeholder="Titre de la mission..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="label-iv">Typologie Flux</label>
                <select className="input-iv" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})}>
                  <option value="video">VIDEO CONTENT</option>
                  <option value="design">GRAPHIC DESIGN</option>
                  <option value="website">WEB DEVELOPMENT</option>
                  <option value="ads">ADVERTISING & PERFORMANCE</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Statut Opérationnel</label>
                <select className="input-iv" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value={TaskStatus.TODO}>À FAIRE</option>
                  <option value={TaskStatus.IN_PROGRESS}>EN COURS</option>
                  <option value={TaskStatus.BLOCKED}>BLOQUÉ</option>
                  <option value={TaskStatus.DONE}>TERMINÉ</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="label-iv">Responsable iV</label>
                <select className="input-iv" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                  {(users as User[]).map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Échéance Critique</label>
                <input type="date" required className="input-iv" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full py-7 bg-sky-500 text-white font-black rounded-3xl shadow-2xl active-scale uppercase text-[11px] tracking-widest hover:bg-sky-400 transition-all flex items-center justify-center space-x-3">
               <Save size={18} />
               <span>{viewMode === 'edit' ? 'Mettre à jour Dossier' : 'Déployer Mission'}</span>
            </button>
         </form>
      </Modal>

      {/* CONSULTATION RAPIDE */}
      <Modal isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} onClose={() => setSelectedTaskId(null)} title={currentTask?.title}>
        <div className="space-y-10 text-left p-1">
           <div className={`p-8 rounded-[2.5rem] border shadow-inner ${currentTask?.status === TaskStatus.BLOCKED ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5'}`}>
              <h4 className="label-iv mb-4 opacity-40">Spécifications Opérationnelles</h4>
              <p className="text-base text-slate-200 leading-relaxed font-medium">{currentTask?.description || "Aucun briefing disponible."}</p>
           </div>
           <div className="flex flex-col gap-4">
            {currentTask?.status !== TaskStatus.DONE && <button onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); setSelectedTaskId(null); }} className="w-full py-7 bg-emerald-500 text-slate-950 font-black rounded-3xl uppercase text-[11px] shadow-2xl active-scale tracking-widest">VALIDER LA MISSION</button>}
            <div className="flex gap-4">
              <button onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} className="flex-1 py-6 glass text-white font-black rounded-[2rem] border border-white/10 uppercase text-[10px] tracking-widest active-scale">ÉDITER LE PROTOCOL</button>
              <button onClick={() => { if(confirm('Supprimer définitivement ?')) { onDeleteTask(currentTask?.id); setSelectedTaskId(null); } }} className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-[1.8rem] flex items-center justify-center active-scale transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={24}/></button>
            </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
