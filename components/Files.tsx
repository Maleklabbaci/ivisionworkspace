
import React, { useState, useMemo } from 'react';
import { FileText, Image, Archive, Search, Download, FolderOpen, Lock } from 'lucide-react';
import { Task, Message, User, UserRole } from '../types';

interface FilesProps {
  tasks: Task[];
  messages: Message[];
  currentUser: User;
}

interface FileItem {
  id: string;
  name: string;
  source: string; // Task Title or Channel Name
  sourceType: 'task' | 'chat';
  date: string;
  type: 'pdf' | 'image' | 'archive' | 'other';
}

const Files: React.FC<FilesProps> = ({ tasks, messages, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image'>('all');

  // Access Guard: Admin OR Special Permission 'canViewFiles'
  const canAccess = currentUser.role === UserRole.ADMIN || currentUser.permissions?.canViewFiles;

  if (!canAccess) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="bg-red-50 p-6 rounded-full mb-4">
                <Lock size={48} className="text-urgent" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
            <p className="text-slate-500 max-w-md">
                Cette section est réservée aux administrateurs ou aux membres disposant d'une permission spéciale.
            </p>
        </div>
    );
  }

  // Aggregate files from tasks and messages
  const allFiles: FileItem[] = useMemo(() => {
    const files: FileItem[] = [];

    // Extract from Tasks
    tasks.forEach(task => {
      if (task.attachments && task.attachments.length > 0) {
        task.attachments.forEach((fileName, idx) => {
          files.push({
            id: `task-${task.id}-${idx}`,
            name: fileName,
            source: `Tâche: ${task.title}`,
            sourceType: 'task',
            date: task.dueDate, // Using due date as proxy for file relevance date if created date missing
            type: getFileType(fileName)
          });
        });
      }
    });

    // Extract from Messages
    messages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((fileName, idx) => {
          files.push({
            id: `msg-${msg.id}-${idx}`,
            name: fileName,
            source: `Chat`,
            sourceType: 'chat',
            date: new Date().toISOString().split('T')[0], // Mock date for now
            type: getFileType(fileName)
          });
        });
      }
    });

    return files;
  }, [tasks, messages]);

  const filteredFiles = allFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          file.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  function getFileType(fileName: string): 'pdf' | 'image' | 'archive' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return 'pdf'; // Grouping docs
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return 'image';
    if (['zip', 'rar'].includes(ext || '')) return 'archive';
    return 'other';
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="text-blue-500" size={24} />;
      case 'image': return <Image className="text-purple-500" size={24} />;
      case 'archive': return <Archive className="text-orange-500" size={24} />;
      default: return <FileText className="text-slate-400" size={24} />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestionnaire de Fichiers</h2>
          <p className="text-slate-500 text-sm">Retrouvez tous les documents liés aux tâches et discussions.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un fichier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-200 text-black border border-gray-300 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary w-full md:w-64 transition-all placeholder-gray-500 font-medium" 
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
             <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Tout</button>
             <button onClick={() => setFilterType('pdf')} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === 'pdf' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Docs</button>
             <button onClick={() => setFilterType('image')} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === 'image' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Images</button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {filteredFiles.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen size={32} className="opacity-50" />
              </div>
              <p>Aucun fichier trouvé.</p>
           </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Nom du fichier</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Type</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          {getIcon(file.type)}
                        </div>
                        <span className="font-medium text-slate-900">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${file.sourceType === 'task' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {file.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell uppercase text-xs font-bold tracking-wider text-slate-400">{file.type}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-slate-400">{file.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary p-2 hover:bg-blue-50 rounded-full transition-colors">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;