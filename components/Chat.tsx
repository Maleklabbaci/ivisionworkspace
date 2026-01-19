
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Hash, Lock, Plus, X, Search, MoreVertical, CheckCheck, Users, UserPlus, Trash2, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Message, User, Channel, UserRole } from '../types';
import Modal from './Modal';

const Chat: React.FC<any> = ({ currentUser, users, channels, currentChannelId, messages, onChannelChange, onSendMessage, onAddChannel, onDeleteChannel, onUpdateChannelMembers }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = useMemo(() => channels.find((c: any) => c.id === currentChannelId), [channels, currentChannelId]);
  const activeMessages = useMemo(() => messages.filter((m: any) => m.channelId === currentChannelId), [messages, currentChannelId]);
  
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canManageChannels = isAdmin || currentUser.permissions?.canManageChannels;

  const visibleChannels = useMemo(() => {
    return channels.filter((c: Channel) => {
      if (isAdmin) return true;
      if (!c.is_private) return true;
      return c.member_ids?.includes(currentUser.id);
    });
  }, [channels, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentChannelId) return;
    onSendMessage(newMessage, currentChannelId);
    setNewMessage('');
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    onAddChannel({
      name: newChannelName.toUpperCase().replace(/\s+/g, '_'),
      type: isPrivate ? 'project' : 'global',
      is_private: isPrivate,
      created_by: currentUser.id,
      member_ids: [currentUser.id]
    });
    setNewChannelName('');
    setIsPrivate(false);
    setShowAddChannel(false);
  };

  const isOwner = activeChannel?.created_by === currentUser.id || isAdmin;

  const filteredUsersForInvite = useMemo(() => {
    return users.filter((u: User) => u.name.toLowerCase().includes(memberSearch.toLowerCase()));
  }, [users, memberSearch]);

  const closeModals = () => {
    setShowAddChannel(false);
    setShowManageMembers(false);
    setShowDeleteConfirm(false);
    setMemberSearch('');
  };

  return (
    <div className="flex h-[calc(100vh-180px)] glass rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-fade-in border-white/5 shadow-2xl relative">
      <div className="hidden md:flex flex-col w-80 border-r border-white/5 bg-slate-900/30 backdrop-blur-3xl text-left">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="font-black text-white text-[10px] uppercase tracking-[0.3em] leading-none">Canaux iV</h2>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-2 leading-none">Communication Core</p>
            </div>
            {canManageChannels && (
              <button onClick={() => setShowAddChannel(true)} className="w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-xl shadow-lg active-scale hover:scale-105 transition-all flex-shrink-0"><Plus size={20} strokeWidth={3}/></button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
            {visibleChannels.map((channel: Channel) => (
                <button 
                  key={channel.id} 
                  onClick={() => onChannelChange(channel.id)} 
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all relative group ${currentChannelId === channel.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-white/5'}`}
                >
                    <div className="flex items-center space-x-3.5 truncate">
                      {channel.is_private ? <Lock size={15} /> : <Hash size={15} />}
                      <span className="text-xs font-bold truncate uppercase tracking-wider">{channel.name}</span>
                    </div>
                    {channel.id === currentChannelId && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-transparent">
        <header className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-2xl sticky top-0 z-10 text-left">
            <div className="flex items-center space-x-5 truncate">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner border border-indigo-500/10 flex-shrink-0">
                  {activeChannel?.is_private ? <Lock size={22} /> : <Hash size={22} />}
              </div>
              <div className="min-w-0 truncate">
                  <h2 className="font-extrabold text-white text-base md:text-xl tracking-tight uppercase truncate leading-none">{activeChannel?.name || 'Veuillez choisir...'}</h2>
                  <div className="flex items-center space-x-3 mt-2 leading-none">
                    <span className="flex items-center text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]"><Users size={10} className="mr-1.5"/> {activeChannel?.member_ids?.length || 0} Membres</span>
                  </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {isOwner && currentChannelId && (
                <button onClick={() => setShowManageMembers(true)} className="p-3 text-slate-400 hover:text-white glass rounded-xl transition-all active-scale" title="Gérer"><UserPlus size={18}/></button>
              )}
              {isOwner && currentChannelId && (
                 <button onClick={() => setShowDeleteConfirm(true)} className="p-3 text-slate-400 hover:text-rose-400 glass rounded-xl transition-all active-scale" title="Supprimer"><Trash2 size={18}/></button>
              )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-10 no-scrollbar text-left">
            {activeMessages.map((msg: any) => {
                const isMe = msg.userId === currentUser.id;
                const sender = users.find((u: any) => u.id === msg.userId);
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} items-end space-x-4`}>
                            {!isMe && (
                              <img src={sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.name || 'U')}`} className="w-8 h-8 md:w-10 md:h-10 rounded-2xl border border-white/10 shadow-sm mb-1 flex-shrink-0" />
                            )}
                            <div className="space-y-1.5">
                                {!isMe && <p className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 leading-none">{sender?.name}</p>}
                                <div className={`p-4 md:p-6 rounded-2xl md:rounded-[2.2rem] text-[12px] md:text-[14px] leading-relaxed font-medium shadow-sm transition-all hover:shadow-md ${isMe ? 'bg-white text-slate-950 rounded-br-none shadow-xl' : 'bg-slate-900/60 text-slate-200 border border-white/5 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                                <div className={`flex items-center space-x-1.5 ${isMe ? 'justify-end mr-2' : 'ml-2'}`}>
                                    <p className={`text-[7px] md:text-[8px] font-bold text-slate-600 uppercase tracking-widest`}>{msg.timestamp}</p>
                                    {isMe && <CheckCheck size={10} className="text-sky-500" />}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {currentChannelId && (
          <footer className="p-4 md:p-10 bg-slate-950/40 backdrop-blur-3xl border-t border-white/5">
            <div className="bg-white/5 rounded-2xl md:rounded-[2.5rem] p-1.5 md:p-2.5 flex items-center border border-white/5 focus-within:border-indigo-500/50 transition-all shadow-inner">
                <button className="p-3 md:p-5 text-slate-500 hover:text-indigo-400 transition-colors active-scale flex-shrink-0"><Paperclip size={20} /></button>
                <input 
                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[12px] md:text-sm font-bold text-white placeholder-slate-700 px-2 md:px-4"
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500 text-white rounded-xl md:rounded-[1.8rem] shadow-xl shadow-indigo-500/20 active-scale disabled:opacity-20 transition-all flex items-center justify-center flex-shrink-0">
                    <Send size={20} />
                </button>
            </div>
          </footer>
        )}
      </div>

      <Modal 
        isOpen={showAddChannel} 
        onClose={closeModals}
        title="Nouveau Canal"
        subtitle="Architecture iVISION Secure"
      >
        <div className="space-y-6 md:space-y-8 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 px-2 leading-none">Nom de l'espace</label>
            <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-3xl font-bold text-white outline-none focus:border-indigo-500 transition-all text-xs md:text-sm" placeholder="Ex: STRATÉGIE_Q4" />
          </div>
          
          <div className="flex items-center justify-between p-4 md:p-6 bg-white/5 rounded-2xl md:rounded-[2rem] border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all" onClick={() => setIsPrivate(!isPrivate)}>
             <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${isPrivate ? 'bg-indigo-500 text-white shadow-xl' : 'bg-white/5 text-slate-500'}`}>
                   {isPrivate ? <Lock size={18}/> : <Globe size={18}/>}
                </div>
                <div>
                   <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest leading-none">{isPrivate ? 'Verrouillé' : 'Public'}</p>
                   <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 leading-none">{isPrivate ? 'Restreint aux membres' : 'Ouvert à tous'}</p>
                </div>
             </div>
             <div className={`w-10 md:w-12 h-5 md:h-6 rounded-full p-1 transition-all ${isPrivate ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <div className={`w-3 md:w-4 h-3 md:h-4 bg-white rounded-full transition-all ${isPrivate ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
             </div>
          </div>

          <button onClick={handleCreateChannel} disabled={!newChannelName.trim()} className="w-full py-5 md:py-7 bg-indigo-500 text-white font-black rounded-2xl md:rounded-[2.5rem] shadow-2xl active-scale uppercase text-[10px] md:text-[12px] tracking-[0.3em] md:tracking-[0.4em] disabled:opacity-50 transition-all mt-2">
            Déployer le Canal
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={showManageMembers && !!activeChannel} 
        onClose={closeModals}
        title="Accès & Membres"
        subtitle="Sécurisé par iVISION Core"
      >
        <div className="flex flex-col h-full max-h-[60vh] text-left">
          <div className="relative mb-5 flex-shrink-0">
             <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
             <input type="text" placeholder="RECHERCHER..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 md:py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500 transition-all placeholder-slate-800" />
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 md:space-y-3 pr-1">
            {filteredUsersForInvite.map((user: User) => {
              const isMember = activeChannel?.member_ids?.includes(user.id);
              const isCreator = activeChannel?.created_by === user.id;
              return (
                <div key={user.id} className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all">
                   <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                      <img src={user.avatar} className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex-shrink-0" alt=""/>
                      <div className="truncate">
                         <p className="text-[11px] font-black text-white uppercase tracking-tighter truncate leading-none">{user.name}</p>
                         <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-none">{user.role}</p>
                      </div>
                   </div>
                   {isCreator ? (
                     <span className="text-[7px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-400/20">Propriétaire</span>
                   ) : (
                     <button 
                      onClick={() => {
                        const currentIds = activeChannel.member_ids || [];
                        const newIds = isMember ? currentIds.filter(id => id !== user.id) : [...currentIds, user.id];
                        onUpdateChannelMembers(activeChannel.id, newIds);
                      }}
                      className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active-scale ${isMember ? 'bg-rose-400/10 text-rose-400' : 'bg-emerald-400 text-slate-950'}`}
                     >
                       {isMember ? 'Révoquer' : 'Inviter'}
                     </button>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={closeModals}
        maxWidth="max-w-sm"
      >
        <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-6 md:mb-8 shadow-inner border border-rose-500/20">
               <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-3 leading-none">Action Irréversible</h3>
            <p className="text-slate-400 text-[11px] md:text-sm font-medium leading-relaxed mb-8 md:mb-10">La suppression du canal <b>#{activeChannel?.name}</b> effacera tout l'historique.</p>
            <div className="flex flex-col space-y-2 md:space-y-3">
               <button onClick={() => { onDeleteChannel(currentChannelId); closeModals(); }} className="w-full py-4 md:py-5 bg-rose-500 text-white font-black rounded-xl md:rounded-2xl uppercase text-[10px] tracking-widest active-scale hover:bg-rose-600 transition-all shadow-xl">Détruire le Canal</button>
               <button onClick={closeModals} className="w-full py-4 md:py-5 glass text-slate-500 hover:text-white font-black rounded-xl md:rounded-2xl uppercase text-[10px] tracking-widest transition-all">Annuler</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Chat;
