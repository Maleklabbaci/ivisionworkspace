

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CampaignMetric, User, UserRole, Task, TaskStatus, CampaignCategory } from '../types';
import { Download, FileText, Lock, Edit2, Check, X, PlusCircle, Video, Megaphone, Share2, Layers } from 'lucide-react';

interface CampaignsProps {
    currentUser: User;
    campaignsData: CampaignMetric[];
    onUpdateCampaign?: (campaign: CampaignMetric) => void;
    onAddCampaign?: (campaign: CampaignMetric) => void;
    tasks: Task[];
    users?: User[];
}

// Minimalist Palette: Blue (Primary), Green (Success), Orange (Blocked), Red (Urgent)
const COLORS = ['#1D4ED8', '#10B981', '#f59e0b', '#EF4444'];

const Campaigns: React.FC<CampaignsProps> = ({ currentUser, campaignsData, onUpdateCampaign, onAddCampaign, tasks, users = [] }) => {
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [editSpendValue, setEditSpendValue] = useState<number>(0);
  const [editBudgetValue, setEditBudgetValue] = useState<number>(0);
  
  // Add Campaign Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignBudget, setNewCampaignBudget] = useState(0);
  const [newCampaignCategory, setNewCampaignCategory] = useState<CampaignCategory>('content');

  // Permission Checks
  const canManage = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canManageCampaigns;
  const canExport = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canExportReports;

  // View Access: Admin, PM, Analyst OR canManageCampaigns permission
  const canView = 
      currentUser.role === UserRole.ADMIN || 
      currentUser.role === UserRole.PROJECT_MANAGER || 
      currentUser.role === UserRole.ANALYST ||
      currentUser.permissions?.canManageCampaigns;

  if (!canView) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="bg-red-50 p-6 rounded-full mb-4">
                  <Lock size={48} className="text-urgent" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
              <p className="text-slate-500 max-w-md">
                  Cette section est réservée aux administrateurs ou aux membres disposant d'une permission spéciale.
              </p>
          </div>
      );
  }

  const handleStartEdit = (campaign: CampaignMetric) => {
      if (!canManage) return;
      setEditingCampaign(campaign.name);
      setEditSpendValue(campaign.spend);
      setEditBudgetValue(campaign.budget || 0);
  };

  const handleSaveEdit = (campaign: CampaignMetric) => {
      if (onUpdateCampaign) {
          onUpdateCampaign({ ...campaign, spend: editSpendValue, budget: editBudgetValue });
      }
      setEditingCampaign(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCampaignName || !onAddCampaign) return;

      const newCampaign: CampaignMetric = {
          name: newCampaignName,
          category: newCampaignCategory,
          budget: newCampaignBudget,
          spend: 0,
          clicks: 0,
          conversions: 0,
          impressions: 0
      };

      onAddCampaign(newCampaign);
      setShowAddModal(false);
      setNewCampaignName('');
      setNewCampaignBudget(0);
      setNewCampaignCategory('content');
  };

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

  const getCategoryIcon = (category: CampaignCategory) => {
      switch (category) {
          case 'ads': return <Megaphone size={16} className="text-green-600" />;
          case 'content': return <Video size={16} className="text-blue-600" />; // Content / Creative Video
          case 'social': return <Share2 size={16} className="text-purple-600" />; // Social Media
          default: return <Layers size={16} className="text-slate-500" />; // Mixed
      }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 relative">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Rapports & Campagnes</h2>
            <p className="text-slate-500">Suivi des projets clients (Vidéos, Design, Ads)</p>
        </div>
        <div className="flex flex-wrap gap-3">
            {canManage && (
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-primary/20 text-sm font-medium"
                >
                    <PlusCircle size={16} />
                    <span>Nouvelle Campagne</span>
                </button>
            )}
            
            {canExport && (
                <div className="flex space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors shadow-sm text-sm font-medium">
                        <FileText size={16} />
                        <span>CSV</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors shadow-sm text-sm font-medium">
                        <Download size={16} />
                        <span>PDF</span>
                    </button>
                </div>
            )}
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
                <h3 className="text-lg font-bold text-slate-800">Performance Campagnes</h3>
                <p className="text-xs text-slate-400">Comparaison Budget Prévu vs Dépensé (Tous types confondus)</p>
            </div>
            <select className="bg-gray-200 text-black border border-gray-300 text-xs rounded p-2 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium">
                <option>Ce mois-ci</option>
                <option>Derniers 30 jours</option>
            </select>
          </div>
          
          <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          cursor={{fill: '#f8fafc'}}
                          formatter={(value: number) => `${value} DA`}
                      />
                      <Legend />
                      <Bar dataKey="budget" name="Budget Alloué (DA)" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="spend" name="Dépensé (DA)" fill="#1D4ED8" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Gestion des Projets & Budgets</h3>
              <p className="text-xs text-slate-500">Suivi détaillé par campagne (Creative, Ads, Social).</p>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                          <th className="px-6 py-3 font-semibold">Campagne / Service</th>
                          <th className="px-6 py-3 font-semibold">Dépensé (Réel)</th>
                          <th className="px-6 py-3 font-semibold">Budget (Prévu)</th>
                          <th className="px-6 py-3 font-semibold">Utilisation</th>
                          <th className="px-6 py-3 font-semibold">Conv.</th>
                          <th className="px-6 py-3 font-semibold">CPA</th>
                      </tr>
                  </thead>
                  <tbody>
                      {campaignsData.map((row, idx) => {
                          const percentUsed = row.budget > 0 ? Math.round((row.spend / row.budget) * 100) : 0;
                          const cpa = row.conversions > 0 ? (row.spend / row.conversions).toFixed(2) : '0.00';
                          const isEditing = editingCampaign === row.name;

                          return (
                            <tr key={idx} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center space-x-3">
                                    <span className="p-1.5 bg-slate-100 rounded-md border border-slate-200" title={`Type: ${row.category}`}>
                                        {getCategoryIcon(row.category)}
                                    </span>
                                    <span>{row.name}</span>
                                </td>
                                
                                {/* EDITABLE CELLS */}
                                {isEditing ? (
                                    <>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                value={editSpendValue} 
                                                onChange={(e) => setEditSpendValue(Number(e.target.value))}
                                                className="w-20 p-1 border border-primary rounded bg-white text-slate-900 outline-none"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                value={editBudgetValue} 
                                                onChange={(e) => setEditBudgetValue(Number(e.target.value))}
                                                className="w-20 p-1 border border-primary rounded bg-white text-slate-900 outline-none"
                                            />
                                        </td>
                                        <td className="px-6 py-4 col-span-3">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleSaveEdit(row)} className="text-success hover:bg-green-50 p-1 rounded"><Check size={16}/></button>
                                                <button onClick={() => setEditingCampaign(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={16}/></button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4">{row.spend} DA</td>
                                        <td className="px-6 py-4">{row.budget} DA</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${percentUsed > 100 ? 'bg-urgent' : percentUsed > 80 ? 'bg-orange-500' : 'bg-success'}`} 
                                                        style={{width: `${Math.min(percentUsed, 100)}%`}}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-400">{percentUsed}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{row.conversions}</td>
                                        <td className="px-6 py-4 flex items-center justify-between">
                                            <span className="text-success font-bold">{cpa} DA</span>
                                            {canManage && (
                                                <button 
                                                    onClick={() => handleStartEdit(row)}
                                                    className="ml-2 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                          )
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Campaign Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Créer une nouvelle campagne</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la campagne</label>
                          <input 
                            type="text" 
                            required
                            value={newCampaignName}
                            onChange={e => setNewCampaignName(e.target.value)}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-500 font-medium"
                            placeholder="Ex: Lancement Été 2024"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Type de Service</label>
                          <select 
                            value={newCampaignCategory}
                            onChange={e => setNewCampaignCategory(e.target.value as CampaignCategory)}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                          >
                              <option value="content">Création de Contenu (Vidéo / Design)</option>
                              <option value="ads">Publicité (Ads / Performance)</option>
                              <option value="social">Social Media (Community Management)</option>
                              <option value="mixed">Mixte (360°)</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Budget Alloué (DA)</label>
                          <input 
                            type="number" 
                            required
                            min="0"
                            value={newCampaignBudget}
                            onChange={e => setNewCampaignBudget(Number(e.target.value))}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-500 font-medium"
                            placeholder="Ex: 50000"
                          />
                      </div>
                      
                      <div className="pt-4 flex space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Annuler
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95"
                          >
                              Créer
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Campaigns;