
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Smile, Hash, Lock, Search, Bell, MessageSquare, File as FileIcon, Image, Menu, X, Plus, Check, Trash2, AtSign, Eye, Download, Circle } from 'lucide-react';
import { Message, User, Channel, UserRole } from '../types';

interface ChatProps {
  currentUser: User;
  users: User[];
  channels: Channel[];
  currentChannelId: string;
  messages: Message[];
  onlineUserIds: Set<string>;
  onChannelChange: (channelId: string) => void;
  onSendMessage: (text: string, channelId: string, attachments?: string[]) => void;
  onAddChannel: (channel: { name: string; type: 'global' | 'project'; members?: string[] }) => void;
  onDeleteChannel: (channelId: string) => void;
  onReadChannel?: (channelId: string) => void;
}

const ChatMessage = React.memo(({ msg, isMe, sender, isSequence, isNew, showSeparator }: {
    msg: Message, isMe: boolean, sender?: User, isSequence: boolean, isNew: boolean, showSeparator: boolean
}) => {
    const formatMessageContent = (content: string) => {
        const parts = content.split(/(@\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                return <span key={index} className="font-bold text-blue-600 bg-blue-50 rounded px-1 mx-0.5">{part}</span>;
            }
            return part;
        });
    };

    return (
        <React.Fragment>
            {showSeparator && (
                <div className="flex items-center justify-center my-6">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <span className="px-4 text-[10px] font-black text-primary uppercase tracking-widest bg-white">Nouveaux messages</span>
                    <div className="h-px bg-slate-100 flex-1"></div>
                </div>
            )}
            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300 mb-1`}>
                <div className={`flex max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row space-x-3'}`}>
                    {!isMe && !isSequence && <img src={sender?.avatar} className="w-8 h-8 rounded-full mt-1 flex-shrink-0" title={sender?.name} />}
                    {!isMe && isSequence && <div className="w-8 flex-shrink-0" />}
                    <div>
                        {!isMe && !isSequence && (
                            <div className="flex items-center mb-1 ml-1 space-x-2">
                                <p className="text-[10px] font-bold text-slate-500">{sender?.name}</p>
                            </div>
                        )}
                        <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm relative ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                            {formatMessageContent(msg.content)}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`mt-3 pt-3 border-t ${isMe ? 'border-white/10' : 'border-slate-200'} space-y-2`}>
                                    {msg.attachments.map((file, fIdx) => (
                                        <div key={fIdx} className={`flex items-center justify-between p-2.5 rounded-2xl text-xs ${isMe ? 'bg-black/10' : 'bg-white border border-slate-100'}`}>
                                            <div className="flex items-center truncate">
                                                <FileIcon size={14} className="mr-2 flex-shrink-0" />
                                                <span className="truncate font-bold">{file}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className={`text-[9px] mt-1 font-bold ${isMe ? 'text-right text-slate-400' : 'text-slate-400'}`}>{msg.timestamp}</p>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
});

const Chat: React.FC<ChatProps> = ({ currentUser, users, channels, currentChannelId, messages, onlineUserIds, onChannelChange, onSendMessage, onAddChannel, onDeleteChannel, onReadChannel }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'global' | 'project'>('project');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [lastReadTime, setLastReadTime] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeMessages = useMemo(() => messages.filter(m => m.channelId === currentChannelId), [messages, currentChannelId]);
  const activeChannel = channels.find(c => c.id === currentChannelId);
  const canManageChannels = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canManageChannels;

  // SCROLL AUTOMATIQUE ROBUSTE
  useEffect(() => {
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setLastReadTime(storage[currentChannelId] || '1970-01-01T00:00:00.000Z');
      
      const scrollToBottom = () => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      };

      // Un petit délai assure que le DOM est prêt après le rendu des messages
      const timeoutId = setTimeout(scrollToBottom, 100);
      
      if (onReadChannel) onReadChannel(currentChannelId);
      
      return () => clearTimeout(timeoutId);
  }, [currentChannelId, activeMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim() && pendingAttachments.length === 0) return;
    onSendMessage(newMessage, currentChannelId, pendingAttachments);
    setNewMessage('');
    setPendingAttachments([]);
    setShowMentions(false);
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNewMessage(val);
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
  };

  const removePendingAttachment = (idx: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    onAddChannel({
      name: newChannelName,
      type: newChannelType,
      members: selectedMembers
    });
    setShowAddChannelModal(false);
    setNewChannelName('');
    setNewChannelType('project');
    setSelectedMembers([]);
  };

  const isMessageNew = (msg: Message) => msg.userId !== currentUser.id && new Date(msg.fullTimestamp) > new Date(lastReadTime);
  const firstNewMessageIndex = useMemo(() => activeMessages.findIndex(m => isMessageNew(m)), [activeMessages, lastReadTime, currentUser.id]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-white rounded-5xl shadow-2xl border border-slate-100 overflow-hidden relative page-transition">
      
      {showMobileSidebar && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden" onClick={() => setShowMobileSidebar(false)}></div>
      )}

      <div className={`w-72 bg-slate-50 border-r border-slate-100 flex flex-col absolute md:relative inset-y-0 left-0 z-[90] transition-transform duration-300 md:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white md:bg-transparent">
            <h2 className="font-black text-slate-900 text-lg tracking-tighter">Chat</h2>
            {canManageChannels && <button onClick={() => setShowAddChannelModal(true)} className="p-2 bg-white rounded-xl shadow-sm text-primary active-scale"><Plus size={20}/></button>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 px-2 tracking-widest flex justify-between items-center">PROJETS</h3>
                <div className="space-y-1">
                    {channels.filter(c => c.type === 'project').map(channel => {
                        const isActive = currentChannelId === channel.id;
                        return (
                            <button key={channel.id} onClick={() => { onChannelChange(channel.id); setShowMobileSidebar(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all group ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <div className="flex items-center truncate">
                                    <Lock size={14} className="mr-3 opacity-50" />
                                    <span className="truncate font-bold tracking-tight">{channel.name}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center space-x-3">
                <button onClick={() => setShowMobileSidebar(true)} className="md:hidden p-2 text-slate-400"><Menu size={20}/></button>
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100">
                    {activeChannel?.type === 'project' ? <Lock size={18}/> : <Hash size={18}/>}
                </div>
                <div>
                    <h2 className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[140px] uppercase">{activeChannel?.name || 'Sélectionner...'}</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Flux iVISION actif</p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
            {activeMessages.map((msg, idx) => (
                <ChatMessage 
                    key={msg.id}
                    msg={msg}
                    isMe={msg.userId === currentUser.id}
                    sender={users.find(u => u.id === msg.userId)}
                    isSequence={idx > 0 && activeMessages[idx-1].userId === msg.userId}
                    isNew={isMessageNew(msg)}
                    showSeparator={idx === firstNewMessageIndex}
                />
            ))}
            <div ref={messagesEndRef} className="h-2" />
        </div>

        <div className="p-4 border-t border-slate-50 space-y-3">
            {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    {pendingAttachments.map((name, idx) => (
                        <div key={idx} className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600">
                            <FileIcon size={12} className="mr-1.5 text-primary" />
                            <span className="truncate max-w-[100px]">{name}</span>
                            <button onClick={() => removePendingAttachment(idx)} className="ml-2 text-slate-300 hover:text-urgent"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-2 flex items-end focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/20 transition-all duration-300">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-primary active-scale">
                    <Paperclip size={20} />
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
                        if(e.target.files) {
                            const filesArray = Array.from(e.target.files).map((f: File) => f.name);
                            setPendingAttachments(prev => [...prev, ...filesArray]);
                        }
                    }} />
                </button>
                <textarea 
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-900 placeholder-slate-400 py-3 px-2 resize-none max-h-32 min-h-[44px]"
                    rows={1}
                />
                <button 
                  onClick={handleSend} 
                  disabled={!newMessage.trim() && pendingAttachments.length === 0}
                  className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 active-scale disabled:opacity-30 transition-opacity"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
      </div>

      {showAddChannelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-400 pb-10">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Nouveau Canal</h3>
                      <button onClick={() => setShowAddChannelModal(false)} className="p-2 text-slate-400 bg-slate-50 rounded-xl"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                      <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Identité du canal</label>
                          <input type="text" required value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-primary/20 outline-none transition-all text-slate-900 text-sm" placeholder="Ex: Ads-Project-X" />
                      </div>
                      <div className="flex space-x-3">
                          <button type="button" onClick={() => setShowAddChannelModal(false)} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">ANNULER</button>
                          <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active-scale uppercase text-[10px] tracking-widest">CRÉER</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
