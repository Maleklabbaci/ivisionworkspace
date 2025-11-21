
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { User, UserRole, Task, TaskStatus } from '../types';
import { Lock, TrendingUp, DollarSign, PieChart as PieIcon, Target, AlertCircle } from 'lucide-react';

interface ReportsProps {
    currentUser: User;
    tasks: Task[];
    users: User[];
}

// Brand Colors
const COLORS = ['#1D4ED8', '#10B981', '#f59e0b', '#EF4444', '#8b5cf6'];

const Reports: React.FC<ReportsProps> = ({ currentUser, tasks, users }) => {
  
  // Access Guard
  if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PROJECT_MANAGER && currentUser.role !== UserRole.ANALYST) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
              <div className="bg-red-50 p-6 rounded-full mb-4">
                  <Lock size={48} className="text-urgent" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
              <p className="text-slate-500 max-w-md">
                  Cette section contient des données sensibles et est réservée aux administrateurs et chefs de projet.
              </p>
          </div>
      );
  }

  // 1. Calculate Financials by Service Type (Dynamic)
  const financialsByType = useMemo(() => {
      const data: Record<string, number> = { content: 0, ads: 0, social: 0, seo: 0, admin: 0 };
      let hasValue = false;
      
      tasks.forEach(t => {
          if (t.price && t.price > 0) {
              const type = t.type || 'admin';
              // Ensure type exists in map, otherwise fallback to admin or ignore
              if (data[type] !== undefined) {
                data[type] += t.price;
                hasValue = true;
              }
          }
      });
      
      if (!hasValue) return [];

      return Object.keys(data)
        .map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: data[key]
        }))
        .filter(item => item.value > 0);
  }, [tasks]);

  // 2. Task Status Distribution (Dynamic)
  const statusData = useMemo(() => {
      if (tasks.length === 0) return [];
      
      return [
        { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length },
        { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length },
        { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length },
        { name: 'Bloqué', value: tasks.filter(t => t.status === TaskStatus.BLOCKED).length },
      ].filter(d => d.value > 0);
  }, [tasks]);

  // 3. Team Velocity (Dynamic)
  const teamPerformanceData = useMemo(() => {
      if (tasks.length === 0) return [];

      return users.map(user => {
          const userTasks = tasks.filter(t => t.assigneeId === user.id);
          return {
              name: user.name.split(' ')[0],
              total: userTasks.length,
              completed: userTasks.filter(t => t.status === TaskStatus.DONE).length,
              revenue: userTasks.reduce((acc, curr) => acc + (curr.price || 0), 0)
          };
      }).filter(d => d.total > 0);
  }, [users, tasks]);

  // 4. Monthly/Period Trend (Dynamic based on Due Dates)
  const trendData = useMemo(() => {
      if (tasks.length === 0) return [];

      const groupedData: Record<string, { revenue: number; count: number; timestamp: number }> = {};

      tasks.forEach(task => {
          const date = new Date(task.dueDate);
          if (isNaN(date.getTime())) return;

          // Group by "Month YY"
          const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          // Use first day of month for sorting
          const sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

          if (!groupedData[key]) {
              groupedData[key] = { revenue: 0, count: 0, timestamp: sortKey };
          }
          
          groupedData[key].revenue += (task.price || 0);
          groupedData[key].count += 1;
      });

      // Sort chronologically
      return Object.keys(groupedData)
          .map(key => ({
              name: key,
              revenue: groupedData[key].revenue,
              tasks: groupedData[key].count,
              timestamp: groupedData[key].timestamp
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

  }, [tasks]);

  const totalRevenue = useMemo(() => tasks.reduce((acc, curr) => acc + (curr.price || 0), 0), [tasks]);
  const hasTasks = tasks.length > 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 relative animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Rapports & Analytique</h2>
            <p className="text-slate-500">Vision globale de la performance, des budgets et de l'équipe (Données réelles).</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">CA Global Estimé</span>
                <span className="text-lg font-bold text-slate-900">{totalRevenue} DA</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
             <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Tâches Totales</span>
                <span className="text-lg font-bold text-slate-900">{tasks.length}</span>
            </div>
        </div>
      </div>

      {/* Empty State Check */}
      {!hasTasks && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Données insuffisantes</h3>
              <p className="text-slate-500">Aucune tâche n'a encore été créée pour générer des rapports.</p>
          </div>
      )}

      {hasTasks && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown Pie */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
                  <DollarSign size={20} className="mr-2 text-primary" />
                  Répartition du Chiffre d'Affaires
              </h3>
              <p className="text-xs text-slate-400 mb-6">Basé sur les tâches avec un prix défini</p>
              <div className="h-[300px] flex items-center justify-center">
                  {financialsByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={financialsByType}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {financialsByType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => `${value} DA`}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                  ) : (
                      <p className="text-sm text-slate-400 italic">Aucune donnée financière disponible.</p>
                  )}
              </div>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
                  <PieIcon size={20} className="mr-2 text-primary" />
                  État d'avancement des projets
              </h3>
              <p className="text-xs text-slate-400 mb-6">Ratio de complétion des tâches actives</p>
              <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData} layout="vertical" margin={{top: 20, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={70} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="value" fill="#1D4ED8" radius={[0, 4, 4, 0]} barSize={30}>
                             {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Bloqué' ? '#EF4444' : entry.name === 'Terminé' ? '#10B981' : '#1D4ED8'} />
                            ))}
                        </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Team Performance (Revenue & Tasks) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
                  <Target size={20} className="mr-2 text-primary" />
                  Performance de l'Équipe
              </h3>
              <p className="text-xs text-slate-400 mb-6">Volume de tâches traitées et valeur générée par membre (Données réelles)</p>
              <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamPerformanceData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" orientation="left" stroke="#1D4ED8" axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#10B981" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="total" name="Tâches Totales" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="left" dataKey="completed" name="Tâches Terminées" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="revenue" name="Valeur Produite (DA)" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Monthly Trend */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-primary" />
                  Croissance Mensuelle
              </h3>
              <p className="text-xs text-slate-400 mb-6">Projection basée sur les dates d'échéance des tâches</p>
               <div className="h-[300px] flex items-center justify-center">
                   {trendData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#1D4ED8" fillOpacity={1} fill="url(#colorRevenue)" name="Revenu (DA)" />
                            <Area type="monotone" dataKey="tasks" stroke="#10B981" fillOpacity={0} strokeDasharray="3 3" name="Nombre de tâches" />
                        </AreaChart>
                   </ResponsiveContainer>
                   ) : (
                       <p className="text-sm text-slate-400 italic">Pas assez de données temporelles pour afficher une tendance.</p>
                   )}
               </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default Reports;
