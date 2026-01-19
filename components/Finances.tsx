
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
    if (activeTab === 'salaires') return viewMode === 'edit' ? 'Mise à jour Flux' : 'Indexation Flux';
    if (activeTab === 'frais') return 'Nouveau Frais Op.';
    return 'Indexation ADS';
  };

  return (
    <div className="space-y-10 md:space-y-16 animate-fade-in pb-24">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2 md:px-4">
        <div>
          <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-amber-400 mb-4">FINANCIAL CORE SYSTEM • v4.0</p>
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">Finance</h2>
          
          <div className="flex bg-white/5 p-1.5 rounded-[2.5rem] border border-white/5 mt-10 md:mt-12 w-full md:w-fit overflow-x-auto no-scrollbar">
            {[
              { id: 'salaires', label: 'Salaires', icon: Users },
              { id: 'frais', label: 'Dépenses', icon: Receipt },
              { id: 'ads', label: 'ADS', icon: Megaphone }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setViewMode('list'); }} 
                className={`flex-1 md:flex-none px-10 md:px-14 py-4 md:py-5 rounded-[2rem] text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center space-x-4 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-400 text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.2)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                <tab.icon size={18}/>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end space-x-6">
          {activeTab === 'salaires' && (
            <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10">
              {['all', 'hebdo', 'mensuel'].map(f => (
                <button key={f} onClick={() => setFilterFreq(f as any)} className={`px-5 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filterFreq === f ? 'bg-white/10 text-white' : 'text-slate-600'}`}>{f}</button>
              ))}
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setViewMode('add')} className="w-16 h-16 md:w-24 md:h-24 bg-amber-400 text-slate-950 rounded-[2rem] md:rounded-[3rem] shadow-2xl active-scale flex items-center justify-center hover:scale-110 transition-transform">
              <Plus size={36} strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">
        {[
          { label: 'Flux Salarial', val: `${financialStats.salaryTotal.toLocaleString()} DZD`, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Frais Op.', val: `${financialStats.expenseTotal.toLocaleString()} DZD`, icon: Receipt, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Budget ADS', val: `${financialStats.adsTotal.toLocaleString()} DZD`, icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Burn Rate', val: `${financialStats.grandTotal.toLocaleString()} DZD`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-400/10' }
        ].map((s, i) => (
          <div key={i} className="crystal-module p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col justify-between group relative overflow-hidden h-44 md:h-56">
            <div className={`absolute top-0 right-0 w-40 h-40 ${s.bg} blur-[60px] md:blur-[80px] opacity-40 translate-x-12 -translate-y-12 group-hover:opacity-60 transition-opacity`}></div>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.8rem] ${s.bg} flex items-center justify-center ${s.color} border border-white/5 transition-transform group-hover:scale-110 relative z-10`}>
              <s.icon size={28} />
            </div>
            <div className="mt-8 md:mt-12 relative z-10">
              <p className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">{s.label}</p>
              <h4 className={`text-xl md:text-3xl font-black ${s.color} mt-2 md:mt-3 tracking-tighter truncate leading-none`}>{s.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-10">
        {activeTab === 'salaires' && salaries.filter(s => filterFreq === 'all' || s.frequency === filterFreq).map(salary => {
          const user = users.find(u => u.id === salary.userId);
          const project = projects.find(p => p.id === salary.projectId);
          if (!user) return null;
          return (
            <div key={salary.id} className="crystal-module p-8 md:p-14 rounded-[3.5rem] md:rounded-[5rem] flex flex-col md:flex-row items-center justify-between group relative overflow-hidden hover:border-amber-400/30 transition-all">
               <div className="flex items-center space-x-10 md:space-x-20 w-full md:w-auto">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 md:w-40 md:h-40 bg-white/5 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center text-white font-black text-2xl md:text-6xl border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                    {user.name.substring(0, 1)}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 md:w-14 md:h-14 rounded-full border-[6px] md:border-[10px] border-[#020617] flex items-center justify-center ${salary.status === 'paid' ? 'bg-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]' : 'bg-amber-400 animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.4)]'}`}>
                    {salary.status === 'paid' ? <Check size={24} className="text-white hidden md:block" /> : <Clock size={24} className="text-slate-950 hidden md:block" />}
                  </div>
                </div>
                <div className="truncate">
                  <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter truncate leading-none">{user.name}</h3>
                  <p className="text-[10px] md:text-[13px] text-amber-400 font-black uppercase tracking-[0.5em] mt-3 md:mt-5 truncate">{user.role}</p>
                  <div className="mt-8 md:mt-12 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
                    <span className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none">{(salary.amount + (salary.bonus || 0)).toLocaleString()} <span className="text-xs md:text-lg text-slate-600">DZD</span></span>
                    {project && (
                      <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center bg-white/5 px-6 py-2.5 rounded-full border border-white/5">
                        <Layers size={14} className="mr-3 text-amber-400"/> {project.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 md:space-x-8 mt-10 md:mt-0 w-full md:w-auto justify-end">
                {isAdmin && (
                  <>
                    <button onClick={() => onUpdateSalary({...salary, status: salary.status === 'paid' ? 'pending' : 'paid'})} className={`flex-1 md:flex-none px-10 md:px-20 py-5 md:py-8 rounded-[2rem] md:rounded-[3rem] text-[11px] md:text-[15px] font-black uppercase tracking-[0.4em] transition-all active-scale shadow-2xl ${salary.status === 'paid' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 shadow-[inset_0_0_20px_rgba(52,211,153,0.05)]' : 'bg-white text-slate-950 hover:bg-emerald-400 hover:text-white'}`}>
                      {salary.status === 'paid' ? 'INDEXÉ' : 'RÉGLER'}
                    </button>
                    <button onClick={() => { setSalaryForm(salary); setBonusToAdd(0); setViewMode('edit'); }} className="w-16 h-16 md:w-24 md:h-24 bg-white/5 border border-white/10 text-amber-400 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center hover:bg-white/10 transition-all active-scale">
                      <Edit3 size={24} className="md:w-10 md:h-10"/>
                    </button>
                  </>
                )}
                {isAdmin && <button onClick={() => confirm('Supprimer ce flux ?') && onDeleteSalary(salary.id)} className="w-16 h-16 md:w-24 md:h-24 bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center transition-all active-scale"><Trash2 size={24} className="md:w-10 md:h-10" /></button>}
              </div>
            </div>
          );
        })}
        {activeTab === 'salaires' && salaries.length === 0 && (
          <div className="crystal-module p-32 rounded-[5rem] text-center flex flex-col items-center opacity-30">
             <Users size={64} className="text-slate-800 mb-8" />
             <p className="text-[12px] font-black uppercase tracking-[0.5em]">Registre iV Vierge</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={viewMode !== 'list'} 
        onClose={closeModals}
        title={getModalTitle()}
        subtitle="Architecture Financière iVISION Crystal"
      >
        <form onSubmit={handleSubmit} className="space-y-10 md:space-y-14">
          <div className="space-y-4 md:space-y-6">
            <label className="label-iv"><Layers size={14} className="text-amber-400"/> Affectation Centre de Flux</label>
            <select 
              className="w-full p-6 md:p-10 bg-slate-900/80 border border-white/10 rounded-[2rem] md:rounded-[3rem] font-black text-white outline-none focus:border-amber-400 transition-all text-xs md:text-sm appearance-none cursor-pointer" 
              value={activeTab === 'salaires' ? salaryForm.projectId : activeTab === 'frais' ? expenseForm.projectId : adsForm.projectId} 
              onChange={e => {
                if(activeTab === 'salaires') setSalaryForm({...salaryForm, projectId: e.target.value});
                else if(activeTab === 'frais') setExpenseForm({...expenseForm, projectId: e.target.value});
                else setAdsForm({...adsForm, projectId: e.target.value});
              }}
            >
              <option value="">STRUCTURE INTERNE iVISION GLOBAL</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
            </select>
          </div>

          {activeTab === 'salaires' && (
            <>
              <div className="space-y-4 md:space-y-6">
                <label className="label-iv"><Users size={14} className="text-amber-400"/> Collaborateur Cible</label>
                <select required disabled={viewMode === 'edit'} className="w-full p-6 md:p-10 bg-slate-900/80 border border-white/10 rounded-[2rem] md:rounded-[3rem] font-black text-white outline-none focus:border-amber-400 transition-all text-xs md:text-sm appearance-none cursor-pointer disabled:opacity-30" value={salaryForm.userId} onChange={e => setSalaryForm({...salaryForm, userId: e.target.value})}>
                  <option value="">SÉLECTIONNER UN MEMBRE ÉQUIPE...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4 md:space-y-6">
                  <label className="label-iv"><DollarSign size={14} className="text-amber-400"/> Volume Flux (DZD)</label>
                  <input type="number" required className="w-full p-6 md:p-10 bg-slate-900/80 border border-white/10 rounded-[2rem] md:rounded-[3rem] text-white font-black outline-none focus:border-amber-400 transition-all text-xs md:text-sm" value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-4 md:space-y-6">
                  <label className="label-iv"><Clock size={14} className="text-amber-400"/> Cadence Flux</label>
                  <select className="w-full p-6 md:p-10 bg-slate-900/80 border border-white/10 rounded-[2rem] md:rounded-[3rem] font-black text-white outline-none text-xs md:text-sm appearance-none cursor-pointer" value={salaryForm.frequency} onChange={e => setSalaryForm({...salaryForm, frequency: e.target.value as any})}>
                    <option value="hebdo">HEBDOMADAIRE (Flux court)</option>
                    <option value="mensuel">MENSUEL (Flux standard)</option>
                  </select>
                </div>
              </div>
              {viewMode === 'edit' && (
                <div className="p-10 md:p-14 bg-emerald-400/5 rounded-[3rem] md:rounded-[5rem] border border-emerald-400/10 shadow-inner">
                  <h4 className="text-[10px] md:text-[12px] font-black text-emerald-400 uppercase tracking-[0.6em] mb-8 md:mb-10 flex items-center leading-none justify-center"><Sparkles size={20} className="mr-4"/> Injection Bonus Performance</h4>
                  <input type="number" className="w-full p-6 md:p-10 bg-slate-950 border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] text-emerald-400 font-black outline-none text-lg md:text-3xl text-center" placeholder="MONTANT BONUS..." value={bonusToAdd === 0 ? '' : bonusToAdd} onChange={e => setBonusToAdd(Number(e.target.value))} />
                </div>
              )}
            </>
          )}

          <button className="w-full py-8 md:py-14 bg-amber-400 text-slate-950 font-black rounded-[2.5rem] md:rounded-[5rem] shadow-2xl active-scale uppercase text-[12px] md:text-[18px] tracking-[0.5em] md:tracking-[0.8em] mt-10 md:mt-16 transition-all hover:bg-white shadow-amber-500/20">
            Confirmer l'Indexation iV
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Finances;
