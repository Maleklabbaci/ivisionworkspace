
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { User, UserRole, Task, TaskStatus } from '../types';
import { TrendingUp, PieChart as PieChartIcon, Target, AlertCircle, Layers } from 'lucide-react';

interface ReportsProps {
    currentUser: User;
    tasks: Task[];
    users: User[];
}

// Couleurs fixes pour les 4 statuts
const STATUS_COLORS = {
  [TaskStatus.TODO]: '#D1D1D6',      // Gris
  [TaskStatus.IN_PROGRESS]: '#0066FF', // Bleu
  [TaskStatus.BLOCKED]: '#FF3B30',     // Rouge
  [TaskStatus.DONE]: '#34C759',        // Vert
};

const Reports: React.FC<ReportsProps> = ({ currentUser, tasks, users }) => {
  
  const canAccess = 
    currentUser.role === UserRole.ADMIN || 
    currentUser.role === UserRole.PROJECT_MANAGER || 
    currentUser.role === UserRole.ANALYST ||
    currentUser.permissions?.canViewReports;

  if (!canAccess) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-20">
            <div className="bg-red-50 p-10 rounded-full mb-6">
              <AlertCircle size={48} className="text-urgent" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Accès Restreint</h2>
            <p className="text-slate-400 font-bold max-w-xs">Les rapports analytiques sont réservés aux administrateurs opérationnels.</p>
        </div>
      );
  }

  const statusData = useMemo(() => {
      // On force les 4 statuts pour garantir une vue complète du workflow
      return [
        { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length, status: TaskStatus.TODO },
        { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, status: TaskStatus.IN_PROGRESS },
        { name: 'Bloqué', value: tasks.filter(t => t.status === TaskStatus.BLOCKED).length, status: TaskStatus.BLOCKED },
        { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length, status: TaskStatus.DONE },
      ];
  }, [tasks]);

  const teamPerformanceData = useMemo(() => {
      if (tasks.length === 0) return [];
      return users.map(user => {
          const userTasks = tasks.filter(t => t.assigneeId === user.id);
          return {
              name: user.name.split(' ')[0],
              total: userTasks.length,
              completed: userTasks.filter(t => t.status === TaskStatus.DONE).length,
              blocked: userTasks.filter(t => t.status === TaskStatus.BLOCKED).length,
          };
      }).filter(d => d.total > 0);
  }, [users, tasks]);

  const trendData = useMemo(() => {
      if (tasks.length === 0) return [];
      const groupedData: Record<string, { count: number; timestamp: number }> = {};

      tasks.forEach(task => {
          const date = new Date(task.dueDate);
          if (isNaN(date.getTime())) return;
          const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          const sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
          if (!groupedData[key]) {
              groupedData[key] = { count: 0, timestamp: sortKey };
          }
          groupedData[key].count += 1;
      });

      return Object.keys(groupedData)
          .map(key => ({
              name: key,
              tasks: groupedData[key].count,
              timestamp: groupedData[key].timestamp
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
  }, [tasks]);

  const hasTasks = tasks.length > 0;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 relative animate-in fade-in duration-500 px-2">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Analytique IA</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Intelligence opérationnelle & Flux iVISION</p>
        </div>
        
        <div className="bg-white px-8 py-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-8">
             <div className="flex flex-col text-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Missions</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{tasks.length}</span>
            </div>
            <div className="h-10 w-px bg-slate-100"></div>
            <div className="flex flex-col text-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Livrées</span>
                <span className="text-3xl font-black text-success tracking-tighter">{tasks.filter(t => t.status === TaskStatus.DONE).length}</span>
            </div>
            <div className="h-10 w-px bg-slate-100"></div>
            <div className={`flex flex-col text-center ${tasks.filter(t => t.status === TaskStatus.BLOCKED).length > 0 ? 'text-urgent' : 'text-slate-200'}`}>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Bloquées</span>
                <span className="text-3xl font-black tracking-tighter">{tasks.filter(t => t.status === TaskStatus.BLOCKED).length}</span>
            </div>
        </div>
      </div>

      {!hasTasks ? (
          <div className="bg-slate-50 rounded-[3rem] border border-slate-100 p-24 text-center border-dashed">
              <Layers size={48} className="mx-auto text-slate-200 mb-6 opacity-50" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Flux de données vide</h3>
              <p className="text-xs text-slate-300 font-bold mt-2">Assignez des missions pour générer les rapports d'agence.</p>
          </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart complet avec les 4 états */}
          <div className="bg-white p-10 rounded-5xl shadow-sm border border-slate-100">
               <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center uppercase tracking-tight">
                  <PieChartIcon size={22} className="mr-3 text-primary" />
                  Santé du Workflow
              </h3>
              <p className="text-[10px] font-black text-slate-400 mb-10 uppercase tracking-widest">Répartition des 4 statuts opérationnels</p>
              <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={85}
                              outerRadius={115}
                              paddingAngle={6}
                              dataKey="value"
                          >
                              {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                              ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px'}} 
                            itemStyle={{fontWeight: 'bold', fontSize: '12px'}}
                          />
                          <Legend verticalAlign="bottom" height={40} iconType="circle" />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-10 rounded-5xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center uppercase tracking-tight">
                  <Target size={22} className="mr-3 text-primary" />
                  Productivité Équipe
              </h3>
              <p className="text-[10px] font-black text-slate-400 mb-10 uppercase tracking-widest">Missions traitées et livrées par membre</p>
              <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamPerformanceData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                          <Legend iconType="rect" />
                          <Bar dataKey="total" name="Total Assigné" fill="#E5E7EB" radius={[12, 12, 0, 0]} barSize={24} />
                          <Bar dataKey="completed" name="Livrées" fill="#34C759" radius={[12, 12, 0, 0]} barSize={24} />
                          <Bar dataKey="blocked" name="Bloquées" fill="#FF3B30" radius={[12, 12, 0, 0]} barSize={24} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="lg:col-span-2 bg-white p-10 rounded-5xl shadow-sm border border-slate-100">
               <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center uppercase tracking-tight">
                  <TrendingUp size={22} className="mr-3 text-primary" />
                  Flux Temporel
              </h3>
              <p className="text-[10px] font-black text-slate-400 mb-10 uppercase tracking-widest">Volume total d'activité généré</p>
               <div className="h-[320px]">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} hide />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip contentStyle={{borderRadius: '24px', border: 'none', padding: '16px'}} />
                            <Area type="monotone" dataKey="tasks" stroke="#0066FF" strokeWidth={5} fillOpacity={1} fill="url(#colorTasks)" name="Intensité" />
                        </AreaChart>
                   </ResponsiveContainer>
               </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default Reports;
