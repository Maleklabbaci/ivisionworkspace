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

const COLORS = ['#1D4ED8', '#10B981', '#f59e0b', '#EF4444'];

const Campaigns: React.FC<CampaignsProps> = ({ currentUser, campaignsData, onUpdateCampaign, onAddCampaign, tasks, users = [] }) => {
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [editSpendValue, setEditSpendValue] = useState<number>(0);
  const [editBudgetValue, setEditBudgetValue] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignBudget, setNewCampaignBudget] = useState(0);
  const [newCampaignCategory, setNewCampaignCategory] = useState<CampaignCategory>('content');

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canManageCampaigns;
  const canView = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.role === UserRole.ANALYST || currentUser.permissions?.canManageCampaigns;

  if (!canView) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="bg-red-50 p-6 rounded-full mb-4"><Lock size={48} className="text-urgent" /></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
              <p className="text-slate-500">Section réservée à l'administration.</p>
          </div>
      );
  }

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCampaignName || !onAddCampaign) return;
      onAddCampaign({ name: newCampaignName, category: newCampaignCategory, budget: newCampaignBudget, spend: 0, clicks: 0, conversions: 0, impressions: 0 });
      setShowAddModal(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 page-transition">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performances</h2>
            <p className="text-slate-500 font-bold">Analytique Campagnes iVISION</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto px-6 py-4 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 active-scale flex items-center justify-center space-x-2">
            <PlusCircle size={20} />
            <span>NOUVELLE CAMPAGNE</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="font-black text-slate-900 mb-6 flex items-center"><Layers size={20} className="mr-2 text-primary" /> État des Tâches</h3>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={[{ name: 'Terminé', value: tasks.filter(t => t.status === TaskStatus.DONE).length }, { name: 'En cours', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="font-black text-slate-900 mb-6 flex items-center"><Megaphone size={20} className="mr-2 text-primary" /> Budget Global</h3>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none'}} />
                        <Bar dataKey="spend" fill="#1D4ED8" radius={[12, 12, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-t-5xl md:rounded-5xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-400">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Créer</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nom de campagne</label>
                          <input type="text" required value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl font-bold focus:bg-white focus:border-primary/20 outline-none transition-all text-slate-900" placeholder="Ex: Campagne Hiver" />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Budget Alloué (DA)</label>
                          <input type="number" required value={newCampaignBudget} onChange={e => setNewCampaignBudget(Number(e.target.value))} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl font-bold focus:bg-white focus:border-primary/20 outline-none transition-all text-slate-900" />
                      </div>
                      <div className="flex space-x-3">
                          <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-3xl transition-all">ANNULER</button>
                          <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/30 active-scale">CRÉER</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Campaigns;