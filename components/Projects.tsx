
import React, { useState, useMemo } from 'react';
import { Plus, X, Briefcase, DollarSign, Activity, Calendar, MoreVertical, Search, Layers, TrendingUp, Filter, TrendingDown, Target, Wallet, Edit3, Type, Info, User as UserIcon } from 'lucide-react';
import { Project, Client, UserRole, User, SalaryRecord, Expense, AdCampaignExpense } from '../types';
import Modal from './Modal';

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
          <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.4em]">PROJECT ARCHITECTURE</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Projets</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="RECHERCHER..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full lg:w-72 pl-14 pr-8 py-5 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase text-white outline-none focus:border-emerald-400 transition-all placeholder-slate-700" 
            />
          </div>
          {isAdmin && (
            <button onClick={() => setViewMode('add')} className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl shadow-emerald-400/10 active-scale flex items-center justify-center transition-all">
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
          <div key={i} className="glass-card p-10 rounded-[3rem] flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <h4 className={`text-2xl font-black ${s.color} mt-3 tracking-tighter leading-none`}>{s.val}</h4>
            </div>
            <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110`}>
              <s.icon size={28} />
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
            <div key={project.id} className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group hover:border-emerald-400/20 transition-all">
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-400/10 shadow-inner">
                    <Briefcase size={28} />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight truncate leading-none">{project.name}</h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase mt-3">{client?.name || 'Projet Structure iV'}</p>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase glass ${project.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {project.status === 'active' ? 'En Cours' : 'Clôturé'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-2 flex items-center"><TrendingDown size={12} className="mr-2"/> Budget Engagé</p>
                   <p className="text-xl font-black text-white">{project.realSpent.toLocaleString()} <span className="text-[10px] text-slate-600">DZD</span></p>
                </div>
                <div className={`p-8 rounded-[2.5rem] border ${isOverBudget ? 'bg-rose-400/10 border-rose-400/20' : 'bg-emerald-400/10 border-emerald-400/20'}`}>
                   <p className="text-[9px] font-black text-slate-500 uppercase mb-2 flex items-center"><Wallet size={12} className="mr-2"/> Budget Restant</p>
                   <p className={`text-xl font-black ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>{project.remaining.toLocaleString()} <span className="text-[10px] opacity-40 text-current">DZD</span></p>
                </div>
              </div>

              <div className="space-y-4 relative z-10 mb-10">
                <div className="flex justify-between items-end px-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Consommation Financière</p>
                   <p className={`text-[10px] font-black uppercase ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>{Math.round(progress)}%</p>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-sky-500'}`} 
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-8 border-t border-white/5 flex justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(project)} className="p-4 bg-white/5 rounded-2xl text-amber-400 hover:bg-white/10 active-scale"><Edit3 size={20} /></button>
                  <button onClick={() => confirm('Supprimer ce projet ?') && onDeleteProject(project.id)} className="p-4 glass rounded-2xl text-slate-600 hover:text-rose-400 active-scale transition-all"><X size={20} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={viewMode === 'add' || viewMode === 'edit'} 
        onClose={closeModal}
        title="Architecture Projet"
        subtitle="Initialisation Flux Opérationnel iVISION"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="label-iv"><Type size={14} className="text-emerald-400"/> Désignation du Projet</label>
            <input required className="input-iv" placeholder="Ex: Audit Stratégique Q4" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div>
            <label className="label-iv"><Info size={14} className="text-emerald-400"/> Briefing de Mission</label>
            <textarea className="input-iv h-32 resize-none" placeholder="Objectifs et spécifications..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-iv"><Briefcase size={14} className="text-emerald-400"/> Partenaire CRM</label>
              <select className="input-iv appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                <option value="">Structure Interne iVISION</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-iv"><DollarSign size={14} className="text-emerald-400"/> Budget (DZD)</label>
              <input type="number" required className="input-iv" placeholder="0" value={formData.totalBudget} onChange={e => setFormData({...formData, totalBudget: Number(e.target.value)})} />
            </div>
          </div>

          <div>
            <label className="label-iv"><Activity size={14} className="text-emerald-400"/> Statut Actif</label>
            <select className="input-iv appearance-none cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
              <option value="active">Flux en Cours</option>
              <option value="completed">Mission Clôturée</option>
              <option value="on_hold">En Pause Stratégique</option>
            </select>
          </div>

          <button type="submit" className="w-full py-7 bg-emerald-400 text-slate-950 font-black rounded-[2.5rem] shadow-2xl shadow-emerald-400/10 active-scale uppercase text-[11px] tracking-tight mt-6 transition-all hover:bg-emerald-300">
            {viewMode === 'add' ? 'Déployer le Projet' : 'Confirmer les Modifications'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
