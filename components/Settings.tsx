
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { Camera, Save, Lock, Mail, Phone, User as UserIcon, Shield, Loader2 } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
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
    await onUpdateProfile({
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      avatar: avatarPreview,
      password: formData.newPassword ? formData.newPassword : undefined
    });
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Paramètres du Profil</h2>
        <p className="text-slate-500 text-sm">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Public Info */}
        <div className="md:col-span-1 space-y-6">
          {/* Avatar Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img 
                src={avatarPreview} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-md group-hover:opacity-75 transition-opacity" 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 p-2 rounded-full text-white">
                  <Camera size={24} />
                </div>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            
            <div className="mt-4">
              <h3 className="font-bold text-slate-900 text-lg">{currentUser.name}</h3>
              <p className="text-slate-500 text-sm">{currentUser.role}</p>
            </div>

            <div className="mt-6 w-full">
               <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-xs font-medium flex items-start text-left">
                 <Shield size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                 Compte sécurisé (Admin)
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <UserIcon size={18} className="mr-2 text-primary" />
              Informations Personnelles
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="relative">
                     <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                     <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <div className="relative">
                     <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                     <input 
                      type="tel" 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <Lock size={18} className="mr-2 text-primary" />
              Mot de passe
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel (pour confirmation)</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
             <button type="button" className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                Annuler
             </button>
             <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
