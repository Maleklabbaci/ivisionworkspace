
import React, { useState, useMemo } from 'react';
import { Lead, User } from '../types';
import { Search, Plus, Target, X, Mail, Phone, Trash2, ChevronRight, Zap, Target as TargetIcon, UserCheck, PhoneCall, Sparkles, Wand2, Loader2, ArrowUpRight, DollarSign, Info } from 'lucide-react';
import { parseLeadFromText } from '../services/geminiService';

const Leads: React.FC<any> = ({ leads = [], onAddLead, onUpdateLead, onDeleteLead, onConvertToClient, currentUser, addNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [magicText, setMagicText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
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

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'qualified': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: UserCheck, label: 'Qualifié' };
      case 'contacted': return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', icon: PhoneCall, label: 'Contacté' };
      default: return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: TargetIcon, label: 'Nouveau' };
    }
  };

  const filteredLeads = leads.filter((l: Lead) => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleMagicExtract = async () => {
    if (!magicText.trim() || isExtracting) return;
    setIsExtracting(true);
    try {
      const extracted = await parseLeadFromText(magicText);
      setFormData({ ...formData, ...extracted, status: 'new' });
      setIsAiMode(false);
    } catch (err) { console.error(err); } finally { setIsExtracting(false); }
  };

  const closeModals = () => {
    setViewMode('list');
    setSelectedLead(null);
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex justify-between items-end px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400 mb-2">PROSPECT ACQUISITION</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">Leads</h2>
          </div>
          <button onClick={() => { setFormData({ name: '', company: '', email: '', phone: '', status: 'new', valueMin: 0, valueMax: 0, description: '' }); setViewMode('add'); }} className="w-14 h-14 bg-orange-400 text-slate-950 rounded-2xl shadow-xl shadow-orange-500/20 active-scale flex items-center justify-center hover:scale-105 transition-transform">
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeads.map((lead: Lead) => {
            const style = getStatusStyle(lead.status);
            return (
              <div key={lead.id} onClick={() => { setSelectedLead(lead); setViewMode('view'); }} className="glass-card p-8 rounded-[3rem] border border-white/5 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.bg} ${style.color} shadow-inner`}>
                    <style.icon size={20} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full glass ${style.color}`}>{style.label}</span>
                </div>
                <h3 className="font-extrabold text-white text-[15px] truncate uppercase tracking-tight">{lead.name}</h3>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-2 truncate">{lead.company || 'Compte Indépendant'}</p>
                
                <div className="mt-10 pt-5 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valeur Potentielle</span>
                    <span className="text-xs font-extrabold text-white tracking-tighter mt-0.5">{lead.valueMin?.toLocaleString()} DZD</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-600 group-hover:text-orange-400 group-hover:bg-orange-400/10 transition-all">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL AJOUT LEAD */}
      {viewMode === 'add' && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[3rem] p-8 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in transition-all">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-none">Acquisition Lead</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Pipeline iVISION Intelligence</p>
                 </div>
                 <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
               </div>
               
               <div className="flex bg-white/5 p-1.5 rounded-2xl md:rounded-full mb-10 border border-white/5">
                 <button onClick={() => setIsAiMode(false)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all ${!isAiMode ? 'bg-orange-400 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}>Saisie Manuelle</button>
                 <button onClick={() => setIsAiMode(true)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all flex items-center justify-center space-x-2.5 ${isAiMode ? 'bg-orange-400 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}><Sparkles size={14}/> <span>Magic IA</span></button>
               </div>

               {isAiMode ? (
                 <div className="space-y-8 animate-fade-in">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Analyse brute de données</label>
                     <textarea className="w-full h-44 p-6 bg-white/5 border border-white/10 rounded-3xl text-white text-[13px] outline-none focus:border-orange-400 transition-all font-medium leading-relaxed resize-none placeholder-slate-700" placeholder="Collez votre texte ici pour extraction IA..." value={magicText} onChange={e => setMagicText(e.target.value)} />
                   </div>
                   <button onClick={handleMagicExtract} disabled={isExtracting} className="w-full py-6 bg-orange-400 text-slate-950 font-black rounded-3xl shadow-2xl active-scale flex items-center justify-center space-x-3 uppercase text-[11px] tracking-[0.3em] transition-all hover:bg-orange-300">
                     {isExtracting ? <Loader2 className="animate-spin" size={20}/> : <><Wand2 size={20}/> <span>Lancer l'analyse IA</span></>}
                   </button>
                 </div>
               ) : (
                 <form onSubmit={(e) => { e.preventDefault(); onAddLead(formData); closeModals(); }} className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Identité Prospect</label>
                         <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-orange-400 text-sm transition-all" placeholder="Ex: Jean Dupont" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Organisation</label>
                         <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-orange-400 text-sm transition-all" placeholder="Entreprise" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Mail size={12} className="mr-2 text-orange-400"/> Email Pro</label>
                         <input type="email" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-orange-400 text-sm transition-all" placeholder="mail@pro.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Phone size={12} className="mr-2 text-orange-400"/> Ligne Directe</label>
                         <input type="tel" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-orange-400 text-sm transition-all" placeholder="+213..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                   </div>
                   <button className="w-full py-6 bg-orange-400 text-slate-950 font-black rounded-3xl shadow-xl active-scale uppercase text-[11px] tracking-[0.3em] mt-4 hover:bg-orange-300 transition-all shadow-orange-500/30">Valider l'Acquisition</button>
                 </form>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIEW LEAD - FIXÉ */}
      {viewMode === 'view' && selectedLead && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[3rem] p-8 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in transition-all">
               <div className="flex justify-between items-start mb-12">
                 <div>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tighter leading-none truncate">{selectedLead.name}</h3>
                    <p className="text-[10px] md:text-[11px] text-orange-400 font-black uppercase tracking-[0.3em] mt-4 flex items-center truncate">
                        <TargetIcon size={14} className="mr-2"/> {selectedLead.company || 'Indépendant'}
                    </p>
                 </div>
                 <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
               </div>

               <div className="space-y-8">
                  <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/5 blur-[60px] rounded-full"></div>
                     <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-4 flex items-center leading-none">Analyse du Besoin</h4>
                     <p className="text-[14px] text-slate-300 leading-relaxed font-medium">{selectedLead.description || "Aucun brief spécifique n'a été fourni pour ce lead."}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-8 glass-card rounded-[2.2rem] border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Valeur Estimée</p>
                        <p className="text-lg font-black text-white">{selectedLead.valueMin?.toLocaleString()} DZD</p>
                     </div>
                     <div className="p-8 glass-card rounded-[2.2rem] border border-white/5 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Status iV</p>
                        <p className="text-lg font-black text-orange-400 uppercase tracking-tight">{selectedLead.status}</p>
                     </div>
                  </div>

                  <div className="pt-8 flex flex-col sm:flex-row items-stretch gap-4">
                     <button 
                       onClick={() => { if(confirm('Convertir ce lead en compte CRM ?')) onConvertToClient(selectedLead); }} 
                       className="flex-1 py-6 px-8 bg-white text-slate-950 font-black rounded-3xl shadow-2xl active-scale uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-orange-400 hover:text-white"
                     >
                       Convertir en Client
                     </button>
                     <button 
                       onClick={() => { if(confirm('Supprimer définitivement ce lead ?')) { onDeleteLead(selectedLead.id); closeModals(); } }} 
                       className="w-full sm:w-20 h-auto py-6 sm:py-0 glass text-slate-500 font-black rounded-3xl hover:text-urgent hover:bg-urgent/10 transition-all uppercase text-[10px] tracking-widest shadow-xl active-scale border border-white/5 flex items-center justify-center"
                     >
                       <Trash2 size={24}/>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
