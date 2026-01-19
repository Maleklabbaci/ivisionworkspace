
import React, { useState } from 'react';
import { Lead, User, UserRole } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Trash2, ArrowUpRight, Target as TargetIcon, UserCheck, PhoneCall, TrendingDown, TrendingUp, Lock, Info } from 'lucide-react';
import Modal from './Modal';

const Leads: React.FC<any> = ({ leads = [], onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser, addNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({ 
    name: '', 
    company: '', 
    email: '', 
    phone: '', 
    status: 'new', 
    valueMin: 0, 
    valueMax: 0, 
    description: '' 
  });

  const canManage = currentUser.role === UserRole.ADMIN || !!currentUser.permissions?.canManageLeads;

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'qualified': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: UserCheck, label: 'Qualifié' };
      case 'contacted': return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', icon: PhoneCall, label: 'Contacté' };
      default: return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: TargetIcon, label: 'Nouveau' };
    }
  };

  const filteredLeads = leads.filter((l: Lead) => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const closeModals = () => {
    setViewMode('list');
    setSelectedLead(null);
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex justify-between items-end px-2">
          <div>
            <p className="text-[10px] font-black uppercase text-orange-400 mb-2 tracking-[0.4em]">PROSPECT PIPELINE</p>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Leads</h2>
          </div>
          {canManage && (
            <button onClick={() => { setFormData({ name: '', company: '', email: '', phone: '', status: 'new', valueMin: 0, valueMax: 0, description: '' }); setViewMode('add'); }} className="w-14 h-14 bg-orange-400 text-slate-950 rounded-2xl shadow-xl shadow-orange-500/10 active-scale flex items-center justify-center">
              <Plus size={32} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeads.map((lead: Lead) => {
            const style = getStatusStyle(lead.status);
            return (
              <div key={lead.id} onClick={() => { setSelectedLead(lead); setViewMode('view'); }} className="glass-card p-8 rounded-[3rem] border border-white/5 group cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${style.bg} ${style.color}`}>
                    <style.icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full glass ${style.color}`}>{style.label}</span>
                </div>
                <h3 className="font-black text-white text-base truncate uppercase tracking-tight leading-none">{lead.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 truncate">{lead.company || 'Indépendant'}</p>
                
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valeur Estimée</span>
                    <span className="text-[12px] font-black text-white mt-1 block">
                      {lead.valueMin?.toLocaleString()} - {lead.valueMax?.toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 group-hover:text-orange-400 transition-all">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal 
        isOpen={viewMode === 'add'} 
        onClose={closeModals}
        title="Nouveau Prospect"
        subtitle="Indexation Pipeline iVISION"
      >
        <form onSubmit={(e) => { e.preventDefault(); onAddLead(formData); closeModals(); }} className="space-y-6 md:space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                 <label className="label-iv">Identité Prospect</label>
                 <input required className="input-iv" placeholder="Ex: Jean Dupont" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                 <label className="label-iv">Organisation</label>
                 <input className="input-iv" placeholder="Entreprise" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                 <label className="label-iv"><Mail size={14} className="text-orange-400"/> Email Pro</label>
                 <input type="email" className="input-iv" placeholder="mail@pro.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                 <label className="label-iv"><Phone size={14} className="text-orange-400"/> Ligne Directe</label>
                 <input type="tel" className="input-iv" placeholder="+213..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-5 pt-2">
              <div>
                 <label className="label-iv"><TrendingDown size={14} className="text-orange-400"/> Budget Min (DZD)</label>
                 <input type="number" className="input-iv" placeholder="0" value={formData.valueMin} onChange={e => setFormData({...formData, valueMin: Number(e.target.value)})} />
              </div>
              <div>
                 <label className="label-iv"><TrendingUp size={14} className="text-orange-400"/> Budget Max (DZD)</label>
                 <input type="number" className="input-iv" placeholder="0" value={formData.valueMax} onChange={e => setFormData({...formData, valueMax: Number(e.target.value)})} />
              </div>
           </div>

           <button className="w-full py-7 bg-[#FF9F1C] text-slate-950 font-black rounded-[2rem] shadow-2xl shadow-orange-500/10 active-scale uppercase text-[11px] tracking-tight mt-6 transition-all hover:bg-orange-300">
             Confirmer Prospect
           </button>
        </form>
      </Modal>

      <Modal 
        isOpen={viewMode === 'view' && !!selectedLead} 
        onClose={closeModals}
        title={selectedLead?.name}
        subtitle={`Identifiant iV: ${selectedLead?.id?.substring(0,8).toUpperCase()}`}
      >
        <div className="space-y-8">
           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
              <h4 className="label-iv mb-5 text-orange-400"><Info size={16}/> Brief Prospect</h4>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">{selectedLead?.description || "Aucun brief spécifique."}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-5">
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                 <p className="label-iv mb-2">Budget Min</p>
                 <p className="text-base md:text-xl font-black text-white">{selectedLead?.valueMin?.toLocaleString()} DZD</p>
              </div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                 <p className="label-iv mb-2">Budget Max</p>
                 <p className="text-base md:text-xl font-black text-orange-400">{selectedLead?.valueMax?.toLocaleString()} DZD</p>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                onClick={() => { if(confirm('Convertir ce lead en compte CRM ?')) onConvertToClient(selectedLead); }} 
                className="flex-1 py-6 bg-white text-slate-950 font-black rounded-[2rem] shadow-xl active-scale uppercase text-[11px] tracking-tight hover:bg-orange-400 hover:text-white transition-all"
              >
                Convertir en Client
              </button>
              <button 
                onClick={() => { if(confirm('Supprimer définitivement ce lead ?')) { onDeleteLead(selectedLead?.id); closeModals(); } }} 
                className="w-full sm:w-20 h-auto py-5 glass text-slate-500 font-black rounded-[2rem] hover:text-urgent hover:bg-urgent/10 transition-all active-scale border border-white/5 flex items-center justify-center"
              >
                <Trash2 size={24}/>
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Leads;
