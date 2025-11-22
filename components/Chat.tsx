
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Hash, Lock, Search, Bell, MessageSquare, File, Image, Menu, X, Plus, Check, Trash2, AtSign } from 'lucide-react';
import { Message, User, Channel, UserRole } from '../types';

interface ChatProps {
  currentUser: User;
  users: User[];
  channels: Channel[];
  currentChannelId: string;
  messages: Message[];
  onChannelChange: (channelId: string) => void;
  onSendMessage: (text: string, channelId: string) => void;
  onAddChannel: (channel: { name: string; type: 'global' | 'project'; members?: string[] }) => void;
  onDeleteChannel: (channelId: string) => void;
}

const Chat: React.FC<ChatProps> = ({ currentUser, users, channels, currentChannelId, messages, onChannelChange, onSendMessage, onAddChannel, onDeleteChannel }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'global' | 'project'>('project');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Mention State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorIndex, setMentionCursorIndex] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeMessages = messages.filter(m => m.channelId === currentChannelId);
  const activeChannel = channels.find(c => c.id === currentChannelId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentChannelId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage, currentChannelId);
    setNewMessage('');
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            // Could add navigation inside mention list here
        } else if (e.key === 'Enter' || e.key === 'Tab') {
             e.preventDefault();
             const filtered = users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()));
             if (filtered.length > 0) {
                 insertMention(filtered[0]);
             }
        } else if (e.key === 'Escape') {
            setShowMentions(false);
        }
        return; // Let other keys type normally
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
      // Find the text before cursor
      const textBeforeCursor = val.substring(0, cursor);
      // Get last word
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
      // Create mention tag (e.g. @JeanDupont) - removing spaces for the tag
      const mentionTag = `@${user.name.replace(/\s+/g, '')} `;
      
      const cursor = inputRef.current?.selectionStart || newMessage.length;
      const textBeforeCursor = newMessage.substring(0, cursor);
      const textAfterCursor = newMessage.substring(cursor);
      
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      const newTextBefore = textBeforeCursor.substring(0, lastAtIndex);
      
      const newValue = newTextBefore + mentionTag + textAfterCursor;
      
      setNewMessage(newValue);
      setShowMentions(false);
      
      // Reset focus
      if (inputRef.current) {
          inputRef.current.focus();
      }
  };

  const formatMessageContent = (content: string) => {
      // Regex to find mentions starting with @ followed by word characters
      const parts = content.split(/(@\w+)/g);
      
      return parts.map((part, index) => {
          if (part.startsWith('@')) {
              // Simply style the tag if it looks like a mention
              return <span key={index} className="font-bold text-blue-600 bg-blue-50 rounded px-1 mx-0.5">{part}</span>;
          }
          return part;
      });
  };

  const handleChannelSelect = (id: string) => {
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

  // Filter users for mentions
  const filteredUsersForMention = users.filter(u => 
      u.name.toLowerCase().replace(/\s+/g, '').includes(mentionQuery.toLowerCase())
  );

  const ChannelList = () => (
    <>
        {/* Projects - Visible to Everyone */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider flex justify-between items-center">
                Projets
                <span className="text-[10px] bg-slate-200 px-1.5 rounded-full text-slate-600">{channels.filter(c => c.type === 'project').length}</span>
            </h3>
            <div className="space-y-1">
                {channels.filter(c => c.type === 'project').map(channel => {
                    const isUnread = (channel.unread || 0) > 0;
                    const isActive = currentChannelId === channel.id;
                    return (
                        <button
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                                isActive 
                                ? 'bg-white text-primary shadow-sm font-medium border border-slate-100 translate-x-1' 
                                : isUnread
                                    ? 'text-slate-900 bg-white/50 font-bold hover:bg-white/80'
                                    : 'text-slate-600 hover:bg-white/60 hover:translate-x-1'
                            }`}
                        >
                            <div className="flex items-center truncate">
                                <Lock size={14} className={`mr-2 flex-shrink-0 ${isUnread ? 'text-primary' : 'opacity-50'}`} />
                                <span className="truncate">{channel.name}</span>
                            </div>
                            <div className="flex items-center">
                                {isUnread && (
                                    <span className="bg-urgent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 animate-pulse shadow-sm">
                                        {channel.unread}
                                    </span>
                                )}
                                {currentUser.role === UserRole.ADMIN && (
                                    <div 
                                        onClick={(e) => handleDeleteClick(e, channel.id)}
                                        className="ml-2 p-1 text-slate-300 hover:text-urgent hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={12} />
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Global - Only for Admins */}
        {currentUser.role === UserRole.ADMIN && (
            <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider">Global</h3>
                <div className="space-y-1">
                    {channels.filter(c => c.type === 'global').map(channel => {
                        const isUnread = (channel.unread || 0) > 0;
                        const isActive = currentChannelId === channel.id;
                        return (
                            <button
                                key={channel.id}
                                onClick={() => handleChannelSelect(channel.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                                    isActive 
                                    ? 'bg-white text-primary shadow-sm font-medium border border-slate-100 translate-x-1' 
                                    : isUnread
                                        ? 'text-slate-900 bg-white/50 font-bold hover:bg-white/80'
                                        : 'text-slate-600 hover:bg-white/60 hover:translate-x-1'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Hash size={14} className={`mr-2 ${isUnread ? 'text-primary' : 'opacity-50'}`} />
                                    <span>{channel.name}</span>
                                </div>
                                <div className="flex items-center">
                                    {isUnread && (
                                        <span className="bg-urgent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 animate-pulse shadow-sm">
                                            {channel.unread}
                                        </span>
                                    )}
                                    {currentUser.role === UserRole.ADMIN && channel.id !== 'general' && (
                                        <div 
                                            onClick={(e) => handleDeleteClick(e, channel.id)}
                                            className="ml-2 p-1 text-slate-300 hover:text-urgent hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={12} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Channels Sidebar (Desktop) */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-lg">Discussions</h2>
            {currentUser.role === UserRole.ADMIN && (
                <button 
                    onClick={() => setShowAddChannelModal(true)}
                    className="text-slate-400 hover:text-primary p-1 rounded hover:bg-slate-100 transition-colors"
                    title="Ajouter un canal"
                >
                    <Plus size={20} />
                </button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
            <ChannelList />
        </div>
        <div className="p-4 bg-slate-100/50 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-slate-600 text-xs font-medium">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>En ligne ({currentUser.name})</span>
            </div>
        </div>
      </div>

      {/* Channels Sidebar (Mobile Drawer) */}
      {showMobileSidebar && (
          <div className="absolute inset-0 z-30 flex md:hidden">
              <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300 z-40">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-900 text-lg">Discussions</h2>
                    <div className="flex items-center space-x-2">
                        {currentUser.role === UserRole.ADMIN && (
                            <button onClick={() => setShowAddChannelModal(true)} className="text-slate-400 hover:text-primary"><Plus size={20}/></button>
                        )}
                        <button onClick={() => setShowMobileSidebar(false)} className="text-slate-500"><X size={20}/></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                      <ChannelList />
                  </div>
              </div>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 z-30" onClick={() => setShowMobileSidebar(false)}></div>
          </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white h-full relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-20 shrink-0">
            <div className="flex items-center">
                <button onClick={() => setShowMobileSidebar(true)} className="mr-3 md:hidden text-slate-500 p-1 hover:bg-slate-100 rounded">
                    <Menu size={20} />
                </button>
                <span className="text-slate-400 mr-3 p-2 bg-slate-50 rounded-full border border-slate-100">
                    {activeChannel?.type === 'project' ? <Lock size={18}/> : <Hash size={18}/>}
                </span>
                <div className="overflow-hidden">
                    <h2 className="font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md">{activeChannel?.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-success rounded-full mr-1.5"></span>
                        {users.length} membres
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="relative hidden lg:block">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1.5 bg-gray-200 text-black border border-gray-300 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 transition-all placeholder-gray-500 font-medium" />
                </div>
                <div className="flex -space-x-2 pl-2">
                    {users.slice(0,3).map(u => (
                        <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white" title={u.name} />
                    ))}
                    {users.length > 3 && <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{users.length - 3}</div>}
                </div>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white">
            {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="opacity-50" />
                    </div>
                    <p className="font-medium text-slate-400">Début de la conversation</p>
                    <p className="text-xs">Soyez le premier à dire bonjour !</p>
                </div>
            ) : (
                activeMessages.map((msg, idx) => {
                    const isMe = msg.userId === currentUser.id;
                    const sender = users.find(u => u.id === msg.userId);
                    const isSequence = idx > 0 && activeMessages[idx - 1].userId === msg.userId;
                    
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`flex max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row space-x-3'}`}>
                              {!isMe && !isSequence && (
                                <img src={sender?.avatar} className="w-8 h-8 rounded-full mt-1 flex-shrink-0" title={sender?.name} />
                              )}
                              {!isMe && isSequence && <div className="w-8 flex-shrink-0" />}

                              <div>
                                  {!isMe && !isSequence && (
                                      <p className="text-xs text-slate-500 mb-1 ml-1">{sender?.name}</p>
                                  )}
                                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                      isMe 
                                      ? 'bg-primary text-white rounded-tr-none' 
                                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                                  }`}>
                                      {formatMessageContent(msg.content)}
                                  </div>
                                  
                                  {/* Attachments in Chat */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                      <div className={`mt-1.5 flex flex-col items-end space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                          {msg.attachments.map((file, fIdx) => (
                                              <div key={fIdx} className="flex items-center p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 shadow-sm hover:text-primary transition-colors cursor-pointer">
                                                  <File size={12} className="mr-1.5" />
                                                  {file}
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  <p className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right text-slate-300' : 'text-slate-300'}`}>
                                      {msg.timestamp}
                                  </p>
                              </div>
                          </div>
                        </div>
                    )
                })
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Mention Autocomplete Popover */}
        {showMentions && filteredUsersForMention.length > 0 && (
             <div className="absolute bottom-20 left-4 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 w-64 animate-in slide-in-from-bottom-2">
                 <h4 className="text-xs font-bold text-slate-400 px-2 py-1 uppercase mb-1 flex items-center">
                     <AtSign size={12} className="mr-1"/>Membres
                 </h4>
                 <div className="max-h-48 overflow-y-auto">
                     {filteredUsersForMention.map(user => (
                         <button 
                             key={user.id}
                             onClick={() => insertMention(user)}
                             className="w-full flex items-center space-x-3 p-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
                         >
                             <img src={user.avatar} className="w-6 h-6 rounded-full" />
                             <span className="text-sm font-medium text-slate-800">{user.name}</span>
                             <span className="text-xs text-slate-400 ml-auto">@{user.name.replace(/\s+/g, '')}</span>
                         </button>
                     ))}
                 </div>
             </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 relative">
            <div className="bg-gray-200 rounded-xl border border-gray-300 p-2 flex items-end shadow-inner focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
                <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-300/50 rounded-lg transition-colors">
                    <Paperclip size={20} />
                </button>
                <textarea 
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Envoyer un message... (Tapez @ pour mentionner)`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-black placeholder-gray-500 resize-none py-2.5 px-2 max-h-32 font-medium"
                    rows={1}
                    style={{ minHeight: '44px' }}
                />
                <div className="flex items-center pb-1 space-x-1">
                    <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-300/50 rounded-lg transition-colors hidden sm:block">
                        <Smile size={20} />
                    </button>
                    <button 
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                            newMessage.trim() 
                            ? 'bg-primary text-white shadow-md hover:bg-blue-700 transform hover:scale-105' 
                            : 'bg-slate-300 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Send size={18} />
                    </button>
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
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du canal</label>
                              <input 
                                type="text" 
                                required
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value)}
                                className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="Ex: Campagne Hiver 2024"
                              />
                          </div>
                          
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                              <select 
                                value={newChannelType}
                                onChange={e => setNewChannelType(e.target.value as 'global' | 'project')}
                                className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                              >
                                  <option value="project">Projet (Privé)</option>
                                  <option value="global">Global (Public)</option>
                              </select>
                          </div>

                          {/* Member Selection for Private Channels */}
                          {newChannelType === 'project' && (
                              <div className="animate-in slide-in-from-top-2">
                                  <label className="block text-sm font-medium text-slate-700 mb-2">Membres assignés</label>
                                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 max-h-48 overflow-y-auto">
                                      {users.filter(u => u.id !== currentUser.id).map(user => (
                                          <div 
                                            key={user.id} 
                                            onClick={() => toggleMemberSelection(user.id)}
                                            className="flex items-center justify-between p-3 hover:bg-white border-b border-gray-200 last:border-0 cursor-pointer transition-colors"
                                          >
                                              <div className="flex items-center space-x-3">
                                                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                                  <div>
                                                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                                      <p className="text-xs text-slate-500">{user.role}</p>
                                                  </div>
                                              </div>
                                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMembers.includes(user.id) ? 'bg-primary border-primary text-white' : 'border-gray-400 bg-white'}`}>
                                                  {selectedMembers.includes(user.id) && <Check size={14} />}
                                              </div>
                                          </div>
                                      ))}
                                      {users.length <= 1 && (
                                          <div className="p-4 text-center text-slate-500 text-sm">
                                              Aucun autre membre disponible.
                                          </div>
                                      )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2">Vous serez automatiquement ajouté en tant qu'admin du canal.</p>
                              </div>
                          )}
                      </form>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                      <div className="flex space-x-3">
                          <button 
                            type="button"
                            onClick={() => setShowAddChannelModal(false)}
                            className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Annuler
                          </button>
                          <button 
                            type="submit"
                            form="addChannelForm"
                            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-primary/20 transition-all"
                          >
                              Créer
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
