
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, User, Client } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, Check, Briefcase, User as UserIcon, Type as TypeIcon, AlertTriangle, Layers, Info } from 'lucide-react';

const Calendar: React.FC<any> = ({ tasks = [], onAddTask, onUpdateStatus, currentUser, users = [], clients = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Task>>({ 
    title: '', 
    description: '', 
    priority: 'medium', 
    assigneeId: currentUser.id, 
    type: 'content', 
    clientId: '' 
  });

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const total = daysInMonth(year, month);
    const start = firstDay(year, month);
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t: Task) => {
      const d = new Date(t.dueDate).toDateString();
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [tasks]);

  const closeModals = () => {
    setShowAddModal(false);
    setFormData({ title: '', description: '', priority: 'medium', assigneeId: currentUser.id, type: 'content', clientId: '' });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    onAddTask({
      ...formData,
      status: TaskStatus.TODO,
      dueDate: selectedDate.toLocaleDateString('en-CA')
    });
    closeModals();
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400 mb-2">OPERATIONAL TIMELINE</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase leading-none">
              {monthNames[currentDate.getMonth()]} <span className="text-rose-400">{currentDate.getFullYear()}</span>
            </h2>
          </div>
          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 flex-1 lg:flex-none">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="flex-1 lg:w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all active-scale"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Aujourd'hui</button>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="flex-1 lg:w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all active-scale"><ChevronRight size={20}/></button>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)} 
              className="w-14 h-14 bg-rose-400 text-white rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)] active-scale flex items-center justify-center transition-all hover:scale-105 hover:bg-rose-500 group"
            >
              <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 glass p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/5 blur-[100px] rounded-full"></div>
             <div className="grid grid-cols-7 gap-2 mb-8 relative z-10">
               {dayNames.map(d => <div key={d} className="text-center text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">{d}</div>)}
             </div>
             <div className="grid grid-cols-7 gap-2 md:gap-3 relative z-10">
               {calendarDays.map((date, idx) => {
                 if (!date) return <div key={idx} />;
                 const isSelected = selectedDate?.toDateString() === date.toDateString();
                 const isToday = new Date().toDateString() === date.toDateString();
                 const dayTasks = tasksByDate[date.toDateString()] || [];
                 const hasTasks = dayTasks.length > 0;
                 return (
                   <button 
                    key={idx} 
                    onClick={() => setSelectedDate(date)} 
                    className={`h-14 md:h-20 rounded-[1.2rem] md:rounded-[1.6rem] flex flex-col items-center justify-center relative transition-all active-scale group ${isSelected ? 'bg-rose-400 text-white shadow-xl shadow-rose-500/20' : isToday ? 'bg-white/10 text-white border border-white/10' : 'text-slate-500 hover:bg-white/5'}`}
                   >
                     <span className="text-xs md:text-lg font-extrabold tracking-tight">{date.getDate()}</span>
                     {hasTasks && (
                      <div className="flex space-x-1 mt-1 md:mt-2">
                        {dayTasks.slice(0, 3).map((_, i) => (
                          <div key={i} className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-400'}`} />
                        ))}
                      </div>
                     )}
                   </button>
                 );
               })}
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center space-x-4 px-3 mb-6">
               <div className="w-12 h-12 bg-rose-400/10 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner border border-rose-400/10"><Clock size={20}/></div>
               <div className="truncate">
                  <h3 className="font-extrabold text-white text-sm md:text-lg tracking-tight uppercase truncate">{selectedDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Planning Opérationnel</p>
               </div>
             </div>
             <div className="space-y-3 px-1">
               {(tasksByDate[selectedDate?.toDateString() || ''] || []).map((t: Task) => (
                 <div key={t.id} className="glass-card p-5 rounded-[2.2rem] border border-white/5 flex items-center justify-between group">
                    <div className="truncate pr-4 flex-1">
                      <h4 className={`font-bold text-white text-[13px] truncate uppercase tracking-tight transition-opacity ${t.status === TaskStatus.DONE ? 'opacity-30 line-through' : ''}`}>{t.title}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                         <span className={`w-1.5 h-1.5 rounded-full ${t.status === TaskStatus.DONE ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                         <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">{t.status}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onUpdateStatus(t.id, TaskStatus.DONE)} 
                      className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center transition-all flex-shrink-0 ${t.status === TaskStatus.DONE ? 'bg-emerald-400 border-none text-white' : 'hover:bg-rose-400 hover:border-none hover:text-white text-slate-600'}`}
                    >
                      {t.status === TaskStatus.DONE ? <Check size={18} strokeWidth={3} /> : ''}
                    </button>
                 </div>
               ))}
               {(!tasksByDate[selectedDate?.toDateString() || '']?.length) && (
                 <div className="py-20 text-center glass rounded-[3rem] border-white/5 opacity-20 flex flex-col items-center">
                   <CalendarIcon size={40} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucune mission indexée</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* MODAL PLANIFICATION MISSION */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] p-8 md:p-14 animate-fade-in">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-none">Planification</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Mission du {selectedDate?.toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
               </div>
               
               <form onSubmit={handleAddSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><TypeIcon size={12} className="mr-2 text-rose-400"/> Objet de la mission</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-rose-400 transition-all text-sm" placeholder="Titre stratégique" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Info size={12} className="mr-2 text-rose-400"/> Spécifications</label>
                    <textarea className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-medium text-white outline-none focus:border-rose-400 transition-all text-sm h-32 resize-none" placeholder="Briefing détaillé..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><UserIcon size={12} className="mr-2 text-rose-400"/> Responsable iV</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                          {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Briefcase size={12} className="mr-2 text-rose-400"/> Partenaire CRM</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                          <option value="">Interne iVISION</option>
                          {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><AlertTriangle size={12} className="mr-2 text-rose-400"/> Priorité</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Layers size={12} className="mr-2 text-rose-400"/> Type Flux</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                          <option value="content">Contenu</option>
                          <option value="ads">Publicité</option>
                          <option value="social">Social</option>
                          <option value="seo">SEO</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-6 bg-rose-400 text-white font-black rounded-3xl shadow-2xl active-scale uppercase text-[11px] tracking-[0.3em] mt-4 hover:bg-rose-500 shadow-rose-400/20 transition-all">
                    Confirmer l'Indexation
                  </button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
