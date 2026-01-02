
import React, { useState, useMemo } from 'react';
import { Client, Task, FileLink, TaskStatus, User, UserRole } from '../types';
import { Users, Plus, Search, MapPin, Mail, Phone, Building2, Trash2, Edit2, X, CheckCircle, FileText, ArrowUpDown, Calendar, AlertCircle, ArrowUp, ArrowDown, Lock, Briefcase, ChevronRight } from 'lucide-react';

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
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 pt-20">
            <div className="bg-red-50 p-10 rounded-full mb-6 flex items-center justify-center">
                <Lock size={48} className="text-urgent" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter uppercase">Accès Refusé</h2>
            <p className="text-slate-400 max-w-xs font-bold leading-relaxed text-[11px] uppercase tracking-widest">
              Privilèges CRM requis.
            </p>
        </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (editingClient && onUpdateClient) onUpdateClient({ ...editingClient, ...formData } as Client);
    else if (onAddClient) onAddClient(formData as Client);
    setShowModal(false);
  };

  const inputClasses = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all text-sm";

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 page-transition px-2 md:px-0">
      <div className="flex flex-col space-y-5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Portefeuille</h2>
            <p className="text-slate-300 font-black text-[8px] uppercase tracking-[0.3em] mt-0.5">CRM iVISION Actif</p>
          </div>
          <button onClick={() => { setEditingClient(null); setFormData({}); setShowModal(true); }} className="bg-primary text-white p-2.5 px-5 rounded-xl shadow-lg shadow-primary/20 active-scale transition-all flex items-center font-black text-[9px] tracking-widest uppercase">
            <Plus size={16} className="mr-2" strokeWidth={3} /> Nouveau
          </button>
        </div>
        
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
          <input type="text" placeholder="Rechercher un client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-900" />
        </div>
      </div>

      {/* LISTE COMPACTE */}
      <div className="flex flex-col space-y-2">
          {filteredClients.map(client => {
              const clientTaskCount = tasks.filter(t => t.clientId === client.id).length;
              return (
                <div 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)} 
                  className="bg-white p-3.5 rounded-[1.8rem] border border-slate-50 shadow-sm active-scale transition-all flex items-center justify-between group cursor-pointer hover:border-primary/10 hover:shadow-md"
                >
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-black text-lg border border-slate-50 group-hover:bg-primary group-hover:text-white transition-all duration-300 flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <h3 className="text-[13px] font-black text-slate-900 leading-tight truncate">{client.name}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[120px]">
                                    {client.company || 'Indépendant'}
                                </span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">
                                    {clientTaskCount} Mission{clientTaskCount > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingClient(client); setFormData(client); setShowModal(true); }} 
                          className="p-2 text-slate-200 hover:text-primary transition-colors"
                        >
                            <Edit2 size={14}/>
                        </button>
                        <ChevronRight size={14} className="text-slate-100 group-hover:text-slate-300 transition-all mr-1" />
                    </div>
                </div>
              );
          })}

          {filteredClients.length === 0 && (
            <div className="py-20 text-center opacity-20">
                <Users size={32} className="mx-auto mb-4" />
                <p className="font-black text-[9px] uppercase tracking-widest">Aucun client trouvé</p>
            </div>
          )}
      </div>

      {/* FORM MODAL */}
      {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-t-[36px] md:rounded-[36px] shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-500 pb-[calc(20px+env(safe-area-inset-bottom))]">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                      <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase">{editingClient ? 'Modifier' : 'Nouveau'} Client</h3>
                      <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400"><X size={18}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                      <div className="space-y-4">
                          <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest px-1">Nom Complet *</label>
                              <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jean Dupont" />
                          </div>
                          <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest px-1">Entreprise / Projet</label>
                              <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Nom de la boîte" />
                          </div>
                          <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest px-1">Email de contact</label>
                              <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@email.com" />
                          </div>
                      </div>
                      <div className="flex space-x-2 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[9px] tracking-widest">ANNULER</button>
                          <button type="submit" className="flex-1 py-4 bg-primary text-white font-black uppercase text-[9px] tracking-widest rounded-2xl shadow-xl shadow-primary/20 active-scale">VALIDER</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* DETAIL DRAWER - Toujours minimaliste */}
      {selectedClient && (
          <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-bottom duration-500 flex flex-col pb-[env(safe-area-inset-bottom)]">
              <header className="px-5 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-20 safe-top">
                  <button onClick={() => setSelectedClient(null)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 active-scale"><X size={18}/></button>
                  <h3 className="font-black text-slate-900 tracking-tight truncate max-w-[180px] uppercase text-xs">{selectedClient.name}</h3>
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">{selectedClient.name.charAt(0)}</div>
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar">
                   <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl">
                                <Mail size={16} className="text-primary"/> 
                                <span className="font-bold text-slate-700 text-xs truncate">{selectedClient.email || 'Pas d\'email'}</span>
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl">
                                <Phone size={16} className="text-primary"/>
                                <span className="font-bold text-slate-700 text-xs truncate">{selectedClient.phone || 'Pas de numéro'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Missions du Client</h4>
                            {tasks.filter(t => t.clientId === selectedClient.id).length === 0 ? (
                                <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-100">
                                    <p className="text-[8px] text-slate-300 font-black uppercase">Aucun flux actif</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.filter(t => t.clientId === selectedClient.id).map(task => (
                                        <div key={task.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <div className="w-1 h-8 rounded-full bg-primary/40"></div>
                                                <div className="truncate">
                                                    <h4 className="font-bold text-slate-900 text-[12px] truncate">{task.title}</h4>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">{task.status}</p>
                                                </div>
                                            </div>
                                            <CheckCircle size={16} className={task.status === TaskStatus.DONE ? 'text-success' : 'text-slate-200'} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                   </div>
                   
                   <button 
                     onClick={() => { if(confirm('Révoquer ce client ?')) { onDeleteClient?.(selectedClient.id); setSelectedClient(null); } }} 
                     className="w-full p-4 text-urgent font-black text-[9px] uppercase tracking-widest bg-red-50 rounded-2xl active-scale"
                   >
                       SUPPRIMER LE COMPTE CLIENT
                   </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;
