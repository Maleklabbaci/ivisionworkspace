
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

  return (
    <div className="md:h-screen md:w-screen md:flex md:items-center md:justify-center overflow-hidden font-sans text-slate-900">
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      />
      
      {/* WRAPPER FENÊTRÉ SUR DESKTOP */}
      <div className="app-window flex h-full w-full bg-white relative overflow-hidden">
        
        {/* DESKTOP SIDEBAR - Plus compacte (w-60 au lieu de w-64) */}
        <aside className="hidden md:flex flex-col w-60 bg-slate-50 border-r border-slate-100 z-50">
          <div className="p-5 flex items-center space-x-2.5 mb-2">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-lg shadow-primary/20">iV</div>
              <span className="font-black text-lg tracking-tighter">iVISION</span>
          </div>
          
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 px-3">Opérations</p>
              {navItems.map(item => {
                  const isActive = currentPath === item.id;
                  return (
                      <button 
                          key={item.id}
                          onClick={() => handleNavigate(item.path)}
                          className={`w-full flex items-center space-x-2.5 px-3.5 py-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
                      >
                          <item.icon size={16} strokeWidth={isActive ? 3 : 2} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                          <span className="font-bold text-[11px] tracking-tight">{item.label}</span>
                          {item.id === 'chat' && unreadMessageCount > 0 && !isActive && (
                              <div className="ml-auto w-3.5 h-3.5 bg-primary text-white text-[7px] flex items-center justify-center rounded-md font-black">{unreadMessageCount}</div>
                          )}
                      </button>
                  );
              })}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-100/50">
              <button 
                  onClick={() => handleNavigate('settings')}
                  className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-white transition-all group hover:shadow-sm"
              >
                  <img src={currentUser.avatar} className="w-7 h-7 rounded-lg object-cover shadow-sm" alt="" />
                  <div className="flex-1 text-left overflow-hidden">
                      <p className="font-black text-slate-900 text-[10px] truncate">{currentUser.name}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
                  </div>
              </button>
              <button onClick={onLogout} className="w-full mt-2 flex items-center justify-center space-x-2 p-2.5 text-red-500 font-bold bg-red-50/30 rounded-xl hover:bg-red-50 transition-all">
                  <LogOut size={12} />
                  <span className="text-[8px] uppercase tracking-widest">Sortie</span>
              </button>
          </div>
        </aside>

        {/* MOBILE HEADER */}
        <header className="md:hidden fixed top-0 left-0 right-0 px-5 py-3.5 flex items-center justify-between safe-pt bg-white/80 backdrop-blur-md z-40 border-b border-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-lg shadow-primary/20">iV</div>
            <span className="font-extrabold text-lg tracking-tighter">iVISION</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-slate-400 active-scale"><Search size={20} /></button>
            <button onClick={() => handleNavigate('settings')} className="w-9 h-9 rounded-full border border-slate-100 overflow-hidden active-scale shadow-sm">
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main 
          ref={mainRef}
          className="flex-1 flex flex-col relative overflow-hidden bg-white"
        >
          {/* Desktop Topbar - Ultra compacte */}
          <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-50">
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-64 shadow-sm focus-within:ring-4 focus-within:ring-primary/5 transition-all focus-within:bg-white">
                  <Search size={14} className="text-slate-300 mr-2.5" />
                  <input 
                      type="text" 
                      placeholder="Recherche (Cmd+K)" 
                      onFocus={() => setIsSearchOpen(true)}
                      className="bg-transparent outline-none flex-1 text-[10px] font-bold text-slate-900 placeholder-slate-300" 
                  />
              </div>
              <div className="flex items-center space-x-2.5">
                  <button className="p-2.5 bg-white rounded-xl text-slate-400 border border-slate-50 shadow-sm relative active-scale">
                      <Bell size={16} />
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-urgent rounded-full border-2 border-white"></div>
                  </button>
                  <div className="h-6 w-px bg-slate-100 mx-0.5"></div>
                  <button onClick={() => handleNavigate('calendar')} className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-50 rounded-xl shadow-sm active-scale">
                      <CalendarIcon size={14} className="text-primary" />
                      <span className="font-black text-[8px] uppercase tracking-widest text-slate-900">Planning</span>
                  </button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-20 md:pt-4 md:px-8 pb-32 md:pb-8">
              <div className="max-w-5xl mx-auto h-full">
                  {children}
              </div>
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION - Plus fine */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center px-5 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] rounded-t-[28px]">
          {[
              { id: 'dashboard', label: 'Home', icon: LayoutGrid, path: 'dashboard' },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: 'tasks' },
              { id: 'chat', label: 'Chat', icon: MessageSquare, path: 'chat' },
              { id: 'clients', label: 'CRM', icon: Briefcase, path: 'clients' },
          ].map(item => {
            const isActive = currentPath === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 transition-all relative"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'text-primary' : 'text-slate-300'}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[8px] font-bold mt-0.5 transition-all ${isActive ? 'text-primary opacity-100' : 'text-slate-400 opacity-60'}`}>
                  {item.label}
                </span>
                {item.id === 'chat' && unreadMessageCount > 0 && (
                  <div className="absolute top-0 right-1/4 bg-red-500 text-white text-[7px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 border-white">{unreadMessageCount}</div>
                )}
              </button>
            );
          })}
          <button 
            onClick={() => setIsMoreMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 text-slate-300"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <Menu size={22} strokeWidth={2} />
            </div>
            <span className="text-[8px] font-bold mt-0.5 opacity-60">Plus</span>
          </button>
        </nav>

        {/* MOBILE MORE MENU DRAWER */}
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMoreMenuOpen(false)}></div>
            <div className="relative bg-white rounded-t-[40px] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-400 shadow-2xl">
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-8"></div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'calendar', label: 'Planning', icon: CalendarIcon, color: 'text-primary' },
                  { id: 'reports', label: 'Rapports', icon: Bell, color: 'text-warning' },
                  { id: 'team', label: 'Équipe', icon: Users, color: 'text-success' },
                  { id: 'settings', label: 'Réglages', icon: Settings, color: 'text-slate-400' }
                ].map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleNavigate(item.id)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl active-scale transition-all border border-slate-100 shadow-sm"
                  >
                    <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 ${item.color}`}>
                      <item.icon size={22} />
                    </div>
                    <span className="font-black text-slate-700 text-xs tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={onLogout} className="w-full mt-5 p-5 text-red-500 font-black bg-red-50 rounded-3xl active-scale flex items-center justify-center space-x-2 shadow-sm uppercase text-[9px] tracking-widest border border-red-100">
                  <LogOut size={18} />
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
