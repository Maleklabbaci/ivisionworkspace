

import React, { useState } from 'react';
import { User, UserRole, ActivityLog, Task, TaskStatus, UserPermissions } from '../types';
import { MoreHorizontal, Mail, Shield, Trash2, UserPlus, History, Briefcase, CheckCircle, X, Edit2, ToggleLeft, ToggleRight, Save, AlertTriangle, Key, Lock, Eye, Folder } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onlineUserIds: Set<string>; // New Prop
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onApproveUser: (userId: string) => void;
  onUpdateMember: (userId: string, data: Partial<User>) => void;
}

interface PermissionConfig {
  key: keyof UserPermissions;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PERMISSIONS_LIST: PermissionConfig[] = [
  { key: 'canCreateTasks', label: 'Créer des tâches', description: 'Peut créer et assigner des nouvelles tâches.', icon: <Edit2 size={14} /> },
  { key: 'canDeleteTasks', label: 'Supprimer des tâches', description: 'Peut supprimer définitivement des tâches.', icon: <Trash2 size={14} /> },
  { key: 'canManageChat', label: 'Gérer le Chat', description: 'Peut supprimer des messages et créer des canaux.', icon: <AlertTriangle size={14} /> },
  { key: 'canViewFiles', label: 'Accès Fichiers', description: 'Accès complet au gestionnaire de fichiers.', icon: <Folder size={14} /> },
  { key: 'canViewFinancials', label: 'Données Financières', description: 'Peut voir les prix et budgets.', icon: <Eye size={14} /> },
  { key: 'canManageTeam', label: 'Gérer l\'équipe', description: 'Peut ajouter ou modifier des membres.', icon: <UserPlus size={14} /> },
  { key: 'canManageChannels', label: 'Gérer les Canaux', description: 'Créer/Supprimer des canaux de discussion.', icon: <Lock size={14} /> },
  { key: 'canViewReports', label: 'Voir les Rapports', description: 'Accès aux statistiques globales.', icon: <History size={14} /> },
];

// Helper pour formater le temps
const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Jamais";
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
};

const Team: React.FC<TeamProps> = ({ currentUser, users, tasks, activities, onlineUserIds, onAddUser, onRemoveUser, onUpdateRole, onApproveUser, onUpdateMember }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.MEMBER
  });
  
  // Permission Guard: Admin OR canManageTeam permission
  const canManage = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canManageTeam;

  if (!canManage) {
      return null; // Strict visibility requirement
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.role) {
      const user: User = {
        id: `temp-${Date.now()}`, // Will be replaced by App.tsx / DB
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(/\s+/g, '+')}&background=random`,
        notificationPref: 'all',
        status: 'pending',
        permissions: {} // Default empty
      };
      onAddUser(user);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: UserRole.MEMBER });
    }
  };

  const handleDeleteUser = (targetUser: User) => {
      // Protection : On ne peut pas se supprimer soi-même via cette interface
      if (targetUser.id === currentUser.id) {
        alert("Vous ne pouvez pas supprimer votre propre compte ici.");
        return;
      }

      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${targetUser.name} ? Cette action est irréversible.`)) {
          onRemoveUser(targetUser.id);
      }
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
      if (!editingUser) return;
      
      const currentPerms = editingUser.permissions || {};
      const newValue = !currentPerms[key];
      
      const updatedUser = {
          ...editingUser,
          permissions: {
              ...currentPerms,
              [key]: newValue
          }
      };
      setEditingUser(updatedUser);
  };

  const handleSaveEdit = () => {
      if (editingUser) {
          onUpdateMember(editingUser.id, {
              role: editingUser.role,
              permissions: editingUser.permissions
          });
          setEditingUser(null);
      }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion de l'équipe</h2>
          <p className="text-slate-500">Gérez les membres, les rôles et les accès.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          <span>Nouveau Membre</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Membre</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Tâches</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const activeTasks = tasks.filter(t => t.assigneeId === user.id && t.status !== TaskStatus.DONE).length;
                const isCurrentUser = user.id === currentUser.id;
                const isOnline = onlineUserIds.has(user.id);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200" />
                            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></span>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <div className="flex items-center text-xs text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                        user.role === UserRole.PROJECT_MANAGER ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === UserRole.ADMIN && <Shield size={12} className="mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.status === 'active' ? (
                        <div>
                            {isOnline ? (
                                <span className="text-success flex items-center text-xs font-bold"><CheckCircle size={14} className="mr-1"/> En ligne</span>
                            ) : (
                                <span className="text-slate-400 text-xs flex items-center">
                                    <span className="w-2 h-2 rounded-full border border-slate-300 mr-2"></span>
                                    {formatLastSeen(user.lastSeen)}
                                </span>
                            )}
                        </div>
                      ) : (
                        <button onClick={() => onApproveUser(user.id)} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold hover:bg-orange-200 transition-colors">
                          En attente (Valider)
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-medium ${activeTasks > 3 ? 'text-urgent' : 'text-slate-600'}`}>
                        {activeTasks} tâches
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-100">
                        <button 
                           onClick={() => setEditingUser(user)}
                           className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                           title="Modifier Permissions"
                        >
                            <Edit2 size={16} />
                        </button>
                        
                        {/* Admin peut supprimer tout le monde sauf lui-même (y compris d'autres admins) */}
                        {!isCurrentUser && (
                            <button 
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-slate-400 hover:text-urgent hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Ajouter un membre</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input type="text" required className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">Ajouter</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Permissions & Role */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                  <img src={editingUser.avatar} className="w-10 h-10 rounded-full border border-slate-200" />
                  <div>
                      <h3 className="text-lg font-bold text-slate-900">Modifier {editingUser.name}</h3>
                      <p className="text-xs text-slate-500">{editingUser.email}</p>
                  </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Role Selection */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                        <Shield size={16} className="mr-2 text-primary" />
                        Rôle Principal
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.values(UserRole).map(role => (
                            <button
                                key={role}
                                onClick={() => setEditingUser({ ...editingUser, role: role })}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    editingUser.role === role 
                                    ? 'bg-blue-50 border-primary text-primary shadow-sm ring-1 ring-primary' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <span className="block font-bold text-sm">{role}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Grid */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                        <Key size={16} className="mr-2 text-primary" />
                        Permissions Spéciales
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PERMISSIONS_LIST.map((perm) => {
                            const isEnabled = editingUser.permissions?.[perm.key] || false;
                            return (
                                <div key={perm.key} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <div className="flex items-start space-x-3">
                                        <div className={`mt-0.5 ${isEnabled ? 'text-primary' : 'text-slate-400'}`}>
                                            {perm.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">{perm.label}</p>
                                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.description}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handlePermissionToggle(perm.key)}
                                        className={`relative w-10 h-6 transition-colors rounded-full flex-shrink-0 focus:outline-none ${isEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                                    >
                                         <span className={`block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-end space-x-3">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Annuler</button>
                <button onClick={handleSaveEdit} className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md transition-colors flex items-center">
                    <Save size={18} className="mr-2" /> Enregistrer
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;