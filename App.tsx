
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

// Interface d'authentification
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
        type="submit"
        disabled={isAuthProcessing} 
        className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 active-scale disabled:opacity-50 border-4 border-white uppercase text-[10px] tracking-widest mt-4 flex items-center justify-center"
      >
        {isAuthProcessing ? <Loader2 className="animate-spin" /> : (isRegistering ? "CRÉER UN COMPTE" : "DÉVERROUILLER L'ESPACE")}
      </button>
    </form>
    
    <button 
      type="button"
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
  setFileLinks: React.Dispatch<React.SetStateAction<FileLink[]>>;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'urgent') => void;
  removeNotification: (id: string) => void;
  notifications: ToastNotification[];
  fetchInitialData: (userId?: string) => Promise<void>;
}> = ({ 
  currentUser, setCurrentUser, users, setUsers, tasks, setTasks, 
  clients, setClients, leads, setLeads, channels, setChannels, 
  messages, setMessages, fileLinks, setFileLinks, addNotification, removeNotification, 
  notifications, fetchInitialData 
}) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState('general');

  // Utility pour assurer le format des IDs
  const formatIdForDb = (id: any) => {
    if (!id) return null;
    return String(id);
  };

  // --- ACTIONS TASKS ---
  const handleAddTask = async (task: Task) => {
    const taskId = generateUUID();
    const newTask = { ...task, id: taskId };
    // Update local immediately
    setTasks(prev => [newTask, ...prev]);
    try {
      const { error } = await supabase.from('tasks').insert({
        id: taskId,
        title: newTask.title,
        description: newTask.description,
        assignee_id: formatIdForDb(task.assigneeId),
        client_id: formatIdForDb(task.clientId),
        due_date: newTask.dueDate,
        status: newTask.status,
        type: newTask.type || 'admin',
        priority: newTask.priority || 'medium'
      });
      if (error) throw error;
      addNotification("Mission Ajoutée", newTask.title, "success");
    } catch (error) { 
      console.error(error);
      addNotification("Erreur", "Échec ajout mission", "urgent");
      fetchInitialData();
    }
  };

  const handleUpdateTask = async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    try {
      const { error } = await supabase.from('tasks').update({
        title: task.title,
        description: task.description,
        assignee_id: formatIdForDb(task.assigneeId),
        client_id: formatIdForDb(task.clientId),
        due_date: task.dueDate,
        status: task.status,
        priority: task.priority
      }).eq('id', task.id);
      if (error) throw error;
      addNotification("Mise à jour", "Modifications enregistrées", "success");
    } catch (error) { 
      console.error(error);
      addNotification("Erreur", "Échec sauvegarde", "urgent");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      addNotification("Supprimé", "Mission retirée", "info");
    } catch (error) { 
      console.error(error);
      addNotification("Erreur", "Échec suppression", "urgent");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
      if (error) throw error;
      addNotification("Statut Mis à jour", `Mission en ${status}`, "success");
    } catch (error) {
      console.error(error);
      addNotification("Erreur", "Synchro statut échouée", "urgent");
      fetchInitialData(); 
    }
  };

  // --- ACTIONS CLIENTS ---
  const handleAddClient = async (client: Client) => {
    const newClient = { ...client, id: generateUUID() };
    setClients(prev => [...prev, newClient]);
    try {
      await supabase.from('clients').insert({
        id: newClient.id,
        name: newClient.name,
        company: newClient.company,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        description: newClient.description
      });
      addNotification("Client ajouté", newClient.name, "success");
    } catch (error) { console.error(error); }
  };

  const handleUpdateClient = async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    await supabase.from('clients').update({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      description: client.description
    }).eq('id', client.id);
  };

  const handleDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await supabase.from('clients').delete().eq('id', id);
    addNotification("Client révoqué", "Suppression effectuée", "info");
  };

  // --- ACTIONS LEADS ---
  const handleAddLead = async (lead: Lead) => {
    try {
      const { data, error } = await supabase.from('leads').insert({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: lead.status || 'new',
        source: lead.source,
        value_min: lead.valueMin,
        value_max: lead.valueMax,
        description: lead.description
      }).select();
      if (error) throw error;
      if (data && data[0]) {
        fetchInitialData();
        addNotification("Prospect capturé", lead.name, "success");
      }
    } catch (error) {
      console.error(error);
      addNotification("Erreur", "Échec insertion lead", "urgent");
    }
  };

  const handleUpdateLead = async (lead: Lead) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    await supabase.from('leads').update({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      value_min: lead.valueMin,
      value_max: lead.valueMax,
      description: lead.description
    }).eq('id', formatIdForDb(lead.id));
  };

  const handleDeleteLead = async (id: any) => {
    try {
      await supabase.from('leads').delete().eq('id', formatIdForDb(id));
      setLeads(prev => prev.filter(l => String(l.id) !== String(id)));
      addNotification("Prospect supprimé", "", "info");
    } catch (error) { console.error(error); }
  };

  const handleConvertToClient = async (lead: Lead) => {
    addNotification("Conversion...", "Transfert vers le CRM", "info");
    try {
      const newClientId = generateUUID();
      await supabase.from('clients').insert({
        id: newClientId,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        description: lead.description
      });
      await supabase.from('leads').delete().eq('id', formatIdForDb(lead.id));
      fetchInitialData();
      addNotification("Succès !", `${lead.name} est client.`, "success");
    } catch (error) { console.error(error); }
  };

  // --- ACTIONS TEAM & CHAT ---
  const handleSendMessage = async (content: string, channelId: string) => {
    const newMessage = { id: generateUUID(), user_id: currentUser.id, channel_id: channelId, content };
    await supabase.from('messages').insert(newMessage);
    fetchInitialData();
  };

  const handleAddChannel = async (channel: { name: string; type: 'global' | 'project'; members?: string[] }) => {
    const id = generateUUID();
    await supabase.from('channels').insert({ id, name: channel.name, type: channel.type });
    fetchInitialData();
  };

  const handleAddUser = async (user: User) => {
    await supabase.from('users').insert({
      id: generateUUID(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: 'pending'
    });
    fetchInitialData();
    addNotification("Membre invité", user.name, "success");
  };

  const handleRemoveUser = async (userId: string) => {
    await supabase.from('users').delete().eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    addNotification("Accès révoqué", "", "info");
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
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={currentChannelId} messages={messages} onlineUserIds={new Set()} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} onAddChannel={handleAddChannel} onDeleteChannel={async(id) => {}} />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={async() => {}} onDeleteFileLink={async() => {}} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onlineUserIds={new Set()} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={async() => {}} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async() => {}} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onConvertToClient={handleConvertToClient} currentUser={currentUser} />} />
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
      const [uRes, cRes, mRes, tRes, clRes, lRes, flRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('file_links').select('*').order('created_at', { ascending: false })
      ]);

      if (uRes.data) {
        const mappedUsers = uRes.data.map((u: any) => ({
          id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`,
          status: u.status, permissions: u.permissions || {}
        }));
        setUsers(mappedUsers);
        if (userId) setCurrentUser(mappedUsers.find((u: any) => u.id === userId) || null);
      }
      if (clRes.data) setClients(clRes.data as Client[]);
      if (lRes.data) setLeads(lRes.data.map((l: any) => ({
        id: l.id, name: l.name, company: l.company, email: l.email, phone: l.phone, status: l.status,
        source: l.source, valueMin: l.value_min || 0, valueMax: l.value_max || 0, description: l.description, createdAt: l.created_at
      })));
      if (flRes.data) setFileLinks(flRes.data.map((f: any) => ({
        id: f.id, name: f.name, url: f.url, clientId: f.client_id, createdBy: f.created_by, createdAt: f.created_at
      })));
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
  }, []);

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
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name: registerName } } });
        if (error) throw error;
        addNotification("Compte créé", "Connectez-vous.", "success");
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
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronisation iVISION...</p>
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
          fileLinks={fileLinks} setFileLinks={setFileLinks} notifications={notifications}
          addNotification={addNotification} removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
          fetchInitialData={fetchInitialData}
        />
      )}
    </HashRouter>
  );
};

export default App;
