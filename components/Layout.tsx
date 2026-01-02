
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Search, Menu, X, Calendar as CalendarIcon, Bell, Users, FileText } from 'lucide-react';
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
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const navOrder = useMemo(() => ['dashboard', 'tasks', 'chat', 'clients'], []);

  // SMART SWIPE LOGIC
  const touchStart = useRef({ x: 0, y: 0 });
  const isScrolling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { 
      x: e.targetTouches[0].clientX, 
      y: e.targetTouches[0].clientY 
    };
    isScrolling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = Math.abs(e.targetTouches[0].clientX - touchStart.current.x);
    const deltaY = Math.abs(e.targetTouches[0].clientY - touchStart.current.y);
    
    // Si on bouge plus verticalement qu'horizontalement, c'est un scroll
    if (deltaY > 5 && deltaY > deltaX) {
      isScrolling.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Si l'utilisateur était en train de scroller verticalement, on ignore le swipe
    if (isScrolling.current) return;

    const deltaX = touchStart.current.x - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStart.current.y - e.changedTouches[0].clientY);
    const threshold = 80;

    // Protection supplémentaire : le swipe horizontal doit être dominant
    if (deltaY > 50 || Math.abs(deltaX) < threshold) return;

    const target = e.target as HTMLElement;
    if (target.closest('.board-container, .no-swipe-nav, .recharts-responsive-container')) return;

    const currentIndex = navOrder.indexOf(currentPath);
    if (currentIndex === -1) return;

    if (deltaX > 0 && currentIndex < navOrder.length - 1) {
      handleNavigate(navOrder[currentIndex + 1]);
    } else if (deltaX < 0 && currentIndex > 0) {
      handleNavigate(navOrder[currentIndex - 1]);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    // Scroll to top on page change
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: 'dashboard' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, path: 'tasks' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: 'chat' },
    { id: 'clients', label: 'CRM', icon: Briefcase, path: 'clients' },
  ];

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-white font-sans text-slate-900 overflow-hidden">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-100 z-50">
        <div className="p-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xs">iV</div>
            <span className="font-black text-lg tracking-tighter">iVISION</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
            {navItems.map(item => (
                <button 
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentPath === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
                >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-4 mt-auto border-t border-slate-100">
            <button onClick={() => handleNavigate('settings')} className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white transition-all">
                <img src={currentUser.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                <div className="flex-1 text-left truncate">
                    <p className="font-bold text-slate-900 text-xs truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{currentUser.role}</p>
                </div>
            </button>
            <button onClick={onLogout} className="w-full mt-2 flex items-center justify-center space-x-2 p-3 text-red-500 font-bold bg-red-50 rounded-xl">
                <LogOut size={16} />
                <span className="text-xs uppercase tracking-widest">Sortie</span>
            </button>
        </div>
      </aside>

      {/* MOBILE HEADER - Fixed at top */}
      <header className="md:hidden flex items-center justify-between px-5 py-3 safe-pt bg-white/95 backdrop-blur-md z-[60] border-b border-slate-50 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-[10px]">iV</div>
          <span className="font-black text-base tracking-tighter">iVISION</span>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400"><Search size={20} /></button>
          <button onClick={() => handleNavigate('settings')} className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shadow-sm">
            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main 
        ref={mainRef}
        className="flex-1 flex flex-col relative h-full min-h-0 bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          ref={scrollContainerRef}
          key={currentPath}
          className="flex-1 overflow-y-auto pt-4 md:pt-6 px-4 md:px-8 pb-32 md:pb-8 page-enter no-scrollbar"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>

        {/* MOBILE NAVIGATION BAR - Fixed at bottom */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center px-4 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] z-[60] rounded-t-3xl shadow-xl">
          {navItems.map(item => {
            const isActive = currentPath === item.id;
            return (
              <button key={item.id} onClick={() => handleNavigate(item.path)} className="flex flex-col items-center justify-center flex-1 py-1 transition-all active-scale">
                <item.icon size={20} className={isActive ? 'text-primary' : 'text-slate-300'} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[8px] font-black mt-1 uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-slate-400 opacity-60'}`}>{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setIsMoreMenuOpen(true)} className="flex flex-col items-center justify-center flex-1 py-1 text-slate-300 active-scale">
            <Menu size={20} />
            <span className="text-[8px] font-black mt-1 uppercase tracking-tighter opacity-60">Plus</span>
          </button>
        </nav>
      </main>

      {/* MOBILE MORE MENU */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[40px] p-6 pb-[calc(32px+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'team', label: 'Équipe', icon: Users, color: 'text-primary' },
                { id: 'files', label: 'Docs', icon: FileText, color: 'text-success' },
                { id: 'calendar', label: 'Planning', icon: CalendarIcon, color: 'text-orange-500' },
                { id: 'settings', label: 'Profil', icon: Settings, color: 'text-slate-400' }
              ].map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 active-scale">
                  <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm ${item.color}`}><item.icon size={22} /></div>
                  <span className="font-black text-slate-700 text-[10px] uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="w-full mt-6 p-5 text-red-500 font-black bg-red-50 rounded-3xl flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase border border-red-100">
                <LogOut size={16} />
                <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
