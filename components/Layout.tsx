
import React, { useState, useMemo } from 'react';
import { LogOut, Plus, X, LayoutGrid as LayoutIcon, CheckSquare as TaskIcon, MessageSquare as ChatIcon, Briefcase as ClientIcon, Target as LeadIcon, FileText as FileIcon, Calendar as CalIcon, BarChart3 as ReportIcon, Users as TeamIcon, Settings as SettingsIcon, Layers, Wallet } from 'lucide-react';
import { User, UserPermissions, UserRole, Message, Channel } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  messages: Message[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, messages = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const hasAccess = (permissionKey?: keyof UserPermissions, requiredRole?: UserRole): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (requiredRole && currentUser.role !== requiredRole) return false;
    if (permissionKey) {
      const perms = currentUser.permissions || {};
      return !!(perms as any)[permissionKey];
    }
    return true;
  };

  const unreadCount = useMemo(() => {
    return messages.filter(m => m.userId !== currentUser?.id && !m.readBy?.includes(currentUser?.id)).length;
  }, [messages, currentUser?.id]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutIcon, color: 'text-sky-400', bg: 'bg-sky-400', allowed: true },
    { id: 'projects', label: 'Projets', icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-400', allowed: hasAccess('canManageProjects') },
    { id: 'tasks', label: 'Missions', icon: TaskIcon, color: 'text-violet-400', bg: 'bg-violet-400', allowed: true },
    { id: 'chat', label: 'Chat', icon: ChatIcon, color: 'text-indigo-400', bg: 'bg-indigo-400', allowed: hasAccess('canManageChat'), badge: unreadCount },
    { id: 'clients', label: 'CRM', icon: ClientIcon, color: 'text-emerald-400', bg: 'bg-emerald-400', allowed: hasAccess('canManageClients') },
    { id: 'leads', label: 'Leads', icon: LeadIcon, color: 'text-orange-400', bg: 'bg-orange-400', allowed: hasAccess('canManageLeads') },
    { id: 'finance', label: 'Finance', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-400', allowed: hasAccess('canManageFinances') },
    { id: 'files', label: 'Documents', icon: FileIcon, color: 'text-blue-400', bg: 'bg-blue-400', allowed: hasAccess('canViewFiles') },
    { id: 'calendar', label: 'Planning', icon: CalIcon, color: 'text-rose-400', bg: 'bg-rose-400', allowed: true },
    { id: 'reports', label: 'Rapports', icon: ReportIcon, color: 'text-pink-400', bg: 'bg-pink-400', allowed: hasAccess('canViewReports') },
    { id: 'team', label: 'Équipe', icon: TeamIcon, color: 'text-slate-400', bg: 'bg-slate-400', allowed: currentUser?.role === UserRole.ADMIN },
  ];

  const visibleNavItems = navItems.filter(item => item.allowed);
  const userAvatar = currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.id || 'default'}`;

  const renderBadge = (count: number) => {
    if (!count || count <= 0) return null;
    return (
      <div className="min-w-[18px] h-4.5 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse border border-white/20 shadow-lg shadow-rose-500/20">
        {count > 99 ? '99+' : count}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-white/5 z-20">
        <div className="p-8 flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">iV</div>
          <span className="text-xl font-extrabold tracking-tight text-white uppercase">iVISION</span>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar pb-6 text-left">
          {visibleNavItems.map(item => (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all relative ${currentPath === item.id ? `${item.bg} text-white shadow-xl` : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
              <div className="flex items-center space-x-3.5">
                <item.icon size={18} className={currentPath === item.id ? 'text-white' : item.color} />
                <span className="text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
              </div>
              {item.badge !== undefined && renderBadge(item.badge)}
            </button>
          ))}
        </nav>
        <div className="p-6 mt-auto border-t border-white/5">
          <button onClick={() => navigate('/settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentPath === 'settings' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>
            <img src={userAvatar} className="w-6 h-6 rounded-full border border-white/10" alt="" />
            <span className="text-[11px] font-bold uppercase tracking-tight truncate">{currentUser?.name || 'Profil'}</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors text-[11px] font-bold uppercase tracking-tight">
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-6 py-4 glass border-b border-white/5 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black">iV</div>
            <span className="text-sm font-black text-white uppercase tracking-tight">iVISION</span>
          </div>
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full overflow-hidden border border-white/10 active-scale">
            <img src={userAvatar} alt="" className="w-full h-full object-cover" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-10 pb-40 lg:pb-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        
        <nav className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-sm h-16 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex justify-between items-center px-4 z-[100] shadow-2xl border border-white/10">
          {visibleNavItems.slice(0, 4).map(item => (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)} className={`relative flex items-center justify-center w-11 h-11 rounded-[1.25rem] transition-all active-scale ${currentPath === item.id ? `${item.bg} text-white shadow-xl` : 'text-slate-500'}`}>
              <item.icon size={20} strokeWidth={2.5} />
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
            </button>
          ))}
          <button onClick={() => setIsMoreMenuOpen(true)} className="w-11 h-11 bg-white/15 rounded-[1.25rem] flex items-center justify-center text-white active-scale border border-white/10">
            <Plus size={22} strokeWidth={3} />
          </button>
        </nav>
      </div>

      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end animate-fade-in lg:hidden">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative glass border-t border-white/10 rounded-t-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl pb-safe-bottom">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-2"></div>
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Navigation Étendue</h3>
              <button onClick={() => setIsMoreMenuOpen(false)} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-slate-400"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {visibleNavItems.slice(4).map(item => (
                <button key={item.id} onClick={() => { navigate(`/${item.id}`); setIsMoreMenuOpen(false); }} className="relative flex flex-col items-center space-y-2.5 p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 active-scale">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase text-center tracking-tight leading-none">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute top-2 right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white/20">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </button>
              ))}
              <button onClick={onLogout} className="flex flex-col items-center space-y-2.5 p-4 rounded-[1.5rem] bg-rose-500/5 border border-rose-500/10 active-scale text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                <span className="text-[9px] font-black uppercase text-center tracking-tight leading-none">Sortie</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
