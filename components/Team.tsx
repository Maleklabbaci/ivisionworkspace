
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { Plus, X, Edit2, Trash2, Loader2, ShieldCheck, CheckSquare, Square, User as UserIcon, Mail, Key, Check, Save, Shield, Zap } from 'lucide-react';
import Modal from './Modal';

const DEFAULT_PERMISSIONS: UserPermissions = {
  canCreateTasks: true,
  canManageChat: true,
  canViewFiles: true,
  canViewReports: false,
  canManageClients: false,
  canManageLeads: false,
  canManageCampaigns: false,
  canManageProjects: false,
  canManageFinances: false,
  canViewProjectFinances: false, // Par défaut à false
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
  canManageProjects: "Gérer les projets",
  canViewProjectFinances: "Voir les finances des projets", // Nouveau label
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
    password: '',
    role: UserRole.MEMBER, 
    permissions: { ...DEFAULT_PERMISSIONS } 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    if (showModal === 'add') {
      const savedDraft = localStorage.getItem('iv_team_draft');
      if (savedDraft) {
        try {
          setFormData(JSON.parse(savedDraft));
        } catch (e) {
          console.error("Draft recovery failed", e);
        }
      }
    } else if (showModal === 'edit' && editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        password: '', 
        role: editingUser.role,
        permissions: editingUser.permissions || { ...DEFAULT_PERMISSIONS }
      });
    }
  }, [showModal, editingUser]);

  const handleInputChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    
    if (showModal === 'add') {
      setIsSyncing(true);
      localStorage.setItem('iv_team_draft', JSON.stringify(updatedData));
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (showModal === 'add') {
        await onAddUser(formData);
        localStorage.removeItem('iv_team_draft');
      } else if (showModal === 'edit' && editingUser) {
        await onUpdateMember(editingUser.id, formData);
      }
      setShowModal(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir révoquer définitivement l'accès de ${name} ?`)) {
      onRemoveUser(id);
    }
  };

  const isPasswordSecure = formData.password.length >= 6;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end px-2">
        <div className="text-left">
          <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.4em]">Team Core System</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">Équipe</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal('add')} className="w-14 h-14 bg-emerald-400 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/10 active-scale flex items-center justify-center transition-all hover:bg-emerald-300">
            <Plus size={32} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user: User) => (
          <div key={user.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group bg-white/[0.02]">
            <div className="flex items-center space-x-5 min-w-0 text-left">
              <img src={user.avatar} className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 object-cover" alt="" />
              <div className="truncate text-left">
                <h3 className="font-black text-white text-base uppercase truncate leading-tight">{user.name}</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-2">{user.role}</p>
              </div>
            </div>
            {isAdmin && user.id !== currentUser.id && (
              <div className="flex items-center space-x-2">
                <button onClick={() => { setEditingUser(user); setShowModal('edit'); }} className="p-3 glass rounded-xl text-slate-500 hover:text-white transition-colors active-scale"><Edit2 size={16}/></button>
                <button onClick={() => handleRemove(user.id, user.name)} className="p-3 glass rounded-xl text-slate-500 hover:text-rose-400 transition-colors active-scale"><Trash2 size={16}/></button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!showModal} 
        onClose={() => setShowModal(null)}
        title={showModal === 'add' ? 'Nouveau Membre' : 'Édition Profil'}
        subtitle="Moteur de Configuration iVISION"
      >
        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          <div className="flex items-center justify-between px-2 text-left">
             <div className="flex items-center space-x-2">
               <Zap size={14} className={isSyncing ? "text-emerald-400 animate-spin" : "text-emerald-400"} />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 {isSyncing ? 'Synchronisation...' : 'Brouillon prêt'}
               </span>
             </div>
             {showModal === 'add' && formData.name && (
               <button type="button" onClick={() => { localStorage.removeItem('iv_team_draft'); setFormData({ name: '', email: '', password: '', role: UserRole.MEMBER, permissions: { ...DEFAULT_PERMISSIONS } }); }} className="text-[9px] font-black text-rose-400 uppercase hover:underline">Vider</button>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="space-y-2">
              <label className="label-iv"><UserIcon size={14} className="text-emerald-400"/> Nom complet</label>
              <input required className="input-iv" placeholder="Nom d'affichage" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="label-iv"><Mail size={14} className="text-emerald-400"/> Email Pro</label>
              <input required type="email" className="input-iv" placeholder="Email professionnel" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="space-y-2">
              <label className="label-iv">Grade Opérationnel</label>
              <select className="input-iv appearance-none cursor-pointer" value={formData.role} onChange={e => handleInputChange('role', e.target.value)}>
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <label className="label-iv mb-0"><Key size={14} className="text-emerald-400"/> Code Secret</label>
                {isPasswordSecure && (
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md flex items-center">
                    <Shield size={10} className="mr-1" /> OK
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  required={showModal === 'add'} 
                  type="password" 
                  className={`input-iv pr-12 transition-all ${isPasswordSecure ? 'border-emerald-400/40 bg-emerald-400/5 shadow-[0_0_15px_rgba(52,211,153,0.05)]' : ''}`}
                  placeholder={showModal === 'add' ? "Min. 6 caractères" : "Conserver l'actuel"} 
                  value={formData.password} 
                  onChange={e => handleInputChange('password', e.target.value)} 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   {isPasswordSecure ? (
                     <Check size={20} className="text-emerald-400 animate-in zoom-in" strokeWidth={3} />
                   ) : (
                     <ShieldCheck size={20} className="text-slate-800" />
                   )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-left">
            <div className="flex items-center space-x-3 mb-6 px-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-normal">Matrice des Permissions</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => (
                <PermissionToggle 
                  key={key}
                  label={PERMISSION_LABELS[key]}
                  isActive={!!formData.permissions[key]}
                  onChange={(val) => handleInputChange('permissions', {...formData.permissions, [key]: val})}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <button disabled={isSubmitting} className="w-full py-6 bg-emerald-400 text-slate-950 font-black rounded-[2rem] shadow-2xl shadow-emerald-400/20 active-scale disabled:opacity-50 uppercase text-[11px] tracking-widest hover:bg-emerald-300 transition-all flex items-center justify-center">
              {isSubmitting ? <Loader2 className="animate-spin mr-3" size={20}/> : <Save className="mr-3" size={18} />}
              <span>{showModal === 'add' ? "ACTIVER LE MEMBRE" : "SAUVEGARDER"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;
