
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { Plus, X, Edit2, Trash2, Loader2, ShieldCheck, CheckSquare, Square } from 'lucide-react';

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
};

const PermissionToggle: React.FC<{
  label: string;
  isActive: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, isActive, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!isActive)}
    className={`flex items-center justify-between p-4 rounded-2xl border transition-all h-full ${
      isActive 
        ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 shadow-[inset_0_0_15px_rgba(52,211,153,0.05)]' 
        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.08]'
    }`}
  >
    <span className="text-[10px] font-black uppercase tracking-widest text-left pr-4 leading-tight">{label}</span>
    {isActive ? <CheckSquare size={18} className="flex-shrink-0" /> : <Square size={18} className="flex-shrink-0" />}
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
      if (showModal === 'add') {
        await onAddUser(formData);
      } else if (showModal === 'edit' && editingUser) {
        await onUpdateMember(editingUser.id, formData);
      }
      closeModals();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  const closeModals = () => {
    setShowModal(null);
    setEditingUser(null);
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex justify-between items-end px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">TEAM CORE SYSTEM</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">Équipe</h2>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal('add')} className="w-14 h-14 bg-emerald-400 text-white rounded-2xl shadow-xl shadow-emerald-400/20 active-scale hover:scale-105 transition-all flex items-center justify-center">
              <Plus size={28} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: User) => (
            <div key={user.id} className="glass-card p-6 rounded-[2.5rem] border-white/5 flex items-center justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/5 blur-2xl rounded-full translate-x-10 -translate-y-10"></div>
              <div className="flex items-center space-x-5 relative z-10">
                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-emerald-400 font-black text-xl border border-white/10 shadow-lg overflow-hidden">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-[15px] uppercase tracking-tight">{user.name}</h3>
                  <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] mt-1.5">{user.role}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex space-x-2 relative z-10">
                  <button onClick={() => { setEditingUser(user); setShowModal('edit'); }} className="p-3 glass rounded-xl text-slate-500 hover:text-white transition-colors"><Edit2 size={16}/></button>
                  {user.id !== currentUser.id && (
                    <button onClick={() => confirm('Révoquer cet accès ?') && onRemoveUser(user.id)} className="p-3 glass rounded-xl text-slate-500 hover:text-rose-400 transition-colors"><Trash2 size={16}/></button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL AJOUT/EDITION TEAM - FIXÉ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-2xl">
            <div className="relative glass w-full transform rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-none">
                    {showModal === 'add' ? 'Ajout Équipier' : 'Configuration Accès'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Privilèges Opérationnels iVISION</p>
                </div>
                <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Nom Complet</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-sm transition-all" placeholder="Marc L." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Email Pro</label>
                    <input required type="email" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-400 text-sm transition-all" placeholder="marc@ivision.pro" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Rôle Opérationnel</label>
                  <select className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl font-bold text-slate-300 outline-none text-sm appearance-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center space-x-3 mb-8">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Permissions Granulaires</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[35vh] overflow-y-auto no-scrollbar p-1">
                    {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => (
                      <div key={key} className="h-full">
                        <PermissionToggle 
                          label={PERMISSION_LABELS[key]}
                          isActive={!!formData.permissions[key]}
                          onChange={(val) => handlePermissionChange(key, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button disabled={isSubmitting} className="w-full py-6 bg-emerald-400 text-white font-black rounded-3xl shadow-xl active-scale disabled:opacity-50 uppercase text-[11px] tracking-[0.3em] transition-all hover:bg-emerald-500">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20}/> : showModal === 'add' ? "Activer l'Accès" : "Mettre à jour"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
