
import React, { useState, useEffect } from 'react';
import { Lead, User, UserRole } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Trash2, ArrowUpRight, Target as TargetIcon, UserCheck, PhoneCall, TrendingDown, TrendingUp, Lock, Info, Edit2, Save, Loader2 } from 'lucide-react';
import Modal from './Modal';

const Leads: React.FC<any> = ({ leads = [], onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser, addNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view' | 'edit'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
      case 'lost': return { color: 'text-rose-400', bg: 'bg-rose-400/10', icon: X, label: 'Perdu' };
      default: return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: TargetIcon, label: 'Nouveau' };
    }
  };

  const filteredLeads = leads.filter((l: Lead) => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.company && l.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const closeModals = () => {
    setViewMode('list');
    setSelectedLead(null);
    setIsProcessing(false);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({ 
      name: lead.name, 
      company: lead.company, 
      email: lead.email, 
      phone: lead.phone, 
      status: lead.status, 
      valueMin: lead.valueMin, 
      valueMax: lead.valueMax, 
      description: lead.description 
    });
    setViewMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      addNotification("Validation iV", "L'identité du prospect est requise.", "urgent");
      return;
    }

    setIsProcessing(true);
    try {
      if (viewMode === 'add') {
        await onAddLead(formData);
      } else if (viewMode === 'edit' && selectedLead) {
        await onUpdateLead({ ...formData, id: selectedLead.id });
      }
      closeModals();
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleConvert = async (lead: Lead) => {
    if (!confirm(`Confirmer la promotion de ${lead.name} en Client CRM ?`)) return;
    setIsProcessing(true);
    try {
      await onConvertToClient(lead);
      closeModals();
    } catch (err) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-orange-400 mb-2 tracking-[0.4em]">PROSPECT PIPELINE</p>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Leads</h2>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-72">
               <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="RECHERCHER PROSPECT..." 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase text-white outline-none focus:border-orange-400/50 focus:bg-white/10 transition-all placeholder-slate-700" 
               />
             </div>
             {canManage && (
               <button 
                 onClick={() => { setFormData({ name: '', company: '', email: '', phone: '', status: 'new', valueMin: 0, valueMax: 0, description: '' }); setViewMode('add'); }} 
                 className="w-14 h-14 bg-orange-400 text-slate-950 rounded-2xl shadow-xl shadow-orange-500/10 active-scale flex items-center justify-center hover:bg-orange-300 transition-all"
               >
                 <Plus size={32} strokeWidth={3} />
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeads.map((lead: Lead) => {
            const style = getStatusStyle(lead.status);
            return (
              <div key={lead.id} onClick={() => { setSelectedLead(lead); setViewMode('view'); }} className="crystal-module p-8 rounded-[3rem] border border-white/5 group cursor-pointer relative overflow-hidden active-scale text-left">
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${style.bg} ${style.color} border border-white/5 shadow-inner`}>
                    <style.icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full glass ${style.color}`}>{style.label}</span>
                </div>
                <div>
                  <h3 className="font-black text-white text-base truncate uppercase tracking-tight leading-none">{lead.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 truncate">{lead.company || 'Indépendant'}</p>
                </div>
                
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Projection Budget</span>
                    <span className="text-[12px] font-black text-white mt-1 block tracking-tight">
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
          {filteredLeads.length === 0 && (
            <div className="col-span-full py-20 glass rounded-[3rem] border-dashed border-2 border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
               <Target size={40} className="mb-4 text-slate-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucun prospect détecté dans le pipe</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={viewMode === 'add' || viewMode === 'edit'} 
        onClose={closeModals}
        title={viewMode === 'add' ? "Indexation Prospect" : "Édition Dossier"}
        subtitle="Moteur de Croissance iVISION"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                 <label className="label-iv">Identité Prospect (Requis)</label>
                 <input required className="input-iv" placeholder="Nom Complet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                 <label className="label-iv">Organisation</label>
                 <input className="input-iv" placeholder="Entreprise" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                 <label className="label-iv"><Mail size={14} className="text-orange-400"/> Email</label>
                 <input type="email" className="input-iv" placeholder="pro@domaine.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                 <label className="label-iv"><Phone size={14} className="text-orange-400"/> Mobile</label>
                 <input type="tel" className="input-iv" placeholder="+213..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                 <label className="label-iv">Niveau de Qualification</label>
                 <select className="input-iv cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                   <option value="new">NOUVELLE ENTRÉE</option>
                   <option value="contacted">PREMIER CONTACT</option>
                   <option value="qualified">PROSPECT VALIDÉ</option>
                   <option value="lost">OPPORTUNITÉ PERDUE</option>
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="label-iv text-[8px]">Budget Min</label>
                    <input type="number" min="0" className="input-iv" value={formData.valueMin} onChange={e => setFormData({...formData, valueMin: Number(e.target.value) || 0})} />
                 </div>
                 <div>
                    <label className="label-iv text-[8px]">Budget Max</label>
                    <input type="number" min="0" className="input-iv" value={formData.valueMax} onChange={e => setFormData({...formData, valueMax: Number(e.target.value) || 0})} />
                 </div>
              </div>
           </div>

           <div>
              <label className="label-iv"><Info size={14} className="text-orange-400"/> Analyse Stratégique</label>
              <textarea className="input-iv h-32 resize-none leading-relaxed" placeholder="Besoins identifiés, contexte du marché..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
           </div>

           <button type="submit" disabled={isProcessing} className="w-full py-7 bg-orange-400 text-slate-950 font-black rounded-[2rem] shadow-2xl active-scale uppercase text-[11px] tracking-[0.2em] mt-4 hover:bg-orange-300 transition-all flex items-center justify-center space-x-3">
             {isProcessing ? <Loader2 className="animate-spin" size={20}/> : (viewMode === 'add' ? <Plus size={20}/> : <Save size={20}/>)}
             <span>{viewMode === 'add' ? "Activer le Prospect" : "Enregistrer les modifications"}</span>
           </button>
        </form>
      </Modal>

      <Modal 
        isOpen={viewMode === 'view' && !!selectedLead} 
        onClose={closeModals}
        title={selectedLead?.name}
        subtitle={`ID iV: ${selectedLead?.id?.substring(0,8).toUpperCase()}`}
      >
        <div className="space-y-8 text-left">
           <div className="flex flex-wrap gap-3">
              <div className={`px-5 py-2.5 rounded-2xl inline-flex items-center space-x-3 ${getStatusStyle(selectedLead?.status || 'new').bg} ${getStatusStyle(selectedLead?.status || 'new').color} border border-white/5`}>
                 {React.createElement(getStatusStyle(selectedLead?.status || 'new').icon, { size: 16, strokeWidth: 3 })}
                 <span className="text-[11px] font-black tracking-[0.1em] uppercase">{getStatusStyle(selectedLead?.status || 'new').label}</span>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 text-[11px] font-black uppercase tracking-widest">
                 Indexé le {new Date(selectedLead?.createdAt || '').toLocaleDateString()}
              </div>
           </div>

           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
              <h4 className="label-iv mb-5 text-orange-400"><Info size={16}/> Analyse des besoins</h4>
              <p className="text-base text-slate-300 leading-relaxed font-medium">{selectedLead?.description || "Aucun brief renseigné pour ce dossier."}</p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                 <p className="label-iv mb-2">Budget Projet</p>
                 <p className="text-xl font-black text-white">{selectedLead?.valueMin?.toLocaleString()} — {selectedLead?.valueMax?.toLocaleString()} DZD</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                 <div className="flex items-center text-slate-300 space-x-3">
                    <Mail size={16} className="text-orange-400"/>
                    <span className="text-sm font-bold truncate">{selectedLead?.email || 'Pas d\'email'}</span>
                 </div>
                 <div className="flex items-center text-slate-300 space-x-3">
                    <Phone size={16} className="text-orange-400"/>
                    <span className="text-sm font-bold">{selectedLead?.phone || 'Pas de mobile'}</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                disabled={isProcessing}
                onClick={() => selectedLead && handleConvert(selectedLead)} 
                className="flex-1 py-6 bg-white text-slate-950 font-black rounded-[2rem] shadow-xl active-scale uppercase text-[11px] tracking-tight hover:bg-emerald-400 hover:text-white transition-all flex items-center justify-center space-x-3"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <UserCheck size={20}/>}
                <span>Convertir en Client CRM</span>
              </button>
              
              <div className="flex gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => selectedLead && handleEditClick(selectedLead)} 
                  className="flex-1 sm:w-20 py-5 glass text-slate-500 font-black rounded-[2rem] hover:text-orange-400 hover:bg-white/5 transition-all active-scale border border-white/5 flex items-center justify-center"
                >
                  <Edit2 size={24}/>
                </button>
                <button 
                  onClick={() => { if(selectedLead && confirm('Révoquer définitivement ce prospect ?')) { onDeleteLead(selectedLead.id); closeModals(); } }} 
                  className="flex-1 sm:w-20 py-5 glass text-slate-500 font-black rounded-[2rem] hover:text-rose-500 hover:bg-rose-500/10 transition-all active-scale border border-white/5 flex items-center justify-center"
                >
                  <Trash2 size={24}/>
                </button>
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Leads;
