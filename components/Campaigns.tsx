
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CampaignMetric, User, UserRole, Task, TaskStatus, CampaignCategory } from '../types';
import { PlusCircle, Layers, Megaphone, X, Lock, LayoutGrid, CheckCircle2 } from 'lucide-react';

const STATUS_COLORS = {
  [TaskStatus.TODO]: '#D1D1D6',
  [TaskStatus.IN_PROGRESS]: '#0066FF',
  [TaskStatus.BLOCKED]: '#FF3B30',
  [TaskStatus.DONE]: '#34C759',
};

const Campaigns: React.FC<any> = ({ currentUser, campaignsData, onAddCampaign, tasks }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignCategory, setNewCampaignCategory] = useState<CampaignCategory>('content');

  const canView = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.role === UserRole.ANALYST || currentUser.permissions?.canManageCampaigns;

  if (!canView) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-20">
              <div className="bg-rose-500/10 p-10 rounded-full mb-6 flex items-center justify-center text-rose-500 shadow-xl border border-rose-500/10"><Lock size={48} /></div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Accès Restreint</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Analyse réservée aux experts marketing.</p>
          </div>
      );
  }

  const taskStatusDistribution = [
    { name: 'À faire', value: tasks.filter((t:any) => t.status === TaskStatus.TODO).length, status: TaskStatus.TODO },
    { name: 'En cours', value: tasks.filter((t:any) => t.status === TaskStatus.IN_PROGRESS).length, status: TaskStatus.IN_PROGRESS },
    { name: 'Bloqué', value: tasks.filter((t:any) => t.status === TaskStatus.BLOCKED).length, status: TaskStatus.BLOCKED },
    { name: 'Terminé', value: tasks.filter((t:any) => t.status === TaskStatus.DONE).length, status: TaskStatus.DONE },
  ].filter(d => d.value > 0);

  const operationalIntensityData = campaignsData.map((c:any) => ({
    name: c.name,
    effort: Math.round((c.conversions * 10) + (c.clicks * 0.5) + (c.impressions / 1000))
  }));

  const closeModals = () => {
    setShowAddModal(false);
    setNewCampaignName('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCampaignName || !onAddCampaign) return;
      onAddCampaign({ name: newCampaignName, category: newCampaignCategory, clicks: 0, conversions: 0, impressions: 0 });
      closeModals();
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 animate-fade-in px-2">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">ANALYTICS CORE</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Performance</h2>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto px-8 py-5 bg-primary text-white font-black rounded-3xl shadow-xl active-scale flex items-center justify-center space-x-3 text-[10px] tracking-[0.3em] transition-all hover:bg-primary/80">
            <PlusCircle size={20} strokeWidth={3} />
            <span>ACTIVER PROJET DATA</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/5 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-white text-lg flex items-center uppercase tracking-tight leading-none"><Layers size={20} className="mr-3 text-primary" /> Workflow</h3>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-none">Équilibre opérationnel</p>
              </div>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={taskStatusDistribution} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                            {taskStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />)}
                        </Pie>
                        <Tooltip contentStyle={{background: '#020617', border: 'none', borderRadius: '15px'}} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/5 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-white text-lg flex items-center uppercase tracking-tight leading-none"><Megaphone size={20} className="mr-3 text-primary" /> Effort</h3>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-none">Volume de production</p>
              </div>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operationalIntensityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" axisLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                        <YAxis hide />
                        <Tooltip contentStyle={{background: '#020617', border: 'none', borderRadius: '15px'}} />
                        <Bar dataKey="effort" fill="#0EA5E9" radius={[15, 15, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* MODAL ACTIVATION DATA - UNIFIED */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-center-wrapper">
            <div className="modal-container">
              <div className="modal-content-glass animate-fade-in">
                  <div className="flex justify-between items-start mb-8 md:mb-10">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-none">Nouveau Projet</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 md:mt-3">Paramétrage Analytique iVISION</p>
                      </div>
                      <button onClick={closeModals} className="w-10 h-10 md:w-12 md:h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="space-y-4 md:space-y-8">
                      <div className="space-y-1.5">
                          <label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 px-2 leading-none">Nom du projet Performance</label>
                          <input type="text" required value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="w-full p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-3xl font-black text-white outline-none focus:border-primary transition-all text-xs md:text-sm placeholder-slate-800" placeholder="Ex: SEO Audit 2024" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 px-2 leading-none">Noyau Stratégique</label>
                          <select className="w-full p-4 md:p-6 bg-slate-900 border border-white/10 rounded-xl md:rounded-3xl font-black text-white outline-none focus:border-primary transition-all text-xs md:text-sm appearance-none cursor-pointer" value={newCampaignCategory} onChange={e => setNewCampaignCategory(e.target.value as CampaignCategory)}>
                              <option value="content">Marketing Contenu</option>
                              <option value="ads">Performance Ads</option>
                              <option value="social">Engagement Social</option>
                              <option value="mixed">Mix Stratégique</option>
                          </select>
                      </div>
                      <button type="submit" className="w-full py-5 md:py-8 bg-primary text-white font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.4em] rounded-2xl md:rounded-[2.5rem] shadow-2xl active-scale transition-all hover:bg-primary/80 mt-2 md:mt-4">
                        Activer le Flux Data
                      </button>
                  </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
