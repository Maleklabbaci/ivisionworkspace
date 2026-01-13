
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { User, UserRole, Task, TaskStatus, Lead } from '../types';
import { TrendingUp, Target, AlertCircle, Zap, CheckCircle2, Clock, Calendar, Loader2 } from 'lucide-react';

interface ReportsProps {
    currentUser: User;
    tasks: Task[];
    users: User[];
    leads?: Lead[];
}

type TimeRange = '1d' | '3d' | '1w' | '1m' | '6m';

const STATUS_COLORS = {
  [TaskStatus.TODO]: '#60A5FA',
  [TaskStatus.IN_PROGRESS]: '#1E3A8A',
  [TaskStatus.BLOCKED]: '#FF3B30',
  [TaskStatus.DONE]: '#34C759',
};

const Reports: React.FC<ReportsProps> = ({ currentUser, tasks = [], users = [], leads = [] }) => {
  const [activeRange, setActiveRange] = useState<TimeRange>('1m');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const canAccess = 
    currentUser.role === UserRole.ADMIN || 
    currentUser.role === UserRole.PROJECT_MANAGER || 
    currentUser.role === UserRole.ANALYST ||
    currentUser.permissions?.canViewReports;

  const filteredData = useMemo(() => {
    const now = new Date();
    const rangeDate = new Date();
    if (activeRange === '1d') rangeDate.setHours(0, 0, 0, 0);
    else if (activeRange === '3d') rangeDate.setDate(now.getDate() - 3);
    else if (activeRange === '1w') rangeDate.setDate(now.getDate() - 7);
    else if (activeRange === '1m') rangeDate.setMonth(now.getMonth() - 1);
    else if (activeRange === '6m') rangeDate.setMonth(now.getMonth() - 6);
    
    return {
      tasks: (tasks || []).filter(t => t.dueDate && new Date(t.dueDate) >= rangeDate),
      leads: (leads || []).filter(l => l.createdAt && new Date(l.createdAt) >= rangeDate)
    };
  }, [tasks, leads, activeRange]);

  const stats = useMemo(() => {
    const { tasks: fTasks, leads: fLeads } = filteredData;
    const completed = fTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = fTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const value = fLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    return {
      completionRate: rate,
      totalValue: value,
      activeMissions: fTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      doneMissions: completed,
      leadCount: fLeads.length
    };
  }, [filteredData]);

  if (!canAccess) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
            <div className="bg-red-50 p-10 rounded-full mb-6">
              <AlertCircle size={48} className="text-urgent" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Accès Restreint</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Ce module est réservé au management.</p>
        </div>
      );
  }

  if (!isReady) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Génération du rapport...</p>
      </div>
    );
  }

  const chartData = [
    { name: 'À faire', value: filteredData.tasks.filter(t => t.status === TaskStatus.TODO).length },
    { name: 'En cours', value: filteredData.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length },
    { name: 'Bloqué', value: filteredData.tasks.filter(t => t.status === TaskStatus.BLOCKED).length },
    { name: 'Terminé', value: filteredData.tasks.filter(t => t.status === TaskStatus.DONE).length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-32 animate-in fade-in duration-300 px-1">
      <div className="flex flex-col gap-6">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Rapports</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Performance iVISION Digital</p>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl md:rounded-[2rem] overflow-x-auto no-scrollbar border border-slate-100">
            {(['1d', '3d', '1w', '1m', '6m'] as TimeRange[]).map(r => (
              <button key={r} onClick={() => setActiveRange(r)} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRange === r ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}>
                {r === '1d' ? 'Jour' : r === '1w' ? 'Sem' : r === '1m' ? 'Mois' : r}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="text-primary" size={20} />
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Santé du Workflow</h3>
          </div>
          <div className="h-[250px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#E2E8F0'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-black text-[10px] uppercase">Aucune donnée</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Taux Réussite</p>
              <p className="text-xl font-black text-primary">{stats.completionRate}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Missions OK</p>
              <p className="text-xl font-black text-success">{stats.doneMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="text-orange-500" size={20} />
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Pipeline Business</h3>
          </div>
          <div className="h-[250px] w-full">
            {filteredData.leads.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData.leads.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Bar dataKey="value" fill="#F97316" radius={[8, 8, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-black text-[10px] uppercase">Aucun lead</div>
            )}
          </div>
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">Valeur estimée</p>
            <p className="text-xl font-black text-orange-600">{stats.totalValue.toLocaleString()} DZD</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
