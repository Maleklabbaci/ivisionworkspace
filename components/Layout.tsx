
import React from 'react';
import { LayoutGrid, CheckSquare, MessageSquare, Briefcase, Settings, LogOut, Menu, Users, Target, FileText, Calendar as CalendarIcon, BarChart3, Search } from 'lucide-react';
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, color: 'text-sky-400', bg: 'bg-sky-400', shadow: 'shadow-sky-500/20' },
    { id: 'tasks', label: 'Missions', icon: CheckSquare, color: 'text-violet-400', bg: 'bg-violet-400', shadow: 'shadow-violet-500/20' },
    { id: 'chat', label: 'Messages', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-400', shadow: 'shadow-indigo-500/20' },
    { id: 'leads', label: 'Leads', icon: Target, color: 'text-orange-400', bg: 'bg-orange-400', shadow: 'shadow-orange-500/20' },
    { id: 'clients', label: 'CRM', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-400', shadow: 'shadow-emerald-500/20' },
    { id: 'files', label: 'Documents', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400', shadow: 'shadow-blue-500/20' },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon, color: 'text-rose-400', bg: 'bg-rose-400', shadow: 'shadow-rose-500/20' },
    { id: 'reports', label: 'Rapports', icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-400', shadow: 'shadow-pink-500/20' },
    { id: 'team', label: 'Équipe', icon: Users, color: 'text-slate-400', bg: 'bg-slate-400', shadow: 'shadow-slate-500/20' },
  ];

  const currentItem = navItems.find(i => i.id === currentPath) || navItems[0];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      {/* Sidebar Desktop */}
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
        <header className="lg:hidden flex items-center justify-between px-6 py-4 glass border-b border-white/5 z-20">
          <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black text-sm">iV</div>
          <span className={`text-[10px] font-extrabold px-4 py-1.5 rounded-full border border-white/10 ${currentItem.color} glass uppercase tracking-[0.2em]`}>
            {currentItem.label}
          </span>
          <button onClick={() => navigate('/settings')} className="text-slate-400">
             <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto p-6 lg:p-10 pb-32">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Bar */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 glass rounded-[2rem] px-2 flex justify-around items-center z-50 shadow-2xl border border-white/10">
          {navItems.filter(i => ['dashboard', 'tasks', 'chat', 'leads', 'clients'].includes(i.id)).map(item => {
            const isActive = currentPath === item.id;
            return (
              <button key={item.id} onClick={() => navigate(`/${item.id}`)} className={`p-3.5 rounded-2xl transition-all ${isActive ? `${item.bg} text-white shadow-lg scale-110 -translate-y-1` : 'text-slate-500'}`}>
                <item.icon size={20} />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
