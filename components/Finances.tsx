
import React, { useState, useMemo } from 'react';
import { Plus, X, Wallet, TrendingUp, Users, ShieldCheck, Edit3, Sparkles, Check, Clock, Trash2, Layers, Megaphone, Receipt, Plane, Globe, Briefcase, Type, DollarSign, Activity, HelpCircle, Calendar, Target, UserCheck } from 'lucide-react';
import { SalaryRecord, User, UserRole, Project, Expense, AdCampaignExpense, Client, Task, TaskStatus } from '../types';
import Modal from './Modal';

interface FinancesProps {
  salaries: SalaryRecord[];
  expenses: Expense[];
  adCampaigns: AdCampaignExpense[];
  users: User[];
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  onUpdateSalary: (salary: SalaryRecord) => void;
  onUpdateExpense: (expense: Expense) => void;
  onUpdateAdCampaign: (campaign: AdCampaignExpense) => void;
  onAddSalary: (salary: any) => void;
  onDeleteSalary: (id: string) => void;
  onAddExpense: (expense: any) => void;
  onDeleteExpense: (id: string) => void;
  onAddAdCampaign: (campaign: any) => void;
  onDeleteAdCampaign: (id: string) => void;
}

const Finances: React.FC<FinancesProps> = ({ 
  salaries = [], expenses = [], adCampaigns = [], users = [], projects = [], clients = [], tasks = [],
  currentUser, onUpdateSalary, onUpdateExpense, onUpdateAdCampaign, onAddSalary, onDeleteSalary, 
  onAddExpense, onDeleteExpense, onAddAdCampaign, onDeleteAdCampaign 
}) => {
  const [activeTab, setActiveTab] = useState<'salaires' | 'frais' | 'ads'>('salaires');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [filterFreq, setFilterFreq] = useState<'all' | 'hebdo' | 'mensuel'>('all');
  const [showInfo, setShowInfo] = useState(false);
  
  const [salaryForm, setSalaryForm] = useState<Partial<SalaryRecord>>({ userId: '', amount: 0, bonus: 0, frequency: 'mensuel', status: 'pending', projectId: '' });
  const [bonusToAdd, setBonusToAdd] = useState<number>(0);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({ name: '', amount: 0, type: 'other', projectId: '', status: 'pending' });
  const [adsForm, setAdsForm] = useState<Partial<AdCampaignExpense>>({ 
    name: '', amount: 0, platform: 'facebook', projectId: '', status: 'active',
    clientId: '', assigneeId: '', durationDays: 30, taskId: ''
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const financialStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const salaryTotal = salaries.reduce((acc, s) => {
      const total = (Number(s.amount) || 0) + (Number(s.bonus) || 0);
      return acc + (s.frequency === 'hebdo' ? total * 4 : total);
    }, 0);

    const expenseTotal = expenses
      .filter(e => new Date(e.createdAt) >= thirtyDaysAgo)
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const adsTotal = adCampaigns
      .filter(a => new Date(a.createdAt) >= thirtyDaysAgo)
      .reduce((acc, a) => acc + (Number(a.amount) || 0), 0);

    return { salaryTotal, expenseTotal, adsTotal, grandTotal: salaryTotal + expenseTotal + adsTotal };
  }, [salaries, expenses, adCampaigns]);

  const closeModals = () => {
    setViewMode('list');
    setSalaryForm({ userId: '', amount: 0, bonus: 0, frequency: 'mensuel', status: 'pending', projectId: '' });
    setExpenseForm({ name: '', amount: 0, type: 'other', projectId: '', status: 'pending' });
    setAdsForm({ 
      name: '', amount: 0, platform: 'facebook', projectId: '', status: 'active',
      clientId: '', assigneeId: '', durationDays: 30, taskId: ''
    });
    setBonusToAdd(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'salaires') {
      const data = { ...salaryForm };
      if (viewMode === 'edit') {
        data.bonus = (Number(data.bonus) || 0) + Number(bonusToAdd);
        onUpdateSalary(data as SalaryRecord);
      } else {
        onAddSalary(data);
      }
    } else if (activeTab === 'frais') {
      if (viewMode === 'edit') {
        onUpdateExpense(expenseForm as Expense);
      } else {
        onAddExpense({ ...expenseForm, createdAt: new Date().toISOString() });
      }
    } else if (activeTab === 'ads') {
      if (viewMode === 'edit') {
        onUpdateAdCampaign(adsForm as AdCampaignExpense);
      } else {
        onAddAdCampaign({ ...adsForm, createdAt: new Date().toISOString() });
      }
    }
    closeModals();
  };

  const filteredSalaries = salaries.filter(s => filterFreq === 'all' || s.frequency === filterFreq);

  const availableAdTasks = useMemo(() => {
    if (!adsForm.projectId) return [];
    return tasks.filter(t => t.projectId === adsForm.projectId && t.type === 'ads');
  }, [tasks, adsForm.projectId]);

  return (
    <div className="space-y-10 md:space-y-16 animate-fade-in pb-24">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2 md:px-4">
        <div className="flex items-start space-x-6 text-left">
          <div>
            <p className="text-[11px] md:text-[13px] font-bold uppercase text-amber-400 mb-4 tracking-normal">FINANCIAL CORE SYSTEM</p>
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">Finance</h2>
          </div>
          <button onClick={() => setShowInfo(true)} className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-amber-400 hover:bg-amber-400/10 active-scale transition-all mt-6 md:mt-10">
             <HelpCircle size={28} />
          </button>
        </div>

        <div className="flex items-center justify-between lg:justify-end space-x-6">
          {activeTab === 'salaires' && (
            <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10">
              {['all', 'hebdo', 'mensuel'].map(f => (
                <button key={f} onClick={() => setFilterFreq(f as any)} className={`px-5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase transition-all tracking-normal ${filterFreq === f ? 'bg-white/10 text-white shadow-inner' : 'text-slate-600'}`}>{f}</button>
              ))}
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setViewMode('add')} className="w-14 h-14 md:w-20 md:h-20 bg-amber-400 text-slate-950 rounded-2xl shadow-2xl active-scale flex items-center justify-center hover:scale-105 transition-transform">
              <Plus size={32} strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5 w-full md:w-fit overflow-x-auto no-scrollbar ml-2 md:ml-4">
        {[
          { id: 'salaires', label: 'Salaires', icon: Users },
          { id: 'frais', label: 'Dépenses', icon: Receipt },
          { id: 'ads', label: 'ADS', icon: Megaphone }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { setActiveTab(tab.id as any); setViewMode('list'); }} 
            className={`px-8 md:px-12 py-3.5 rounded-[1.5rem] text-[10px] md:text-[12px] font-bold uppercase flex items-center justify-center space-x-3 transition-all whitespace-nowrap tracking-normal ${activeTab === tab.id ? 'bg-amber-400 text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon size={16}/>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-1">
        {[
          { label: 'Flux RH Mensuel', val: financialStats.salaryTotal, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Dépenses 30J', val: financialStats.expenseTotal, icon: Receipt, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'ADS 30J', val: financialStats.adsTotal, icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Burn Rate 30J', val: financialStats.grandTotal, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-400/10' }
        ].map((s, i) => (
          <div key={i} className="crystal-module p-6 md:p-10 rounded-[2.5rem] flex flex-col justify-between group overflow-hidden h-40 md:h-52">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} border border-white/5`}>
              <s.icon size={24} />
            </div>
            <div className="text-left mt-4">
              <p className="text-[9px] md:text-[11px] font-bold text-slate-500 uppercase">{s.label}</p>
              <h4 className={`text-xl md:text-2xl font-black ${s.color} mt-1 tracking-tighter leading-none`}>{(s.val).toLocaleString()} DZD</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="px-1 text-left">
        {activeTab === 'salaires' && (
          <div className="space-y-4">
            {filteredSalaries.length === 0 ? (
              <div className="py-20 glass rounded-[3rem] border-dashed border-2 border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
                 <Users size={40} className="mb-4 text-slate-500" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Aucun flux salarial indexé</p>
              </div>
            ) : (
              filteredSalaries.map(salary => {
                const user = users.find(u => u.id === salary.userId);
                const project = projects.find(p => p.id === salary.projectId);
                return (
                  <div key={salary.id} className="crystal-module p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between group">
                    <div className="flex items-center space-x-6 w-full md:w-auto text-left">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-2xl md:text-5xl border border-white/10">
                        {user?.name?.substring(0, 1) || '?'}
                      </div>
                      <div className="truncate">
                        <h3 className="text-xl md:text-3xl font-black text-white uppercase truncate leading-none">{user?.name || 'Inconnu'}</h3>
                        <div className="flex flex-wrap gap-2 mt-4">
                           <span className="text-[9px] font-black px-3 py-1 bg-amber-400/10 text-amber-400 rounded-lg uppercase">{salary.frequency}</span>
                           <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase ${salary.status === 'paid' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400 animate-pulse'}`}>
                             {salary.status === 'paid' ? 'Payé' : 'En attente'}
                           </span>
                           {project && <span className="text-[9px] font-black px-3 py-1 bg-white/5 text-slate-400 rounded-lg uppercase truncate max-w-[150px]">{project.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mt-6 md:mt-0 w-full md:w-auto">
                      <div className="text-right flex-1 md:flex-none">
                        <span className="text-2xl md:text-4xl font-black text-white block">{(Number(salary.amount) + (Number(salary.bonus) || 0)).toLocaleString()} <span className="text-xs text-slate-600">DZD</span></span>
                        {Number(salary.bonus) > 0 && <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">+ Bonus: {salary.bonus.toLocaleString()}</span>}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center space-x-3">
                          <button onClick={() => onUpdateSalary({...salary, status: salary.status === 'paid' ? 'pending' : 'paid'})} className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase transition-all active-scale ${salary.status === 'paid' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white text-slate-950 hover:bg-emerald-400 hover:text-white'}`}>
                            {salary.status === 'paid' ? 'ANNULER' : 'RÉGLER'}
                          </button>
                          <button onClick={() => { setSalaryForm(salary); setBonusToAdd(0); setViewMode('edit'); }} className="w-14 h-14 glass text-amber-400 rounded-2xl flex items-center justify-center hover:bg-amber-400/10 active-scale"><Edit3 size={20}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'frais' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenses.map(expense => (
              <div key={expense.id} className="crystal-module p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                <div className="flex items-center space-x-4 truncate text-left">
                  <div className="w-12 h-12 bg-sky-400/10 rounded-xl flex items-center justify-center text-sky-400">
                    <Receipt size={20} />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-white text-sm uppercase truncate">{expense.name}</h3>
                    <p className="text-[9px] text-slate-500 font-black uppercase mt-1 truncate">{expense.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-white mr-4">{Number(expense.amount).toLocaleString()} DZD</span>
                  {isAdmin && (
                    <>
                      <button onClick={() => { setExpenseForm(expense); setViewMode('edit'); }} className="p-2.5 glass rounded-lg text-amber-400 hover:bg-amber-400/10 transition-all"><Edit3 size={16}/></button>
                      <button onClick={() => confirm('Supprimer ?') && onDeleteExpense(expense.id)} className="p-2.5 glass rounded-lg text-slate-600 hover:text-rose-400 transition-all"><Trash2 size={16}/></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adCampaigns.map(ad => {
              const project = projects.find(p => p.id === ad.projectId);
              const client = clients.find(c => c.id === ad.clientId);
              const assignee = users.find(u => u.id === ad.assigneeId);
              const isLive = !!ad.startDate;
              
              let endDateStr = 'Non lancé';
              if (isLive) {
                 const start = new Date(ad.startDate!);
                 start.setDate(start.getDate() + (ad.durationDays || 30));
                 endDateStr = start.toLocaleDateString();
              }

              return (
                <div key={ad.id} className={`crystal-module p-8 rounded-[2.5rem] border flex flex-col group relative overflow-hidden ${isLive ? 'border-emerald-500/30' : 'border-white/5'}`}>
                  {isLive && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl"></div>}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4 truncate text-left">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLive ? 'bg-emerald-400 text-white shadow-lg' : 'bg-emerald-400/10 text-emerald-400'}`}>
                        <Megaphone size={24} />
                      </div>
                      <div className="truncate">
                        <h3 className="font-black text-white text-base md:text-lg uppercase truncate leading-none">{ad.name}</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase mt-3 truncate tracking-widest">{ad.platform} • {project?.name || 'Projet inconnu'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                       {isAdmin && <button onClick={() => { setAdsForm(ad); setViewMode('edit'); }} className="p-2.5 glass rounded-xl text-amber-400 hover:bg-amber-400/10 transition-all"><Edit3 size={18}/></button>}
                       <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${isLive ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                         {isLive ? 'En Diffusion' : 'En attente mission'}
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Partenaire</p>
                        <p className="text-[11px] font-black text-white truncate uppercase">{client?.name || 'Interne'}</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Responsable</p>
                        <p className="text-[11px] font-black text-white truncate uppercase">{assignee?.name || 'Non assigné'}</p>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5 text-left">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                           <Calendar size={12} className="text-slate-500"/>
                           <p className="text-[9px] font-black text-slate-500 uppercase">Fin de campagne : <span className="text-white">{endDateStr}</span></p>
                        </div>
                        <p className="text-xl font-black text-white">{Number(ad.amount).toLocaleString()} DZD</p>
                     </div>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                           <Clock size={12} className="text-slate-500"/>
                           <p className="text-[9px] font-black text-slate-500 uppercase">Durée : <span className="text-white">{ad.durationDays || 30} jours</span></p>
                        </div>
                        {isAdmin && <button onClick={() => confirm('Supprimer ?') && onDeleteAdCampaign(ad.id)} className="p-3 glass rounded-xl text-slate-600 hover:text-rose-400 transition-all"><Trash2 size={18}/></button>}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={viewMode === 'add' || viewMode === 'edit'} onClose={closeModals} title={activeTab === 'ads' ? "Gestion Flux ADS" : activeTab === 'salaires' ? "Flux Salarial" : "Gestion Dépense"}>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {activeTab === 'salaires' && (
            <>
              <div className="space-y-2">
                <label className="label-iv">Membre Concerné</label>
                <select disabled={viewMode === 'edit'} className="input-iv" value={salaryForm.userId} onChange={e => setSalaryForm({...salaryForm, userId: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-iv">Base Salaire</label>
                  <input type="number" className="input-iv" value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="label-iv">{viewMode === 'edit' ? 'Ajouter Bonus' : 'Bonus Initial'}</label>
                  <input type="number" className="input-iv" value={viewMode === 'edit' ? bonusToAdd : salaryForm.bonus} onChange={e => viewMode === 'edit' ? setBonusToAdd(Number(e.target.value)) : setSalaryForm({...salaryForm, bonus: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-iv">Fréquence</label>
                  <select className="input-iv" value={salaryForm.frequency} onChange={e => setSalaryForm({...salaryForm, frequency: e.target.value as any})}>
                    <option value="mensuel">Mensuel</option>
                    <option value="hebdo">Hebdomadaire</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-iv">Projet Associé</label>
                  <select className="input-iv" value={salaryForm.projectId} onChange={e => setSalaryForm({...salaryForm, projectId: e.target.value})}>
                    <option value="">Interne iVISION</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'frais' && (
            <>
              <div className="space-y-2">
                <label className="label-iv">Libellé</label>
                <input required className="input-iv" value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-iv">Montant</label>
                  <input type="number" required className="input-iv" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="label-iv">Type</label>
                  <select className="input-iv" value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value as any})}>
                    <option value="software">Logiciels</option>
                    <option value="freelance">Freelance</option>
                    <option value="travel">Voyage</option>
                    <option value="office">Bureau</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="label-iv">Projet Associé</label>
                <select className="input-iv" value={expenseForm.projectId} onChange={e => setExpenseForm({...expenseForm, projectId: e.target.value})}>
                  <option value="">Interne iVISION</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </>
          )}

          {activeTab === 'ads' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="label-iv">Identifiant Campagne</label>
                  <input required className="input-iv" placeholder="Ex: Campagne Hiver 2024" value={adsForm.name} onChange={e => setAdsForm({...adsForm, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-2">
                      <label className="label-iv">Projet iVISION</label>
                      <select required className="input-iv" value={adsForm.projectId} onChange={e => {
                         const proj = projects.find(p => p.id === e.target.value);
                         setAdsForm({...adsForm, projectId: e.target.value, clientId: proj?.clientId || ''});
                      }}>
                         <option value="">Sélectionner un projet...</option>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="label-iv">Partenaire CRM</label>
                      <select required className="input-iv" value={adsForm.clientId} onChange={e => setAdsForm({...adsForm, clientId: e.target.value})}>
                         <option value="">Interne iVISION</option>
                         {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-2">
                      <label className="label-iv">Expert Assigné</label>
                      <select required className="input-iv" value={adsForm.assigneeId} onChange={e => setAdsForm({...adsForm, assigneeId: e.target.value})}>
                         <option value="">Choisir un expert...</option>
                         {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="label-iv">Liaison Mission Opérationnelle</label>
                      <select className="input-iv" value={adsForm.taskId} onChange={e => setAdsForm({...adsForm, taskId: e.target.value})}>
                         <option value="">Aucune liaison directe</option>
                         {availableAdTasks.map(t => (
                           <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                         ))}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="space-y-2">
                      <label className="label-iv">Plateforme</label>
                      <select className="input-iv" value={adsForm.platform} onChange={e => setAdsForm({...adsForm, platform: e.target.value as any})}>
                        <option value="facebook">Facebook/Insta</option>
                        <option value="google">Google Ads</option>
                        <option value="tiktok">TikTok</option>
                        <option value="other">Autre</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="label-iv">Budget DZD</label>
                      <input type="number" required className="input-iv" value={adsForm.amount} onChange={e => setAdsForm({...adsForm, amount: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                      <label className="label-iv">Durée (Jours)</label>
                      <input type="number" min="1" required className="input-iv" value={adsForm.durationDays} onChange={e => setAdsForm({...adsForm, durationDays: Number(e.target.value)})} />
                   </div>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="w-full py-7 bg-amber-400 text-slate-950 font-black rounded-[2rem] shadow-2xl active-scale uppercase text-[11px] tracking-widest mt-6 hover:bg-amber-500 transition-all flex items-center justify-center space-x-3">
             <Sparkles size={20} />
             <span>{viewMode === 'add' ? `Indexation du Flux ${activeTab.toUpperCase()}` : 'Actualiser Données'}</span>
          </button>
        </form>
      </Modal>

      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Gestion Temporelle ADS">
        <div className="space-y-6 text-left p-2">
           <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 shrink-0"><Check size={24}/></div>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">Les campagnes publicitaires liées à une mission <span className="text-white font-black">ADVERTISING</span> ne débutent que lorsque l'expert valide techniquement le lancement dans le module Missions.</p>
           </div>
           <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0"><Calendar size={24}/></div>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">La date de fin de diffusion est calculée dynamiquement à partir du moment de la validation, en ajoutant le nombre de jours de sponsoring défini.</p>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Finances;
