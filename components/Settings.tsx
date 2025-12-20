import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { Camera, Save, Lock, Mail, Phone, User as UserIcon, Loader2, History, Trash2, Clock, CheckCircle2 } from 'lucide-react';

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
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [logs, setLogs] = useState<ProfileLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clé de stockage unique par utilisateur
  const LOGS_STORAGE_KEY = useMemo(() => `ivision_logs_v2_${currentUser.id}`, [currentUser.id]);

  // Charger les logs au démarrage
  useEffect(() => {
    const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Erreur lecture logs", e);
        setLogs([]);
      }
    }
  }, [LOGS_STORAGE_KEY]);

  const addLogsBatch = useCallback((newEntries: Omit<ProfileLog, 'id' | 'timestamp'>[]) => {
    if (newEntries.length === 0) return;

    const timestamp = new Date().toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const entriesWithMeta = newEntries.map(entry => ({
      ...entry,
      id: crypto.randomUUID(),
      timestamp
    }));

    setLogs(prev => {
      const updated = [...entriesWithMeta, ...prev].slice(0, 15); // Garder les 15 derniers
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [LOGS_STORAGE_KEY]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAvatar = event.target.result as string;
          setAvatarPreview(newAvatar);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSaving(true);
    const pendingLogs: Omit<ProfileLog, 'id' | 'timestamp'>[] = [];

    // Détection précise des changements
    if (formData.name !== currentUser.name) {
      pendingLogs.push({ field: "Nom", oldValue: currentUser.name, newValue: formData.name });
    }
    if (formData.email !== currentUser.email) {
      pendingLogs.push({ field: "Email", oldValue: currentUser.email, newValue: formData.email });
    }
    if (formData.phoneNumber !== (currentUser.phoneNumber || '')) {
      pendingLogs.push({ field: "Mobile", oldValue: currentUser.phoneNumber || 'Non défini', newValue: formData.phoneNumber });
    }
    if (avatarPreview !== currentUser.avatar) {
      pendingLogs.push({ field: "Photo", oldValue: "Ancienne image", newValue: "Nouvelle image" });
    }
    if (formData.newPassword) {
      pendingLogs.push({ field: "Sécurité", oldValue: "********", newValue: "Mis à jour" });
    }

    try {
      await onUpdateProfile({
        name: formData.name, 
        email: formData.email, 
        phoneNumber: formData.phoneNumber,
        avatar: avatarPreview, 
        password: formData.newPassword || undefined
      });

      addLogsBatch(pendingLogs);
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 3000);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const clearLogs = () => {
    if (confirm("Effacer tout l'historique ?")) {
      setLogs([]);
      localStorage.removeItem(LOGS_STORAGE_KEY);
    }
  };

  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none";

  return (
    <div className="max-w-xl mx-auto pb-32 page-transition px-1 overflow-hidden">
      <div className="mb-8 px-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Paramètres</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Édition du profil Workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-5xl border border-slate-50 shadow-sm flex items-center space-x-6">
            <div className="relative active-scale" onClick={() => fileInputRef.current?.click()}>
              <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-lg" />
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                <Camera size={14} strokeWidth={3} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 leading-none mb-1 truncate">{formData.name}</h3>
              <p className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 inline-block px-2 py-0.5 rounded-lg">{currentUser.role}</p>
            </div>
        </div>

        {/* Info Form */}
        <div className="bg-white p-6 rounded-5xl border border-slate-50 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center mb-2">
              <UserIcon size={14} className="mr-2 text-primary" /> Informations
            </h3>
            <div className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="Nom Complet" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="Email" />
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClasses} placeholder="Numéro Mobile" />
            </div>
        </div>

        {/* Password Section */}
        <div className="bg-white p-6 rounded-5xl border border-slate-50 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center mb-2">
              <Lock size={14} className="mr-2 text-primary" /> Sécurité
            </h3>
            <div className="space-y-4">
              <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className={inputClasses} placeholder="Nouveau mot de passe" />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClasses} placeholder="Confirmer mot de passe" />
            </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving} 
          className={`w-full py-5 rounded-4xl font-black text-xs tracking-widest shadow-2xl flex items-center justify-center space-x-3 transition-all active-scale border-4 border-white ${showSavedFeedback ? 'bg-success text-white shadow-success/30' : 'bg-primary text-white shadow-primary/30'}`}
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : showSavedFeedback ? (
            <>
              <CheckCircle2 size={20} />
              <span>PROFIL MIS À JOUR</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>SAUVEGARDER LES MODIFICATIONS</span>
            </>
          )}
        </button>
      </form>

      {/* Lazy Log Section - Optimized */}
      <div className="mt-12 space-y-4 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <History size={16} />
            </div>
            <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">Activité du profil</h3>
          </div>
          {logs.length > 0 && (
            <button onClick={clearLogs} className="p-2 text-slate-300 hover:text-urgent active-scale transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-5xl border border-slate-100 border-dashed">
            <Clock size={32} className="mx-auto text-slate-200 mb-3 opacity-50" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Aucun log récent</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-4xl border border-slate-50 shadow-sm flex items-start space-x-4 animate-in fade-in slide-in-from-top-2">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-primary/40 flex-shrink-0">
                  <Clock size={16} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{log.field}</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase">{log.timestamp}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold truncate">
                    <span className="text-slate-300 line-through truncate max-w-[80px]">{log.oldValue}</span>
                    <div className="w-3 h-[1px] bg-slate-200"></div>
                    <span className="text-primary truncate">{log.newValue}</span>
                  </div>
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