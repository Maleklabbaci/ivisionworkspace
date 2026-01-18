
import React, { useState } from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Menu, Users, Target, FileText, Calendar as CalendarIcon, BarChart3, Search, Plus, X } from 'lucide-react';
import { User } from '../types';
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, color: 'text-sky-400', bg: 'bg-sky-400', shadow: 'shadow-sky-500/20' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, color: 'text-violet-400', bg: 'bg-violet-400', shadow: 'shadow-violet-500/20' },
    { id: 'chat', label: 'Messages', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-400', shadow: 'shadow-indigo-500/20' },
    { id: 'clients', label: 'CRM', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-400', shadow: 'shadow-emerald-500/20' },
    { id: 'leads', label: 'Leads', icon: Target, color: 'text-orange-400', bg: 'bg-orange-400', shadow: 'shadow-orange-500/20' },
    { id: 'files', label: 'Documents', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400', shadow: 'shadow-blue-500/20' },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon, color: 'text-rose-400', bg: 'bg-rose-400', shadow: 'shadow-rose-500/20' },
    { id: 'reports', label: 'Rapports', icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-400', shadow: 'shadow-pink-500/20' },
    { id: 'team', label: 'Équipe', icon: Users, color: 'text-slate-400', bg: 'bg-slate-400', shadow: 'shadow-slate-500/20' },
  ];

  // Les 4 onglets principaux pour mobile
  const mobileMainItems = navItems.slice(0, 4);
  const mobileOverflowItems = navItems.slice(4);

  const currentItem = navItems.find(i => i.id === currentPath) || navItems[0];

  const handleMobileNav = (id: string) => {
    navigate(`/${id}`);
    setIsMoreMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      {/* Sidebar Desktop - Inchangé */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-white/5 relative z-20">
        <div className="p-8 flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-sky-500/20">iV</div>
          <span className="text-xl font-extrabold tracking-tighter text-white uppercase">iVISION</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar pb-6">
          {navItems.map(item => {
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative group ${isActive ? `${item.bg} text-white shadow-lg ${item.shadow} sidebar-item-active` : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <item.icon size={18} className={`transition-colors duration-300 ${isActive ? 'text-white' : item.color}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                {isActive && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <button 
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl mb-3 transition-all ${currentPath === 'settings' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            <img src={currentUser.avatar} className="w-6 h-6 rounded-full border border-white/10" alt="" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Profil</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center space-x-3.5 px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors text-[11px] font-bold uppercase tracking-wider active-scale">
            <LogOut size={18} />
            <span>Quitter</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass border-b border-white/5 z-20 sticky top-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black text-xs">iV</div>
            <span className="text-[10px] font-black text-white tracking-widest uppercase">iVISION</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-[8px] font-extrabold px-3 py-1 rounded-full border border-white/10 ${currentItem.color} glass uppercase tracking-widest`}>
              {currentItem.label}
            </span>
            <button onClick={() => navigate('/settings')} className="text-slate-400">
               <img src={currentUser.avatar} className="w-7 h-7 rounded-full border border-white/10" alt="" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 pb-28 lg:pb-10">
            {children}
          </div>
        </main>

        {/* Mobile "More" Menu Overlay */}
        {isMoreMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" onClick={() => setIsMoreMenuOpen(false)}></div>
            <div className="relative glass border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Menu Avancé iV</h3>
                <button onClick={() => setIsMoreMenuOpen(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-500"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-3 gap-4 pb-4">
                {mobileOverflowItems.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleMobileNav(item.id)}
                    className="flex flex-col items-center space-y-2 p-4 rounded-2xl glass border-white/5 hover:bg-white/10 active-scale"
                  >
                    <item.icon size={22} className={item.color} />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="pt-6 border-t border-white/5 space-y-3">
                <button 
                  onClick={() => handleMobileNav('settings')}
                  className="w-full flex items-center justify-between p-4 glass rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Mon Compte iV</span>
                  </div>
                  <Settings size={16} className="text-slate-500" />
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center p-4 bg-rose-500/10 text-rose-400 font-black text-[10px] uppercase tracking-widest rounded-2xl active-scale"
                >
                  <LogOut size={16} className="mr-3" /> Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Bar - 4 tabs + Plus */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 glass rounded-full px-2 flex justify-between items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10">
          {mobileMainItems.map(item => {
            const isActive = currentPath === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleMobileNav(item.id)} 
                className={`flex-1 h-12 rounded-full transition-all flex flex-col items-center justify-center relative ${isActive ? `${item.bg} text-white shadow-xl scale-105` : 'text-slate-500'}`}
              >
                <item.icon size={isActive ? 20 : 18} />
                {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>}
              </button>
            );
          })}
          
          <button 
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex-1 h-12 rounded-full transition-all flex items-center justify-center ${isMoreMenuOpen ? 'bg-white/10 text-white' : 'text-slate-500'}`}
          >
            <div className="flex flex-col items-center">
              <Plus size={22} strokeWidth={3} className={isMoreMenuOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
