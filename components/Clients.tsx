
import React, { useState, useMemo } from 'react';
import { Client, Task, User, UserRole, Project, TaskStatus } from '../types';
import { Plus, Search, Mail, Phone, MapPin, X, Briefcase, ChevronRight, Trash2, Edit2, Globe, Activity, Info, Lock, Layers, CheckCircle2, Clock, ListChecks, ArrowUpRight, Save } from 'lucide-react';
// Fix: Ensure standard react-router-dom exports are properly used
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

const Clients: React.FC<any> = ({ clients = [], tasks = [], projects = [], onAddClient, onUpdateClient, onDeleteClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view' | 'edit'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({ name: '', company: '', email: '', phone: '', address: '', description: '' });
  const navigate = useNavigate();

  // Correction : L'utilisateur peut gérer s'il est admin OU s'il a la permission canManageClients
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
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">PARTNER MANAGEMENT SYSTEM</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">CRM</h2>
          </div>
          <div className="flex items-center space-x-3 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-80">
               <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="RECHERCHER..." 
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
          {filteredClients.map((client: Client) => (
            <div key={client.id} onClick={() => { setSelectedClient(client); setViewMode('view'); }} className="crystal-module p-8 rounded-[3rem] border border-white/5 group cursor-pointer relative overflow-hidden active-scale">
              <div className="flex items-center space-x-5 mb-8 text-left">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-inner border border-emerald-400/10 transition-transform group-hover:scale-110 duration-500">{client.name.charAt(0)}</div>
                <div className="truncate flex-1">
                  <h3 className="font-extrabold text-white text-[15px] truncate uppercase tracking-tight">{client.name}</h3>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-2 truncate">{client.company || 'Indépendant'}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Actif</span>
                 </div>
                 <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-all">
                    <ChevronRight size={20} />
                 </div>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-20 glass rounded-[3rem] border-dashed border-2 border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
               <Briefcase size={40} className="mb-4 text-slate-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucun partenaire trouvé</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={viewMode === 'view' && !!selectedClient} onClose={closeModals} title={selectedClient?.name} subtitle={selectedClient?.company || 'Profil Partenaire'}>
        <div className="space-y-10">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center space-x-5 text-left">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400"><Mail size={20} /></div>
                 <div className="truncate"><p className="label-iv mb-0">Email</p><p className="text-sm font-bold text-white truncate">{selectedClient?.email || 'N/A'}</p></div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center space-x-5 text-left">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400"><Phone size={20} /></div>
                 <div className="truncate"><p className="label-iv mb-0">Téléphone</p><p className="text-sm font-bold text-white truncate">{selectedClient?.phone || 'N/A'}</p></div>
              </div>
           </div>

           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6 text-left">
              <div>
                <h4 className="label-iv flex items-center"><MapPin size={14} className="mr-2 text-emerald-400" /> Adresse de facturation</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{selectedClient?.address || "Non spécifiée"}</p>
              </div>
              <div className="h-px bg-white/5 w-full"></div>
              <div>
                <h4 className="label-iv flex items-center"><Info size={14} className="mr-2 text-emerald-400" /> Brief Stratégique</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{selectedClient?.description || "Aucun brief particulier pour ce client."}</p>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-4">
              {canManage && (
                <button 
                  onClick={() => handleOpenEdit(selectedClient!)}
                  className="w-full py-6 bg-emerald-400 text-slate-950 font-black rounded-[2rem] shadow-xl active-scale uppercase text-[11px] tracking-widest hover:bg-emerald-300 flex items-center justify-center space-x-3"
                >
                  <Edit2 size={18} />
                  <span>Modifier le Dossier</span>
                </button>
              )}
              {canManage && (
                <button 
                  onClick={() => { if(confirm('Archiver définitivement ce client ?')) { onDeleteClient(selectedClient!.id); closeModals(); } }}
                  className="w-full sm:w-20 py-6 glass rounded-[2rem] flex items-center justify-center text-slate-600 hover:text-rose-400 transition-all active-scale"
                >
                  <Trash2 size={24} />
                </button>
              )}
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={viewMode === 'add' || viewMode === 'edit'} 
        onClose={closeModals} 
        title={viewMode === 'add' ? 'Nouveau Partenaire' : 'Modifier Partenaire'}
        subtitle="Mise à jour du Système CRM"
      >
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          if (viewMode === 'add') onAddClient(formData);
          else onUpdateClient(formData);
          closeModals(); 
        }} className="space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left">
                  <label className="label-iv">Nom du Contact</label>
                  <input required className="input-iv" placeholder="Ex: Malik Benali" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1.5 text-left">
                  <label className="label-iv">Entreprise</label>
                  <input className="input-iv" placeholder="Nom commercial" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left">
                  <label className="label-iv">Email professionnel</label>
                  <input type="email" className="input-iv" placeholder="contact@pro.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-1.5 text-left">
                  <label className="label-iv">Téléphone direct</label>
                  <input type="tel" className="input-iv" placeholder="+213..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
           </div>

           <div className="space-y-1.5 text-left">
              <label className="label-iv">Adresse du Siège</label>
              <input className="input-iv" placeholder="Localisation complète" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
           </div>

           <div className="space-y-1.5 text-left">
              <label className="label-iv">Briefing / Notes internes</label>
              <textarea className="input-iv h-32 resize-none leading-relaxed" placeholder="Spécificités du partenariat..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
           </div>

           <button type="submit" className="w-full py-6 bg-emerald-400 text-slate-950 font-black rounded-[2rem] shadow-2xl active-scale uppercase text-[11px] tracking-[0.3em] mt-4 flex items-center justify-center space-x-3">
             <Save size={20} />
             <span>Enregistrer les informations</span>
           </button>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;
