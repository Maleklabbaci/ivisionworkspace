
import React, { useState, useMemo } from 'react';
import { Lead, User, UserRole } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Building2, Trash2, Edit2, ChevronRight, Zap, TrendingUp, Lock, DollarSign, CheckCircle2, AlertTriangle, Loader2, Calendar, MessageSquare, ExternalLink } from 'lucide-react';

interface LeadsProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertToClient: (lead: Lead) => void;
  currentUser: User;
}

const Leads: React.FC<LeadsProps> = ({ leads, onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', company: '', email: '', phone: '', status: 'new', source: '', valueMin: 0, valueMax: 0, description: ''
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

  const stats = useMemo(() => {
    const totalValue = leads.reduce((acc, curr) => acc + (curr.valueMin || 0), 0);
    const qualifiedCount = leads.filter(l => l.status === 'qualified').length;
    const newCount = leads.filter(l => l.status === 'new').length;
    return { totalValue, qualifiedCount, newCount };
  }, [leads]);

  if (!canAccess) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-16">
            <div className="bg-orange-50 p-8 rounded-full mb-4 flex items-center justify-center">
                <Lock size={32} className="text-orange-500" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 tracking-tighter uppercase">Accès Leads Restreint</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Privilèges iVISION requis.</p>
        </div>
    );
  }

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData(lead);
    setViewMode('view');
  };

  const handleStatusQuickChange = (newStatus: any) => {
    if (selectedLead) {
        const updated = { ...selectedLead, status: newStatus };
        onUpdateLead(updated);
        setSelectedLead(updated);
    }
  };

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
      valueMin: Number(formData.valueMin) || 0,
      valueMax: Number(formData.valueMax) || 0,
      description: formData.description,
      createdAt: selectedLead?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (selectedLead && viewMode === 'edit') onUpdateLead(leadData);
    else onAddLead(leadData);
    
    setViewMode('list');
    setSelectedLead(null);
  };

  const confirmDelete = async () => {
    if (!selectedLead || isDeleting) return;
    setIsDeleting(true);
    try {
        await onDeleteLead(selectedLead.id);
        setShowDeleteConfirm(false);
        setViewMode('list');
        setSelectedLead(null);
    } catch (err) {
        console.error(err);
    } finally {
        setIsDeleting(false);
    }
  };

  const inputClasses = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-orange-400 outline-none transition-all text-sm";

  return (
    <div className="space-y-8 page-transition pb-24">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pipeline Leads</h2>
          <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Acquisition iVISION Intelligence</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Rechercher un prospect..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-xs font-bold outline-none text-slate-900 focus:ring-4 focus:ring-orange-500/5 transition-all" 
            />
          </div>
          <button 
            onClick={() => { setSelectedLead(null); setFormData({name: '', company: '', email: '', phone: '', status: 'new', source: '', valueMin: 0, valueMax: 0, description: ''}); setViewMode('edit'); }} 
            className="bg-orange-500 text-white p-4 px-8 rounded-3xl shadow-2xl shadow-orange-500/20 active-scale flex items-center justify-center font-black text-[10px] tracking-widest uppercase border-4 border-white transition-all"
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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volume Estimé</p>
            <p className="text-xl font-black text-slate-900">{stats.totalValue.toLocaleString()} <span className="text-[10px] text-orange-500 ml-1">DZD</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opportunités</p>
            <p className="text-xl font-black text-slate-900">{stats.qualifiedCount} <span className="text-[10px] text-slate-300 ml-1">QUALIFIÉS</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Target size={24} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nouveaux</p>
            <p className="text-xl font-black text-slate-900">{stats.newCount} <span className="text-[10px] text-slate-300 ml-1">CE MOIS</span></p>
          </div>
        </div>
      </div>

      {/* Leads List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
        {filteredLeads.map(lead => (
          <div 
            key={lead.id} 
            className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:translate-y-[-4px] active-scale group cursor-pointer flex flex-col transition-all"
            onClick={() => handleOpenLead(lead)}
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{lead.company || 'Compte Particulier'}</p>
            <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Valeur</span>
                <span className="text-xs font-black text-slate-900">{lead.valueMin?.toLocaleString() || '0'} DZD</span>
              </div>
              <ChevronRight size={18} className="text-slate-100 group-hover:text-orange-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* MODAL PRINCIPALE - DÉTAILS ET ÉDITION */}
      {(viewMode === 'view' || viewMode === 'edit') && selectedLead && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setViewMode('list')}></div>
          
          <div className="relative bg-white rounded-t-[3rem] lg:rounded-[4rem] w-full max-w-2xl mx-auto flex flex-col modal-drawer shadow-2xl overflow-hidden border-b-[12px] border-orange-500">
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white z-20">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">
                    {viewMode === 'view' ? 'Fiche Contact' : 'Édition Prospect'}
                </h3>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-1">iVISION SALES TOOL</p>
              </div>
              <button onClick={() => setViewMode('list')} className="p-4 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
            </header>
            
            <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-16">
              {viewMode === 'view' ? (
                /* VUE CONSULTATION - SALES DASHBOARD */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* INFO PRINCIPALE */}
                    <div className="flex items-center space-x-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="w-20 h-20 bg-orange-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Target size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">{selectedLead.name}</h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedLead.company || 'Sans Entreprise'}</p>
                        </div>
                    </div>

                    {/* ACTIONS DE CONTACT DIRECT */}
                    <div className="grid grid-cols-2 gap-4">
                        <a 
                            href={`tel:${selectedLead.phone}`} 
                            className="flex items-center justify-center space-x-3 p-6 bg-orange-50 text-orange-500 rounded-[2rem] border border-orange-100 active-scale hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                        >
                            <Phone size={20} />
                            <span className="font-black text-[10px] uppercase tracking-widest">Appeler Direct</span>
                        </a>
                        <a 
                            href={`mailto:${selectedLead.email}`} 
                            className="flex items-center justify-center space-x-3 p-6 bg-slate-900 text-white rounded-[2rem] border-4 border-white active-scale shadow-xl"
                        >
                            <Mail size={20} />
                            <span className="font-black text-[10px] uppercase tracking-widest">Envoyer Email</span>
                        </a>
                    </div>

                    {/* QUICK STATUS & DATA GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Changer Statut</label>
                            <select 
                                className="w-full bg-transparent font-black text-xs uppercase text-slate-900 outline-none cursor-pointer"
                                value={selectedLead.status}
                                onChange={(e) => handleStatusQuickChange(e.target.value)}
                            >
                                <option value="new">Nouveau</option>
                                <option value="contacted">Contact établi</option>
                                <option value="qualified">Opportunité Qualifiée</option>
                                <option value="lost">Opportunité Perdue</option>
                            </select>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Budget Potentiel</label>
                            <p className="font-black text-slate-900 text-xs">{selectedLead.valueMin?.toLocaleString()} DZD</p>
                        </div>
                    </div>

                    {/* BRIEFING */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 px-1">
                            <MessageSquare size={16} className="text-orange-400" />
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Briefing & Opportunité</h4>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <p className="text-slate-600 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedLead.description || "Aucun détail enregistré pour le moment."}
                            </p>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="flex flex-col space-y-4 pt-6">
                        <button 
                            onClick={() => onConvertToClient(selectedLead)}
                            className="w-full py-6 bg-success text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 border-4 border-white active-scale flex items-center justify-center space-x-3"
                        >
                            <Zap size={20} />
                            <span>TRANSFORMER EN CLIENT CRM</span>
                        </button>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setViewMode('edit')}
                                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest active-scale flex items-center justify-center space-x-2"
                            >
                                <Edit2 size={16} />
                                <span>MODIFIER INFOS</span>
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-20 py-5 bg-red-50 text-urgent rounded-3xl active-scale flex items-center justify-center"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
              ) : (
                /* VUE ÉDITION - FORMULAIRE COMPLET */
                <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Nom du Contact *</label>
                        <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ahmed..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Entreprise</label>
                        <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Compagnie..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">E-mail</label>
                        <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Téléphone</label>
                        <input type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="05..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Budget Min (DZD)</label>
                        <input type="number" className={inputClasses} value={formData.valueMin || ''} onChange={e => setFormData({...formData, valueMin: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Source</label>
                        <input type="text" className={inputClasses} value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="Facebook, Google..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Briefing Stratégique</label>
                    <textarea 
                        className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-orange-400 outline-none transition-all text-sm resize-none" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Quels sont les besoins ?" 
                    />
                  </div>

                  <div className="pt-4 flex space-x-4">
                    <button type="button" onClick={() => setViewMode('view')} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest active-scale">ANNULER</button>
                    <button type="submit" className="flex-[2] py-6 bg-orange-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/20 border-4 border-white active-scale">ENREGISTRER MODIFS</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUPPRESSION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => !isDeleting && setShowDeleteConfirm(false)}></div>
          <div className="relative bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center border-b-[12px] border-red-500">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Supprimer ?</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Le prospect sera retiré définitivement.</p>
            <div className="mt-10 space-y-3">
                <button 
                  disabled={isDeleting}
                  onClick={confirmDelete} 
                  className="w-full py-5 bg-red-500 text-white font-black rounded-3xl shadow-xl shadow-red-500/20 active-scale uppercase text-[10px] tracking-widest border-4 border-white flex items-center justify-center"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'CONFIRMER SUPPRESSION'}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-widest">ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
