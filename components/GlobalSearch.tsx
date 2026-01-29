
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
  initialQuery?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, tasks = [], messages = [], users = [], channels = [], fileLinks = [], initialQuery = '' }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const results = useMemo(() => {
    if (!query.trim()) return { tasks: [], messages: [], files: [] };
    const lowerQuery = query.toLowerCase();
    const foundTasks = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery) || t.description.toLowerCase().includes(lowerQuery)).slice(0, 5);
    const foundMessages = messages.filter(m => m.content.toLowerCase().includes(lowerQuery)).slice(0, 5);
    const files: any[] = [];
    fileLinks.forEach(f => { if(f.name.toLowerCase().includes(lowerQuery)) files.push({ type: 'link', name: f.name, url: f.url, date: f.createdAt }); });
    return { tasks: foundTasks, messages: foundMessages, files: files.slice(0, 5) };
  }, [query, tasks, messages, fileLinks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-white sticky top-0">
          <Search className="text-slate-400" size={20} />
          <input ref={inputRef} type="text" placeholder="Rechercher..." className="flex-1 text-lg outline-none text-slate-800 placeholder-slate-400 font-medium bg-transparent" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 border border-slate-200 text-xs font-bold px-2 py-1">ESC</button>
        </div>
        <div className="overflow-y-auto p-2 bg-slate-50/50">
          {results.tasks.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Tâches</h4>
              {results.tasks.map(task => (
                <button key={task.id} onClick={() => { navigate(`/tasks?taskId=${task.id}`); onClose(); }} className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-lg group transition-all text-left border border-transparent hover:border-slate-100">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <CheckCircle size={18} className="text-primary flex-shrink-0" />
                    <div className="truncate"><p className="font-medium text-slate-800 truncate text-sm">{task.title}</p></div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
