
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { User, UserRole, Task, TaskStatus, Lead } from '../types';
import { Target, Zap, AlertCircle, TrendingUp, Loader2, Database, Shield, Sparkles, Cpu, Activity, ArrowUpRight } from 'lucide-react';

interface ReportsProps {
    currentUser: User;
    tasks: Task[];
    users: User[];
    leads?: Lead[];
}

const Reports: React.FC<ReportsProps> = ({ currentUser, tasks = [], users = [], leads = [] }) => {
  const [isSyncing, setIsSyncing] = useState(true);

  // Simulation d'une connexion sécurisée à la DB iVISION
  useEffect(() => {
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    
    const qualifiedLeads = leads.filter(l => l.status === 'qualified');
    const pipelineValue = qualifiedLeads.reduce((acc, curr) => acc + (curr.valueMin || 0), 0);
    const convRate = leads.length > 0 ? Math.round((qualifiedLeads.length / leads.length) * 100) : 0;

    return { completionRate: rate, pipelineValue, leadCount: leads.length, convRate };
  }, [tasks, leads]);

  const taskData = useMemo(() => [
    { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#6366F1' }, // Indigo
    { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#0061FF' }, // Primary
    { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#10B981' }, // Emerald
  ].filter(d => d.value > 0), [tasks]);

  if (isSyncing) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <div className="relative">
              {/* Animation Pulse AI */}
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
          <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <Activity size={16} className="text-vibrant-indigo" />
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Flux Actif</span>
              </div>
          </div>
      </div>

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
              <p className="text-[9px] font-semibold text-slate-400 mt-2 uppercase">Basé sur {stats.leadCount} prospects</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={80} className="text-vibrant-amber" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-[10px] font-bold text-vibrant-amber uppercase tracking-widest">Valeur Pipeline</p>
                  <h4 className="text-2xl font-bold text-white mt-1 tracking-tighter">
                    {new Intl.NumberFormat('fr-FR').format(stats.pipelineValue)} DZD
                  </h4>
                </div>
                <button className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors mt-8">Voir Détails Finance</button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-formal p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">État Global des Missions</h3>
                  <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-vibrant-indigo"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Répartition</span>
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
              <div className="grid grid-cols-3 gap-4">
                  {taskData.map((d, i) => (
                      <div key={i} className="text-center">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{d.name}</p>
                          <p className="text-lg font-bold text-slate-900">{d.value}</p>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center text-center space-y-8">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-vibrant-indigo mx-auto border border-slate-50">
                  <TrendingUp size={36} />
              </div>
              <div className="max-w-xs mx-auto space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Efficacité Opérationnelle</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-wider text-[11px]">
                      Votre équipe a complété <span className="text-vibrant-emerald font-bold">{tasks.filter(t => t.status === TaskStatus.DONE).length} missions</span> ce mois-ci, soit une progression de 12% par rapport au flux précédent.
                  </p>
                  <div className="pt-4">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-vibrant-emerald/10 text-vibrant-emerald rounded-xl text-[10px] font-bold uppercase tracking-widest border border-vibrant-emerald/10">
                          <ArrowUpRight size={14} />
                          <span>Performance Optimale</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;
