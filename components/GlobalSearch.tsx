
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, MessageSquare, FileText, ArrowRight, Hash, Command } from 'lucide-react';
import { Task, Message, User, Channel, FileLink } from '../types';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: Task[];
  messages?: Message[];
  users?: User[];
  channels?: Channel[];
  fileLinks?: FileLink[];
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, tasks = [], messages = [], users = [], channels = [], fileLinks = [] }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const results = useMemo(() => {
    if (!query.trim()) return { tasks: [], messages: [], files: [] };
    
    const lowerQuery = query.toLowerCase();

    // Tasks
    const foundTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) || 
      t.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    // Messages
    const foundMessages = messages.filter(m => 
      m.content.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    // Files (Aggregate)
    const files = [];
    // 1. From DB Links
    fileLinks.forEach(f => {
      if(f.name.toLowerCase().includes(lowerQuery)) files.push({ type: 'link', name: f.name, url: f.url, date: f.createdAt });
    });
    // 2. Task Attachments
    tasks.forEach(t => {
       t.attachments?.forEach(att => {
          if(att.toLowerCase().includes(lowerQuery)) files.push({ type: 'task', name: att, url: att, context: t.title });
       });
    });
    // 3. Message Attachments
    messages.forEach(m => {
       m.attachments?.forEach(att => {
          if(att.toLowerCase().includes(lowerQuery)) files.push({ type: 'chat', name: att, url: att, context: 'Chat' });
       });
    });
    
    // Sort files simply by name match for now, limit to 5
    const foundFiles = files.slice(0, 5);

    return { tasks: foundTasks, messages: foundMessages, files: foundFiles };
  }, [query, tasks, messages, fileLinks]);

  if (!isOpen) return null;

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks?taskId=${taskId}`);
    onClose();
  };

  const handleMessageClick = (channelId: string) => {
    navigate(`/chat?channelId=${channelId}`);
    onClose();
  };

  const handleFileClick = (url: string) => {
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        {/* Header / Input */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-white sticky top-0">
          <Search className="text-slate-400" size={20} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Rechercher des tâches, messages, fichiers..." 
            className="flex-1 text-lg outline-none text-slate-800 placeholder-slate-400 font-medium bg-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 border border-slate-200 text-xs font-bold px-2 py-1">
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto p-2 bg-slate-50/50">
          {!query && (
             <div className="p-8 text-center text-slate-400">
                <Command size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Tapez pour rechercher dans tout l'espace de travail.</p>
             </div>
          )}

          {query && results.tasks.length === 0 && results.messages.length === 0 && results.files.length === 0 && (
             <div className="p-8 text-center text-slate-500">
                <p>Aucun résultat trouvé pour "{query}".</p>
             </div>
          )}

          {/* Tasks Section */}
          {results.tasks.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Tâches</h4>
              {results.tasks.map(task => (
                <button 
                  key={task.id} 
                  onClick={() => handleTaskClick(task.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-lg group transition-all text-left border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <CheckCircle size={18} className="text-primary flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-800 truncate text-sm">{task.title}</p>
                      <p className="text-xs text-slate-400 truncate">{task.description}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Messages Section */}
          {results.messages.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Messages</h4>
              {results.messages.map(msg => {
                const channel = channels.find(c => c.id === msg.channelId);
                const user = users.find(u => u.id === msg.userId);
                return (
                  <button 
                    key={msg.id} 
                    onClick={() => handleMessageClick(msg.channelId)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-lg group transition-all text-left border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <MessageSquare size={18} className="text-purple-500 flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-800 truncate text-sm flex items-center">
                           <span className="font-bold mr-1">{user?.name}:</span> 
                           <span className="truncate">{msg.content}</span>
                        </p>
                        <p className="text-xs text-slate-400 truncate flex items-center">
                           <Hash size={10} className="mr-1" /> {channel?.name || 'Inconnu'} • {msg.timestamp}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Files Section */}
          {results.files.length > 0 && (
             <div className="mb-2">
                <h4 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Fichiers</h4>
                {results.files.map((file, idx) => (
                   <button 
                     key={idx}
                     onClick={() => handleFileClick(file.url)}
                     className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-lg group transition-all text-left border border-transparent hover:border-slate-100"
                   >
                     <div className="flex items-center space-x-3 overflow-hidden">
                       <FileText size={18} className="text-orange-500 flex-shrink-0" />
                       <div className="truncate">
                         <p className="font-medium text-slate-800 truncate text-sm">{file.name}</p>
                         {file.context && <p className="text-xs text-slate-400 truncate">Dans : {file.context}</p>}
                       </div>
                     </div>
                     <ArrowRight size={14} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                   </button>
                ))}
             </div>
          )}
        </div>
        
        <div className="p-2 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between px-4">
            <span>Utilisez les flèches pour naviguer</span>
            <span>Entrée pour sélectionner</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
