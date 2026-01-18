
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera, Mail, Phone, Loader2, Check } from 'lucide-react';

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
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Profil</h2>
        <p className="text-slate-500 mt-2 text-sm">Gérez vos informations personnelles.</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <img src={currentUser.avatar} alt="" className="w-32 h-32 rounded-3xl object-cover ring-4 ring-white/5 shadow-2xl transition-all group-hover:opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={32} className="text-white" />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" />
        </div>
        <div className="mt-4 text-center">
          <p className="text-white font-bold text-lg">{currentUser.name}</p>
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">{currentUser.role}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 rounded-[2rem] border-white/5 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase px-2">Nom complet</label>
          <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-primary transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase px-2">Email</label>
          <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-primary transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase px-2">Téléphone</label>
          <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-primary transition-all" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
        </div>

        <button disabled={isSaving} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active-scale ${saved ? 'bg-success text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : saved ? <><Check size={20} /> <span>Enregistré</span></> : "Sauvegarder les modifications"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
