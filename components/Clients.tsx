import React, { useState } from 'react';
import { Client, Task, User, UserRole } from '../types';
import { Plus, Search, Mail, Phone, MapPin, X, Briefcase, ChevronRight, Trash2, Edit2, Globe, Activity, Info, Lock } from 'lucide-react';

const Clients: React.FC<any> = ({ clients = [], tasks = [], onAddClient, onUpdateClient, onDeleteClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view' | 'edit'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({ name: '', company: '', email: '', phone: '', address: '', description: '' });

  const canManage = currentUser.role === UserRole.ADMIN || !!currentUser.permissions?.canManageClients;

  const filteredClients = clients.filter((c: Client) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const closeModals = () => {
    setViewMode('list');
    setSelectedClient(null);
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({ ...client });
    setViewMode('edit');
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">PARTNER MANAGEMENT SYSTEM</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">CRM</h2>
          </div>
          <div className="flex items-center space-x-3 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-80">
               <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="RECHERCHER UN PARTENAIRE..." 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all placeholder-slate-700" 
               />
             </div>
             {canManage && (
               <button 
                 onClick={() => { setFormData({ name: '', company: '', email: '', phone: '', address: '', description: '' }); setViewMode('add'); }} 
                 className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/20 active-scale flex items-center justify-center transition-all hover:scale-105 hover:bg-emerald-300"
               >
                 <Plus size={32} strokeWidth={3} />
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClients.map((client: Client) => (
            <div key={client.id} onClick={() => { setSelectedClient(client); setViewMode('view'); }} className="glass-card p-8 rounded-[3rem] border border-white/5 group cursor-pointer relative overflow-hidden">
              <div className="flex items-center space-x-5 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-inner border border-emerald-400/10 transition-transform group-hover:scale-110 duration-500">{client.name.charAt(0)}</div>
                <div className="truncate">
                  <h3 className="font-extrabold text-white text-[15px] truncate uppercase tracking-tight">{client.name}</h3>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-2 truncate">{client.company || 'Compte Indépendant'}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <div className="w-7 h-7 rounded-full bg-emerald-400/10 flex items-center justify-center text-[8px] font-black text-emerald-400">iV</div>
                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Opérationnel</span>
                 </div>
                 <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-all">
                    <ChevronRight size={20} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL VIEW CLIENT */}
      {viewMode === 'view' && selectedClient && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[2rem] md:rounded-[3.5rem] p-5 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in mb-6 md:mb-10">
               <div className="flex justify-between items-start mb-6 md:mb-12">
                  <div className="flex items-center space-x-4 md:space-x-8">
                     <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-400 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-slate-950 font-black text-2xl md:text-4xl shadow-2xl shadow-emerald-500/30">{selectedClient.name.charAt(0)}</div>
                     <div className="min-w-0">
                        <h3 className="text-xl md:text-4xl font-extrabold text-white uppercase tracking-tighter leading-tight truncate">{selectedClient.name}</h3>
                        <p className="text-[8px] md:text-[11px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-1 md:mt-4 flex items-center truncate"><Globe size={12} className="mr-2"/> {selectedClient.company || 'Indépendant'}</p>
                     </div>
                  </div>
                  <button onClick={closeModals} className="w-10 h-10 md:w-12 md:h-12 glass text-slate-500 hover:text-white rounded-xl md:rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={20}/></button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-10">
                 <div className="p-4 md:p-8 glass-card rounded-[1.5rem] md:rounded-[2rem] flex items-center space-x-4 md:space-x-5 border border-white/5 group hover:bg-white/[0.04]">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 flex-shrink-0"><Mail size={18} /></div>
                    <div className="truncate">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Canal Email</p>
                      <span className="text-[12px] md:text-[13px] font-bold text-slate-200 truncate block">{selectedClient.email || 'N/A'}</span>
                    </div>
                 </div>
                 <div className="p-4 md:p-8 glass-card rounded-[1.5rem] md:rounded-[2rem] flex items-center space-x-4 md:space-x-5 border border-white/5 group hover:bg-white/[0.04]">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 flex-shrink-0"><Phone size={18} /></div>
                    <div className="truncate">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Contact Direct</p>
                      <span className="text-[12px] md:text-[13px] font-bold text-slate-200 truncate block">{selectedClient.phone || 'N/A'}</span>
                    </div>
                 </div>
               </div>

               <div className="p-5 md:p-10 bg-slate-900/40 rounded-[1.8rem] md:rounded-[2.5rem] border border-white/5 mb-6 md:mb-12 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-emerald-400/5 blur-[40px] md:blur-[60px] rounded-full"></div>
                 <div className="space-y-6 md:space-y-8">
                    <div>
                        <h4 className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3 md:mb-4 flex items-center leading-none"><MapPin size={14} className="mr-2 md:mr-3"/> Localisation Stratégique</h4>
                        <p className="text-[12px] md:text-[14px] font-medium text-slate-300 leading-relaxed">{selectedClient.address || "Aucune adresse enregistrée."}</p>
                    </div>
                    <div>
                        <h4 className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3 md:mb-4 flex items-center leading-none"><Info size={14} className="mr-2 md:mr-3"/> Spécifications du Compte</h4>
                        <p className="text-[12px] md:text-[14px] font-medium text-slate-300 leading-relaxed">{selectedClient.description || "Aucune note additionnelle."}</p>
                    </div>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row items-stretch gap-3 md:gap-4">
                  {canManage && (
                    <button 
                      onClick={() => handleOpenEdit(selectedClient)}
                      className="flex-1 py-4 md:py-6 px-6 md:px-8 bg-emerald-400 text-slate-950 font-black rounded-2xl md:rounded-3xl shadow-2xl active-scale uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all hover:bg-emerald-300 flex items-center justify-center text-center"
                    >
                      <Edit2 size={18} className="mr-2"/> Modifier la Fiche
                    </button>
                  )}
                  {canManage && (
                    <button 
                      onClick={() => { if(confirm('Révoquer ce compte CRM ?')) { onDeleteClient(selectedClient.id); closeModals(); } }} 
                      className="w-full sm:w-20 h-auto py-4 sm:py-0 glass text-slate-500 rounded-2xl md:rounded-3xl flex items-center justify-center hover:text-urgent hover:bg-urgent/10 transition-all shadow-xl active-scale border border-white/5"
                    >
                      <Trash2 size={22}/>
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT / ÉDITION CLIENT */}
      {(viewMode === 'add' || viewMode === 'edit') && canManage && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in">
               <div className="flex justify-between items-start mb-8 md:mb-10">
                 <div>
                   <h3 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-none">{viewMode === 'add' ? 'Ouverture CRM' : 'Modification CRM'}</h3>
                   <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 md:mt-3">Partenariat Stratégique iVISION</p>
                 </div>
                 <button onClick={closeModals} className="w-10 h-10 md:w-12 md:h-12 glass text-slate-500 hover:text-white rounded-xl md:rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={20}/></button>
               </div>
               <form onSubmit={(e) => { 
                 e.preventDefault(); 
                 if (viewMode === 'add') onAddClient(formData);
                 else onUpdateClient(formData);
                 closeModals(); 
               }} className="space-y-4 md:space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Contact Principal</label>
                        <input required className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-xs md:text-sm transition-all" placeholder="Nom complet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Organisation</label>
                        <input className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-xs md:text-sm transition-all" placeholder="Entreprise" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Mail size={12} className="mr-2 text-emerald-400"/> Email Pro</label>
                        <input type="email" className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-xs md:text-sm transition-all" placeholder="mail@pro.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Phone size={12} className="mr-2 text-emerald-400"/> Téléphone</label>
                        <input type="tel" className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-xs md:text-sm transition-all" placeholder="+213..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><MapPin size={12} className="mr-2 text-emerald-400"/> Adresse Siège</label>
                    <input className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-xs md:text-sm transition-all" placeholder="Localisation géographique" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                 </div>
                 <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center"><Info size={12} className="mr-2 text-emerald-400"/> Notes / Briefing</label>
                    <textarea className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-xs md:text-sm transition-all h-24 resize-none" placeholder="Détails du client..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                 </div>
                 <button className="w-full py-5 md:py-6 bg-emerald-400 text-slate-950 font-black rounded-2xl md:rounded-3xl shadow-xl active-scale uppercase text-[10px] md:text-[11px] tracking-[0.3em] mt-2 md:mt-6 hover:bg-emerald-300 transition-all shadow-emerald-500/30">
                   {viewMode === 'add' ? 'Activer le Compte Partenaire' : 'Confirmer les Modifications'}
                 </button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;