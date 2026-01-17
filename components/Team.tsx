
import React, { useState } from 'react';
import { User, UserRole, Task, ActivityLog } from '../types';
import { X, UserPlus, ChevronRight, Check, Trash2, Lock, Mail, User as UserIcon, Shield } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onlineUserIds: Set<string>;
  onAddUser: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  onRemoveUser: (userId: string) => void;
  onUpdateMember: (userId: string, data: Partial<User>) => void;
}

const PERMISSIONS_LIST = [
  { key: 'canCreateTasks', label: 'Ajouter Tâches' },
  { key: 'canManageTeam', label: 'Gérer Équipe' },
  { key: 'canManageLeads', label: 'Gérer les Leads' },
  { key: 'canManageClients', label: 'Gérer Clients (CRM)' },
  { key: 'canViewReports', label: 'Rapports IA' },
  { key: 'canManageChannels', label: 'Gérer Salons' },
  { key: 'canViewFiles', label: 'Gérer Documents' },
];

const Team: React.FC<TeamProps> = ({ currentUser, users, onlineUserIds, onAddUser, onRemoveUser, onUpdateMember, activities }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.MEMBER });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newUser.name?.trim()) e.name = "Nom obligatoire";
    if (!newUser.email?.includes('@')) e.email = "Email invalide";
    if (newUser.password.length < 6) e.password = "Minimum 6 caractères";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onAddUser({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role
      });
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.MEMBER });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = () => {
      if (editingUser) {
          onUpdateMember(editingUser.id, {
              role: editingUser.role,
              permissions: editingUser.permissions,
              name: editingUser.name
          });
          setEditingUser(null);
      }
  };

  const inputClasses = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 transition-all outline-none text-sm";

  return (
    <div className="space-y-8 pb-24 page-transition px-1">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Collaborateurs</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Gestion des accès iVISION</p>
        </div>
        {isAdmin && (
            <button onClick={() => { setErrors({}); setShowAddModal(true); }} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 active-scale flex items-center space-x-2">
                <UserPlus size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Nouveau membre</span>
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map(user => (
              <div 
                key={user.id} 
                onClick={() => isAdmin && setEditingUser({ ...user })} 
                className={`bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm transition-all flex items-center justify-between group hover:shadow-lg ${isAdmin ? 'cursor-pointer active-scale' : ''}`}
              >
                  <div className="flex items-center space-x-5">
                      <div className="relative">
                        <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" alt="" />
                        {onlineUserIds.has(user.id) && <span className="absolute -top-1 -right-1 w-4 h-4 bg-success border-4 border-white rounded-full"></span>}
                      </div>
                      <div>
                          <h3 className="font-black text-slate-900 leading-none mb-1 text-sm">{user.name}</h3>
                          <p className="text-[9px] font-black uppercase text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg inline-block">{user.role}</p>
                      </div>
                  </div>
                  {isAdmin && <ChevronRight size={18} className="text-slate-200 group-hover:text-primary transition-colors" />}
              </div>
          ))}
      </div>

      {/* ACTIVITÉS RÉCENTES DE L'ÉQUIPE */}
      <div className="pt-8">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 px-1">Flux d'activité Équipe</h3>
          <div className="space-y-3">
              {activities.length === 0 ? (
                  <p className="text-[10px] font-bold text-slate-300 uppercase italic px-1">Aucune activité récente.</p>
              ) : (
                  activities.slice(0, 10).map((log) => (
                      <div key={log.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                              <img src={log.userAvatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                              <p className="text-[11px] font-bold text-slate-700">
                                  <span className="text-primary font-black uppercase mr-1">{log.userName}</span>
                                  <span className="opacity-60">{log.action}</span>
                                  <span className="ml-1 text-slate-900 uppercase text-[9px] font-black">{log.target}</span>
                              </p>
                          </div>
                          <span className="text-[9px] font-black text-slate-300">{log.timestamp}</span>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* MODAL AJOUT */}
      {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
              <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden modal-drawer flex flex-col max-h-[90vh]">
                  <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                      <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Nouvel Accès iVISION</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 active-scale"><X size={20}/></button>
                  </header>
                  <form onSubmit={handleAddSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar pb-10">
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center"><UserIcon size={12} className="mr-1.5"/> Nom complet</label>
                              <input type="text" className={`${inputClasses} ${errors.name ? 'border-red-200' : ''}`} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: Marc Durand" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center"><Mail size={12} className="mr-1.5"/> Email</label>
                              <input type="email" className={`${inputClasses} ${errors.email ? 'border-red-200' : ''}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="marc@ivision.com" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center"><Lock size={12} className="mr-1.5"/> Mot de passe temporaire</label>
                              <input type="password" className={`${inputClasses} ${errors.password ? 'border-red-200' : ''}`} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Rôle fonctionnel</label>
                              <select className={inputClasses} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                  <option value={UserRole.MEMBER}>Membre</option>
                                  <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                                  <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                                  <option value={UserRole.ANALYST}>Analyste</option>
                                  <option value={UserRole.ADMIN}>Administrateur</option>
                              </select>
                          </div>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active-scale disabled:opacity-50 mt-4 border-4 border-white">
                        {isSubmitting ? "ACTIVATION..." : "ACTIVER LE COMPTE"}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL ÉDITION */}
      {editingUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
              <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden modal-drawer flex flex-col max-h-[90vh]">
                  <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div className="flex items-center space-x-4">
                          <img src={editingUser.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                          <div>
                              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">{editingUser.name}</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingUser.email}</p>
                          </div>
                      </div>
                      <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 active-scale"><X size={20}/></button>
                  </header>
                  
                  <div className="p-8 space-y-8 overflow-y-auto no-scrollbar pb-10">
                      <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Nom affiché</label>
                            <input type="text" className={inputClasses} value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest">Rôle & Rang</label>
                            <select className={inputClasses} value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                                <option value={UserRole.MEMBER}>Membre</option>
                                <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                                <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                                <option value={UserRole.ANALYST}>Analyste</option>
                                <option value={UserRole.ADMIN}>Administrateur</option>
                            </select>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center"><Shield size={12} className="mr-1.5"/> Permissions spécifiques</label>
                          <div className="grid grid-cols-1 gap-2">
                              {PERMISSIONS_LIST.map(perm => {
                                  const isEnabled = (editingUser.permissions as any)?.[perm.key] || false;
                                  return (
                                      <button 
                                        key={perm.key} 
                                        onClick={() => {
                                          const newPerms = { ...(editingUser.permissions || {}), [perm.key]: !isEnabled };
                                          setEditingUser({...editingUser, permissions: newPerms});
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}
                                      >
                                          <span className={`text-[10px] font-black uppercase tracking-tight ${isEnabled ? 'text-primary' : 'text-slate-400'}`}>{perm.label}</span>
                                          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                          </div>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="flex flex-col space-y-3 pt-4">
                          <button onClick={handleSaveEdit} className="w-full py-5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active-scale border-4 border-white">
                              APPLIQUER LES CHANGEMENTS
                          </button>
                          {editingUser.id !== currentUser.id && (
                              <button 
                                onClick={() => { if(confirm("Supprimer définitivement cet accès ?")) { onRemoveUser(editingUser.id); setEditingUser(null); } }} 
                                className="w-full py-4 bg-red-50 text-urgent font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 border border-red-100 active-scale"
                              >
                                  <Trash2 size={16} /> <span>RÉVOQUER L'ACCÈS</span>
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
