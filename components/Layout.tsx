
import React, { useState } from 'react';
import { LogOut, Plus, X, LayoutGrid as LayoutIcon, CheckSquare as TaskIcon, MessageSquare as ChatIcon, Briefcase as ClientIcon, Target as LeadIcon, FileText as FileIcon, Calendar as CalIcon, BarChart3 as ReportIcon, Users as TeamIcon, Settings as SettingsIcon, Layers, Wallet } from 'lucide-react';
import { User, UserPermissions, UserRole } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.replace('/', '') || 'dashboard';
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const hasAccess = (permissionKey?: keyof UserPermissions, requiredRole?: UserRole): boolean => {
    if (!currentUser) return false;
    // L'admin a toujours accès à tout
    if (currentUser.role === UserRole.ADMIN) return true;
    
    // Si un rôle spécifique est requis (ex: ADMIN pour la gestion d'équipe)
    if (requiredRole && currentUser.role !== requiredRole) return false;

    // Si une permission spécifique est requise
    if (permissionKey) {
      const perms = currentUser.permissions || {};
      return !!(perms as any)[permissionKey];
    }
    
    return true;
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutIcon, color: 'text-sky-400', bg: 'bg-sky-400', allowed: true },
    { id: 'projects', label: 'Projets', icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-400', allowed: true },
    { id: 'tasks', label: 'Missions', icon: TaskIcon, color: 'text-violet-400', bg: 'bg-violet-400', allowed: true },
    { id: 'chat', label: 'Chat', icon: ChatIcon, color: 'text-indigo-400', bg: 'bg-indigo-400', allowed: hasAccess('canManageChat') },
    { id: 'clients', label: 'CRM', icon: ClientIcon, color: 'text-emerald-400', bg: 'bg-emerald-400', allowed: hasAccess('canManageClients') },
    { id: 'leads', label: 'Leads', icon: LeadIcon, color: 'text-orange-400', bg: 'bg-orange-400', allowed: hasAccess('canManageLeads') },
    { id: 'finance', label: 'Finance', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-400', allowed: currentUser.role === UserRole.ADMIN || hasAccess('canManageFinances') },
    { id: 'files', label: 'Documents', icon: FileIcon, color: 'text-blue-400', bg: 'bg-blue-400', allowed: hasAccess('canViewFiles') },
    { id: 'calendar', label: 'Planning', icon: CalIcon, color: 'text-rose-400', bg: 'bg-rose-400', allowed: true },
    { id: 'reports', label: 'Rapports', icon: ReportIcon, color: 'text-pink-400', bg: 'bg-pink-400', allowed: hasAccess('canViewReports') },
    { id: 'team', label: 'Équipe', icon: TeamIcon, color: 'text-slate-400', bg: 'bg-slate-400', allowed: currentUser.role === UserRole.ADMIN },
  ];

  const visibleNavItems = navItems.filter(item => item.allowed);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-white/5 z-20">
        <div className="p-8 flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">iV</div>
          <span className="text-xl font-extrabold tracking-tighter text-white uppercase">iVISION</span>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar pb-6">
          {visibleNavItems.map(item => (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)} className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all ${currentPath === item.id ? `${item.bg} text-white shadow-xl` : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
              <item.icon size={18} className={currentPath === item.id ? 'text-white' : item.color} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 mt-auto border-t border-white/5">
          <button onClick={() => navigate('/settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentPath === 'settings' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>
            <img src={currentUser.avatar} className="w-6 h-6 rounded-full border border-white/10" alt="" />
            <span className="text-[11px] font-bold uppercase tracking-wider truncate">Mon Profil</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors text-[11px] font-bold uppercase tracking-wider">
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-6 py-4 glass border-b border-white/5 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black">iV</div>
            <span className="text-sm font-black text-white uppercase tracking-tighter">iVISION</span>
          </div>
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
            <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-10 pb-28">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 glass rounded-full px-2 flex justify-between items-center z-50 shadow-2xl border border-white/10">
          {visibleNavItems.slice(0, 4).map(item => (
            <button key={item.id} onClick={() => navigate(`/${item.id}`)} className={`flex-1 h-12 rounded-full flex flex-col items-center justify-center transition-all ${currentPath === item.id ? `${item.bg} text-white shadow-lg` : 'text-slate-500'}`}>
              <item.icon size={18} />
            </button>
          ))}
          <button onClick={() => setIsMoreMenuOpen(true)} className="flex-1 h-12 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <Plus size={22} />
          </button>
        </nav>
      </div>

      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="relative glass border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Autres sections</h3>
              <button onClick={() => setIsMoreMenuOpen(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-4">
              {visibleNavItems.slice(4).map(item => (
                <button key={item.id} onClick={() => { navigate(`/${item.id}`); setIsMoreMenuOpen(false); }} className="flex flex-col items-center space-y-3 p-5 rounded-2xl glass hover:bg-white/10 transition-all">
                  <item.icon size={22} className={item.color} />
                  <span className="text-[8px] font-bold text-slate-400 uppercase text-center tracking-widest">{item.label}</span>
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
