

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, CheckSquare, MessageSquare, Users as UsersIcon, FolderOpen, Menu, X, Settings, LogOut, BarChart3, Search, Bell, Briefcase, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { User, UserRole, Task, Message, Channel, FileLink } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  unreadMessageCount?: number;
  // Search Data Props
  tasks?: Task[];
  messages?: Message[];
  users?: User[];
  channels?: Channel[];
  fileLinks?: FileLink[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, unreadMessageCount = 0, tasks = [], messages = [], users = [], channels = [], fileLinks = [] }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Header Search State
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions for Header Search (limited to top 3 each)
  const headerSuggestions = useMemo(() => {
    if (!headerSearchQuery.trim()) return { tasks: [], files: [] };
    const lowerQuery = headerSearchQuery.toLowerCase();

    const matchedTasks = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery)).slice(0, 3);
    const matchedFiles = fileLinks.filter(f => f.name.toLowerCase().includes(lowerQuery)).slice(0, 3);

    return { tasks: matchedTasks, files: matchedFiles };
  }, [headerSearchQuery, tasks, fileLinks]);

  // Derive current view from path (e.g., "/dashboard" -> "dashboard")
  // Default to 'dashboard' if root
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'reports', label: 'Rapports', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ANALYST] },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    // CLIENTS : Restreint par défaut à Admin/PM/Analyste, OU permission spéciale 'canManageClients'
    { id: 'clients', label: 'Clients', icon: Briefcase, roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ANALYST] },
    { id: 'chat', label: 'Chat & Équipe', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    // STRICT : Seul Admin a accès par défaut. Les autres nécessitent la permission explicite 'canViewFiles'
    { id: 'files', label: 'Fichiers', icon: FolderOpen, roles: [UserRole.ADMIN] },
    // STRICT : Seul Admin a accès par défaut. Les autres nécessitent la permission explicite 'canManageTeam'
    { id: 'team', label: 'Membres', icon: UsersIcon, roles: [UserRole.ADMIN] },
  ];

  // Filter items based on Role OR Special Permissions
  const visibleNavItems = navItems.filter(item => {
    // 1. Special Permissions Override (PRIORITÉ ABSOLUE)
    if (item.id === 'files' && currentUser.permissions?.canViewFiles) return true;
    if (item.id === 'reports' && currentUser.permissions?.canViewReports) return true;
    if (item.id === 'team' && currentUser.permissions?.canManageTeam) return true;
    if (item.id === 'clients' && currentUser.permissions?.canManageClients) return true;
    
    // 2. Default Role Check
    // Si ce n'est pas une permission spéciale, on regarde si le rôle est dans la liste par défaut.
    return item.roles.includes(currentUser.role);
  });

  const handleNavigate = (view: string) => {
    navigate(`/${view}`);
    setIsMobileMenuOpen(false);
  };

  const handleSuggestionClick = (path: string) => {
    navigate(path);
    setShowSuggestions(false);
    setHeaderSearchQuery('');
  };

  const handleHeaderSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
       setIsSearchOpen(true);
       setShowSuggestions(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 mb-2 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight text-white">
          <span className="text-primary">i</span>VISION AGENCY
        </h1>
        {/* Mobile Close Button */}
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            const isChat = item.id === 'chat';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 text-sm group relative ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-1' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                }`}
              >
                <div className="flex items-center space-x-3">
                    {/* Indicateur visuel (point vert) devant l'icône pour le chat non lu */}
                    {isChat && unreadMessageCount > 0 && (
                       <div className="absolute left-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                    )}
                    
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-medium">{item.label}</span>
                </div>
                {isChat && unreadMessageCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                        {unreadMessageCount}
                    </span>
                )}
              </button>
            );
        })}
      </nav>

      {/* User & Settings Footer - Visible mainly on mobile now as desktop has header */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4 px-1 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors md:hidden" onClick={() => handleNavigate('settings')}>
          <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600 shadow-sm" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-500 truncate" title={currentUser.role}>{currentUser.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleNavigate('settings')}
            className={`flex items-center justify-center space-x-2 p-2 rounded-lg border transition-all text-xs font-medium ${currentPath === 'settings' ? 'bg-slate-700 text-white border-slate-600' : 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            title="Paramètres"
          >
            <Settings size={14} />
            <span>Réglages</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center space-x-2 p-2 rounded-lg border border-slate-700 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30 text-xs text-slate-400 transition-all font-medium"
            title="Déconnexion"
          >
            <LogOut size={14} />
            <span>Sortir</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Search Modal */}
      <GlobalSearch 
         isOpen={isSearchOpen} 
         onClose={() => setIsSearchOpen(false)} 
         initialQuery={headerSearchQuery} // Pass current input
         tasks={tasks}
         messages={messages}
         users={users}
         channels={channels}
         fileLinks={fileLinks}
      />

      {/* Desktop Sidebar - DARK THEME */}
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 hidden md:flex flex-col transition-all duration-300 ease-in-out z-20 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
           <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
              onClick={() => setIsMobileMenuOpen(false)}
           ></div>
           <aside className="relative w-64 bg-[#0f172a] h-full shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col border-r border-slate-800">
             <SidebarContent />
           </aside>
        </div>
      )}

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-[#0f172a] border-b border-slate-800 p-4 flex justify-between items-center z-10 shadow-sm sticky top-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white transition-colors p-1 relative">
             <Menu size={24} />
             {unreadMessageCount > 0 && (
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
             )}
          </button>
          <span className="font-bold text-white text-lg">
            <span className="text-primary">i</span>VISION
          </span>
          <button onClick={() => setIsSearchOpen(true)} className="text-slate-400 hover:text-white">
             <Search size={24} />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-slate-50 shrink-0 z-30">
            <div className="flex-1 max-w-2xl relative group" ref={searchContainerRef}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-slate-400 group-hover:text-primary transition-colors" size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:border-slate-300"
                    placeholder="Rechercher (Tâches, Projets, Messages)..."
                    value={headerSearchQuery}
                    onChange={(e) => {
                      setHeaderSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleHeaderSearchKeyDown}
                />
                 <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                     <kbd className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[10px] font-bold text-slate-500 shadow-[0_1px_1px_rgba(0,0,0,0.1)]">⌘K</kbd>
                </div>

                {/* Inline Suggestions Dropdown */}
                {showSuggestions && headerSearchQuery.trim() && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                     {headerSuggestions.tasks.length === 0 && headerSuggestions.files.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">Aucune suggestion rapide. <br/><span className="text-xs">Appuyez sur Entrée pour une recherche complète.</span></div>
                     ) : (
                        <div className="py-2">
                           {headerSuggestions.tasks.length > 0 && (
                              <div className="mb-1">
                                <h5 className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tâches</h5>
                                {headerSuggestions.tasks.map(task => (
                                   <button key={task.id} onClick={() => handleSuggestionClick(`/tasks?taskId=${task.id}`)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group">
                                      <div className="flex items-center space-x-2 overflow-hidden">
                                        <CheckCircle size={14} className="text-primary flex-shrink-0" />
                                        <span className="text-sm text-slate-700 truncate font-medium">{task.title}</span>
                                      </div>
                                      <ArrowRight size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                   </button>
                                ))}
                              </div>
                           )}
                           {headerSuggestions.files.length > 0 && (
                              <div className="mb-1">
                                <h5 className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fichiers</h5>
                                {headerSuggestions.files.map(file => (
                                   <button key={file.id} onClick={() => { window.open(file.url, '_blank'); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between group">
                                      <div className="flex items-center space-x-2 overflow-hidden">
                                        <FileText size={14} className="text-orange-500 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 truncate font-medium">{file.name}</span>
                                      </div>
                                      <ArrowRight size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                   </button>
                                ))}
                              </div>
                           )}
                           <div className="border-t border-slate-100 mt-1 pt-1">
                              <button onClick={() => { setIsSearchOpen(true); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-primary hover:bg-blue-50 transition-colors">
                                 Voir tous les résultats pour "{headerSearchQuery}"
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
                )}
            </div>

            <div className="flex items-center space-x-6 ml-6">
                <button className="relative text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-white hover:shadow-sm">
                    <Bell size={24} />
                    {unreadMessageCount > 0 && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-50 animate-pulse" />}
                </button>
                <div className="h-8 w-px bg-slate-200"></div>
                 <div className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-all group" onClick={() => handleNavigate('settings')}>
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-primary transition-colors">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-wide">{currentUser.role}</p>
                    </div>
                    <img src={currentUser.avatar} alt="" className="h-10 w-10 rounded-full bg-slate-100 border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                </div>
            </div>
        </header>

        {/* Content Scroll Area with Page Transitions */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-4 relative w-full">
           <div key={currentPath} className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;