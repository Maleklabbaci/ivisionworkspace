
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { CampaignMetric, User, UserRole, Task, TaskStatus } from '../types';
import { Download, FileText, Lock } from 'lucide-react';

interface ReportsProps {
    currentUser: User;
    campaignsData: CampaignMetric[];
    tasks: Task[];
    users?: User[];
}

// Minimalist Palette: Blue (Primary), Green (Success), Orange (Blocked), Red (Urgent)
const COLORS = ['#1D4ED8', '#10B981', '#f59e0b', '#EF4444'];

const Reports: React.FC<ReportsProps> = ({ currentUser, campaignsData, tasks, users = [] }) => {
  
  // Admin Guard
  if (currentUser.role !== UserRole.ADMIN) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="bg-red-50 p-6 rounded-full mb-4">
                  <Lock size={48} className="text-urgent" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
              <p className="text-slate-500 max-w-md">
                  Cette section contient des données sensibles et est réservée aux administrateurs.
              </p>
          </div>
      );
  }

  // Process Task Data
  const taskStatusData = [
      { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length },
      { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length },
      { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length },
      { name: 'Bloqué', value: tasks.filter(t => t.status === TaskStatus.BLOCKED).length },
  ];

  // Member Performance Data
  const memberPerformanceData = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
      const total = userTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
          name: user.name.split(' ')[0],
          completed,
          total,
          rate
      };
  });

  // Mock Content Schedule Data
  const contentData = [
      { name: 'Lun', published: 2, scheduled: 1 },
      { name: 'Mar', published: 1, scheduled: 3 },
      { name: 'Mer', published: 3, scheduled: 2 },
      { name: 'Jeu', published: 0, scheduled: 4 },
      { name: 'Ven', published: 2, scheduled: 2 },
      { name: 'Sam', published: 1, scheduled: 0 },
      { name: 'Dim', published: 0, scheduled: 1 },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Rapports & Statistiques</h2>
            <p className="text-slate-500">Vue globale des performances de l'agence</p>
        </div>
        <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors shadow-sm text-sm font-medium">
                <FileText size={16} />
                <span>Export CSV</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-primary/20 text-sm font-medium">
                <Download size={16} />
                <span>Export PDF</span>
            </button>
        </div>
      </div>

      {/* Top Row: Productivity & Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task Status Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">État des Tâches</h3>
            <p className="text-xs text-slate-400 mb-6">Répartition globale</p>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={taskStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {taskStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Member Performance Bar */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Performance par Membre</h3>
            <p className="text-xs text-slate-400 mb-6">Taux de complétion des tâches assignées (%)</p>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberPerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="rate" name="Taux de succès" fill="#1D4ED8" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Middle: Ads Performance */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Performance Campagnes Ads</h3>
                <p className="text-xs text-slate-400">Conversion et Budget</p>
            </div>
            <select className="bg-slate-200 text-black border-transparent text-xs rounded p-2 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium">
                <option>Ce mois-ci</option>
                <option>Derniers 30 jours</option>
            </select>
          </div>
          
          <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          cursor={{fill: '#f8fafc'}}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="spend" name="Budget (€)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar yAxisId="right" dataKey="conversions" name="Ventes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Détail par Campagne</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                          <th className="px-6 py-3 font-semibold">Campagne</th>
                          <th className="px-6 py-3 font-semibold">Budget</th>
                          <th className="px-6 py-3 font-semibold">Clics</th>
                          <th className="px-6 py-3 font-semibold">CTR</th>
                          <th className="px-6 py-3 font-semibold">Conv.</th>
                          <th className="px-6 py-3 font-semibold">CPA</th>
                      </tr>
                  </thead>
                  <tbody>
                      {campaignsData.map((row, idx) => {
                          const ctr = ((row.clicks / (row.impressions * 100)) * 100).toFixed(2);
                          const cpa = (row.spend / row.conversions).toFixed(2);
                          return (
                            <tr key={idx} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                <td className="px-6 py-4">{row.spend}€</td>
                                <td className="px-6 py-4">{row.clicks}</td>
                                <td className="px-6 py-4 text-primary font-bold">{ctr}%</td>
                                <td className="px-6 py-4">{row.conversions}</td>
                                <td className="px-6 py-4 text-success font-bold">{cpa}€</td>
                            </tr>
                          )
                      })}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Reports;
