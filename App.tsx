
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, ActivityLog } from './types';
import { Loader2, Zap, ShieldCheck, ArrowRight, Fingerprint } from 'lucide-react';

// Pages chargées à la demande
const Dashboard = lazy(() => import('./components/Dashboard'));
const Tasks = lazy(() => import('./components/Tasks'));
const Chat = lazy(() => import('./components/Chat'));
const Team = lazy(() => import('./components/Team'));
const Files = lazy(() => import('./components/Files'));
const Settings = lazy(() => import('./components/Settings'));
const Reports = lazy(() => import('./components/Reports'));
const Clients = lazy(() => import('./components/Clients'));
const Calendar = lazy(() => import('./components/Calendar'));
const Leads = lazy(() => import('./components/Leads'));

const generateUUID = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2);

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing }: any) => (
  <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500 p-6">
    <div className="glass-card rounded-[3.5rem] p-10 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-white/40 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none"></div>
      
      <div className="text-center mb-12 relative z-10">
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-slate-900/30">
            <Zap size={32} fill="currentColor" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">iVISION</h1>
        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.4em] mt-4 flex items-center justify-center">
            <ShieldCheck size={12} className="mr-2" /> PORTAIL SÉCURISÉ
        </p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email iVISION</label>
          <input 
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
            placeholder="nom@ivision.com" 
            className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Clé de sécurité</label>
          <input 
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••" 
            className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm" 
          />
        </div>
        
        <button 
          type="submit"
          disabled={isAuthProcessing} 
          className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl shadow-xl active-scale disabled:opacity-70 uppercase text-[11px] tracking-widest mt-6 transition-all group overflow-hidden relative"
        >
          <div className="relative z-10 flex items-center justify-center space-x-3">
             {isAuthProcessing ? (
               <Loader2 className="animate-spin text-primary" size={20} />
             ) : (
               <>
                 <span>ACCÉDER AU WORKSPACE</span>
                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </>
             )}
          </div>
        </button>
      </form>
    </div>
    <div className="mt-8 flex flex-col items-center opacity-40">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Soutien technique : admin@ivision.com</p>
    </div>
  </div>
);

const AppContent: React.FC<any> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, activities,
  addNotification, onDismissNotification, notifications, 
  setLeads, setClients, setTasks, setMessages, setFileLinks, setUsers, setActivities, fetchInitialData
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') navigate('/dashboard', { replace: true });
  }, [location.pathname, navigate]);

  return (
    <Layout 
      currentUser={currentUser} onLogout={() => supabase.auth.signOut()} 
      unreadMessageCount={channels.reduce((acc: any, c: any) => acc + (c.unread || 0), 0)}
      tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
    >
      <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-slate-100" size={40} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} activities={activities} notifications={notifications} onNavigate={(v: any) => navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={() => {}} onAddTask={() => {}} onUpdateTask={() => {}} onDeleteTask={() => {}} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || ""} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={() => {}} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={() => {}} onUpdateLead={() => {}} onDeleteLead={async () => {}} onConvertToClient={() => {}} currentUser={currentUser} addNotification={addNotification} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={() => {}} onUpdateClient={() => {}} onMoveToLead={() => {}} onDeleteClient={() => {}} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={() => {}} onUpdateStatus={() => {}} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={activities} onlineUserIds={new Set()} onAddUser={async () => {}} onRemoveUser={() => {}} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={() => {}} />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={() => {}} onDeleteFileLink={() => {}} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async () => {}} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const addNotification = useCallback((title: string, message: any, type: any = 'info') => {
    setNotifications(prev => [...prev, { id: generateUUID(), title, message: String(message), type }]);
  }, []);

  const onDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchInitialData = useCallback(async (userId: string, userEmail?: string) => {
    try {
      // Détection du mode Bypass (indépendant de Supabase)
      if (userId.includes('master') || (userEmail && userEmail.endsWith('@ivision.com'))) {
          setCurrentUser({
            id: userId,
            name: userEmail?.split('@')[0] || 'Utilisateur',
            email: userEmail || '',
            role: (userEmail === 'admin@ivision.com') ? UserRole.ADMIN : UserRole.MEMBER,
            status: 'active',
            avatar: `https://ui-avatars.com/api/?name=${userEmail?.split('@')[0] || 'User'}&background=0061FF&color=fff`,
            notificationPref: 'all'
          } as User);
          setIsLoading(false);
          setIsAuthProcessing(false);
          return;
      }

      const { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      const profile = dbUser || { id: userId, name: userEmail?.split('@')[0] || 'Collaborateur', email: userEmail || '', role: UserRole.MEMBER, status: 'active' };
      setCurrentUser({
        ...profile,
        avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=0061FF&color=fff`,
        role: profile.role as UserRole,
        notificationPref: 'all'
      } as User);
      
      setIsLoading(false);
      setIsAuthProcessing(false);
      
      const load = (table: string, setter: Function) => {
        supabase.from(table).select('*').limit(30).then(({data}) => data && setter(data));
      };
      
      load('tasks', setTasks);
      load('users', setUsers);
      load('clients', setClients);
      load('leads', setLeads);
      load('channels', setChannels);
    } catch (e) {
      setIsLoading(false);
      setIsAuthProcessing(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchInitialData(session.user.id, session.user.email);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) fetchInitialData(session.user.id, session.user.email);
      else if (event === 'SIGNED_OUT') { setCurrentUser(null); setIsLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthProcessing) return;
    setIsAuthProcessing(true);
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // --- ACCÈS PRIORITAIRE IVISION (BYPASS SUPABASE) ---
    // Si l'email est @ivision.com, on ignore les erreurs Supabase et on laisse entrer.
    if (cleanEmail.endsWith('@ivision.com')) {
        // Cas spécifique de l'admin
        if (cleanEmail === 'admin@ivision.com' && cleanPass === 'admin123') {
            addNotification("Identification", "Accès Administrateur validé.", "success");
        } else if (cleanPass.length >= 4) {
            addNotification("Identification", "Accès Collaborateur validé.", "info");
        } else {
            addNotification("Erreur", "Mot de passe trop court pour un accès sécurisé.", "urgent");
            setIsAuthProcessing(false);
            return;
        }

        setTimeout(() => {
            fetchInitialData('master-' + generateUUID(), cleanEmail);
        }, 600);
        return;
    }

    // --- ACCÈS STANDARD (POUR LES AUTRES EMAILS) ---
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
      if (error) throw error;
      addNotification("Succès", "Identification validée via Supabase.", "success");
    } catch (err: any) { 
      addNotification("Erreur d'accès", "Identifiants invalides. Utilisez une adresse @ivision.com pour l'accès prioritaire.", "urgent"); 
      setIsAuthProcessing(false); 
    }
  };

  if (isLoading && !currentUser) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white space-y-6">
      <Zap size={44} className="text-primary animate-bounce" fill="currentColor" />
      <div className="flex items-center space-x-2">
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-75"></div>
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-150"></div>
      </div>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-4">
          <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
          <AuthUI 
            handleAuth={handleAuth} 
            email={email} setEmail={setEmail} 
            password={password} setPassword={setPassword} 
            isAuthProcessing={isAuthProcessing} 
          />
        </div>
      ) : (
        <AppContent 
          currentUser={currentUser} users={users} tasks={tasks} setTasks={setTasks}
          clients={clients} setClients={setClients} leads={leads} setLeads={setLeads}
          channels={channels} messages={messages} setMessages={setMessages}
          fileLinks={fileLinks} setFileLinks={setFileLinks}
          activities={activities} setActivities={setActivities}
          setUsers={setUsers} notifications={notifications}
          addNotification={addNotification} onDismissNotification={onDismissNotification} fetchInitialData={fetchInitialData}
        />
      )}
    </HashRouter>
  );
};

export default App;
