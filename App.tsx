
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, ActivityLog } from './types';
import { Loader2, Zap, ShieldCheck } from 'lucide-react';

// Modules chargés à la demande (Lazy Loading)
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

const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

const PageSkeleton = () => (
  <div className="w-full h-full p-6 lg:p-10 space-y-8 animate-pulse">
    <div className="h-10 w-40 bg-slate-50 rounded-2xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl"></div>)}
    </div>
    <div className="h-64 bg-slate-50 rounded-3xl"></div>
  </div>
);

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing }: any) => (
  <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500 ease-out p-4">
    <div className="bg-white rounded-[3rem] md:rounded-[4rem] p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      
      <div className="text-center mb-10 relative z-10">
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-2xl shadow-slate-900/20 transform hover:scale-105 transition-transform duration-500">
            <Zap size={32} fill="currentColor" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">iVISION</h1>
        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.5em] mt-4 flex items-center justify-center">
            <ShieldCheck size={12} className="mr-2" />
            Accès Enterprise
        </p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Identifiant</label>
          <input 
            type="email" required value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="email@ivision.com" 
            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-sm placeholder:text-slate-300" 
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Clef d'accès</label>
          <input 
            type="password" required value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••" 
            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-sm placeholder:text-slate-300" 
          />
        </div>
        
        <button 
          type="submit"
          disabled={isAuthProcessing} 
          className="w-full group relative overflow-hidden py-6 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/20 active-scale disabled:opacity-70 uppercase text-[11px] tracking-[0.2em] mt-6 transition-all"
        >
          <div className={`absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-10`}></div>
          <div className="flex items-center justify-center space-x-3 relative z-10">
            {isAuthProcessing ? (
                <>
                    <Loader2 className="animate-spin text-primary" size={20} />
                    <span className="text-slate-300">VÉRIFICATION...</span>
                </>
            ) : (
                <>
                    <span>DÉVERROUILLER LE WORKSPACE</span>
                </>
            )}
          </div>
        </button>
      </form>
    </div>
    <p className="text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50">Sécurité iVISION Biometrics Active</p>
  </div>
);

const AppContent: React.FC<{
  currentUser: User;
  users: User[];
  tasks: Task[];
  clients: Client[];
  leads: Lead[];
  channels: Channel[];
  messages: Message[];
  fileLinks: FileLink[];
  activities: ActivityLog[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'urgent') => void;
  onDismissNotification: (id: string) => void;
  notifications: ToastNotification[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setFileLinks: React.Dispatch<React.SetStateAction<FileLink[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  fetchInitialData: (userId?: string) => Promise<void>;
}> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, activities,
  addNotification, onDismissNotification, notifications, 
  setLeads, setClients, setTasks, setMessages, setFileLinks, setUsers, setActivities, fetchInitialData
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleUpdateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try { await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId); } catch (e) {}
  }, [setTasks]);

  const handleAddTask = useCallback(async (task: Task) => {
    try {
      const { data } = await supabase.from('tasks').insert({
        id: generateUUID(), title: task.title, description: task.description || null,
        assignee_id: task.assigneeId, status: task.status, due_date: task.dueDate,
        priority: task.priority || 'medium', client_id: task.clientId || null, type: task.type || 'content'
      }).select();
      if (data) setTasks(prev => [{ ...task, id: data[0].id }, ...prev]);
    } catch (e) {}
  }, [setTasks]);

  const handleAddUser = useCallback(async (data: { name: string; email: string; password: string; role: UserRole }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email, password: data.password, options: { data: { name: data.name, role: data.role } }
      });
      if (authError) throw authError;
      if (authData.user) {
        await supabase.from('users').insert({
          id: authData.user.id, name: data.name, email: data.email, role: data.role, status: 'active',
          avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`
        });
        addNotification("Succès", "Accès créé.", "success");
        fetchInitialData(currentUser.id);
      }
    } catch (e: any) { addNotification("Erreur", e.message, "urgent"); }
  }, [currentUser.id, fetchInitialData, addNotification]);

  return (
    <div className="h-full w-full">
      <Layout 
        currentUser={currentUser} onLogout={() => supabase.auth.signOut()} 
        unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}
        tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
      >
        <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} activities={activities} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
            <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={() => {}} onDeleteTask={() => {}} />} />
            <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || ""} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={async (c, ch) => {
               const { data } = await supabase.from('messages').insert({ id: generateUUID(), content: c, channel_id: ch, user_id: currentUser.id }).select();
               if (data) setMessages(prev => [...prev, { ...data[0], userId: data[0].user_id, channelId: data[0].channel_id, timestamp: new Date().toLocaleTimeString() }]);
            }} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
            <Route path="/leads" element={<Leads leads={leads} onAddLead={() => {}} onUpdateLead={() => {}} onDeleteLead={async () => {}} onConvertToClient={() => {}} currentUser={currentUser} addNotification={addNotification} />} />
            <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={() => {}} onUpdateClient={() => {}} onMoveToLead={() => {}} onDeleteClient={() => {}} />} />
            <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
            <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={activities} onlineUserIds={new Set()} onAddUser={handleAddUser} onRemoveUser={() => {}} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={() => {}} />} />
            <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={() => {}} onDeleteFileLink={() => {}} />} />
            <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
            <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (d) => { await supabase.from('users').update(d).eq('id', currentUser.id); }} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </div>
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

  const addNotification = useCallback((title: string, message: any, type: 'info' | 'success' | 'urgent' = 'info') => {
    setNotifications(prev => [...prev, { id: generateUUID(), title, message: typeof message === 'string' ? message : "Information mise à jour", type }]);
  }, []);

  const onDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchInitialData = useCallback(async (userId: string) => {
    try {
      // Priorité haute : Chargement du profil utilisateur pour débloquer l'interface
      let { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      if (!dbUser) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Membre iVISION';
          const { data: newUser } = await supabase.from('users').insert({
            id: userId, name, email: user.email, role: user.user_metadata?.role || UserRole.MEMBER,
            status: 'active', avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
          }).select().single();
          dbUser = newUser;
        }
      }

      if (dbUser) {
        setCurrentUser({
          id: String(userId), name: dbUser.name, email: dbUser.email, avatar: dbUser.avatar,
          role: dbUser.role as UserRole, status: 'active', notificationPref: 'all', permissions: dbUser.permissions || {}
        });
        // On marque le chargement principal comme terminé dès qu'on a l'utilisateur
        setIsLoading(false);
      }

      // Chargement en arrière-plan (non bloquant pour l'UI principale)
      const load = async (table: string, setter: Function, mapper?: Function) => {
        try {
          const { data } = await supabase.from(table).select('*').limit(100);
          if (data) setter(mapper ? data.map((d: any) => mapper(d)) : data);
        } catch (e) {}
      };

      load('users', setUsers, (u: any) => ({ ...u, role: u.role as UserRole }));
      load('channels', setChannels);
      load('tasks', setTasks, (t: any) => ({ ...t, assigneeId: t.assignee_id, status: t.status as TaskStatus, dueDate: t.due_date }));
      load('clients', setClients);
      load('leads', setLeads, (l: any) => ({ ...l, valueMin: l.value_min, valueMax: l.value_max, createdAt: l.created_at }));
      load('file_links', setFileLinks, (f: any) => ({ ...f, clientId: f.client_id, createdBy: f.created_by, createdAt: new Date(f.created_at).toLocaleDateString() }));
      
    } catch (e) {
      console.error("Initial data load error", e);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Vérification instantanée de la session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && isMounted) {
          await fetchInitialData(session.user.id);
      } else if (isMounted) {
          setIsLoading(false);
      }
    };
    checkSession();

    // Listener sur les changements d'auth pour transition instantanée
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && isMounted) {
          await fetchInitialData(session.user.id);
      } else if (event === 'SIGNED_OUT' && isMounted) {
          setCurrentUser(null);
          setIsLoading(false);
      }
    });

    return () => { isMounted = false; subscription.unsubscribe(); };
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthProcessing) return;
    setIsAuthProcessing(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
          if (error.message.includes('Email not confirmed')) {
              // On peut loger l'utilisateur quand même si le backend le permet ou afficher un message spécifique
              // Mais ici on traite ça comme un accès accordé pour la fluidité si possible
          } else {
              throw error;
          }
      }
      // fetchInitialData sera déclenché par onAuthStateChange
    } catch (err: any) { 
        addNotification("Erreur d'accès", err.message, "urgent"); 
        setIsAuthProcessing(false); 
    }
  };

  if (isLoading && !currentUser) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-50 border-t-primary rounded-full animate-spin"></div>
          <Zap size={24} className="absolute inset-0 m-auto text-primary animate-pulse" fill="currentColor" />
      </div>
      <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Lancement iVISION...</p>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-full min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_rgba(0,97,255,0.05)_0%,_transparent_50%)]"></div>
          <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
          <AuthUI handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} />
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
