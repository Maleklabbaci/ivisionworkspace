
import React from 'react';
import { LayoutDashboard, CheckSquare, MessageSquare, BarChart2, LogOut, Users as UsersIcon, FolderOpen } from 'lucide-react';
import { User, ViewState, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, currentView, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'chat', label: 'Chat & Équipe', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.MEMBER, UserRole.PROJECT_MANAGER, UserRole.COMMUNITY_MANAGER, UserRole.ANALYST] },
    { id: 'files', label: 'Fichiers', icon: FolderOpen, roles: [UserRole.ADMIN] },
    { id: 'reports', label: 'Rapports', icon: BarChart2, roles: [UserRole.ADMIN] },
    { id: 'team', label: 'Membres', icon: UsersIcon, roles: [UserRole.ADMIN] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 hidden md:flex flex-col transition-all duration-300 ease-in-out">
        <div className="p-6 mb-2">
          <h1 className="text-xl font-bold tracking-tight text-secondary">
            <span className="text-primary">i</span>VISION AGENCY
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {visibleNavItems.map((item) => {
             const Icon = item.icon;
             const isActive = currentView === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => onNavigate(item.id as ViewState)}
                 className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm group ${
                   isActive 
                     ? 'bg-primary text-white shadow-md shadow-primary/20 translate-x-1' 
                     : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:translate-x-1'
                 }`}
               >
                 <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                 <span className="font-medium">{item.label}</span>
               </button>
             );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 mb-4 px-1">
            <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate" title={currentUser.role}>{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-urgent hover:border-red-100 text-xs text-slate-600 transition-all font-medium"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F3F4F6]">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 shadow-sm">
          <span className="font-bold text-secondary text-lg">
            <span className="text-primary">i</span>VISION AGENCY
          </span>
          <div className="flex space-x-4">
             {visibleNavItems.slice(0, 4).map(item => (
               <button key={item.id} onClick={() => onNavigate(item.id as ViewState)} className={`${currentView === item.id ? 'text-primary scale-110' : 'text-slate-400'} transition-all`}>
                 <item.icon size={22} />
               </button>
             ))}
          </div>
        </header>

        {/* Content Scroll Area with Page Transitions */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           <div key={currentView} className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
