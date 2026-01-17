
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Lead, User, UserRole } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Trash2, Edit2, ChevronRight, Zap, TrendingUp, Lock, CheckCircle2, AlertTriangle, Loader2, Sparkles, Wand2, PhoneCall, UserCheck, UserMinus, MessageSquare } from 'lucide-react';
import { parseLeadFromText } from '../services/geminiService';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  statusStyle: any;
}

const LeadCard = memo(({ lead, onClick, statusStyle }: LeadCardProps) => {
  const StatusIcon = statusStyle.icon;
  const hasRange = lead.valueMax && lead.valueMax > (lead.valueMin || 0);
  
  return (
    <div 
      className={`bg-white p-6 rounded-[2.5rem] border-2 border-transparent border-l-[6px] shadow-sm hover:shadow-xl hover:translate-y-[-4px] active-scale group cursor-pointer flex flex-col transition-all ${statusStyle.accent}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm transition-colors ${statusStyle.iconBg}`}>
          <StatusIcon size={24} />
        </div>
        <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
          {statusStyle.label}
        </div>
      </div>
      <h3 className="font-black text-slate-900 text-base truncate uppercase tracking-tight">{lead.name}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{lead.company || 'Compte Particulier'}</p>
      <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-300 uppercase mb-0.5">Potentiel iV</span>
          <span className="text-xs font-black text-slate-900">
            {new Intl.NumberFormat('fr-FR').format(lead.valueMin || 0)} 
            {hasRange && <span className="mx-1 text-slate-300">-</span>}
            {hasRange && new Intl.NumberFormat('fr-FR').format(lead.valueMax || 0)}
            <span className="text-[8px] text-slate-300 ml-1">DZD</span>
          </span>
        </div>
        <ChevronRight size={18} className={`${statusStyle.text}`} />
      </div>
    </div>
  );
});

interface LeadsProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertToClient: (lead: Lead) => void;
  currentUser: User;
}

const EMPTY_LEAD_FORM: Partial<Lead> = {
  name: '', company: '', email: '', phone: '', status: 'new', source: '', valueMin: 0, valueMax: 0, description: ''
};

const Leads: React.FC<LeadsProps> = ({ leads, onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMagicProcessing, setIsMagicProcessing] = useState(false);
  const [magicText, setMagicText] = useState('');
  
  const [formData, setFormData] = useState<Partial<Lead>>(EMPTY_LEAD_FORM);

  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 transition-all outline-none text-sm";

  const currentLead = useMemo(() => 
    leads.find(l => String(l.id) === String(selectedLeadId)), 
  [leads, selectedLeadId]);

  const canAccess = currentUser && (
    currentUser.role === UserRole.ADMIN || 
    currentUser.role === UserRole.PROJECT_MANAGER || 
    currentUser.permissions?.canManageLeads === true
  );

  const filteredLeads = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return leads.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.company?.toLowerCase().includes(term)
    );
  }, [leads, searchTerm]);

  const stats = useMemo(() => {
    const totalValue = leads.reduce((acc, curr) => acc + (curr.valueMin || 0), 0);
    return { 
      totalValue, 
      qualified: leads.filter(l => l.status === 'qualified').length,
      new: leads.filter(l => l.status === 'new').length
    };
  }, [leads]);

  const getStatusStyle = useCallback((status: string) => {
    switch(status) {
      case 'qualified': return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-success', iconBg: 'bg-green-100 text-success', accent: 'border-l-success', label: 'Qualifié', icon: UserCheck };
      case 'contacted': return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-500', iconBg: 'bg-orange-100 text-orange-600', accent: 'border-l-orange-500', label: 'Contacté', icon: PhoneCall };
      case 'lost': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-urgent', iconBg: 'bg-red-100 text-urgent', accent: 'border-l-urgent', label: 'Perdu', icon: UserMinus };
      default: return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-400', iconBg: 'bg-slate-100 text-slate-400', accent: 'border-l-slate-300', label: 'Nouveau', icon: Target };
    }
  }, []);

  const handleStatusChange = useCallback((newStatus: any) => {
    if (currentLead) {
        onUpdateLead({ ...currentLead, status: newStatus });
    }
  }, [currentLead, onUpdateLead]);

  const handleCloseModal = useCallback(() => {
    setViewMode('list');
    setSelectedLeadId(null);
    setFormData(EMPTY_LEAD_FORM);
    setMagicText('');
  }, []);

  const handleMagicCapture = async () => {
    if (!magicText.trim()) return;
    setIsMagicProcessing(true);
    try {
      const parsedData = await parseLeadFromText(magicText);
      setFormData({
        ...EMPTY_LEAD_FORM,
        ...parsedData,
        status: 'new'
      });
      setMagicText('');
    } catch (err) {
      alert("Échec de la magie iVISION. Remplissez le formulaire manuellement.");
    } finally {
      setIsMagicProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const leadToSave: Lead = {
      id: currentLead?.id || `lead-${crypto.randomUUID()}`,
      name: formData.name || '',
      company: formData.company || '',
      email: formData.email || '',
      phone: formData.phone || '',
      status: (formData.status as any) || 'new',
      source: formData.source || '',
      valueMin: Number(formData.valueMin) || 0,
      valueMax: Number(formData.valueMax) || 0,
      description: formData.description || '',
      createdAt: currentLead?.createdAt || new Date().toISOString()
    };

    if (currentLead && viewMode === 'edit') {
      onUpdateLead(leadToSave);
    } else {
      onAddLead(leadToSave);
    }
    
    handleCloseModal();
  };

  if (!canAccess) return (
    <div className="h-full flex flex-col items-center justify-center p-20 opacity-30 text-center">
        <Lock size={64} className="mb-6" />
        <h2 className="text-xl font-black uppercase tracking-widest">Pipeline Verrouillé</h2>
    </div>
  );

  return (
    <div className="space-y-10 page-transition pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pipeline iVISION</h2>
          <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Acquisition Strategique</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button onClick={() => { setSelectedLeadId(null); setFormData(EMPTY_LEAD_FORM); setViewMode('edit'); }} className="bg-orange-500 text-white p-4 px-10 rounded-3xl shadow-2xl active-scale flex items-center justify-center font-black text-[10px] tracking-widest uppercase border-4 border-white transition-all">
            <Plus size={20} className="mr-2" strokeWidth={3} /> CAPTURER UN LEAD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Potentiel Brut</p>
              <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('fr-FR').format(stats.totalValue)} <span className="text-[10px] text-orange-500 ml-1">DZD</span></p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success"><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opportunités</p>
              <p className="text-xl font-black text-slate-900">{stats.qualified}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center space-x-5">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Target size={24} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flux Entrant</p>
              <p className="text-xl font-black text-slate-900">{stats.new}</p>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-1">
        {filteredLeads.map(lead => (
          <LeadCard 
            key={String(lead.id)} 
            lead={lead} 
            onClick={() => { setSelectedLeadId(String(lead.id)); setFormData({ ...lead }); setViewMode('view'); }} 
            statusStyle={getStatusStyle(lead.status)} 
          />
        ))}
        {filteredLeads.length === 0 && <div className="col-span-full py-40 text-center opacity-20"><Target size={64} className="mx-auto" /></div>}
      </div>

      {(viewMode === 'view' || viewMode === 'edit') && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end lg:justify-center p-0 lg:p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleCloseModal}></div>
          <div className="relative bg-white rounded-t-[3rem] lg:rounded-[4rem] w-full max-w-2xl mx-auto flex flex-col shadow-2xl overflow-hidden border-b-[12px] border-orange-500 modal-drawer max-h-[90vh]">
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-30">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {viewMode === 'view' ? 'Fiche Lead' : currentLead ? 'Mise à jour' : 'Nouvelle Saisie'}
              </h3>
              <button onClick={handleCloseModal} className="p-4 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
            </header>
            
            <div className="p-10 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-16">
              {viewMode === 'view' && currentLead ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center space-x-6 bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                        <div className={`w-20 h-20 text-white rounded-3xl flex items-center justify-center shadow-lg ${getStatusStyle(currentLead.status).iconBg.replace('text-', 'bg-')}`}>
                            {React.createElement(getStatusStyle(currentLead.status).icon, { size: 32 })}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">{currentLead.name}</h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{currentLead.company || 'Sans Entreprise'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <a href={`tel:${currentLead.phone}`} className="flex items-center justify-center space-x-3 p-6 bg-orange-50 text-orange-500 rounded-[2rem] border border-orange-100 active-scale shadow-sm">
                            <Phone size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">Appeler</span>
                        </a>
                        <a href={`mailto:${currentLead.email}`} className="flex items-center justify-center space-x-3 p-6 bg-slate-900 text-white rounded-[2rem] border-4 border-white active-scale shadow-xl">
                            <Mail size={20} /> <span className="font-black text-[10px] uppercase tracking-widest">Email</span>
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block px-1">État du Prospect</label>
                            <select 
                                className={`w-full bg-transparent font-black text-xs uppercase outline-none cursor-pointer ${getStatusStyle(currentLead.status).text}`}
                                value={currentLead.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            >
                                <option value="new">Nouveau Flux</option>
                                <option value="contacted">En discussion</option>
                                <option value="qualified">Opportunité Qualifiée</option>
                                <option value="lost">Abandonné</option>
                            </select>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Potentiel iV</label>
                            <p className="font-black text-slate-900 text-xs uppercase">
                                {new Intl.NumberFormat('fr-FR').format(currentLead.valueMin || 0)} 
                                {currentLead.valueMax && currentLead.valueMax > currentLead.valueMin ? ` - ${new Intl.NumberFormat('fr-FR').format(currentLead.valueMax)}` : ''} 
                                <span className="text-[10px] text-orange-500 ml-1">DZD</span>
                            </p>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                        <p className="text-slate-600 font-bold text-sm leading-relaxed whitespace-pre-wrap">{currentLead.description || "Aucun détail complémentaire."}</p>
                    </div>

                    <div className="flex flex-col space-y-4 pt-6">
                        <button 
                            onClick={() => onConvertToClient(currentLead)}
                            className="w-full py-6 bg-success text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 border-4 border-white active-scale flex items-center justify-center space-x-3"
                        >
                            <Zap size={20} /> <span>ACTIVER DANS LE CRM iVISION</span>
                        </button>
                        <div className="flex space-x-3">
                            <button onClick={() => setViewMode('edit')} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black text-[10px] uppercase active-scale flex items-center justify-center space-x-2">
                                <Edit2 size={16} /> <span>MODIFIER</span>
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="w-20 py-5 bg-red-50 text-urgent rounded-3xl active-scale flex items-center justify-center">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4">
                  {!currentLead && (
                    <div className="bg-slate-900 p-8 rounded-[3rem] border-4 border-white shadow-2xl space-y-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles size={80} className="text-primary" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-4">
                          <Wand2 size={20} className="text-primary" />
                          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Magic Capture IA</h4>
                        </div>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-4 px-1">
                          Décrivez le prospect en langage naturel pour remplir le formulaire instantanément.
                        </p>
                        <div className="relative">
                          <textarea 
                            value={magicText}
                            onChange={(e) => setMagicText(e.target.value)}
                            className="w-full h-32 p-5 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white placeholder-white/10 focus:bg-white/10 focus:border-primary/50 outline-none transition-all text-xs resize-none"
                            placeholder="Ex: Amine de chez Google Algeria, amine@google.dz. Budget entre 200k et 300k pour du SEO..."
                          />
                          <button 
                            type="button"
                            disabled={isMagicProcessing || !magicText.trim()}
                            onClick={handleMagicCapture}
                            className="absolute bottom-4 right-4 bg-primary text-white p-4 rounded-2xl shadow-xl active-scale disabled:opacity-30 disabled:scale-100 transition-all border-2 border-white/10"
                          >
                            {isMagicProcessing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-2">Nom Complet *</label>
                        <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Ahmed Ben" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-2">Entreprise</label>
                        <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Nom de la boîte" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-2">Email</label>
                        <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ahmed@pro.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-2">Téléphone</label>
                        <input type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+213..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-2">Budget Min (DZD)</label>
                        <input type="number" className={inputClasses} value={formData.valueMin || ''} onChange={e => setFormData({...formData, valueMin: Number(e.target.value)})} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 px-2">Budget Max (DZD)</label>
                        <input type="number" className={inputClasses} value={formData.valueMax || ''} onChange={e => setFormData({...formData, valueMax: Number(e.target.value)})} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 px-2">Notes & Contexte</label>
                    <textarea className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-900 text-sm outline-none resize-none focus:bg-white transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Notes stratégiques..." />
                  </div>

                  <div className="pt-4 flex space-x-4">
                    <button type="button" onClick={handleCloseModal} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest active-scale">ANNULER</button>
                    <button type="submit" className="flex-[2] py-6 bg-orange-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border-4 border-white shadow-xl shadow-orange-500/20 active-scale">
                      {currentLead ? 'ENREGISTRER' : 'FINALISER LA CAPTURE'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => !isDeleting && setShowDeleteConfirm(false)}></div>
          <div className="relative bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center border-b-[12px] border-red-500">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 uppercase">Supprimer ?</h3>
            <p className="text-slate-400 font-bold text-xs uppercase mt-4">Action irréversible.</p>
            <div className="mt-10 space-y-3">
                <button disabled={isDeleting} onClick={async () => { if(currentLead) { setIsDeleting(true); await onDeleteLead(String(currentLead.id)); handleCloseModal(); setIsDeleting(false); setShowDeleteConfirm(false); } }} className="w-full py-5 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] border-4 border-white active-scale">
                  {isDeleting ? <Loader2 className="animate-spin mx-auto" /> : 'CONFIRMER'}
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
