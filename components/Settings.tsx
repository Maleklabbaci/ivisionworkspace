
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera, Mail, Phone, Loader2, Check, User as UserIcon } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SettingsProps {
  currentUser: User;
  onUpdateProfile: (updatedData: Partial<User>) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phoneNumber: currentUser.phoneNumber || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation basique
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image valide.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Mettre à jour le profil via la fonction parente
      await onUpdateProfile({ avatar: publicUrl });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      console.error('Erreur upload:', error);
      alert("Erreur lors de l'envoi de l'image : " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      alert("Erreur de sauvegarde : " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-left px-2">
        <p className="text-[10px] font-black uppercase text-sky-400 mb-2 tracking-[0.4em]">USER CONFIGURATION</p>
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Paramètres</h2>
      </div>

      <div className="flex flex-col items-center">
        <div 
          className="relative group cursor-pointer active-scale" 
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl relative">
            <img 
              src={currentUser.avatar} 
              alt="" 
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isUploading ? 'opacity-30 blur-sm' : ''}`} 
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-sky-400" size={32} />
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <div className="mt-6 text-center">
          <p className="text-white font-black text-xl md:text-2xl uppercase tracking-tight leading-none">{currentUser.name}</p>
          <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/20">
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">{currentUser.role}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="crystal-module p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-white/5 space-y-8 text-left shadow-2xl">
        <div className="space-y-2">
          <label className="label-iv"><UserIcon size={14} className="text-sky-400" /> Nom complet</label>
          <input className="input-iv" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        
        <div className="space-y-2">
          <label className="label-iv"><Mail size={14} className="text-sky-400" /> Email iVISION</label>
          <input disabled className="input-iv opacity-50 cursor-not-allowed" value={formData.email} />
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 ml-2 tracking-widest">L'email ne peut être modifié que par un administrateur.</p>
        </div>

        <div className="space-y-2">
          <label className="label-iv"><Phone size={14} className="text-sky-400" /> Téléphone direct</label>
          <input className="input-iv" placeholder="+213..." value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
        </div>

        <button 
          disabled={isSaving || isUploading} 
          className={`w-full py-6 md:py-8 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center space-x-3 transition-all active-scale shadow-2xl ${saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white text-slate-950 hover:bg-sky-400 hover:text-white shadow-sky-500/10'}`}
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : saved ? <><Check size={20} strokeWidth={3} /> <span>Mise à jour effectuée</span></> : "Enregistrer le profil"}
        </button>
      </form>

      <div className="p-8 md:p-10 bg-rose-500/5 rounded-[2.5rem] border border-rose-500/10 text-left">
        <h3 className="text-rose-400 font-black text-[10px] uppercase tracking-widest mb-4">Zone de Sécurité</h3>
        <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-6 uppercase">La modification de vos accès critiques nécessite une validation du protocole par l'administrateur iVISION.</p>
        <button disabled className="px-6 py-3 bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase rounded-xl border border-rose-500/20 opacity-50">Demander un nouveau code</button>
      </div>
    </div>
  );
};

export default Settings;
