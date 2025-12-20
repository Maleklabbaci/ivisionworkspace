
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CampaignMetric, User, UserRole, Task, TaskStatus, CampaignCategory } from '../types';
import { PlusCircle, Layers, Megaphone, X, Lock, LayoutGrid, CheckCircle2 } from 'lucide-react';

interface CampaignsProps {
    currentUser: User;
    campaignsData: CampaignMetric[];
    onUpdateCampaign?: (campaign: CampaignMetric) => void;
    onAddCampaign?: (campaign: CampaignMetric) => void;
    tasks: Task[];
    users?: User[];
}

const STATUS_COLORS = {
  [TaskStatus.TODO]: '#D1D1D6',
  [TaskStatus.IN_PROGRESS]: '#0066FF',
  [TaskStatus.BLOCKED]: '#FF3B30',
  [TaskStatus.DONE]: '#34C759',
};

const Campaigns: React.FC<CampaignsProps> = ({ currentUser, campaignsData, onUpdateCampaign, onAddCampaign, tasks, users = [] }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignCategory, setNewCampaignCategory] = useState<CampaignCategory>('content');

  const canView = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.role === UserRole.ANALYST || currentUser.permissions?.canManageCampaigns;

  if (!canView) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-20">
              <div className="bg-red-50 p-10 rounded-full mb-6 flex items-center justify-center"><Lock size={48} className="text-urgent" /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Accès Restreint</h2>
              <p className="text-slate-500 font-bold">L'analyse de performance est réservée aux analystes iVISION.</p>
          </div>
      );
  }

  // Visualisation des 4 états de mission globaux
  const taskStatusDistribution = [
    { name: 'À faire', value: tasks.filter(t => t.status === TaskStatus.TODO).length, status: TaskStatus.TODO },
    { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, status: TaskStatus.IN_PROGRESS },
    { name: 'Bloqué', value: tasks.filter(t => t.status === TaskStatus.BLOCKED).length, status: TaskStatus.BLOCKED },
    { name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length, status: TaskStatus.DONE },
  ].filter(d => d.value > 0);

  // Intensité opérationnelle par projet (Clicks + Conversions comme proxy d'effort)
  const operationalIntensityData = campaignsData.map(c => ({
    name: c.name,
    effort: c.clicks + (c.conversions * 5) // Pondération de l'effort par conversions
  }));

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCampaignName || !onAddCampaign) return;
      onAddCampaign({ name: newCampaignName, category: newCampaignCategory, clicks: 0, conversions: 0, impressions: 0 });
      setShowAddModal(false);
      setNewCampaignName('');
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 page-transition px-2">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Performance Flux</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Analyse des livrables iVISION</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto px-8 py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 active-scale flex items-center justify-center space-x-3 text-xs tracking-[0.2em] border-4 border-white">
            <PlusCircle size={20} strokeWidth={3} />
            <span>NOUVEAU SUIVI PROJET</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ÉTAT DU WORKFLOW (4 STATUTS) */}
        <div className="bg-white p-10 rounded-5xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center uppercase tracking-tight"><Layers size={20} className="mr-3 text-primary" /> Équilibre du Workflow</h3>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Distribution sur les 4 états de mission</p>
              </div>
              <LayoutGrid size={24} className="text-slate-100" />
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                          data={taskStatusDistribution} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={80} 
                          outerRadius={110} 
                          paddingAngle={8} 
                          dataKey="value"
                        >
                            {taskStatusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* INTENSITÉ OPÉRATIONNELLE */}
        <div className="bg-white p-10 rounded-5xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center uppercase tracking-tight"><Megaphone size={20} className="mr-3 text-primary" /> Intensité de Production</h3>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Volume d'effort par campagne</p>
              </div>
              <CheckCircle2 size={24} className="text-slate-100" />
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operationalIntensityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                        <Bar dataKey="effort" fill="#0066FF" radius={[15, 15, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-t-5xl md:rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-500 pb-10">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Nouveau Projet</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-8 space-y-8">
                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-[0.2em] px-2">Nom du projet de performance</label>
                              <input 
                                type="text" 
                                required 
                                value={newCampaignName} 
                                onChange={e => setNewCampaignName(e.target.value)} 
                                className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-3xl font-black focus:bg-white focus:border-primary/20 outline-none transition-all text-slate-900 placeholder-slate-200" 
                                placeholder="Ex: SEO Content Audit" 
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-[0.2em] px-2">Type Stratégique</label>
                              <select 
                                className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-3xl font-black focus:bg-white focus:border-primary/20 outline-none transition-all text-slate-900"
                                value={newCampaignCategory}
                                onChange={e => setNewCampaignCategory(e.target.value as CampaignCategory)}
                              >
                                  <option value="content">Marketing Contenu</option>
                                  <option value="ads">Performance Ads</option>
                                  <option value="social">Engagement Social</option>
                                  <option value="mixed">Mix Stratégique</option>
                              </select>
                          </div>
                      </div>
                      <div className="flex space-x-4 pt-4">
                          <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-3xl transition-all">ANNULER</button>
                          <button type="submit" className="flex-1 py-5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-2xl shadow-primary/30 active-scale border-4 border-white">ACTIVER LE PROJET</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Campaigns;
