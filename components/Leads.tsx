
import React, { useState, useMemo } from 'react';
import { Lead, User, UserRole } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Building2, Trash2, Edit2, ChevronRight, Zap, TrendingUp, Filter, Lock, DollarSign, PieChart, CheckCircle2 } from 'lucide-react';

interface LeadsProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onConvertToClient: (lead: Lead) => void;
  currentUser: User;
}

const Leads: React.FC<LeadsProps> = ({ leads, onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', company: '', email: '', phone: '', status: 'new', source: '', value: 0, description: ''
  });

  const canAccess = currentUser && (
    currentUser.role === UserRole.ADMIN || 
    currentUser.role === UserRole.PROJECT_MANAGER || 
    currentUser.permissions?.canManageLeads === true
  );

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  // Statistiques du pipeline
  const stats = useMemo(() => {
    const totalValue = leads.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const qualifiedCount = leads.filter(l => l.status === 'qualified').length;
    const newCount = leads.filter(l => l.status === 'new').length;
    return { totalValue, qualifiedCount, newCount };
  }, [leads]);

  if (!canAccess) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 pt-16">
            <div className="bg-orange-50 p-8 rounded-full mb-4 flex items-center justify-center">
                <Lock size={32} className="text-orange-500" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 tracking-tighter uppercase">Accès Leads Restreint</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Demandez l'autorisation à votre administrateur.</p>
        </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const leadData: Lead = {
      id: selectedLead?.id || `lead-${Date.now()}`,
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      status: formData.status as any || 'new',
      source: formData.source,
      value: Number(formData.value) || 0,
      description: formData.description,
      createdAt: selectedLead?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (selectedLead) onUpdateLead(leadData);
    else onAddLead(leadData);
    
    setShowModal(false);
    setSelectedLead(null);
  };

  const inputClasses = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-orange-400 outline-none transition-all text-sm";

  return (
    <div className="space-y-8 page-transition pb-24">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pipeline Leads</h2>
          <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Acquisition iVISION • Algérie</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Chercher un nom ou une entreprise..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-xs font-bold outline-none text-slate-900 focus:ring-4 focus:ring-orange-500/5 transition-all" 
            />
          </div>
          <button 
            onClick={() => { setSelectedLead(null); setFormData({name: '', company: '', email: '', phone: '', status: 'new', source: '', value: 0, description: ''}); setShowModal(true); }} 
            className="bg-orange-500 text-white p-4 px-8 rounded-3xl shadow-2xl shadow-orange-500/20 active-scale flex items-center justify-center font-black text-[10px] tracking-widest uppercase border-4 border-white hover:bg-orange-600 transition-all"
          >
            <Plus size={20} className="mr-2" strokeWidth={3} /> CAPTURER UN LEAD
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valeur du Pipeline</p>
            <p className="text-xl font-black text-slate-900">{stats.totalValue.toLocaleString()} <span className="text-[10px] text-orange-500 ml-1">DZD</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qualifiés</p>
            <p className="text-xl font-black text-slate-900">{stats.qualifiedCount} <span className="text-[10px] text-slate-300 ml-1">PROSPECTS</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nouveaux ce mois</p>
            <p className="text-xl font-black text-slate-900">{stats.newCount} <span className="text-[10px] text-slate-300 ml-1">ARRIVÉES</span></p>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
        {filteredLeads.map(lead => (
          <div 
            key={lead.id} 
            className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:translate-y-[-4px] active-scale group cursor-pointer flex flex-col transition-all"
            onClick={() => { setSelectedLead(lead); setFormData(lead); setShowModal(true); }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-slate-50 text-orange-500 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400 transition-all shadow-sm">
                <Target size={24} />
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                lead.status === 'qualified' ? 'bg-success/5 border-success/20 text-success' : 
                lead.status === 'lost' ? 'bg-red-50 border-urgent/20 text-urgent' : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>
                {lead.status === 'new' ? 'Nouveau' : lead.status === 'contacted' ? 'Contacté' : lead.status === 'qualified' ? 'Qualifié' : 'Perdu'}
              </div>
            </div>
            
            <h3 className="font-black text-slate-900 text-base truncate uppercase tracking-tight">{lead.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{lead.company || 'Sans Entreprise'}</p>
            
            <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Valeur estimée</span>
                <span className="text-sm font-black text-slate-900">{(lead.value || 0).toLocaleString()} <span className="text-[9px] text-orange-500 ml-0.5">DZD</span></span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onConvertToClient(lead); }} 
                  className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm flex items-center justify-center border border-orange-100"
                  title="Convertir en Client CRM"
                >
                  <Zap size={18} fill="currentColor" fillOpacity={0.2} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredLeads.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-30">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp size={48} className="text-slate-300" />
            </div>
            <p className="font-black text-xs uppercase tracking-[0.4em] text-slate-400">Aucun prospect correspondant</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-t-[3rem] lg:rounded-[4rem] w-full max-w-2xl mx-auto flex flex-col modal-drawer shadow-2xl overflow-hidden border-b-[12px] border-orange-500">
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white z-20">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{selectedLead ? 'Modifier Prospect' : 'Nouveau Prospect'}</h3>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Saisie rapide iVISION</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 active-scale hover:bg-slate-100 transition-colors"><X size={24}/></button>
            </header>
            
            <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-16">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Nom du Contact *</label>
                    <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Ahmed Benali" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Entreprise</label>
                    <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Ex: Sarl Tech DZ" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">E-mail</label>
                    <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@email.dz" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Téléphone</label>
                    <input type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="05XX XX XX XX" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Status actuel</label>
                    <select className={inputClasses + " appearance-none"} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      <option value="new">Nouveau Lead</option>
                      <option value="contacted">Contact établi</option>
                      <option value="qualified">Opportunité qualifiée</option>
                      <option value="lost">Opportunité perdue</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Valeur Estimée (DZD)</label>
                    <input type="number" className={inputClasses} value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} placeholder="Ex: 50000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Notes & Briefing</label>
                  <textarea 
                    className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-orange-400 outline-none transition-all text-sm resize-none" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Besoins du client, budget, délais..." 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex flex-col gap-4">
                <button 
                  onClick={handleSubmit} 
                  className="w-full py-6 bg-orange-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/20 border-4 border-white active-scale transition-all"
                >
                  {selectedLead ? 'METTRE À JOUR' : 'ENREGISTRER LE PROSPECT'}
                </button>
                
                {selectedLead && (
                  <button 
                    onClick={() => { if(confirm('Voulez-vous vraiment supprimer ce prospect ?')) { onDeleteLead(selectedLead.id); setShowModal(false); } }} 
                    className="w-full py-4 text-urgent font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-colors"
                  >
                    Supprimer définitivement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
