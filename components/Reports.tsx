
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, UserRole, Task, TaskStatus, Lead } from '../types';
import { Target, Zap, AlertCircle, TrendingUp, Loader2, Database } from 'lucide-react';

interface ReportsProps {
    currentUser: User;
    tasks: Task[];
    users: User[];
    leads?: Lead[];
}

const Reports: React.FC<ReportsProps> = ({ currentUser, tasks = [], users = [], leads = [] }) => {
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    // Simulation légère d'accès aux données pour le feeling "Database Sync"
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
    { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#60A5FA' },
    { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#1E3A8A' },
    { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#34C759' },
  ].filter(d => d.value > 0), [tasks]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 page-transition">
      <div className="flex justify-between items-start px-1">
          <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Performance</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Intelligence iVISION • Algérie</p>
          </div>
          {isSyncing && (
            <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 animate-pulse">
                <Database size={14} className="text-primary" />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Sync Database...</span>
            </div>
          )}
      </div>

      {isSyncing ? (
        <div className="h-[50vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-50 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Database size={20} className="text-primary/40" />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Chargement des métriques iVISION</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Zap className="text-primary" size={20} />
                        <h3 className="font-black text-slate-900 uppercase text-sm">Efficacité Livrables</h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={taskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {taskData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Taux Réussite</p>
                        <p className="text-xl font-black text-primary">{stats.completionRate}%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Projets Finis</p>
                        <p className="text-xl font-black text-success">{tasks.filter(t => t.status === TaskStatus.DONE).length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Target className="text-orange-500" size={20} />
                        <h3 className="font-black text-slate-900 uppercase text-sm">Pipeline Business</h3>
                    </div>
                    <div className="p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Potentiel Qualifié (Min)</span>
                        <p className="text-3xl font-black text-orange-600">{stats.pipelineValue.toLocaleString()} DZD</p>
                        <div className="mt-8 flex space-x-8">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Conversion</p>
                                <p className="font-black text-slate-900">{stats.convRate}%</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Total Leads</p>
                                <p className="font-black text-slate-900">{stats.leadCount}</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Basé sur {leads.filter(l => l.status === 'qualified').length} prospects qualifiés</p>
                </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex items-center justify-between border-4 border-white shadow-xl">
                <div>
                    <span className="text-primary font-black text-[10px] uppercase tracking-widest">Focus Stratégique</span>
                    <h4 className="text-2xl font-black uppercase mt-2 leading-tight">Transformation de {stats.convRate}%<br/>sur l'acquisition mensuelle.</h4>
                </div>
                <TrendingUp size={48} className="text-primary opacity-30" />
            </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
