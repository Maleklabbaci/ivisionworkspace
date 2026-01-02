
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
    else if (onAddClient) onAddClient(formData as Client);
    setShowModal(false);
  };

  const inputClasses = "w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white outline-none transition-all text-xs";

  return (
    <div className="space-y-4 max-w-md mx-auto pb-16 page-transition">
      <div className="flex flex-col space-y-3 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Portefeuille</h2>
            <p className="text-slate-300 font-black text-[7px] uppercase tracking-[0.2em]">CRM iVISION</p>
          </div>
          <button onClick={() => { setEditingClient(null); setFormData({}); setShowModal(true); }} className="bg-primary text-white p-2 px-4 rounded-lg shadow-md shadow-primary/10 active-scale transition-all flex items-center font-black text-[8px] tracking-widest uppercase">
            <Plus size={14} className="mr-1.5" strokeWidth={3} /> Nouveau
          </button>
        </div>
        
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-[10px] font-bold outline-none text-slate-900" />
        </div>
      </div>

      {/* COMPACT NARROW LIST - Max Width for Phone optimized look */}
      <div className="flex flex-col space-y-1.5 px-1">
          {filteredClients.map(client => {
              const clientTaskCount = tasks.filter(t => t.clientId === client.id).length;
              return (
                <div 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)} 
                  className="bg-white p-2.5 rounded-2xl border border-slate-50 shadow-sm active-scale flex items-center justify-between group cursor-pointer hover:border-primary/10"
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-black text-sm border border-slate-50 flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <h3 className="text-[11px] font-black text-slate-900 leading-tight truncate">{client.name}</h3>
                            <div className="flex items-center space-x-1.5">
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[80px]">
                                    {client.company || 'Direct'}
                                </span>
                                <div className="w-0.5 h-0.5 bg-slate-200 rounded-full"></div>
                                <span className="text-[7px] font-black text-primary uppercase tracking-tighter">
                                    {clientTaskCount} Mission{clientTaskCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={12} className="text-slate-100 group-hover:text-slate-300 flex-shrink-0" />
                </div>
              );
          })}

          {filteredClients.length === 0 && (
            <div className="py-12 text-center opacity-10">
                <Users size={24} className="mx-auto mb-2" />
                <p className="font-black text-[7px] uppercase tracking-widest">Aucun client</p>
            </div>
          )}
      </div>

      {/* MODAL / DRAWER DETAILS */}
      {selectedClient && (
          <div className="fixed inset-0 bg-white z-[110] animate-in slide-in-from-bottom duration-400 flex flex-col safe-pb">
              <header className="px-4 py-3 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-20 safe-top">
                  <button onClick={() => setSelectedClient(null)} className="p-2 bg-slate-50 rounded-lg text-slate-400 active-scale"><X size={16}/></button>
                  <h3 className="font-black text-slate-900 tracking-tight truncate max-w-[150px] uppercase text-[10px]">{selectedClient.name}</h3>
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">{selectedClient.name.charAt(0)}</div>
              </header>
              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 no-scrollbar">
                   <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-3 p-3.5 bg-slate-50 rounded-xl">
                            <Mail size={14} className="text-primary"/> 
                            <span className="font-bold text-slate-700 text-[10px] truncate">{selectedClient.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3.5 bg-slate-50 rounded-xl">
                            <Phone size={14} className="text-primary"/>
                            <span className="font-bold text-slate-700 text-[10px] truncate">{selectedClient.phone || 'N/A'}</span>
                        </div>
                   </div>

                   <div className="space-y-3">
                        <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Missions Actives</h4>
                        <div className="space-y-1.5">
                            {tasks.filter(t => t.clientId === selectedClient.id).map(task => (
                                <div key={task.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-2.5 truncate">
                                        <div className={`w-1 h-6 rounded-full ${task.status === TaskStatus.DONE ? 'bg-success' : 'bg-primary'}`}></div>
                                        <h4 className="font-bold text-slate-900 text-[10px] truncate">{task.title}</h4>
                                    </div>
                                    <CheckCircle size={14} className={task.status === TaskStatus.DONE ? 'text-success' : 'text-slate-100'} />
                                </div>
                            ))}
                            {tasks.filter(t => t.clientId === selectedClient.id).length === 0 && (
                                <p className="text-[8px] text-slate-300 font-black uppercase text-center py-4">Aucune mission</p>
                            )}
                        </div>
                   </div>
                   
                   <div className="pt-4 flex space-x-2">
                       <button onClick={() => { setEditingClient(selectedClient); setFormData(selectedClient); setShowModal(true); setSelectedClient(null); }} className="flex-1 p-3.5 bg-slate-100 text-slate-600 font-black text-[8px] uppercase tracking-widest rounded-xl active-scale flex items-center justify-center">
                           <Edit2 size={12} className="mr-1.5" /> Modifier
                       </button>
                       <button onClick={() => { if(confirm('Révoquer ?')) { onDeleteClient?.(selectedClient.id); setSelectedClient(null); } }} className="flex-1 p-3.5 bg-red-50 text-urgent font-black text-[8px] uppercase tracking-widest rounded-xl active-scale flex items-center justify-center">
                           <Trash2 size={12} className="mr-1.5" /> Révoquer
                       </button>
                   </div>
              </div>
          </div>
      )}

      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-[120] flex items-end justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[32px] shadow-xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-400 pb-8">
                  <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white">
                      <h3 className="text-sm font-black text-slate-900 tracking-tighter uppercase">{editingClient ? 'Modifier' : 'Initialiser'} Client</h3>
                      <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400"><X size={14}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Identité *</label>
                          <input required type="text" className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Marc Lavoie" />
                      </div>
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Compagnie</label>
                          <input type="text" className={inputClasses} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Nom société" />
                      </div>
                      <div className="flex space-x-2 pt-2">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[8px] tracking-widest">RETOUR</button>
                          <button type="submit" className="flex-1 py-3 bg-primary text-white font-black uppercase text-[8px] tracking-widest rounded-xl shadow-lg shadow-primary/10 active-scale">VALIDER</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;
