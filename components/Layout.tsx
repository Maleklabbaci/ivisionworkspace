
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Search, Menu, X, Calendar as CalendarIcon, Bell, Users, FileText, ChevronRight } from 'lucide-react';
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
  
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const navOrder = useMemo(() => ['dashboard', 'tasks', 'chat', 'clients'], []);
  const [animationClass, setAnimationClass] = useState('fade-in-up');
  const prevPathIndex = useRef(navOrder.indexOf(currentPath));

  useEffect(() => {
    const currentIndex = navOrder.indexOf(currentPath);
    if (currentIndex !== -1 && prevPathIndex.current !== -1) {
      if (currentIndex > prevPathIndex.current) {
        setAnimationClass('slide-from-right');
      } else if (currentIndex < prevPathIndex.current) {
        setAnimationClass('slide-from-left');
      } else {
        setAnimationClass('fade-in-up');
      }
    } else {
      setAnimationClass('fade-in-up');
    }
    prevPathIndex.current = currentIndex;
  }, [currentPath, navOrder]);

  // SWIPE LOGIC WITH VERTICAL PROTECTION
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: 'dashboard' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, path: 'tasks' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: 'chat' },
    { id: 'clients', label: 'CRM', icon: Briefcase, path: 'clients' },
    { id: 'team', label: 'Équipe', icon: Users, path: 'team' },
    { id: 'files', label: 'Docs', icon: FileText, path: 'files' },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon, path: 'calendar' },
  ];

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const threshold = 70;

    // PROTECTION : Si le mouvement est plus vertical qu'horizontal, c'est un scroll, pas un swipe.
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    const target = e.target as HTMLElement;
    // Ne pas swiper si on interagit avec un élément de défilement horizontal spécifique (ex: Board Kanban)
    if (target.closest('.board-container, .no-swipe-nav, .recharts-responsive-container, .modal-content')) return;

    if (Math.abs(deltaX) > threshold) {
      const currentIndex = navOrder.indexOf(currentPath);
      if (currentIndex === -1) return;

      if (deltaX > 0 && currentIndex < navOrder.length - 1) {
        handleNavigate(navOrder[currentIndex + 1]);
      } else if (deltaX < 0 && currentIndex > 0) {
        handleNavigate(navOrder[currentIndex - 1]);
      }
    }
  };

  return (
    <div className="md:h-screen md:w-screen md:flex md:items-center md:justify-center overflow-hidden font-sans text-slate-900 bg-slate-50">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      <div className="app-window flex h-full w-full bg-white relative overflow-hidden shadow-2xl">
        
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden md:flex flex-col w-56 bg-slate-50 border-r border-slate-100 z-50">
          <div className="p-4 flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-extrabold text-[10px] shadow-md shadow-primary/20">iV</div>
              <span className="font-black text-base tracking-tighter">iVISION</span>
          </div>
          <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto no-scrollbar">
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 px-3">Opérations</p>
              {navItems.map(item => {
                  const isActive = currentPath === item.id;
                  return (
                      <button 
                          key={item.id}
                          onClick={() => handleNavigate(item.path)}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 group ${isActive ? 'bg-primary text-white shadow-md shadow-primary/10' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
                      >
                          <item.icon size={14} strokeWidth={isActive ? 3 : 2} />
                          <span className="font-bold text-[10px] tracking-tight">{item.label}</span>
                          {item.id === 'chat' && unreadMessageCount > 0 && !isActive && (
                              <div className="ml-auto w-3 h-3 bg-primary text-white text-[6px] flex items-center justify-center rounded-md font-black">{unreadMessageCount}</div>
                          )}
                      </button>
                  );
              })}
          </nav>
          <div className="p-3 mt-auto border-t border-slate-100/50">
              <button onClick={() => handleNavigate('settings')} className="w-full flex items-center space-x-2 p-2 rounded-xl hover:bg-white transition-all group">
                  <img src={currentUser.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                  <div className="flex-1 text-left overflow-hidden">
                      <p className="font-black text-slate-900 text-[9px] truncate">{currentUser.name}</p>
                      <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
                  </div>
              </button>
              <button onClick={onLogout} className="w-full mt-1 flex items-center justify-center space-x-1.5 p-2 text-red-500 font-bold bg-red-50/20 rounded-lg hover:bg-red-50 transition-all">
                  <LogOut size={10} />
                  <span className="text-[7px] uppercase tracking-widest">Sortie</span>
              </button>
          </div>
        </aside>

        {/* MOBILE HEADER */}
        <header className="md:hidden fixed top-0 left-0 right-0 px-4 py-3 flex items-center justify-between safe-pt bg-white/90 backdrop-blur-md z-[60] border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-extrabold text-[10px] shadow-md shadow-primary/20">iV</div>
            <span className="font-extrabold text-base tracking-tighter">iVISION</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400 active-scale"><Search size={18} /></button>
            <button onClick={() => handleNavigate('settings')} className="w-8 h-8 rounded-full border border-slate-100 overflow-hidden active-scale shadow-sm">
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
            </button>
          </div>
        </header>

        <main 
          className="flex-1 flex flex-col relative h-full bg-white"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* DESKTOP HEADER */}
          <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-50">
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 w-56 focus-within:ring-2 focus-within:ring-primary/5 transition-all focus-within:bg-white">
                  <Search size={12} className="text-slate-300 mr-2" />
                  <input type="text" placeholder="Recherche..." onFocus={() => setIsSearchOpen(true)} className="bg-transparent outline-none flex-1 text-[9px] font-bold text-slate-900 placeholder-slate-300" />
              </div>
              <div className="flex items-center space-x-2">
                  <button className="p-2 bg-white rounded-lg text-slate-400 border border-slate-50 shadow-sm relative active-scale">
                      <Bell size={14} />
                      <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-urgent rounded-full border border-white"></div>
                  </button>
                  <button onClick={() => handleNavigate('calendar')} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-50 rounded-lg shadow-sm active-scale">
                      <CalendarIcon size={12} className="text-primary" />
                      <span className="font-black text-[7px] uppercase tracking-widest text-slate-900">Planning</span>
                  </button>
              </div>
          </div>

          {/* MAIN SCROLLABLE CONTENT */}
          <div 
            ref={mainRef}
            key={currentPath} 
            className={`flex-1 overflow-y-auto no-scrollbar pt-16 md:pt-4 px-4 md:px-6 pb-24 md:pb-6 ${animationClass}`}
          >
              <div className="max-w-4xl mx-auto h-full">
                  {children}
              </div>
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] z-[60] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {[
              { id: 'dashboard', label: 'Home', icon: LayoutGrid, path: 'dashboard' },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: 'tasks' },
              { id: 'chat', label: 'Chat', icon: MessageSquare, path: 'chat' },
              { id: 'clients', label: 'CRM', icon: Briefcase, path: 'clients' },
          ].map(item => {
            const isActive = currentPath === item.id;
            return (
              <button key={item.id} onClick={() => handleNavigate(item.path)} className="flex flex-col items-center justify-center flex-1 py-1 transition-all active-scale">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'text-primary' : 'text-slate-300'}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[7px] font-bold mt-0.5 ${isActive ? 'text-primary' : 'text-slate-400 opacity-60'}`}>{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setIsMoreMenuOpen(true)} className="flex flex-col items-center justify-center flex-1 py-1 text-slate-300 active-scale">
            <div className="w-8 h-8 flex items-center justify-center"><Menu size={20} strokeWidth={2} /></div>
            <span className="text-[7px] font-bold mt-0.5 opacity-60">Plus</span>
          </button>
        </nav>

        {/* MOBILE MORE MENU */}
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMoreMenuOpen(false)}></div>
            <div className="relative bg-white rounded-t-[40px] p-6 animate-in slide-in-from-bottom duration-400 pb-[calc(24px+env(safe-area-inset-bottom))]">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'calendar', label: 'Planning', icon: CalendarIcon, color: 'text-primary' },
                  { id: 'reports', label: 'Rapports', icon: Bell, color: 'text-warning' },
                  { id: 'team', label: 'Équipe', icon: Users, color: 'text-success' },
                  { id: 'settings', label: 'Réglages', icon: Settings, color: 'text-slate-400' }
                ].map(item => (
                  <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm active-scale">
                    <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm ${item.color}`}><item.icon size={22} /></div>
                    <span className="font-black text-slate-700 text-[10px] tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={onLogout} className="w-full mt-6 p-5 text-red-500 font-black bg-red-50 rounded-3xl flex items-center justify-center space-x-2 text-[9px] tracking-widest uppercase border border-red-100 active-scale">
                  <LogOut size={16} />
                  <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
