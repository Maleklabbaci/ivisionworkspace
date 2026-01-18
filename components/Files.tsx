
import React, { useState } from 'react';
import { FileLink, User } from '../types';
import { Plus, Search, FileText, ExternalLink, Trash2, X, Link as LinkIcon, Cloud } from 'lucide-react';

const Files: React.FC<any> = ({ fileLinks = [], onAddFileLink, onDeleteFileLink, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '' });

  const filteredFiles = fileLinks.filter((f: FileLink) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModals = () => {
    setShowAddModal(false);
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">ASSET STORAGE SYSTEM</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">Documents</h2>
          </div>
          <div className="flex space-x-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-72">
               <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
               <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-[1.5rem] text-[11px] font-black uppercase tracking-wider text-white outline-none focus:border-blue-400 focus:bg-white/10 transition-all placeholder-slate-700" />
             </div>
             <button onClick={() => { setFormData({name: '', url: ''}); setShowAddModal(true); }} className="w-14 h-14 bg-blue-400 text-white rounded-2xl shadow-xl shadow-blue-500/20 active-scale flex items-center justify-center transition-transform hover:scale-105">
               <Plus size={28} strokeWidth={3} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file: FileLink) => (
            <div key={file.id} className="glass-card p-7 rounded-[2.8rem] border border-white/5 group flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-blue-400/5 blur-3xl rounded-full -translate-x-12 -translate-y-12"></div>
              <div className="flex items-center space-x-5 truncate relative z-10">
                 <div className="w-16 h-16 bg-gradient-to-br from-blue-400/10 to-blue-600/20 rounded-[1.5rem] flex items-center justify-center text-blue-400 shadow-inner border border-blue-400/10 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={28} />
                 </div>
                 <div className="truncate">
                    <h3 className="font-extrabold text-white text-[14px] truncate uppercase tracking-tight">{file.name}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Cloud size={10} className="text-blue-500" />
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{file.createdAt}</p>
                    </div>
                 </div>
              </div>
              <div className="flex space-x-2.5 relative z-10">
                 <button onClick={() => window.open(file.url, '_blank')} className="w-10 h-10 glass text-slate-500 hover:text-white hover:bg-blue-500/20 rounded-xl transition-all flex items-center justify-center"><ExternalLink size={18}/></button>
                 <button onClick={() => { if(confirm('Supprimer cette ressource ?')) onDeleteFileLink(file.id); }} className="w-10 h-10 glass text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all flex items-center justify-center"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL INDEXATION - FIXÉ POUR TOUTES TAILLES */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl py-6 md:py-12 px-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
            <div className="relative glass w-full max-w-lg transform rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in transition-all">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-none">Indexation</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Système iVISION</p>
                 </div>
                 <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={24}/></button>
               </div>
               <form onSubmit={(e) => { e.preventDefault(); onAddFileLink(formData.name, formData.url); closeModals(); setFormData({name:'', url:''}); }} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Label de l'actif</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-blue-400 text-sm transition-all" placeholder="Guideline_V1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Source Cloud</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-blue-400 text-sm transition-all" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                 </div>
                 <button className="w-full py-6 bg-blue-400 text-white font-black rounded-3xl shadow-xl uppercase text-[11px] tracking-[0.3em] mt-4 hover:bg-blue-500 transition-all">Confirmer Indexation</button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
