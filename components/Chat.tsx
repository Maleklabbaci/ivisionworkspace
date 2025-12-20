
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

const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Hors ligne";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "En ligne";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
};

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

  const unreadMentionsMap = useMemo(() => {
    const map = new Set<string>();
    const myMentionTag = `@${currentUser.name.replace(/\s+/g, '')}`;
    const storageKey = `ivision_last_read_${currentUser.id}`;
    const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
    channels.forEach(channel => {
        const lastRead = storage[channel.id] || '1970-01-01T00:00:00.000Z';
        if (messages.some(m => m.channelId === channel.id && m.userId !== currentUser.id && new Date(m.fullTimestamp) > new Date(lastRead) && m.content.includes(myMentionTag))) {
            map.add(channel.id);
        }
    });
    return map;
  }, [messages, channels, currentUser]);

  useEffect(() => {
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setLastReadTime(storage[currentChannelId] || '1970-01-01T00:00:00.000Z');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      if (onReadChannel) onReadChannel(currentChannelId);
  }, [currentChannelId, currentUser.id, onReadChannel]);

  const handleSend = () => {
    if (!newMessage.trim() && pendingAttachments.length === 0) return;
    onSendMessage(newMessage, currentChannelId, pendingAttachments);
    setNewMessage('');
    setPendingAttachments([]);
    setShowMentions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNewMessage(val);
      const cursor = e.target.selectionStart;
      const textBeforeCursor = val.substring(0, cursor);
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1];
      if (lastWord.startsWith('@')) {
          setMentionQuery(lastWord.slice(1));
          setShowMentions(true);
      } else {
          setShowMentions(false);
      }
  };

  const insertMention = (user: User) => {
      const mentionTag = `@${user.name.replace(/\s+/g, '')} `;
      const cursor = inputRef.current?.selectionStart || newMessage.length;
      const textBeforeCursor = newMessage.substring(0, cursor);
      const textAfterCursor = newMessage.substring(cursor);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      setNewMessage(textBeforeCursor.substring(0, lastAtIndex) + mentionTag + textAfterCursor);
      setShowMentions(false);
      inputRef.current?.focus();
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

  // Refactored ChannelList to ensure stable typing and avoid JSX inference issues
  const ChannelList = () => {
    const typedChannels = (channels || []) as Channel[];
    const projectChannels = typedChannels.filter(c => c.type === 'project');
    const globalChannels = typedChannels.filter(c => c.type === 'global');

    return (
      <div className="space-y-6">
          <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 px-2 tracking-widest flex justify-between items-center">PROJETS</h3>
              <div className="space-y-1">
                  {projectChannels.map((channel: Channel) => {
                      const isActive = currentChannelId === channel.id;
                      const isUnread = (channel.unread || 0) > 0;
                      return (
                          <button key={channel.id} onClick={() => { onChannelChange(channel.id); setShowMobileSidebar(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all group ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : isUnread ? 'bg-slate-100 text-slate-900 font-black' : 'text-slate-500 hover:bg-slate-50'}`}>
                              <div className="flex items-center truncate">
                                  <Lock size={14} className="mr-3 opacity-50" />
                                  <span className="truncate">{channel.name}</span>
                              </div>
                              {isUnread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                          </button>
                      );
                  })}
              </div>
          </div>
          <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 px-2 tracking-widest">GLOBAL</h3>
              <div className="space-y-1">
                  {globalChannels.map((channel: Channel) => (
                      <button key={channel.id} onClick={() => { onChannelChange(channel.id); setShowMobileSidebar(false); }} className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm transition-all ${currentChannelId === channel.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                          <Hash size={14} className="mr-3 opacity-50" />
                          <span className="truncate">{channel.name}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-white rounded-5xl shadow-2xl border border-slate-100 overflow-hidden relative page-transition">
      <div className="w-72 bg-slate-50 border-r border-slate-100 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-black text-slate-900 text-lg tracking-tighter">Chat</h2>
            {canManageChannels && <button onClick={() => setShowAddChannelModal(true)} className="p-2 bg-white rounded-xl shadow-sm text-primary active-scale"><Plus size={20}/></button>}
        </div>
        <div className="flex-1 overflow-y-auto p-4"><ChannelList /></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center space-x-3">
                <button onClick={() => setShowMobileSidebar(true)} className="md:hidden p-2 text-slate-400"><Menu size={20}/></button>
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100">
                    {activeChannel?.type === 'project' ? <Lock size={18}/> : <Hash size={18}/>}
                </div>
                <div>
                    <h2 className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[140px]">{activeChannel?.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{onlineUserIds.size} Actifs</p>
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
            <div ref={messagesEndRef} />
        </div>

        {/* Improved Text Area & Buttons */}
        <div className="p-4 border-t border-slate-50">
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-2 flex items-end focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30 transition-all duration-300">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-primary active-scale">
                    <Paperclip size={20} />
                    {/* Fixed line 267/263: Property 'name' does not exist on type 'unknown' by adding explicit type hint to the map callback */}
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
                        if(e.target.files) setPendingAttachments(prev => [...prev, ...Array.from(e.target.files!).map((f: File) => f.name)]);
                    }} />
                </button>
                <textarea 
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Écrivez ici..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-900 placeholder-slate-400 py-3 px-2 resize-none max-h-32"
                    rows={1}
                />
                <button onClick={handleSend} className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 active-scale disabled:opacity-50">
                    <Send size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Add Channel Modal */}
      {showAddChannelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-t-5xl md:rounded-5xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-400">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Nouveau Canal</h3>
                      <button onClick={() => setShowAddChannelModal(false)} className="p-2 text-slate-400"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nom du canal</label>
                          <input type="text" required value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl font-bold focus:bg-white focus:border-primary/20 outline-none transition-all text-slate-900" placeholder="Ex: Marketing Ads" />
                      </div>
                      <div className="flex space-x-3">
                          <button type="button" onClick={() => setShowAddChannelModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-3xl transition-all">ANNULER</button>
                          <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/30 active-scale">CRÉER</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
