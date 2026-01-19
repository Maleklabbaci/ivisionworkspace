
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { Plus, X, Edit2, Trash2, Loader2, ShieldCheck, CheckSquare, Square, User as UserIcon, Mail } from 'lucide-react';
import Modal from './Modal';

const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreateTasks: true,
  canManageChat: true,
  canViewFiles: true,
  canViewReports: false,
  canManageClients: false,
  canManageLeads: false,
  canManageCampaigns: false,
};

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canCreateTasks: "Créer des missions",
  canEditAllTasks: "Éditer toutes les missions",
  canDeleteTasks: "Supprimer des missions",
  canManageChat: "Gérer le chat",
  canViewFiles: "Voir les documents",
  canDeleteFiles: "Supprimer les documents",
  canManageTeam: "Gérer l'équipe",
  canManageChannels: "Gérer les canaux",
  canViewReports: "Voir les rapports",
  canExportReports: "Exporter les rapports",
  canManageClients: "Gérer le CRM",
  canManageLeads: "Gérer les leads",
  canManageCampaigns: "Gérer les campagnes",
  canManageFinances: "Gérer les finances",
};

const PermissionToggle: React.FC<{
  label: string;
  isActive: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, isActive, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!isActive)}
    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
      isActive 
        ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.05)]' 
        : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
    }`}
  >
    <span className="text-[10px] font-black uppercase text-left truncate">{label}</span>
    {isActive ? <CheckSquare size={18} className="flex-shrink-0 ml-2" /> : <Square size={18} className="flex-shrink-0 ml-2" />}
  </button>
);

const Team: React.FC<any> = ({ currentUser, users, onAddUser, onRemoveUser, onUpdateMember }) => {
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<any>({ 
    name: '', 
    email: '', 
    role: UserRole.MEMBER, 
    permissions: { ...DEFAULT_PERMISSIONS } 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    if (showModal === 'edit' && editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        permissions: editingUser.permissions || { ...DEFAULT_PERMISSIONS }
      });
    } else if (showModal === 'add') {
      setFormData({
        name: '',
        email: '',
        role: UserRole.MEMBER,
        permissions: { ...DEFAULT_PERMISSIONS }
      });
    }
  }, [showModal, editingUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (showModal === 'add') await onAddUser(formData);
      else if (showModal === 'edit' && editingUser) await onUpdateMember(editingUser.id, formData);
      setShowModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end px-2">
        <div>
          <p className="text-[10px] font-black uppercase text-emerald-400 mb-2">Team Core System</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Équipe</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal('add')} className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/10 active-scale flex items-center justify-center">
            <Plus size={32} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user: User) => (
          <div key={user.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
            <div className="flex items-center space-x-5 min-w-0">
              <img src={user.avatar} className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10" alt="" />
              <div className="truncate">
                <h3 className="font-black text-white text-base uppercase truncate leading-tight">{user.name}</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-2">{user.role}</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => { setEditingUser(user); setShowModal('edit'); }} className="p-3 glass rounded-xl text-slate-500 hover:text-white transition-colors active-scale"><Edit2 size={16}/></button>
            )}
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!showModal} 
        onClose={() => setShowModal(null)}
        title={showModal === 'add' ? 'Ajout Équipier' : 'Accès Profil'}
        subtitle="Privilèges Opérationnels iVISION"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label-iv"><UserIcon size={14} className="text-emerald-400"/> Nom complet</label>
              <input required className="input-iv" placeholder="Marc L." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="label-iv"><Mail size={14} className="text-emerald-400"/> Email Pro</label>
              <input required type="email" className="input-iv" placeholder="marc@ivision.pro" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="label-iv">Rôle opérationnel</label>
            <select className="input-iv appearance-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
              {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          <div className="pt-2">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h4 className="text-[10px] font-black text-white uppercase">Permissions iV</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => (
                <PermissionToggle 
                  key={key}
                  label={PERMISSION_LABELS[key]}
                  isActive={!!formData.permissions[key]}
                  onChange={(val) => setFormData({...formData, permissions: {...formData.permissions, [key]: val}})}
                />
              ))}
            </div>
          </div>

          <button disabled={isSubmitting} className="w-full py-6 bg-emerald-400 text-slate-950 font-black rounded-[2rem] shadow-2xl shadow-emerald-400/20 active-scale disabled:opacity-50 uppercase text-[11px] tracking-tight hover:bg-emerald-300 transition-all mt-4">
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={24}/> : "Activer l'Accès"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Team;
