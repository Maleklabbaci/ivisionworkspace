
import React, { useState } from 'react';
import { User, UserRole, Task, ActivityLog } from '../types';
import { X, UserPlus, ChevronRight, Check, Trash2, Lock, Mail, User as UserIcon } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onlineUserIds: Set<string>;
  onAddUser: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  onRemoveUser: (userId: string) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onApproveUser: (userId: string) => void;
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

const Team: React.FC<TeamProps> = ({ currentUser, users, onlineUserIds, onAddUser, onRemoveUser, onUpdateMember }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.MEMBER });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
              name: editingUser.name,
              avatar: editingUser.avatar
          });
          setEditingUser(null);
      }
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 transition-all outline-none";

  return (
    <div className="space-y-6 pb-24 page-transition px-1">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Équipe</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Gestion des accès iVISION</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map(user => (
              <div 
                key={user.id} 
                onClick={() => isAdmin && setEditingUser(user)} 
                className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active-scale transition-all flex items-center justify-between group hover:shadow-lg ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
              >
                  <div className="flex items-center space-x-5">
                      <div className="relative">
                        <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" alt="" />
                      </div>
                      <div>
                          <h3 className="font-black text-slate-900 leading-none mb-1 text-sm uppercase">{user.name}</h3>
                          <p className="text-[9px] font-black uppercase text-primary tracking-widest">{user.role}</p>
                      </div>
                  </div>
                  {isAdmin && <ChevronRight size={18} className="text-slate-200 group-hover:text-primary transition-colors" />}
              </div>
          ))}
      </div>

      {isAdmin && (
        <button onClick={() => { setErrors({}); setShowAddModal(true); }} className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-2xl flex items-center justify-center z-30 border-4 border-white active-scale">
          <UserPlus size={28} strokeWidth={3} />
        </button>
      )}

      {showAddModal && (
          <div className="fixed inset-0 bg-white z-[120] animate-in slide-in-from-bottom duration-400 flex flex-col">
              <header className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
                  <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
                  <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm">Nouveau Collaborateur</h3>
                  <button onClick={handleAddSubmit} disabled={isSubmitting} className="text-primary font-black text-xs tracking-widest bg-primary/5 px-5 py-3 rounded-2xl active-scale disabled:opacity-50">
                    {isSubmitting ? "CRÉATION..." : "VALIDER"}
                  </button>
              </header>
              <form onSubmit={handleAddSubmit} className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-32">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-2">Nom Complet</label>
                          <input type="text" className={`${inputClasses} ${errors.name ? 'border-urgent' : ''}`} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: Jean Martin" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-2">Email iVISION</label>
                          <input type="email" className={`${inputClasses} ${errors.email ? 'border-urgent' : ''}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="jean@ivision.com" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-2">Mot de passe temporaire</label>
                          <input type="password" className={`${inputClasses} ${errors.password ? 'border-urgent' : ''}`} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest px-2">Rôle</label>
                          <select className={inputClasses} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                              <option value={UserRole.MEMBER}>Membre</option>
                              <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                              <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                              <option value={UserRole.ANALYST}>Analyste Marketing</option>
                              <option value={UserRole.ADMIN}>Administrateur</option>
                          </select>
                      </div>
                  </div>
              </form>
          </div>
      )}

      {editingUser && isAdmin && (
          <div className="fixed inset-0 bg-white z-[120] animate-in slide-in-from-bottom duration-400 flex flex-col">
              <header className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                  <button onClick={() => setEditingUser(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
                  <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm">Gestion du Compte</h3>
                  <button onClick={handleSaveEdit} className="text-primary font-black text-xs tracking-widest bg-primary/5 px-5 py-3 rounded-2xl active-scale">ENREGISTRER</button>
              </header>
              <div className="p-8 space-y-10 flex-1 overflow-y-auto no-scrollbar pb-32">
                  <div className="flex items-center space-x-6 bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100">
                      <img src={editingUser.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-md" alt="" />
                      <div>
                          <input 
                            className="bg-transparent font-black text-slate-900 text-xl tracking-tight outline-none focus:bg-white px-1" 
                            value={editingUser.name} 
                            onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                          />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 px-1">{editingUser.email}</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Rôle de Direction</label>
                      <select className={inputClasses} value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                          <option value={UserRole.MEMBER}>Membre</option>
                          <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                          <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                          <option value={UserRole.ANALYST}>Analyste Marketing</option>
                          <option value={UserRole.ADMIN}>Administrateur</option>
                      </select>
                  </div>

                  <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 opacity-60">Privilèges iVISION</label>
                      <div className="grid grid-cols-1 gap-3">
                          {PERMISSIONS_LIST.map(perm => {
                              const isEnabled = (editingUser.permissions as any)?.[perm.key] || false;
                              return (
                                  <button key={perm.key} onClick={() => {
                                      const newPerms = { ...(editingUser.permissions || {}), [perm.key]: !isEnabled };
                                      setEditingUser({...editingUser, permissions: newPerms});
                                  }} className={`flex items-center justify-between p-6 rounded-[2rem] transition-all border-4 ${isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-white'}`}>
                                      <span className={`font-black text-[11px] uppercase tracking-tight ${isEnabled ? 'text-primary' : 'text-slate-500'}`}>{perm.label}</span>
                                      <div className={`w-14 h-8 rounded-full p-1 transition-colors ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                                          <div className={`w-6 h-6 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  {editingUser.id !== currentUser.id && (
                      <button onClick={() => { if(confirm("Supprimer l'accès ?")) { onRemoveUser(editingUser.id); setEditingUser(null); } }} className="w-full p-6 text-urgent font-black bg-red-50 rounded-[2.5rem] flex items-center justify-center space-x-3 active-scale border-4 border-white shadow-xl shadow-red-500/5">
                          <Trash2 size={24} />
                          <span className="uppercase text-[11px] tracking-widest">Révoquer le compte</span>
                      </button>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
