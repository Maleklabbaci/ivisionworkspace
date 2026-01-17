
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Lead, User, UserRole } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Trash2, Edit2, ChevronRight, Zap, TrendingUp, CheckCircle2, UserCheck, UserMinus, PhoneCall, Briefcase, Info, DollarSign, Calendar, Sparkles, Wand2, Loader2, FileText, Clock, AlertCircle } from 'lucide-react';
import { parseLeadFromText } from '../services/geminiService';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  statusStyle: any;
}

const LeadCard = memo(({ lead, onClick, statusStyle }: LeadCardProps) => {
  const StatusIcon = statusStyle.icon;
  const isLost = lead.status === 'lost';
  
  return (
    <div 
      className="card-formal p-6 rounded-[2.5rem] flex flex-col group cursor-pointer transition-all border-l-4"
      style={{ borderLeftColor: statusStyle.color }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusStyle.iconBg}`}>
          <StatusIcon size={20} />
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyle.badge}`}>
          {statusStyle.label}
        </div>
      </div>
      <h3 className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">{lead.name}</h3>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{lead.company || 'Compte Indépendant'}</p>
      
      {isLost && (
          <div className="mt-4 flex items-center space-x-2 text-[8px] font-bold text-urgent uppercase tracking-widest bg-urgent/5 p-2 rounded-lg">
              <Clock size={10} />
              <span>Auto-suppression sous 5j</span>
          </div>
      )}

      <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Potentiel iV</span>
          <span className="text-xs font-black text-slate-900 mt-0.5">
            {new Intl.NumberFormat('fr-FR').format(lead.valueMin || 0)} DZD
          </span>
        </div>
        <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors" />
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
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'urgent') => void;
}

const Leads: React.FC<LeadsProps> = ({ leads, onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser, addNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit' | 'add'>('list');
  const [isAiMode, setIsAiMode] = useState(false);
  const [magicText, setMagicText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', company: '', email: '', phone: '', status: 'new', valueMin: 0, valueMax: 0, description: ''
  });

  const getStatusStyle = useCallback((status: string) => {
    switch(status) {
      case 'qualified': return { badge: 'bg-vibrant-emerald/5 border-vibrant-emerald/10 text-vibrant-emerald', iconBg: 'bg-vibrant-emerald/10 text-vibrant-emerald', color: '#10B981', label: 'Qualifié', icon: UserCheck };
      case 'contacted': return { badge: 'bg-vibrant-indigo/5 border-vibrant-indigo/10 text-vibrant-indigo', iconBg: 'bg-vibrant-indigo/10 text-vibrant-indigo', color: '#6366F1', label: 'Contacter', icon: PhoneCall };
      case 'lost': return { badge: 'bg-urgent/5 border-urgent/10 text-urgent', iconBg: 'bg-urgent/10 text-urgent', color: '#E11D48', label: 'Perdu', icon: UserMinus };
      default: return { badge: 'bg-slate-50 border-slate-100 text-slate-400', iconBg: 'bg-slate-100 text-slate-400', color: '#CBD5E1', label: 'Nouveau', icon: Target };
    }
  }, []);

  const selectedLead = useMemo(() => leads.find(l => String(l.id) === selectedLeadId), [leads, selectedLeadId]);

  const handleMagicExtract = async () => {
    if (!magicText.trim() || isExtracting) return;
    setIsExtracting(true);
    try {
      const extracted = await parseLeadFromText(magicText);
      if (extracted && extracted.name) {
        setFormData({
          ...formData,
          name: extracted.name || '',
          company: extracted.company || '',
          email: extracted.email || '',
          phone: extracted.phone || '',
          valueMin: extracted.valueMin || 0,
          valueMax: extracted.valueMax || 0,
          description: extracted.description || '',
          status: 'new'
        });
        setIsAiMode(false);
        addNotification("Intelligence iV", "Prospect extrait avec succès", "success");
      } else {
        addNotification("Intelligence iV", "Impossible d'identifier les données.", "urgent");
      }
    } catch (err) {
      console.error("Extraction failed", err);
      addNotification("Intelligence iV", "Erreur réseau ou Clé API non configurée.", "urgent");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (viewMode === 'add') {
      onAddLead({
        ...formData,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString()
      } as Lead);
    } else {
      onUpdateLead(formData as Lead);
    }
    setViewMode('list');
    setSelectedLeadId(null);
  };

  const inputClasses = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all text-sm";

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Pipeline Leads</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1.5">Acquisition Client iVISION</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
                type="text" 
                placeholder="Chercher un prospect..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full sm:w-64 pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs font-bold outline-none" 
            />
          </div>
          <button onClick={() => { setFormData({name: '', company: '', email: '', phone: '', status: 'new', valueMin: 0, valueMax: 0, description: ''}); setMagicText(''); setViewMode('add'); }} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl active-scale text-[10px] tracking-widest uppercase border-4 border-white">
            Nouveau Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
          {[
            { label: 'Flux iV', val: leads.length, icon: TrendingUp, color: 'text-vibrant-indigo' },
            { label: 'Opportunités', val: leads.filter(l => l.status === 'qualified').length, icon: CheckCircle2, color: 'text-vibrant-emerald' },
            { label: 'Potentiel kDZD', val: `${Math.round(leads.reduce((a,c)=>a+(c.valueMin||0),0)/1000)}k`, icon: Target, color: 'text-vibrant-orange' }
          ].map((s, i) => (
            <div key={i} className="card-formal p-6 rounded-[2rem] flex items-center space-x-5">
              <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center ${s.color} border border-slate-100`}><s.icon size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tighter mt-0.5">{s.val}</p>
              </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
        {leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
          <LeadCard 
            key={String(lead.id)} 
            lead={lead} 
            onClick={() => { setSelectedLeadId(String(lead.id)); setViewMode('view'); }} 
            statusStyle={getStatusStyle(lead.status)} 
          />
        ))}
      </div>

      {/* MODAL VUE DÉTAILLÉE */}
      {viewMode === 'view' && selectedLead && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewMode('list')}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden modal-drawer flex flex-col max-h-[90vh]">
            <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getStatusStyle(selectedLead.status).iconBg}`}>
                      {React.createElement(getStatusStyle(selectedLead.status).icon, { size: 24 })}
                  </div>
                  <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">{selectedLead.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{selectedLead.company || 'Indépendant'}</p>
                  </div>
              </div>
              <button onClick={() => setViewMode('list')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active-scale"><X size={20}/></button>
            </header>
            
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
               {selectedLead.status === 'lost' && (
                   <div className="bg-urgent/10 p-4 rounded-2xl border border-urgent/20 flex items-center space-x-3 text-urgent">
                       <AlertCircle size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">Ce prospect est archivé et sera supprimé dans 5 jours.</span>
                   </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center space-y-2">
                        <Mail size={20} className="text-vibrant-indigo" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate w-full">{selectedLead.email || 'Pas d\'email'}</span>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center space-y-2">
                        <Phone size={20} className="text-vibrant-emerald" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate w-full">{selectedLead.phone || 'Pas de tel'}</span>
                    </div>
               </div>

               <div className="space-y-3">
                    <div className="flex items-center space-x-2 px-1">
                        <DollarSign size={14} className="text-vibrant-orange" />
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plage Budgétaire</h4>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center">
                        <div className="text-center flex-1 border-r border-white/10">
                            <p className="text-[8px] font-bold text-white/40 uppercase">Minimum</p>
                            <p className="text-lg font-bold tracking-tight">{new Intl.NumberFormat('fr-FR').format(selectedLead.valueMin || 0)} DZD</p>
                        </div>
                        <div className="text-center flex-1">
                            <p className="text-[8px] font-bold text-white/40 uppercase">Maximum</p>
                            <p className="text-lg font-bold tracking-tight">{new Intl.NumberFormat('fr-FR').format(selectedLead.valueMax || 0)} DZD</p>
                        </div>
                    </div>
               </div>

               <div className="space-y-3">
                    <div className="flex items-center space-x-2 px-1">
                        <Info size={14} className="text-vibrant-indigo" />
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Briefing Stratégique</h4>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {selectedLead.description || "Aucune note additionnelle."}
                        </p>
                    </div>
               </div>

               <div className="flex flex-col space-y-3 pt-4">
                 <button onClick={() => onConvertToClient(selectedLead)} className="w-full py-5 bg-vibrant-emerald text-white font-bold rounded-[2rem] text-[10px] uppercase tracking-widest active-scale flex items-center justify-center space-x-3 border-4 border-white shadow-xl shadow-vibrant-emerald/20">
                   <Zap size={18} /> <span>Convertir en Client iV</span>
                 </button>
                 <div className="flex space-x-3">
                    <button onClick={() => { setFormData(selectedLead); setViewMode('edit'); }} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-[2rem] text-[10px] uppercase tracking-widest active-scale border-4 border-white shadow-xl">
                      Modifier
                    </button>
                    <button onClick={() => { if(confirm('Révoquer ce lead ?')) { onDeleteLead(String(selectedLead.id)); setViewMode('list'); } }} className="w-16 h-16 bg-red-50 text-urgent flex items-center justify-center rounded-[2rem] active-scale border-4 border-white">
                      <Trash2 size={20} />
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULAIRE AJOUT/ÉDITION */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewMode('list')}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden modal-drawer flex flex-col max-h-[90vh]">
            <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                    {viewMode === 'add' ? 'Nouveau Prospect' : 'Configuration Lead'}
                </h3>
                {viewMode === 'add' && (
                    <div className="flex mt-3 bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setIsAiMode(false)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${!isAiMode ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>Saisie Manuelle</button>
                        <button type="button" onClick={() => setIsAiMode(true)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center space-x-2 ${isAiMode ? 'bg-primary text-white shadow-sm' : 'text-slate-400'}`}><Sparkles size={12} /><span>Magic IA</span></button>
                    </div>
                )}
              </div>
              <button onClick={() => setViewMode('list')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active-scale"><X size={20}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {isAiMode ? (
                    <div className="p-8 space-y-6">
                        <textarea className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-vibrant-indigo/30 outline-none transition-all text-sm resize-none shadow-inner" value={magicText} onChange={e => setMagicText(e.target.value)} placeholder="Collez ici le contenu à extraire (mail, chat, notes...)" />
                        <button type="button" disabled={!magicText.trim() || isExtracting} onClick={handleMagicExtract} className="w-full py-6 bg-gradient-to-r from-vibrant-indigo to-primary text-white font-black rounded-[2rem] text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 border-4 border-white active-scale transition-all flex items-center justify-center space-x-3 disabled:opacity-50">
                            {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <><Wand2 size={18} /><span>Extraire les Données IA</span></>}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Nom complet *</label>
                                <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jean Martin" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Entreprise</label>
                                <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Nom de l'entité" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Statut iVISION</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'new', label: 'Nouveau' },
                                    { id: 'contacted', label: 'Contacter' },
                                    { id: 'qualified', label: 'Qualifié' },
                                    { id: 'lost', label: 'Perdu' }
                                ].map(st => (
                                    <button 
                                        key={st.id} 
                                        type="button"
                                        onClick={() => setFormData({...formData, status: st.id as any})}
                                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${formData.status === st.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/20'}`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Budget Min (DZD)</label>
                                <input type="number" className={inputClasses} value={formData.valueMin || ''} onChange={e => setFormData({...formData, valueMin: Number(e.target.value)})} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Budget Max (DZD)</label>
                                <input type="number" className={inputClasses} value={formData.valueMax || ''} onChange={e => setFormData({...formData, valueMax: Number(e.target.value)})} placeholder="0" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Analyse & Notes</label>
                            <textarea className="w-full h-32 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all text-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Détails sur les besoins marketing..." />
                        </div>

                        <button type="submit" className="w-full py-6 bg-primary text-white font-black rounded-[2rem] text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 border-4 border-white active-scale transition-all">
                            {viewMode === 'add' ? 'ACTIVER LE PROSPECT' : 'METTRE À JOUR'}
                        </button>
                    </form>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
