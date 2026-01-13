
import React, { useState, useMemo } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Search, Menu, Bell, Users, FileText, Calendar as CalendarIcon, Target, TrendingUp, Sparkles, X } from 'lucide-react';
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
    if (path === currentPath && !isMoreMenuOpen) return;
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // 1. Navigation Mobile (Accès Direct : Home, Missions, Planning, Leads)
  const mobileNavItems = useMemo(() => [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid, path: 'dashboard' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, path: 'tasks' },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon, path: 'calendar' },
    { id: 'leads', label: 'Leads', icon: Target, path: 'leads' },
  ], []);

  // 2. Menu "Plus" (CRM, Rapports, Chat, Équipe, Docs, Profil)
  const moreMenuItems = useMemo(() => {
    const items = [];
    
    // CRM et Rapports en priorité dans le menu Plus
    if (currentUser.role !== UserRole.MEMBER || currentUser.permissions?.canManageClients) {
      items.push({ id: 'clients', label: 'CRM Clients', icon: Briefcase, color: 'text-blue-500' });
    }
    
    if (currentUser.role !== UserRole.MEMBER || currentUser.permissions?.canViewReports) {
      items.push({ id: 'reports', label: 'Rapports IA', icon: TrendingUp, color: 'text-indigo-500' });
    }

    items.push(
      { id: 'chat', label: 'Messages', icon: MessageSquare, color: 'text-orange-500', badge: unreadMessageCount > 0 },
      { id: 'team', label: 'Équipe', icon: Users, color: 'text-primary' },
      { id: 'files', label: 'Docs', icon: FileText, color: 'text-success' },
      { id: 'settings', label: 'Profil', icon: Settings, color: 'text-slate-400' }
    );

    return items;
  }, [currentUser, unreadMessageCount]);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900 overflow-x-hidden">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* SIDEBAR PC */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-50 border-r border-slate-100 h-screen sticky top-0">
        <div className="p-8 flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-primary/20">iV</div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter leading-none">iVISION</span>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1">Workspace</span>
            </div>
        </div>
        
        <nav className="flex-1 px-6 space-y-1 mt-4 overflow-y-auto no-scrollbar">
            {mobileNavItems.map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all sidebar-item ${currentPath === item.id ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
                    <item.icon size={20} />
                    <span>{item.label}</span>
                </button>
            ))}
            
            <div className="pt-6 pb-2 px-5">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Expansion</span>
            </div>

            <button onClick={() => handleNavigate('clients')} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all sidebar-item ${currentPath === 'clients' ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
              <Briefcase size={20} />
              <span>CRM Clients</span>
            </button>
            <button onClick={() => handleNavigate('reports')} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all sidebar-item ${currentPath === 'reports' ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
              <TrendingUp size={20} />
              <span>Rapports IA</span>
            </button>

            <div className="pt-6 pb-2 px-5">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Outils</span>
            </div>
            {['chat', 'team', 'files'].map(id => {
              const item = moreMenuItems.find(m => m.id === id)!;
              return (
                <button key={id} onClick={() => handleNavigate(id)} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all sidebar-item ${currentPath === id ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button onClick={() => handleNavigate('settings')} className="w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-white transition-all group">
                <img src={currentUser.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                <div className="flex-1 text-left truncate">
                    <p className="font-black text-slate-900 text-xs truncate uppercase">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{currentUser.role}</p>
                </div>
            </button>
            <button onClick={onLogout} className="w-full mt-2 flex items-center justify-center space-x-3 p-4 text-red-500 font-black bg-white rounded-2xl shadow-sm hover:bg-red-50 transition-colors text-[10px] uppercase tracking-widest">
                <LogOut size={16} />
                <span>Déconnexion</span>
            </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="lg:hidden sticky top-0 flex items-center justify-between px-5 py-3 safe-pt bg-white/95 backdrop-blur-md z-[50] border-b border-slate-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-[10px]">iV</div>
          <span className="font-black text-base tracking-tighter">iVISION</span>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400"><Search size={20} /></button>
          <button onClick={() => handleNavigate('settings')} className="w-8 h-8 rounded-full overflow-hidden border border-slate-100">
            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full bg-white relative min-h-screen">
        <div className="w-full max-w-screen-2xl mx-auto px-4 py-6 lg:px-12 lg:py-10 pb-32">
          {children}
        </div>

        {/* MOBILE BOTTOM NAV - HOME, MISSIONS, PLANNING, LEADS + PLUS */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] z-[50] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[32px]">
          {mobileNavItems.map(item => {
            const isActive = currentPath === item.id;
            return (
              <button key={item.id} onClick={() => handleNavigate(item.path)} className="flex flex-col items-center justify-center flex-1 py-1 transition-all active-scale">
                <item.icon size={20} className={isActive ? 'text-primary' : 'text-slate-300'} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[8px] font-black mt-1 uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-slate-400 opacity-60'}`}>{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setIsMoreMenuOpen(true)} className="flex flex-col items-center justify-center flex-1 py-1 text-slate-300 active-scale relative">
            <Menu size={20} />
            {(unreadMessageCount > 0) && <span className="absolute top-1 right-1/2 translate-x-3 w-2 h-2 bg-primary rounded-full border border-white"></span>}
            <span className="text-[8px] font-black mt-1 uppercase tracking-tighter opacity-60">Plus</span>
          </button>
        </nav>
      </main>

      {/* MORE MENU DRAWER */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-100" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[40px] p-6 pb-[calc(32px+env(safe-area-inset-bottom))] modal-drawer shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="grid grid-cols-3 gap-3">
              {moreMenuItems.map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-3xl border border-slate-100 active-scale relative transition-all">
                  <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-sm ${item.color}`}>
                    <item.icon size={22} />
                  </div>
                  {item.badge && <span className="absolute top-3 right-5 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">{unreadMessageCount}</span>}
                  <span className="font-black text-slate-700 text-[8px] uppercase tracking-widest text-center">{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="w-full mt-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 active-scale">
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
