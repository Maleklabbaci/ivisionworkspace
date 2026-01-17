
import React, { useState, useMemo } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Search, Menu, Users, FileText, Calendar as CalendarIcon, Target, TrendingUp, X } from 'lucide-react';
import { User, Task, Message, Channel, FileLink, UserRole } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  unreadMessageCount?: number;
  tasks?: Task[];
  messages?: Message[];
  users?: User[];
  channels?: Channel[];
  fileLinks?: FileLink[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, currentUser, onLogout, unreadMessageCount = 0,
  tasks = [], messages = [], users = [], channels = [], fileLinks = []
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const handleNavigate = (path: string) => {
    setIsMoreMenuOpen(false);
    setTimeout(() => navigate(`/${path}`), 10);
  };

  // Utilitaire pour vérifier l'accès
  const hasAccess = (permissionKey?: string) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (!permissionKey) return true; // Modules publics (Dashboard, Tâches perso, Settings)
    return !!(currentUser.permissions as any)?.[permissionKey];
  };

  // Définition filtrée des items de navigation principale
  const visibleNavItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Accueil', icon: LayoutGrid, path: 'dashboard', color: 'text-vibrant-indigo' },
      { id: 'tasks', label: 'Missions', icon: CheckSquare, path: 'tasks', color: 'text-vibrant-violet' },
      { id: 'calendar', label: 'Planning', icon: CalendarIcon, path: 'calendar', color: 'text-vibrant-emerald' },
    ];

    if (hasAccess('canManageLeads')) {
      items.push({ id: 'leads', label: 'Leads', icon: Target, path: 'leads', color: 'text-vibrant-orange' });
    }

    return items;
  }, [currentUser]);

  // Définition filtrée du menu étendu
  const visibleMoreItems = useMemo(() => {
    const items = [];

    if (hasAccess('canManageClients')) {
      items.push({ id: 'clients', label: 'CRM Clients', icon: Briefcase, color: 'text-vibrant-sky' });
    }
    
    if (hasAccess('canViewReports')) {
      items.push({ id: 'reports', label: 'Rapports IA', icon: TrendingUp, color: 'text-vibrant-amber' });
    }

    if (hasAccess('canManageChat')) {
      items.push({ id: 'chat', label: 'Messages', icon: MessageSquare, color: 'text-primary' });
    }

    if (hasAccess('canManageTeam')) {
      items.push({ id: 'team', label: 'Équipe', icon: Users, color: 'text-vibrant-indigo' });
    }

    if (hasAccess('canViewFiles')) {
      items.push({ id: 'files', label: 'Documents', icon: FileText, color: 'text-vibrant-orange' });
    }

    // Toujours accessible
    items.push({ id: 'settings', label: 'Paramètres', icon: Settings, color: 'text-slate-400' });

    return items;
  }, [currentUser]);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-slate-900 font-sans">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* SIDEBAR PC - FILTRÉE */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-50 border-r border-slate-200 h-full flex-shrink-0">
        <div className="p-8 flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-vibrant-indigo rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/10">iV</div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tighter leading-none uppercase">iVISION</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Enterprise</span>
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</div>
            {visibleNavItems.map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentPath === item.id ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}>
                    <item.icon size={18} className={currentPath === item.id ? 'text-primary' : item.color} />
                    <span>{item.label}</span>
                </button>
            ))}
            
            <div className="pt-6 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business & Tools</div>
            {visibleMoreItems.filter(i => i.id !== 'settings').map(item => (
              <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${currentPath === item.id ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}>
                <item.icon size={18} className={currentPath === item.id ? 'text-primary' : item.color} />
                <span>{item.label}</span>
              </button>
            ))}
        </nav>

        <div className="p-6 border-t border-slate-200">
            <button onClick={() => handleNavigate('settings')} className="w-full flex items-center space-x-4 p-3 rounded-2xl hover:bg-white transition-all group">
                <img src={currentUser.avatar} className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-50" alt="" />
                <div className="flex-1 text-left truncate">
                    <p className="font-bold text-slate-900 text-xs truncate uppercase">{currentUser.name}</p>
                    <p className="text-[9px] text-primary font-bold uppercase tracking-widest">{currentUser.role}</p>
                </div>
            </button>
            <button onClick={onLogout} className="w-full mt-2 flex items-center justify-center space-x-2 p-2 text-slate-400 hover:text-urgent font-bold transition-colors text-[10px] uppercase tracking-widest">
                <LogOut size={14} />
                <span>Quitter</span>
            </button>
        </div>
      </aside>

      {/* ZONE PRINCIPALE - MOBILE & PC */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden flex items-center justify-between px-6 h-[72px] flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-[50]" style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-vibrant-indigo rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">iV</div>
            <span className="font-bold text-lg tracking-tighter uppercase leading-none">iVISION</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400"><Search size={22} /></button>
            <button onClick={() => handleNavigate('settings')} className="w-9 h-9 rounded-xl overflow-hidden border-2 border-slate-100 active-scale">
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
            </button>
          </div>
        </header>

        {/* CONTENU DÉFILANT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full relative">
          <div className="w-full max-w-screen-xl mx-auto px-6 py-8 lg:px-12 lg:py-16 pb-32">
            {children}
          </div>
        </main>

        {/* MOBILE BOTTOM NAV - FILTRÉE */}
        <nav className="lg:hidden flex justify-around items-center bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 flex-shrink-0 z-[50] shadow-lg" style={{ height: 'calc(64px + var(--safe-bottom))', paddingBottom: 'var(--safe-bottom)' }}>
          {visibleNavItems.map(item => {
            const isActive = currentPath === item.id;
            return (
              <button key={item.id} onClick={() => handleNavigate(item.path)} className="flex flex-col items-center justify-center flex-1 h-full transition-all">
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon size={22} className={isActive ? 'text-primary' : item.color} />
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight ${isActive ? 'text-primary' : 'text-slate-400'}`}>{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setIsMoreMenuOpen(true)} className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 relative">
            <div className="p-2">
              <Menu size={22} className="text-slate-400" />
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-tight">Plus</span>
          </button>
        </nav>
      </div>

      {/* MORE MENU DRAWER - FILTRÉ */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[3rem] p-8 pb-[calc(2rem+var(--safe-bottom))] modal-drawer shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-10 opacity-50"></div>
            <div className="grid grid-cols-2 gap-4">
              {visibleMoreItems.map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex items-center space-x-5 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 active-scale group transition-all text-left">
                  <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${item.color}`}>
                    <item.icon size={22} />
                  </div>
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
