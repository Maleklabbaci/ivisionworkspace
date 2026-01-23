
import React, { useState, useMemo } from 'react';
import { Plus, X, Briefcase, DollarSign, Activity, Calendar, MoreVertical, Search, Layers, TrendingUp, Filter, TrendingDown, Target, Wallet, Edit3, Type, Info, User as UserIcon, Zap, Sparkles, Trash2, Receipt, Megaphone, Users, Lock } from 'lucide-react';
import { Project, Client, UserRole, User, SalaryRecord, Expense, AdCampaignExpense } from '../types';
import Modal from './Modal';

interface AutoTaskBatch {
  id: string;
  enabled: boolean;
  count: number;
  prefix: string;
  assigneeId: string;
}

const Projects: React.FC<any> = ({ 
  projects = [], users = [], clients = [], salaries = [], expenses = [], adCampaigns = [], 
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

  const [autoBatches, setAutoBatches] = useState<AutoTaskBatch[]>([
    { id: '1', enabled: false, count: 1, prefix: 'Vidéo', assigneeId: '' }
  ]);

  const canManage = currentUser.role === UserRole.ADMIN || !!currentUser.permissions?.canManageProjects;
  const canViewFinances = currentUser.role === UserRole.ADMIN || !!currentUser.permissions?.canViewProjectFinances;
  
  const presets = ['Vidéo', 'Design', 'Website', 'Ads', 'Post'];

  const filteredProjects = projects.filter((p: Project) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const projectsWithFinancials = useMemo(() => {
    return filteredProjects.map(project => {
      // 1. Salaires
      const projSalaries = salaries
        .filter((s: SalaryRecord) => s.projectId === project.id)
        .reduce((acc: number, s: SalaryRecord) => {
          const total = (s.amount || 0) + (s.bonus || 0);
          return acc + (s.frequency === 'hebdo' ? total * 4 : total);
        }, 0);

      // 2. Frais
      const projExpenses = expenses
        .filter((e: Expense) => e.projectId === project.id)
        .reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);

      // 3. Budgets ADS
      const projAds = adCampaigns
        .filter((a: AdCampaignExpense) => a.projectId === project.id)
        .reduce((acc: number, a: AdCampaignExpense) => acc + (a.amount || 0), 0);

      const realSpent = projSalaries + projExpenses + projAds;
      const remaining = (project.totalBudget || 0) - realSpent;
      
      const salaryPerc = realSpent > 0 ? (projSalaries / realSpent) * 100 : 0;
      const expensePerc = realSpent > 0 ? (projExpenses / realSpent) * 100 : 0;
      const adsPerc = realSpent > 0 ? (projAds / realSpent) * 100 : 0;

      return { 
        ...project, 
        realSpent, 
        remaining,
        breakdown: {
          rh: projSalaries,
          ops: projExpenses,
          ads: projAds,
          percs: { rh: salaryPerc, ops: expensePerc, ads: adsPerc }
        }
      };
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
    const activeConfigs = autoBatches.filter(b => b.enabled && b.count > 0);
    
    // Si l'utilisateur n'a pas accès aux finances, on préserve le budget existant ou on met 0
    const finalData = { ...formData };
    if (!canViewFinances && viewMode === 'edit') {
        const existing = projects.find(p => p.id === selectedProjectId);
        finalData.totalBudget = existing?.totalBudget || 0;
    }

    if (viewMode === 'edit' && selectedProjectId) {
      onUpdateProject({ ...finalData, id: selectedProjectId } as Project, activeConfigs);
    } else {
      onAddProject({ ...finalData, spentBudget: 0 }, activeConfigs);
    }
    closeModal();
  };

  const closeModal = () => {
    setViewMode('list');
    setSelectedProjectId(null);
    setFormData({ name: '', description: '', totalBudget: 0, status: 'active', clientId: '' });
    setAutoBatches([{ id: '1', enabled: false, count: 1, prefix: 'Vidéo', assigneeId: '' }]);
  };

  const handleEditClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setFormData({ name: project.name, description: project.description, totalBudget: project.totalBudget, status: project.status, clientId: project.clientId });
    setViewMode('edit');
  };

  const updateBatch = (id: string, updates: Partial<AutoTaskBatch>) => {
    setAutoBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const addBatch = () => {
    setAutoBatches(prev => [...prev, { id: crypto.randomUUID(), enabled: true, count: 1, prefix: 'Vidéo', assigneeId: '' }]);
  };

  const removeBatch = (id: string) => {
    if (autoBatches.length > 1) setAutoBatches(prev => prev.filter(b => b.id !== id));
    else updateBatch(id, { enabled: false });
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div className="text-left">
          <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.4em]">PROJECT CORE</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Projets</h2>
        </div>
        <div className="flex items-center space-x-3 w-full lg:w-auto">
          <div className="relative group flex-1 lg:w-72">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="RECHERCHER..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase text-white outline-none focus:border-emerald-400 transition-all placeholder-slate-700" />
          </div>
          {canManage && (
            <button onClick={() => setViewMode('add')} className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl active-scale flex items-center justify-center transition-all hover:scale-110"><Plus size={32} strokeWidth={3} /></button>
          )}
        </div>
      </header>

      {/* STATS GLOBALES - AFFICHAGE SÉLECTIF */}
      <div className={`grid grid-cols-1 ${canViewFinances ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        <div className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between group text-left">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projets Actifs</p>
            <h4 className="text-2xl font-black text-emerald-400 mt-2 tracking-tighter leading-none">{globalStats.active}</h4>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400"><Activity size={24} /></div>
        </div>

        {canViewFinances && (
          <div className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between group text-left">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valeur Totale CRM</p>
              <h4 className="text-2xl font-black text-sky-400 mt-2 tracking-tighter leading-none">{globalStats.totalValue.toLocaleString()} DZD</h4>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-sky-400/10 flex items-center justify-center text-sky-400"><Target size={24} /></div>
          </div>
        )}

        <div className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between group text-left">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume Historique</p>
            <h4 className="text-2xl font-black text-violet-400 mt-2 tracking-tighter leading-none">{globalStats.total}</h4>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-violet-400/10 flex items-center justify-center text-violet-400"><Layers size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projectsWithFinancials.map(project => {
          const client = clients.find(c => c.id === project.clientId);
          const progress = project.totalBudget > 0 ? (project.realSpent / project.totalBudget) * 100 : 0;
          const isOverBudget = project.remaining < 0;
          
          return (
            <div key={project.id} className="bg-slate-900/40 backdrop-blur-3xl p-8 md:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-emerald-400/20 transition-all text-left">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center space-x-6 min-w-0">
                  <div className="w-14 h-14 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-400/10 flex-shrink-0"><Briefcase size={24} /></div>
                  <div className="truncate"><h3 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">{project.name}</h3><p className="text-[9px] text-emerald-400 font-bold uppercase mt-2">{client?.name || 'Projet Interne'}</p></div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase glass ${project.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>{project.status === 'active' ? 'En Cours' : 'Clôturé'}</div>
              </div>

              {/* SECTION FINANCIÈRE - MASQUÉE SI PAS ACCÈS */}
              {canViewFinances && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Dépensé Cumulé</p>
                      <p className="text-lg font-black text-white">{project.realSpent.toLocaleString()}</p>
                    </div>
                    <div className={`p-6 rounded-[2rem] border ${isOverBudget ? 'bg-rose-400/10 border-rose-400/10' : 'bg-emerald-400/10 border-emerald-400/10'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Budget Restant</p>
                      <p className={`text-lg font-black ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>{project.remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mb-6 px-1">
                    <div className="flex justify-between items-end mb-2">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Répartition des coûts</p>
                       <p className="text-[9px] font-black text-white">{Math.round(progress)}% du budget</p>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                      <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${project.breakdown.percs.rh}%` }} title="RH"></div>
                      <div className="h-full bg-sky-400 transition-all duration-700" style={{ width: `${project.breakdown.percs.ops}%` }} title="Ops"></div>
                      <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${project.breakdown.percs.ads}%` }} title="Ads"></div>
                    </div>
                  </div>
                </>
              )}

              {/* Description visible par tous */}
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 mb-6 opacity-60">
                {project.description || "Aucune description opérationnelle renseignée."}
              </p>

              {canManage && (
                <div className="pt-6 border-t border-white/5 flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(project)} className="p-3 bg-white/5 rounded-xl text-amber-400 hover:bg-white/10 active-scale transition-all"><Edit3 size={18} /></button>
                  <button onClick={() => confirm('Supprimer ce projet ?') && onDeleteProject(project.id)} className="p-3 glass rounded-xl text-slate-600 hover:text-rose-400 active-scale transition-all"><Trash2 size={18} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={closeModal} title="Projet Architecture" subtitle="Matrice Opérationnelle iV">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-5">
            <div className="text-left"><label className="label-iv"><Type size={12} className="text-emerald-400"/> Désignation</label><input required className="input-iv" placeholder="Nom du projet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            
            <div className={`grid grid-cols-1 ${canViewFinances ? 'sm:grid-cols-2' : ''} gap-5 text-left`}>
              <div>
                <label className="label-iv"><Briefcase size={12} className="text-emerald-400"/> Client</label>
                <select className="input-iv" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                  <option value="">Interne iVISION</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              {/* CHAMP BUDGET MASQUÉ POUR LES NON-FINANCIERS */}
              {canViewFinances && (
                <div>
                  <label className="label-iv"><DollarSign size={12} className="text-emerald-400"/> Budget Mensuel (DZD)</label>
                  <input type="number" required className="input-iv" placeholder="0" value={formData.totalBudget} onChange={e => setFormData({...formData, totalBudget: Number(e.target.value)})} />
                </div>
              )}
            </div>

            <div className="text-left">
              <label className="label-iv"><Info size={12} className="text-emerald-400"/> Description</label>
              <textarea className="input-iv h-24 resize-none leading-relaxed" placeholder="Brief opérationnel..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="p-5 md:p-8 bg-emerald-400/5 rounded-[2rem] border border-emerald-400/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3"><Zap size={18} className="text-emerald-400" /><span className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest leading-none">Auto-Missions</span></div>
                <button type="button" onClick={addBatch} className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/10 hover:bg-emerald-400 hover:text-slate-950 transition-all">+ Nouveau Lot</button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {autoBatches.map((batch, index) => (
                  <div key={batch.id} className="p-4 bg-slate-950/40 rounded-3xl border border-white/5 space-y-4 relative group/batch text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button type="button" onClick={() => updateBatch(batch.id, { enabled: !batch.enabled })} className={`w-10 h-5 rounded-full p-1 transition-all ${batch.enabled ? 'bg-emerald-400' : 'bg-white/10'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${batch.enabled ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lot #{index+1}</span>
                      </div>
                      <button type="button" onClick={() => removeBatch(batch.id)} className="p-2 text-slate-700 hover:text-rose-400 transition-colors"><Trash2 size={14}/></button>
                    </div>

                    {batch.enabled && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><label className="label-iv text-[8px] opacity-50">Quantité</label><input type="number" min="1" max="50" className="input-iv h-10 bg-slate-900/50" value={batch.count} onChange={e => updateBatch(batch.id, { count: Number(e.target.value) })} /></div>
                          <div className="space-y-1"><label className="label-iv text-[8px] opacity-50">Préfixe</label><input className="input-iv h-10 bg-slate-900/50" placeholder="Ex: Vidéo" value={batch.prefix} onChange={e => updateBatch(batch.id, { prefix: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1">
                          <label className="label-iv text-[8px] opacity-50">Responsable</label>
                          <select className="input-iv h-10 bg-slate-900/50 cursor-pointer" value={batch.assigneeId} onChange={e => updateBatch(batch.id, { assigneeId: e.target.value })}>
                            <option value="">Vous-même</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-left"><label className="label-iv"><Activity size={12} className="text-emerald-400"/> Statut Flux</label><select className="input-iv" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="active">Opérationnel</option><option value="completed">Clôturé</option><option value="on_hold">En Pause</option></select></div>
          </div>

          <button type="submit" className="w-full py-6 bg-emerald-400 text-slate-950 font-black rounded-3xl shadow-xl active-scale uppercase text-[10px] tracking-widest mt-4 hover:bg-emerald-300 transition-all flex items-center justify-center">
            <Sparkles size={16} className="mr-2" />
            {viewMode === 'add' ? 'Lancer le Projet' : 'Mettre à jour Protocol'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
