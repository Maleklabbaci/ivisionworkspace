
import React, { useState } from 'react';
import { FileLink, User, UserRole } from '../types';
import { Plus, Search, FileText, ExternalLink, Trash2, X, Cloud, ArrowUpRight, Link as LinkIcon, Type } from 'lucide-react';
import Modal from './Modal';

const Files: React.FC<any> = ({ fileLinks = [], onAddFileLink, onDeleteFileLink, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '' });

  const filteredFiles = fileLinks.filter((f: FileLink) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canDelete = isAdmin || currentUser.permissions?.canDeleteFiles;

  const closeModals = () => {
    setShowAddModal(false);
    setFormData({name: '', url: ''});
  };

  return (
    <div className="relative animate-fade-in">
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
          <div>
            <p className="text-[10px] md:text-[12px] font-black uppercase text-sky-400 mb-2 tracking-[0.4em]">ASSET STORAGE SYSTEM</p>
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">Documents</h2>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="relative group flex-1 md:flex-none">
               <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="RECHERCHER..." 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 className="w-full md:w-80 pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase text-white outline-none focus:border-sky-400/50 focus:bg-white/10 transition-all placeholder-slate-700" 
               />
             </div>
             <button 
               onClick={() => setShowAddModal(true)} 
               className="w-16 h-16 bg-sky-400 text-slate-950 rounded-3xl shadow-xl active-scale flex items-center justify-center transition-all hover:scale-105 shadow-sky-500/10"
             >
               <Plus size={40} strokeWidth={3} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1 text-left">
          {filteredFiles.map((file: FileLink) => (
            <div key={file.id} className="glass group rounded-[2.5rem] border border-white/5 p-6 transition-all duration-500 hover:border-sky-400/30 hover:bg-white/[0.04] flex items-center justify-between">
              <div className="flex items-center space-x-6 min-w-0">
                 <div className="w-16 h-16 md:w-24 md:h-24 bg-sky-400/10 rounded-[1.8rem] flex items-center justify-center text-sky-400 border border-sky-400/10 group-hover:bg-sky-400/20 transition-all duration-500 flex-shrink-0">
                    <FileText size={32} />
                 </div>
                 <div className="truncate pr-2">
                    <h3 className="font-black text-white text-base md:text-2xl truncate uppercase tracking-tight leading-none group-hover:text-sky-400 transition-colors">{file.name}</h3>
                    <div className="flex items-center space-x-3 mt-3 md:mt-4 opacity-40 leading-none">
                      <Cloud size={14} />
                      <p className="text-[10px] font-black uppercase">{file.createdAt}</p>
                    </div>
                 </div>
              </div>

              <div className="flex space-x-3 flex-shrink-0">
                  <button onClick={() => window.open(file.url, '_blank')} className="w-12 h-12 md:w-16 md:h-16 glass text-slate-500 hover:text-white rounded-2xl transition-all flex items-center justify-center active-scale shadow-lg"><ArrowUpRight size={24}/></button>
                  {canDelete && (
                    <button onClick={() => confirm('Supprimer ce document ?') && onDeleteFileLink(file.id)} className="w-12 h-12 md:w-16 md:h-16 glass text-slate-500 hover:text-rose-400 rounded-2xl transition-all flex items-center justify-center active-scale shadow-lg"><Trash2 size={24}/></button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal 
        isOpen={showAddModal} 
        onClose={closeModals}
        title="Indexation Document"
        subtitle="Dépôt Cloud iVISION Core System"
      >
        <form onSubmit={(e) => { e.preventDefault(); onAddFileLink(formData.name, formData.url); closeModals(); }} className="space-y-8 text-left">
           <div>
              <label className="label-iv"><Type size={14} className="text-sky-400"/> Désignation de l'actif</label>
              <input required className="input-iv" placeholder="Ex: Contrat de Partenariat Q1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
           </div>
           
           <div>
              <label className="label-iv"><LinkIcon size={14} className="text-sky-400"/> Lien Cloud iV (Drive/S3)</label>
              <input required className="input-iv font-medium" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
           </div>

           <button type="submit" className="w-full py-7 bg-[#0EA5E9] text-white font-black rounded-[2rem] shadow-2xl shadow-sky-500/10 active-scale uppercase text-[11px] tracking-tight mt-6 transition-all hover:bg-sky-400">
             Confirmer l'Indexation
           </button>
        </form>
      </Modal>
    </div>
  );
};

export default Files;
