
import React, { useState, useMemo } from 'react';
import { Plus, X, Wallet, TrendingUp, Users, ShieldCheck, Edit3, Sparkles, Check, Clock, Trash2, Layers, Megaphone, Receipt, Plane, Globe, Briefcase, Type, DollarSign } from 'lucide-react';
import { SalaryRecord, User, UserRole, Project, Expense, AdCampaignExpense } from '../types';
import Modal from './Modal';

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
  
  const [salaryForm, setSalaryForm] = useState<Partial<SalaryRecord>>({ userId: '', amount: 0, bonus: 0, frequency: 'mensuel', status: 'pending', projectId: '' });
  const [bonusToAdd, setBonusToAdd] = useState<number>(0);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({ name: '', amount: 0, type: 'other', projectId: '', status: 'pending' });
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

  const getModalTitle = () => {
    if (activeTab === 'salaires') return viewMode === 'edit' ? 'Mise à jour' : 'Indexation';
    if (activeTab === 'frais') return 'Nouveau Frais';
    return 'Nouvelle ADS';
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-fade-in pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1 md:px-2">
        <div>
          <p className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.5em] text-amber-400 mb-2 md:mb-4">FINANCIAL CORE SYSTEM</p>
          <h2 className="text-3xl md:text-6xl font-extrabold text-white tracking-tighter uppercase leading-none">Finance</h2>
          
          <div className="flex bg-white/5 p-1 rounded-xl md:rounded-[2rem] border border-white/5 mt-6 md:mt-10 w-full md:w-fit overflow-x-auto no-scrollbar">
            {[
              { id: 'salaires', label: 'Salaires', icon: Users },
              { id: 'frais', label: 'Dépenses', icon: Receipt },
              { id: 'ads', label: 'ADS', icon: Megaphone }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setViewMode('list'); }} 
                className={`flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 rounded-lg md:rounded-[1.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-400 text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                <tab.icon size={14} className="md:w-[18px]"/>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end space-x-4">
          {activeTab === 'salaires' && (
            <div className="flex bg-white/5 p-1.5 rounded-xl md:rounded-2xl border border-white/10">
              {['all', 'hebdo', 'mensuel'].map(f => (
                <button key={f} onClick={() => setFilterFreq(f as any)} className={`px-4 py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${filterFreq === f ? 'bg-white/10 text-white' : 'text-slate-600'}`}>{f}</button>
              ))}
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setViewMode('add')} className="w-12 h-12 md:w-20 md:h-20 bg-amber-400 text-slate-950 rounded-xl md:rounded-3xl shadow-2xl shadow-amber-500/20 active-scale flex items-center justify-center transition-all hover:scale-105">
              <Plus size={24} className="md:w-10 md:h-10" strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Flux Salarial', val: `${financialStats.salaryTotal.toLocaleString()} DZD`, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Frais Op.', val: `${financialStats.expenseTotal.toLocaleString()} DZD`, icon: Receipt, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Budget ADS', val: `${financialStats.adsTotal.toLocaleString()} DZD`, icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Burn Rate', val: `${financialStats.grandTotal.toLocaleString()} DZD`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-400/10' }
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 md:p-10 rounded-2xl md:rounded-[3rem] flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-16 -translate-y-16"></div>
            <div className={`w-9 h-9 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110 relative z-10`}>
              <s.icon size={16} className="md:w-6 md:h-6" />
            </div>
            <div className="mt-6 md:mt-10 relative z-10">
              <p className="text-[7px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{s.label}</p>
              <h4 className={`text-sm md:text-2xl font-black ${s.color} mt-1 md:mt-2 tracking-tighter truncate`}>{s.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8">
        {activeTab === 'salaires' && salaries.filter(s => filterFreq === 'all' || s.frequency === filterFreq).map(salary => {
          const user = users.find(u => u.id === salary.userId);
          const project = projects.find(p => p.id === salary.projectId);
          if (!user) return null;
          return (
            <div key={salary.id} className="bg-slate-900/40 backdrop-blur-2xl p-5 md:p-10 rounded-[2rem] md:rounded-[4rem] border border-white/5 flex flex-col md:flex-row items-center justify-between group hover:border-amber-400/20 transition-all relative overflow-hidden">
               <div className="flex items-center space-x-6 md:space-x-12 w-full md:w-auto">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 md:w-32 md:h-32 bg-amber-400 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-slate-950 font-black text-xl md:text-5xl shadow-2xl overflow-hidden uppercase">
                    {user.name.substring(0, 2)}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-10 md:h-10 rounded-full border-[3px] md:border-[6px] border-[#020617] flex items-center justify-center ${salary.status === 'paid' ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-amber-400 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.5)]'}`}>
                    {salary.status === 'paid' ? <Check size={10} className="text-white md:w-5 md:h-5" /> : <Clock size={10} className="text-slate-950 md:w-5 md:h-5" />}
                  </div>
                </div>
                <div className="truncate">
                  <h3 className="text-base md:text-3xl font-black text-white uppercase tracking-tighter truncate leading-none">{user.name}</h3>
                  <p className="text-[8px] md:text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 md:mt-4 truncate">{user.role}</p>
                  <div className="mt-4 md:mt-8 flex flex-col items-start space-y-2 md:space-y-3">
                    <span className="text-sm md:text-2xl font-black text-white tracking-tighter">{(salary.amount + (salary.bonus || 0)).toLocaleString()} DZD</span>
                    {project && <span className="text-[7px] md:text-[10px] font-black text-amber-400/80 uppercase tracking-[0.2em] flex items-center bg-amber-400/5 px-3 py-1 rounded-full border border-amber-400/10"><Layers size={10} className="mr-2"/> {project.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 md:space-x-6 mt-6 md:mt-0 w-full md:w-auto justify-end">
                {isAdmin && (
                  <>
                    <button onClick={() => onUpdateSalary({...salary, status: salary.status === 'paid' ? 'pending' : 'paid'})} className={`flex-1 md:flex-none px-6 md:px-16 py-3.5 md:py-6 rounded-xl md:rounded-[2rem] text-[9px] md:text-[13px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all active-scale shadow-2xl ${salary.status === 'paid' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-white text-slate-950 hover:bg-emerald-400 hover:text-white'}`}>
                      {salary.status === 'paid' ? 'INDEXÉ' : 'RÉGLER'}
                    </button>
                    <button onClick={() => { setSalaryForm(salary); setBonusToAdd(0); setViewMode('edit'); }} className="p-3.5 md:p-6 bg-white/5 border border-white/5 text-amber-400 rounded-xl md:rounded-[1.8rem] text-[11px] md:text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center active-scale">
                      <Edit3 size={16} className="md:w-6 md:h-6"/>
                    </button>
                  </>
                )}
                {isAdmin && <button onClick={() => confirm('Supprimer ce flux ?') && onDeleteSalary(salary.id)} className="w-11 h-11 md:w-20 md:h-20 bg-white/5 border border-white/5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl md:rounded-[1.8rem] flex items-center justify-center transition-all active-scale"><X size={18} className="md:w-8 md:h-8" /></button>}
              </div>
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={viewMode !== 'list'} 
        onClose={closeModals}
        title={getModalTitle()}
        subtitle="Moteur Financier iVISION Crystal"
      >
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
          <div className="space-y-2 md:space-y-4">
            <label className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 px-4 flex items-center leading-none"><Layers size={14} className="mr-3 text-amber-400"/> Affectation Centre de Coût</label>
            <select 
              className="w-full p-5 md:p-8 bg-slate-900/80 border border-white/10 rounded-2xl md:rounded-[2.5rem] font-black text-white outline-none focus:border-amber-400 transition-all text-xs md:text-sm appearance-none cursor-pointer" 
              value={activeTab === 'salaires' ? salaryForm.projectId : activeTab === 'frais' ? expenseForm.projectId : adsForm.projectId} 
              onChange={e => {
                if(activeTab === 'salaires') setSalaryForm({...salaryForm, projectId: e.target.value});
                else if(activeTab === 'frais') setExpenseForm({...expenseForm, projectId: e.target.value});
                else setAdsForm({...adsForm, projectId: e.target.value});
              }}
            >
              <option value="">STUCTURE iVISION GLOBAL</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
            </select>
          </div>

          {activeTab === 'salaires' && (
            <>
              <div className="space-y-2 md:space-y-4">
                <label className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 px-4 flex items-center leading-none"><Users size={14} className="mr-3 text-amber-400"/> Collaborateur</label>
                <select required disabled={viewMode === 'edit'} className="w-full p-5 md:p-8 bg-slate-900/80 border border-white/10 rounded-2xl md:rounded-[2.5rem] font-black text-white outline-none focus:border-amber-400 transition-all text-xs md:text-sm appearance-none cursor-pointer disabled:opacity-30" value={salaryForm.userId} onChange={e => setSalaryForm({...salaryForm, userId: e.target.value})}>
                  <option value="">SÉLECTIONNER UN MEMBRE...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-2 md:space-y-4">
                  <label className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 px-4 flex items-center leading-none"><DollarSign size={14} className="mr-3 text-amber-400"/> Flux (DZD)</label>
                  <input type="number" required className="w-full p-5 md:p-8 bg-slate-900/80 border border-white/10 rounded-2xl md:rounded-[2.5rem] text-white font-black outline-none focus:border-amber-400 transition-all text-xs md:text-sm" value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2 md:space-y-4">
                  <label className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 px-4 flex items-center leading-none"><Clock size={14} className="mr-3 text-amber-400"/> Fréquence</label>
                  <select className="w-full p-5 md:p-8 bg-slate-900/80 border border-white/10 rounded-2xl md:rounded-[2.5rem] font-black text-white outline-none text-xs md:text-sm appearance-none cursor-pointer" value={salaryForm.frequency} onChange={e => setSalaryForm({...salaryForm, frequency: e.target.value as any})}>
                    <option value="hebdo">HEBDOMADAIRE</option>
                    <option value="mensuel">MENSUEL</option>
                  </select>
                </div>
              </div>
              {viewMode === 'edit' && (
                <div className="p-6 md:p-10 bg-emerald-400/5 rounded-[2rem] md:rounded-[3rem] border border-emerald-400/20 shadow-inner">
                  <h4 className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4 md:mb-6 flex items-center leading-none"><Sparkles size={16} className="mr-3"/> Injection Bonus</h4>
                  <input type="number" className="w-full p-5 md:p-7 bg-slate-950 border border-white/10 rounded-2xl md:rounded-[1.8rem] text-emerald-400 font-black outline-none text-sm md:text-lg text-center" placeholder="MONTANT BONUS..." value={bonusToAdd === 0 ? '' : bonusToAdd} onChange={e => setBonusToAdd(Number(e.target.value))} />
                </div>
              )}
            </>
          )}

          <button className="w-full py-6 md:py-10 bg-amber-400 text-slate-950 font-black rounded-2xl md:rounded-[3rem] shadow-2xl active-scale uppercase text-[10px] md:text-[14px] tracking-[0.4em] md:tracking-[0.6em] mt-8 md:mt-12 transition-all hover:bg-amber-300 shadow-amber-500/30">
            Confirmer l'Indexation
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Finances;
