
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { Camera, Lock, Mail, Phone, User as UserIcon, Loader2, History, Clock, Cpu, ShieldCheck, Zap, Sparkles } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile({
        name: formData.name, 
        email: formData.email, 
        phoneNumber: formData.phoneNumber,
        avatar: avatarPreview, 
        password: formData.newPassword || undefined
      });
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary/20 outline-none transition-all";

  return (
    <div className="max-w-xl mx-auto pb-32 page-transition px-1 animate-in fade-in duration-500">
      <div className="mb-10 px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Paramètres</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Configuration Système iVISION</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm flex items-center space-x-6">
            <div className="relative active-scale cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img src={avatarPreview} alt="Profile" className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white shadow-xl" />
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white">
                <Camera size={16} strokeWidth={3} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
               if (e.target.files?.[0]) {
                 const reader = new FileReader();
                 reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
                 reader.readAsDataURL(e.target.files[0]);
               }
            }} />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-slate-900 leading-none mb-2 truncate uppercase tracking-tighter">{formData.name}</h3>
              <p className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 inline-block px-3 py-1 rounded-xl">{currentUser.role}</p>
            </div>
        </div>

        {/* Info Perso */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
              <UserIcon size={14} className="mr-3 text-primary" /> Identité & Contact
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="Nom Complet" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="Email professionnel" />
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClasses} placeholder="Mobile" />
            </div>
        </div>

        {/* Sécurité & IA - NOUVEAU BLOC */}
        <div className="bg-slate-900 p-10 rounded-[3.5rem] border-4 border-white shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cpu size={120} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Sécurité & Intelligence IA</h3>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Sparkles size={20} className="text-primary" />
                            <div>
                                <p className="text-white font-black text-[10px] uppercase tracking-widest">Moteur Intelligence</p>
                                <p className="text-success font-bold text-[9px] uppercase">Opérationnel (Gemini Flash iV)</p>
                            </div>
                        </div>
                        <div className="w-3 h-3 bg-success rounded-full shadow-[0_0_10px_rgba(52,199,89,0.5)]"></div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <p className="text-white/40 font-bold text-[9px] uppercase tracking-widest mb-3">Accès API iVISION</p>
                        <div className="flex items-center justify-between">
                            <code className="text-primary font-mono text-xs font-black truncate max-w-[180px]">WORKSPACE_SECURED_BY_SYSTEM</code>
                            <span className="text-white/20 text-[8px] font-black uppercase border border-white/10 px-2 py-1 rounded-lg flex-shrink-0">Protégé</span>
                        </div>
                    </div>

                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest px-2 leading-relaxed">
                        Le moteur iVISION est centralisé. La clé est injectée via le vault sécurisé pour garantir la continuité des services d'analyse de leads.
                    </p>
                </div>
            </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving} 
          className={`w-full py-6 rounded-[2.5rem] font-black text-xs tracking-widest shadow-2xl flex items-center justify-center space-x-3 transition-all active-scale border-4 border-white ${showSavedFeedback ? 'bg-success text-white' : 'bg-primary text-white'}`}
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : showSavedFeedback ? "MODIFICATIONS ENREGISTRÉES" : "SAUVEGARDER LE PROFIL"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
