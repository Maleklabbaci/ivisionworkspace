
import React, { useState, useMemo } from 'react';
import { Client, Task, User, UserRole, Project, TaskStatus, SalaryRecord, Expense, AdCampaignExpense, FileLink } from '../types';
// Fixed: Import hooks from react-router to resolve missing exports in react-router-dom
import { useNavigate } from 'react-router';
import { Plus, Search, Mail, Phone, MapPin, X, Briefcase, ChevronRight, Trash2, Edit2, Globe, Activity, Info, Lock, Layers, CheckCircle2, Clock, ListChecks, ArrowUpRight, Save, Zap, AlertTriangle, Wallet, DollarSign, Target, FileText, ExternalLink } from 'lucide-react';
import Modal from './Modal';

const Clients: React.FC<any> = ({ clients = [], tasks = [], projects = [], salaries = [], expenses = [], adCampaigns = [], fileLinks = [], onAddClient, onUpdateClient, onDeleteClient, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view' | 'edit'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({ name: '', company: '', email: '', phone: '', address: '', description: '' });
  const navigate = useNavigate();

  const canManage = currentUser.role === UserRole.ADMIN || !!currentUser.permissions?.canManageClients;
  const canViewFinances = currentUser.role === UserRole.ADMIN || !!currentUser.permissions?.canViewProjectFinances;

  const filteredClients = clients.filter((c: Client) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- LOGIQUE DÉTAIL CLIENT ---
  const clientDetailedStats = useMemo(() => {
    if (!selectedClient) return null;

    const clientTasks = tasks.filter((t: Task) => t.clientId === selectedClient.id);
    const clientProjects = projects.filter((p: Project) => p.clientId === selectedClient.id);
    const clientDocs = fileLinks.filter((f: FileLink) => f.clientId === selectedClient.id);
    const projIds = clientProjects.map(p => p.id);

    // Missions Stats
    const activeTasks = clientTasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length;
    const blockedTasks = clientTasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const doneTasks = clientTasks.filter(t => t.status === TaskStatus.DONE).length;

    // Finance Stats (Global Client)
    const totalBudget = clientProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
    
    const clientSalaries = salaries.filter((s: SalaryRecord) => projIds.includes(s.projectId || ''));
    const salaryCost = clientSalaries.reduce((acc: number, s: SalaryRecord) => {
        const total = (s.amount || 0) + (s.bonus || 0);
        return acc + (s.frequency === 'hebdo' ? total * 4 : total);
    }, 0);

    const clientExpenses = expenses.filter((e: Expense) => projIds.includes(e.projectId || ''));
    const expenseCost = clientExpenses.reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);

    const clientAds = adCampaigns.filter((a: AdCampaignExpense) => projIds.includes(a.projectId || ''));
    const adsCost = clientAds.reduce((acc: number, a: AdCampaignExpense) => acc + (a.amount || 0), 0);

    const totalSpent = salaryCost + expenseCost + adsCost;
    const remaining = totalBudget - totalSpent;

    return {
      tasks: { total: clientTasks.length, active: activeTasks, blocked: blockedTasks, done: doneTasks, list: clientTasks },
      projects: { count: clientProjects.length, list: clientProjects },
      docs: { list: clientDocs },
      finances: { totalBudget, totalSpent, remaining, percent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0 }
    };
  }, [selectedClient, tasks, projects, salaries, expenses, adCampaigns, fileLinks]);

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
                 className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/20 active-scale flex items-center justify-center transition-all hover:scale-105"
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
        </div>
      </div>

      {/* MODAL DÉTAIL CLIENT ÉTENDU */}
      <Modal isOpen={viewMode === 'view' && !!selectedClient} onClose={closeModals} title={selectedClient?.name} subtitle={selectedClient?.company || 'Profil Partenaire'}>
        <div className="space-y-10">
           
           {/* GRILLE DE STATS MISSIONS */}
           <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Missions Actives</p>
                 <p className="text-3xl font-black text-sky-400 leading-none">{clientDetailedStats?.tasks.active}</p>
              </div>
              <div className="p-6 bg-rose-500/10 rounded-3xl border border-rose-500/20 text-center animate-pulse-subtle">
                 <p className="text-[9px] font-black text-rose-500 uppercase mb-2">Blocages</p>
                 <p className="text-3xl font-black text-rose-500 leading-none">{clientDetailedStats?.tasks.blocked}</p>
              </div>
              <div className="p-6 bg-emerald-400/10 rounded-3xl border border-emerald-400/20 text-center">
                 <p className="text-[9px] font-black text-emerald-400 uppercase mb-2">Accomplies</p>
                 <p className="text-3xl font-black text-emerald-400 leading-none">{clientDetailedStats?.tasks.done}</p>
              </div>
           </div>

           {/* SECTION PROJETS & DOSSIERS LIES */}
           <div className="space-y-6 text-left">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center"><Layers size={16} className="mr-3 text-emerald-400"/> Dossiers & Projets</h4>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">{clientDetailedStats?.projects.count} Projets Actifs</span>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
                 {clientDetailedStats?.projects.list.map((proj: Project) => (
                   <div key={proj.id} className="p-5 bg-white/5 rounded-[1.8rem] border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${proj.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-700/20 text-slate-500'}`}>
                           <Briefcase size={18}/>
                         </div>
                         <div>
                            <p className="text-[14px] font-bold text-slate-100 uppercase leading-none">{proj.name}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase mt-1.5 tracking-widest">ID: {proj.id.substring(0,8)}</p>
                         </div>
                      </div>
                      <button onClick={() => navigate('/projects')} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-white transition-all"><ArrowUpRight size={16}/></button>
                   </div>
                 ))}
                 {clientDetailedStats?.projects.list.length === 0 && (
                   <div className="p-8 text-center glass rounded-3xl opacity-30 border-dashed border-2 border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucun projet indexé</p>
                   </div>
                 )}
              </div>
           </div>

           {/* SECTION DOCUMENTS & ACTIFS */}
           <div className="space-y-6 text-left">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center"><FileText size={16} className="mr-3 text-sky-400"/> Documents & Actifs</h4>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">{clientDetailedStats?.docs.list.length} Fichiers</span>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
                 {clientDetailedStats?.docs.list.map((file: FileLink) => (
                   <div key={file.id} className="p-5 bg-white/5 rounded-[1.8rem] border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                           <FileText size={18}/>
                         </div>
                         <div>
                            <p className="text-[14px] font-bold text-slate-100 uppercase leading-none truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase mt-1.5 tracking-widest">{file.createdAt}</p>
                         </div>
                      </div>
                      <button onClick={() => window.open(file.url, '_blank')} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-white transition-all"><ExternalLink size={16}/></button>
                   </div>
                 ))}
                 {clientDetailedStats?.docs.list.length === 0 && (
                   <div className="p-8 text-center glass rounded-3xl opacity-30 border-dashed border-2 border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucun document lié</p>
                   </div>
                 )}
              </div>
           </div>

           {/* SANTÉ FINANCIÈRE CRM */}
           {canViewFinances && (
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-8 text-left">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center"><Wallet size={16} className="mr-3 text-amber-400"/> Santé Financière Globale</h4>
                    <span className="text-[11px] font-black text-amber-400">{clientDetailedStats?.finances.totalBudget.toLocaleString()} DZD</span>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Utilisation du Budget</p>
                       <p className="text-[11px] font-black text-white">{Math.round(clientDetailedStats?.finances.percent || 0)}%</p>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                       <div className={`h-full rounded-full transition-all duration-1000 ${clientDetailedStats?.finances.remaining < 0 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_15px_#10b981]'}`} style={{ width: `${Math.min(clientDetailedStats?.finances.percent || 0, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between">
                       <div className="text-left">
                          <p className="text-[8px] font-black text-slate-600 uppercase">Dépensé Cumulé</p>
                          <p className="text-sm font-black text-white">{clientDetailedStats?.finances.totalSpent.toLocaleString()} DZD</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-slate-600 uppercase">Restant / Marge</p>
                          <p className={`text-sm font-black ${clientDetailedStats?.finances.remaining < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>{clientDetailedStats?.finances.remaining.toLocaleString()} DZD</p>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* BRIEF & COORDONNÉES */}
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

           <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              {canManage && (
                <button 
                  onClick={() => handleOpenEdit(selectedClient!)}
                  className="w-full py-6 bg-emerald-400 text-slate-950 font-black rounded-[2rem] shadow-xl active-scale uppercase text-[11px] tracking-widest hover:bg-emerald-300 flex items-center justify-center space-x-3"
                >
                  <Edit2 size={18} />
                  <span>Modifier Dossier</span>
                </button>
              )}
              <div className="flex gap-4 w-full sm:w-auto">
                 <button onClick={() => navigate('/tasks')} className="flex-1 sm:w-20 py-6 glass rounded-[2rem] flex items-center justify-center text-sky-400 hover:bg-sky-400/10 active-scale border border-white/5"><Zap size={24}/></button>
                 {canManage && <button onClick={() => { if(confirm('Archiver définitivement ?')) { onDeleteClient(selectedClient!.id); closeModals(); } }} className="flex-1 sm:w-20 py-6 glass rounded-[2rem] flex items-center justify-center text-rose-500 hover:bg-rose-500/10 active-scale border border-white/5"><Trash2 size={24}/></button>}
              </div>
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
