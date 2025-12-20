
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
  { key: 'canManageTeam', label: 'Gérer Équipe' },
  { key: 'canManageClients', label: 'Gérer Clients' },
  { key: 'canViewReports', label: 'Rapports IA' },
  { key: 'canManageChannels', label: 'Gérer Salons' },
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

  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 transition-all outline-none";

  return (
    <div className="space-y-6 pb-24 page-transition px-1">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Équipe</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestion des collaborateurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map(user => (
              <div key={user.id} onClick={() => setEditingUser(user)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm active-scale transition-all flex items-center justify-between group hover:shadow-lg cursor-pointer">
                  <div className="flex items-center space-x-5">
                      <div className="relative">
                        <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" alt="" />
                        {onlineUserIds.has(user.id) && <span className="absolute -top-1 -right-1 w-4 h-4 bg-success border-4 border-white rounded-full"></span>}
                      </div>
                      <div>
                          <h3 className="font-black text-slate-900 leading-none mb-1">{user.name}</h3>
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest">{user.role}</p>
                      </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-primary transition-colors" />
              </div>
          ))}
      </div>

      <button onClick={() => { setErrors({}); setShowAddModal(true); }} className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-2xl flex items-center justify-center z-30 border-4 border-white active-scale transition-transform"><UserPlus size={28} strokeWidth={3} /></button>

      {showAddModal && (
          <div className="fixed inset-0 bg-white z-[120] animate-in slide-in-from-bottom duration-400 flex flex-col safe-pt">
              <header className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
                  <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
                  <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm">Nouveau Membre</h3>
                  <button onClick={handleAddSubmit} className="text-primary font-black text-xs tracking-widest bg-primary/5 px-5 py-3 rounded-2xl active-scale">VALIDER</button>
              </header>
              <form className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-32">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Nom Complet</label>
                          <input type="text" className={`${inputClasses} ${errors.name ? 'border-urgent' : ''}`} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: Jean Martin" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Email professionnel</label>
                          <input type="email" className={`${inputClasses} ${errors.email ? 'border-urgent' : ''}`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="jean@ivision.com" />
                      </div>
                  </div>
              </form>
          </div>
      )}

      {editingUser && (
          <div className="fixed inset-0 bg-white z-[120] animate-in slide-in-from-bottom duration-400 flex flex-col safe-pt">
              <header className="px-6 py-5 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-20">
                  <button onClick={() => setEditingUser(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={24}/></button>
                  <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm">Permissions Collaborateur</h3>
                  <button onClick={handleSaveEdit} className="text-primary font-black text-xs tracking-widest bg-primary/5 px-5 py-3 rounded-2xl active-scale">ENREGISTRER</button>
              </header>
              <div className="p-8 space-y-10 flex-1 overflow-y-auto no-scrollbar pb-32">
                  <div className="flex items-center space-x-6 bg-slate-50 p-7 rounded-[2.5rem] border border-slate-100">
                      <img src={editingUser.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-md" alt="" />
                      <div>
                          <h4 className="font-black text-slate-900 text-xl tracking-tight">{editingUser.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingUser.email}</p>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block px-2 opacity-60">Accès et Droits</label>
                      <div className="grid grid-cols-1 gap-4">
                          {PERMISSIONS_LIST.map(perm => {
                              const isEnabled = (editingUser.permissions as any)?.[perm.key] || false;
                              return (
                                  <button key={perm.key} onClick={() => {
                                      const newPerms = { ...(editingUser.permissions || {}), [perm.key]: !isEnabled };
                                      setEditingUser({...editingUser, permissions: newPerms});
                                  }} className={`flex items-center justify-between p-6 rounded-[2rem] transition-all border-4 ${isEnabled ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 'bg-slate-50 border-white hover:border-slate-100'}`}>
                                      <span className={`font-black text-sm uppercase tracking-tight ${isEnabled ? 'text-primary' : 'text-slate-500'}`}>{perm.label}</span>
                                      <div className={`w-14 h-8 rounded-full p-1 transition-colors ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                                          <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                  {editingUser.id !== currentUser.id && (
                      <button onClick={() => { if(confirm("Supprimer l'accès ?")) { onRemoveUser(editingUser.id); setEditingUser(null); } }} className="w-full p-6 text-urgent font-black bg-red-50 rounded-[2.5rem] flex items-center justify-center space-x-3 active-scale transition-colors border-4 border-white shadow-xl shadow-red-500/5">
                          <Trash2 size={24} />
                          <span className="uppercase text-[10px] tracking-widest">Révoquer définitivement</span>
                      </button>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
