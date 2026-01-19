
import React, { useState, useMemo } from 'react';
import { Plus, X, Wallet, TrendingUp, Users, ShieldCheck, Edit3, Sparkles, Check, Clock, Trash2, Layers, Megaphone, Receipt, Plane, Globe, Briefcase, Type, DollarSign, Activity } from 'lucide-react';
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
    } else if (activeTab === 'ads') {
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
        <div className="text-left">
          <p className="text-[11px] md:text-[13px] font-bold uppercase text-amber-400 mb-4 tracking-normal">FINANCIAL CORE SYSTEM • v4.0</p>
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
                className={`flex-1 md:flex-none px-10 md:px-14 py-4 md:py-5 rounded-[2rem] text-[11px] md:text-[13px] font-bold uppercase flex items-center justify-center space-x-4 transition-all whitespace-nowrap tracking-normal ${activeTab === tab.id ? 'bg-amber-400 text-slate-950' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
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
                <button key={f} onClick={() => setFilterFreq(f as any)} className={`px-5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase transition-all tracking-normal ${filterFreq === f ? 'bg-white/10 text-white' : 'text-slate-600'}`}>{f}</button>
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
            <div className="mt-8 md:mt-12 relative z-10 text-left">
              <p className="text-[10px] md:text-[12px] font-bold text-slate-500 uppercase tracking-normal">{s.label}</p>
              <h4 className={`text-xl md:text-3xl font-black ${s.color} mt-2 md:mt-3 tracking-tight truncate leading-none`}>{s.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-10">
        {activeTab === 'salaires' && (
          <div className="space-y-6">
            {salaries.filter(s => filterFreq === 'all' || s.frequency === filterFreq).map(salary => {
              const user = users.find(u => u.id === salary.userId);
              const project = projects.find(p => p.id === salary.projectId);
              if (!user) return null;
              return (
                <div key={salary.id} className="crystal-module p-8 md:p-14 rounded-[3.5rem] md:rounded-[5rem] flex flex-col md:flex-row items-center justify-between group relative overflow-hidden hover:border-amber-400/30 transition-all">
                   <div className="flex items-center space-x-10 md:space-x-20 w-full md:w-auto text-left">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 md:w-40 md:h-40 bg-white/5 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center text-white font-black text-2xl md:text-6xl border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                        {user.name.substring(0, 1)}
                      </div>
                      <div className={`absolute -bottom-2 -right-2 w-8 h-8 md:w-14 md:h-14 rounded-full border-[6px] md:border-[10px] border-[#020617] flex items-center justify-center ${salary.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}>
                        {salary.status === 'paid' ? <Check size={24} className="text-white hidden md:block" /> : <Clock size={24} className="text-slate-950 hidden md:block" />}
                      </div>
                    </div>
                    <div className="truncate">
                      <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tight truncate leading-none">{user.name}</h3>
                      <p className="text-[11px] md:text-[14px] text-amber-400 font-bold uppercase mt-3 md:mt-5 truncate tracking-normal">{user.role}</p>
                      <div className="mt-8 md:mt-12 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
                        <span className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none">{(salary.amount + (salary.bonus || 0)).toLocaleString()} <span className="text-xs md:text-lg text-slate-600 font-bold">DZD</span></span>
                        {project && (
                          <span className="text-[10px] md:text-[12px] font-bold text-slate-400 uppercase flex items-center bg-white/5 px-6 py-2.5 rounded-full border border-white/5 tracking-normal">
                            <Layers size={14} className="mr-3 text-amber-400"/> {project.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 md:space-x-8 mt-10 md:mt-0 w-full md:w-auto justify-end">
                    {isAdmin && (
                      <>
                        <button onClick={() => onUpdateSalary({...salary, status: salary.status === 'paid' ? 'pending' : 'paid'})} className={`flex-1 md:flex-none px-10 md:px-20 py-5 md:py-8 rounded-[2rem] md:rounded-[3rem] text-[12px] md:text-[15px] font-bold uppercase transition-all active-scale tracking-normal ${salary.status === 'paid' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-white text-slate-950 hover:bg-emerald-400 hover:text-white'}`}>
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
          </div>
        )}

        {activeTab === 'frais' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expenses.map(expense => {
              const project = projects.find(p => p.id === expense.projectId);
              return (
                <div key={expense.id} className="crystal-module p-8 rounded-[3rem] border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center space-x-6 text-left truncate">
                    <div className="w-14 h-14 bg-sky-400/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-400/10">
                      <Receipt size={24} />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-white text-lg uppercase tracking-tight truncate">{expense.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-normal">{expense.type} {project ? `• ${project.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className="text-xl font-black text-white">{expense.amount.toLocaleString()} <span className="text-[10px] text-slate-500">DZD</span></span>
                    {isAdmin && (
                      <button onClick={() => confirm('Supprimer ce frais ?') && onDeleteExpense(expense.id)} className="p-4 glass rounded-xl text-slate-600 hover:text-rose-400 transition-all"><Trash2 size={20}/></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adCampaigns.map(ad => {
              const project = projects.find(p => p.id === ad.projectId);
              return (
                <div key={ad.id} className="crystal-module p-8 rounded-[3rem] border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center space-x-6 text-left truncate">
                    <div className="w-14 h-14 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-400/10">
                      <Megaphone size={24} />
                    </div>
                    <div className="truncate">
                      <h3 className="font-black text-white text-lg uppercase tracking-tight truncate">{ad.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-normal">{ad.platform} {project ? `• ${project.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <span className="text-xl font-black text-white block">{ad.amount.toLocaleString()} <span className="text-[10px] text-slate-500">DZD</span></span>
                      <span className={`text-[9px] font-black uppercase ${ad.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>{ad.status}</span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => confirm('Supprimer ce budget ADS ?') && onDeleteAdCampaign(ad.id)} className="p-4 glass rounded-xl text-slate-600 hover:text-rose-400 transition-all"><Trash2 size={20}/></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'salaires' && salaries.length === 0 && (
          <div className="crystal-module p-32 rounded-[5rem] text-center flex flex-col items-center opacity-30">
             <Users size={64} className="text-slate-800 mb-8" />
             <p className="text-[12px] font-bold uppercase">Registre iV Vierge</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={viewMode === 'add' || viewMode === 'edit'} 
        onClose={closeModals}
        title={getModalTitle()}
        subtitle="Moteur de Gestion Financière iVISION"
      >
        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          {activeTab === 'salaires' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-iv"><Users size={14} className="text-amber-400"/> Membre Équipe</label>
                  <select disabled={viewMode === 'edit'} className="input-iv appearance-none cursor-pointer disabled:opacity-50" value={salaryForm.userId} onChange={e => setSalaryForm({...salaryForm, userId: e.target.value})}>
                    <option value="">Choisir un membre...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-iv"><Briefcase size={14} className="text-amber-400"/> Projet Affecté</label>
                  <select className="input-iv appearance-none cursor-pointer" value={salaryForm.projectId} onChange={e => setSalaryForm({...salaryForm, projectId: e.target.value})}>
                    <option value="">Frais Généraux iV</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-iv"><DollarSign size={14} className="text-amber-400"/> Base Salaire (DZD)</label>
                  <input type="number" className="input-iv" placeholder="0" value={salaryForm.amount} onChange={e => setSalaryForm({...salaryForm, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="label-iv"><Sparkles size={14} className="text-amber-400"/> Bonus de Performance</label>
                  <input type="number" className="input-iv" placeholder="0" value={viewMode === 'edit' ? bonusToAdd : salaryForm.bonus} onChange={e => viewMode === 'edit' ? setBonusToAdd(Number(e.target.value)) : setSalaryForm({...salaryForm, bonus: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-iv"><Clock size={14} className="text-amber-400"/> Fréquence Flux</label>
                  <select className="input-iv appearance-none" value={salaryForm.frequency} onChange={e => setSalaryForm({...salaryForm, frequency: e.target.value as any})}>
                    <option value="mensuel">Mensuel</option>
                    <option value="hebdo">Hebdomadaire</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-iv"><Activity size={14} className="text-amber-400"/> Statut Paiement</label>
                  <select className="input-iv appearance-none" value={salaryForm.status} onChange={e => setSalaryForm({...salaryForm, status: e.target.value as any})}>
                    <option value="pending">En attente</option>
                    <option value="paid">Réglé</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'frais' && (
            <>
              <div className="space-y-2">
                <label className="label-iv"><Type size={14} className="text-amber-400"/> Désignation du Frais</label>
                <input required className="input-iv" placeholder="Ex: Abonnement ChatGPT Team" value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-iv"><DollarSign size={14} className="text-amber-400"/> Montant (DZD)</label>
                  <input type="number" required className="input-iv" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="label-iv"><Briefcase size={14} className="text-amber-400"/> Affectation Projet</label>
                  <select className="input-iv appearance-none" value={expenseForm.projectId} onChange={e => setExpenseForm({...expenseForm, projectId: e.target.value})}>
                    <option value="">Frais Structure iV</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-iv"><Layers size={14} className="text-amber-400"/> Catégorie de Dépense</label>
                <select className="input-iv appearance-none" value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value as any})}>
                  <option value="software">Logiciels / SaaS</option>
                  <option value="freelance">Freelance / Externe</option>
                  <option value="travel">Déplacement / Logistique</option>
                  <option value="office">Bureau / Matériel</option>
                  <option value="other">Autre / Divers</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'ads' && (
            <>
              <div className="space-y-2">
                <label className="label-iv"><Megaphone size={14} className="text-amber-400"/> Nom de la Campagne</label>
                <input required className="input-iv" placeholder="Ex: Retargeting Facebook Q4" value={adsForm.name} onChange={e => setAdsForm({...adsForm, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-iv"><Globe size={14} className="text-amber-400"/> Plateforme ADS</label>
                  <select className="input-iv appearance-none" value={adsForm.platform} onChange={e => setAdsForm({...adsForm, platform: e.target.value as any})}>
                    <option value="facebook">Facebook / Instagram</option>
                    <option value="google">Google Ads (Search/GDN)</option>
                    <option value="tiktok">TikTok Ads</option>
                    <option value="instagram">Instagram Ads Only</option>
                    <option value="other">Autre Réseau</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-iv"><DollarSign size={14} className="text-amber-400"/> Budget Engagé (DZD)</label>
                  <input type="number" required className="input-iv" placeholder="0" value={adsForm.amount} onChange={e => setAdsForm({...adsForm, amount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-iv"><Briefcase size={14} className="text-amber-400"/> Projet Marketing</label>
                  <select className="input-iv appearance-none" value={adsForm.projectId} onChange={e => setAdsForm({...adsForm, projectId: e.target.value})}>
                    <option value="">Frais Marketing Interne</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-iv"><Activity size={14} className="text-amber-400"/> Statut Campagne</label>
                  <select className="input-iv appearance-none" value={adsForm.status} onChange={e => setAdsForm({...adsForm, status: e.target.value as any})}>
                    <option value="active">Active</option>
                    <option value="paused">En Pause</option>
                    <option value="completed">Clôturée</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="w-full py-7 bg-amber-400 text-slate-950 font-black rounded-[2.5rem] shadow-2xl shadow-amber-400/10 active-scale uppercase text-[11px] tracking-tight mt-6 transition-all hover:bg-amber-300">
             {viewMode === 'add' ? 'Déployer le Flux' : 'Confirmer les Modifications'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Finances;
