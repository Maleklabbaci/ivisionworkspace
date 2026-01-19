
import React, { useState, useMemo } from 'react';
import { Plus, X, Wallet, TrendingUp, Users, ShieldCheck, Edit3, Sparkles, Check, Clock, Trash2, Layers, Megaphone, Receipt, Plane, Globe, Briefcase } from 'lucide-react';
import { SalaryRecord, User, UserRole, Project, Expense, AdCampaignExpense } from '../types';

interface FinancesProps {
  salaries: SalaryRecord[];
  expenses: Expense[];
  adCampaigns: AdCampaignExpense[];
  users: User[];
  projects: Project[];
  currentUser: User;
  onUpdateSalary: (salary: SalaryRecord) => void;
  onAddSalary: (salary: any) => void;
  onDeleteSalary: (id: string) => void;
  onAddExpense: (expense: any) => void;
  onDeleteExpense: (id: string) => void;
  onAddAdCampaign: (campaign: any) => void;
  onDeleteAdCampaign: (id: string) => void;
}

const Finances: React.FC<FinancesProps> = ({ 
  salaries = [], expenses = [], adCampaigns = [], users = [], projects = [], 
  currentUser, onUpdateSalary, onAddSalary, onDeleteSalary, 
  onAddExpense, onDeleteExpense, onAddAdCampaign, onDeleteAdCampaign 
}) => {
  const [activeTab, setActiveTab] = useState<'salaires' | 'frais' | 'ads'>('salaires');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [filterFreq, setFilterFreq] = useState<'all' | 'hebdo' | 'mensuel'>('all');
  
  // Salary State
  const [salaryForm, setSalaryForm] = useState<Partial<SalaryRecord>>({ userId: '', amount: 0, bonus: 0, frequency: 'mensuel', status: 'pending', projectId: '' });
  const [bonusToAdd, setBonusToAdd] = useState<number>(0);

  // Expense State
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({ name: '', amount: 0, type: 'other', projectId: '', status: 'pending' });

  // ADS State
  const [adsForm, setAdsForm] = useState<Partial<AdCampaignExpense>>({ name: '', amount: 0, platform: 'facebook', projectId: '', status: 'active' });

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const financialStats = useMemo(() => {
    const salaryTotal = salaries.reduce((acc, s) => {
      const total = (s.amount || 0) + (s.bonus || 0);
      return acc + (s.frequency === 'hebdo' ? total * 4 : total);
    }, 0);
    const expenseTotal = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const adsTotal = adCampaigns.reduce((acc, a) => acc + (a.amount || 0), 0);
    return { salaryTotal, expenseTotal, adsTotal, grandTotal: salaryTotal + expenseTotal + adsTotal };
  }, [salaries, expenses, adCampaigns]);

  // Fix: Added handleToggleStatus function to toggle salary payment status
  const handleToggleStatus = (salary: SalaryRecord) => {
    onUpdateSalary({
      ...salary,
      status: salary.status === 'paid' ? 'pending' : 'paid'
    });
  };

  const closeModals = () => {
    setViewMode('list');
    setSalaryForm({ userId: '', amount: 0, bonus: 0, frequency: 'mensuel', status: 'pending', projectId: '' });
    setExpenseForm({ name: '', amount: 0, type: 'other', projectId: '', status: 'pending' });
    setAdsForm({ name: '', amount: 0, platform: 'facebook', projectId: '', status: 'active' });
    setBonusToAdd(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'salaires') {
      const data = { ...salaryForm };
      if (viewMode === 'edit') {
        data.bonus = (data.bonus || 0) + bonusToAdd;
        onUpdateSalary(data as SalaryRecord);
      } else {
        onAddSalary(data);
      }
    } else if (activeTab === 'frais') {
      onAddExpense(expenseForm);
    } else {
      onAddAdCampaign(adsForm);
    }
    closeModals();
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header & Tabs */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-2">FINANCIAL CORE SYSTEM</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Finance</h2>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mt-6 w-fit">
            {[
              { id: 'salaires', label: 'Salaires', icon: Users },
              { id: 'frais', label: 'Dépenses iV', icon: Receipt },
              { id: 'ads', label: 'ADS Performance', icon: Megaphone }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setViewMode('list'); }} 
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${activeTab === tab.id ? 'bg-amber-400 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'salaires' && (
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mr-2">
              {['all', 'hebdo', 'mensuel'].map(f => (
                <button key={f} onClick={() => setFilterFreq(f as any)} className={`px-4 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${filterFreq === f ? 'bg-white/10 text-white' : 'text-slate-600'}`}>{f}</button>
              ))}
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setViewMode('add')} className="w-14 h-14 bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 active-scale flex items-center justify-center transition-all">
              <Plus size={32} strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Flux Salarial', val: `${financialStats.salaryTotal.toLocaleString()} DZD`, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Frais Opérationnels', val: `${financialStats.expenseTotal.toLocaleString()} DZD`, icon: Receipt, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Budget ADS iV', val: `${financialStats.adsTotal.toLocaleString()} DZD`, icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Burn Rate Total', val: `${financialStats.grandTotal.toLocaleString()} DZD`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-400/10' }
        ].map((s, i) => (
          <div key={i} className="glass-card p-6 rounded-[2rem] flex flex-col justify-between group">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110`}>
              <s.icon size={18} />
            </div>
            <div className="mt-4">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <h4 className={`text-xl font-extrabold ${s.color} mt-1 tracking-tighter`}>{s.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {/* SALAIRES TAB */}
        {activeTab === 'salaires' && salaries.filter(s => filterFreq === 'all' || s.frequency === filterFreq).map(salary => {
          const user = users.find(u => u.id === salary.userId);
          const project = projects.find(p => p.id === salary.projectId);
          if (!user) return null;
          return (
            <div key={salary.id} className="bg-[#0A0D16]/80 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between group hover:border-white/10 transition-all relative overflow-hidden">
               <div className="flex items-center space-x-8 w-full md:w-auto">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-500 rounded-[2rem] flex items-center justify-center text-slate-950 font-black text-3xl shadow-2xl overflow-hidden uppercase">
                    {user.name.substring(0, 2)}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#0A0D16] flex items-center justify-center ${salary.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}>
                    {salary.status === 'paid' ? <Check size={12} className="text-white" /> : <Clock size={12} className="text-slate-950" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{user.name}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">{user.role}</p>
                  <div className="mt-4 flex flex-col items-start gap-1">
                    <span className="text-lg font-black text-white tracking-tighter">{(salary.amount + (salary.bonus || 0)).toLocaleString()} DZD</span>
                    {project && <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest flex items-center"><Layers size={10} className="mr-1"/> {project.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-6 md:mt-0 w-full md:w-auto justify-end">
                {isAdmin && (
                  <>
                    <button onClick={() => handleToggleStatus(salary)} className={`px-12 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active-scale shadow-2xl ${salary.status === 'paid' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'}`}>
                      {salary.status === 'paid' ? 'RÉGLÉ' : 'PAYER'}
                    </button>
                    <button onClick={() => { setSalaryForm(salary); setBonusToAdd(0); setViewMode('edit'); }} className="px-8 py-4 bg-white/5 border border-white/5 text-amber-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center active-scale">
                      <Edit3 size={14} className="mr-2"/> MODIFIER
                    </button>
                  </>
                )}
                {isAdmin && <button onClick={() => confirm('Supprimer ?') && onDeleteSalary(salary.id)} className="w-14 h-14 bg-white/5 border border-white/5 text-slate-600 hover:text-rose-400 rounded-2xl flex items-center justify-center transition-all active-scale"><X size={20} /></button>}
              </div>
            </div>
          );
        })}

        {/* FRAIS TAB */}
        {activeTab === 'frais' && expenses.map(expense => {
          const project = projects.find(p => p.id === expense.projectId);
          return (
            <div key={expense.id} className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between group hover:bg-white/[0.04] transition-all">
              <div className="flex items-center space-x-8 w-full md:w-auto">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-sky-500/10 rounded-[1.5rem] flex items-center justify-center text-sky-400 shadow-inner border border-sky-400/10">
                  {expense.type === 'travel' ? <Plane size={24}/> : <Receipt size={24}/>}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{expense.name}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm font-black text-white">{expense.amount.toLocaleString()} DZD</span>
                    {project && <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest flex items-center"><Layers size={10} className="mr-1"/> {project.name}</span>}
                  </div>
                </div>
              </div>
              {isAdmin && <button onClick={() => confirm('Supprimer ?') && onDeleteExpense(expense.id)} className="w-14 h-14 bg-white/5 border border-white/5 text-slate-600 hover:text-rose-400 rounded-2xl flex items-center justify-center transition-all active-scale"><Trash2 size={20} /></button>}
            </div>
          );
        })}

        {/* ADS TAB */}
        {activeTab === 'ads' && adCampaigns.map(ad => {
          const project = projects.find(p => p.id === ad.projectId);
          return (
            <div key={ad.id} className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between group hover:bg-white/[0.04] transition-all">
              <div className="flex items-center space-x-8 w-full md:w-auto">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-400 shadow-inner border border-emerald-400/10 uppercase font-black text-xs">
                  {ad.platform}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{ad.name}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm font-black text-white">{ad.amount.toLocaleString()} DZD</span>
                    {project && <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest flex items-center"><Layers size={10} className="mr-1"/> {project.name}</span>}
                  </div>
                </div>
              </div>
              {isAdmin && <button onClick={() => confirm('Supprimer ?') && onDeleteAdCampaign(ad.id)} className="w-14 h-14 bg-white/5 border border-white/5 text-slate-600 hover:text-rose-400 rounded-2xl flex items-center justify-center transition-all active-scale"><Trash2 size={20} /></button>}
            </div>
          );
        })}
      </div>

      {/* MODAL SYSTEM */}
      {viewMode !== 'list' && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-xl">
            <div className="relative glass w-full transform rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">Indexation {activeTab === 'salaires' ? 'Flux RH' : activeTab === 'frais' ? 'Frais Op.' : 'Campagne ADS'}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Configuration iVISION Financial Core</p>
                </div>
                <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* PROJECT LINKING DROPDOWN - Global for all finance types */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-sky-400 px-2 flex items-center"><Layers size={12} className="mr-2"/> Affectation Activité (Projet)</label>
                  <select 
                    className="w-full p-6 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" 
                    value={activeTab === 'salaires' ? salaryForm.projectId : activeTab === 'frais' ? expenseForm.projectId : adsForm.projectId} 
                    onChange={e => {
                      if(activeTab === 'salaires') setSalaryForm({...salaryForm, projectId: e.target.value});
                      else if(activeTab === 'frais') setExpenseForm({...expenseForm, projectId: e.target.value});
                      else setAdsForm({...adsForm, projectId: e.target.value});
                    }}
                  >
                    <option value="">Frais Structure Global</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {activeTab === 'salaires' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Collaborateur</label>
                      <select required disabled={viewMode === 'edit'} className="w-full p-6 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer disabled:opacity-50" value={salaryForm.userId} onChange={e => setSalaryForm({...salaryForm, userId: e.target.value})}>
                        <option value="">Sélectionner un membre</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Salaire (DZD)</label>
                        <input type="number" required className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-amber-400 transition-all text-sm" value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Fréquence</label>
                        <select className="w-full p-6 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={salaryForm.frequency} onChange={e => setSalaryForm({...salaryForm, frequency: e.target.value as any})}>
                          <option value="hebdo">Hebdomadaire</option>
                          <option value="mensuel">Mensuel</option>
                        </select>
                      </div>
                    </div>
                    {viewMode === 'edit' && (
                      <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                        <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center"><Sparkles size={14} className="mr-2"/> Ajouter Bonus Exceptionnel</h4>
                        <input type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-emerald-400 font-black outline-none" placeholder="Montant..." value={bonusToAdd === 0 ? '' : bonusToAdd} onChange={e => setBonusToAdd(Number(e.target.value))} />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'frais' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Libellé Frais</label>
                      <input required className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-sky-400" placeholder="Ex: Déplacement client Constantine" value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Montant (DZD)</label>
                        <input type="number" required className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-sky-400" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Type</label>
                        <select className="w-full p-6 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value as any})}>
                          <option value="travel">Déplacement</option>
                          <option value="freelance">Freelancer</option>
                          <option value="software">Logiciel / SaaS</option>
                          <option value="office">Bureau / Logistique</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ads' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Désignation Campagne</label>
                      <input required className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-400" placeholder="Ex: Campagne Acquisition Q4" value={adsForm.name} onChange={e => setAdsForm({...adsForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Budget Injecté (DZD)</label>
                        <input type="number" required className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-400" value={adsForm.amount} onChange={e => setAdsForm({...adsForm, amount: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Plateforme</label>
                        <select className="w-full p-6 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={adsForm.platform} onChange={e => setAdsForm({...adsForm, platform: e.target.value as any})}>
                          <option value="facebook">Meta (FB/IG)</option>
                          <option value="google">Google Ads</option>
                          <option value="tiktok">TikTok ADS</option>
                          <option value="instagram">Instagram Direct</option>
                          <option value="other">Autre Régie</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button className="w-full py-7 bg-amber-400 text-slate-950 font-black rounded-3xl shadow-2xl active-scale uppercase text-[12px] tracking-[0.4em] mt-4">
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

export default Finances;
