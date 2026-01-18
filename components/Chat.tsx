
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Paperclip, Hash, Lock, Plus, X, Search, MoreVertical } from 'lucide-react';
import { Message, User, Channel, UserRole } from '../types';

const Chat: React.FC<any> = ({ currentUser, users, channels, currentChannelId, messages, onChannelChange, onSendMessage, onAddChannel }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = useMemo(() => messages.filter((m: any) => m.channelId === currentChannelId), [messages, currentChannelId]);
  const activeChannel = channels.find((c: any) => c.id === currentChannelId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage, currentChannelId);
    setNewMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-200px)] glass rounded-[2rem] md:rounded-[3rem] overflow-hidden animate-fade-in border-white/5 shadow-2xl relative">
      {/* Sidebar Canal */}
      <div className="hidden md:flex flex-col w-72 border-r border-white/5 bg-slate-900/30 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h2 className="font-black text-white text-[10px] uppercase tracking-[0.3em]">Flux Canaux</h2>
            <button onClick={() => setShowAddChannel(true)} className="w-8 h-8 flex items-center justify-center bg-indigo-500 text-white rounded-lg shadow-lg active-scale"><Plus size={16} strokeWidth={3}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
            {channels.map((channel: any) => (
                <button 
                  key={channel.id} 
                  onClick={() => onChannelChange(channel.id)} 
                  className={`w-full flex items-center space-x-3.5 px-5 py-4 rounded-2xl transition-all relative group ${currentChannelId === channel.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-white/5'}`}
                >
                    {channel.type === 'project' ? <Lock size={15} /> : <Hash size={15} />}
                    <span className="text-xs font-bold truncate uppercase tracking-wider">{channel.name}</span>
                    {currentChannelId === channel.id && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></div>}
                </button>
            ))}
        </div>
      </div>

      {/* Zone Messages */}
      <div className="flex-1 flex flex-col bg-transparent">
        <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-2xl sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 md:w-11 md:h-11 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
                  <Hash size={20} />
              </div>
              <div className="min-w-0">
                  <h2 className="font-extrabold text-white text-sm md:text-base tracking-tight uppercase truncate">{activeChannel?.name || 'Sélection'}</h2>
                  <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mt-0.5 truncate">Serveur Sécurisé iV</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-500 hover:text-white glass rounded-xl"><Search size={18}/></button>
              <button className="p-2 text-slate-500 hover:text-white glass rounded-xl"><MoreVertical size={18}/></button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-8 no-scrollbar">
            {activeMessages.map((msg: any, idx: number) => {
                const isMe = msg.userId === currentUser.id;
                const sender = users.find((u: any) => u.id === msg.userId);
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} items-end space-x-3 md:space-x-4`}>
                            {!isMe && (
                              <div className="flex flex-col items-center">
                                <img src={sender?.avatar} className="w-6 h-6 md:w-8 md:h-8 rounded-xl border border-white/10 shadow-sm mb-1" />
                              </div>
                            )}
                            <div className="space-y-1">
                                {!isMe && <p className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">{sender?.name}</p>}
                                <div className={`p-4 md:p-5 rounded-2xl md:rounded-[1.8rem] text-[12px] md:text-[13px] leading-relaxed font-medium shadow-sm transition-all hover:shadow-md ${isMe ? 'bg-white text-slate-950 rounded-br-none' : 'bg-slate-900/60 text-slate-200 border border-white/5 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                                <p className={`text-[8px] font-bold text-slate-600 uppercase tracking-widest ${isMe ? 'text-right mr-2' : 'ml-2'}`}>{msg.timestamp}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 md:p-8 bg-slate-950/40 backdrop-blur-3xl border-t border-white/5">
            <div className="bg-white/5 rounded-2xl md:rounded-[2rem] p-1.5 md:p-2 flex items-center border border-white/5 focus-within:border-indigo-500/50 transition-all shadow-inner">
                <button className="p-2 md:p-4 text-slate-500 hover:text-indigo-400 transition-colors active-scale"><Paperclip size={20} /></button>
                <input 
                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                    placeholder="Échanges..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-[13px] font-bold text-white placeholder-slate-600 px-2 md:px-4"
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="w-10 h-10 md:w-14 md:h-14 bg-indigo-500 text-white rounded-xl md:rounded-[1.2rem] shadow-xl shadow-indigo-500/20 active-scale disabled:opacity-20 transition-all flex items-center justify-center">
                    <Send size={20} />
                </button>
            </div>
        </footer>
      </div>

      {showAddChannel && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4 md:p-6 animate-fade-in">
              <div className="glass rounded-3xl md:rounded-[3.5rem] shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar border-white/10 p-6 md:p-12">
                  <div className="flex justify-between items-center mb-8 md:mb-10">
                      <h3 className="text-xl md:text-2xl font-extrabold text-white uppercase tracking-tight">Nouveau Canal</h3>
                      <button onClick={() => setShowAddChannel(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                  </div>
                  <div className="space-y-1.5 mb-8">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Identification</label>
                    <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-indigo-500 transition-all text-sm" placeholder="Ex: Campagne_Video" />
                  </div>
                  <button onClick={() => { if(newChannelName) onAddChannel({name: newChannelName, type:'project'}); setShowAddChannel(false); setNewChannelName(''); }} className="w-full py-4 md:py-5.5 bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/30 active-scale uppercase text-[10px] md:text-[11px] tracking-[0.2em]">Confirmer</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
