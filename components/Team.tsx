import React, { useState } from 'react';
import { User, UserRole, Task, ActivityLog } from '../types';
import { X, UserPlus, ChevronRight, Check, Trash2 } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onlineUserIds: Set<string>;
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onApproveUser: (userId: string) => void;
  onUpdateMember: (userId: string, data: Partial<User>) => void;
}

const PERMISSIONS_LIST = [
  { key: 'canCreateTasks', label: 'Ajouter Tâches' },
  { key: 'canViewFinancials', label: 'Voir Finances' },
  { key: 'canManageTeam', label: 'Gérer Équipe' },
  { key: 'canManageClients', label: 'Gérer Clients' },
  { key: 'canViewReports', label: 'Rapports IA' },
];

const Team: React.FC<TeamProps> = ({ currentUser, users, onlineUserIds, onAddUser, onRemoveUser, onUpdateMember }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', email: '', role: UserRole.MEMBER });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newUser.name?.trim()) e.name = "Nom obligatoire";
    if (!newUser.email?.includes('@')) e.email = "Email invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAddUser({
        id: `temp-${Date.now()}`,
        name: newUser.name!,
        email: newUser.email!,
        role: newUser.role || UserRole.MEMBER,
        avatar: `https://ui-avatars.com/api/?name=${newUser.name!.replace(/\s+/g, '+')}&background=random`,
        notificationPref: 'all',
        status: 'pending',
        permissions: {}
    } as User);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: UserRole.MEMBER });
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

  const inputClasses = "w-full p-4 bg-slate-100/50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none";

  return (
    <div className="space-y-6 pb-24 page-transition px-1 safe-top">
      <div>
        <h2 className="text-2xl font-bold">Équipe</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Workspace Administration</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
          {users.map(user => (
              <div key={user.id} onClick={() => setEditingUser(user)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img src={user.avatar} className="w-12 h-12 rounded-2xl border-2 border-slate-50" alt="" />
                        {onlineUserIds.has(user.id) && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></span>}
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900 leading-none mb-1">{user.name}</h3>
                          <p className="text-[10px] font-black uppercase text-slate-400">{user.role}</p>
                      </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200" />
              </div>
          ))}
      </div>

      <button onClick={() => { setErrors({}); setShowAddModal(true); }} className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-[55] border-4 border-white active-scale transition-transform"><UserPlus size={26} /></button>

      {/* MODALE AJOUT PLEIN ÉCRAN */}
      {showAddModal && (
          <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-bottom duration-300 flex flex-col safe-top">
              <header className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-20">
                  <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400"><X size={24}/></button>
                  <h3 className="font-bold text-slate-900">Nouveau Membre</h3>
                  <button onClick={handleAddSubmit} className="bg-primary text-white px-5 py-2 rounded-full font-bold text-sm flex items-center space-x-1 active:scale-95 transition-transform">
                      <Check size={16} />
                      <span>Ajouter</span>
                  </button>
              </header>
              <form className="p-6 space-y-6 flex-1 overflow-y-auto">
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nom Complet *</label>
                          <input type="text" className={`${inputClasses} ${errors.name ? 'border-urgent bg-red-50' : ''}`} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: Jean Martin" />
                          {errors.name && <p className="text-urgent text-[10px] font-bold mt-1 px-1">{errors.name}</p>}
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Email *</label>
                          <input type="email" className={`${inputClasses} ${errors.email ? 'border-urgent bg-red-50' : ''}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="jean@ivision.com" />
                          {errors.email && <p className="text-urgent text-[10px] font-bold mt-1 px-1">{errors.email}</p>}
                      </div>
                  </div>
              </form>
          </div>
      )}

      {/* MODALE ÉDITION DROITS */}
      {editingUser && (
          <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-bottom duration-300 flex flex-col safe-top">
              <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-20">
                  <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400"><X size={24}/></button>
                  <h3 className="font-bold">Permissions</h3>
                  <button onClick={handleSaveEdit} className="bg-primary text-white px-5 py-2 rounded-full font-bold text-sm flex items-center space-x-1 active:scale-95 transition-transform">
                      <Check size={16} />
                      <span>Sauver</span>
                  </button>
              </header>
              <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-24">
                  <div className="flex items-center space-x-4 bg-slate-50 p-5 rounded-[2.5rem]">
                      <img src={editingUser.avatar} className="w-16 h-16 rounded-3xl" alt="" />
                      <div>
                          <h4 className="font-black text-slate-900 text-lg">{editingUser.name}</h4>
                          <p className="text-xs font-bold text-slate-400">{editingUser.email}</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-2">Accès Directs</label>
                      <div className="grid grid-cols-1 gap-3">
                          {PERMISSIONS_LIST.map(perm => {
                              const isEnabled = (editingUser.permissions as any)?.[perm.key] || false;
                              return (
                                  <button key={perm.key} onClick={() => {
                                      const newPerms = { ...(editingUser.permissions || {}), [perm.key]: !isEnabled };
                                      setEditingUser({...editingUser, permissions: newPerms});
                                  }} className={`flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-transparent'}`}>
                                      <span className={`font-bold ${isEnabled ? 'text-primary' : 'text-slate-500'}`}>{perm.label}</span>
                                      <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                  {editingUser.id !== currentUser.id && (
                      <button onClick={() => { if(confirm("Supprimer l'accès ?")) { onRemoveUser(editingUser.id); setEditingUser(null); } }} className="w-full p-5 text-urgent font-bold bg-red-50 rounded-[2rem] flex items-center justify-center space-x-2 active:bg-red-100 transition-colors">
                          <Trash2 size={20} />
                          <span>Révoquer l'accès</span>
                      </button>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;