
import React, { useState } from 'react';
import { FileLink, User } from '../types';
import { Plus, Search, FileText, ExternalLink, Trash2, X, Cloud, ArrowUpRight } from 'lucide-react';

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
        {/* Header Section - Fixed Alignment & Style */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2">ASSET STORAGE SYSTEM</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase leading-none">Documents</h2>
          </div>
          
          <div className="flex items-center space-x-3 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-80 group">
               <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="RECHERCHER DANS LE CLOUD..." 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-sky-400/50 focus:bg-white/10 transition-all placeholder-slate-700" 
               />
             </div>
             <button 
               onClick={() => { setFormData({name: '', url: ''}); setShowAddModal(true); }} 
               className="w-14 h-14 bg-sky-500 text-white rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)] active-scale flex items-center justify-center transition-all hover:scale-105 hover:bg-sky-400 group"
             >
               <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
             </button>
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file: FileLink) => (
            <div key={file.id} className="glass-card p-6 rounded-[2.5rem] border border-white/5 group hover:border-sky-500/30 transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[50px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-sky-500/10 transition-colors"></div>
              
              <div className="flex items-center space-x-5 relative z-10 mb-8">
                 <div className="w-16 h-16 bg-gradient-to-br from-sky-400/20 to-sky-600/30 rounded-2xl flex items-center justify-center text-sky-400 shadow-inner border border-sky-400/20 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={30} />
                 </div>
                 <div className="truncate flex-1">
                    <h3 className="font-extrabold text-white text-[15px] truncate uppercase tracking-tight group-hover:text-sky-400 transition-colors">{file.name}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Cloud size={12} className="text-sky-500/60" />
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{file.createdAt}</p>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
                 <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Disponible</span>
                 </div>
                 <div className="flex space-x-2">
                    <button 
                      onClick={() => window.open(file.url, '_blank')} 
                      className="w-10 h-10 glass text-slate-500 hover:text-white hover:bg-sky-500/20 rounded-xl transition-all flex items-center justify-center active-scale"
                    >
                      <ArrowUpRight size={18}/>
                    </button>
                    <button 
                      onClick={() => { if(confirm('Révoquer cet actif ?')) onDeleteFileLink(file.id); }} 
                      className="w-10 h-10 glass text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all flex items-center justify-center active-scale"
                    >
                      <Trash2 size={18}/>
                    </button>
                 </div>
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="col-span-full py-24 glass rounded-[3rem] border-dashed border-2 border-white/5 flex flex-col items-center justify-center text-slate-700">
               <Cloud size={60} strokeWidth={1} className="mb-4 opacity-20" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Coffre-fort vide</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL INDEXATION */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={closeModals}></div>
          <div className="modal-container max-w-lg">
            <div className="relative glass w-full transform rounded-[3rem] p-8 md:p-14 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] animate-fade-in transition-all">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-none">Indexation Actif</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">Centralisation de ressources iVISION</p>
                 </div>
                 <button onClick={closeModals} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active-scale"><X size={24}/></button>
               </div>
               <form onSubmit={(e) => { e.preventDefault(); onAddFileLink(formData.name, formData.url); closeModals(); setFormData({name:'', url:''}); }} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Désignation</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-sky-400 text-sm transition-all" placeholder="Nom de la ressource" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Lien Externe (Cloud)</label>
                    <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-sky-400 text-sm transition-all" placeholder="https://drive.google.com/..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                 </div>
                 <button className="w-full py-6 bg-sky-500 text-white font-black rounded-3xl shadow-2xl shadow-sky-500/30 active-scale uppercase text-[11px] tracking-[0.3em] mt-4 hover:bg-sky-400 transition-all">Archiver dans le Vault</button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
