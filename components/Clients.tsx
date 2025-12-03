
import React, { useState, useMemo } from 'react';
import { Client, Task, FileLink, TaskStatus } from '../types';
import { Users, Plus, Search, MapPin, Mail, Phone, Building2, Trash2, Edit2, X, CheckCircle, Briefcase, FileText, Link as LinkIcon, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Calendar, AlertCircle } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  tasks: Task[];
  fileLinks?: FileLink[]; // Added to show associated files
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

type SortField = 'dueDate' | 'status' | 'title';
type SortOrder = 'asc' | 'desc';

const Clients: React.FC<ClientsProps> = ({ clients, tasks, fileLinks = [], onAddClient, onUpdateClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  
  // State for Viewing Details
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'files'>('info');

  // Sorting State for Tasks inside Modal
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({ name: '', company: '', email: '', phone: '', address: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingClient) {
      onUpdateClient({ ...editingClient, ...formData } as Client);
    } else {
      onAddClient({
        id: `temp-${Date.now()}`,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      } as Client);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('Êtes-vous sûr de vouloir supprimer ce client ? Toutes les liaisons avec les tâches seront conservées mais le client ne sera plus listé.')) {
          onDeleteClient(id);
      }
  };

  const openClientDetails = (client: Client) => {
      setViewClient(client);
      setActiveTab('info');
      setSortField('dueDate'); // Reset sort
      setSortOrder('asc');
  };

  // Helper to get associated data
  const getClientTasks = (clientId: string) => tasks.filter(t => t.clientId === clientId);
  const getClientFiles = (clientId: string) => fileLinks.filter(f => f.clientId === clientId);

  // Sorted Tasks Logic
  const sortedTasks = useMemo(() => {
      if (!viewClient) return [];
      const tasks = getClientTasks(viewClient.id);
      
      return [...tasks].sort((a, b) => {
          let valA, valB;
          
          if (sortField === 'dueDate') {
              valA = new Date(a.dueDate).getTime();
              valB = new Date(b.dueDate).getTime();
          } else if (sortField === 'status') {
              valA = a.status;
              valB = b.status;
          } else {
              valA = a.title.toLowerCase();
              valB = b.title.toLowerCase();
          }

          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }, [viewClient, tasks, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortOrder('asc');
      }
  };

  const getSortIcon = (field: SortField) => {
      if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
      return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="text-slate-500">Gérez votre base de clients et leurs coordonnées.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:flex-none">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un client..." 
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
           </div>
           <button 
             onClick={() => handleOpenModal()}
             className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
           >
             <Plus size={18} />
             <span>Nouveau Client</span>
           </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const clientTasks = tasks.filter(t => t.clientId === client.id);
          const activeTasks = clientTasks.filter(t => t.status !== 'Terminé').length;

          return (
            <div 
                key={client.id} 
                onClick={() => openClientDetails(client)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 group hover:shadow-md transition-all relative cursor-pointer hover:border-primary/30"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
                            {client.company ? client.company.charAt(0) : client.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">{client.name}</h3>
                            {client.company && (
                                <p className="text-xs text-slate-500 flex items-center mt-1">
                                    <Building2 size={12} className="mr-1" /> {client.company}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(client); }} 
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded"
                        >
                            <Edit2 size={16}/>
                        </button>
                        <button 
                            onClick={(e) => handleDelete(client.id, e)} 
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    {client.email && (
                        <div className="flex items-center text-sm text-slate-600">
                            <Mail size={14} className="mr-2 text-slate-400" />
                            <span className="truncate">{client.email}</span>
                        </div>
                    )}
                    {client.phone && (
                        <div className="flex items-center text-sm text-slate-600">
                            <Phone size={14} className="mr-2 text-slate-400" />
                            <span>{client.phone}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                     <span className="text-slate-500 font-medium flex items-center">
                         <Briefcase size={14} className="mr-1.5"/>
                         {clientTasks.length} Projets
                     </span>
                     <span className={`px-2 py-1 rounded-full font-bold ${activeTasks > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-success'}`}>
                         {activeTasks > 0 ? `${activeTasks} En cours` : 'Aucun actif'}
                     </span>
                </div>
            </div>
          );
        })}
        
        {filteredClients.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Users size={48} className="mx-auto mb-4 opacity-30" />
                <p>Aucun client trouvé. Commencez par en ajouter un.</p>
            </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">{editingClient ? 'Modifier le client' : 'Nouveau client'}</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du contact *</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Jean Dupont" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Entreprise</label>
                            <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Agence Immo" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="contact@..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="+33..." />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                            <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Adresse complète..." />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm">{editingClient ? 'Enregistrer' : 'Créer'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewClient && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white text-primary rounded-xl flex items-center justify-center font-bold text-2xl border border-slate-200 shadow-sm">
                            {viewClient.company ? viewClient.company.charAt(0) : viewClient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{viewClient.name}</h2>
                            {viewClient.company && <p className="text-slate-500 font-medium flex items-center"><Building2 size={14} className="mr-1"/>{viewClient.company}</p>}
                        </div>
                    </div>
                    <button onClick={() => setViewClient(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={24}/></button>
                </div>

                <div className="flex border-b border-slate-100 px-6 shrink-0 bg-white sticky top-0">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Informations</button>
                    <button onClick={() => setActiveTab('tasks')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Tâches ({getClientTasks(viewClient.id).length})</button>
                    <button onClick={() => setActiveTab('files')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Fichiers ({getClientFiles(viewClient.id).length})</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Coordonnées</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <Mail className="text-primary mr-3" size={18} />
                                            <div>
                                                <p className="text-xs text-slate-500">Email</p>
                                                <a href={`mailto:${viewClient.email}`} className="text-sm font-medium text-slate-900 hover:text-primary hover:underline">{viewClient.email || 'Non renseigné'}</a>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="text-primary mr-3" size={18} />
                                            <div>
                                                <p className="text-xs text-slate-500">Téléphone</p>
                                                <a href={`tel:${viewClient.phone}`} className="text-sm font-medium text-slate-900 hover:text-primary hover:underline">{viewClient.phone || 'Non renseigné'}</a>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="text-primary mr-3" size={18} />
                                            <div>
                                                <p className="text-xs text-slate-500">Adresse</p>
                                                <p className="text-sm font-medium text-slate-900">{viewClient.address || 'Non renseignée'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aperçu rapide</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-primary">{getClientTasks(viewClient.id).length}</p>
                                            <p className="text-xs text-blue-700 font-medium">Projets Totaux</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-success">{getClientTasks(viewClient.id).filter(t => t.status === TaskStatus.DONE).length}</p>
                                            <p className="text-xs text-green-700 font-medium">Terminés</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TASKS TAB */}
                    {activeTab === 'tasks' && (
                        <div className="space-y-4">
                            {/* Sort Toolbar */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className="text-xs text-slate-500 font-medium">Trier par:</span>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleSort('dueDate')}
                                        className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${sortField === 'dueDate' ? 'bg-slate-100 text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span>Date</span>
                                        {getSortIcon('dueDate')}
                                    </button>
                                    <button 
                                        onClick={() => handleSort('status')}
                                        className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${sortField === 'status' ? 'bg-slate-100 text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span>Statut</span>
                                        {getSortIcon('status')}
                                    </button>
                                    <button 
                                        onClick={() => handleSort('title')}
                                        className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${sortField === 'title' ? 'bg-slate-100 text-primary font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span>Nom</span>
                                        {getSortIcon('title')}
                                    </button>
                                </div>
                            </div>

                            {/* Task List */}
                            {sortedTasks.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 italic flex flex-col items-center">
                                    <Briefcase size={24} className="mb-2 opacity-50"/>
                                    Aucune tâche associée à ce client.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {sortedTasks.map(task => (
                                        <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${task.status === TaskStatus.DONE ? 'bg-green-500' : task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : task.status === TaskStatus.BLOCKED ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{task.title}</h4>
                                                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                                                        <span className="flex items-center"><Calendar size={10} className="mr-1"/>{task.dueDate}</span>
                                                        {task.price && <span className="text-slate-400">• {task.price} DA</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded border ${task.status === TaskStatus.DONE ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* FILES TAB */}
                    {activeTab === 'files' && (
                        <div className="space-y-4">
                             {getClientFiles(viewClient.id).length === 0 ? (
                                <p className="text-center text-slate-400 py-8 italic flex flex-col items-center">
                                    <FileText size={24} className="mb-2 opacity-50"/>
                                    Aucun fichier associé à ce client.
                                </p>
                             ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {getClientFiles(viewClient.id).map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <div className="p-2 bg-slate-100 rounded text-slate-500 shrink-0">
                                                    {file.url.startsWith('http') ? <LinkIcon size={16}/> : <FileText size={16}/>}
                                                </div>
                                                <div className="truncate">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate" title={file.name}>{file.name}</h4>
                                                    <p className="text-xs text-slate-500">Ajouté le {file.createdAt}</p>
                                                </div>
                                            </div>
                                            {file.url && (
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors flex items-center text-xs font-medium">
                                                    <span className="mr-1 hidden sm:inline">Ouvrir</span> <ExternalLink size={14}/>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Clients;
