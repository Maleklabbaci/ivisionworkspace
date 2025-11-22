
import React, { useState, useEffect } from 'react';
import { User, UserRole, ActivityLog, Task, TaskStatus, UserPermissions } from '../types';
import { MoreHorizontal, Mail, Shield, Trash2, UserPlus, History, Briefcase, Bell, Lock, X, CheckCircle, AlertCircle, Edit2, Save, CheckSquare, MessageSquare, FolderOpen, DollarSign, Users, Hash, BarChart3 } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onApproveUser: (userId: string) => void;
  onUpdateMember: (userId: string, updatedData: Partial<User>) => void;
}

const Team: React.FC<TeamProps> = ({ currentUser, users, tasks, activities, onAddUser, onRemoveUser, onUpdateRole, onApproveUser, onUpdateMember }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  // New User State (Simplified for Direct Add)
  const [newUser, setNewUser] = useState({ 
      name: '', 
      email: '', 
      role: UserRole.MEMBER, 
      phoneNumber: '' 
  });
  
  // Edit User State
  const [editUser, setEditUser] = useState<Partial<User>>({});
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({});

  // Access Control: Admin OR 'canManageTeam'
  const canManageTeam = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canManageTeam;

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.email) return;

      const userToAdd: User = {
          id: `temp-${Date.now()}`, // ID temporaire, sera remplacé par l'ID Supabase réel lors de l'insertion
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=random`,
          notificationPref: 'all',
          status: 'active',
          phoneNumber: newUser.phoneNumber
      };

      onAddUser(userToAdd);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: UserRole.MEMBER, phoneNumber: '' });
  };

  const openEditModal = (user: User) => {
      // Security Check: Don't allow non-admin to edit admin
      if (user.role === UserRole.ADMIN && currentUser.role !== UserRole.ADMIN) {
          alert("Vous ne pouvez pas modifier un Administrateur.");
          return;
      }

      setSelectedMember(user);
      setEditUser({ name: user.name, email: user.email, role: user.role, status: user.status });
      // Initialize permissions from user object or default to false
      setEditPermissions({
          canCreateTasks: user.permissions?.canCreateTasks || false,
          canDeleteTasks: user.permissions?.canDeleteTasks || false,
          canManageChat: user.permissions?.canManageChat || false,
          canViewFiles: user.permissions?.canViewFiles || false,
          canViewFinancials: user.permissions?.canViewFinancials || false,
          canManageTeam: user.permissions?.canManageTeam || false,
          canManageChannels: user.permissions?.canManageChannels || false,
          canViewReports: user.permissions?.canViewReports || false
      });
      setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedMember && onUpdateMember) {
          // Explicitly combine the base user data with the permissions object
          onUpdateMember(selectedMember.id, {
              ...editUser,
              permissions: editPermissions
          });
          setShowEditModal(false);
          setSelectedMember(null);
      }
  };

  const getRoleBadgeColor = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN: return 'bg-red-100 text-red-700 border-red-200';
          case UserRole.PROJECT_MANAGER: return 'bg-purple-100 text-purple-700 border-purple-200';
          case UserRole.ANALYST: return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  const togglePermission = (key: keyof UserPermissions) => {
      setEditPermissions(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
  };

  // Stats calculations
  const activeMembers = users.filter(u => u.status === 'active').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Équipe & Rôles</h2>
          <p className="text-slate-500 text-sm">Gérez les membres, les accès et suivez l'activité.</p>
        </div>
        {canManageTeam && (
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-primary/20 font-medium"
            >
                <UserPlus size={18} />
                <span>Ajouter un membre</span>
            </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-primary rounded-lg">
                  <Briefcase size={24} />
              </div>
              <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Membres Actifs</p>
                  <p className="text-2xl font-bold text-slate-900">{activeMembers}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-success rounded-lg">
                  <CheckCircle size={24} />
              </div>
              <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Tâches Terminées</p>
                  <p className="text-2xl font-bold text-slate-900">{completedTasks}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-lg">
                  <History size={24} />
              </div>
              <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Tâches en cours</p>
                  <p className="text-2xl font-bold text-slate-900">{totalTasks - completedTasks}</p>
              </div>
          </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Membres ({users.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
              {users.map(user => {
                  const userTasks = tasks.filter(t => t.assigneeId === user.id);
                  const userCompleted = userTasks.filter(t => t.status === TaskStatus.DONE).length;
                  const productivity = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;

                  return (
                      <div key={user.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center space-x-4 mb-4 md:mb-0">
                              <div className="relative">
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.status === 'active' ? 'bg-success' : 'bg-red-500'}`}></div>
                              </div>
                              <div>
                                  <div className="flex items-center space-x-2">
                                      <h4 className="font-bold text-slate-900">{user.name}</h4>
                                      {user.id === currentUser.id && <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Vous</span>}
                                      {user.status !== 'active' && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">{user.status}</span>}
                                  </div>
                                  <div className="flex items-center text-sm text-slate-500 space-x-3">
                                      <span className="flex items-center"><Mail size={12} className="mr-1" /> {user.email}</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeColor(user.role)}`}>
                                          {user.role}
                                      </span>
                                      <div className="flex space-x-1">
                                        {/* Icons for Special Permissions */}
                                        {user.permissions?.canCreateTasks && <PermissionBadge icon={CheckSquare} color="blue" title="Créer Tâches" />}
                                        {user.permissions?.canViewFiles && <PermissionBadge icon={FolderOpen} color="purple" title="Fichiers" />}
                                        {user.permissions?.canViewFinancials && <PermissionBadge icon={DollarSign} color="green" title="Finances" />}
                                        {user.permissions?.canManageTeam && <PermissionBadge icon={Users} color="orange" title="Gestion Équipe" />}
                                        {user.permissions?.canViewReports && <PermissionBadge icon={BarChart3} color="indigo" title="Rapports" />}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center justify-between w-full md:w-auto md:space-x-8">
                              {/* Performance Mini-Graph */}
                              <div className="flex flex-col items-end mr-4">
                                  <span className="text-xs text-slate-400 uppercase font-semibold mb-1">Efficacité</span>
                                  <div className="flex items-center space-x-2">
                                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-primary rounded-full" style={{ width: `${productivity}%` }}></div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-700">{productivity}%</span>
                                  </div>
                              </div>

                              {/* Actions */}
                              {canManageTeam && user.id !== currentUser.id && user.role !== UserRole.ADMIN && (
                                  <div className="flex items-center space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                          onClick={() => openEditModal(user)}
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Modifier les accès"
                                      >
                                          <Edit2 size={16} />
                                      </button>
                                      <button 
                                          onClick={() => {
                                            if(window.confirm('Voulez-vous vraiment retirer ce membre ?')) {
                                                onRemoveUser(user.id);
                                            }
                                          }}
                                          className="p-2 text-slate-400 hover:text-urgent hover:bg-red-50 rounded-lg transition-colors"
                                          title="Retirer de l'équipe"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              )}
                              
                              {/* Admin Self-Edit Override or View Mode if Admin editing another Admin */}
                              {canManageTeam && user.role === UserRole.ADMIN && user.id !== currentUser.id && (
                                  <span className="text-xs text-slate-400 italic">Admin (Protégé)</span>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Add Member Modal */}
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
                          <input 
                            type="text" 
                            required
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Ex: Sarah Connor"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
                          <input 
                            type="email" 
                            required
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Ex: sarah@ivision.com"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                          <select 
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                          >
                              <option value={UserRole.MEMBER}>Membre</option>
                              <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                              <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                              <option value={UserRole.ANALYST}>Analyste</option>
                              {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                          </select>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg flex items-start space-x-2">
                          <Info className="text-primary flex-shrink-0 mt-0.5" size={16} />
                          <p className="text-xs text-blue-700">
                              Ce membre sera ajouté à la liste immédiatement avec un statut "Actif". Il devra s'inscrire avec cet email pour récupérer automatiquement ce profil et ses accès.
                          </p>
                      </div>

                      <div className="pt-2 flex space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Annuler
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-primary/20 transition-all"
                          >
                              Ajouter
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-slate-900">Modifier {selectedMember.name}</h3>
                      <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                  <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                            <input 
                                type="text" 
                                value={editUser.name || ''}
                                onChange={e => setEditUser({...editUser, name: e.target.value})}
                                className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                value={editUser.email || ''}
                                onChange={e => setEditUser({...editUser, email: e.target.value})}
                                className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rôle Principal</label>
                            <select 
                                value={editUser.role || UserRole.MEMBER}
                                onChange={e => setEditUser({...editUser, role: e.target.value as UserRole})}
                                className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                <option value={UserRole.MEMBER}>Membre</option>
                                <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                                <option value={UserRole.COMMUNITY_MANAGER}>Comm. Manager</option>
                                <option value={UserRole.ANALYST}>Analyste</option>
                                {currentUser.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Statut du Compte</label>
                            <select 
                                value={editUser.status || 'active'}
                                onChange={e => setEditUser({...editUser, status: e.target.value as any})}
                                className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none transition-all font-medium ${editUser.status === 'active' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
                            >
                                <option value="active">Actif</option>
                                <option value="pending">En attente</option>
                                <option value="suspended">Suspendu</option>
                            </select>
                        </div>
                      </div>

                      {/* Extended Permissions Grid */}
                      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center tracking-wide">
                              <Shield size={12} className="mr-2 text-primary"/> Permissions Spéciales
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                              {/* --- Section Tâches --- */}
                              <div className="col-span-full mb-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gestion des Tâches</span>
                              </div>

                              <PermissionToggle 
                                label="Créer des tâches" 
                                desc="Autoriser la création." 
                                active={editPermissions.canCreateTasks} 
                                onToggle={() => togglePermission('canCreateTasks')} 
                                icon={CheckSquare}
                              />
                              <PermissionToggle 
                                label="Supprimer des tâches" 
                                desc="Suppression définitive." 
                                active={editPermissions.canDeleteTasks} 
                                onToggle={() => togglePermission('canDeleteTasks')} 
                                icon={Trash2}
                              />

                               {/* --- Section Données --- */}
                               <div className="col-span-full mb-1 mt-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Accès Données & Finance</span>
                              </div>

                              <PermissionToggle 
                                label="Vue Fichiers" 
                                desc="Accès à l'onglet Fichiers." 
                                active={editPermissions.canViewFiles} 
                                onToggle={() => togglePermission('canViewFiles')} 
                                icon={FolderOpen}
                              />
                              <PermissionToggle 
                                label="Vue Financière" 
                                desc="Voir CA et budgets." 
                                active={editPermissions.canViewFinancials} 
                                onToggle={() => togglePermission('canViewFinancials')} 
                                icon={DollarSign}
                              />
                              <PermissionToggle 
                                label="Vue Rapports" 
                                desc="Accès à l'onglet Rapports." 
                                active={editPermissions.canViewReports} 
                                onToggle={() => togglePermission('canViewReports')} 
                                icon={BarChart3}
                              />

                              {/* --- Section Management --- */}
                              <div className="col-span-full mb-1 mt-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Management Avancé</span>
                              </div>
                              
                              <PermissionToggle 
                                label="Gestion Équipe" 
                                desc="Ajouter/Modifier membres." 
                                active={editPermissions.canManageTeam} 
                                onToggle={() => togglePermission('canManageTeam')} 
                                icon={Users}
                                color="text-orange-600"
                              />

                               <PermissionToggle 
                                label="Gestion Canaux" 
                                desc="Créer/Supprimer channels." 
                                active={editPermissions.canManageChannels} 
                                onToggle={() => togglePermission('canManageChannels')} 
                                icon={Hash}
                                color="text-purple-600"
                              />

                              <PermissionToggle 
                                label="Gestion Chat" 
                                desc="Modération des messages." 
                                active={editPermissions.canManageChat} 
                                onToggle={() => togglePermission('canManageChat')} 
                                icon={MessageSquare}
                                color="text-red-600"
                              />
                          </div>
                      </div>

                      <div className="pt-4 flex space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Annuler
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-primary/20 transition-all flex items-center justify-center"
                          >
                              <Save size={16} className="mr-2" />
                              Enregistrer
                          </button>
                      </div>
                  </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// UI Components for cleanliness

const PermissionToggle = ({ label, desc, active, onToggle, icon: Icon, color }: any) => (
    <div 
        onClick={onToggle}
        className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${active ? 'bg-white border-primary shadow-sm' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'}`}
    >
        <div className={`mt-0.5 p-1.5 rounded-md ${active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
            <Icon size={14} />
        </div>
        <div>
            <p className={`text-sm font-semibold ${active ? (color || 'text-primary') : 'text-slate-600'}`}>{label}</p>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{desc}</p>
        </div>
    </div>
);

const PermissionBadge = ({ icon: Icon, color, title }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[9px] border flex items-center ${colorClasses[color] || colorClasses.blue}`} title={title}>
            <Icon size={10} />
        </span>
    );
};

// Helper for Icon in empty modal
function Info({ className, size }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    );
}

export default Team;
