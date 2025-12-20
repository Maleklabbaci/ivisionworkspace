import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, ChevronRight, Search, Menu, X, Calendar as CalendarIcon } from 'lucide-react';
import { User, Task, Message, Channel, FileLink } from '../types';
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
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const currentScrollY = mainRef.current.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        if (showHeader) setShowHeader(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 10) {
        if (!showHeader) setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    const container = mainRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, showHeader]);

  const navItems = [
    { id: 'dashboard', label: 'HOME', icon: LayoutGrid },
    { id: 'tasks', label: 'TÂCHES', icon: CheckSquare },
    { id: 'chat', label: 'CHAT', icon: MessageSquare },
    { id: 'clients', label: 'CLIENTS', icon: Briefcase },
  ];

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    setShowHeader(true);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 select-none">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* Header - Z-Index 40 */}
      <header className={`px-5 py-4 bg-white/95 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between z-40 safe-top fixed top-0 left-0 right-0 transition-all duration-500 ease-in-out ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20">iV</div>
          <span className="font-black text-2xl tracking-tighter">iVISION</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsSearchOpen(true)} className="p-3 text-slate-400 bg-slate-50 rounded-2xl active-scale transition-colors hover:text-primary"><Search size={20} /></button>
          <button onClick={() => handleNavigate('settings')} className="w-11 h-11 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-slate-200 active-scale ring-1 ring-slate-100">
            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </div>
      </header>

      {/* Main Content Area - Pas de z-index ici pour laisser les modales enfants monter au-dessus de la nav */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto px-4 pt-24 pb-32 no-scrollbar relative"
      >
        <div className="max-w-5xl mx-auto h-full">
           {children}
        </div>
      </main>

      {/* Bottom Navigation - Z-Index 40 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[40px]">
        {navItems.map(item => {
          const isActive = currentPath === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 relative group`}
            >
              <div className={`w-12 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-300'}`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-black tracking-widest mt-1.5 transition-all duration-300 ${isActive ? 'text-primary opacity-100' : 'text-slate-300 opacity-60'}`}>
                {item.label}
              </span>
              {item.id === 'chat' && unreadMessageCount > 0 && (
                <div className="absolute top-0 right-1/4 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{unreadMessageCount}</div>
              )}
            </button>
          );
        })}
        <button 
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 text-slate-300 group"
        >
          <div className="w-12 h-10 flex items-center justify-center rounded-2xl group-active:bg-slate-50">
            <Menu size={24} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-black tracking-widest mt-1.5 opacity-60">PLUS</span>
        </button>
      </nav>

      {/* More Menu / Global Modals - Z-Index 100 */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-400 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
                { id: 'reports', label: 'Rapports IA', icon: Briefcase },
                { id: 'files', label: 'Documents', icon: CheckSquare },
                { id: 'team', label: 'Équipe', icon: Settings },
                { id: 'settings', label: 'Paramètres', icon: Settings }
              ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleNavigate(item.id)}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] active:bg-slate-100 active-scale group transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-active:text-primary shadow-sm border border-slate-100">
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-200" />
                </button>
              ))}
              <button onClick={onLogout} className="w-full flex items-center space-x-4 p-5 text-red-500 font-bold mt-4 bg-red-50/30 rounded-[2rem] active-scale">
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;