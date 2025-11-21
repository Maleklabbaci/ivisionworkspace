
import React, { useState } from 'react';
import { User, UserRole, ActivityLog, Task, TaskStatus } from '../types';
import { MoreHorizontal, Mail, Shield, Trash2, UserPlus, History, Briefcase, Bell, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onApproveUser: (userId: string) => void; // New prop for approving pending users
}

const Team: React.FC<TeamProps> = ({ currentUser, users, tasks, activities, onAddUser, onRemoveUser, onUpdateRole, onApproveUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.MEMBER, notificationPref: 'all' as 'push' | 'all' });
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Access Guard
  if (currentUser.role !== UserRole.ADMIN) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-red-50 p-6 rounded-full mb-4">
                <Lock size={48} className="text-urgent" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
            <p className="text-slate-500 max-w-md">
                Cette section contient des données sensibles et est réservée aux administrateurs.
            </p>
        </div>
    );
  }

  // Separate active and pending users
  const activeUsers = users.filter(u => u.status === 'active');
  const pendingUsers = users.filter(u => u.status === 'pending');

  // Filter activities for selected member or show all
  const displayedActivities = selectedMember 
    ? activities.filter(a => a.userId === selectedMember.id)
    : activities;
    
  // Get task stats for a user
  const getUserStats = (userId: string) => {
      const userTasks = tasks.filter(t => t.assigneeId === userId);
      return {
          total: userTasks.length,
          done: userTasks.filter(t => t.status === TaskStatus.DONE).length,
          pending: userTasks.filter(t => t.status !== TaskStatus.DONE).length
      };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newUser.name || !newUser.email || !newUser.password) return;
      
      const user: User = {
          id: Date.now().toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=random`,
          notificationPref: newUser.notificationPref,
          status: 'active' // Admin added users are active by default
      };
      
      console.log("Compte créé avec le mot de passe : ", newUser.password);

      onAddUser(user);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.MEMBER, notificationPref: 'all' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
      {/* Left: Member List */}
      <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                  <h2 className="text-xl font-bold text-slate-900">Équipe</h2>
                  <p className="text-slate-500 text-sm">Gérez les membres et leurs accès.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm shadow-primary/20 transform hover:scale-105"
              >
                  <UserPlus size={16} />
                  <span>Inviter</span>
              </button>
          </div>
          
          <div className="overflow-y-auto p-6 space-y-8">
              
              {/* PENDING REQUESTS SECTION */}
              {pendingUsers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                    <AlertCircle size={16} className="mr-2 text-orange-500" />
                    Demandes en attente ({pendingUsers.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingUsers.map(user => (
                       <div key={user.id} className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full grayscale opacity-70" />
                            <div>
                               <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                               <p className="text-xs text-slate-500">{user.email}</p>
                               <span className="text-[10px] text-orange-600 font-semibold bg-orange-100 px-1.5 py-0.5 rounded">En attente de validation</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                             <button 
                                onClick={() => onApproveUser(user.id)}
                                className="p-2 bg-success text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                title="Valider l'inscription"
                             >
                               <CheckCircle size={18} />
                             </button>
                             <button 
                                onClick={() => onRemoveUser(user.id)}
                                className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-urgent hover:border-urgent rounded-lg transition-colors"
                                title="Refuser"
                             >
                               <X size={18} />
                             </button>
                          </div>
                       </div>
                    ))}
                  </div>
                  <div className="h-px bg-slate-100 mt-6"></div>
                </div>
              )}

              {/* ACTIVE MEMBERS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeUsers.map(user => {
                    const stats = getUserStats(user.id);
                    const isSelected = selectedMember?.id === user.id;
                    
                    return (
                        <div 
                            key={user.id}
                            onClick={() => setSelectedMember(user)}
                            className={`relative border rounded-xl p-5 transition-all cursor-pointer group ${
                                isSelected ? 'border-primary bg-blue-50/30 ring-1 ring-primary/20' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white hover:-translate-y-1'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center space-x-3">
                                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border border-slate-100 shadow-sm" />
                                    <div>
                                        <h3 className="font-bold text-slate-900">{user.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                            user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                                {currentUser.id !== user.id && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRemoveUser(user.id); }}
                                            className="p-2 text-slate-400 hover:text-urgent hover:bg-red-50 rounded transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <div className="text-lg font-bold text-slate-800">{stats.total}</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tâches</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded border border-green-100">
                                    <div className="text-lg font-bold text-success">{stats.done}</div>
                                    <div className="text-[10px] text-green-600 uppercase font-semibold">Faites</div>
                                </div>
                                <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                    <div className="text-lg font-bold text-orange-600">{stats.pending}</div>
                                    <div className="text-[10px] text-orange-600 uppercase font-semibold">En cours</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center space-x-2">
                                    <Mail size={12} />
                                    <span className="truncate max-w-[100px]">{user.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Bell size={12} />
                                    <span>{user.notificationPref === 'all' ? 'Email+Push' : 'Push'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
              </div>
          </div>
      </div>

      {/* Right: Detailed View / Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-white">
              <h3 className="font-bold text-slate-900 flex items-center">
                  <History size={18} className="mr-2 text-slate-400" />
                  Activité Récente {selectedMember && `de ${selectedMember.name.split(' ')[0]}`}
              </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              {displayedActivities.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">Aucune activité récente.</div>
              ) : (
                  <div className="divide-y divide-slate-50">
                      {displayedActivities.map(log => {
                          const user = users.find(u => u.id === log.userId);
                          if (!user) return null;
                          return (
                              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex space-x-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="mt-1.5">
                                      <div className={`w-2 h-2 rounded-full ${
                                          log.action.includes('terminé') ? 'bg-success' : 
                                          log.action.includes('nouveau') ? 'bg-primary' : 'bg-slate-300'
                                      }`} />
                                  </div>
                                  <div>
                                      <p className="text-sm text-slate-800 leading-snug">
                                          <span className="font-bold text-slate-900">{user.name}</span> {log.action} <span className="font-medium text-primary">{log.target}</span>
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">{log.timestamp}</p>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Inviter un nouveau membre</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                          <input 
                            type="text" 
                            required
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-500 font-medium"
                            placeholder="Ex: Thomas Anderson"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                            type="email" 
                            required
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-500 font-medium"
                            placeholder="thomas@agence.com"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe provisoire</label>
                          <input 
                            type="password" 
                            required
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-500 font-medium"
                            placeholder="••••••••"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                          <select 
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                          >
                              <option value={UserRole.MEMBER}>Membre (Accès standard)</option>
                              <option value={UserRole.ADMIN}>Admin (Accès complet)</option>
                              <option value={UserRole.PROJECT_MANAGER}>Chef de Projet</option>
                              <option value={UserRole.COMMUNITY_MANAGER}>Community Manager</option>
                              <option value={UserRole.ANALYST}>Analyste Marketing</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Notifications</label>
                          <div className="flex space-x-4">
                              <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="notifPref" 
                                    value="push"
                                    checked={newUser.notificationPref === 'push'}
                                    onChange={() => setNewUser({...newUser, notificationPref: 'push'})}
                                    className="text-primary focus:ring-primary" 
                                  />
                                  <span>Push seulement</span>
                              </label>
                              <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="notifPref" 
                                    value="all"
                                    checked={newUser.notificationPref === 'all'}
                                    onChange={() => setNewUser({...newUser, notificationPref: 'all'})}
                                    className="text-primary focus:ring-primary" 
                                  />
                                  <span>Email + Push</span>
                              </label>
                          </div>
                      </div>
                      <div className="pt-4 flex space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Annuler
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95"
                          >
                              Envoyer l'invitation
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
