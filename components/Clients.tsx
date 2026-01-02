
import React, { useState, useMemo } from 'react';
import { Client, Task, FileLink, TaskStatus, User, UserRole } from '../types';
import { Users, Plus, Search, MapPin, Mail, Phone, Building2, Trash2, Edit2, X, CheckCircle, FileText, ArrowUpDown, Calendar, AlertCircle, ArrowUp, ArrowDown, Lock, Briefcase, ChevronRight, AlignLeft } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  tasks: Task[];
  fileLinks: FileLink[];
  onAddClient?: (client: Client) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
  currentUser?: User;
}

const Clients: React.FC<ClientsProps> = ({ clients, tasks, fileLinks, onAddClient, onUpdateClient, onDeleteClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '', company: '', email: '', phone: '', address: '', description: ''
  });

  const canAccess = currentUser && (
    currentUser.role === UserRole.ADMIN || 
    currentUser.role === UserRole.PROJECT_MANAGER || 
    currentUser.role === UserRole.ANALYST ||
    currentUser.permissions?.canManageClients === true
  );

  const filteredClients = useMemo(() => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  if (!canAccess) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 pt-16">
            <div className="bg-red-50 p-8 rounded-full mb-4 flex items-center justify-center">
                <Lock size={32} className="text-urgent" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 tracking-tighter uppercase">Accès Refusé</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Privilèges requis.</p>
        </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (editingClient && onUpdateClient) onUpdateClient({ ...editingClient, ...formData } as Client);
    else if (onAddClient) onAddClient({ id: `client-${Date.now()}`, ...formData } as Client);
    setShowModal(false);
  };

  const inputClasses = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all text-sm";

  return (
    <div className="space-y-4 max-w-md mx-auto pb-16 page-transition">
      <div className="flex flex-col space-y-3 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Portefeuille</h2>
            <p className="text-slate-300 font-black text-[8px] uppercase tracking-[0.3em]">Base de données CRM</p>
          </div>
          <button onClick={() => { setEditingClient(null); setFormData({name: '', company: '', email: '', phone: '', address: '', description: ''}); setShowModal(true); }} className="bg-primary text-white p-2.5 px-5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center font-black text-[9px] tracking-widest uppercase">
            <Plus size={16} className="mr-1.5" strokeWidth={3} /> AJOUTER
          </button>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input type="text" placeholder="Rechercher un client ou société..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs font-bold outline-none text-slate-900" />
        </div>
      </div>

      <div className="flex flex-col space-y-2 px-1 pb-10">
          {filteredClients.map(client => {
              const clientTaskCount = tasks.filter(t => t.clientId === client.id).length;
              return (
                <div 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)} 
                  className="bg-white p-3.5 rounded-[1.8rem] border border-slate-50 shadow-sm active:opacity-70 flex items-center justify-between group cursor-pointer hover:border-primary/10 transition-all"
                >
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-primary font-black text-lg border border-slate-50 flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <h3 className="text-[13px] font-black text-slate-900 leading-tight truncate">{client.name}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[100px]">
                                    {client.company || 'Compte Direct'}
                                </span>
                                <div className="w-1 h-1 bg-slate-100 rounded-full"></div>
                                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">
                                    {clientTaskCount} Mission{clientTaskCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-100 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              );
          })}

          {filteredClients.length === 0 && (
            <div className="py-20 text-center opacity-20">
                <Users size={40} className="mx-auto mb-3" />
                <p className="font-black text-[10px] uppercase tracking-widest">Aucun client trouvé</p>
            </div>
          )}
      </div>

      {/* FICHE CLIENT DÉTAILLÉE */}
      {selectedClient && (
          <div className="fixed inset-0 bg-white z-[1000] flex flex-col safe-pb animate-in slide-in-from-bottom duration-200">
              <header className="px-5 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-20 safe-pt">
                  <button onClick={() => setSelectedClient(null)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 active:bg-slate-100"><X size={20}/></button>
                  <div className="text-center">
                    <h3 className="font-black text-slate-900 tracking-tight truncate max-w-[180px] uppercase text-xs">{selectedClient.name}</h3>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{selectedClient.company || 'Client Direct'}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-lg">{selectedClient.name.charAt(0)}</div>
              </header>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar">
                   {/* CONTACT RAPIDE */}
                   <div className="grid grid-cols-2 gap-3">
                        <a href={`mailto:${selectedClient.email}`} className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-3xl space-y-2 active:bg-slate-100 transition-colors">
                            <Mail size={18} className="text-primary"/> 
                            <span className="font-black text-slate-800 text-[9px] uppercase tracking-widest truncate w-full text-center">{selectedClient.email || 'Non renseigné'}</span>
                        </a>
                        <a href={`tel:${selectedClient.phone}`} className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-3xl space-y-2 active:bg-slate-100 transition-colors">
                            <Phone size={18} className="text-primary"/>
                            <span className="font-black text-slate-800 text-[9px] uppercase tracking-widest truncate w-full text-center">{selectedClient.phone || 'Non renseigné'}</span>
                        </a>
                   </div>

                   {/* LOCALISATION */}
                   <div className="space-y-3">
                        <div className="flex items-center space-x-2 px-1">
                            <MapPin size={14} className="text-slate-400" />
                            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Localisation</h4>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <p className="text-slate-700 font-bold text-xs leading-relaxed">
                                {selectedClient.address || "Aucune adresse enregistrée pour ce client."}
                            </p>
                        </div>
                   </div>

                   {/* DESCRIPTION DÉTAILLÉE */}
                   <div className="space-y-3">
                        <div className="flex items-center space-x-2 px-1">
                            <AlignLeft size={14} className="text-slate-400" />
                            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Description & Notes</h4>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <p className="text-slate-600 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedClient.description || "Aucune note ou description stratégique disponible."}
                            </p>
                        </div>
                   </div>

                   {/* MISSIONS EN COURS */}
                   <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center space-x-2">
                                <Briefcase size={14} className="text-slate-400" />
                                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Missions iVISION</h4>
                            </div>
                            <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase">
                                {tasks.filter(t => t.clientId === selectedClient.id).length} Active(s)
                            </span>
                        </div>
                        <div className="space-y-2">
                            {tasks.filter(t => t.clientId === selectedClient.id).map(task => (
                                <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center space-x-3 truncate">
                                        <div className={`w-1 h-8 rounded-full ${task.status === TaskStatus.DONE ? 'bg-success' : 'bg-primary'}`}></div>
                                        <h4 className="font-bold text-slate-900 text-xs truncate">{task.title}</h4>
                                    </div>
                                    <CheckCircle size={16} className={task.status === TaskStatus.DONE ? 'text-success' : 'text-slate-100'} />
                                </div>
                            ))}
                            {tasks.filter(t => t.clientId === selectedClient.id).length === 0 && (
                                <p className="text-[9px] text-slate-300 font-black uppercase text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">Aucun projet historique</p>
                            )}
                        </div>
                   </div>
                   
                   {/* ACTIONS */}
                   <div className="pt-6 flex space-x-3">
                       <button onClick={() => { setEditingClient(selectedClient); setFormData(selectedClient); setShowModal(true); setSelectedClient(null); }} className="flex-1 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl active:opacity-80 flex items-center justify-center transition-all">
                           <Edit2 size={16} className="mr-2" /> MODIFIER
                       </button>
                       <button onClick={() => { if(confirm('Révoquer ce client définitivement ?')) { onDeleteClient?.(selectedClient.id); setSelectedClient(null); } }} className="w-16 h-16 bg-red-50 text-urgent flex items-center justify-center rounded-3xl active:bg-red-100 transition-colors">
                           <Trash2 size={24} />
                       </button>
                   </div>
              </div>
          </div>
      )}

      {/* MODAL FORMULAIRE CLIENT COMPLET */}
      {showModal && (
          <div className="fixed inset-0 z-[2000] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
              <header className="px-5 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-20 safe-pt">
                  <button onClick={() => setShowModal(false)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 active:bg-slate-100"><X size={20}/></button>
                  <h3 className="text-xs font-black text-slate-900 tracking-tighter uppercase">{editingClient ? 'Éditer' : 'Nouveau'} Client</h3>
                  <button onClick={handleSubmit} className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-primary/20 active:opacity-80 transition-all">ENREGISTRER</button>
              </header>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar pb-32">
                  <div className="space-y-5">
                      {/* Section Identité */}
                      <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Identité & Structure</label>
                          <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nom complet du contact *" />
                          <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Nom de l'entreprise" />
                      </div>

                      {/* Section Contact */}
                      <div className="space-y-4 pt-2">
                          <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Coordonnées directes</label>
                          <div className="grid grid-cols-1 gap-3">
                              <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email professionnel" />
                              <input type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Numéro de téléphone" />
                          </div>
                      </div>

                      {/* Section Adresse */}
                      <div className="space-y-4 pt-2">
                          <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Localisation</label>
                          <input type="text" className={inputClasses} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Adresse postale complète" />
                      </div>

                      {/* Section Description */}
                      <div className="space-y-4 pt-2">
                          <label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Notes & Description Stratégique</label>
                          <textarea 
                              className="w-full h-48 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all text-sm resize-none" 
                              value={formData.description} 
                              onChange={e => setFormData({...formData, description: e.target.value})} 
                              placeholder="Détaillez les besoins du client, l'historique ou toute information pertinente ici..."
                          />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;
