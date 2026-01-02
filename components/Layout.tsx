
import React, { useState } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Search, Menu, Bell, Users, FileText, Calendar as CalendarIcon } from 'lucide-react';
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
  
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    window.scrollTo(0, 0); // Reset scroll on navigation
  };

  // MAIN NAVIGATION ITEMS (Visible directly)
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid, path: 'dashboard' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, path: 'tasks' },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon, path: 'calendar' }, // Calendrier ajouté ici
    { id: 'clients', label: 'CRM', icon: Briefcase, path: 'clients' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans text-slate-900">
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
      <aside className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-100 h-screen sticky top-0">
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
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{currentUser.role}</p>
                </div>
            </button>
            <button onClick={onLogout} className="w-full mt-2 flex items-center justify-center space-x-2 p-3 text-red-500 font-bold bg-red-50 rounded-xl">
                <LogOut size={16} />
                <span className="text-xs uppercase tracking-widest">Sortie</span>
            </button>
        </div>
      </aside>

      {/* MOBILE HEADER - Fixed but non-blocking */}
      <header className="md:hidden sticky top-0 flex items-center justify-between px-5 py-3 safe-pt bg-white/95 backdrop-blur-md z-[50] border-b border-slate-50">
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

      {/* MAIN CONTENT - Direct scrolling */}
      <main className="flex-1 w-full bg-white relative">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 pb-32">
          {children}
        </div>

        {/* MOBILE NAVIGATION - Bottom Fixed */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center px-4 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] z-[50] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[32px]">
          {navItems.map(item => {
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
            {unreadMessageCount > 0 && (
                <span className="absolute top-1 right-4 w-2 h-2 bg-primary rounded-full border border-white"></span>
            )}
            <span className="text-[8px] font-black mt-1 uppercase tracking-tighter opacity-60">Plus</span>
          </button>
        </nav>
      </main>

      {/* MORE MENU - Bottom Drawer style */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[40px] p-6 pb-[calc(32px+env(safe-area-inset-bottom))] modal-drawer">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'team', label: 'Équipe', icon: Users, color: 'text-primary' },
                { id: 'files', label: 'Docs', icon: FileText, color: 'text-success' },
                { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-orange-500', badge: unreadMessageCount > 0 }, // Chat déplacé ici
                { id: 'settings', label: 'Profil', icon: Settings, color: 'text-slate-400' }
              ].map(item => (
                <button key={item.id} onClick={() => handleNavigate(item.id)} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 active-scale relative">
                  <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm ${item.color}`}>
                    <item.icon size={22} />
                  </div>
                  {item.badge && (
                      <span className="absolute top-4 right-8 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                          {unreadMessageCount}
                      </span>
                  )}
                  <span className="font-black text-slate-700 text-[10px] uppercase tracking-widest">{item.label}</span>
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
