
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { Camera, User as UserIcon, Loader2, Mail, Phone } from 'lucide-react';

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
  
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile({
        name: formData.name, 
        email: formData.email, 
        phoneNumber: formData.phoneNumber,
        avatar: avatarPreview,
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
    <div className="max-w-xl mx-auto pb-32 animate-in fade-in duration-500">
      <div className="mb-10 px-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Profil</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Gestion de votre identité iVISION</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
              <p className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 px-3 py-1 rounded-xl inline-block">{currentUser.role}</p>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2">
              <UserIcon size={14} className="mr-3 text-primary" /> Coordonnées Professionnelles
            </h3>
            <div className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="Nom Complet" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="Email" />
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={inputClasses} placeholder="Mobile" />
            </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving} 
          className={`w-full py-6 rounded-[2.5rem] font-black text-xs tracking-widest shadow-2xl flex items-center justify-center space-x-3 transition-all active-scale border-4 border-white ${showSavedFeedback ? 'bg-success text-white' : 'bg-primary text-white'}`}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : showSavedFeedback ? "PROFIL MIS À JOUR" : "SAUVEGARDER"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
