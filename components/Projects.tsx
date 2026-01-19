
import React, { useState, useMemo } from 'react';
import { Plus, X, Briefcase, DollarSign, Activity, Calendar, MoreVertical, Search, Layers, TrendingUp, Filter, TrendingDown, Target, Wallet, Edit3, Type, Info, User as UserIcon } from 'lucide-react';
import { Project, Client, UserRole, User, SalaryRecord, Expense, AdCampaignExpense } from '../types';

const Projects: React.FC<any> = ({ 
  projects = [], clients = [], salaries = [], expenses = [], adCampaigns = [], 
  currentUser, onAddProject, onDeleteProject, onUpdateProject 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    totalBudget: 0,
    status: 'active',
    clientId: ''
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const filteredProjects = projects.filter((p: Project) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const projectsWithFinancials = useMemo(() => {
    return filteredProjects.map(project => {
      const projSalaries = salaries.filter(s => s.projectId === project.id).reduce((acc, s) => acc + (s.amount + (s.bonus || 0)), 0);
      const projExpenses = expenses.filter(e => e.projectId === project.id).reduce((acc, e) => acc + e.amount, 0);
      const projAds = adCampaigns.filter(a => a.projectId === project.id).reduce((acc, a) => acc + a.amount, 0);
      
      const realSpent = projSalaries + projExpenses + projAds;
      const remaining = (project.totalBudget || 0) - realSpent;
      
      return { ...project, realSpent, remaining };
    });
  }, [filteredProjects, salaries, expenses, adCampaigns]);

  const globalStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const totalValue = projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
    return { total, active, totalValue };
  }, [projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'edit' && selectedProjectId) {
      onUpdateProject({ ...formData, id: selectedProjectId } as Project);
    } else {
      onAddProject({ ...formData, spentBudget: 0 });
    }
    closeModal();
  };

  const closeModal = () => {
    setViewMode('list');
    setSelectedProjectId(null);
    setFormData({ name: '', description: '', totalBudget: 0, status: 'active', clientId: '' });
  };

  const handleEditClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setFormData({
      name: project.name,
      description: project.description,
      totalBudget: project.totalBudget,
      status: project.status,
      clientId: project.clientId
    });
    setViewMode('edit');
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">PROJECT ARCHITECTURE</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Projets</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="RECHERCHER..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full lg:w-72 pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-emerald-400 transition-all placeholder-slate-700" 
            />
          </div>
          {isAdmin && (
            <button onClick={() => setViewMode('add')} className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl shadow-emerald-400/20 active-scale flex items-center justify-center transition-all">
              <Plus size={32} strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Projets Actifs', val: globalStats.active, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Valeur Contractuelle', val: `${globalStats.totalValue.toLocaleString()} DZD`, icon: Target, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Flux Total', val: globalStats.total, icon: Layers, color: 'text-violet-400', bg: 'bg-violet-400/10' }
        ].map((s, i) => (
          <div key={i} className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <h4 className={`text-2xl font-extrabold ${s.color} mt-2 tracking-tighter`}>{s.val}</h4>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110`}>
              <s.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projectsWithFinancials.map(project => {
          const client = clients.find(c => c.id === project.clientId);
          const progress = project.totalBudget > 0 ? (project.realSpent / project.totalBudget) * 100 : 0;
          const isOverBudget = project.remaining < 0;

          return (
            <div key={project.id} className="bg-[#0A0D16]/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-400/10 shadow-inner">
                    <Briefcase size={24} />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xl font-extrabold text-white uppercase tracking-tight truncate">{project.name}</h3>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mt-2">{client?.name || 'Projet Structure iV'}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest glass ${project.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {project.status === 'active' ? 'En Cours' : 'Clôturé'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center"><TrendingDown size={10} className="mr-1.5"/> Budget Engagé</p>
                   <p className="text-lg font-black text-white">{project.realSpent.toLocaleString()} <span className="text-[10px] text-slate-600">DZD</span></p>
                </div>
                <div className={`p-5 rounded-3xl border ${isOverBudget ? 'bg-rose-400/10 border-rose-400/20' : 'bg-emerald-400/10 border-emerald-400/20'}`}>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center"><Wallet size={10} className="mr-1.5"/> Budget Restant</p>
                   <p className={`text-lg font-black ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>{project.remaining.toLocaleString()} <span className="text-[10px] opacity-40 text-current">DZD</span></p>
                </div>
              </div>

              <div className="space-y-4 relative z-10 mb-8">
                <div className="flex justify-between items-end">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Marge Opérationnelle</p>
                   <p className={`text-[10px] font-black uppercase tracking-widest ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>Utilisation: {Math.round(progress)}%</p>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-sky-500'}`} 
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-6 border-t border-white/5 flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(project)} className="p-3 bg-white/5 rounded-xl text-amber-400 hover:bg-white/10 transition-all flex items-center justify-center active-scale">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => confirm('Supprimer ce projet ?') && onDeleteProject(project.id)} className="p-3 glass rounded-xl text-slate-600 hover:text-rose-400 transition-all active-scale"><X size={18} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL PROJET - UNIFIED DESIGN */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModal}></div>
          <div className="modal-center-wrapper">
            <div className="modal-container">
              <div className="modal-content-glass animate-fade-in">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-3xl font-extrabold text-white uppercase tracking-tight leading-none">
                      {viewMode === 'add' ? 'Architecture Projet' : 'Configuration Projet'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Initialisation Flux Opérationnel iVISION</p>
                  </div>
                  <button onClick={closeModal} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><Type size={12} className="mr-2 text-emerald-400"/> Désignation du Projet</label>
                    <input required className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-400 transition-all text-sm" placeholder="Ex: Audit Stratégique Q4" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><Info size={12} className="mr-2 text-emerald-400"/> Briefing de Mission</label>
                    <textarea className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-medium outline-none focus:border-emerald-400 transition-all text-sm h-28 resize-none" placeholder="Objectifs et spécifications..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><UserIcon size={12} className="mr-2 text-emerald-400"/> Partenaire CRM</label>
                      <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                        <option value="">Structure Interne iVISION</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><DollarSign size={12} className="mr-2 text-emerald-400"/> Budget (DZD)</label>
                      <input type="number" required className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-400 transition-all text-sm" placeholder="0" value={formData.totalBudget} onChange={e => setFormData({...formData, totalBudget: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><Activity size={12} className="mr-2 text-emerald-400"/> Statut Actif</label>
                    <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      <option value="active">Flux en Cours</option>
                      <option value="completed">Mission Clôturée</option>
                      <option value="on_hold">En Pause Stratégique</option>
                    </select>
                  </div>

                  <button type="submit" className="w-full py-7 bg-emerald-400 text-slate-950 font-black rounded-3xl shadow-2xl active-scale uppercase text-xs tracking-[0.4em] mt-6 transition-all hover:bg-emerald-300 shadow-emerald-500/20">
                    {viewMode === 'add' ? 'Déployer le Projet' : 'Confirmer les Modifications'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
