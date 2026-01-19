
import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar as CalendarIcon, Trash2, GripVertical, CheckCircle2, Briefcase, User as UserIcon, Type as TypeIcon, AlertTriangle, Layers, Info, Edit2 } from 'lucide-react';
import { Task, TaskStatus, User, Client, Project, UserRole } from '../types';
import Modal from './Modal';

const TaskCard = ({ task, onClick, clientName, projectName, assignee, onDragStart, canEdit }: any) => {
  return (
    <div 
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, task.id)}
      onClick={onClick}
      className={`crystal-module p-6 rounded-[2rem] mb-4 group relative overflow-hidden border border-white/5 ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center space-x-4 truncate">
          {canEdit && <GripVertical size={14} className="text-slate-700 group-hover:text-sky-400 transition-colors flex-shrink-0" />}
          <div className="truncate">
            <h4 className={`font-black text-white text-[13px] tracking-tight truncate leading-tight group-hover:text-sky-400 transition-colors ${task.status === TaskStatus.DONE ? 'opacity-40 line-through' : ''}`}>
              {task.title}
            </h4>
            <div className="flex flex-col mt-2.5">
              <p className="text-[8px] text-slate-500 font-black uppercase truncate tracking-widest">{clientName}</p>
              {projectName && (
                <p className="text-[8px] text-sky-400/60 font-black uppercase mt-1.5 truncate flex items-center leading-none">
                  <Layers size={9} className="mr-2" /> {projectName}
                </p>
              )}
            </div>
          </div>
        </div>
        {assignee && (
          <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden shadow-sm flex-shrink-0">
            <img src={assignee.avatar} className="w-full h-full object-cover" alt="" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-5 border-t border-white/5">
        <div className="flex items-center space-x-2.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
          <CalendarIcon size={12} className="text-sky-400" />
          <span>{task.dueDate}</span>
        </div>
        <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/5 ${task.priority === 'high' ? 'text-urgent bg-urgent/10 border-urgent/20' : 'text-slate-500 bg-white/5'}`}>
          {task.priority || 'MED'}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tasks, users, clients, projects, onDrop, onTaskClick, onDragStart, currentUser }: any) => {
  const [isOver, setIsOver] = useState(false);
  const clientMap = useMemo(() => new Map<string, Client>(clients.map((c: any) => [c.id, c])), [clients]);
  const userMap = useMemo(() => new Map<string, User>(users.map((u: any) => [u.id, u])), [users]);
  const projectMap = useMemo(() => new Map<string, Project>(projects.map((p: any) => [p.id, p])), [projects]);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canEditAny = isAdmin || currentUser.permissions?.canEditAllTasks;

  const colorConfig = {
    [TaskStatus.TODO]: { color: 'text-slate-400', glow: 'shadow-slate-400/20' },
    [TaskStatus.IN_PROGRESS]: { color: 'text-sky-400', glow: 'shadow-sky-400/20' },
    [TaskStatus.DONE]: { color: 'text-emerald-400', glow: 'shadow-emerald-400/20' },
  };

  const config = colorConfig[status] || colorConfig[TaskStatus.TODO];

  return (
    <div 
      onDragOver={(e) => { 
        if (!canEditAny) return;
        e.preventDefault(); 
        setIsOver(true); 
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { 
        if (!canEditAny) return;
        e.preventDefault(); 
        setIsOver(false); 
        onDrop(e.dataTransfer.getData('taskId'), status); 
      }}
      className={`flex flex-col h-full min-h-[600px] rounded-[3.5rem] transition-all duration-500 relative flex-shrink-0 w-[88vw] md:w-auto overflow-hidden ${isOver ? 'bg-white/[0.04] scale-[1.02] shadow-2xl border-sky-500/30' : 'bg-slate-900/30 border border-white/5'}`}
    >
      <div className="p-8 pb-4 flex items-center justify-between sticky top-0 bg-transparent z-10">
        <div className="flex items-center space-x-5">
          <div className={`w-3 h-3 rounded-full ${config.color.replace('text', 'bg')} shadow-[0_0_15px] ${config.glow}`}></div>
          <h3 className="font-black text-white text-[12px] uppercase tracking-[0.3em]">{status}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-500 crystal-module px-4 py-1.5 rounded-full border-white/5">{tasks.length}</span>
      </div>
      
      <div className="flex-1 px-6 pb-10 overflow-y-auto no-scrollbar pt-6">
        {tasks.map((task: any) => (
          <TaskCard 
            key={task.id} task={task} onDragStart={onDragStart}
            onClick={() => onTaskClick(task.id)} 
            clientName={clientMap.get(task.clientId || '')?.name || 'Projet Interne'} 
            projectName={projectMap.get(task.projectId || '')?.name}
            assignee={userMap.get(task.assigneeId)}
            canEdit={canEditAny || task.assigneeId === currentUser.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 group hover:opacity-40 transition-opacity">
            <CheckCircle2 size={32} className="mb-4 text-slate-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-center px-8">Zone inactive</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Tasks = ({ tasks, users, clients = [], projects = [], currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', 
    description: '', 
    dueDate: new Date().toLocaleDateString('en-CA'), 
    priority: 'medium', 
    assigneeId: currentUser.id, 
    type: 'content', 
    clientId: '',
    projectId: ''
  });
  
  const tasksByStatus = useMemo(() => ({
      [TaskStatus.TODO]: tasks.filter((t: any) => t.status === TaskStatus.TODO || !t.status),
      [TaskStatus.IN_PROGRESS]: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.DONE]: tasks.filter((t: any) => t.status === TaskStatus.DONE),
  }), [tasks]);

  const currentTask = tasks.find((t: any) => t.id === selectedTaskId);
  
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canCreate = isAdmin || currentUser.permissions?.canCreateTasks;
  const canDelete = isAdmin || currentUser.permissions?.canDeleteTasks;
  const canEditThisTask = isAdmin || currentUser.permissions?.canEditAllTasks || currentTask?.assigneeId === currentUser.id;

  const closeModals = () => {
    setViewMode('list');
    setSelectedTaskId(null);
  };

  const onOpenEdit = () => {
    if (currentTask && canEditThisTask) {
      setFormData({ ...currentTask });
      setViewMode('edit');
    }
  };

  return (
    <div className="relative">
      <div className="space-y-12 animate-fade-in">
        <div className="flex justify-between items-end px-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-sky-400 mb-3">MISSION ARCHITECTURE</p>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Opérations</h2>
          </div>
          {canCreate && (
            <button 
              onClick={() => { setFormData({ title: '', description: '', dueDate: new Date().toLocaleDateString('en-CA'), priority: 'medium', assigneeId: currentUser.id, type: 'content', clientId: '', projectId: '' }); setViewMode('add'); }} 
              className="w-16 h-16 md:w-20 md:h-20 bg-sky-500 text-white rounded-3xl shadow-[0_0_40px_rgba(14,165,233,0.3)] active-scale transition-all flex items-center justify-center hover:scale-110"
            >
              <Plus size={36} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="flex lg:grid lg:grid-cols-3 gap-6 md:gap-10 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-16 px-2 snap-x">
          {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map(status => (
              <div key={status} className="snap-center">
                <KanbanColumn 
                  status={status} tasks={tasksByStatus[status]} 
                  users={users} clients={clients} projects={projects}
                  currentUser={currentUser}
                  onDragStart={(e: any, id: any) => { e.dataTransfer.setData('taskId', id); }} 
                  onDrop={(id: any, st: any) => onUpdateStatus(id, st)} 
                  onTaskClick={setSelectedTaskId} 
                />
              </div>
          ))}
        </div>
      </div>

      <Modal 
        isOpen={viewMode === 'add' || viewMode === 'edit'} 
        onClose={closeModals}
        title={viewMode === 'add' ? 'Planification' : 'Configuration'}
        subtitle="Moteur Opérationnel iVISION Crystal"
      >
        <form onSubmit={(e) => {
             e.preventDefault();
             if (viewMode === 'edit' && formData.id) onUpdateTask(formData);
             else onAddTask({ ...formData, status: TaskStatus.TODO });
             closeModals();
         }} className="space-y-8 text-left">
            <div className="space-y-2">
              <label className="label-iv"><TypeIcon size={14} className="text-sky-400"/> Désignation Mission</label>
              <input required className="input-iv" placeholder="Titre stratégique" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="label-iv"><Info size={14} className="text-sky-400"/> Spécifications Techniques</label>
              <textarea className="input-iv h-40 resize-none font-medium text-slate-300" placeholder="Briefing détaillé..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-iv"><UserIcon size={14} className="text-sky-400"/> Responsable Assigné</label>
                <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-400 transition-all text-sm appearance-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                    {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv"><Briefcase size={14} className="text-sky-400"/> Partenaire CRM</label>
                <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-400 transition-all text-sm appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                    <option value="">Projet Interne iVISION</option>
                    {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-iv"><AlertTriangle size={14} className="text-sky-400"/> Niveau Priorité</label>
                <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-400 transition-all text-sm appearance-none cursor-pointer" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                    <option value="low">Basse (Std)</option>
                    <option value="medium">Moyenne (Core)</option>
                    <option value="high">Haute (Urgent)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label-iv"><Layers size={14} className="text-sky-400"/> Type Flux</label>
                <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-400 transition-all text-sm appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="content">Marketing Contenu</option>
                    <option value="ads">Performance Ads</option>
                    <option value="social">Engagement Social</option>
                    <option value="seo">Optimisation SEO</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full py-7 bg-white text-slate-950 font-black rounded-[2.5rem] shadow-2xl active-scale uppercase text-[12px] tracking-[0.3em] hover:bg-sky-400 hover:text-white transition-all mt-4">
              Confirmer l'Indexation iV
            </button>
         </form>
      </Modal>

      <Modal 
        isOpen={!!selectedTaskId && !!currentTask && viewMode === 'list'} 
        onClose={closeModals}
        title={currentTask?.title}
        subtitle="Analyse Opérationnelle iVISION"
      >
        <div className="space-y-10 text-left">
           <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 blur-[50px]"></div>
             <h4 className="label-iv mb-6 text-sky-400">Briefing Technique</h4>
             <p className="text-sm md:text-lg text-slate-300 leading-relaxed font-medium">{currentTask?.description || "Aucune spécification additionnelle."}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center">
                <p className="label-iv mb-3 justify-center">Date Échéance</p>
                <p className="text-sm md:text-lg font-black text-white uppercase tracking-tighter">{currentTask?.dueDate}</p>
              </div>
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center">
                <p className="label-iv mb-3 justify-center">Priorité Flux</p>
                <p className={`text-sm md:text-lg font-black uppercase tracking-widest ${currentTask?.priority === 'high' ? 'text-urgent' : 'text-white'}`}>{currentTask?.priority || 'Medium'}</p>
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-5 pt-6">
            {canEditThisTask && (
              <button onClick={onOpenEdit} className="flex-1 py-6 bg-white text-slate-950 font-black rounded-[2rem] shadow-2xl hover:bg-sky-400 hover:text-white transition-all uppercase text-[11px] tracking-widest">Modifier Mission</button>
            )}
            {canDelete && (
              <button onClick={() => { if(confirm('Révoquer cette mission ?')) { onDeleteTask(currentTask?.id); closeModals(); } }} className={`flex-1 py-6 bg-rose-500/10 text-rose-500 font-black rounded-[2rem] hover:bg-rose-500/20 transition-all uppercase text-[11px] tracking-widest border border-rose-500/10 ${!canEditThisTask ? 'w-full' : ''}`}>Révoquer</button>
            )}
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
