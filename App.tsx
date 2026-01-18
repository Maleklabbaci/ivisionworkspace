
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, ActivityLog } from './types';
import { Mail, Lock, Loader2, User as UserIcon, Zap } from 'lucide-react';

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

const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE';

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
  <div className="w-full h-full p-10 space-y-8 animate-in fade-in duration-500">
    <div className="h-12 w-48 bg-slate-100 rounded-2xl animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse"></div>)}
    </div>
    <div className="h-96 bg-slate-50 rounded-[3rem] animate-pulse"></div>
  </div>
);

const AuthUI = ({ isRegistering, setIsRegistering, handleAuth, email, setEmail, password, setPassword, registerName, setRegisterName, isAuthProcessing }: any) => (
  <div className="w-full max-w-sm p-10 animate-in fade-in zoom-in-95 duration-500">
    <div className="glass-card rounded-[3.5rem] p-12 shadow-2xl border border-white">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-primary to-vibrant-indigo rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-xl mb-6 transform hover:rotate-6 transition-transform">iV</div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">iVISION</h1>
        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.5em] mt-3">Enterprise Workspace</p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4">
        {isRegistering && (
          <input 
            type="text" required value={registerName} 
            onChange={(e) => setRegisterName(e.target.value)} 
            placeholder="Nom complet" 
            className="w-full p-5 bg-slate-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
          />
        )}
        <input 
          type="email" required value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email iVISION" 
          className="w-full p-5 bg-slate-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
        />
        <input 
          type="password" required value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Mot de passe" 
          className="w-full p-5 bg-slate-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
        />
        
        <button 
          type="submit"
          disabled={isAuthProcessing} 
          className="w-full py-6 bg-slate-900 text-white font-bold rounded-2xl shadow-xl active-scale disabled:opacity-50 uppercase text-[11px] tracking-widest mt-6 flex items-center justify-center"
        >
          {isAuthProcessing ? <Loader2 className="animate-spin" /> : (isRegistering ? "CRÉER UN ACCÈS" : "DÉVERROUILLER")}
        </button>
      </form>
      
      <button 
        type="button"
        onClick={() => setIsRegistering(!isRegistering)} 
        className="w-full mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center space-x-2"
      >
        <Zap size={14} className="text-vibrant-amber" />
        <span>{isRegistering ? "Retour Connexion" : "Nouvel accès iVISION"}</span>
      </button>
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
        const newLead: Lead = {
          id: data[0].id,
          name: data[0].name,
          company: data[0].company,
          email: data[0].email,
          phone: data[0].phone,
          status: data[0].status,
          valueMin: data[0].value_min,
          valueMax: data[0].value_max,
          description: data[0].description,
          createdAt: data[0].created_at
        };
        setLeads(prev => [newLead, ...prev]);
        addNotification("Pipeline", "Prospect enregistré avec succès", "success");
        logActivity("a enregistré un nouveau prospect", lead.name);
      }
    } catch (e: any) {
      addNotification("Erreur", "Impossible d'enregistrer le lead", "urgent");
      console.error(e);
    }
  }, [setLeads, addNotification, logActivity]);

  const handleAddFileLink = useCallback(async (name: string, url: string, clientId?: string) => {
    try {
        const { data, error } = await supabase.from('file_links').insert({
            id: generateUUID(), name, url, client_id: clientId, created_by: currentUser.id
        }).select();
        if (error) throw error;
        if (data) {
            setFileLinks(prev => [{
                id: data[0].id, name: data[0].name, url: data[0].url,
                clientId: data[0].client_id, createdBy: data[0].created_by,
                createdAt: new Date(data[0].created_at).toLocaleDateString()
            }, ...prev]);
            addNotification("Documents", "Lien ajouté", "success");
        }
    } catch (e: any) { addNotification("Erreur", e.message, "urgent"); }
  }, [currentUser, setFileLinks, addNotification]);

  return (
    <div className="h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
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
            <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={() => {}} onDeleteTask={async (id) => {
              await supabase.from('tasks').delete().eq('id', id);
              setTasks(prev => prev.filter(t => t.id !== id));
            }} />} />
            <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || ""} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={async (c, ch) => {
               const { data } = await supabase.from('messages').insert({ id: generateUUID(), content: c, channel_id: ch, user_id: currentUser.id }).select();
               if (data) setMessages(prev => [...prev, { ...data[0], userId: data[0].user_id, channelId: data[0].channel_id, timestamp: new Date().toLocaleTimeString() }]);
            }} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
            <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={async (c) => {
              const { data } = await supabase.from('clients').insert({ ...c, id: generateUUID() }).select();
              if (data) setClients(prev => [...prev, data[0]]);
            }} onUpdateClient={() => {}} onMoveToLead={() => {}} onDeleteClient={async (id) => {
              await supabase.from('clients').delete().eq('id', id);
              setClients(prev => prev.filter(c => c.id !== id));
            }} />} />
            <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
            <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={activities} onlineUserIds={new Set()} onAddUser={async () => {}} onRemoveUser={() => {}} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={() => {}} />} />
            <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={handleAddFileLink} onDeleteFileLink={async (id) => {
              await supabase.from('file_links').delete().eq('id', id);
              setFileLinks(prev => prev.filter(f => f.id !== id));
            }} />} />
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

  const logActivity = useCallback(async (action: string, target: string) => {
    if (!currentUser) return;
    try { await supabase.from('activity_logs').insert({ id: generateUUID(), user_id: currentUser.id, action, target }); } catch (e) {}
  }, [currentUser]);

  const fetchInitialData = useCallback(async (userId: string) => {
    try {
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
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

      const [u, c, m, t, cl, l, f, act] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('file_links').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      if (u.data) setUsers(u.data.map(user => ({ ...user, id: String(user.id), role: user.role as UserRole })));
      if (c.data) setChannels(c.data);
      if (m.data) setMessages(m.data.map(msg => ({ ...msg, userId: String(msg.user_id), channelId: String(msg.channel_id), timestamp: new Date(msg.created_at).toLocaleTimeString() })));
      if (t.data) setTasks(t.data.map(task => ({ ...task, assigneeId: String(task.assignee_id), status: task.status as TaskStatus, dueDate: task.due_date })));
      if (cl.data) setClients(cl.data);
      if (l.data) setLeads(l.data.map(lead => ({
        id: lead.id,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        valueMin: lead.value_min,
        valueMax: lead.value_max,
        description: lead.description,
        createdAt: lead.created_at
      })));
      if (f.data) setFileLinks(f.data.map(file => ({ ...file, id: String(file.id), clientId: file.client_id, createdBy: file.created_by, createdAt: new Date(file.created_at).toLocaleDateString() })));
      if (act.data) {
          setActivities(act.data.map(log => ({
              id: String(log.id), userId: String(log.user_id), action: log.action, target: log.target,
              timestamp: new Date(log.created_at).toLocaleTimeString()
          })));
      }
    } catch (e) { console.error(e); } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchInitialData(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      if (isRegistering) {
        const { data } = await supabase.auth.signUp({ email, password, options: { data: { name: registerName } } });
        if (data.user) {
          await supabase.from('users').insert({ id: data.user.id, name: registerName, email, role: 'Membre', status: 'active', avatar: `https://ui-avatars.com/api/?name=${registerName}&background=random` });
        }
        addNotification("Succès", "Compte créé, vous pouvez vous connecter.", "success");
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) { addNotification("Erreur", err.message, "urgent"); }
    finally { setIsAuthProcessing(false); }
  };

  if (isLoading && !currentUser) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
          <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
          <AuthUI isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} registerName={registerName} setRegisterName={setRegisterName} isAuthProcessing={isAuthProcessing} />
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
          logActivity={logActivity}
        />
      )}
    </HashRouter>
  );
};

export default App;
