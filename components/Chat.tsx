
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Hash, Lock, Plus, X, Search, CheckCheck, Users, UserPlus, Trash2, Globe, AlertTriangle, Check, Clock, ShieldAlert, Layers, ChevronRight, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';
import { Message, User, Channel, UserRole, Task, TaskStatus, Project } from '../types';
import Modal from './Modal';

const Chat: React.FC<any> = ({ 
  currentUser, users = [], tasks = [], channels = [], projects = [], currentChannelId, messages = [], 
  onChannelChange, onSendMessage, onMarkAsRead, onDeleteMessage, onUpdateTaskStatus, onUpdateTaskPriority,
  onAddChannel, onDeleteChannel, onUpdateChannelMembers 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [drillDownProject, setDrillDownProject] = useState<Project | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // CONSOLE DE PILOTAGE
  const [pendingAction, setPendingAction] = useState<{ task: Task; type: 'done' | 'blocked' | 'urgent' } | null>(null);

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
    const unreadIds = activeMessages.filter((m: any) => !m.readBy?.includes(currentUser.id)).map((m: any) => m.id);
    if (unreadIds.length > 0) onMarkAsRead(unreadIds);
  }, [activeMessages, currentUser.id, onMarkAsRead]);

  const mentionSuggestions = useMemo(() => {
    if (!showMentionDropdown) return [];
    const q = mentionQuery.toLowerCase();
    if (drillDownProject) return tasks.filter((t: Task) => t.projectId === drillDownProject.id && t.status !== TaskStatus.DONE && t.title.toLowerCase().includes(q)).map(t => ({ id: t.id, label: t.title, type: 'task' as const, task: t }));
    const taskSug = tasks.filter((t: Task) => t.title.toLowerCase().includes(q) && t.status !== TaskStatus.DONE).map(t => ({ id: t.id, label: t.title, type: 'task' as const, task: t }));
    const projSug = projects.filter((p: Project) => p.name.toLowerCase().includes(q)).map(p => ({ id: p.id, label: p.name, type: 'project' as const, project: p }));
    const userSug = users.filter((u: User) => u.name.toLowerCase().replace(/\s+/g, '').includes(q)).map(u => ({ id: u.id, label: u.name, type: 'user' as const }));
    return [...taskSug, ...projSug, ...userSug].slice(0, 10);
  }, [mentionQuery, showMentionDropdown, drillDownProject, tasks, projects, users]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentChannelId) return;
    const lowerMsg = newMessage.toLowerCase();
    
    // RECONNAISSANCE DE COMMANDES
    // Cherche une mention de tâche suivie d'un mot clé
    const taskMentionRegex = /@(\w+)/g;
    let match;
    while ((match = taskMentionRegex.exec(lowerMsg)) !== null) {
      const slug = match[1];
      const targetTask = tasks.find(t => t.title.toLowerCase().replace(/\s+/g, '') === slug);
      
      if (targetTask) {
        if (lowerMsg.includes('urgent')) {
          setPendingAction({ task: targetTask, type: 'urgent' });
          return;
        }
        if (lowerMsg.includes('bloquer') || lowerMsg.includes('bloqué') || lowerMsg.includes('bloque')) {
          setPendingAction({ task: targetTask, type: 'blocked' });
          return;
        }
        if (lowerMsg.includes('terminé') || lowerMsg.includes('termine')) {
          setPendingAction({ task: targetTask, type: 'done' });
          return;
        }
      }
    }

    onSendMessage(newMessage, currentChannelId);
    setNewMessage('');
    setShowMentionDropdown(false);
  };

  const executePendingAction = () => {
    if (!pendingAction) return;
    const { task, type } = pendingAction;
    let feedback = "";
    
    if (type === 'done') {
      onUpdateTaskStatus(task.id, TaskStatus.DONE);
      feedback = `✅ MISSION ACCOMPLIE : @${task.title.replace(/\s+/g, '')}`;
    } else if (type === 'urgent') {
      onUpdateTaskPriority(task.id, 'high');
      feedback = `⚡ ALERTE PRIORITAIRE : @${task.title.replace(/\s+/g, '')} passe en priorité HAUTE.`;
    } else if (type === 'blocked') {
      onUpdateTaskStatus(task.id, TaskStatus.BLOCKED);
      feedback = `🚫 ALERTE SYSTÈME : @${task.title.replace(/\s+/g, '')} est désormais BLOQUÉE.`;
    }

    onSendMessage(feedback, currentChannelId);
    setPendingAction(null);
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
      setSelectedMentionIndex(0);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (suggestion: any) => {
    if (suggestion.type === 'project') {
      setDrillDownProject(suggestion.project);
      setMentionQuery('');
    } else {
      const before = newMessage.substring(0, mentionStartIndex);
      const after = newMessage.substring(inputRef.current?.selectionStart || 0);
      setNewMessage(`${before}@${suggestion.label.replace(/\s+/g, '')} ${after}`);
      setShowMentionDropdown(false);
      setDrillDownProject(null);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-[2.5rem] overflow-hidden border border-white/5 relative bg-slate-950/20 backdrop-blur-md">
      {/* SIDEBAR */}
      <div className="hidden md:flex flex-col w-72 border-r border-white/5 bg-slate-900/40 text-left">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-black text-white text-[11px] uppercase tracking-[0.2em]">CANAUX iV</h2>
            {isAdmin && <button onClick={() => setShowAddChannel(true)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"><Plus size={20}/></button>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
            {channelsWithStatus.map((ch: any) => (
                <button key={ch.id} onClick={() => onChannelChange(ch.id)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${currentChannelId === ch.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                  <div className="flex items-center truncate">
                    {ch.is_private ? <Lock size={16} className="mr-3 text-sky-400" /> : <Hash size={18} className="mr-3 opacity-50" />}
                    <span className="text-sm font-bold truncate uppercase tracking-tight">{ch.name}</span>
                  </div>
                  {ch.unreadCount > 0 && <div className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black text-white ${ch.hasMention ? 'bg-rose-500' : 'bg-sky-500'}`}>{ch.unreadCount}</div>}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-950/40">
        <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between text-left">
            <div className="flex items-center space-x-4 truncate">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sky-400">{activeChannel?.is_private ? <Lock size={18}/> : <Hash size={20}/>}</div>
              <h2 className="font-black text-white text-lg tracking-tight uppercase leading-none">{activeChannel?.name || 'Sélectionnez un canal'}</h2>
            </div>
            {isAdmin && currentChannelId && <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-400"><Trash2 size={18}/></button>}
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 no-scrollbar text-left bg-[#0A0F1E]/40">
            {activeMessages.map((msg: any, idx: number) => {
                const isMine = msg.userId === currentUser.id;
                const sender = users.find((u: any) => u.id === msg.userId);
                return (
                    <div key={msg.id} className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'} mt-6 animate-fade-in`}>
                        {!isMine && <div className="flex items-center space-x-3 mb-2 ml-1"><img src={sender?.avatar} className="w-6 h-6 rounded-lg object-cover" alt="" /><span className="text-[10px] font-black text-slate-400 uppercase">{sender?.name}</span></div>}
                        <div className={`group relative flex items-center ${isMine ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] md:max-w-[70%]`}>
                            <div className={`px-5 py-3 rounded-[1.5rem] text-[14px] font-medium shadow-sm transition-all ${isMine ? 'bg-sky-500 text-white rounded-tr-[0.3rem]' : 'bg-white/[0.05] text-slate-200 rounded-tl-[0.3rem]'}`}>
                              {msg.content.split(/(@\w+)/g).map((part, i) => {
                                if (part.startsWith('@')) {
                                  const target = tasks.find(t => t.title.toLowerCase().replace(/\s+/g, '') === part.substring(1).toLowerCase());
                                  if (target) return <span key={i} className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg font-black mx-1 ${target.status === TaskStatus.BLOCKED ? 'bg-rose-500 text-white animate-pulse' : target.priority === 'high' ? 'bg-amber-500 text-slate-900' : 'bg-white/10 text-white'}`}><ShieldAlert size={12}/><span>{part}</span></span>;
                                  return <span key={i} className="text-sky-300 font-bold">{part}</span>;
                                }
                                return part;
                              })}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 px-3">
                              {(isMine || isAdmin) && <button onClick={() => confirm('Supprimer ce message ?') && onDeleteMessage(msg.id)} className="p-1.5 text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>}
                              <span className="text-[9px] font-bold text-slate-600 uppercase whitespace-nowrap">{msg.timestamp}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {currentChannelId && (
          <footer className="p-6 md:p-10 relative">
            {showMentionDropdown && (
              <div className="absolute bottom-full left-10 right-10 mb-4 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center space-x-3 text-sky-400">
                      {drillDownProject && <button onClick={() => setDrillDownProject(null)} className="p-1.5 hover:bg-white/10 rounded-lg"><ArrowLeft size={14}/></button>}
                      <span className="text-[10px] font-black uppercase">COMMANDE iV SYSTEM</span>
                    </div>
                </div>
                <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                  {mentionSuggestions.map((s:any, i) => (
                    <button key={s.id} onClick={() => handleMentionSelect(s)} className={`w-full flex items-center px-6 py-3.5 text-left hover:bg-sky-500/10 transition-all`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${s.type === 'task' ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {s.type === 'task' ? <CheckCircle2 size={18} /> : <Users size={18} />}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-black text-white truncate uppercase">{s.label}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{s.type === 'task' ? 'Mission Opérationnelle' : 'Membre Agence'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-4 bg-white/[0.03] border border-white/5 rounded-3xl p-2.5 shadow-2xl focus-within:border-sky-500/50">
                <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white"><Paperclip size={20} /></button>
                <input ref={inputRef} value={newMessage} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Indexez une commande ou un message...`} className="flex-1 bg-transparent text-[14px] text-white placeholder-slate-600 outline-none px-2" />
                <button onClick={handleSend} className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center active-scale transition-all shadow-xl shadow-sky-500/20"><Send size={20}/></button>
            </div>
          </footer>
        )}
      </div>

      <Modal isOpen={!!pendingAction} onClose={() => setPendingAction(null)} title="Exécution Protocol iV">
         <div className="space-y-8 text-center py-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border shadow-2xl animate-pulse-subtle ${
              pendingAction?.type === 'blocked' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-rose-500/20' : 
              pendingAction?.type === 'urgent' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-amber-500/20' :
              'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/20'
            }`}>
              {pendingAction?.type === 'blocked' ? <ShieldAlert size={48}/> : 
               pendingAction?.type === 'urgent' ? <Zap size={48}/> : 
               <Check size={48} strokeWidth={3}/>}
            </div>
            <div>
               <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Vérification de l'Ordre</h4>
               <p className="text-slate-500 text-sm mt-3 px-6">
                 Confirmez-vous le passage de <span className="text-white font-bold">"{pendingAction?.task?.title}"</span> en mode <span className={`uppercase font-black ${
                   pendingAction?.type === 'blocked' ? 'text-rose-500' :
                   pendingAction?.type === 'urgent' ? 'text-amber-500' :
                   'text-emerald-500'
                 }`}>{
                   pendingAction?.type === 'blocked' ? 'Bloqué (URGENT)' :
                   pendingAction?.type === 'urgent' ? 'Haute Priorité' :
                   'Clôturé'
                 }</span> ?
               </p>
            </div>
            <div className="flex gap-4 px-2">
               <button onClick={() => setPendingAction(null)} className="flex-1 py-5 glass rounded-2xl font-black uppercase text-[10px] text-slate-400 active-scale">Avorter</button>
               <button onClick={executePendingAction} className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] shadow-2xl active-scale transition-all ${
                 pendingAction?.type === 'blocked' ? 'bg-rose-500 text-white hover:bg-rose-400' : 
                 pendingAction?.type === 'urgent' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 
                 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
               }`}>Appliquer Protocol</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={showAddChannel} onClose={() => setShowAddChannel(false)} title="Activation Flux iV">
        <div className="space-y-6 text-left">
          <div><label className="label-iv">Identifiant Unique</label><input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="input-iv uppercase" placeholder="NOM_DU_CANAL" /></div>
          <button onClick={() => { onAddChannel({name: newChannelName.toUpperCase().replace(/\s+/g, '_'), is_private: isPrivate, created_by: currentUser.id, member_ids: [currentUser.id]}); setShowAddChannel(false); }} className="w-full py-6 bg-sky-500 text-white font-black rounded-3xl uppercase text-[11px] shadow-xl shadow-sky-500/10 active-scale">Lancer Transmission</button>
        </div>
      </Modal>
    </div>
  );
};

export default Chat;
