import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Camera, Save, Lock, Mail, Phone, User as UserIcon, Shield, Loader2, History, Trash2, Clock } from 'lucide-react';

interface ProfileLog {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

interface SettingsProps {
  currentUser: User;
  onUpdateProfile: (updatedData: Partial<User> & { password?: string }) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phoneNumber: currentUser.phoneNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<ProfileLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chargement des logs depuis le localStorage au montage
  useEffect(() => {
    const savedLogs = localStorage.getItem(`ivision_logs_${currentUser.id}`);
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, [currentUser.id]);

  const addLog = (field: string, oldValue: string, newValue: string) => {
    const newLog: ProfileLog = {
      id: crypto.randomUUID(),
      field,
      oldValue,
      newValue,
      timestamp: new Date().toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      })
    };
    const updatedLogs = [newLog, ...logs].slice(0, 10); // Garder les 10 derniers
    setLogs(updatedLogs);
    localStorage.setItem(`ivision_logs_${currentUser.id}`, JSON.stringify(updatedLogs));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAvatar = event.target.result as string;
          setAvatarPreview(newAvatar);
          addLog("Photo de profil", "Ancienne image", "Nouvelle image");
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setIsSaving(true);

    // Détection des changements pour le log
    if (formData.name !== currentUser.name) addLog("Nom", currentUser.name, formData.name);
    if (formData.email !== currentUser.email) addLog("Email", currentUser.email, formData.email);
    if (formData.phoneNumber !== (currentUser.phoneNumber || '')) addLog("Téléphone", currentUser.phoneNumber || 'Vide', formData.phoneNumber);
    if (formData.newPassword) addLog("Sécurité", "Ancien mot de passe", "Nouveau mot de passe");

    await onUpdateProfile({
      name: formData.name, 
      email: formData.email, 
      phoneNumber: formData.phoneNumber,
      avatar: avatarPreview, 
      password: formData.newPassword ? formData.newPassword : undefined
    });

    setIsSaving(false);
    setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem(`ivision_logs_${currentUser.id}`);
  };

  const inputClasses = "w-full p-4 bg-slate-100/50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none";

  return (
    <div className="max-w-4xl mx-auto pb-32 page-transition px-1">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres</h2>
        <p className="text-slate-500 font-semibold">Gérez votre identité iVISION</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group cursor-pointer active-scale" onClick={() => fileInputRef.current?.click()}>
              <img src={avatarPreview} alt="Profile" className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-slate-900 leading-none mb-1">{formData.name}</h3>
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">{currentUser.role}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 flex items-center"><UserIcon size={18} className="mr-2 text-primary" /> Identité</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nom complet</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Email professionnel</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Numéro de téléphone</label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClasses} placeholder="+213..." />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 flex items-center"><Lock size={18} className="mr-2 text-primary" /> Sécurité</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nouveau mot de passe</label>
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className={inputClasses} placeholder="••••••••" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Confirmer le mot de passe</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClasses} placeholder="••••••••" />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Conseil : Utilisez au moins 8 caractères avec des chiffres et des symboles pour une sécurité optimale.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <button type="submit" disabled={isSaving} className="w-full md:w-auto px-10 py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/40 active-scale disabled:opacity-50 flex items-center justify-center space-x-3 transition-all">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            <span>{isSaving ? "SAUVEGARDE..." : "METTRE À JOUR LE PROFIL"}</span>
          </button>
        </div>
      </form>

      {/* Journal d'activité du profil */}
      <div className="mt-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 flex items-center"><History size={20} className="mr-2 text-primary" /> Journal d'activité</h3>
          {logs.length > 0 && (
            <button onClick={clearLogs} className="text-[10px] font-black uppercase text-slate-400 hover:text-urgent transition-colors flex items-center">
              <Trash2 size={12} className="mr-1" /> Effacer
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10">
            <Clock size={40} className="mx-auto text-slate-100 mb-3" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Aucune modification récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-100 transition-all group">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.field} mis à jour</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    <span className="text-slate-400 line-through mr-2">{log.oldValue}</span>
                    <span className="text-primary font-bold">{log.newValue}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;