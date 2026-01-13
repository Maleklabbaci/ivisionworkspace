
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, ViewState, Lead } from './types';
import { Mail, Lock, Loader2, Sparkles, User as UserIcon, LogIn } from 'lucide-react';

// Lazy loading pour les composants de pages
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

const generateUUID = () => crypto.randomUUID();

// Interface d'authentification complète
const AuthUI = ({ isRegistering, setIsRegistering, handleAuth, email, setEmail, password, setPassword, registerName, setRegisterName, isAuthProcessing }: any) => (
  <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 border border-slate-50 animate-in zoom-in-95 duration-300">
    <div className="text-center mb-10">
      <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-white font-black text-xl mx-auto shadow-2xl shadow-primary/20 mb-6">iV</div>
      <div className="text-3xl font-black tracking-tighter text-slate-900 mb-1 uppercase">iVISION</div>
      <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.4em] mt-2">Workspace Intelligence</p>
    </div>
    
    <form onSubmit={handleAuth} className="space-y-4">
      {isRegistering && (
        <div className="relative">
          <input 
            type="text" 
            required 
            value={registerName} 
            onChange={e => setRegisterName(e.target.value)} 
            placeholder="Nom Complet" 
            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 pl-12 outline-none focus:bg-white focus:border-primary/20 transition-all" 
          />
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
      )}
      <div className="relative">
        <input 
          type="email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email" 
          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 pl-12 outline-none focus:bg-white focus:border-primary/20 transition-all" 
        />
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>
      <div className="relative">
        <input 
          type="password" 
          required 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Mot de passe" 
          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-900 pl-12 outline-none focus:bg-white focus:border-primary/20 transition-all" 
        />
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>
      
      <button 
        disabled={isAuthProcessing} 
        className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 active-scale disabled:opacity-50 border-4 border-white uppercase text-[10px] tracking-widest mt-4 flex items-center justify-center"
      >
        {isAuthProcessing ? <Loader2 className="animate-spin" /> : (isRegistering ? "CRÉER UN COMPTE" : "DÉVERROUILLER L'ESPACE")}
      </button>
    </form>
    
    <button 
      onClick={() => setIsRegistering(!isRegistering)} 
      className="w-full mt-10 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-primary transition-colors"
    >
      {isRegistering ? "Retour à la connexion" : "Besoin d'un nouvel accès ?"}
    </button>
  </div>
);

const PageLoader = () => (
  <div className="w-full h-full animate-pulse space-y-8 p-4">
    <div className="h-12 w-1/3 bg-slate-50 rounded-2xl"></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 rounded-[2.5rem]"></div>)}
    </div>
    <div className="h-96 bg-slate-50 rounded-[3rem]"></div>
  </div>
);

const AppContent: React.FC<{
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fileLinks: FileLink[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'urgent') => void;
  removeNotification: (id: string) => void;
  notifications: ToastNotification[];
}> = ({ currentUser, setCurrentUser, users, setUsers, tasks, setTasks, clients, setClients, leads, setLeads, channels, setChannels, messages, setMessages, fileLinks, addNotification, removeNotification, notifications }) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState('general');

  const cleanId = (id?: string) => {
    if (!id || id.length < 32 || id.includes('temp')) return null;
    return id;
  };

  const handleAddTask = async (task: Task) => {
    const newTask = { ...task, id: generateUUID() };
    setTasks(prev => [newTask, ...prev]);
    addNotification("Tâche créée", newTask.title, "success");
    try {
      await supabase.from('tasks').insert({
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        assignee_id: cleanId(newTask.assigneeId),
        client_id: cleanId(newTask.clientId),
        due_date: newTask.dueDate,
        status: newTask.status,
        type: newTask.type || 'admin',
        priority: newTask.priority || 'medium'
      });
    } catch (error) { console.error(error); }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    await supabase.from('tasks').update({ status }).eq('id', taskId);
  };

  const handleAddLead = async (lead: Lead) => {
    const newId = generateUUID();
    setLeads(prev => [{ ...lead, id: newId }, ...prev]);
    addNotification("Lead capturé", lead.name, "success");
    await supabase.from('leads').insert({ ...lead, id: newId });
  };

  const handleSendMessage = async (content: string, channelId: string) => {
    const now = new Date();
    const newMessage: Message = {
      id: generateUUID(), userId: currentUser.id, channelId, content,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: now.toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    await supabase.from('messages').insert({
      id: newMessage.id, user_id: newMessage.userId, channel_id: newMessage.channelId, content: newMessage.content
    });
  };

  return (
    <Layout 
      currentUser={currentUser} onLogout={() => supabase.auth.signOut()} 
      unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}
      tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
    >
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={async() => {}} onDeleteTask={async() => {}} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={currentChannelId} messages={messages} onlineUserIds={new Set()} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} onAddChannel={async() => {}} onDeleteChannel={() => {}} />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onlineUserIds={new Set()} onAddUser={async() => {}} onRemoveUser={async() => {}} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={async(id, d) => {}} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async(d) => {}} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={async() => {}} onUpdateClient={async() => {}} onDeleteClient={async() => {}} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={async() => {}} onDeleteLead={async() => {}} onConvertToClient={async() => {}} currentUser={currentUser} />} />
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
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    setNotifications(prev => [...prev, { id: generateUUID(), title, message, type }]);
  }, []);

  const fetchInitialData = useCallback(async (userId?: string) => {
    if (!isConfigured) return;
    try {
      const [uRes, cRes, mRes, tRes, clRes, lRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false })
      ]);

      if (uRes.data) {
        const fetchedUsers = uRes.data.map((u: any) => ({
          id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar,
          status: u.status, permissions: u.permissions || {}
        }));
        setUsers(fetchedUsers);
        
        if (userId) {
          const profile = fetchedUsers.find((u: any) => u.id === userId);
          if (profile) setCurrentUser(profile);
          else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const name = user.user_metadata?.name || registerName || user.email?.split('@')[0];
              const newUser = { id: user.id, name, email: user.email!, role: UserRole.MEMBER, avatar: `https://ui-avatars.com/api/?name=${name}&background=random`, status: 'active', permissions: {} };
              await supabase.from('users').insert(newUser);
              setCurrentUser(newUser as User);
            }
          }
        }
      }
      if (clRes.data) setClients(clRes.data as Client[]);
      if (lRes.data) setLeads(lRes.data as Lead[]);
      if (cRes.data) setChannels(cRes.data as Channel[]);
      if (mRes.data) setMessages(mRes.data.map((m: any) => ({
        id: m.id, userId: m.user_id, channelId: m.channel_id, content: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        fullTimestamp: m.created_at
      })));
      if (tRes.data) setTasks(tRes.data.map((t: any) => ({
        id: t.id, title: t.title, description: t.description, assigneeId: t.assignee_id,
        dueDate: t.due_date, status: t.status as TaskStatus, type: t.type, priority: t.priority, clientId: t.client_id
      })));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [registerName]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) fetchInitialData(session.user.id);
      else { setCurrentUser(null); setIsLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: registerName } } });
        if (error) throw error;
        addNotification("Compte créé", "Vérifiez vos emails ou connectez-vous.", "success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      addNotification("Erreur Auth", err.message, "urgent");
    } finally { setIsAuthProcessing(false); }
  };

  if (isLoading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-slate-50 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronisation Workspace...</p>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
          <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
          <AuthUI 
            isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth}
            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            registerName={registerName} setRegisterName={setRegisterName} isAuthProcessing={isAuthProcessing}
          />
        </div>
      ) : (
        <AppContent 
          currentUser={currentUser} setCurrentUser={setCurrentUser} 
          users={users} setUsers={setUsers} tasks={tasks} setTasks={setTasks}
          clients={clients} setClients={setClients} leads={leads} setLeads={setLeads}
          channels={channels} setChannels={setChannels} messages={messages} setMessages={setMessages}
          fileLinks={[]} notifications={notifications}
          addNotification={addNotification} removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
        />
      )}
    </HashRouter>
  );
};

export default App;
