
import React, { useState, useMemo, useEffect } from 'react';
import { Task, User, TaskStatus, Lead, Project, SalaryRecord, Expense, AdCampaignExpense } from '../types';
import { 
  TrendingUp, TrendingDown, Zap, Users, Briefcase, 
  Download, DollarSign, CheckCircle2, 
  Activity, FileText, X, Clock, ListChecks, ArrowUpRight, BarChart3, Target, Calendar, AlertTriangle, Layers, Repeat
} from 'lucide-react';

const Reports: React.FC<any> = ({ 
  tasks = [], leads = [], messages = [], projects = [], 
  salaries = [], expenses = [], adCampaigns = [], users = [], currentUser 
}) => {
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [lastDownloadDate, setLastDownloadDate] = useState<string | null>(localStorage.getItem('iv_last_report_download'));

  // --- LOGIQUE DE FILTRAGE 30 JOURS ---
  const isWithin30Days = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - 1);
    return date >= threshold;
  };

  // --- CALCULS STATISTIQUES ---
  const stats = useMemo(() => {
    const rangeTasks = tasks.filter((t: any) => isWithin30Days(t.createdAt || t.dueDate));
    const rangeLeads = leads.filter((l: any) => isWithin30Days(l.createdAt));
    
    // REVENU MENSUEL ACTIF (MRR)
    const activeMonthlyProjects = projects.filter(p => p.status === 'active' && (p.billingType === 'monthly' || !p.billingType));
    const mrr = activeMonthlyProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
    
    // REVENU ONE-SHOT ACTIF (Projets non terminés)
    const activeOneShotProjects = projects.filter(p => p.status === 'active' && p.billingType === 'one-shot');
    const oneShotTotal = activeOneShotProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);

    // CHARGES RH (Mensuel projeté)
    const monthlySalaries = salaries.reduce((acc, s) => {
      const base = (s.amount || 0) + (s.bonus || 0);
      return acc + (s.frequency === 'hebdo' ? base * 4 : base);
    }, 0);
    
    // CHARGES OPÉRATIONNELLES (30 derniers jours)
    const monthlyExpenses = expenses.filter((e: any) => isWithin30Days(e.createdAt)).reduce((acc, e) => acc + e.amount, 0);
    const monthlyAds = adCampaigns.filter((a: any) => isWithin30Days(a.createdAt)).reduce((acc, a) => acc + a.amount, 0);
    
    const totalCosts = monthlySalaries + monthlyExpenses + monthlyAds;
    
    // La marge nette ici est vue comme le "Surplus Cashflow" mensuel : (MRR + CA One Shot Actif) - (Coûts 30J)
    // C'est une vision de trésorerie opérationnelle
    const netMargin = (mrr + oneShotTotal) - totalCosts;

    return {
      revenue: mrr + oneShotTotal,
      mrr: mrr,
      oneShot: oneShotTotal,
      costs: totalCosts,
      margin: netMargin,
      tasksTotal: rangeTasks.length,
      tasksDone: rangeTasks.filter((t: Task) => t.status === TaskStatus.DONE).length,
      leadsCount: rangeLeads.length,
      leadsQualified: rangeLeads.filter((l: Lead) => l.status === 'qualified').length,
      clientsCount: projects.filter(p => p.status === 'active').length,
      productivity: rangeTasks.length > 0 ? Math.round((rangeTasks.filter((t: Task) => t.status === TaskStatus.DONE).length / rangeTasks.length) * 100) : 0
    };
  }, [tasks, leads, projects, salaries, expenses, adCampaigns]);

  const employeePerformance = useMemo(() => {
    return users.map(u => {
      const allMonthTasks = tasks.filter((t: Task) => t.assigneeId === u.id && isWithin30Days(t.createdAt || t.dueDate));
      const validated = allMonthTasks.filter((t: Task) => t.status === TaskStatus.DONE);
      const pending = allMonthTasks.filter((t: Task) => t.status !== TaskStatus.DONE);
      
      return {
        ...u,
        total: allMonthTasks.length,
        doneCount: validated.length,
        pendingCount: pending.length,
        efficiency: allMonthTasks.length > 0 ? Math.round((validated.length / allMonthTasks.length) * 100) : 0,
        journalVictoires: validated.map(t => ({ title: t.title, date: t.dueDate })),
        journalFronts: pending.map(t => ({ title: t.title, date: t.dueDate }))
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [users, tasks]);

  const handleDownloadReport = () => {
    const now = new Date().toLocaleString('fr-FR', { 
      day: '2-digit', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
    localStorage.setItem('iv_last_report_download', now);
    setLastDownloadDate(now);
    window.print();
  };

  const reportCloseDay = 27;
  const currentDay = new Date().getDate();
  const isReportDay = currentDay === reportCloseDay;

  return (
    <div className="space-y-12 animate-fade-in pb-24 px-2">
      {isReportDay && (
        <div className="relative group overflow-hidden rounded-[2.5rem] p-8 md:p-10 border border-emerald-500/30 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10 animate-pulse-subtle">
           <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full"></div>
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-left">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-slate-950 shadow-xl"><AlertTriangle size={32} /></div>
                <div>
                   <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">Clôture du Cycle iV</h3>
                   <p className="text-[10px] md:text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-2">Bilan mensuel requis pour validation des performances.</p>
                </div>
              </div>
              <button onClick={() => setShowWeeklyModal(true)} className="px-10 py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active-scale">Générer Clôture</button>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-left">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2 leading-none">Agency Intelligence Core</p>
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">Rapports</h2>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center space-x-3 px-4 py-2 bg-sky-500/10 rounded-full border border-sky-500/20 shadow-inner">
              <Calendar size={14} className="text-sky-400" />
              <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest leading-none">Cycle 30J Actif</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowWeeklyModal(true)}
          className="px-10 py-5 bg-sky-500 text-white rounded-[2rem] font-black text-[11px] uppercase flex items-center space-x-4 shadow-2xl active-scale hover:bg-sky-400 transition-all tracking-widest"
        >
          <Download size={20} />
          <span>Exporter Audit 30J</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 crystal-module p-10 md:p-14 rounded-[3.5rem] border-white/10 shadow-2xl relative overflow-hidden text-left flex flex-col justify-center">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full"></div>
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-400/20 shadow-inner"><BarChart3 size={28} /></div>
            <h4 className="font-black text-white text-[12px] uppercase tracking-[0.3em]">Briefing de Performance</h4>
          </div>
          <div className="space-y-8 relative z-10">
            <h3 className="text-3xl md:text-5xl font-black text-white leading-[1.05] uppercase tracking-tighter max-w-3xl">
              CA Total Actif : <span className="text-sky-400">{stats.revenue.toLocaleString()} DZD</span>. 
              Marge Opé : <span className="text-emerald-400">{stats.margin.toLocaleString()} DZD</span>.
            </h3>
            <div className="flex flex-wrap gap-4 mt-4">
               <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Récurrent Mensuel (MRR)</p>
                  <p className="text-lg font-black text-sky-400">{stats.mrr.toLocaleString()} DZD</p>
               </div>
               <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">One-Shot en cours</p>
                  <p className="text-lg font-black text-amber-400">{stats.oneShot.toLocaleString()} DZD</p>
               </div>
            </div>
          </div>
        </div>

        <div className="crystal-module p-10 rounded-[3.5rem] border-white/5 flex flex-col justify-between text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Target size={12} className="mr-2 text-sky-400"/> Vitalité CRM</p>
            <div className="flex items-end space-x-4 pt-4">
              <h4 className="text-6xl font-black text-white leading-none">{stats.clientsCount}</h4>
              <p className="text-[11px] font-black text-sky-400 uppercase pb-1.5 tracking-widest">Contrats</p>
            </div>
          </div>
          <div className="h-px bg-white/5 w-full my-8"></div>
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline Mensuel</span>
              <span className="text-[11px] font-black text-emerald-400">+{stats.leadsCount} Prospects</span>
            </div>
            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
              <div className="h-full bg-sky-500 rounded-full transition-all duration-1000" style={{ width: `${(stats.leadsQualified / (stats.leadsCount || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Revenu Total Actif', val: stats.revenue, color: 'text-white', icon: DollarSign, bg: 'bg-white/5' },
          { label: 'Burn Rate Mensuel', val: stats.costs, color: 'text-rose-400', icon: TrendingDown, bg: 'bg-rose-400/10' },
          { label: 'Marge Cashflow iV', val: stats.margin, color: 'text-emerald-400', icon: TrendingUp, bg: 'bg-emerald-400/10' },
          { label: 'Taux de Complétion', val: stats.productivity + '%', color: 'text-sky-400', icon: Zap, bg: 'bg-sky-400/10' }
        ].map((s, i) => (
          <div key={i} className="crystal-module p-10 rounded-[2.5rem] flex flex-col justify-between h-48 text-left border-white/5 hover:bg-white/[0.04] transition-all group">
             <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} border border-white/5 shadow-inner`}><s.icon size={28} /></div>
             <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{s.label}</p>
               <h4 className={`text-2xl font-black ${s.color} mt-3 tracking-tight leading-none`}>
                 {typeof s.val === 'number' ? s.val.toLocaleString() : s.val} {typeof s.val === 'number' && 'DZD'}
               </h4>
             </div>
          </div>
        ))}
      </div>

      {/* AUDIT INDIVIDUEL */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 text-left">
           <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-400/10 shadow-inner"><Users size={24}/></div>
             <div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Journal d'Audit</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Suivi historique de la production individuelle sur 30 jours.</p>
             </div>
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {employeePerformance.map((emp, i) => (
            <div key={i} className="crystal-module p-10 rounded-[3.5rem] border-white/5 flex flex-col lg:flex-row gap-12 text-left shadow-xl">
               <div className="flex flex-col items-center justify-center lg:border-r border-white/5 lg:pr-12 lg:w-64 shrink-0">
                  <div className="relative mb-6">
                    <img src={emp.avatar} className="w-28 h-28 rounded-[2.5rem] object-cover border-2 border-white/10 shadow-2xl" alt="" />
                    <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10">
                      <span className="text-[13px] font-black text-sky-400">{emp.efficiency}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{emp.name.split(' ')[0]}</h4>
                    <p className="text-[10px] text-sky-400 font-black uppercase tracking-widest mt-2">{emp.role}</p>
                  </div>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h5 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest flex items-center border-b border-white/5 pb-4">
                        <CheckCircle2 size={18} className="mr-3"/> Missions Terminées
                     </h5>
                     <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar pr-2">
                        {emp.journalVictoires.map((t, idx) => (
                          <div key={idx} className="p-5 bg-emerald-400/5 rounded-3xl border border-emerald-400/10 text-left">
                             <p className="text-[14px] font-bold text-slate-100 uppercase leading-tight">{t.title}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h5 className="text-[12px] font-black text-sky-400 uppercase tracking-widest flex items-center border-b border-white/5 pb-4">
                        <Clock size={18} className="mr-3"/> En Cours
                     </h5>
                     <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar pr-2">
                        {emp.journalFronts.map((t, idx) => (
                          <div key={idx} className="p-5 bg-sky-400/5 rounded-3xl border border-sky-400/10 text-left">
                             <p className="text-[14px] font-bold text-slate-100 uppercase leading-tight">{t.title}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {showWeeklyModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer no-print" onClick={() => setShowWeeklyModal(false)}></div>
          <div className="modal-container max-w-4xl">
            <div className="modal-content-glass animate-fade-in overflow-hidden">
               <div className="flex justify-between items-center p-8 border-b border-white/5 no-print bg-slate-900">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none">Export Stratégique iV</h3>
                  <button onClick={() => setShowWeeklyModal(false)} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center active-scale transition-all"><X size={24}/></button>
               </div>

               <div className="printable-report bg-white text-slate-950 p-10 md:p-16 rounded-b-[2rem] overflow-y-auto max-h-[80vh] no-scrollbar">
                  <div className="flex justify-between items-start border-b-8 border-slate-950 pb-12 mb-14 text-left">
                    <div>
                      <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-950 leading-none">iVISION CORE</h1>
                      <p className="text-[12px] font-black text-sky-600 uppercase tracking-[0.4em] mt-4">BILAN OPÉRATIONNEL MENSUEL</p>
                    </div>
                  </div>

                  <div className="space-y-14">
                    <section className="text-left">
                       <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-8">RÉSUMÉ FINANCIER DU CYCLE</h4>
                       <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-200">
                          <div className="grid grid-cols-2 gap-8">
                             <div><p className="text-[9px] font-bold text-slate-400 uppercase">Revenu Mensuel (MRR + One-Shot Actif)</p><p className="text-2xl font-black text-sky-600">{stats.revenue.toLocaleString()} DZD</p></div>
                             <div><p className="text-[9px] font-bold text-slate-400 uppercase">Burn Rate Opérationnel</p><p className="text-2xl font-black text-rose-600">-{stats.costs.toLocaleString()} DZD</p></div>
                             <div className="border-t-2 border-slate-200 pt-4 col-span-2"><p className="text-[9px] font-bold text-slate-400 uppercase">Surplus de Trésorerie Mensuel</p><p className="text-3xl font-black text-slate-950">{stats.margin.toLocaleString()} DZD</p></div>
                          </div>
                       </div>
                    </section>
                    
                    <button onClick={handleDownloadReport} className="no-print w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] mt-14 shadow-2xl active-scale">Télécharger le Briefing PDF</button>
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
