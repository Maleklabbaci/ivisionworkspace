
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, CheckCircle2, RotateCcw, Check, Sparkles, Briefcase, Trash2, Video, Palette, Globe, Megaphone, Send, Layers, Filter, ChevronDown, ChevronUp, ListChecks, Square, Edit2, User as UserIcon, AlertTriangle, Archive, ChevronRight, Zap, HelpCircle, CheckSquare, Save } from 'lucide-react';
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
      className={`relative p-5 md:p-6 rounded-[2rem] border transition-all duration-300 ${
        isBlocked ? 'border-rose-500/40 bg-rose-500/10' : 
        isUrgent ? 'border-amber-500/40 bg-amber-500/5' : 
        'border-white/5 bg-slate-900/40'
      } ${isDone ? 'opacity-40 grayscale-[0.6]' : 'active:bg-white/[0.08] cursor-pointer'} ${isSelected ? 'ring-4 ring-sky-500/40 border-sky-400' : ''}`}
    >
      {isSelectionMode && (
        <div className={`absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-sky-500 border-sky-400 text-white' : 'bg-white/5 border-white/10 text-transparent'}`}>
           <Check size={16} strokeWidth={4} />
        </div>
      )}

      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${isBlocked ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : isUrgent ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : config.accent}`}></div>

      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
          isBlocked ? 'bg-rose-500 text-white' : 
          isUrgent ? 'bg-amber-500 text-slate-950' :
          config.bg + ' ' + config.color
        } border border-white/5 shadow-sm`}>
          {isBlocked ? <AlertTriangle size={11} strokeWidth={3} /> : isUrgent ? <Zap size={11} strokeWidth={3}/> : <config.icon size={11} strokeWidth={3} />}
          <span className="text-[9px] font-black tracking-widest uppercase">{isBlocked ? 'BLOQUÉ' : isUrgent ? 'URGENT' : config.label}</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white/5 uppercase">
           {assignee?.name?.substring(0, 2) || 'iV'}
        </div>
      </div>

      <div className="text-left pr-4">
        <h4 className={`font-black text-[16px] leading-tight transition-colors ${isBlocked ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-white'}`}>{task.title}</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest truncate">{projectName || 'Dossier iV'}</p>
      </div>
      
      {!isSelectionMode && (
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-white/5">
          <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-tight ${isUrgent ? 'text-amber-500' : 'text-slate-600'}`}>
            <CalendarIcon size={14} />
            <span>{task.dueDate}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, isDone ? TaskStatus.IN_PROGRESS : TaskStatus.DONE); }} className={`w-11 h-11 rounded-[1rem] flex items-center justify-center transition-all active-scale ${isDone ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white/5 text-slate-600 hover:bg-emerald-500 hover:text-white border border-white/10'}`}>
            {isDone ? <RotateCcw size={18} strokeWidth={3} /> : <Check size={20} strokeWidth={4} />}
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', assigneeId: currentUser.id, type: 'video', clientId: '', projectId: '', status: TaskStatus.TODO
  });

  const [bulkData, setBulkData] = useState<any>({ status: '', priority: '', assigneeId: '', type: '', dueDate: '', projectId: '', clientId: '' });

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
    if (confirm(`Révoquer définitivement ${selectedTaskIds.length} missions ?`)) {
      selectedTaskIds.forEach(id => onDeleteTask(id));
      setSelectedTaskIds([]);
      setIsSelectionMode(false);
    }
  };

  const currentTask = tasks?.find((t: any) => t.id === selectedTaskId);

  return (
    <div className="relative pb-32">
      <div className="space-y-12 animate-fade-in px-1">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2">
          <div className="text-left space-y-2">
              <p className="text-[10px] font-black uppercase text-sky-500 tracking-[0.4em]">OPERATIONAL HUB</p>
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight leading-none">Missions</h2>
          </div>
          <div className="flex flex-col items-end gap-5 w-full md:w-auto">
             <div className="flex items-center space-x-3 w-full justify-end">
                <button 
                  onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedTaskIds([]); }} 
                  className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center space-x-2 ${isSelectionMode ? 'bg-sky-500 text-white shadow-xl' : 'glass text-slate-500'}`}
                >
                  {isSelectionMode ? <X size={16}/> : <CheckSquare size={16}/>}
                  <span className="hidden sm:inline">{isSelectionMode ? 'Quitter' : 'Sélectionner'}</span>
                </button>
                <button onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'video', status: TaskStatus.TODO }); setViewMode('add'); }} className="w-14 h-14 bg-sky-500 text-white rounded-2xl shadow-2xl active-scale flex items-center justify-center hover:scale-110 transition-all"><Plus size={32} strokeWidth={3} /></button>
             </div>
             <div className="flex bg-slate-950/40 p-1.5 rounded-full border border-white/5 w-full overflow-x-auto no-scrollbar shadow-inner backdrop-blur-xl">
                <button onClick={() => setTypeFilter('all')} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}>Tous</button>
                {(Object.keys(TYPE_CONFIG) as Array<TaskType>).map(type => (
                  <button key={type} onClick={() => setTypeFilter(type)} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === type ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>
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
                   <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter truncate">{clientId === 'internal' ? 'INTERNE' : clientMap.get(clientId)?.name.toUpperCase()}</h3>
                   <div className="h-px bg-white/10 flex-1"></div>
                   <span className="text-[10px] font-black text-slate-600 uppercase">{(clientTasks as any[]).length} FLUX</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {(clientTasks as any[]).map(task => (<TaskCard key={task.id} task={task} onClick={() => { setSelectedTaskId(task.id); setViewMode('list'); }} isSelected={selectedTaskIds.includes(task.id)} isSelectionMode={isSelectionMode} onToggleSelect={toggleSelect} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} />))}
                </div>
              </section>
          ))}
          
          {tasks.filter(t => t.status === TaskStatus.DONE).length > 0 && (
            <section className="pt-16 border-t border-white/5">
              <button onClick={() => setShowArchived(!showArchived)} className="flex items-center justify-between w-full group mb-8 text-left">
                <div className="flex items-center space-x-6"><div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10 transition-all"><Archive size={28}/></div><div><h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Archives</h3><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">MISSIONS TERMINÉES</p></div></div>
                <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 transition-all duration-500 ${showArchived ? 'rotate-90 text-emerald-400' : ''}`}><ChevronRight size={20}/></div>
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                  {tasks.filter(t => t.status === TaskStatus.DONE).map(task => (<TaskCard key={task.id} task={task} onClick={() => { setSelectedTaskId(task.id); setViewMode('list'); }} isSelected={selectedTaskIds.includes(task.id)} isSelectionMode={isSelectionMode} onToggleSelect={toggleSelect} projectName={projectMap.get(task.projectId || '')?.name} assignee={userMap.get(task.assigneeId)} onUpdateStatus={onUpdateStatus} />))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* CONSOLE MOBILE D'ACTION LOT */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] w-[94%] max-w-4xl bg-slate-900 border border-sky-500/40 rounded-[2.5rem] p-4 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-slide-up backdrop-blur-3xl">
           <div className="flex items-center space-x-4 pl-4">
             <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-lg shadow-xl">{selectedTaskIds.length}</div>
             <p className="hidden sm:block text-[10px] font-black text-white uppercase tracking-widest">Flux Sélectionnés</p>
           </div>
           <div className="flex items-center space-x-2">
             <button onClick={() => setViewMode('bulk')} className="px-6 py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase active-scale shadow-xl">Modifier Lot</button>
             <button onClick={applyBulkDelete} className="w-14 h-14 glass text-rose-500 rounded-2xl flex items-center justify-center active-scale border border-rose-500/10"><Trash2 size={24}/></button>
             <button onClick={() => { setSelectedTaskIds([]); setIsSelectionMode(false); }} className="w-14 h-14 glass text-slate-500 rounded-2xl flex items-center justify-center active-scale"><X size={24}/></button>
           </div>
        </div>
      )}

      {/* MODAL MODIFICATION COLLECTIVE EXHAUSTIVE */}
      <Modal isOpen={viewMode === 'bulk'} onClose={() => setViewMode('list')} title="Mise à jour Lot" subtitle={`Application sur ${selectedTaskIds.length} flux`}>
         <div className="space-y-8 text-left p-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Remplissez uniquement les champs à modifier globalement.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className="label-iv">Statut</label><select className="input-iv" value={bulkData.status} onChange={e => setBulkData({...bulkData, status: e.target.value})}><option value="">Conserver status</option><option value={TaskStatus.TODO}>À FAIRE</option><option value={TaskStatus.IN_PROGRESS}>EN COURS</option><option value={TaskStatus.BLOCKED}>BLOQUÉ</option><option value={TaskStatus.DONE}>TERMINÉ</option></select></div>
              <div><label className="label-iv">Priorité</label><select className="input-iv" value={bulkData.priority} onChange={e => setBulkData({...bulkData, priority: e.target.value})}><option value="">Conserver priorité</option><option value="low">BASSE</option><option value="medium">NORMALE</option><option value="high">URGENTE</option></select></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className="label-iv">Responsable</label><select className="input-iv" value={bulkData.assigneeId} onChange={e => setBulkData({...bulkData, assigneeId: e.target.value})}><option value="">Conserver expert</option>{users.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label className="label-iv">Deadline</label><input type="date" className="input-iv" value={bulkData.dueDate} onChange={e => setBulkData({...bulkData, dueDate: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div><label className="label-iv">Typologie</label><select className="input-iv" value={bulkData.type} onChange={e => setBulkData({...bulkData, type: e.target.value})}><option value="">Conserver type</option><option value="video">VIDEO CONTENT</option><option value="design">GRAPHIC DESIGN</option><option value="website">WEB DEVELOPMENT</option><option value="ads">ADVERTISING</option></select></div>
               <div><label className="label-iv">Projet</label><select className="input-iv" value={bulkData.projectId} onChange={e => setBulkData({...bulkData, projectId: e.target.value})}><option value="">Conserver projet</option>{projects.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>

            <button onClick={applyBulkEdit} className="w-full py-7 bg-sky-500 text-white font-black rounded-3xl shadow-2xl active-scale uppercase text-[11px] tracking-widest hover:bg-sky-400 transition-all">
               Appliquer modifications lot
            </button>
         </div>
      </Modal>

      {/* MODAL AJOUT/EDITION INDIVIDUELLE */}
      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={() => { setViewMode('list'); setSelectedTaskId(null); }} title={viewMode === 'add' ? 'Indexation Mission' : 'Édition Dossier'}>
        <form onSubmit={(e) => { e.preventDefault(); if (viewMode === 'edit') onUpdateTask(formData); else onAddTask(formData); setViewMode('list'); setSelectedTaskId(null); }} className="space-y-6 text-left p-2">
            <div><label className="label-iv">Objet Stratégique</label><input required className="input-iv" placeholder="Titre de la mission..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className="label-iv">Flux</label><select className="input-iv" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})}><option value="video">VIDEO</option><option value="design">DESIGN</option><option value="website">WEB</option><option value="ads">ADS</option></select></div>
              <div><label className="label-iv">État</label><select className="input-iv" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value={TaskStatus.TODO}>À FAIRE</option><option value={TaskStatus.IN_PROGRESS}>EN COURS</option><option value={TaskStatus.BLOCKED}>BLOQUÉ</option><option value={TaskStatus.DONE}>TERMINÉ</option></select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className="label-iv">Expert</label><select className="input-iv" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>{(users as User[]).map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label className="label-iv">Deadline</label><input type="date" required className="input-iv" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className="label-iv">Priorité</label><select className="input-iv" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}><option value="low">BASSE</option><option value="medium">NORMALE</option><option value="high">URGENTE</option></select></div>
              <div><label className="label-iv">Partenaire CRM</label><select className="input-iv" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}><option value="">INTERNE iV</option>{clients.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div><label className="label-iv">Détails</label><textarea className="input-iv h-32 resize-none" placeholder="Briefing technique..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <button type="submit" className="w-full py-7 bg-sky-500 text-white font-black rounded-3xl shadow-2xl active-scale uppercase text-[11px] hover:bg-sky-400 transition-all flex items-center justify-center space-x-3">
               <Save size={18} />
               <span>{viewMode === 'edit' ? 'Sauvegarder Protocol' : 'Lancer Mission'}</span>
            </button>
         </form>
      </Modal>

      {/* MODAL CONSULTATION RAPIDE */}
      <Modal isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} onClose={() => setSelectedTaskId(null)} title={currentTask?.title}>
        <div className="space-y-10 text-left p-2">
           <div className={`p-8 rounded-[2.5rem] border shadow-inner ${currentTask?.status === TaskStatus.BLOCKED ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5'}`}><h4 className="label-iv mb-4 opacity-40">Briefing Opérationnel</h4><p className="text-base text-slate-200 leading-relaxed font-medium">{currentTask?.description || "Aucun briefing disponible."}</p></div>
           <div className="flex flex-col gap-4">
            {currentTask?.status !== TaskStatus.DONE && <button onClick={() => { onUpdateStatus(currentTask.id, TaskStatus.DONE); setSelectedTaskId(null); }} className="w-full py-7 bg-emerald-500 text-slate-950 font-black rounded-3xl uppercase text-[11px] shadow-2xl shadow-emerald-500/20 active-scale">MARQUER COMME TERMINÉ</button>}
            <div className="flex gap-4">
              <button onClick={() => { setFormData({ ...currentTask }); setViewMode('edit'); }} className="flex-1 py-5 glass text-white font-black rounded-2xl border border-white/10 uppercase text-[10px] tracking-widest active-scale">Éditer Dossier</button>
              <button onClick={() => { if(confirm('Supprimer mission ?')) { onDeleteTask(currentTask?.id); setSelectedTaskId(null); } }} className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center active-scale"><Trash2 size={24}/></button>
            </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
