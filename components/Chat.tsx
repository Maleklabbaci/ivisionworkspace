
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Hash, Lock, Search, Bell, MessageSquare, File, Image, Menu, X } from 'lucide-react';
import { Message, User, Channel, UserRole } from '../types';

interface ChatProps {
  currentUser: User;
  users: User[];
  channels: Channel[];
  currentChannelId: string;
  messages: Message[];
  onChannelChange: (channelId: string) => void;
  onSendMessage: (text: string, channelId: string) => void;
}

const Chat: React.FC<ChatProps> = ({ currentUser, users, channels, currentChannelId, messages, onChannelChange, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChannelSelect = (id: string) => {
      onChannelChange(id);
      setShowMobileSidebar(false);
  };

  const ChannelList = () => (
    <>
        {/* Projects - Visible to Everyone */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider flex justify-between items-center">
                Projets
                <span className="text-[10px] bg-slate-200 px-1.5 rounded-full text-slate-600">{channels.filter(c => c.type === 'project').length}</span>
            </h3>
            <div className="space-y-1">
                {channels.filter(c => c.type === 'project').map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentChannelId === channel.id ? 'bg-white text-primary shadow-sm font-medium border border-slate-100 translate-x-1' : 'text-slate-600 hover:bg-white/60 hover:translate-x-1'}`}
                    >
                        <div className="flex items-center truncate">
                            <Lock size={14} className="mr-2 opacity-50 flex-shrink-0" />
                            <span className="truncate">{channel.name}</span>
                        </div>
                        {channel.unread && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">{channel.unread}</span>}
                    </button>
                ))}
            </div>
        </div>

        {/* Global - Only for Admins */}
        {currentUser.role === UserRole.ADMIN && (
            <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 tracking-wider">Global</h3>
                <div className="space-y-1">
                    {channels.filter(c => c.type === 'global').map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel.id)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentChannelId === channel.id ? 'bg-white text-primary shadow-sm font-medium border border-slate-100 translate-x-1' : 'text-slate-600 hover:bg-white/60 hover:translate-x-1'}`}
                        >
                            <Hash size={14} className="mr-2 opacity-50" />
                            <span>{channel.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
    </>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Channels Sidebar (Desktop) */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-lg">Discussions</h2>
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
              <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-900 text-lg">Discussions</h2>
                    <button onClick={() => setShowMobileSidebar(false)} className="text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                      <ChannelList />
                  </div>
              </div>
              <div className="flex-1 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowMobileSidebar(false)}></div>
          </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
            <div className="flex items-center">
                <button onClick={() => setShowMobileSidebar(true)} className="mr-3 md:hidden text-slate-500 p-1 hover:bg-slate-100 rounded">
                    <Menu size={20} />
                </button>
                <span className="text-slate-400 mr-3 p-2 bg-slate-50 rounded-full border border-slate-100">
                    {activeChannel?.type === 'project' ? <Lock size={18}/> : <Hash size={18}/>}
                </span>
                <div>
                    <h2 className="font-bold text-slate-900">{activeChannel?.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-success rounded-full mr-1.5"></span>
                        {users.length} membres actifs
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="relative hidden lg:block">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1.5 bg-slate-100 text-black border-transparent rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 transition-all placeholder-slate-500" />
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-urgent rounded-full border-2 border-white animate-bounce"></span>
                </button>
                <div className="flex -space-x-2 pl-2">
                    {users.slice(0,3).map(u => (
                        <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white" title={u.name} />
                    ))}
                    {users.length > 3 && <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{users.length - 3}</div>}
                </div>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
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
                          <div className={`flex max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row space-x-3'}`}>
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
                                      {msg.content}
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

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            <div className="bg-slate-100 rounded-xl border border-transparent p-2 flex items-end shadow-inner focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors">
                    <Paperclip size={20} />
                </button>
                <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Envoyer un message à #${activeChannel?.name}`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-black placeholder-slate-500 resize-none py-2.5 px-2 max-h-32"
                    rows={1}
                    style={{ minHeight: '44px' }}
                />
                <div className="flex items-center pb-1 space-x-1">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors hidden sm:block">
                        <Smile size={20} />
                    </button>
                    <button 
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                            newMessage.trim() 
                            ? 'bg-primary text-white shadow-md hover:bg-blue-700 transform hover:scale-105' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
