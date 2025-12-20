

import React, { useState, useMemo } from 'react';
import { Client, Task, FileLink, TaskStatus, User, UserRole } from '../types';
import { Users, Plus, Search, MapPin, Mail, Phone, Building2, Trash2, Edit2, X, CheckCircle, FileText, ArrowUpDown, Calendar, AlertCircle, ArrowUp, ArrowDown, Lock } from 'lucide-react';

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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // For Details View
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'files'>('details');

  // Task Sorting State inside Client Details
  const [taskSortBy, setTaskSortBy] = useState<'date' | 'status' | 'title' | 'priority'>('date');
  const [taskSortOrder, setTaskSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  // ACCESS GUARD
  const canAccess = !currentUser || (
    currentUser.role === UserRole.ADMIN || 
    currentUser.role === UserRole.PROJECT_MANAGER || 
    currentUser.role === UserRole.ANALYST ||
    currentUser.permissions?.canManageClients
  );

  if (!canAccess) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="bg-red-50 p-6 rounded-full mb-4">
                <Lock size={48} className="text-urgent" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
            <p className="text-slate-500 max-w-md">
                Vous n'avez pas la permission d'accéder à la gestion des clients. Contactez un administrateur pour obtenir l'accès.
            </p>
        </div>
    );
  }

  const filteredClients = useMemo(() => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  // Derived Data for Selected Client
  const clientTasks = useMemo(() => {
      if (!selectedClient) return [];
      let relatedTasks = tasks.filter(t => t.clientId === selectedClient.id);
      
      // Sort tasks
      return relatedTasks.sort((a, b) => {
          let comparison = 0;
          if (taskSortBy === 'date') {
              comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } else if (taskSortBy === 'status') {
              comparison = a.status.localeCompare(b.status);
          } else if (taskSortBy === 'title') {
              comparison = a.title.localeCompare(b.title);
          } else if (taskSortBy === 'priority') {
              const pWeight = { high: 3, medium: 2, low: 1, undefined: 0 };
              const wA = pWeight[a.priority || 'medium'] || 0;
              const wB = pWeight[b.priority || 'medium'] || 0;
              comparison = wA - wB;
          }
          return taskSortOrder === 'asc' ? comparison : -comparison;
      });
  }, [selectedClient, tasks, taskSortBy, taskSortOrder]);

  const clientFiles = useMemo(() => {
      if (!selectedClient) return [];
      return fileLinks.filter(f => f.clientId === selectedClient.id);
  }, [selectedClient, fileLinks]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({ name: '', company: '', email: '', phone: '', address: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingClient && onUpdateClient) {
      onUpdateClient({ ...editingClient, ...formData } as Client);
    } else if (onAddClient) {
      onAddClient(formData as Client);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et pourrait affecter les tâches associées.")) {
        if (onDeleteClient) onDeleteClient(id);
        if (selectedClient?.id === id) setSelectedClient(null);
    }
  };

  const openClientDetails = (client: Client) => {
      setSelectedClient(client);
      setActiveTab('details'); // Reset to details tab on open
  };

  const toggleTaskSort = (criteria: 'date' | 'status' | 'title' | 'priority') => {
      if (taskSortBy === criteria) {
          setTaskSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setTaskSortBy(criteria);
          setTaskSortOrder('asc'); // Default to asc for new criteria
      }
  };

  const getStatusColor = (status: TaskStatus) => {
      switch(status) {
          case TaskStatus.DONE: return 'bg-green-100 text-green-700 border-green-200';
          case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
          case TaskStatus.BLOCKED: return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="text-slate-500 text-sm">Gérez votre portefeuille client et contacts.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-200 text-black border border-gray-300 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary w-full md:w-64 transition-all placeholder-gray-500 font-medium" 
            />
          </div>
          {onAddClient && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary text-white p-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center text-sm font-medium whitespace-nowrap"
            >
              <Plus size={18} className="mr-2" />
              Nouveau Client
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Users size={32} className="opacity-50" />
                  </div>
                  <p>Aucun client trouvé.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClients.map(client => (
                      <div 
                          key={client.id} 
                          onClick={() => openClientDetails(client)}
                          className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative"
                      >
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                      {client.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{client.name}</h3>
                                      {client.company && (
                                          <p className="text-xs text-slate-500 flex items-center">
                                              <Building2 size={10} className="mr-1" />
                                              {client.company}
                                          </p>
                                      )}
                                  </div>
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {onUpdateClient && (
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }}
                                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                          <Edit2 size={14} />
                                      </button>
                                  )}
                                  {onDeleteClient && (
                                      <button 
                                          onClick={(e) => handleDelete(client.id, e)}
                                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  )}
                              </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600">
                              {client.email && (
                                  <div className="flex items-center">
                                      <Mail size={14} className="mr-2 text-slate-400" />
                                      <span className="truncate">{client.email}</span>
                                  </div>
                              )}
                              {client.phone && (
                                  <div className="flex items-center">
                                      <Phone size={14} className="mr-2 text-slate-400" />
                                      <span>{client.phone}</span>
                                  </div>
                              )}
                              {client.address && (
                                  <div className="flex items-center">
                                      <MapPin size={14} className="mr-2 text-slate-400" />
                                      <span className="truncate">{client.address}</span>
                                  </div>
                              )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-medium text-slate-500">
                                <span>Voir détails</span>
                                <div className="flex items-center space-x-3">
                                     <span className="flex items-center" title="Tâches en cours"><CheckCircle size={12} className="mr-1 text-slate-400"/> {tasks.filter(t => t.clientId === client.id && t.status !== TaskStatus.DONE).length}</span>
                                     <span className="flex items-center" title="Fichiers"><FileText size={12} className="mr-1 text-slate-400"/> {fileLinks.filter(f => f.clientId === client.id).length}</span>
                                </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">{editingClient ? 'Modifier Client' : 'Nouveau Client'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
                <input required type="text" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entreprise</label>
                <input type="text" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input type="text" className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
                  <textarea 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none h-24" 
                      placeholder="Informations supplémentaires, contexte, etc."
                      value={formData.description || ''} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Annuler</button>
                  <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">{editingClient ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-slate-50">
                    <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-2xl font-bold text-primary">
                            {selectedClient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{selectedClient.name}</h2>
                            {selectedClient.company && (
                                <p className="text-slate-500 font-medium flex items-center">
                                    <Building2 size={14} className="mr-1" />
                                    {selectedClient.company}
                                </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                                {selectedClient.email && <span className="flex items-center"><Mail size={14} className="mr-1.5 text-slate-400"/> {selectedClient.email}</span>}
                                {selectedClient.phone && <span className="flex items-center"><Phone size={14} className="mr-1.5 text-slate-400"/> {selectedClient.phone}</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                </div>

                {/* Tabs & Content */}
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
                        <button 
                            onClick={() => setActiveTab('details')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Vue d'ensemble
                        </button>
                        <button 
                            onClick={() => setActiveTab('tasks')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <span>Tâches</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{clientTasks.length}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('files')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <span>Fichiers</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{clientFiles.length}</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        {/* Tab: Details */}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center uppercase text-xs tracking-wider">
                                            <MapPin size={14} className="mr-2 text-primary" /> Coordonnées
                                        </h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-500">Email</span>
                                                <span className="text-slate-900 font-medium">{selectedClient.email || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-500">Téléphone</span>
                                                <span className="text-slate-900 font-medium">{selectedClient.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-500">Adresse</span>
                                                <span className="text-slate-900 font-medium text-right max-w-[60%]">{selectedClient.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center uppercase text-xs tracking-wider">
                                            <AlertCircle size={14} className="mr-2 text-primary" /> À propos
                                        </h4>
                                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {selectedClient.description || <span className="text-slate-400 italic">Aucune description disponible.</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                                        <h5 className="text-blue-600 font-bold text-2xl">{clientTasks.filter(t => t.status === TaskStatus.DONE).length}</h5>
                                        <p className="text-blue-800 text-xs font-medium uppercase mt-1">Projets Terminés</p>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center">
                                        <h5 className="text-orange-600 font-bold text-2xl">{clientTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</h5>
                                        <p className="text-orange-800 text-xs font-medium uppercase mt-1">En cours</p>
                                    </div>
                                    <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-center">
                                        <h5 className="text-slate-600 font-bold text-2xl">{clientFiles.length}</h5>
                                        <p className="text-slate-500 text-xs font-medium uppercase mt-1">Documents</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Tasks (Table View) */}
                        {activeTab === 'tasks' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                {clientTasks.length === 0 ? (
                                     <div className="p-12 text-center text-slate-400">Aucune tâche associée à ce client.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-600">
                                            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleTaskSort('title')}>
                                                        Tâche <ArrowUpDown size={10} className="inline ml-1" />
                                                    </th>
                                                    <th className="px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleTaskSort('status')}>
                                                        Statut <ArrowUpDown size={10} className="inline ml-1" />
                                                    </th>
                                                    <th className="px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleTaskSort('priority')}>
                                                        Priorité <ArrowUpDown size={10} className="inline ml-1" />
                                                    </th>
                                                    <th className="px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors" onClick={() => toggleTaskSort('date')}>
                                                        Échéance <ArrowUpDown size={10} className="inline ml-1" />
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {clientTasks.map(task => (
                                                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-3">
                                                            <div className="font-medium text-slate-800">{task.title}</div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getStatusColor(task.status)}`}>
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                             {task.priority === 'high' && (
                                                                <span className="flex items-center text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 w-fit">
                                                                    <AlertCircle size={10} className="mr-1"/>Haute
                                                                </span>
                                                            )}
                                                            {task.priority === 'medium' && (
                                                                <span className="flex items-center text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit">
                                                                    <ArrowUp size={10} className="mr-1"/>Moy.
                                                                </span>
                                                            )}
                                                            {task.priority === 'low' && (
                                                                <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                                                                    <ArrowDown size={10} className="mr-1"/>Basse
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-500 flex items-center">
                                                            <Calendar size={12} className="mr-1.5" />
                                                            {task.dueDate}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Files */}
                        {activeTab === 'files' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {clientFiles.length === 0 ? (
                                    <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                                        Aucun fichier associé.
                                    </div>
                                ) : (
                                    clientFiles.map(file => (
                                        <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-start space-x-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-bold text-slate-800 truncate" title={file.name}>{file.name}</h5>
                                                <p className="text-xs text-slate-400 mt-1">Ajouté le {file.createdAt}</p>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">
                                                    Ouvrir le fichier
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                )}
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