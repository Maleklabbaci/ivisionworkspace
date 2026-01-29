import React, { useState, useMemo, useRef } from 'react';
import { Task, User, TaskStatus, Lead, Project, SalaryRecord, Expense, AdCampaignExpense } from '../types';
import { 
  TrendingUp, TrendingDown, Zap, Users, Briefcase, 
  Download, DollarSign, CheckCircle2, 
  Activity, FileText, X, Clock, ListChecks, ArrowUpRight, BarChart3, Target, Calendar, AlertTriangle, Printer, ClipboardList, Receipt, ShieldCheck, PieChart, Star, Megaphone, Loader2
} from 'lucide-react';
import Modal from './Modal';

declare var html2pdf: any;

const Reports: React.FC<any> = ({ 
  tasks = [], leads = [], messages = [], projects = [], 
  salaries = [], expenses = [], adCampaigns = [], users = [], currentUser 
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState<7 | 30>(30);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- LOGIQUE DE FILTRAGE TEMPOREL ---
  const getDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const isWithinRange = (dateStr?: string, days: number = 30) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date >= getDaysAgo(days);
  };

  // --- MOTEUR ANALYTIQUE ---
  const analytics = useMemo(() => {
    const rangeTasks = tasks.filter((t: any) => isWithinRange(t.createdAt || t.dueDate, exportRange));
    const rangeLeads = leads.filter((l: any) => isWithinRange(l.createdAt, exportRange));
    const rangeExpenses = expenses.filter((e: any) => isWithinRange(e.createdAt, exportRange));
    const rangeAds = adCampaigns.filter((a: any) => isWithinRange(a.createdAt, exportRange));
    
    // Calcul Financier Global
    const activeProjects = projects.filter(p => p.status === 'active');
    const revenue = activeProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);

    const monthlySalaries = salaries.reduce((acc, s) => {
      const base = (s.amount || 0) + (s.bonus || 0);
      return acc + (s.frequency === 'hebdo' ? base * 4 : base);
    }, 0);
    
    const operationalCosts = rangeExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const adsCosts = rangeAds.reduce((acc, a) => acc + (a.amount || 0), 0);
    
    const totalCosts = monthlySalaries + operationalCosts + adsCosts;
    const netMargin = revenue - totalCosts;

    // Performance Projets (ROI)
    const projectPerformance = activeProjects.map(p => {
      const projExpenses = expenses.filter(e => e.projectId === p.id).reduce((acc, e) => acc + (e.amount || 0), 0);
      const projAds = adCampaigns.filter(a => a.projectId === p.id).reduce((acc, a) => acc + (a.amount || 0), 0);
      const projSalaries = salaries.filter(s => s.projectId === p.id).reduce((acc, s) => {
         const total = (s.amount || 0) + (s.bonus || 0);
         return acc + (s.frequency === 'hebdo' ? total * 4 : total);
      }, 0);
      const spent = projExpenses + projAds + projSalaries;
      const progress = p.totalBudget > 0 ? (spent / p.totalBudget) * 100 : 0;
      return { ...p, spent, progress, margin: p.totalBudget - spent };
    }).sort((a, b) => b.spent - a.spent);

    // Performance Équipe
    const teamStats = users.map(u => {
      const userTasks = rangeTasks.filter((t: Task) => t.assigneeId === u.id);
      const validated = userTasks.filter((t: Task) => t.status === TaskStatus.DONE);
      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        total: userTasks.length,
        done: validated.length,
        efficiency: userTasks.length > 0 ? Math.round((validated.length / userTasks.length) * 100) : 0
      };
    }).sort((a, b) => b.efficiency - a.efficiency);

    // Flux d'activité récent (10 derniers événements)
    const recentActivity = [
      ...rangeTasks.map(t => ({ type: 'task', date: t.createdAt || t.dueDate, label: t.title, status: t.status, user: users.find(u => u.id === t.assigneeId)?.name })),
      ...rangeLeads.map(l => ({ type: 'lead', date: l.createdAt, label: `Nouveau Lead: ${l.name}`, status: l.status, user: 'CRM System' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      revenue,
      costs: totalCosts,
      margin: netMargin,
      salaryCost: monthlySalaries,
      opCost: operationalCosts,
      adCost: adsCosts,
      tasks: rangeTasks,
      leads: rangeLeads,
      expenses: rangeExpenses,
      ads: rangeAds,
      team: teamStats,
      projects: projectPerformance,
      activity: recentActivity,
      productivity: rangeTasks.length > 0 ? Math.round((rangeTasks.filter((t: Task) => t.status === TaskStatus.DONE).length / rangeTasks.length) * 100) : 0
    };
  }, [tasks, leads, projects, salaries, expenses, adCampaigns, exportRange, users]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    const element = reportRef.current.querySelector('.report-pdf-content');
    const opt = {
      margin: 10,
      filename: `iVISION_Audit_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erreur téléchargement PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-24 px-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-left">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2 leading-none">Intelligence Hub iV</p>
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">Rapports</h2>
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <ShieldCheck size={14} className="text-emerald-400" />
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Système Audité</span>
             </div>
             <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
               <Clock size={14} className="text-slate-400" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dernière MaJ: {new Date().toLocaleTimeString()}</span>
             </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowExportModal(true)}
          className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[11px] uppercase flex items-center space-x-4 shadow-2xl active-scale hover:bg-sky-400 hover:text-white transition-all tracking-widest border-4 border-sky-500/20"
        >
          <Download size={20} />
          <span>Générer Audit Expert (PDF)</span>
        </button>
      </header>

      {/* Grid Principal - KPI Stratégiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Revenu Sous Gestion', val: analytics.revenue, color: 'text-white', icon: DollarSign, bg: 'bg-white/5' },
          { label: 'Indice de Burn Rate', val: analytics.costs, color: 'text-rose-400', icon: TrendingDown, bg: 'bg-rose-400/10' },
          { label: 'Profitabilité Nette', val: analytics.margin, color: 'text-emerald-400', icon: TrendingUp, bg: 'bg-emerald-400/10' },
          { label: 'Efficience Opérationnelle', val: analytics.productivity + '%', color: 'text-sky-400', icon: Zap, bg: 'bg-sky-400/10' }
        ].map((s, i) => (
          <div key={i} className="crystal-module p-8 rounded-[2.5rem] flex flex-col justify-between h-44 text-left group hover:translate-y-[-4px] transition-all duration-500">
             <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} border border-white/5 shadow-inner`}><s.icon size={24} /></div>
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{s.label}</p>
               <h4 className={`text-xl md:text-2xl font-black ${s.color} tracking-tight`}>{typeof s.val === 'number' ? s.val.toLocaleString() : s.val} {typeof s.val === 'number' && 'DZD'}</h4>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Projets */}
        <div className="lg:col-span-2 space-y-8">
          <section className="crystal-module rounded-[3rem] p-8 md:p-10 border-white/5 text-left">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center">
                <Briefcase className="mr-3 text-emerald-400" size={24}/>
                Santé des Projets
              </h3>
              <span className="text-[10px] font-black text-slate-500 uppercase">{analytics.projects.length} ACTIFS</span>
            </div>
            <div className="space-y-6">
              {analytics.projects.slice(0, 5).map(p => (
                <div key={p.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[13px] font-bold text-white uppercase truncate max-w-[200px]">{p.name}</p>
                      <p className="text-[9px] font-black text-slate-600 uppercase mt-1">Budget: {p.totalBudget.toLocaleString()} DZD</p>
                    </div>
                    <p className={`text-[11px] font-black ${p.margin < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {p.margin > 0 ? '+' : ''}{p.margin.toLocaleString()} DZD
                    </p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-1000 ${p.progress > 90 ? 'bg-rose-500' : p.progress > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(p.progress, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="crystal-module rounded-[3rem] p-8 md:p-10 border-white/5 text-left">
             <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center mb-8">
                <Activity className="mr-3 text-sky-400" size={24}/>
                Journal d'Activité iV
             </h3>
             <div className="space-y-4">
                {analytics.activity.map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                    <div className="flex items-center space-x-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.type === 'task' ? 'bg-sky-400/10 text-sky-400' : 'bg-orange-400/10 text-orange-400'}`}>
                         {act.type === 'task' ? <CheckCircle2 size={18}/> : <Target size={18}/>}
                       </div>
                       <div className="truncate">
                          <p className="text-[13px] font-bold text-white uppercase truncate max-w-[250px]">{act.label}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase mt-1">{act.user} • {new Date(act.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <span className={`text-[8px] font-black px-3 py-1 rounded-md uppercase border ${act.status === 'Terminé' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                      {act.status}
                    </span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="crystal-module rounded-[3rem] p-8 md:p-10 border-white/5 text-left">
             <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center mb-8">
                <Star className="mr-3 text-amber-400" size={24}/>
                Efficience Équipe
             </h3>
             <div className="space-y-6">
                {analytics.team.map((member, i) => (
                  <div key={member.id} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                       <div className="relative">
                          <img src={member.avatar} className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 object-cover" alt="" />
                          {i === 0 && <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 border-2 border-slate-950"><Star size={10} fill="currentColor"/></div>}
                       </div>
                       <div>
                          <p className="text-[12px] font-black text-white uppercase leading-none">{member.name}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">{member.done} missions validées</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-lg font-black ${member.efficiency > 80 ? 'text-emerald-400' : 'text-sky-400'}`}>{member.efficiency}%</p>
                       <p className="text-[8px] font-black text-slate-600 uppercase">Ratio iV</p>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          <section className="crystal-module rounded-[3rem] p-8 md:p-10 border-white/5 text-left overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/5 blur-3xl"></div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center mb-8">
                <Target className="mr-3 text-orange-400" size={24}/>
                Pipe Commercial
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Nouveaux Leads</p>
                   <p className="text-2xl font-black text-orange-400">{analytics.leads.length}</p>
                </div>
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Potentiel (DZD)</p>
                   <p className="text-[14px] font-black text-white truncate">
                     {analytics.leads.reduce((acc, l) => acc + (l.valueMin || 0), 0).toLocaleString()}
                   </p>
                </div>
             </div>
             <button onClick={() => setShowExportModal(true)} className="w-full mt-6 py-4 glass text-white font-black rounded-2xl uppercase text-[9px] tracking-widest hover:bg-white/5 transition-all">Analyser Pipeline</button>
          </section>
        </div>
      </div>

      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Audit Systémique iV" subtitle="Génération de rapport PDF haute-fidélité">
        <div className="space-y-8 text-left">
           <div className="space-y-4">
              <label className="label-iv">Focalisation Temporelle</label>
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                 <button onClick={() => setExportRange(7)} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${exportRange === 7 ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}>Cycle 7 Jours</button>
                 <button onClick={() => setExportRange(30)} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${exportRange === 30 ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}>Cycle 30 Jours</button>
              </div>
           </div>

           {/* CONTENEUR EXPORT - CACHÉ DANS L'UI MAIS UTILISÉ PAR HTML2PDF */}
           <div ref={reportRef} className="border border-white/10 rounded-[2.5rem] bg-slate-950/80 p-6 md:p-10 overflow-y-auto max-h-[50vh] no-scrollbar shadow-inner">
              <div className="report-pdf-content bg-white p-8 md:p-14 text-slate-950 rounded-2xl min-h-full font-sans">
                 
                 {/* Header PDF */}
                 <div className="flex justify-between items-start border-b-[4pt] border-slate-950 pb-10 mb-12">
                    <div className="text-left">
                      <h1 className="text-4xl font-black uppercase tracking-tighter">iVISION AGENCY</h1>
                      <p className="text-[12px] font-black text-sky-700 uppercase tracking-[0.3em] mt-3">Rapport d'Audit Stratégique Opérationnel</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Strictement Confidentiel • Propriété de iVISION CORE</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Généré par iV Intelligence</p>
                       <p className="text-sm font-black uppercase mt-1">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Période: {exportRange} jours</p>
                    </div>
                 </div>

                 {/* 1. SYNTHÈSE FINANCIÈRE */}
                 <section className="mb-14">
                    <h3 className="section-title text-xl font-black border-b-2 border-slate-950 mb-6 pb-2">1. Bilan de Santé Financière</h3>
                    <div className="grid grid-cols-3 gap-6 mb-8 flex w-full">
                       <div className="p-6 bg-slate-50 border border-slate-200 text-center flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Revenu Projeté</p>
                          <p className="text-xl font-black">{analytics.revenue.toLocaleString()} DZD</p>
                       </div>
                       <div className="p-6 bg-slate-50 border border-slate-200 text-center flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Burn Rate Global</p>
                          <p className="text-xl font-black text-red-600">-{analytics.costs.toLocaleString()} DZD</p>
                       </div>
                       <div className="p-6 bg-slate-100 border-2 border-green-300 text-center flex-1">
                          <p className="text-[9px] font-black text-green-700 uppercase mb-2">Marge Nette</p>
                          <p className="text-xl font-black text-green-700">+{analytics.margin.toLocaleString()} DZD</p>
                       </div>
                    </div>
                    
                    <p className="text-[10px] font-black uppercase mb-3">Répartition des charges analytiques :</p>
                    <table className="w-full border-collapse mb-6">
                       <thead>
                          <tr className="bg-slate-100">
                             <th className="border p-2 text-left text-[10px]">Poste de Dépense</th>
                             <th className="border p-2 text-left text-[10px]">Montant</th>
                             <th className="border p-2 text-left text-[10px]">% du Burn Rate</th>
                          </tr>
                       </thead>
                       <tbody>
                          <tr>
                             <td className="border p-2 text-[10px]">Capital Humain (RH & Salaires)</td>
                             <td className="border p-2 text-[10px]">{analytics.salaryCost.toLocaleString()} DZD</td>
                             <td className="border p-2 text-[10px]">{Math.round((analytics.salaryCost / Math.max(1, analytics.costs)) * 100)}%</td>
                          </tr>
                          <tr>
                             <td className="border p-2 text-[10px]">Opérations & Freelancing</td>
                             <td className="border p-2 text-[10px]">{analytics.opCost.toLocaleString()} DZD</td>
                             <td className="border p-2 text-[10px]">{Math.round((analytics.opCost / Math.max(1, analytics.costs)) * 100)}%</td>
                          </tr>
                          <tr>
                             <td className="border p-2 text-[10px]">Acquisition Client (ADS)</td>
                             <td className="border p-2 text-[10px]">{analytics.adCost.toLocaleString()} DZD</td>
                             <td className="border p-2 text-[10px]">{Math.round((analytics.adCost / Math.max(1, analytics.costs)) * 100)}%</td>
                          </tr>
                       </tbody>
                    </table>
                 </section>

                 {/* 2. PERFORMANCE ÉQUIPE */}
                 <section className="mb-14">
                    <h3 className="section-title text-xl font-black border-b-2 border-slate-950 mb-6 pb-2">2. Rapport de Performance Humaine</h3>
                    <table className="w-full border-collapse">
                       <thead>
                          <tr className="bg-slate-100">
                             <th className="border p-2 text-left text-[10px]">Expert</th>
                             <th className="border p-2 text-left text-[10px]">Missions Totales</th>
                             <th className="border p-2 text-left text-[10px]">Validées</th>
                             <th className="border p-2 text-left text-[10px]">Taux de Succès</th>
                          </tr>
                       </thead>
                       <tbody>
                          {analytics.team.map(m => (
                             <tr key={m.id}>
                                <td className="border p-2 text-[10px] font-bold">{m.name}</td>
                                <td className="border p-2 text-[10px]">{m.total}</td>
                                <td className="border p-2 text-[10px]">{m.done}</td>
                                <td className="border p-2 text-[10px] font-black">{m.efficiency}%</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </section>

                 {/* 3. DÉTAIL DES TRANSACTIONS */}
                 <section className="mb-14">
                    <h3 className="section-title text-xl font-black border-b-2 border-slate-950 mb-6 pb-2">3. Journal Itemisé des Flux</h3>
                    
                    <div className="mb-8">
                       <p className="text-[11px] font-black uppercase mb-4">Dépenses Opérationnelles ({analytics.expenses.length})</p>
                       <table className="w-full border-collapse">
                          <thead>
                             <tr className="bg-slate-100">
                                <th className="border p-2 text-left text-[10px]">Date</th>
                                <th className="border p-2 text-left text-[10px]">Libellé</th>
                                <th className="border p-2 text-left text-[10px]">Catégorie</th>
                                <th className="border p-2 text-left text-[10px]">Montant</th>
                             </tr>
                          </thead>
                          <tbody>
                             {analytics.expenses.map(e => (
                                <tr key={e.id}>
                                   <td className="border p-2 text-[10px]">{new Date(e.createdAt).toLocaleDateString()}</td>
                                   <td className="border p-2 text-[10px]">{e.name}</td>
                                   <td className="border p-2 text-[10px] uppercase">{e.type}</td>
                                   <td className="border p-2 text-[10px] font-black">{e.amount.toLocaleString()} DZD</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </section>

                 {/* FOOTER PDF */}
                 <div className="mt-20 pt-10 border-t-2 border-slate-900 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-400">iVISION AGENCY • CORE SYSTEM</p>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading}
                className="w-full py-8 bg-slate-950 text-white font-black rounded-3xl shadow-2xl flex items-center justify-center space-x-4 uppercase text-[12px] tracking-[0.2em] active-scale hover:bg-sky-500 transition-all border border-white/10"
              >
                {isDownloading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24}/>}
                <span>Télécharger le Rapport PDF</span>
              </button>
              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full py-5 glass text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-white/5 active-scale"
              >
                Quitter l'Interface d'Audit
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;