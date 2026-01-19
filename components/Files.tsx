
import React, { useState } from 'react';
import { FileLink, User } from '../types';
import { Plus, Search, FileText, ExternalLink, Trash2, X, Cloud, ArrowUpRight, Link as LinkIcon, Type } from 'lucide-react';

const Files: React.FC<any> = ({ fileLinks = [], onAddFileLink, onDeleteFileLink, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '' });

  const filteredFiles = fileLinks.filter((f: FileLink) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModals = () => {
    setShowAddModal(false);
    setFormData({name: '', url: ''});
  };

  return (
    <div className="relative animate-fade-in">
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
          <div>
            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-sky-400 mb-2">ASSET STORAGE SYSTEM</p>
            <h2 className="text-4xl md:text-7xl font-extrabold text-white tracking-tighter uppercase leading-none">Documents</h2>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="relative group flex-1 md:flex-none">
               <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="RECHERCHER..." 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 className="w-full md:w-80 pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full text-[12px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-400/50 focus:bg-white/10 transition-all placeholder-slate-700" 
               />
             </div>
             <button 
               onClick={() => setShowAddModal(true)} 
               className="w-16 h-16 bg-sky-400 text-white rounded-3xl shadow-xl active-scale flex items-center justify-center transition-all hover:scale-110 shadow-sky-500/20"
             >
               <Plus size={40} strokeWidth={3} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
          {filteredFiles.map((file: FileLink) => (
            <div key={file.id} className="glass group rounded-[2.5rem] border border-white/5 p-5 md:p-6 transition-all duration-500 hover:border-sky-400/30 hover:bg-white/[0.04] flex items-center justify-between">
              <div className="flex items-center space-x-6 min-w-0">
                 <div className="w-14 h-14 md:w-20 md:h-20 bg-sky-400/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-sky-400 shadow-inner border border-sky-400/20 group-hover:bg-sky-400/20 transition-all duration-500 flex-shrink-0">
                    <FileText size={28} className="md:w-[32px] md:h-[32px]" />
                 </div>
                 <div className="truncate pr-2">
                    <h3 className="font-black text-white text-base md:text-xl truncate uppercase tracking-tight group-hover:text-sky-400 transition-colors leading-none">{file.name}</h3>
                    <div className="flex items-center space-x-3 mt-2 md:mt-3 opacity-40 leading-none">
                      <Cloud size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">{file.createdAt}</p>
                    </div>
                 </div>
              </div>

              <div className="flex space-x-2 md:space-x-3 flex-shrink-0">
                  <button onClick={() => window.open(file.url, '_blank')} className="w-12 h-12 md:w-16 md:h-16 glass text-slate-500 hover:text-white hover:bg-sky-400/20 rounded-2xl transition-all flex items-center justify-center active-scale shadow-lg"><ArrowUpRight size={22}/></button>
                  <button onClick={() => confirm('Supprimer ?') && onDeleteFileLink(file.id)} className="w-12 h-12 md:w-16 md:h-16 glass text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-all flex items-center justify-center active-scale shadow-lg"><Trash2 size={22}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL AJOUT DOCUMENT - UNIFIED DESIGN */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-center-wrapper">
            <div className="modal-container">
              <div className="modal-content-glass animate-fade-in">
                 <div className="flex justify-between items-start mb-10">
                   <div>
                     <h3 className="text-3xl font-extrabold text-white uppercase tracking-tight leading-none">Indexation Document</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Dépôt Cloud iVISION Core System</p>
                   </div>
                   <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
                 </div>
                 
                 <form onSubmit={(e) => { e.preventDefault(); onAddFileLink(formData.name, formData.url); closeModals(); }} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><Type size={12} className="mr-2 text-sky-400"/> Désignation de l'actif</label>
                      <input required className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-sky-400 transition-all text-sm" placeholder="Ex: Contrat de Partenariat Q1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center leading-none"><LinkIcon size={12} className="mr-2 text-sky-400"/> Lien Cloud iV (Drive/S3)</label>
                      <input required className="w-full p-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-sky-400 transition-all text-sm" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                   </div>

                   <button type="submit" className="w-full py-7 bg-sky-400 text-slate-950 font-black rounded-3xl shadow-2xl active-scale uppercase text-xs tracking-[0.4em] mt-6 transition-all hover:bg-sky-300 shadow-sky-500/20">
                     Confirmer l'Indexation
                   </button>
                 </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
