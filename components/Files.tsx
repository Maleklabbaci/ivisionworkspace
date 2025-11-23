

import React, { useState, useMemo } from 'react';
import { FileText, Image, Archive, Search, ExternalLink, Link as LinkIcon, Plus, X, FolderOpen, Lock, Trash2 } from 'lucide-react';
import { Task, Message, User, UserRole, FileLink } from '../types';

interface FilesProps {
  tasks: Task[];
  messages: Message[];
  fileLinks?: FileLink[]; // Nouveaux liens stockés en DB
  currentUser: User;
  onAddFileLink?: (name: string, url: string) => void;
  onDeleteFileLink?: (id: string) => void;
}

interface FileItem {
  id: string;
  name: string;
  url?: string;
  source: string; // Task Title or Channel Name
  sourceType: 'task' | 'chat' | 'drive';
  date: string;
  type: 'pdf' | 'image' | 'archive' | 'link' | 'other';
}

const Files: React.FC<FilesProps> = ({ tasks, messages, fileLinks = [], currentUser, onAddFileLink, onDeleteFileLink }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'link'>('all');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

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

  // Aggregate files from tasks, messages, and manual links
  const allFiles: FileItem[] = useMemo(() => {
    const files: FileItem[] = [];
    const urlRegex = /((https?:\/\/)|(www\.))[^\s]+/g;

    // 1. Manual File Links (Google Drive, etc.) - From Library
    fileLinks.forEach(link => {
        files.push({
            id: `link-${link.id}`,
            name: link.name,
            url: link.url,
            source: 'Bibliothèque',
            sourceType: 'drive',
            date: link.createdAt,
            type: 'link'
        });
    });

    // 2. Extract from Tasks (Iterate comments for accurate timestamp)
    tasks.forEach(task => {
      if (task.comments && task.comments.length > 0) {
        task.comments.forEach((comment, cIdx) => {
             const foundUrls = comment.content.match(urlRegex);
             if (foundUrls) {
                 foundUrls.forEach((url, uIdx) => {
                     // Try to parse exact date from fullTimestamp if available, else current date
                     const dateObj = comment.fullTimestamp ? new Date(comment.fullTimestamp) : new Date();
                     const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                     files.push({
                        id: `task-${task.id}-${cIdx}-${uIdx}`,
                        name: url,
                        url: url,
                        source: `Tâche: ${task.title}`,
                        sourceType: 'task',
                        date: dateStr,
                        type: getFileType(url)
                     });
                 });
             }
        });
      }
    });

    // 3. Extract from Messages (Use fullTimestamp)
    messages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((fileName, idx) => {
          const dateObj = new Date(msg.fullTimestamp);
          const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          
          files.push({
            id: `msg-${msg.id}-${idx}`,
            name: fileName,
            source: `Chat`,
            sourceType: 'chat',
            date: dateStr,
            type: getFileType(fileName)
          });
        });
      }
    });

    // Sort by date desc
    return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, messages, fileLinks]);

  const filteredFiles = allFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          file.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  function getFileType(fileName: string): 'pdf' | 'image' | 'archive' | 'link' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileName.startsWith('http')) return 'link';
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return 'pdf'; 
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return 'image';
    if (['zip', 'rar'].includes(ext || '')) return 'archive';
    return 'other';
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'link': return <LinkIcon className="text-green-600" size={24} />;
      case 'pdf': return <FileText className="text-blue-500" size={24} />;
      case 'image': return <Image className="text-purple-500" size={24} />;
      case 'archive': return <Archive className="text-orange-500" size={24} />;
      default: return <FileText className="text-slate-400" size={24} />;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newFileName && newFileUrl && onAddFileLink) {
          onAddFileLink(newFileName, newFileUrl);
          setShowAddModal(false);
          setNewFileName('');
          setNewFileUrl('');
      }
  };

  const handleDeleteClick = (id: string, name: string) => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${name}" ?`)) {
          if (onDeleteFileLink) onDeleteFileLink(id);
      }
  };

  const openLink = (url?: string) => {
      if (!url) return;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestionnaire de Fichiers</h2>
          <p className="text-slate-500 text-sm">Centralisez vos documents et liens Google Drive.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-200 text-black border border-gray-300 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary w-full md:w-64 transition-all placeholder-gray-500 font-medium" 
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
             <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Tout</button>
             <button onClick={() => setFilterType('link')} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === 'link' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Liens</button>
             <button onClick={() => setFilterType('pdf')} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filterType === 'pdf' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Docs</button>
          </div>
          {onAddFileLink && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                title="Ajouter un lien"
              >
                  <Plus size={20} />
              </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {filteredFiles.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen size={32} className="opacity-50" />
              </div>
              <p>Aucun fichier trouvé.</p>
              {onAddFileLink && (
                  <button onClick={() => setShowAddModal(true)} className="mt-4 text-primary text-sm font-bold hover:underline">
                      Ajouter un lien Google Drive
                  </button>
              )}
           </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-4">Nom</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Type</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Date d'ajout</th>
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
                        <span className="font-medium text-slate-900 truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          file.sourceType === 'drive' ? 'bg-green-50 text-green-700' :
                          file.sourceType === 'task' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {file.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell uppercase text-xs font-bold tracking-wider text-slate-400">{file.type}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-slate-400">{file.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {file.type === 'link' || file.url ? (
                            <button 
                                onClick={() => openLink(file.url)}
                                className="text-primary hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                title="Ouvrir le lien"
                            >
                                <ExternalLink size={18} />
                            </button>
                        ) : null}
                        
                        {/* Delete Button - Only for Library Files (sourceType === 'drive') */}
                        {file.sourceType === 'drive' && onDeleteFileLink && (
                            <button 
                                onClick={() => handleDeleteClick(file.id, file.name)}
                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Ajouter un lien externe</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg flex items-start text-xs text-blue-700 mb-4">
                          <LinkIcon size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                          <p>Pour économiser l'espace de stockage, ajoutez le lien vers vos fichiers (Google Drive, Dropbox, WeTransfer).</p>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom du fichier</label>
                          <input 
                            type="text" 
                            required
                            value={newFileName}
                            onChange={e => setNewFileName(e.target.value)}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Ex: Maquette V1"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">URL (Lien)</label>
                          <input 
                            type="url" 
                            required
                            value={newFileUrl}
                            onChange={e => setNewFileUrl(e.target.value)}
                            className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="https://drive.google.com/..."
                          />
                      </div>
                      <div className="flex justify-end space-x-3 mt-4">
                          <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm">Ajouter</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Files;