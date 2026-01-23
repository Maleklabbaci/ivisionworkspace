import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Hash, Lock, Plus, X, Users, UserPlus, Trash2, Globe, AlertTriangle, Check, Clock, ShieldAlert, CheckCircle2, Zap, HelpCircle, Settings2, UserMinus, ArrowLeft, MessageSquare, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Message, User, Channel, UserRole, Task, TaskStatus, Project } from '../types';
import Modal from './Modal';

const Chat: React.FC<any> = ({ 
  currentUser, users = [], tasks = [], channels = [], projects = [], currentChannelId, messages = [], 
  onChannelChange, onSendMessage, onMarkAsRead, onDeleteMessage, onUpdateTaskStatus, onUpdateTaskPriority,
  onAddChannel, onDeleteChannel, onUpdateChannelMembers 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // État pour les commandes intelligentes en attente de confirmation
  const [pendingCommand, setPendingCommand] = useState<{ task: Task, action: 'terminé' | 'urgent' | 'bloquer' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChannel = useMemo(() => channels.find((c: any) => c.id === currentChannelId), [channels, currentChannelId]);
  const activeMessages = useMemo(() => messages.filter((m: any) => m.channelId === currentChannelId), [messages, currentChannelId]);
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const visibleChannels = useMemo(() => channels.filter((c: Channel) => isAdmin || !c.is_private || c.member_ids?.includes(currentUser.id)), [channels, currentUser, isAdmin]);

  const channelsWithStatus = useMemo(() => visibleChannels.map(c => {
    const channelMessages = messages.filter(m => m.channelId === c.id);
    const unread = channelMessages.filter(m => !m.readBy?.includes(currentUser.id));
    const mentionTag = `@${currentUser.name.toLowerCase().replace(/\s+/g, '')}`;
    const hasMention = unread.some(m => m.content.toLowerCase().includes(mentionTag));
    return { ...c, isUnread: unread.length > 0, unreadCount: unread.length, hasMention };
  }), [visibleChannels, messages, currentUser]);

  useEffect(() => {
    if (activeMessages.length > 0 && currentChannelId) {
      const unreadIds = activeMessages.filter((m: any) => !m.readBy?.includes(currentUser.id)).map((m: any) => m.id);
      if (unreadIds.length > 0) onMarkAsRead(unreadIds);
    }
  }, [activeMessages, currentUser.id, onMarkAsRead, currentChannelId]);

  useEffect(() => {
    if (!isMobileListOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, isMobileListOpen]);

  useEffect(() => {
    if (currentChannelId) setIsMobileListOpen(false);
  }, [currentChannelId]);

  const mentionSuggestions = useMemo(() => {
    if (!showMentionDropdown) return [];
    const q = mentionQuery.toLowerCase();
    const taskSug = tasks.filter((t: Task) => t.title.toLowerCase().includes(q) && t.status !== TaskStatus.DONE).map(t => ({ id: t.id, label: t.title, type: 'task' as const, task: t }));
    const projSug = projects.filter((p: Project) => p.name.toLowerCase().includes(q)).map(p => ({ id: p.id, label: p.name, type: 'project' as const, project: p }));
    const userSug = users.filter((u: User) => u.name.toLowerCase().replace(/\s+/g, '').includes(q)).map(u => ({ id: u.id, label: u.name, type: 'user' as const }));
    return [...taskSug, ...projSug, ...userSug].slice(0, 10);
  }, [mentionQuery, showMentionDropdown, tasks, projects, users]);

  const handleSend = () => {
    const content = newMessage.trim();
    if (!content || !currentChannelId) return;

    // Détection flexible : @MissionAction ou @Mission + Action
    const commandMatch = content.match(/@([^\s+]+)\s*(\+)?\s*(terminé|urgent|bloquer)/i);
    
    if (commandMatch) {
      const taskSlug = commandMatch[1].toLowerCase();
      const action = commandMatch[3].toLowerCase() as 'terminé' | 'urgent' | 'bloquer';
      
      const foundTask = tasks.find((t: Task) => t.title.toLowerCase().replace(/\s+/g, '') === taskSlug);
      
      if (foundTask) {
        setPendingCommand({ task: foundTask, action });
        return;
      }
    }

    onSendMessage(content, currentChannelId);
    setNewMessage('');
    setShowMentionDropdown(false);
  };

  const confirmSmartCommand = () => {
    if (!pendingCommand) return;
    const { task, action } = pendingCommand;

    if (action === 'terminé') {
      onUpdateTaskStatus(task.id, TaskStatus.DONE);
      onSendMessage(`✅ [SYSTÈME] Mission "${task.title}" validée et terminée par @${currentUser.name.replace(/\s+/g, '')}.`, currentChannelId);
    } else if (action === 'urgent') {
      onUpdateTaskPriority(task.id, 'high');
      onSendMessage(`⚡ [URGENT] Alerte prioritaire déclenchée sur "${task.title}". Activation de la signalétique d'urgence globale.`, currentChannelId);
    } else if (action === 'bloquer') {
      onUpdateTaskStatus(task.id, TaskStatus.BLOCKED);
      onSendMessage(`🚨 [CRITIQUE] Mission "${task.title}" BLOQUÉE par @${currentUser.name.replace(/\s+/g, '')}. Le système a été placé en état d'ALERTE ROUGE sur tous les Dashboards.`, currentChannelId);
    }

    setPendingCommand(null);
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setNewMessage(value);
    const lastAt = value.lastIndexOf('@', cursor - 1);
    if (lastAt !== -1 && !value.substring(lastAt + 1, cursor).includes(' ')) {
      setMentionStartIndex(lastAt);
      setMentionQuery(value.substring(lastAt + 1, cursor));
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const toggleMember = (userId: string) => {
    if (!activeChannel) return;
    const currentMembers = Array.isArray(activeChannel.member_ids) ? activeChannel.member_ids : [];
    const newMembers = currentMembers.includes(userId) 
      ? currentMembers.filter(id => id !== userId)
      : [...currentMembers, userId];
    onUpdateChannelMembers(activeChannel.id, newMembers);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/10 relative bg-slate-900/40 backdrop-blur-3xl animate-fade-in shadow-2xl">
      
      {/* SIDEBAR */}
      <div className={`${isMobileListOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-white/5 bg-slate-950/60 text-left transition-all`}>
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
            <h2 className="font-black text-white text-[12px] uppercase tracking-[0.3em]">FLUX iVISION</h2>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowInfo(true)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-sky-400 transition-colors"><HelpCircle size={22}/></button>
              {isAdmin && <button onClick={() => setShowAddChannel(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Plus size={24}/></button>}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 no-scrollbar">
            {channelsWithStatus.map((ch: any) => (
                <button key={ch.id} onClick={() => { onChannelChange(ch.id); setIsMobileListOpen(false); }} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all active-scale ${currentChannelId === ch.id ? 'bg-sky-500 text-white shadow-2xl shadow-sky-500/10' : 'text-slate-500 hover:bg-white/5'}`}>
                  <div className="flex items-center truncate">
                    {ch.is_private ? <Lock size={18} className={`mr-4 ${currentChannelId === ch.id ? 'text-white' : 'text-sky-400'}`} /> : <Hash size={20} className="mr-4 opacity-50" />}
                    <span className="text-[13px] font-black truncate uppercase tracking-tight">{ch.name}</span>
                  </div>
                  {ch.unreadCount > 0 && <div className={`flex items-center justify-center min-w-[22px] h-5.5 px-2 rounded-full text-[10px] font-black text-white ${ch.hasMention ? 'bg-rose-500' : 'bg-sky-400'}`}>{ch.unreadCount}</div>}
                </button>
            ))}
        </div>
      </div>

      {/* ZONE CONVERSATION */}
      <div className={`${!isMobileListOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-slate-950/20 relative`}>
        <header className="px-6 md:px-10 py-5 border-b border-white/5 flex items-center justify-between text-left backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center space-x-4 truncate">
              <button onClick={() => setIsMobileListOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center text-slate-400 active:text-white"><ArrowLeft size={24}/></button>
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sky-400 border border-white/10 shadow-inner">{activeChannel?.is_private ? <Lock size={18}/> : <Hash size={20}/>}</div>
                <h2 className="font-black text-white text-lg tracking-tighter uppercase truncate leading-none">{activeChannel?.name || 'Canal'}</h2>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {(isAdmin || activeChannel?.created_by === currentUser.id) && currentChannelId && (
                <button onClick={() => setShowChannelSettings(true)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white active-scale transition-all"><Settings2 size={22}/></button>
              )}
              {isAdmin && currentChannelId && (
                <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-400 active-scale transition-colors"><Trash2 size={20}/></button>
              )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-6 md:space-y-8 no-scrollbar text-left bg-[#0A0F1E]/20 relative">
            {activeMessages.map((msg: any) => {
                const isMine = msg.userId === currentUser.id;
                const sender = users.find((u: any) => u.id === msg.userId);
                return (
                    <div key={msg.id} className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'} animate-fade-in`}>
                        {!isMine && <div className="flex items-center space-x-3 mb-2 ml-1"><img src={sender?.avatar} className="w-6 h-6 rounded-lg bg-slate-800 border border-white/10 object-cover" alt="" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sender?.name}</span></div>}
                        <div className={`group relative flex items-end ${isMine ? 'flex-row-reverse' : 'flex-row'} max-w-[92%] md:max-w-[80%]`}>
                            <div className={`px-5 py-3.5 rounded-[1.8rem] text-[14px] md:text-[15px] font-semibold shadow-2xl transition-all leading-relaxed ${isMine ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white/5 text-slate-200 border border-white/5 rounded-bl-none'}`}>
                              {msg.content}
                            </div>
                            <div className={`opacity-0 group-hover:opacity-100 transition-all flex items-center space-x-2 px-2 ${isMine ? 'mr-2' : 'ml-2'}`}>
                              {(isMine || isAdmin) && <button onClick={() => confirm('Supprimer message ?') && onDeleteMessage(msg.id)} className="p-1.5 text-slate-700 hover:text-rose-400"><Trash2 size={14} /></button>}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {currentChannelId && (
          <footer className="p-5 md:p-12 relative backdrop-blur-3xl bg-slate-950/60 border-t border-white/5">
            {showMentionDropdown && (
              <div className="absolute bottom-full left-5 right-5 mb-4 bg-[#0F172A] border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-slide-up">
                <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                  {mentionSuggestions.map((s:any) => (
                    <button key={s.id} onClick={() => {
                        const before = newMessage.substring(0, mentionStartIndex);
                        const after = newMessage.substring(inputRef.current?.selectionStart || 0);
                        setNewMessage(`${before}@${s.label.replace(/\s+/g, '')} ${after}`);
                        setShowMentionDropdown(false);
                        setTimeout(() => inputRef.current?.focus(), 10);
                    }} className={`w-full flex items-center px-6 py-4 text-left hover:bg-sky-500/10 transition-all`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${s.type === 'task' ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {s.type === 'task' ? <CheckCircle2 size={18} /> : <Users size={18} />}
                      </div>
                      <p className="text-[14px] font-black text-white truncate uppercase">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3 bg-white/[0.04] border border-white/10 rounded-[2rem] p-2 shadow-2xl focus-within:border-sky-500/40 transition-all">
                <input ref={inputRef} value={newMessage} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Message...`} className="flex-1 bg-transparent text-[15px] text-white placeholder-slate-700 outline-none px-4 font-medium h-12" />
                <button onClick={handleSend} className="w-12 h-12 bg-sky-500 text-white rounded-[1.2rem] flex items-center justify-center active-scale transition-all shadow-xl hover:bg-sky-400"><Send size={20}/></button>
            </div>
          </footer>
        )}
      </div>

      {/* CONFIRMATION DE COMMANDE STRATÉGIQUE */}
      <Modal isOpen={!!pendingCommand} onClose={() => setPendingCommand(null)} title="Panneau de Contrôle" subtitle="Validation d'ordre opérationnel">
         <div className="space-y-8 text-left py-4">
            <div className={`p-8 rounded-[2.5rem] border flex items-center space-x-6 ${pendingCommand?.action === 'bloquer' ? 'bg-rose-500/10 border-rose-500/30 ring-4 ring-rose-500/20' : pendingCommand?.action === 'urgent' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
               <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${pendingCommand?.action === 'bloquer' ? 'bg-rose-500 text-white animate-pulse' : pendingCommand?.action === 'urgent' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'}`}>
                  {pendingCommand?.action === 'bloquer' ? <AlertCircle size={40} /> : pendingCommand?.action === 'urgent' ? <Zap size={40} fill="currentColor" /> : <CheckCircle2 size={40} />}
               </div>
               <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Passer en {pendingCommand?.action.toUpperCase()}</h4>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3 truncate max-w-[200px]">Mission: {pendingCommand?.task.title}</p>
               </div>
            </div>

            <div className="space-y-4 px-4 text-slate-400 text-sm leading-relaxed font-medium">
               <p>Cette action va modifier l'état de la mission en temps réel sur tout le réseau iVISION.</p>
               {pendingCommand?.action === 'bloquer' && <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">🚨 ATTENTION: Déclenchera l'état d'ALERTE ROUGE global sur tous les écrans.</p>}
               {pendingCommand?.action === 'urgent' && <p className="text-amber-400 font-bold uppercase tracking-widest text-xs">⚡ ALERTE: La mission passera en priorité critique (glow doré actif).</p>}
               {pendingCommand?.action === 'terminé' && <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">✅ ARCHIVE: Validera définitivement l'exécution du briefing.</p>}
            </div>

            <div className="flex flex-col gap-3">
               <button onClick={confirmSmartCommand} className={`w-full py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl active-scale transition-all ${pendingCommand?.action === 'bloquer' ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' : pendingCommand?.action === 'urgent' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'}`}>Propager l'Ordre</button>
               <button onClick={() => setPendingCommand(null)} className="w-full py-5 glass rounded-2xl font-black uppercase text-[11px] text-slate-500 active-scale border border-white/5">Annuler</button>
            </div>
         </div>
      </Modal>

      {/* ADMIN CANAL */}
      <Modal isOpen={showChannelSettings} onClose={() => setShowChannelSettings(false)} title="Pilotage Canal" subtitle="Sécurité & Accès">
         <div className="space-y-8 text-left">
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <h4 className="label-iv mb-4 font-black text-sky-400">Verrouillage Flux</h4>
                <button 
                  onClick={() => onAddChannel({ ...activeChannel, is_private: !activeChannel?.is_private })}
                  className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between ${activeChannel?.is_private ? 'bg-sky-500/10 border-sky-400/20 text-sky-400' : 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400'}`}
                >
                  <div className="flex items-center space-x-3">
                    {activeChannel?.is_private ? <Lock size={20}/> : <Globe size={20}/>}
                    <p className="font-black uppercase text-[12px]">{activeChannel?.is_private ? 'Flux Privé' : 'Flux Public'}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-1 transition-all ${activeChannel?.is_private ? 'bg-sky-500' : 'bg-white/10'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${activeChannel?.is_private ? 'translate-x-5' : 'translate-x-0'}`} /></div>
                </button>
            </div>
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <h4 className="label-iv mb-4 font-black text-sky-400">Membres Habilités</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                  {users.map((u: User) => (
                    <div key={u.id} className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex items-center space-x-3">
                        <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                        <p className="font-black text-white text-[11px] uppercase truncate max-w-[120px]">{u.name}</p>
                      </div>
                      <button onClick={() => toggleMember(u.id)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${activeChannel?.member_ids?.includes(u.id) ? 'bg-emerald-500 text-white' : 'glass text-slate-600'}`}>{activeChannel?.member_ids?.includes(u.id) ? <Check size={18}/> : <Plus size={18}/>}</button>
                    </div>
                  ))}
                </div>
            </div>
         </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Révoquer le Canal">
         <div className="space-y-8 text-center py-4">
            <div className="w-24 h-24 rounded-full bg-rose-500/10 border-4 border-rose-500/20 flex items-center justify-center mx-auto text-rose-500 animate-pulse"><AlertTriangle size={48}/></div>
            <p className="text-slate-400 text-base leading-relaxed px-6 font-medium">Voulez-vous vraiment détruire tout l'historique du canal <span className="text-white font-black">"#{activeChannel?.name}"</span> ?</p>
            <div className="flex flex-col gap-3">
               <button onClick={() => { onDeleteChannel(currentChannelId); setShowDeleteConfirm(false); setIsMobileListOpen(true); }} className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black uppercase text-[11px] shadow-2xl active-scale">Confirmer Suppression</button>
               <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 glass rounded-2xl font-black uppercase text-[11px] text-slate-500 border border-white/5">Annuler</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={showAddChannel} onClose={() => setShowAddChannel(false)} title="Nouveau Flux iV">
        <div className="space-y-6 text-left">
          <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="input-iv uppercase placeholder-slate-800" placeholder="IDENTIFIANT_CANAL" />
          <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 cursor-pointer" onClick={() => setIsPrivate(!isPrivate)}>
             <div className="flex items-center space-x-3">
               {isPrivate ? <Lock size={20} className="text-sky-400"/> : <Globe size={20} className="text-emerald-400"/>}
               <p className="text-[12px] font-black text-white uppercase">Accès restreint</p>
             </div>
             <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isPrivate ? 'bg-sky-500' : 'bg-white/10'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} /></div>
          </div>
          <button onClick={() => { onAddChannel({name: newChannelName.toUpperCase().replace(/\s+/g, '_'), is_private: isPrivate, created_by: currentUser.id, member_ids: [currentUser.id]}); setShowAddChannel(false); setNewChannelName(''); }} className="w-full py-6 bg-sky-500 text-white font-black rounded-2xl uppercase text-[11px] shadow-2xl active-scale">Créer le Canal</button>
        </div>
      </Modal>
    </div>
  );
};

export default Chat;