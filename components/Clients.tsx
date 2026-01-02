
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
    <div className="space-y-6 w-full pb-16 page-transition">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Portefeuille</h2>
          <p className="text-slate-300 font-black text-[9px] uppercase tracking-[0.3em]">Base de données CRM iVISION</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs font-bold outline-none text-slate-900" />
          </div>
          <button onClick={() => { setEditingClient(null); setFormData({name: '', company: '', email: '', phone: '', address: '', description: ''}); setShowModal(true); }} className="bg-primary text-white p-3.5 px-6 rounded-2xl shadow-xl shadow-primary/20 active-scale flex items-center justify-center font-black text-[10px] tracking-widest uppercase border-4 border-white transition-all">
            <Plus size={18} className="mr-2" strokeWidth={3} /> AJOUTER UN COMPTE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
          {filteredClients.map(client => {
              const clientTaskCount = tasks.filter(t => t.clientId === client.id).length;
              return (
                <div 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)} 
                  className="bg-white p-5 rounded-[2.2rem] border border-slate-50 shadow-sm active-scale flex flex-col group cursor-pointer hover-effect transition-all"
                >
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary font-black text-xl border border-slate-100 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <h3 className="text-sm font-black text-slate-900 leading-tight truncate">{client.name}</h3>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate block">
                                {client.company || 'Compte Direct'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-3 py-1.5 rounded-xl">
                            {clientTaskCount} Mission{clientTaskCount !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight size={18} className="text-slate-100 group-hover:text-primary transition-colors" />
                    </div>
                </div>
              );
          })}

          {filteredClients.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-20">
                <Users size={64} className="mx-auto mb-4" />
                <p className="font-black text-xs uppercase tracking-[0.3em]">Aucun partenaire dans la base</p>
            </div>
          )}
      </div>

      {/* DÉTAILS CLIENT - ADAPTÉ PC */}
      {selectedClient && (
          <div className="fixed inset-0 z-[1000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedClient(null)}></div>
              <div className="relative bg-white rounded-t-[2.5rem] lg:rounded-[3rem] w-full max-w-2xl mx-auto flex flex-col modal-drawer shadow-2xl overflow-hidden">
                  <header className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white z-20">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl">{selectedClient.name.charAt(0)}</div>
                        <div>
                          <h3 className="font-black text-slate-900 tracking-tight uppercase text-sm">{selectedClient.name}</h3>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{selectedClient.company || 'Client Direct'}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedClient(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale hover:bg-slate-100"><X size={24}/></button>
                  </header>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                       <div className="grid grid-cols-2 gap-4">
                            <a href={`mailto:${selectedClient.email}`} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] space-y-2 hover-effect transition-all">
                                <Mail size={22} className="text-primary"/> 
                                <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest truncate w-full text-center">{selectedClient.email || 'Email non défini'}</span>
                            </a>
                            <a href={`tel:${selectedClient.phone}`} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] space-y-2 hover-effect transition-all">
                                <Phone size={22} className="text-primary"/>
                                <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest truncate w-full text-center">{selectedClient.phone || 'Tel non défini'}</span>
                            </a>
                       </div>

                       <div className="space-y-4">
                            <div className="flex items-center space-x-3 px-1">
                                <div className="w-1 h-4 bg-primary rounded-full"></div>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Localisation stratégique</h4>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-slate-700 font-bold text-sm leading-relaxed flex items-start">
                                    <MapPin size={18} className="mr-3 text-slate-300 flex-shrink-0" />
                                    {selectedClient.address || "Aucun point de localisation enregistré."}
                                </p>
                            </div>
                       </div>

                       <div className="space-y-4">
                            <div className="flex items-center space-x-3 px-1">
                                <div className="w-1 h-4 bg-primary rounded-full"></div>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Notes & Briefing</h4>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <p className="text-slate-600 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedClient.description || "Aucun briefing disponible pour ce compte."}
                                </p>
                            </div>
                       </div>

                       <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center space-x-3">
                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Historique iVISION</h4>
                                </div>
                                <span className="bg-primary/10 text-primary text-[9px] font-black px-3 py-1.5 rounded-xl uppercase">
                                    {tasks.filter(t => t.clientId === selectedClient.id).length} Missions
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tasks.filter(t => t.clientId === selectedClient.id).map(task => (
                                    <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center space-x-3 truncate">
                                            <div className={`w-1 h-8 rounded-full ${task.status === TaskStatus.DONE ? 'bg-success' : 'bg-primary'}`}></div>
                                            <h4 className="font-bold text-slate-900 text-[11px] truncate uppercase">{task.title}</h4>
                                        </div>
                                        <CheckCircle size={16} className={task.status === TaskStatus.DONE ? 'text-success' : 'text-slate-100'} />
                                    </div>
                                ))}
                            </div>
                       </div>
                       
                       <div className="pt-6 flex space-x-4">
                           <button onClick={() => { setEditingClient(selectedClient); setFormData(selectedClient); setShowModal(true); setSelectedClient(null); }} className="flex-1 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-[2rem] active-scale transition-all border-4 border-white shadow-xl flex items-center justify-center">
                               <Edit2 size={18} className="mr-3" /> CONFIGURER LE COMPTE
                           </button>
                           <button onClick={() => { if(confirm('Révoquer ce client ?')) { onDeleteClient?.(selectedClient.id); setSelectedClient(null); } }} className="w-20 h-20 bg-red-50 text-urgent flex items-center justify-center rounded-[2rem] active-scale transition-all border-4 border-white shadow-xl">
                               <Trash2 size={28} />
                           </button>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* FORMULAIRE - ADAPTÉ PC */}
      {showModal && (
          <div className="fixed inset-0 z-[2000] flex flex-col justify-end lg:justify-center p-0 lg:p-6">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
              <div className="relative bg-white rounded-t-[2.5rem] lg:rounded-[3rem] w-full max-w-xl mx-auto flex flex-col modal-drawer shadow-2xl overflow-hidden">
                  <header className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white z-20">
                      <h3 className="text-sm font-black text-slate-900 tracking-tighter uppercase">{editingClient ? 'Modifier le partenaire' : 'Nouveau Partenaire'}</h3>
                      <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
                  </header>
                  
                  <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                      <div className="space-y-6">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Identification</label>
                              <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nom du contact principal *" />
                              <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Nom de l'organisation" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Communication</label>
                                <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email professionnel" />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Direct</label>
                                <input type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Téléphone" />
                              </div>
                          </div>

                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Géographie</label>
                              <input type="text" className={inputClasses} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Adresse complète de l'organisation" />
                          </div>

                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Analyse & Briefing</label>
                              <textarea 
                                  className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all text-sm resize-none" 
                                  value={formData.description} 
                                  onChange={e => setFormData({...formData, description: e.target.value})} 
                                  placeholder="Notes stratégiques..."
                              />
                          </div>
                      </div>
                      
                      <button onClick={handleSubmit} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 border-4 border-white active-scale transition-all">
                        FINALISER LE PROFIL
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;
