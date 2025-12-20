import React, { useState, useMemo } from 'react';
import { Search, Link as LinkIcon, Plus, X, Trash2, ExternalLink, Check } from 'lucide-react';
import { Task, Message, User, FileLink, Client } from '../types';

interface FilesProps {
  tasks: Task[];
  messages: Message[];
  fileLinks?: FileLink[];
  clients?: Client[];
  currentUser: User;
  onAddFileLink?: (name: string, url: string, clientId?: string) => void;
  onDeleteFileLink?: (id: string) => void;
}

const Files: React.FC<FilesProps> = ({ tasks, messages, fileLinks = [], clients = [], currentUser, onAddFileLink, onDeleteFileLink }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', clientId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Nom requis";
    if (!formData.url.trim() || !formData.url.startsWith('http')) e.url = "URL invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      if (onAddFileLink) {
          onAddFileLink(formData.name, formData.url, formData.clientId || undefined);
          setShowAddModal(false);
          setFormData({ name: '', url: '', clientId: '' });
      }
  };

  const inputClasses = "w-full p-4 bg-slate-100/50 border border-slate-200 rounded-3xl font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none";

  return (
    <div className="space-y-6 pb-24 px-1">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Fichiers</h2>
        <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
        </div>
      </div>

      <div className="space-y-3">
          {fileLinks.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(link => (
              <div key={link.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-50 rounded-2xl text-primary"><LinkIcon size={20} /></div>
                      <div>
                          <h4 className="font-bold text-sm text-slate-800">{link.name}</h4>
                          <p className="text-[9px] text-slate-400 uppercase font-black">{link.createdAt}</p>
                      </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => window.open(link.url, '_blank')} className="p-2 text-primary bg-primary/5 rounded-xl"><ExternalLink size={16} /></button>
                    {onDeleteFileLink && <button onClick={() => confirm("Supprimer ?") && onDeleteFileLink(link.id)} className="p-2 text-red-500 bg-red-50 rounded-xl"><Trash2 size={16} /></button>}
                  </div>
              </div>
          ))}
      </div>

      <button onClick={() => { setErrors({}); setShowAddModal(true); }} className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-white active-scale transition-transform"><Plus size={28} /></button>

      {showAddModal && (
          <div className="fixed inset-0 bg-white z-[160] animate-in slide-in-from-bottom duration-300 flex flex-col safe-top">
              <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-20">
                  <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400"><X size={24}/></button>
                  <h3 className="font-bold">Nouveau Lien</h3>
                  <button onClick={handleAddSubmit} className="bg-primary text-white px-5 py-2 rounded-full font-bold text-sm active-scale transition-transform flex items-center space-x-1">
                      <Check size={16} /> <span>Ajouter</span>
                  </button>
              </header>
              <form className="p-6 space-y-6 flex-1 overflow-y-auto">
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block tracking-widest px-2">Nom du document *</label>
                          <input type="text" className={`${inputClasses} ${errors.name ? 'border-red-100 bg-red-50' : ''}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Cahier des charges" />
                          {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 px-2">{errors.name}</p>}
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block tracking-widest px-2">URL (Drive, Dropbox...) *</label>
                          <input type="url" className={`${inputClasses} ${errors.url ? 'border-red-100 bg-red-50' : ''}`} value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
                          {errors.url && <p className="text-red-500 text-[10px] font-bold mt-1 px-2">{errors.url}</p>}
                      </div>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};

export default Files;