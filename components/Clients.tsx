
import React, { useState, useMemo } from 'react';
import { Client, Task, FileLink, TaskStatus, User, UserRole } from '../types';
import { Users, Plus, Search, MapPin, Mail, Phone, Building2, Trash2, Edit2, X, CheckCircle, FileText, ArrowUpDown, Calendar, AlertCircle, ArrowUp, ArrowDown, Lock, Briefcase } from 'lucide-react';

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

  // Récupération des tâches du client sélectionné
  const clientTasks = useMemo(() => {
    if (!selectedClient) return [];
    return tasks.filter(t => t.clientId === selectedClient.id);
  }, [tasks, selectedClient]);

  if (!canAccess) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 pt-20">
            <div className="bg-red-50 p-10 rounded-full mb-6 flex items-center justify-center">
                <Lock size={48} className="text-urgent" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase">Accès Refusé</h2>
            <p className="text-slate-400 max-w-xs font-bold leading-relaxed text-sm">
              Votre compte n'a pas les privilèges requis pour accéder au CRM client.
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

  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 page-transition">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clients</h2>
          <p className="text-slate-400 font-bold text-sm">Gestion du portefeuille iVISION</p>
        </div>
        <div className="w-full md:w-auto flex items-center space-x-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900" />
          </div>
          <button onClick={() => { setEditingClient(null); setFormData({}); setShowModal(true); }} className="bg-primary text-white p-3 px-6 rounded-[1.2rem] shadow-xl shadow-primary/20 active-scale transition-all flex items-center font-black text-[10px] tracking-widest">
            <Plus size={18} className="mr-2" strokeWidth={3} /> NOUVEAU
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map(client => (
              <div key={client.id} onClick={() => setSelectedClient(client)} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm active-scale transition-all group hover:shadow-lg cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-primary font-black text-2xl border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingClient(client); setFormData(client); setShowModal(true); }} className="p-2.5 text-slate-300 hover:text-primary transition-colors bg-slate-50 rounded-xl"><Edit2 size={16}/></button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer ce client ?')) onDeleteClient?.(client.id); }} className="p-2.5 text-slate-300 hover:text-urgent transition-colors bg-red-50/50 rounded-xl"><Trash2 size={16}/></button>
                      </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1 truncate">{client.name}</h3>
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">{client.company || 'Compte Indépendant'}</p>
                  
                  {/* Petit indicateur de tâches sur la carte */}
                  <div className="mt-4 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Briefcase size={12} className="mr-1 text-primary/50" />
                    {tasks.filter(t => t.clientId === client.id).length} Missions
                  </div>
              </div>
          ))}
      </div>

      {/* FORM MODAL */}
      {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-500 pb-[calc(20px+env(safe-area-inset-bottom))]">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{editingClient ? 'Editer Client' : 'Nouveau Client'}</h3>
                      <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                      <div className="space-y-5">
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-2">Nom Complet *</label>
                              <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Rayane Merad" />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-2">Email</label>
                              <input type="email" className={inputClasses} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemple.com" />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-2">Téléphone</label>
                              <input type="tel" className={inputClasses} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="05XX XX XX XX" />
                          </div>
                      </div>
                      <div className="flex space-x-3 pt-6">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-3xl transition-all">ANNULER</button>
                          <button type="submit" className="flex-1 py-5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-xl shadow-primary/20 active-scale">ENREGISTRER</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* DETAIL DRAWER */}
      {selectedClient && (
          <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-bottom duration-500 flex flex-col pb-[env(safe-area-inset-bottom)]">
              <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20 safe-top">
                  <button onClick={() => setSelectedClient(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={20}/></button>
                  <h3 className="font-black text-slate-900 tracking-tight truncate max-w-[200px] uppercase text-sm">{selectedClient.name}</h3>
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 ring-4 ring-primary/5">{selectedClient.name.charAt(0)}</div>
              </header>
              <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-32 no-scrollbar">
                   <div className="grid grid-cols-1 gap-8">
                        {/* Coordonnées */}
                        <div className="space-y-6">
                             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">Coordonnées</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm"><Mail size={18}/></div> 
                                    <div className="overflow-hidden">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Email</p>
                                        <p className="font-bold text-slate-700 truncate">{selectedClient.email || 'Non renseigné'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm"><Phone size={18}/></div>
                                    <div className="overflow-hidden">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Téléphone</p>
                                        <p className="font-bold text-slate-700 truncate">{selectedClient.phone || 'Non renseigné'}</p>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Missions associées */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Missions Actives</h4>
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full">{clientTasks.length}</span>
                            </div>
                            
                            {clientTasks.length === 0 ? (
                                <div className="bg-slate-50 p-12 rounded-[2.5rem] border border-slate-100 text-center border-dashed">
                                    <Briefcase size={32} className="mx-auto text-slate-200 mb-4 opacity-50" strokeWidth={1.5} />
                                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Aucune mission pour le moment</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {clientTasks.map(task => (
                                        <div key={task.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between group transition-all hover:bg-white hover:shadow-md">
                                            <div className="flex items-center space-x-4 overflow-hidden">
                                                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-urgent' : 'bg-primary'}`}></div>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">{task.title}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase mt-0.5 tracking-widest">
                                                        {task.status} • {task.dueDate}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-200 shadow-sm">
                                                <CheckCircle size={20} className={task.status === TaskStatus.DONE ? 'text-success' : ''} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;
