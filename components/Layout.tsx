import React, { useState, useRef } from 'react';
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: 'dashboard' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, path: 'tasks' },
    { id: 'chat', label: 'Communication', icon: MessageSquare, path: 'chat' },
    { id: 'clients', label: 'Clients CRM', icon: Briefcase, path: 'clients' },
    { id: 'team', label: 'Équipe', icon: Users, path: 'team' },
    { id: 'files', label: 'Documents', icon: FileText, path: 'files' },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon, path: 'calendar' },
  ];

  const handleNavigate = (path: string) => {
    navigate(`/${path}`);
    setIsMoreMenuOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  return (
    <div className="flex h-screen bg-white md:bg-slate-50 overflow-hidden font-sans text-slate-900">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 shadow-sm z-50">
        <div className="p-8 flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-xl shadow-primary/20">iV</div>
            <span className="font-black text-2xl tracking-tighter">iVISION</span>
        </div>
        
        <nav className="flex-1 px-6 space-y-1 overflow-y-auto no-scrollbar">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-3">Workspace</p>
            {navItems.map(item => {
                const isActive = currentPath === item.id;
                return (
                    <button 
                        key={item.id}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center space-x-4 px-4 py-4 rounded-3xl transition-all duration-300 group ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        {item.id === 'chat' && unreadMessageCount > 0 && !isActive && (
                            <div className="ml-auto w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-lg">{unreadMessageCount}</div>
                        )}
                    </button>
                );
            })}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50">
            <button 
                onClick={() => handleNavigate('settings')}
                className="w-full flex items-center space-x-4 p-4 rounded-3xl hover:bg-slate-50 transition-all group"
            >
                <img src={currentUser.avatar} className="w-10 h-10 rounded-2xl object-cover shadow-md" alt="" />
                <div className="flex-1 text-left overflow-hidden">
                    <p className="font-black text-slate-900 text-sm truncate">{currentUser.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
                </div>
            </button>
            <button onClick={onLogout} className="w-full mt-4 flex items-center justify-center space-x-2 p-4 text-red-500 font-bold bg-red-50/50 rounded-2xl hover:bg-red-50 transition-all">
                <LogOut size={18} />
                <span className="text-xs uppercase tracking-widest">Déconnexion</span>
            </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 px-6 py-4 flex items-center justify-between safe-pt bg-white/80 backdrop-blur-md z-40 border-b border-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-primary/20">iV</div>
          <span className="font-extrabold text-xl tracking-tighter">iVISION</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400 active-scale"><Search size={22} /></button>
          <button onClick={() => handleNavigate('settings')} className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden active-scale shadow-sm">
            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main 
        ref={mainRef}
        className="flex-1 flex flex-col relative overflow-hidden"
      >
        {/* Desktop Topbar */}
        <div className="hidden md:flex items-center justify-between p-8 bg-white/50 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center bg-white border border-slate-100 rounded-3xl px-6 py-3 w-96 shadow-sm focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                <Search size={18} className="text-slate-300 mr-3" />
                <input 
                    type="text" 
                    placeholder="Recherche globale (Cmd+K)" 
                    onFocus={() => setIsSearchOpen(true)}
                    className="bg-transparent outline-none flex-1 text-sm font-bold text-slate-900 placeholder-slate-300" 
                />
            </div>
            <div className="flex items-center space-x-4">
                <button className="p-4 bg-white rounded-2xl text-slate-400 border border-slate-50 shadow-sm relative active-scale">
                    <Bell size={22} />
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-urgent rounded-full border-4 border-white"></div>
                </button>
                <div className="h-10 w-px bg-slate-100 mx-2"></div>
                <button onClick={() => handleNavigate('calendar')} className="flex items-center space-x-3 px-6 py-3 bg-white border border-slate-50 rounded-2xl shadow-sm active-scale">
                    <CalendarIcon size={20} className="text-primary" />
                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-900">Aujourd'hui</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-24 md:pt-4 md:px-12 pb-32 md:pb-12 bg-white md:bg-slate-50/50">
            <div className="max-w-7xl mx-auto h-full">
                {children}
            </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-6 pt-3 pb-[calc(10px+env(safe-area-inset-bottom))] z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[32px]">
        {[
            { id: 'dashboard', label: 'Home', icon: LayoutGrid, path: 'dashboard' },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: 'tasks' },
            { id: 'chat', label: 'Chat', icon: MessageSquare, path: 'chat' },
            { id: 'clients', label: 'Clients', icon: Briefcase, path: 'clients' },
        ].map(item => {
          const isActive = currentPath === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => handleNavigate(item.path)}
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
          <span className="text-[9px] font-bold mt-1 opacity-60">Plus</span>
        </button>
      </nav>

      {/* MOBILE MORE MENU DRAWER */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative bg-white rounded-t-[48px] p-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-400 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'calendar', label: 'Planning', icon: CalendarIcon, color: 'text-primary' },
                { id: 'reports', label: 'Rapports', icon: Bell, color: 'text-warning' },
                { id: 'team', label: 'Équipe', icon: Users, color: 'text-success' },
                { id: 'settings', label: 'Réglages', icon: Settings, color: 'text-slate-400' }
              ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleNavigate(item.id)}
                  className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-4xl active-scale transition-all border border-slate-100 shadow-sm"
                >
                  <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 ${item.color}`}>
                    <item.icon size={28} />
                  </div>
                  <span className="font-black text-slate-700 text-sm tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="w-full mt-6 p-6 text-red-500 font-black bg-red-50 rounded-4xl active-scale flex items-center justify-center space-x-3 shadow-sm uppercase text-xs tracking-widest border border-red-100">
                <LogOut size={22} />
                <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;