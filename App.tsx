
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, ActivityLog } from './types';
import { Loader2, Zap } from 'lucide-react';

// Modules Lazy-Loaded
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
    <div className="h-10 w-40 bg-slate-100 rounded-2xl"></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl"></div>)}
    </div>
    <div className="h-64 bg-slate-50 rounded-3xl"></div>
  </div>
);

const AuthUI = ({ isRegistering, setIsRegistering, handleAuth, email, setEmail, password, setPassword, registerName, setRegisterName, isAuthProcessing }: any) => (
  <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500 ease-out p-4">
    <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
      <div className="text-center mb-8 md:mb-12">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white font-bold text-xl md:text-2xl mx-auto mb-6 shadow-xl">iV</div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">iVISION</h1>
        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.5em] mt-3">Enterprise Access</p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4">
        {isRegistering && (
          <div className="space-y-1">
            <input 
              type="text" required value={registerName} 
              onChange={(e) => setRegisterName(e.target.value)} 
              placeholder="Nom complet" 
              className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-primary/20 transition-all text-sm" 
            />
          </div>
        )}
        <div className="space-y-1">
          <input 
            type="email" required value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email iVISION" 
            className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-primary/20 transition-all text-sm" 
          />
        </div>
        <div className="space-y-1">
          <input 
            type="password" required value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Mot de passe" 
            className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-primary/20 transition-all text-sm" 
          />
        </div>
        
        <button 
          type="submit"
          disabled={isAuthProcessing} 
          className="w-full py-5 md:py-6 bg-slate-900 text-white font-bold rounded-2xl shadow-xl active-scale disabled:opacity-50 uppercase text-[11px] tracking-widest mt-4 flex items-center justify-center space-x-2"
        >
          {isAuthProcessing ? <Loader2 className="animate-spin" size={18} /> : <span>{isRegistering ? "CRÉER UN ACCÈS" : "DÉVERROUILLER"}</span>}
        </button>
      </form>
    </div>
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
  logActivity: (action: string, target: string) => Promise<void>;
}> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, activities,
  addNotification, onDismissNotification, notifications, 
  setLeads, setClients, setTasks, setMessages, setFileLinks, setUsers, setActivities, fetchInitialData, logActivity
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Force redirection vers Accueil au démarrage si on est à la racine
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  const handleUpdateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      addNotification("Missions", "Statut mis à jour", "success");
      logActivity(`a mis à jour le statut (${newStatus})`, `Mission: ${task?.title || taskId}`);
    } catch (e: any) { 
      addNotification("Erreur", e?.message || "Échec mise à jour", "urgent");
    }
  }, [setTasks, addNotification, tasks, logActivity]);

  const handleAddTask = useCallback(async (task: Task) => {
    try {
      const { data, error } = await supabase.from('tasks').insert({
        id: generateUUID(),
        title: task.title,
        description: task.description || null,
        assignee_id: task.assigneeId,
        status: task.status,
        due_date: task.dueDate,
        priority: task.priority || 'medium',
        client_id: task.clientId || null,
        type: task.type || 'content'
      }).select();
      if (error) throw error;
      if (data) {
        setTasks(prev => [{
            id: data[0].id, title: data[0].title, description: data[0].description,
            assigneeId: data[0].assignee_id, status: data[0].status as TaskStatus,
            dueDate: data[0].due_date, priority: data[0].priority, clientId: data[0].client_id,
            type: data[0].type || 'content'
        }, ...prev]);
        addNotification("Missions", "Mission ajoutée", "success");
        logActivity("a créé une mission", task.title);
      }
    } catch (e: any) { 
      addNotification("Erreur", "Échec création", "urgent");
    }
  }, [setTasks, addNotification, logActivity]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addNotification("Missions", "Mission révoquée", "info");
      logActivity("a révoqué une mission", task?.title || taskId);
    } catch (e: any) {
      addNotification("Erreur", "Échec de suppression", "urgent");
    }
  }, [tasks, setTasks, addNotification, logActivity]);

  const handleAddLead = useCallback(async (lead: Lead) => {
    try {
      const { data, error } = await supabase.from('leads').insert({
        id: generateUUID(),
        name: lead.name,
        company: lead.company || null,
        email: lead.email || null,
        phone: lead.phone || null,
        status: lead.status || 'new',
        value_min: lead.valueMin || 0,
        value_max: lead.valueMax || 0,
        description: lead.description || null
      }).select();
      if (error) throw error;
      if (data) {
        setLeads(prev => [{ ...data[0], valueMin: data[0].value_min, valueMax: data[0].value_max, createdAt: data[0].created_at }, ...prev]);
        addNotification("Pipeline", "Prospect enregistré", "success");
        logActivity("a enregistré un prospect", lead.name);
      }
    } catch (e: any) {
      addNotification("Erreur", "Impossible d'enregistrer le lead", "urgent");
    }
  }, [setLeads, addNotification, logActivity]);

  const handleAddUser = useCallback(async (data: { name: string; email: string; password: string; role: UserRole }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name, role: data.role } }
      });
      if (authError) throw authError;
      if (authData.user) {
        await supabase.from('users').insert({
          id: authData.user.id,
          name: data.name,
          email: data.email,
          role: data.role,
          status: 'active',
          avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`
        });
        addNotification("Équipe", "Accès créé. Connexion autorisée.", "success");
        logActivity("a ajouté un collaborateur", data.name);
        fetchInitialData(currentUser.id);
      }
    } catch (e: any) {
      addNotification("Erreur", e.message, "urgent");
    }
  }, [currentUser, fetchInitialData, addNotification, logActivity]);

  return (
    <div className="h-full w-full animate-in fade-in duration-700">
      <Layout 
        currentUser={currentUser} onLogout={() => supabase.auth.signOut()} 
        unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}
        tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
      >
        <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} activities={activities} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
            <Route path="/leads" element={<Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={() => {}} onDeleteLead={async (id) => {
                await supabase.from('leads').delete().eq('id', id);
                setLeads(prev => prev.filter(l => String(l.id) !== id));
            }} onConvertToClient={() => {}} currentUser={currentUser} addNotification={addNotification} />} />
            <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={() => {}} onDeleteTask={handleDeleteTask} />} />
            <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || ""} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={async (c, ch) => {
               const { data } = await supabase.from('messages').insert({ id: generateUUID(), content: c, channel_id: ch, user_id: currentUser.id }).select();
               if (data) setMessages(prev => [...prev, { ...data[0], userId: data[0].user_id, channelId: data[0].channel_id, timestamp: new Date().toLocaleTimeString() }]);
            }} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
            <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={() => {}} onUpdateClient={() => {}} onMoveToLead={() => {}} onDeleteClient={() => {}} />} />
            <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
            <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={activities} onlineUserIds={new Set()} onAddUser={handleAddUser} onRemoveUser={async (id) => {
                 await supabase.from('users').delete().eq('id', id);
                 setUsers(prev => prev.filter(u => u.id !== id));
            }} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={() => {}} />} />
            <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={() => {}} onDeleteFileLink={() => {}} />} />
            <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
            <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (d) => {
               await supabase.from('users').update(d).eq('id', currentUser.id);
            }} />} />
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
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const addNotification = useCallback((title: string, message: any, type: 'info' | 'success' | 'urgent' = 'info') => {
    const msg = typeof message === 'string' ? message : (message?.message || JSON.stringify(message));
    setNotifications(prev => [...prev, { id: generateUUID(), title, message: msg, type }]);
  }, []);

  const onDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchInitialData = useCallback(async (userId: string) => {
    try {
      // 1. Profil Utilisateur avec AUTO-PROVISIONING
      let { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      if (!dbUser) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur iVISION';
          const { data: newUser } = await supabase.from('users').insert({
            id: userId,
            name,
            email: user.email,
            role: user.user_metadata?.role || UserRole.MEMBER,
            status: 'active',
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
          }).select().single();
          dbUser = newUser;
        }
      }

      if (dbUser) {
        setCurrentUser({
          id: String(userId),
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar,
          role: dbUser.role as UserRole,
          status: 'active',
          notificationPref: 'all',
          permissions: dbUser.permissions || {}
        });
      }

      // Chargement granulaire pour éviter les blocages
      const load = async (table: string, setter: Function, mapper?: Function) => {
        try {
          const { data } = await supabase.from(table).select('*').limit(table === 'messages' ? 50 : 100);
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
      console.error("Critical app load error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const safety = setTimeout(() => { if (isMounted && isLoading) setIsLoading(false); }, 4000);

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && isMounted) await fetchInitialData(session.user.id);
      else if (isMounted) setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) await fetchInitialData(session.user.id);
      else if (isMounted) { setCurrentUser(null); setIsLoading(false); }
    });

    return () => { isMounted = false; clearTimeout(safety); subscription.unsubscribe(); };
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      // Ignorer l'erreur d'email non confirmé (permet de forcer la session si possible)
      if (error && !error.message.includes('Email not confirmed')) throw error;
      
      // Si l'erreur est juste l'email non confirmé, on laisse Supabase tenter d'établir la session
      // car certains réglages autorisent la session immédiate même sans confirmation.
    } catch (err: any) { addNotification("Accès", err.message, "urgent"); }
    finally { setIsAuthProcessing(false); }
  };

  if (isLoading && !currentUser) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Chargement iVISION...</p>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-full min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4">
          <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
          <AuthUI isRegistering={false} handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} />
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
          logActivity={async (a, t) => {}}
        />
      )}
    </HashRouter>
  );
};

export default App;
