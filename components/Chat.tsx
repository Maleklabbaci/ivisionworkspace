
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

// Fonction utilitaire pour formater le temps depuis la dernière connexion
const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Hors ligne";
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "En ligne"; // Juste au cas où
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
};

// Memoized Chat Message Component for Performance
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
                <div className="flex items-center justify-center my-6 animate-pulse">
                    <div className="h-px bg-red-200 flex-1"></div>
                    <span className="px-3 text-xs font-bold text-red-500 uppercase tracking-widest bg-white">-------------- Nouveaux messages --------------</span>
                    <div className="h-px bg-red-200 flex-1"></div>
                </div>
            )}
            
            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row space-x-3'}`}>
                {!isMe && !isSequence && <img src={sender?.avatar} className="w-8 h-8 rounded-full mt-1 flex-shrink-0" title={sender?.name} />}
                {!isMe && isSequence && <div className="w-8 flex-shrink-0" />}

                <div>
                    {!isMe && !isSequence && (
                        <div className="flex items-center mb-1 ml-1 space-x-2">
                            <p className="text-xs text-slate-500">{sender?.name}</p>
                            {isNew && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">NOUVEAU</span>}
                        </div>
                    )}
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                        {formatMessageContent(msg.content)}
                        
                        {/* Attachments Display */}
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className={`mt-3 pt-2 border-t ${isMe ? 'border-white/20' : 'border-slate-200'} flex flex-col space-y-2`}>
                                {msg.attachments.map((file, fIdx) => (
                                    <div key={fIdx} className={`flex items-center justify-between p-2 rounded-lg text-xs ${isMe ? 'bg-black/10 hover:bg-black/20' : 'bg-white border border-slate-100 hover:shadow-sm'} transition-all group/file cursor-pointer`}>
                                        <div className="flex items-center truncate">
                                            <FileIcon size={14} className="mr-2 opacity-70 flex-shrink-0" />
                                            <span className="truncate font-medium">{file}</span>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover/file:opacity-100 transition-opacity">
                                            <button className="p-1 hover:scale-110"><Eye size={12}/></button>
                                            <button className="p-1 hover:scale-110 ml-1"><Download size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right text-slate-300' : 'text-slate-300'}`}>{msg.timestamp}</p>
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
  
  // Attachments State
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mention State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorIndex, setMentionCursorIndex] = useState(0);
  
  // Unread Logic State
  const [lastReadTime, setLastReadTime] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // MEMOIZE ACTIVE MESSAGES TO PREVENT RE-CALC ON EVERY KEYSTROKE
  const activeMessages = useMemo(() => {
      return messages.filter(m => m.channelId === currentChannelId);
  }, [messages, currentChannelId]);
  
  const activeChannel = channels.find(c => c.id === currentChannelId);

  // Permission Checks: Admin OR Special Permission 'canManageChannels'
  const canManageChannels = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canManageChannels;

  // Calcul des mentions non lues pour l'utilisateur actuel
  const unreadMentionsMap = useMemo(() => {
    const map = new Set<string>();
    const myMentionTag = `@${currentUser.name.replace(/\s+/g, '')}`;
    const storageKey = `ivision_last_read_${currentUser.id}`;
    const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');

    channels.forEach(channel => {
        const lastRead = storage[channel.id] || '1970-01-01T00:00:00.000Z';
        const hasMention = messages.some(m => 
            m.channelId === channel.id &&
            m.userId !== currentUser.id &&
            new Date(m.fullTimestamp) > new Date(lastRead) &&
            m.content.includes(myMentionTag)
        );
        if (hasMention) {
            map.add(channel.id);
        }
    });
    return map;
  }, [messages, channels, currentUser]);

  // Initial Load: Get last read time from storage to display separator
  useEffect(() => {
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const savedTime = storage[currentChannelId] || '1970-01-01T00:00:00.000Z';
      setLastReadTime(savedTime);
      
      // Scroll to bottom initially
      setTimeout(scrollToBottom, 100);

      // Mark as read after a short delay to allow seeing "New"
      const timer = setTimeout(() => {
          if (onReadChannel) onReadChannel(currentChannelId);
      }, 2000);

      return () => clearTimeout(timer);
  }, [currentChannelId]); // Only run when channel changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll on new messages IF we were already at bottom or if it's my message
  useEffect(() => {
      // Simple heuristic: always scroll for now
      scrollToBottom();
  }, [messages]); // Keep simple for scrolling

  const handleSend = () => {
    if (!newMessage.trim() && pendingAttachments.length === 0) return;
    onSendMessage(newMessage, currentChannelId, pendingAttachments);
    setNewMessage('');
    setPendingAttachments([]);
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
             e.preventDefault();
             const filtered = users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()));
             if (filtered.length > 0) {
                 insertMention(filtered[0]);
             }
        } else if (e.key === 'Escape') {
            setShowMentions(false);
        }
        return; 
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNewMessage(val);

      // Mention Logic
      const cursor = e.target.selectionStart;
      const textBeforeCursor = val.substring(0, cursor);
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1];

      if (lastWord.startsWith('@')) {
          const query = lastWord.slice(1);
          setMentionQuery(query);
          setShowMentions(true);
          setMentionCursorIndex(cursor);
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
      const newTextBefore = textBeforeCursor.substring(0, lastAtIndex);
      
      const newValue = newTextBefore + mentionTag + textAfterCursor;
      
      setNewMessage(newValue);
      setShowMentions(false);
      if (inputRef.current) inputRef.current.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // In a real app, you would upload to storage here.
          // Simulating by taking file names.
          const newFiles = Array.from(e.target.files).map((f: any) => f.name);
          setPendingAttachments(prev => [...prev, ...newFiles]);
      }
  };

  const removeAttachment = (index: number) => {
      setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleChannelSelect = (id: string) => {
      // Marquer le canal précédent comme lu avant de changer
      if (currentChannelId) {
          const storageKey = `ivision_last_read_${currentUser.id}`;
          const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
          
          // Enregistrer le timestamp actuel pour le canal qu'on quitte
          storage[currentChannelId] = new Date().toISOString();
          localStorage.setItem(storageKey, JSON.stringify(storage));
          
          // Appeler la fonction parente pour mettre à jour l'état
          if (onReadChannel) onReadChannel(currentChannelId);
      }

      onChannelChange(id);
      setShowMobileSidebar(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newChannelName.trim()) {
        onAddChannel({ 
            name: newChannelName, 
            type: newChannelType, 
            members: newChannelType === 'project' ? [currentUser.id, ...selectedMembers] : undefined
        });
        setShowAddChannelModal(false);
        setNewChannelName('');
        setNewChannelType('project');
        setSelectedMembers([]);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, channelId: string) => {
      e.stopPropagation();
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) {
          onDeleteChannel(channelId);
      }
  };

  const toggleMemberSelection = (userId: string) => {
      if (selectedMembers.includes(userId)) {
          setSelectedMembers(selectedMembers.filter(id => id !== userId));
      } else {
          setSelectedMembers([...selectedMembers, userId]);
      }
  };

  const filteredUsersForMention = useMemo(() => users.filter(u => 
      u.name.toLowerCase().replace(/\s+/g, '').includes(mentionQuery.toLowerCase())
  ), [users, mentionQuery]);

  // Helper to check if message is "New" (newer than last read time)
  const isMessageNew = (msg: Message) => {
      if (msg.userId === currentUser.id) return false;
      return new Date(msg.fullTimestamp) > new Date(lastReadTime);
  };
  
  // Find index of first new message for separator
  const firstNewMessageIndex = useMemo(() => {
      return activeMessages.findIndex(m => isMessageNew(m));
  }, [activeMessages, lastReadTime]);

  const ChannelList = () => (
    <>
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider flex justify-between items-center">
                Projets
                <span className="text-[10px] bg-slate-200 px-1.5 rounded-full text-slate-600">{channels.filter(c => c.type === 'project').length}</span>
            </h3>
            <div className="space-y-1">
                {channels.filter(c => c.type === 'project').map(channel => {
                    const isUnread = (channel.unread || 0) > 0;
                    const hasMention = unreadMentionsMap.has(channel.id);
                    const isActive = currentChannelId === channel.id;
                    return (
                        <button
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                                isActive 
                                ? 'bg-white text-primary shadow-sm font-medium border border-slate-100 translate-x-1' 
                                : isUnread
                                    ? 'text-slate-900 bg-white/50 font-bold border border-transparent' // Highlight row a bit
                                    : 'text-slate-600 hover:bg-white/60 hover:translate-x-1 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center truncate">
                                <Lock size={14} className={`mr-2 flex-shrink-0 ${isUnread ? 'text-orange-500' : 'opacity-50'}`} />
                                <span className={`truncate ${isUnread ? 'text-orange-900 font-extrabold' : ''}`}>{channel.name}</span>
                            </div>
                            <div className="flex items-center">
                                {hasMention && (
                                    <div className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full ml-1 shadow-sm animate-pulse" title="Vous avez été mentionné">
                                        @
                                    </div>
                                )}
                                {isUnread && (
                                    <div className={`flex items-center justify-center text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full ml-1 px-1 shadow-sm animate-in zoom-in duration-300 ${hasMention ? 'bg-red-500' : 'bg-orange-500'}`}>
                                        {channel.unread}
                                    </div>
                                )}
                                {canManageChannels && (
                                    <div onClick={(e) => handleDeleteClick(e, channel.id)} className="ml-2 p-1 text-slate-300 hover:text-urgent hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer"><Trash2 size={12} /></div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Global Channels */}
        <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider">Global</h3>
            <div className="space-y-1">
                {channels.filter(c => c.type === 'global').map(channel => {
                    const isUnread = (channel.unread || 0) > 0;
                    const hasMention = unreadMentionsMap.has(channel.id);
                    const isActive = currentChannelId === channel.id;
                    return (
                        <button
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                                isActive 
                                ? 'bg-white text-primary shadow-sm font-medium border border-slate-100 translate-x-1' 
                                : isUnread
                                    ? 'text-slate-900 bg-white/50 font-bold border border-transparent'
                                    : 'text-slate-600 hover:bg-white/60 hover:translate-x-1 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center">
                                <Hash size={14} className={`mr-2 ${isUnread ? 'text-orange-500' : 'opacity-50'}`} />
                                <span className={isUnread ? 'text-orange-900 font-extrabold' : ''}>{channel.name}</span>
                            </div>
                            <div className="flex items-center">
                                {hasMention && (
                                    <div className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full ml-1 shadow-sm animate-pulse" title="Vous avez été mentionné">
                                        @
                                    </div>
                                )}
                                {isUnread && (
                                    <div className={`flex items-center justify-center text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full ml-1 px-1 shadow-sm animate-in zoom-in duration-300 ${hasMention ? 'bg-red-500' : 'bg-orange-500'}`}>
                                        {channel.unread}
                                    </div>
                                )}
                                {canManageChannels && (
                                    <div onClick={(e) => handleDeleteClick(e, channel.id)} className="ml-2 p-1 text-slate-300 hover:text-urgent hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer"><Trash2 size={12} /></div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-lg">Discussions</h2>
            {canManageChannels && (
                <button onClick={() => setShowAddChannelModal(true)} className="text-slate-400 hover:text-primary p-1 rounded hover:bg-slate-100 transition-colors"><Plus size={20} /></button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6"><ChannelList /></div>
        <div className="p-4 bg-slate-100/50 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-slate-600 text-xs font-medium">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>En ligne ({currentUser.name})</span>
            </div>
        </div>
      </div>

      {showMobileSidebar && (
          <div className="absolute inset-0 z-30 flex md:hidden">
              <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300 z-40">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-900 text-lg">Discussions</h2>
                    <div className="flex items-center space-x-2">
                        {canManageChannels && <button onClick={() => setShowAddChannelModal(true)} className="text-slate-400 hover:text-primary"><Plus size={20}/></button>}
                        <button onClick={() => setShowMobileSidebar(false)} className="text-slate-500"><X size={20}/></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3"><ChannelList /></div>
              </div>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 z-30" onClick={() => setShowMobileSidebar(false)}></div>
          </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-white h-full relative">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-20 shrink-0">
            <div className="flex items-center">
                <button onClick={() => setShowMobileSidebar(true)} className="mr-3 md:hidden text-slate-500 p-1 hover:bg-slate-100 rounded"><Menu size={20} /></button>
                <span className="text-slate-400 mr-3 p-2 bg-slate-50 rounded-full border border-slate-100">{activeChannel?.type === 'project' ? <Lock size={18}/> : <Hash size={18}/>}</span>
                <div className="overflow-hidden">
                    <h2 className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md">{activeChannel?.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center">
                         {onlineUserIds.size > 0 && <span className="w-1.5 h-1.5 bg-success rounded-full mr-1.5"></span>}
                         {onlineUserIds.size} en ligne / {users.length} membres
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="flex -space-x-2 pl-2 overflow-hidden max-w-[120px]">
                    {users.slice(0, 5).map(u => {
                        const isOnline = onlineUserIds.has(u.id);
                        return (
                            <div key={u.id} className="relative group/avatar cursor-pointer">
                                <img src={u.avatar} className={`w-8 h-8 rounded-full border-2 border-white transition-transform ${isOnline ? 'ring-2 ring-success ring-offset-1' : ''}`} title={u.name} />
                                {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-white rounded-full"></span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white">
            {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><MessageSquare size={32} className="opacity-50" /></div>
                    <p className="font-medium text-slate-400">Début de la conversation</p>
                </div>
            ) : (
                activeMessages.map((msg, idx) => {
                    const isMe = msg.userId === currentUser.id;
                    const sender = users.find(u => u.id === msg.userId);
                    const isSequence = idx > 0 && activeMessages[idx - 1].userId === msg.userId;
                    const isNew = isMessageNew(msg);
                    const showSeparator = idx === firstNewMessageIndex && isNew;

                    return (
                        <ChatMessage 
                           key={msg.id}
                           msg={msg}
                           isMe={isMe}
                           sender={sender}
                           isSequence={isSequence}
                           isNew={isNew}
                           showSeparator={showSeparator}
                        />
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Mentions */}
        {showMentions && filteredUsersForMention.length > 0 && (
             <div className="absolute bottom-20 left-4 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 w-64 animate-in slide-in-from-bottom-2">
                 <h4 className="text-xs font-bold text-slate-400 px-2 py-1 uppercase mb-1 flex items-center"><AtSign size={12} className="mr-1"/>Membres</h4>
                 <div className="max-h-48 overflow-y-auto">
                     {filteredUsersForMention.map(user => {
                         const isOnline = onlineUserIds.has(user.id);
                         return (
                             <button key={user.id} onClick={() => insertMention(user)} className="w-full flex items-center justify-between space-x-3 p-2 hover:bg-slate-100 rounded-lg transition-colors text-left group">
                                 <div className="flex items-center space-x-2">
                                     <img src={user.avatar} className="w-6 h-6 rounded-full" />
                                     <span className="text-sm font-medium text-slate-800">{user.name}</span>
                                 </div>
                                 <span className={`text-[10px] ${isOnline ? 'text-success font-bold' : 'text-slate-400'}`}>
                                     {isOnline ? 'En ligne' : formatLastSeen(user.lastSeen)}
                                 </span>
                             </button>
                         )
                     })}
                 </div>
             </div>
        )}

        {/* Attachments Pending Preview */}
        {pendingAttachments.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex space-x-2 overflow-x-auto">
                {pendingAttachments.map((file, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 pr-8 relative text-xs shadow-sm flex items-center shrink-0 animate-in zoom-in duration-200">
                        <FileIcon size={14} className="mr-2 text-blue-500" />
                        <span className="max-w-[150px] truncate">{file}</span>
                        <button onClick={() => removeAttachment(idx)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500"><X size={14}/></button>
                    </div>
                ))}
            </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200 shrink-0 relative">
            <div className="bg-gray-200 rounded-xl border border-gray-300 p-2 flex items-end shadow-inner focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-300/50 rounded-lg transition-colors relative">
                    <Paperclip size={20} />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
                </button>
                <textarea 
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={pendingAttachments.length > 0 ? "Ajouter un message..." : "Envoyer un message..."}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-black placeholder-gray-500 resize-none py-2.5 px-2 max-h-32 font-medium"
                    rows={1}
                    style={{ minHeight: '44px' }}
                />
                <div className="flex items-center pb-1 space-x-1">
                    <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-300/50 rounded-lg transition-colors hidden sm:block"><Smile size={20} /></button>
                    <button onClick={handleSend} disabled={!newMessage.trim() && pendingAttachments.length === 0} className={`p-2 rounded-lg transition-all duration-200 ${newMessage.trim() || pendingAttachments.length > 0 ? 'bg-primary text-white shadow-md hover:bg-blue-700 transform hover:scale-105' : 'bg-slate-300 text-slate-400 cursor-not-allowed'}`}><Send size={18} /></button>
                </div>
            </div>
        </div>
      </div>

      {/* Add Channel Modal */}
      {showAddChannelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-slate-900">Nouveau Canal</h3>
                      <button onClick={() => setShowAddChannelModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <form id="addChannelForm" onSubmit={handleAddSubmit} className="space-y-5">
                          <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom du canal</label><input type="text" required value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: Campagne Hiver 2024" /></div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                              <select value={newChannelType} onChange={e => setNewChannelType(e.target.value as 'global' | 'project')} className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all">
                                  <option value="project">Projet (Privé)</option>
                                  <option value="global">Global (Public)</option>
                              </select>
                          </div>
                          {newChannelType === 'project' && (
                              <div className="animate-in slide-in-from-top-2">
                                  <label className="block text-sm font-medium text-slate-700 mb-2">Membres assignés</label>
                                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 max-h-48 overflow-y-auto">
                                      {users.filter(u => u.id !== currentUser.id).map(user => {
                                          const isOnline = onlineUserIds.has(user.id);
                                          return (
                                          <div key={user.id} onClick={() => toggleMemberSelection(user.id)} className="flex items-center justify-between p-3 hover:bg-white border-b border-gray-200 last:border-0 cursor-pointer transition-colors">
                                              <div className="flex items-center space-x-3">
                                                  <div className="relative">
                                                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                                      {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-white rounded-full"></span>}
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                                      <p className="text-xs text-slate-500">{isOnline ? 'En ligne' : formatLastSeen(user.lastSeen)}</p>
                                                  </div>
                                              </div>
                                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMembers.includes(user.id) ? 'bg-primary border-primary text-white' : 'border-gray-400 bg-white'}`}>{selectedMembers.includes(user.id) && <Check size={14} />}</div>
                                          </div>
                                      )})}
                                  </div>
                              </div>
                          )}
                      </form>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                      <div className="flex space-x-3">
                          <button type="button" onClick={() => setShowAddChannelModal(false)} className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Annuler</button>
                          <button type="submit" form="addChannelForm" className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-primary/20 transition-all">Créer</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
