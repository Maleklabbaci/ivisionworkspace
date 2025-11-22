
import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, MessageSquare, Users as UsersIcon, FolderOpen, Menu, X, Settings, LogOut, BarChart3 } from 'lucide-react';
import { User, ViewState, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  unreadMessageCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, currentView, onNavigate, onLogout, unreadMessageCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'reports', label: 'Rapports', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ANALYST] },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'chat', label: 'Chat & Équipe', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'files', label: 'Fichiers', icon: FolderOpen, roles: [UserRole.ADMIN] },
    { id: 'team', label: 'Membres', icon: UsersIcon, roles: [UserRole.ADMIN] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  const handleNavigate = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
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
            const isActive = currentView === item.id;
            const isChat = item.id === 'chat';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as ViewState)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 text-sm group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-1' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                }`}
              >
                <div className="flex items-center space-x-3">
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

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4 px-1 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors" onClick={() => handleNavigate('settings')}>
          <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600 shadow-sm" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-500 truncate" title={currentUser.role}>{currentUser.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleNavigate('settings')}
            className={`flex items-center justify-center space-x-2 p-2 rounded-lg border transition-all text-xs font-medium ${currentView === 'settings' ? 'bg-slate-700 text-white border-slate-600' : 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white'}`}
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

      {/* Mobile Header & Main Content */}
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
          <div className="w-6"></div> {/* Spacer for centering logo roughly */}
        </header>

        {/* Content Scroll Area with Page Transitions */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
           <div key={currentView} className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
