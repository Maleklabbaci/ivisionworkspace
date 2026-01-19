
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { Task, User, TaskStatus, Lead, Message, Project, SalaryRecord, Expense, AdCampaignExpense } from '../types';
import { BarChart3, TrendingUp, Target, Wand2, Sparkles, Loader2, ArrowUpRight, FileText, Printer, Calendar, Zap, CheckCircle2, X, Activity, Plus, Wallet, PieChart as PieIcon, Briefcase, TrendingDown, Landmark } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';

interface ReportsProps {
  tasks: Task[];
  leads: Lead[];
  messages: Message[];
  projects: Project[];
  salaries: SalaryRecord[];
  expenses: Expense[];
  adCampaigns: AdCampaignExpense[];
  currentUser: User;
}

const Reports: React.FC<ReportsProps> = ({ 
  tasks = [], leads = [], messages = [], projects = [], 
  salaries = [], expenses = [], adCampaigns = [], currentUser 
}) => {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [strategyReport, setStrategyReport] = useState<string | null>(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [weeklyAiSummary, setWeeklyAiSummary] = useState<string>("");
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  // --- CALCULS FINANCIERS GLOBAUX ---
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

  // --- ANALYSE PAR PROJET ---
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

  // Statistiques de base pour les graphes
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    return {
      completion: total ? Math.round((done / total) * 100) : 0,
      pipeline: leads.reduce((acc: number, curr: any) => acc + (Number(curr.valueMin) || 0), 0),
      conversion: leads.length ? Math.round((leads.filter((l: any) => l.status === 'qualified').length / leads.length) * 100) : 0
    };
  }, [tasks, leads]);

  const costDistributionData = [
    { name: 'Salaires (RH)', value: financialGlobal.totalSalaries, color: '#FBBF24' },
    { name: 'Frais Op.', value: financialGlobal.totalExpenses, color: '#38BDF8' },
    { name: 'ADS Marketing', value: financialGlobal.totalAds, color: '#34D399' }
  ].filter(d => d.value > 0);

  const taskData = useMemo(() => [
    { name: 'À FAIRE', val: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#475569' },
    { name: 'EN COURS', val: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#818CF8' },
    { name: 'TERMINÉ', val: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#34D399' }
  ].filter(d => d.val > 0), [tasks]);

  const handleAnalyticMagic = async () => {
    setIsAnalysing(true);
    try {
      const insight = await generateMarketingInsight(`KPIs: Revenue ${financialGlobal.totalRevenue} DZD, Costs ${financialGlobal.totalCosts} DZD, Margin ${financialGlobal.netMargin} DZD (${Math.round(financialGlobal.marginPercent)}%).`);
      setStrategyReport(insight);
    } catch (err) { console.error(err); } finally { setIsAnalysing(false); }
  };

  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingWeekly(true);
    setShowWeeklyModal(true);
    try {
      const prompt = `Rédige un rapport hebdomadaire pour iVISION. 
      Finances : CA ${financialGlobal.totalRevenue}, Coûts ${financialGlobal.totalCosts}, Marge ${financialGlobal.netMargin}.
      Workflow : ${tasks.filter(t => t.status === TaskStatus.DONE).length} terminées.
      Leads : ${leads.length} prospects.
      Résumé pro, analytique, 3 points clés.`;
      
      const summary = await generateMarketingInsight(prompt);
      setWeeklyAiSummary(summary);
    } catch (err) { console.error(err); } finally { setIsGeneratingWeekly(false); }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400 mb-2">INTELLIGENCE & FINANCE CORE</p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Rapports</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleGenerateWeeklyReport}
            className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl active-scale flex items-center space-x-3 text-[10px] tracking-[0.2em] uppercase transition-all hover:bg-white/10"
          >
            <Calendar size={18} className="text-sky-400" />
            <span>Rapport Hebdo</span>
          </button>
          <button onClick={handleAnalyticMagic} disabled={isAnalysing} className="px-8 py-4 bg-pink-400 text-white font-black rounded-2xl shadow-2xl shadow-pink-500/30 active-scale flex items-center space-x-3 text-[10px] tracking-[0.2em] uppercase transition-all hover:scale-105">
            {isAnalysing ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>}
            <span>{isAnalysing ? "Calcul..." : "Stratégie IA"}</span>
          </button>
        </div>
      </div>

      {/* BILAN FINANCIER GLOBAL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 blur-[100px] rounded-full"></div>
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Bénéfice Net Agence (Net Profit)</p>
                <h3 className={`text-5xl md:text-7xl font-black tracking-tighter ${financialGlobal.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {financialGlobal.netMargin.toLocaleString()} <span className="text-2xl opacity-40">DZD</span>
                </h3>
                <div className="flex items-center space-x-4 mt-6">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${financialGlobal.netMargin >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                    Marge: {Math.round(financialGlobal.marginPercent)}%
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                    Flux iVISION v3.0
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                 <div className="p-6 glass rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center"><TrendingUp size={10} className="mr-1.5 text-sky-400"/> Chiffre d'Affaires</p>
                   <p className="text-lg font-black text-white">{financialGlobal.totalRevenue.toLocaleString()}</p>
                 </div>
                 <div className="p-6 glass rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center"><TrendingDown size={10} className="mr-1.5 text-amber-400"/> Dépenses Totales</p>
                   <p className="text-lg font-black text-white">{financialGlobal.totalCosts.toLocaleString()}</p>
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
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Répartition des Coûts</h4>
        </div>
      </div>

      {strategyReport && (
        <div className="glass p-12 rounded-[4rem] border border-pink-400/20 shadow-2xl animate-fade-in bg-gradient-to-br from-pink-400/10 via-slate-900/40 to-transparent relative overflow-hidden group">
           <div className="absolute -top-12 -right-12 w-44 h-44 bg-pink-400/10 blur-[60px] rounded-full"></div>
           <div className="flex items-center space-x-4 mb-10 relative z-10">
             <div className="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20} /></div>
             <h4 className="font-black text-pink-400 text-[11px] uppercase tracking-[0.3em]">Insights Financiers IA</h4>
           </div>
           <p className="text-2xl font-extrabold text-white leading-tight italic border-l-4 border-pink-400 pl-10 relative z-10 max-w-4xl tracking-tight">{strategyReport}</p>
        </div>
      )}

      {/* ANALYSE DÉTAILLÉE PAR PROJET */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 flex items-center">
          <Briefcase size={14} className="mr-3 text-emerald-400"/> Performance par Activité
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {projectAnalysis.map(proj => (
            <div key={proj.id} className="glass group rounded-[2.5rem] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between transition-all hover:bg-white/[0.03]">
               <div className="flex items-center space-x-6 w-full md:w-auto">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 font-black border border-white/10 group-hover:scale-110 transition-transform">
                   {proj.name.charAt(0)}
                 </div>
                 <div>
                   <h4 className="text-xl font-extrabold text-white uppercase tracking-tight">{proj.name}</h4>
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Budget: {proj.totalBudget.toLocaleString()} DZD</p>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-8 mt-6 md:mt-0 w-full md:w-auto text-center md:text-left">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Coûts Engagés</p>
                    <p className="text-sm font-black text-rose-400">{proj.cost.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Marge Nette</p>
                    <p className={`text-sm font-black ${proj.margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{proj.margin.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rentabilité</p>
                    <p className={`text-sm font-black ${proj.marginPercent >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.round(proj.marginPercent)}%</p>
                  </div>
               </div>
            </div>
          ))}
          {projects.length === 0 && (
             <div className="py-20 text-center glass rounded-[3rem] opacity-20 flex flex-col items-center">
                <Landmark size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aucune donnée projet indexée</p>
             </div>
          )}
        </div>
      </div>

      {/* SECTION WORKFLOW GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10">
         <div className="glass p-12 rounded-[4rem] border border-white/5 min-h-[450px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-12 flex items-center relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400 mr-4 shadow-[0_0_10px_#f472b6]" /> Cycle Opérationnel
            </h3>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={taskData} cx="50%" cy="50%" innerRadius={90} outerRadius={125} paddingAngle={10} dataKey="val">
                       {taskData.map((e, idx) => <Cell key={idx} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '10px' }} />
                 </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="glass p-12 rounded-[4rem] border border-white/5 min-h-[450px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-12 flex items-center relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-4 shadow-[0_0_10px_#38bdf8]" /> Intensité Missions
            </h3>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={taskData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: '#020617', border: 'none', borderRadius: '24px', fontSize: '10px' }} />
                    <Bar dataKey="val" fill="#818CF8" radius={[15, 15, 0, 0]} barSize={50}>
                       {taskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* MODAL RAPPORT HEBDOMADAIRE (VUE PDF / IMPRESSSION) */}
      {showWeeklyModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer no-print" onClick={() => setShowWeeklyModal(false)}></div>
          <div className="modal-container max-w-4xl relative z-10">
            <div className="glass bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 shadow-2xl p-6 md:p-16 animate-fade-in overflow-hidden">
               <div className="flex justify-between items-center mb-10 no-print">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-sky-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl"><FileText size={24} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Export Stratégique</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Génération iVISION System</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => window.print()} className="p-4 bg-sky-400 text-slate-950 rounded-2xl font-black active-scale flex items-center space-x-2 transition-all hover:bg-sky-300">
                      <Printer size={20} />
                      <span className="text-[10px] uppercase tracking-widest hidden md:inline">Imprimer / PDF</span>
                    </button>
                    <button onClick={() => setShowWeeklyModal(false)} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-2xl flex items-center justify-center transition-all active-scale"><X size={24}/></button>
                  </div>
               </div>

               <div className="printable-report bg-white text-slate-950 p-8 md:p-12 rounded-[2rem] shadow-inner border border-white/5">
                  <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
                    <div>
                      <div className="w-14 h-14 bg-sky-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4">iV</div>
                      <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-950">Bilan d'Activité</h1>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mt-1">iVISION MARKETING AGENCY</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date du Bilan</p>
                       <p className="text-xl font-extrabold text-slate-950 mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-12">
                     <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Financière</p>
                        <div className="space-y-4">
                           <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-xs font-bold text-slate-500">Chiffre d'Affaires</span>
                              <span className="text-sm font-black">{financialGlobal.totalRevenue.toLocaleString()} DZD</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-xs font-bold text-slate-500">Coûts Totaux</span>
                              <span className="text-sm font-black text-rose-500">-{financialGlobal.totalCosts.toLocaleString()} DZD</span>
                           </div>
                           <div className="flex justify-between pt-2">
                              <span className="text-sm font-black uppercase">Résultat Net</span>
                              <span className="text-lg font-black text-emerald-500">{financialGlobal.netMargin.toLocaleString()} DZD</span>
                           </div>
                        </div>
                     </div>
                     <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Synthèse IA</p>
                        <p className="text-sm font-medium leading-relaxed italic text-slate-700">
                           {weeklyAiSummary || "Génération des insights en cours..."}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Top Activités (Marge)</h4>
                     {projectAnalysis.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                           <span className="text-xs font-bold uppercase">{p.name}</span>
                           <span className="text-xs font-black text-emerald-500">{Math.round(p.marginPercent)}% ROI</span>
                        </div>
                     ))}
                  </div>

                  <div className="mt-16 pt-10 border-t-2 border-slate-100 flex justify-between items-center opacity-40 grayscale">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Généré par iVISION Engine v3.0</p>
                    <div className="flex items-center space-x-2">
                       <Activity size={12} />
                       <span className="text-[8px] font-black uppercase tracking-widest">Rapport Certifié Authentique</span>
                    </div>
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
