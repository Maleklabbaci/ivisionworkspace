
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Task, User, TaskStatus, Lead, Message } from '../types';
// Added missing Plus icon to imports
import { BarChart3, TrendingUp, Target, Wand2, Sparkles, Loader2, ArrowUpRight, FileText, Download, Printer, Calendar, Zap, CheckCircle2, ChevronRight, X, UserCheck, Activity, Plus } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';

const Reports: React.FC<any> = ({ tasks = [], leads = [], messages = [], currentUser }) => {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [strategyReport, setStrategyReport] = useState<string | null>(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [weeklyAiSummary, setWeeklyAiSummary] = useState<string>("");
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  // Statistiques Globales
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    return {
      completion: total ? Math.round((done / total) * 100) : 0,
      pipeline: leads.reduce((acc: number, curr: any) => acc + (Number(curr.valueMin) || 0), 0),
      conversion: leads.length ? Math.round((leads.filter((l: any) => l.status === 'qualified').length / leads.length) * 100) : 0
    };
  }, [tasks, leads]);

  // Données Hebdomadaires (7 derniers jours)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const tasksDone = tasks.filter(t => t.status === TaskStatus.DONE && t.dueDate && new Date(t.dueDate) >= lastWeek);
    const newLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= lastWeek);
    const totalPipeline = newLeads.reduce((acc, curr) => acc + (Number(curr.valueMin) || 0), 0);
    const activityCount = messages.filter((m: Message) => m.fullTimestamp && new Date(m.fullTimestamp) >= lastWeek).length;

    return {
      period: `${lastWeek.toLocaleDateString()} - ${now.toLocaleDateString()}`,
      tasksDone,
      newLeads,
      totalPipeline,
      activityCount,
      totalTasks: tasks.filter(t => t.status !== TaskStatus.DONE).length
    };
  }, [tasks, leads, messages]);

  const taskData = useMemo(() => [
    { name: 'TODO', val: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#F472B6' },
    { name: 'WORK', val: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#EC4899' },
    { name: 'DONE', val: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#BE185D' }
  ].filter(d => d.val > 0), [tasks]);

  const handleAnalyticMagic = async () => {
    setIsAnalysing(true);
    try {
      const insight = await generateMarketingInsight(`KPIs: Completion ${stats.completion}%, Pipeline ${stats.pipeline} DZD.`);
      setStrategyReport(insight);
    } catch (err) { console.error(err); } finally { setIsAnalysing(false); }
  };

  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingWeekly(true);
    setShowWeeklyModal(true);
    try {
      const prompt = `Rédige un rapport hebdomadaire de direction pour l'agence iVISION. 
      Données de la semaine : 
      - ${weeklyData.tasksDone.length} missions terminées.
      - ${weeklyData.newLeads.length} nouveaux prospects acquis.
      - Valeur du nouveau pipeline : ${weeklyData.totalPipeline} DZD.
      - Activité interne : ${weeklyData.activityCount} messages échangés.
      Fais un résumé professionnel, motivant, et liste 3 priorités pour la semaine prochaine. Max 150 mots.`;
      
      const summary = await generateMarketingInsight(prompt);
      setWeeklyAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-400 mb-2">ANALYTICS ENGINE</p>
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

      {strategyReport && (
        <div className="glass p-12 rounded-[4rem] border border-pink-400/20 shadow-2xl animate-fade-in bg-gradient-to-br from-pink-400/10 via-slate-900/40 to-transparent relative overflow-hidden group">
           <div className="absolute -top-12 -right-12 w-44 h-44 bg-pink-400/10 blur-[60px] rounded-full group-hover:bg-pink-400/20 transition-all duration-700"></div>
           <div className="flex items-center space-x-4 mb-10 relative z-10">
             <div className="w-10 h-10 bg-pink-400 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20} /></div>
             <h4 className="font-black text-pink-400 text-[11px] uppercase tracking-[0.3em]">Directives IA Stratégiques</h4>
           </div>
           <p className="text-2xl font-extrabold text-white leading-tight italic border-l-4 border-pink-400 pl-10 relative z-10 max-w-4xl tracking-tight">{strategyReport}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Taux Complétion', val: `${stats.completion}%`, color: 'text-pink-400', icon: TrendingUp, bg: 'bg-pink-400/10' },
          { label: 'Lead Conversion', val: `${stats.conversion}%`, color: 'text-emerald-400', icon: Target, bg: 'bg-emerald-400/10' },
          { label: 'Pipeline Total', val: `${Math.round(stats.pipeline / 1000)}k`, color: 'text-sky-400', icon: BarChart3, bg: 'bg-sky-400/10' }
        ].map((s, i) => (
          <div key={i} className="glass-card p-8 rounded-[3rem] border border-white/5 flex items-center justify-between group">
             <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
               <h4 className={`text-3xl font-extrabold ${s.color} mt-2 tracking-tighter`}>{s.val}</h4>
             </div>
             <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:rotate-12`}>
                <s.icon size={22} />
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="glass p-12 rounded-[4rem] border border-white/5 min-h-[450px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-12 flex items-center relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400 mr-4 shadow-[0_0_10px_#f472b6]" /> Cycle de Production
            </h3>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={taskData} cx="50%" cy="50%" innerRadius={90} outerRadius={125} paddingAngle={10} dataKey="val">
                       {taskData.map((e, idx) => <Cell key={idx} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', color: '#fff', fontSize: '10px', fontWeight: '800' }} />
                 </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="glass p-12 rounded-[4rem] border border-white/5 min-h-[450px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-12 flex items-center relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-4 shadow-[0_0_10px_#38bdf8]" /> Intensité du Flux
            </h3>
            <div className="h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={taskData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', color: '#fff', fontSize: '10px', fontWeight: '800' }} />
                    <Bar dataKey="val" fill="#F472B6" radius={[15, 15, 0, 0]} barSize={50}>
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
               {/* Header Modal - Hidden during print */}
               <div className="flex justify-between items-center mb-10 no-print">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-sky-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl"><FileText size={24} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Export Rapport Hebdo</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Génération iVISION System</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={printReport} className="p-4 bg-sky-400 text-slate-950 rounded-2xl font-black active-scale flex items-center space-x-2 transition-all hover:bg-sky-300">
                      <Printer size={20} />
                      <span className="text-[10px] uppercase tracking-widest hidden md:inline">Imprimer / PDF</span>
                    </button>
                    <button onClick={() => setShowWeeklyModal(false)} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-2xl flex items-center justify-center transition-all active-scale"><X size={24}/></button>
                  </div>
               </div>

               {/* LE RAPPORT LUI-MEME (Printable Content) */}
               <div className="printable-report bg-white text-slate-950 p-8 md:p-12 rounded-[2rem] shadow-inner border border-white/5">
                  <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
                    <div>
                      <div className="w-14 h-14 bg-sky-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4">iV</div>
                      <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-950">Rapport d'Activité</h1>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mt-1">iVISION MARKETING AGENCY</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Période du Rapport</p>
                       <p className="text-xl font-extrabold text-slate-950 mt-1">{weeklyData.period}</p>
                       <div className="mt-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 inline-block">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                         <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">CONFIDENTIEL</p>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center"><Zap size={14} className="mr-2 text-sky-400"/> Synthèse Executive (IA)</h4>
                        {isGeneratingWeekly ? (
                          <div className="flex items-center space-x-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                             <Loader2 className="animate-spin text-sky-400" size={20}/>
                             <span className="text-[10px] font-black uppercase text-slate-400">Génération des insights en cours...</span>
                          </div>
                        ) : (
                          <p className="text-sm md:text-base font-medium leading-relaxed text-slate-800 italic border-l-4 border-sky-400 pl-6 py-2">
                            {weeklyAiSummary || "Synthèse indisponible."}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Missions Closes</p>
                           <p className="text-3xl font-black text-slate-950">{weeklyData.tasksDone.length}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Activité Chat</p>
                           <p className="text-3xl font-black text-slate-950">{weeklyData.activityCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div>
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center"><Target size={14} className="mr-2 text-emerald-500"/> Performance Commerciale</h4>
                         <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Nouvelle Valeur Pipeline</p>
                            <p className="text-4xl font-black text-slate-950 tracking-tighter">{weeklyData.totalPipeline.toLocaleString()} DZD</p>
                            <div className="mt-4 flex items-center justify-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                               <Plus size={14} />
                               <span>{weeklyData.newLeads.length} Nouveaux Prospects</span>
                            </div>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center"><CheckCircle2 size={14} className="mr-2 text-sky-400"/> Missions Closes de la semaine</h4>
                    <div className="space-y-3">
                       {weeklyData.tasksDone.length > 0 ? weeklyData.tasksDone.map((t: Task) => (
                         <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center space-x-3">
                               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                               <span className="text-[11px] font-extrabold uppercase text-slate-950">{t.title}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{t.dueDate}</span>
                         </div>
                       )) : (
                         <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-[10px] font-black text-slate-300 uppercase">Aucune mission clôturée cette semaine</p>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="mt-16 pt-10 border-t-2 border-slate-100 flex justify-between items-center opacity-40 grayscale">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Généré par iVISION Engine v2.5</p>
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
