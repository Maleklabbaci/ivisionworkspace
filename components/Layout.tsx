import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, ChevronRight, Search, Menu, X, Calendar as CalendarIcon, Bell } from 'lucide-react';
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

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'clients', label: 'Clients', icon: Briefcase },
  ];

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-sans text-slate-900">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* Dynamic Mobile Header */}
      <header className="px-6 py-4 flex items-center justify-between safe-pt bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-primary/20">iV</div>
          <span className="font-extrabold text-xl tracking-tighter">iVISION</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400 active-scale"><Search size={22} /></button>
          <button onClick={() => handleNavigate('settings')} className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden active-scale">
            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </div>
      </header>

      {/* Optimized Content Area */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar"
      >
        <div className="max-w-md mx-auto h-full pt-4">
           {children}
        </div>
      </main>

      {/* Premium Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-6 pt-3 pb-[calc(10px+env(safe-area-inset-bottom))] z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[32px]">
        {navItems.map(item => {
          const isActive = currentPath === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className="flex flex-col items-center justify-center flex-1 transition-all relative"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'text-primary' : 'text-slate-300'}`}>
                <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-all ${isActive ? 'text-primary opacity-100' : 'text-slate-400 opacity-60'}`}>
                {item.label}
              </span>
              {item.id === 'chat' && unreadMessageCount > 0 && (
                <div className="absolute top-0 right-1/4 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">{unreadMessageCount}</div>
              )}
            </button>
          );
        })}
        <button 
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 text-slate-300"
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <Menu size={26} strokeWidth={2} />
          </div>
          <span className="text-[9px] font-bold mt-1 opacity-60">More</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[40px] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
                { id: 'reports', label: 'Reports', icon: Bell },
                { id: 'team', label: 'Team', icon: Settings },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleNavigate(item.id)}
                  className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] active-scale"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-3">
                    <item.icon size={24} />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="w-full mt-6 p-5 text-red-500 font-bold bg-red-50 rounded-[2rem] active-scale flex items-center justify-center space-x-2">
                <LogOut size={20} />
                <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;