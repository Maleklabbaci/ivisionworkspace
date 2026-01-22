
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Hash, Lock, Plus, X, Search, CheckCheck, Users, UserPlus, Trash2, Globe, AlertTriangle, Check, Clock, ShieldAlert, Layers, ChevronRight, ArrowLeft } from 'lucide-react';
import { Message, User, Channel, UserRole, Task, TaskStatus, Project } from '../types';
import Modal from './Modal';

const Chat: React.FC<any> = ({ 
  currentUser, 
  users = [], 
  tasks = [], 
  channels = [], 
  projects = [], 
  currentChannelId, 
  messages = [], 
  onChannelChange, 
  onSendMessage, 
  onMarkAsRead, 
  onAddChannel, 
  onDeleteChannel, 
  onUpdateChannelMembers 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // States for Mentions
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<Task | null>(null);
  const [drillDownProject, setDrillDownProject] = useState<Project | null>(null);
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

  useEffect(() => {
    const unreadIds = activeMessages
      .filter((m: any) => !m.readBy?.includes(currentUser.id))
      .map((m: any) => m.id);
    
    if (unreadIds.length > 0) {
      onMarkAsRead(unreadIds);
    }
  }, [activeMessages, currentUser.id, onMarkAsRead]);

  const mentionSuggestions = useMemo(() => {
    if (!showMentionDropdown) return [];
    const q = mentionQuery.toLowerCase();
    
    if (drillDownProject) {
      return tasks
        .filter((t: Task) => t.projectId === drillDownProject.id && t.status !== TaskStatus.DONE && t.title.toLowerCase().includes(q))
        .map(t => ({ id: t.id, label: t.title, type: 'task' as const, task: t }));
    }

    const projectSuggestions = projects
      .filter((p: Project) => p.name.toLowerCase().includes(q))
      .map(p => ({ id: p.id, label: p.name, type: 'project' as const, project: p }));

    const userSuggestions = users
      .filter((u: User) => u.name.toLowerCase().replace(/\s+/g, '').includes(q))
      .map(u => ({ id: u.id, label: u.name, type: 'user' as const }));

    return [...projectSuggestions, ...userSuggestions].slice(0, 8);
  }, [mentionQuery, showMentionDropdown, drillDownProject, tasks, projects, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentChannelId) return;
    onSendMessage(newMessage, currentChannelId);
    setNewMessage('');
    resetMentionState();
  };

  const resetMentionState = () => {
    setShowMentionDropdown(false);
    setShowStatusDropdown(false);
    setDrillDownProject(null);
    setSelectedTaskForStatus(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    setNewMessage(value);

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
    resetMentionState();
  };

  const insertMention = (label: string, actionText?: string) => {
    const sanitizedLabel = label.replace(/\s+/g, '');
    const beforeAt = newMessage.substring(0, mentionStartIndex);
    const afterCursor = newMessage.substring(inputRef.current?.selectionStart || 0);
    const suffix = actionText ? ` ${actionText}` : "";
    const newValue = `${beforeAt}@${sanitizedLabel}${suffix} ${afterCursor}`;
    setNewMessage(newValue);
    resetMentionState();
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleMentionSelect = (suggestion: any) => {
    if (suggestion.type === 'project') {
      setDrillDownProject(suggestion.project);
      setSelectedMentionIndex(0);
      setMentionQuery('');
    } else if (suggestion.type === 'task') {
      setSelectedTaskForStatus(suggestion.task);
      setShowStatusDropdown(true);
      setShowMentionDropdown(false);
    } else {
      insertMention(suggestion.label);
    }
  };

  const handleStatusSelect = (statusLabel: string) => {
    if (!selectedTaskForStatus) return;
    insertMention(selectedTaskForStatus.title, statusLabel);
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
        resetMentionState();
      } else if (e.key === 'Backspace' && mentionQuery === '' && drillDownProject) {
        setDrillDownProject(null);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const namePart = part.substring(1).toLowerCase();
        const isUserMention = users.some((u: User) => u.name.toLowerCase().replace(/\s+/g, '') === namePart);
        const isTaskMention = tasks.some((t: Task) => t.title.toLowerCase().replace(/\s+/g, '') === namePart);

        if (isUserMention) {
          return <span key={i} className="text-sky-400 font-bold hover:underline cursor-pointer">@{part.substring(1)}</span>;
        } else if (isTaskMention) {
          return <span key={i} className="text-emerald-400 font-bold hover:underline cursor-pointer">@{part.substring(1)}</span>;
        }
      }
      return part;
    });
  };

  const formatReadBy = (readBy: string[]) => {
    const others = readBy?.filter(id => id !== currentUser.id) || [];
    if (others.length === 0) return null;
    const names = others.map(id => users.find((u:any) => u.id === id)?.name || "Utilisateur").filter(Boolean);
    if (names.length === 0) return null;
    return `Vu par ${names.join(', ')}`;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-[2.5rem] overflow-hidden animate-fade-in border border-white/5 shadow-2xl relative bg-slate-950/20 backdrop-blur-md">
      {/* SIDEBAR */}
      <div className="hidden md:flex flex-col w-72 border-r border-white/5 bg-slate-900/40 text-left">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-black text-white text-[11px] uppercase tracking-[0.2em] leading-none">CANAUX iV</h2>
            {canManageChannels && (
              <button onClick={() => setShowAddChannel(true)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-95"><Plus size={20}/></button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
            {visibleChannels.map((channel: Channel) => (
                <button 
                  key={channel.id} 
                  onClick={() => onChannelChange(channel.id)} 
                  className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all group relative ${currentChannelId === channel.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  {currentChannelId === channel.id && <div className="absolute left-0 top-3 bottom-3 w-1 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>}
                  {channel.is_private ? <Lock size={16} className="mr-3 text-sky-400" /> : <Hash size={18} className="mr-3 opacity-50 text-slate-400" />}
                  <span className="text-sm font-bold truncate uppercase tracking-tight">{channel.name}</span>
                </button>
            ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-slate-950/40 backdrop-blur-xl">
        <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between z-10 text-left">
            <div className="flex items-center space-x-4 truncate">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sky-400">
                {activeChannel?.is_private ? <Lock size={18}/> : <Hash size={20}/>}
              </div>
              <div className="truncate">
                <h2 className="font-black text-white text-lg tracking-tight uppercase leading-none">{activeChannel?.name || 'Sélectionnez un canal'}</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Flux de communication sécurisé</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {(activeChannel?.created_by === currentUser.id || isAdmin) && currentChannelId && (
                <>
                  <button onClick={() => setShowManageMembers(true)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-xl" title="Gérer les membres"><UserPlus size={18}/></button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all hover:bg-rose-500/10 rounded-xl" title="Supprimer le canal"><Trash2 size={18}/></button>
                </>
              )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar text-left">
            {activeMessages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-slate-500 flex items-center justify-center mb-6">
                    <Send size={32} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">Début de la transmission</p>
               </div>
            ) : (
              activeMessages.map((msg: any, idx: number) => {
                  const prevMsg = activeMessages[idx-1];
                  const isSameAuthor = prevMsg && prevMsg.userId === msg.userId && (new Date(msg.fullTimestamp).getTime() - new Date(prevMsg.fullTimestamp).getTime() < 300000);
                  const sender = users.find((u: any) => u.id === msg.userId);
                  const readByText = formatReadBy(msg.readBy);

                  return (
                      <div key={msg.id} className={`group flex flex-col ${!isSameAuthor ? 'mt-2' : '-mt-4'}`}>
                          {!isSameAuthor && (
                            <div className="flex items-center space-x-3 mb-2 px-1">
                               <img src={sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.name || 'U')}`} className="w-8 h-8 rounded-lg object-cover border border-white/10" alt="" />
                               <span className="text-[12px] font-black text-white uppercase tracking-tight">{sender?.name}</span>
                               <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{msg.timestamp}</span>
                            </div>
                          )}
                          <div className={`relative ${!isSameAuthor ? 'ml-0' : 'ml-0'}`}>
                              <div className={`inline-block max-w-[85%] px-5 py-3.5 rounded-[1.25rem] text-[14px] leading-relaxed font-medium transition-all ${msg.userId === currentUser.id ? 'bg-sky-500/10 text-sky-100 border border-sky-400/20 shadow-[0_0_20px_rgba(14,165,233,0.05)]' : 'bg-white/[0.03] text-slate-200 border border-white/5'}`}>
                                {renderContentWithMentions(msg.content)}
                              </div>
                              {readByText && <div className="text-[9px] text-slate-700 font-bold uppercase mt-1.5 ml-2 tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">{readByText}</div>}
                          </div>
                      </div>
                  );
              })
            )}
            <div ref={messagesEndRef} />
        </div>

        {currentChannelId && (
          <footer className="p-6 md:p-10 relative">
            {/* Mentions Dropdown redesign */}
            {showMentionDropdown && mentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-10 right-10 mb-4 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 animate-slide-up ring-1 ring-white/10">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center space-x-3 text-sky-400">
                      {drillDownProject && (
                        <button onClick={() => setDrillDownProject(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft size={14}/></button>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {drillDownProject ? `LOTS: ${drillDownProject.name}` : 'SMART SELECTOR'}
                      </span>
                    </div>
                </div>
                <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                  {mentionSuggestions.map((suggestion, index) => (
                    <button key={suggestion.id} onClick={() => handleMentionSelect(suggestion)} onMouseEnter={() => setSelectedMentionIndex(index)} className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-all ${index === selectedMentionIndex ? 'bg-sky-500/10' : 'hover:bg-white/5'}`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${suggestion.type === 'task' ? 'bg-rose-500/10 text-rose-400' : suggestion.type === 'project' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'}`}>
                          {suggestion.type === 'task' ? <Check size={18} /> : suggestion.type === 'project' ? <Layers size={18}/> : <Users size={18} />}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-black text-white truncate uppercase tracking-tight leading-none">{suggestion.label}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">{suggestion.type === 'task' ? 'Flux Opérationnel' : suggestion.type === 'project' ? 'Architecture Projet' : 'Membre Agence'}</p>
                        </div>
                      </div>
                      {suggestion.type === 'project' && <ChevronRight size={16} className="text-slate-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Selector redesign */}
            {showStatusDropdown && selectedTaskForStatus && (
              <div className="absolute bottom-full left-10 right-10 mb-4 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                <div className="p-6 border-b border-white/5 text-left bg-white/[0.02]">
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">Action Smart Protocol</span>
                  <h4 className="text-white font-black text-lg uppercase tracking-tight mt-1.5 truncate">{selectedTaskForStatus.title}</h4>
                </div>
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-950/20">
                  {[
                    { label: 'TERMINÉ', color: 'bg-emerald-500 text-white shadow-emerald-500/20', icon: Check },
                    { label: 'EN COURS', color: 'bg-sky-500 text-white shadow-sky-500/20', icon: Clock },
                    { label: 'BLOQUÉ', color: 'bg-rose-500 text-white shadow-rose-500/20', icon: AlertTriangle },
                    { label: 'PROBLÈME', color: 'bg-rose-600 text-white shadow-rose-600/20', icon: ShieldAlert }
                  ].map((opt) => (
                    <button key={opt.label} onClick={() => handleStatusSelect(opt.label)} className={`flex flex-col items-center justify-center p-5 rounded-2xl transition-all active-scale ${opt.color} hover:brightness-110`}>
                      <opt.icon size={22} className="mb-2" />
                      <span className="text-[8px] font-black tracking-widest uppercase">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 bg-white/[0.03] border border-white/5 rounded-3xl p-2.5 shadow-2xl focus-within:border-sky-500/50 transition-all">
                <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl active:scale-90"><Paperclip size={20} /></button>
                <input ref={inputRef} value={newMessage} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={`Envoyer un message sécurisé dans #${activeChannel?.name || '...'}`} className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium text-white placeholder-slate-600 px-2 outline-none" />
                <button onClick={handleSend} disabled={!newMessage.trim() || !currentChannelId} className="w-12 h-12 bg-sky-500 text-white rounded-2xl shadow-xl shadow-sky-500/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-100"><Send size={20} strokeWidth={2.5}/></button>
            </div>
          </footer>
        )}
      </div>

      {/* MODALS */}
      <Modal isOpen={showAddChannel} onClose={() => setShowAddChannel(false)} title="Nouveau Canal">
        <div className="space-y-6 text-left p-2">
          <div>
            <label className="label-iv">IDENTIFIANT DU CANAL</label>
            <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="input-iv uppercase" placeholder="EX: STRATÉGIE_PROJET" />
          </div>
          <div className="flex items-center justify-between p-5 bg-white/5 rounded-[1.75rem] border border-white/5 cursor-pointer hover:bg-white/10 transition-all group" onClick={() => setIsPrivate(!isPrivate)}>
             <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isPrivate ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-white/5 text-slate-500'}`}>{isPrivate ? <Lock size={20}/> : <Globe size={20}/>}</div>
                <div>
                  <p className="text-[12px] font-black text-white uppercase leading-none">{isPrivate ? 'Canal Privé' : 'Canal Public'}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">{isPrivate ? 'Membres invités uniquement' : 'Visible par toute l\'agence'}</p>
                </div>
             </div>
             <div className={`w-12 h-6 rounded-full p-1.5 transition-colors ${isPrivate ? 'bg-sky-500' : 'bg-white/10'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`} /></div>
          </div>
          <button onClick={() => { onAddChannel({name: newChannelName.toUpperCase().replace(/\s+/g, '_'), is_private: isPrivate, created_by: currentUser.id, member_ids: [currentUser.id]}); setShowAddChannel(false); setNewChannelName(''); }} disabled={!newChannelName.trim()} className="w-full py-6 bg-sky-500 text-white font-black rounded-[2rem] shadow-xl shadow-sky-500/20 uppercase text-[11px] tracking-[0.2em] active-scale transition-all hover:bg-sky-400 disabled:opacity-30">ACTIVER LE CANAL</button>
        </div>
      </Modal>
    </div>
  );
};

export default Chat;
