
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Task, User, TaskStatus, Lead, Message, Project, SalaryRecord, Expense, AdCampaignExpense } from '../types';
import { BarChart3, TrendingUp, FileText, Printer, Calendar, Activity, Briefcase, TrendingDown, Landmark, X } from 'lucide-react';

const Reports: React.FC<any> = ({ 
  tasks = [], leads = [], messages = [], projects = [], 
  salaries = [], expenses = [], adCampaigns = [], currentUser 
}) => {
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  const financialGlobal = useMemo(() => {
    const totalRevenue = projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
    const totalSalaries = salaries.reduce((acc, s) => {
      const amount = (s.amount || 0) + (s.bonus || 0);
      return acc + (s.frequency === 'hebdo' ? amount * 4 : amount);
    }, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalAds = adCampaigns.reduce((acc, a) => acc + (a.amount || 0), 0);
    const totalCosts = totalSalaries + totalExpenses + totalAds;
    const netMargin = totalRevenue - totalCosts;
    const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

    return { totalRevenue, totalSalaries, totalExpenses, totalAds, totalCosts, netMargin, marginPercent };
  }, [projects, salaries, expenses, adCampaigns]);

  const projectAnalysis = useMemo(() => {
    return projects.map(p => {
      const pSalaries = salaries.filter(s => s.projectId === p.id).reduce((acc, s) => acc + (s.amount + (s.bonus || 0)), 0);
      const pExpenses = expenses.filter(e => e.projectId === p.id).reduce((acc, e) => acc + e.amount, 0);
      const pAds = adCampaigns.filter(a => a.projectId === p.id).reduce((acc, a) => acc + a.amount, 0);
      const cost = pSalaries + pExpenses + pAds;
      const margin = p.totalBudget - cost;
      return { ...p, cost, margin, marginPercent: p.totalBudget > 0 ? (margin / p.totalBudget) * 100 : 0 };
    });
  }, [projects, salaries, expenses, adCampaigns]);

  const analyticSummary = useMemo(() => {
    if (financialGlobal.marginPercent < 20) return "Rentabilité critique (<20%). Optimisation requise.";
    if (financialGlobal.marginPercent > 40) return "Performance financière exceptionnelle.";
    return "Structure financière saine conforme aux standards iVISION.";
  }, [financialGlobal]);

  const costDistributionData = [
    { name: 'Salaires (RH)', value: financialGlobal.totalSalaries, color: '#FBBF24' },
    { name: 'Frais Op.', value: financialGlobal.totalExpenses, color: '#38BDF8' },
    { name: 'ADS Marketing', value: financialGlobal.totalAds, color: '#34D399' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400 mb-2">DATA ANALYSIS & FINANCE</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Rapports</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowWeeklyModal(true)}
            className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl active-scale flex items-center space-x-3 text-[10px] tracking-[0.2em] uppercase transition-all hover:bg-white/10 shadow-xl"
          >
            <Calendar size={18} className="text-sky-400" />
            <span>Générer Bilan Hebdo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 blur-[100px] rounded-full"></div>
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Bénéfice Net Agence</p>
                <h3 className={`text-4xl md:text-7xl font-black tracking-tighter leading-none ${financialGlobal.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {financialGlobal.netMargin.toLocaleString()} <span className="text-xl md:text-2xl opacity-40">DZD</span>
                </h3>
                <div className="flex items-center space-x-4 mt-6">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${financialGlobal.netMargin >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                    Marge: {Math.round(financialGlobal.marginPercent)}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                 <div className="p-5 md:p-6 glass rounded-2xl md:rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center leading-none"><TrendingUp size={10} className="mr-1.5 text-sky-400"/> Chiffre d'Affaires</p>
                   <p className="text-base md:text-lg font-black text-white">{financialGlobal.totalRevenue.toLocaleString()}</p>
                 </div>
                 <div className="p-5 md:p-6 glass rounded-2xl md:rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center leading-none"><TrendingDown size={10} className="mr-1.5 text-amber-400"/> Dépenses</p>
                   <p className="text-base md:text-lg font-black text-white">{financialGlobal.totalCosts.toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="glass-card p-8 rounded-[3.5rem] flex flex-col justify-center items-center text-center group">
           <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={costDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                       {costDistributionData.map((e, idx) => <Cell key={idx} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Coûts</h4>
        </div>
      </div>

      <div className="glass p-10 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="flex items-center space-x-4 mb-6 md:mb-10 relative z-10">
             <div className="w-10 h-10 bg-sky-400 rounded-xl flex items-center justify-center text-slate-950 shadow-lg"><BarChart3 size={20} /></div>
             <h4 className="font-black text-white text-[10px] md:text-[11px] uppercase tracking-[0.3em] leading-none">Synthèse Analytique</h4>
           </div>
           <p className="text-xl md:text-2xl font-extrabold text-white leading-tight border-l-4 border-sky-400 pl-6 md:pl-10 relative z-10 max-w-4xl tracking-tight uppercase">{analyticSummary}</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 flex items-center leading-none">
          <Briefcase size={14} className="mr-3 text-emerald-400"/> Rentabilité par Activité
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {projectAnalysis.map(proj => (
            <div key={proj.id} className="glass group rounded-[2rem] md:rounded-[2.5rem] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between transition-all hover:bg-white/[0.03]">
               <div className="flex items-center space-x-6 w-full md:w-auto">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 font-black border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                   {proj.name.charAt(0)}
                 </div>
                 <div className="truncate">
                   <h4 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-tight truncate">{proj.name}</h4>
                   <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Budget: {proj.totalBudget.toLocaleString()} DZD</p>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-4 md:gap-8 mt-6 md:mt-0 w-full md:w-auto text-center md:text-left">
                  <div>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Coûts</p>
                    <p className="text-xs md:text-sm font-black text-rose-400">{proj.cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Marge</p>
                    <p className={`text-xs md:text-sm font-black ${proj.margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{proj.margin.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Ratio</p>
                    <p className={`text-xs md:text-sm font-black ${proj.marginPercent >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.round(proj.marginPercent)}%</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL BILAN - UNIFIED SYSTEM */}
      {showWeeklyModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer no-print" onClick={() => setShowWeeklyModal(false)}></div>
          <div className="modal-center-wrapper">
            <div className="modal-container max-w-4xl">
              <div className="modal-content-glass animate-fade-in">
                 <div className="flex justify-between items-center mb-8 md:mb-12 no-print">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-sky-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl"><FileText size={24} /></div>
                      <h3 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-tighter leading-none">Bilan de Performance</h3>
                    </div>
                    <button onClick={() => setShowWeeklyModal(false)} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
                 </div>

                 <div className="printable-report bg-white text-slate-950 p-6 md:p-14 rounded-[2rem] md:rounded-[3rem] shadow-2xl">
                    <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 md:pb-10 mb-8 md:mb-12">
                      <div>
                        <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase text-slate-950 leading-none">iVISION DATA</h1>
                        <p className="text-[8px] md:text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mt-2 leading-none">RAPPORT OPÉRATIONNEL</p>
                      </div>
                      <div className="text-right">
                         <p className="text-lg md:text-2xl font-extrabold text-slate-950 leading-none">{new Date().toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-8 md:mb-12">
                       <div className="p-6 md:p-10 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6 leading-none">Indicateurs Financiers</p>
                          <div className="space-y-4 md:space-y-6">
                             <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
                                <span className="text-base md:text-xl font-black">{financialGlobal.totalRevenue.toLocaleString()} DZD</span>
                             </div>
                             <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Coûts</span>
                                <span className="text-base md:text-xl font-black text-rose-500">-{financialGlobal.totalCosts.toLocaleString()} DZD</span>
                             </div>
                             <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Net</span>
                                <span className={`text-base md:text-xl font-black ${financialGlobal.netMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{financialGlobal.netMargin.toLocaleString()} DZD</span>
                             </div>
                          </div>
                       </div>
                       <div className="p-6 md:p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6 leading-none">Synthèse iVISION Intelligence</p>
                          <p className="text-sm md:text-lg font-black uppercase leading-tight text-slate-950">
                             {analyticSummary}
                          </p>
                       </div>
                    </div>
                    <button onClick={() => window.print()} className="no-print w-full py-5 md:py-7 bg-slate-900 text-white rounded-[1.8rem] md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] mt-4 md:mt-8 shadow-2xl active-scale">Imprimer Rapport PDF</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
