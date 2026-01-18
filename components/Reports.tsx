
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { User, UserRole, Task, TaskStatus, Lead } from '../types';
import { Target, Zap, AlertCircle, TrendingUp, Loader2, Database, Shield, Sparkles, Cpu, Activity, ArrowUpRight, Wand2, X } from 'lucide-react';
import { generateMarketingInsight } from '../services/geminiService';

interface ReportsProps {
    currentUser: User;
    tasks: Task[];
    users: User[];
    leads?: Lead[];
}

const Reports: React.FC<ReportsProps> = ({ currentUser, tasks = [], users = [], leads = [] }) => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [strategyReport, setStrategyReport] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const totalLeads = leads.length;
    const qualifiedLeadsCount = leads.filter(l => l.status === 'qualified').length;
    // La valeur du pipeline se calcule sur TOUS les prospects actifs (pas seulement qualifiés)
    const pipelineValue = leads.reduce((acc, curr) => acc + (Number(curr.valueMin) || 0), 0);
    const convRate = totalLeads > 0 ? Math.round((qualifiedLeadsCount / totalLeads) * 100) : 0;

    return { completionRate, pipelineValue, leadCount: totalLeads, convRate };
  }, [tasks, leads]);

  const taskData = useMemo(() => [
    { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#6366F1' }, 
    { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#0061FF' }, 
    { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#10B981' }, 
  ].filter(d => d.value > 0), [tasks]);

  const handleGenerateStrategy = async () => {
    setIsAnalysing(true);
    try {
        const context = `
            KPIs iVISION : Tâches ${stats.completionRate}% (Total ${tasks.length}).
            Pipeline : ${stats.pipelineValue} DZD (${leads.length} leads).
            Conversion : ${stats.convRate}%.
        `;
        const report = await generateMarketingInsight(`Analyse ces métriques iVISION et donne 2 recommandations stratégiques : ${context}`);
        setStrategyReport(report);
    } catch (e) {
        console.error(e);
    } finally {
        setIsAnalysing(false);
    }
  };

  if (isSyncing) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150"></div>
              <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl border border-slate-100 flex items-center justify-center">
                  <Cpu size={40} className="text-primary animate-pulse" />
              </div>
          </div>
          <div className="text-center space-y-3">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Synchronisation Intelligence</h3>
              <div className="flex items-center justify-center space-x-3">
                  <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                      <Database size={12} className="text-vibrant-indigo" />
                      <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Database Linked</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                      <Shield size={12} className="text-vibrant-emerald" />
                      <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">SSL Encrypted</span>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-vibrant-amber/10 rounded-lg flex items-center justify-center text-vibrant-amber">
                    <Sparkles size={18} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Rapport de Performance</h2>
              </div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-11">Moteur d'analyse iVISION • Temps Réel</p>
          </div>
          <button 
            onClick={handleGenerateStrategy}
            disabled={isAnalysing}
            className="px-6 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center space-x-3 active-scale text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isAnalysing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            <span>{isAnalysing ? "ANALYSE EN COURS..." : "GÉNÉRER ANALYSE IA"}</span>
          </button>
      </div>

      {strategyReport && (
          <div className="bg-gradient-to-br from-vibrant-indigo to-primary p-1 rounded-[3rem] animate-in zoom-in-95 duration-500 shadow-2xl">
              <div className="bg-white p-10 rounded-[2.8rem] relative">
                  <button onClick={() => setStrategyReport(null)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
                  <div className="flex items-center space-x-3 mb-6">
                      <Sparkles size={20} className="text-vibrant-amber" />
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">Analyse Stratégique IA iV</h4>
                  </div>
                  <div className="text-slate-700 font-bold text-lg leading-relaxed italic border-l-4 border-vibrant-indigo pl-6 py-2">
                    {strategyReport}
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm group hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-vibrant-indigo/10 rounded-xl text-vibrant-indigo">
                      <TrendingUp size={20} />
                  </div>
                  <ArrowUpRight size={18} className="text-slate-200 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taux de Complétion</p>
              <h4 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{stats.completionRate}%</h4>
              <div className="mt-4 w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-vibrant-indigo h-full transition-all duration-1000" style={{ width: `${stats.completionRate}%` }}></div>
              </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm group hover:border-vibrant-emerald/20 transition-all">
              <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-vibrant-emerald/10 rounded-xl text-vibrant-emerald">
                      <Target size={20} />
                  </div>
                  <ArrowUpRight size={18} className="text-slate-200 group-hover:text-vibrant-emerald transition-colors" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion Leads</p>
              <h4 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{stats.convRate}%</h4>
              <p className="text-[9px] font-semibold text-slate-400 mt-2 uppercase">Qualifiés sur {stats.leadCount} prospects</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={80} className="text-vibrant-amber" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-[10px] font-bold text-vibrant-amber uppercase tracking-widest">Valeur Pipeline iV</p>
                  <h4 className="text-2xl font-bold text-white mt-1 tracking-tighter">
                    {new Intl.NumberFormat('fr-FR').format(stats.pipelineValue)} DZD
                  </h4>
                </div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-8">Basé sur tous les leads actifs</div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-formal p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Répartition Opérationnelle</h3>
                  <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-vibrant-indigo"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">États de Mission</span>
                  </div>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={taskData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                              {taskData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center text-center space-y-8">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-vibrant-indigo mx-auto border border-slate-50">
                  <TrendingUp size={36} />
              </div>
              <div className="max-w-xs mx-auto space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Capacité de Livraison</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-wider text-[11px]">
                      L'agence a finalisé <span className="text-vibrant-emerald font-bold">{tasks.filter(t => t.status === TaskStatus.DONE).length} objectifs</span> avec succès sur la période actuelle.
                  </p>
                  <div className="pt-4">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-vibrant-emerald/10 text-vibrant-emerald rounded-xl text-[10px] font-bold uppercase tracking-widest border border-vibrant-emerald/10">
                          <Activity size={14} />
                          <span>Moteur d'Efficacité iV</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;
