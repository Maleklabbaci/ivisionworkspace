
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

  return (
    <div className="relative animate-fade-in">
      {/* Dynamic Background Effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
         <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-violet-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="space-y-12 pb-20">
        {/* Header - Identique au screenshot utilisateur */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
          <div>
            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-sky-400 mb-2">ASSET STORAGE SYSTEM</p>
            <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter uppercase leading-none">Documents</h2>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="relative group">
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
               onClick={() => { setFormData({name: '', url: ''}); setShowAddModal(true); }} 
               className="w-16 h-16 bg-sky-400 text-white rounded-3xl shadow-[0_0_40px_rgba(56,189,248,0.4)] active-scale flex items-center justify-center transition-all hover:scale-110 hover:shadow-[0_0_60px_rgba(56,189,248,0.6)]"
             >
               <Plus size={40} strokeWidth={3} />
             </button>
          </div>
        </div>

        {/* Files Grid - Row Style Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
          {filteredFiles.map((file: FileLink) => (
            <div key={file.id} className="glass group rounded-[2.5rem] border border-white/5 p-4 md:p-6 transition-all duration-500 hover:border-sky-400/30 hover:bg-white/[0.04] flex items-center justify-between">
              <div className="flex items-center space-x-6 min-w-0">
                 <div className="w-14 h-14 md:w-20 md:h-20 bg-sky-400/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-sky-400 shadow-inner border border-sky-400/20 group-hover:bg-sky-400/20 transition-all duration-500 flex-shrink-0">
                    <FileText size={28} className="md:w-[32px] md:h-[32px]" />
                 </div>
                 <div className="truncate pr-2">
                    <h3 className="font-black text-white text-base md:text-xl truncate uppercase tracking-tight group-hover:text-sky-400 transition-colors">{file.name}</h3>
                    <div className="flex items-center space-x-3 mt-1.5 opacity-40">
                      <Cloud size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">{file.createdAt}</p>
                    </div>
                 </div>
              </div>

              <div className="flex space-x-2 md:space-x-3 flex-shrink-0">
                  <button 
                    onClick={() => window.open(file.url, '_blank')} 
                    className="w-12 h-12 md:w-16 md:h-16 glass text-slate-500 hover:text-white hover:bg-sky-400/20 rounded-2xl md:rounded-[1.5rem] transition-all flex items-center justify-center active-scale border border-white/5 shadow-lg"
                  >
                    <ArrowUpRight size={22}/>
                  </button>
                  <button 
                    onClick={() => { if(confirm('Révoquer cet actif ?')) onDeleteFileLink(file.id); }} 
                    className="w-12 h-12 md:w-16 md:h-16 glass text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-2xl md:rounded-[1.5rem] transition-all flex items-center justify-center active-scale border border-white/5 shadow-lg"
                  >
                    <Trash2 size={22}/>
                  </button>
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="col-span-full py-40 glass rounded-[4rem] border-dashed border-2 border-white/5 flex flex-col items-center justify-center text-slate-800">
               <Cloud size={80} strokeWidth={1} className="mb-6 opacity-20" />
               <p className="text-[12px] font-black uppercase tracking-[0.5em]">Coffre-fort vide</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AJOUT */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="fixed inset-0 cursor-pointer" onClick={() => setShowAddModal(false)}></div>
          <div className="modal-container max-w-lg">
            <div className="relative glass w-full transform rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.9)] animate-fade-in">
               <div className="flex justify-between items-start mb-10">
                 <h3 className="text-3xl font-extrabold text-white uppercase tracking-tight">Indexation iV</h3>
                 <button onClick={() => setShowAddModal(false)} className="w-12 h-12 glass text-slate-500 hover:text-white rounded-2xl flex items-center justify-center transition-all"><X size={24}/></button>
               </div>
               <form onSubmit={(e) => { e.preventDefault(); onAddFileLink(formData.name, formData.url); setShowAddModal(false); }} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Désignation</label>
                    <input required className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-sky-400 text-sm transition-all" placeholder="Nom de l'actif" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2">Lien Cloud</label>
                    <input required className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-sky-400 text-sm transition-all" placeholder="URL" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                 </div>
                 <button className="w-full py-7 bg-sky-400 text-white font-black rounded-[2.5rem] shadow-2xl shadow-sky-400/30 active-scale uppercase text-[12px] tracking-[0.4em] mt-4">Confirmer Indexation</button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
