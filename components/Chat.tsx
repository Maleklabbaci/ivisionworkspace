
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Hash, Lock, Plus, X, Search, CheckCheck, Users, UserPlus, Trash2, Globe, AlertTriangle, Check, Clock, ShieldAlert } from 'lucide-react';
import { Message, User, Channel, UserRole, Task, TaskStatus } from '../types';
import Modal from './Modal';

const Chat: React.FC<any> = ({ currentUser, users, tasks, channels, currentChannelId, messages, onChannelChange, onSendMessage, onMarkAsRead, onAddChannel, onDeleteChannel, onUpdateChannelMembers }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  
  // States for Mentions
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<Task | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, [channels, currentUser, isAdmin]);

  // Mark messages as read when viewing
  useEffect(() => {
    const unreadIds = activeMessages
      .filter((m: any) => !m.readBy.includes(currentUser.id))
      .map((m: any) => m.id);
    
    if (unreadIds.length > 0) {
      onMarkAsRead(unreadIds);
    }
  }, [activeMessages, currentUser.id, onMarkAsRead]);

  // Mentions Filtering
  const mentionSuggestions = useMemo(() => {
    if (!showMentionDropdown) return [];
    const q = mentionQuery.toLowerCase();
    
    const taskSuggestions = tasks.filter((t: Task) => 
      t.title.toLowerCase().replace(/\s+/g, '').includes(q)
    ).map(t => ({ id: t.id, label: t.title, type: 'task' as const, task: t }));

    const userSuggestions = users.filter((u: User) => 
      u.name.toLowerCase().replace(/\s+/g, '').includes(q)
    ).map(u => ({ id: u.id, label: u.name, type: 'user' as const }));

    return [...taskSuggestions, ...userSuggestions].slice(0, 8);
  }, [mentionQuery, showMentionDropdown, tasks, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentChannelId) return;
    onSendMessage(newMessage, currentChannelId);
    setNewMessage('');
    setShowMentionDropdown(false);
    setShowStatusDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    setNewMessage(value);

    // Logic to detect @ mention trigger
    const lastAtPos = value.lastIndexOf('@', cursorPosition - 1);
    if (lastAtPos !== -1) {
      const textAfterAt = value.substring(lastAtPos + 1, cursorPosition);
      if (!textAfterAt.includes(' ')) {
        setMentionStartIndex(lastAtPos);
        setMentionQuery(textAfterAt);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);
        return;
      }
    }
    setShowMentionDropdown(false);
    setShowStatusDropdown(false);
  };

  const insertMention = (label: string, actionText?: string) => {
    const sanitizedLabel = label.replace(/\s+/g, '');
    const beforeAt = newMessage.substring(0, mentionStartIndex);
    const afterCursor = newMessage.substring(inputRef.current?.selectionStart || 0);
    const suffix = actionText ? ` ${actionText}` : "";
    const newValue = `${beforeAt}@${sanitizedLabel}${suffix} ${afterCursor}`;
    setNewMessage(newValue);
    setShowMentionDropdown(false);
    setShowStatusDropdown(false);
    setSelectedTaskForStatus(null);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleMentionSelect = (suggestion: any) => {
    if (suggestion.type === 'task') {
      setSelectedTaskForStatus(suggestion.task);
      setShowStatusDropdown(true);
      setShowMentionDropdown(false);
    } else {
      insertMention(suggestion.label);
    }
  };

  const handleStatusSelect = (statusLabel: string) => {
    if (!selectedTaskForStatus) return;
    
    if (statusLabel === 'TERMINÉ') {
      if (confirm(`Confirmer que la mission "${selectedTaskForStatus.title}" est terminée ?`)) {
        insertMention(selectedTaskForStatus.title, 'TERMINÉ');
      }
    } else if (statusLabel === 'BLOQUÉ' || statusLabel === 'PROBLÈME') {
      insertMention(selectedTaskForStatus.title, statusLabel);
    } else {
      insertMention(selectedTaskForStatus.title, 'EN COURS');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionDropdown && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev + 1) % mentionSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(mentionSuggestions[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const namePart = part.substring(1).toLowerCase();
        const isUserMention = users.some((u: User) => u.name.toLowerCase().replace(/\s+/g, '') === namePart);
        const isTaskMention = tasks.some((t: Task) => t.title.toLowerCase().replace(/\s+/g, '') === namePart);

        if (isUserMention) {
          return <span key={i} className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-[4px] font-black text-[13px] border border-indigo-500/10">@{part.substring(1)}</span>;
        } else if (isTaskMention) {
          return <span key={i} className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-[4px] font-black text-[13px] border border-rose-500/10">@{part.substring(1)}</span>;
        }
      }
      return part;
    });
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

  const formatReadBy = (readBy: string[]) => {
    const others = readBy.filter(id => id !== currentUser.id);
    if (others.length === 0) return null;
    
    const names = others.map(id => users.find(u => u.id === id)?.name || "Utilisateur").filter(Boolean);
    if (names.length === 0) return null;
    
    return `Vu par ${names.join(', ')}`;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden animate-fade-in border-white/5 shadow-2xl relative bg-[#111214]">
      {/* SIDEBAR COMPACT */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#1E1F22] text-left">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#1E1F22]">
            <div>
              <h2 className="font-black text-white text-[10px] uppercase tracking-widest leading-none">CANAUX iV</h2>
            </div>
            {canManageChannels && (
              <button onClick={() => setShowAddChannel(true)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-all"><Plus size={18}/></button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
            {visibleChannels.map((channel: Channel) => (
                <button 
                  key={channel.id} 
                  onClick={() => onChannelChange(channel.id)} 
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-all group ${currentChannelId === channel.id ? 'bg-[#35373C] text-white shadow-sm' : 'text-slate-500 hover:bg-[#35373C]/50 hover:text-slate-300'}`}
                >
                  {channel.is_private ? <Lock size={16} className="mr-2" /> : <Hash size={18} className="mr-2 opacity-50" />}
                  <span className="text-sm font-bold truncate uppercase tracking-tight">{channel.name}</span>
                </button>
            ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#313338]">
        <header className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#313338] z-10 text-left shadow-sm">
            <div className="flex items-center space-x-3 truncate">
              {activeChannel?.is_private ? <Lock size={20} className="text-slate-400"/> : <Hash size={24} className="text-slate-500"/>}
              <h2 className="font-black text-white text-base md:text-lg tracking-tight uppercase truncate">{activeChannel?.name || 'Canal'}</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {isOwner && currentChannelId && (
                <button onClick={() => setShowManageMembers(true)} className="p-2 text-slate-400 hover:text-white transition-all"><UserPlus size={18}/></button>
              )}
              {isOwner && currentChannelId && (
                 <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate-400 hover:text-rose-400 transition-all"><Trash2 size={18}/></button>
              )}
            </div>
        </header>

        {/* MESSAGES FLOW */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 no-scrollbar text-left">
            {activeMessages.map((msg: any, idx: number) => {
                const prevMsg = activeMessages[idx-1];
                const isSameAuthor = prevMsg && prevMsg.userId === msg.userId && (new Date(msg.fullTimestamp).getTime() - new Date(prevMsg.fullTimestamp).getTime() < 300000);
                const sender = users.find((u: any) => u.id === msg.userId);
                const readByText = formatReadBy(msg.readBy);

                return (
                    <div key={msg.id} className={`group flex flex-col ${!isSameAuthor ? 'mt-4' : 'mt-0.5'} hover:bg-white/[0.01] transition-colors -mx-4 px-8 py-0.5`}>
                        {!isSameAuthor ? (
                          <div className="flex items-start space-x-4">
                            <img src={sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.name || 'U')}`} className="w-10 h-10 rounded-xl flex-shrink-0 mt-1" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-[14px] font-black text-white hover:underline cursor-pointer">{sender?.name}</span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">{msg.timestamp}</span>
                                </div>
                                <div className="text-[14px] text-[#DBDEE1] leading-relaxed font-medium">
                                  {renderContentWithMentions(msg.content)}
                                </div>
                                {readByText && (
                                  <div className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                    {readByText}
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-4 pl-14 relative">
                            <span className="absolute left-4 top-1 text-[8px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase">{msg.timestamp.split(':')[0]}:{msg.timestamp.split(':')[1]}</span>
                            <div className="flex flex-col w-full">
                              <div className="text-[14px] text-[#DBDEE1] leading-relaxed font-medium">
                                 {renderContentWithMentions(msg.content)}
                              </div>
                              {readByText && (
                                <div className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                  {readByText}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* INPUT COMPACT WITH MENTION DROPDOWN */}
        {currentChannelId && (
          <footer className="p-4 bg-[#313338] relative">
            {/* Mention Suggestions Dropdown */}
            {showMentionDropdown && mentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1E1F22] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suggestions de mentions</span>
                  <span className="text-[10px] font-bold text-slate-600">Sélectionner pour options</span>
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                  {mentionSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleMentionSelect(suggestion)}
                      onMouseEnter={() => setSelectedMentionIndex(index)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left transition-all ${index === selectedMentionIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${suggestion.type === 'task' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          {suggestion.type === 'task' ? <Check size={14} /> : <Users size={14} />}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{suggestion.label}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{suggestion.type === 'task' ? 'Mission' : 'Utilisateur'}</p>
                        </div>
                      </div>
                      {index === selectedMentionIndex && <div className="text-sky-400"><Check size={14} strokeWidth={3} /></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Options for Tasks */}
            {showStatusDropdown && selectedTaskForStatus && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1E1F22] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                <div className="p-4 border-b border-white/5 text-left">
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">Action Smart Mention</span>
                  <h4 className="text-white font-black text-base uppercase tracking-tight mt-1 truncate">{selectedTaskForStatus.title}</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-2 bg-[#111214]">
                  {[
                    { label: 'TERMINÉ', color: 'bg-emerald-500 text-white', icon: Check },
                    { label: 'EN COURS', color: 'bg-sky-500 text-white', icon: Clock },
                    { label: 'BLOQUÉ', color: 'bg-rose-500 text-white', icon: AlertTriangle },
                    { label: 'PROBLÈME', color: 'bg-rose-600 text-white', icon: ShieldAlert }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleStatusSelect(opt.label)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all active-scale ${opt.color} hover:brightness-110`}
                    >
                      <opt.icon size={20} className="mb-2" />
                      <span className="text-[9px] font-black tracking-widest uppercase">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowStatusDropdown(false)} 
                  className="w-full py-3 bg-white/5 text-slate-500 font-bold uppercase text-[9px] hover:text-white transition-colors border-t border-white/5"
                >
                  Annuler la mention
                </button>
              </div>
            )}

            <div className="bg-[#383A40] rounded-xl p-3 flex items-center shadow-inner group">
                <button className="p-2 text-slate-400 hover:text-white transition-colors active-scale"><Paperclip size={20} /></button>
                <input 
                    ref={inputRef}
                    value={newMessage} 
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Écrire dans #${activeChannel?.name}...`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium text-white placeholder-[#949BA4] px-4 outline-none"
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="w-10 h-10 text-slate-400 hover:text-white active-scale disabled:opacity-20 transition-all flex items-center justify-center">
                    <Send size={18} />
                </button>
            </div>
          </footer>
        )}
      </div>

      {/* MODAL CANAL */}
      <Modal isOpen={showAddChannel} onClose={closeModals} title="Nouveau Canal">
        <div className="space-y-6 text-left">
          <div className="space-y-1.5">
            <label className="label-iv">NOM DU CANAL</label>
            <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="input-iv" placeholder="Ex: STRATÉGIE_Q4" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all" onClick={() => setIsPrivate(!isPrivate)}>
             <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPrivate ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                   {isPrivate ? <Lock size={18}/> : <Globe size={18}/>}
                </div>
                <div>
                   <p className="text-xs font-black text-white uppercase tracking-widest">{isPrivate ? 'Privé' : 'Public'}</p>
                   <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">L'accès sera restreint.</p>
                </div>
             </div>
             <div className={`w-10 h-5 rounded-full p-1 transition-all ${isPrivate ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-all ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
             </div>
          </div>

          <button onClick={handleCreateChannel} disabled={!newChannelName.trim()} className="w-full py-5 bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl uppercase text-[11px] tracking-[0.3em] transition-all">
            Créer le Canal
          </button>
        </div>
      </Modal>

      {/* MODAL MEMBRES */}
      <Modal isOpen={showManageMembers && !!activeChannel} onClose={closeModals} title="Membres du Canal">
        <div className="flex flex-col h-full max-h-[60vh] text-left">
          <div className="relative mb-5">
             <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
             <input type="text" placeholder="RECHERCHER..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="input-iv pl-12" />
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {filteredUsersForInvite.map((user: User) => {
              const isMember = activeChannel?.member_ids?.includes(user.id);
              const isCreator = activeChannel?.created_by === user.id;
              return (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center space-x-4">
                      <img src={user.avatar} className="w-10 h-10 rounded-xl" alt=""/>
                      <div className="truncate">
                         <p className="text-[11px] font-black text-white uppercase tracking-tighter truncate leading-none">{user.name}</p>
                         <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>
                      </div>
                   </div>
                   {isCreator ? (
                     <span className="text-[7px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">Propriétaire</span>
                   ) : (
                     <button 
                      onClick={() => {
                        const currentIds = activeChannel.member_ids || [];
                        const newIds = isMember ? currentIds.filter(id => id !== user.id) : [...currentIds, user.id];
                        onUpdateChannelMembers(activeChannel.id, newIds);
                      }}
                      className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${isMember ? 'bg-rose-400/10 text-rose-400' : 'bg-emerald-400 text-slate-950'}`}
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
    </div>
  );
};

export default Chat;
