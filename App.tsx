
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, ViewState } from './types';
import { Mail, Lock, Loader2, Sparkles, User as UserIcon } from 'lucide-react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Tasks = lazy(() => import('./components/Tasks'));
const Chat = lazy(() => import('./components/Chat'));
const Team = lazy(() => import('./components/Team'));
const Files = lazy(() => import('./components/Files'));
const Settings = lazy(() => import('./components/Settings'));
const Reports = lazy(() => import('./components/Reports'));
const Clients = lazy(() => import('./components/Clients'));
const Calendar = lazy(() => import('./components/Calendar'));

const generateUUID = () => crypto.randomUUID();

const AppContent: React.FC<{
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  clients: Client[];
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fileLinks: FileLink[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'urgent') => void;
  removeNotification: (id: string) => void;
  notifications: ToastNotification[];
}> = ({ currentUser, setCurrentUser, users, setUsers, tasks, setTasks, clients, channels, setChannels, messages, setMessages, fileLinks, addNotification, removeNotification, notifications }) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState('general');

  // --- Handlers Missions ---
  const handleAddTask = async (task: Task) => {
    const newTask = { ...task, id: generateUUID() };
    setTasks(prev => [newTask, ...prev]);
    addNotification("Tâche créée", newTask.title, "success");
    await supabase.from('tasks').insert({
      id: newTask.id, title: newTask.title, description: newTask.description,
      assignee_id: newTask.assigneeId, due_date: newTask.dueDate, status: newTask.status,
      type: newTask.type || 'admin', priority: newTask.priority || 'medium', client_id: newTask.clientId
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    await supabase.from('tasks').update({ status }).eq('id', taskId);
  };

  // --- Handlers Chat ---
  const handleSendMessage = async (content: string, channelId: string, attachments: string[] = []) => {
    const now = new Date();
    const newMessage: Message = {
      id: generateUUID(),
      userId: currentUser.id,
      channelId: channelId,
      content: content,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: now.toISOString(),
      attachments: attachments
    };

    setMessages(prev => [...prev, newMessage]);
    
    await supabase.from('messages').insert({
      id: newMessage.id,
      user_id: newMessage.userId,
      channel_id: newMessage.channelId,
      content: newMessage.content,
      created_at: newMessage.fullTimestamp,
      attachments: newMessage.attachments
    });
  };

  const handleAddChannel = async (channelData: { name: string, type: 'global' | 'project' }) => {
    const newChannel: Channel = {
      id: generateUUID(),
      name: channelData.name,
      type: channelData.type,
      unread: 0
    };
    setChannels(prev => [...prev, newChannel]);
    addNotification("Canal créé", `# ${newChannel.name}`, "success");
    await supabase.from('channels').insert({
      id: newChannel.id, name: newChannel.name, type: newChannel.type
    });
  };

  // --- Handlers Équipe (Admin) ---
  const handleAddUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    addNotification("Membre ajouté", user.name, "success");
    await supabase.from('users').insert({
        id: user.id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, status: 'pending', permissions: user.permissions
    });
  };

  const handleRemoveUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    addNotification("Accès révoqué", "Le membre a été supprimé.", "urgent");
    await supabase.from('users').delete().eq('id', userId);
  };

  const handleUpdateMember = async (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    await supabase.from('users').update({
      role: data.role, name: data.name, avatar: data.avatar,
      permissions: data.permissions
    }).eq('id', userId);
    
    if (userId === currentUser.id) {
        setCurrentUser(prev => prev ? ({ ...prev, ...data }) : null);
    }
  };

  const handleNavigate = (view: ViewState) => {
    navigate(`/${view}`);
  };

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={() => supabase.auth.signOut()} 
      unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}
      tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
    >
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
      <Suspense fallback={<div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} notifications={notifications} onNavigate={handleNavigate} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={async(t) => {}} onDeleteTask={async(id) => {}} />} />
          <Route path="/chat" element={<Chat 
            currentUser={currentUser} 
            users={users} 
            channels={channels} 
            currentChannelId={currentChannelId} 
            messages={messages} 
            onlineUserIds={new Set()} 
            onChannelChange={setCurrentChannelId} 
            onSendMessage={handleSendMessage} 
            onAddChannel={handleAddChannel} 
            onDeleteChannel={() => {}} 
          />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} />} />
          <Route path="/team" element={<Team 
            currentUser={currentUser} 
            users={users} 
            tasks={tasks} 
            activities={[]} 
            onlineUserIds={new Set()} 
            onAddUser={handleAddUser} 
            onRemoveUser={handleRemoveUser} 
            onUpdateRole={() => {}} 
            onApproveUser={() => {}} 
            onUpdateMember={handleUpdateMember} 
          />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (d) => handleUpdateMember(currentUser.id, d)} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
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
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchInitialData = useCallback(async (userId?: string) => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      const [usersRes, channelsRes, messagesRes, tasksRes, clientsRes, filesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('file_links').select('*')
      ]);

      if (usersRes.data) {
        const fetchedUsers: User[] = usersRes.data.map((u: any) => ({
          id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar,
          phoneNumber: u.phone_number, notificationPref: u.notification_pref, status: u.status, permissions: u.permissions || {}
        }));
        setUsers(fetchedUsers);
        if (userId) {
          const profile = fetchedUsers.find(u => u.id === userId);
          if (profile) setCurrentUser(profile);
        }
      }
      if (clientsRes.data) setClients(clientsRes.data as Client[]);
      if (channelsRes.data) setChannels(channelsRes.data as Channel[]);
      if (filesRes.data) setFileLinks(filesRes.data.map((f: any) => ({
        id: f.id, name: f.name, url: f.url, clientId: f.client_id, createdBy: f.created_by, createdAt: f.created_at
      })));
      if (messagesRes.data) {
        setMessages(messagesRes.data.map((m: any) => ({
          id: m.id, userId: m.user_id, channelId: m.channel_id, content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          fullTimestamp: m.created_at,
          attachments: m.attachments || []
        })));
      }
      if (tasksRes.data) {
        setTasks(tasksRes.data.map((t: any) => ({
          id: t.id, title: t.title, description: t.description, assigneeId: t.assignee_id,
          dueDate: t.due_date, status: t.status as TaskStatus, type: t.type, priority: t.priority,
          clientId: t.client_id
        })));
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        fetchInitialData(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name: registerName } }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id, name: registerName, email, role: UserRole.MEMBER,
            avatar: `https://ui-avatars.com/api/?name=${registerName.replace(/\s+/g, '+')}&background=random`,
            status: 'active'
          });
          addNotification("Succès", "Veuillez vérifier vos e-mails.", "success");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      addNotification("Erreur", err.message, "urgent");
    } finally {
      setIsAuthProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Sparkles size={48} className="text-primary animate-pulse mb-4" />
        <div className="text-2xl font-black tracking-tighter">iVISION</div>
        <Loader2 className="animate-spin mt-8 text-slate-500" size={24} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <div className="text-4xl font-black tracking-tighter text-slate-900 mb-2"><span className="text-primary">i</span>VISION</div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Workspace</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <input type="text" required value={registerName} onChange={e => setRegisterName(e.target.value)} placeholder="Nom Complet" className="w-full p-5 bg-slate-100/50 border border-slate-200 rounded-3xl font-bold text-slate-900 pl-12 outline-none" />
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            )}
            <div className="relative">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-5 bg-slate-100/50 border border-slate-200 rounded-3xl font-bold text-slate-900 pl-12 outline-none" />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
            <div className="relative">
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full p-5 bg-slate-100/50 border border-slate-200 rounded-3xl font-bold text-slate-900 pl-12 outline-none" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
            <button disabled={isAuthProcessing} className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 active-scale disabled:opacity-50">
              {isAuthProcessing ? <Loader2 className="animate-spin mx-auto" /> : (isRegistering ? "S'INSCRIRE" : "SE CONNECTER")}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
            {isRegistering ? "Déjà membre ? Connexion" : "Créer un nouveau compte"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <AppContent 
        currentUser={currentUser} setCurrentUser={setCurrentUser} 
        users={users} setUsers={setUsers} 
        tasks={tasks} setTasks={setTasks}
        clients={clients} channels={channels} setChannels={setChannels}
        messages={messages} setMessages={setMessages}
        fileLinks={fileLinks}
        addNotification={addNotification} removeNotification={removeNotification} notifications={notifications}
      />
    </HashRouter>
  );
};

export default App;
