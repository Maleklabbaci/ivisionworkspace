
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink } from './types';
import { Mail, Lock, Loader2, Sparkles, User as UserIcon } from 'lucide-react';

// Lazy loading optimal pour environnement ESM
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
  const [currentChannelId, setCurrentChannelId] = useState('general');
  
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
          fullTimestamp: m.created_at, attachments: m.attachments || []
        })));
      }
      if (tasksRes.data) {
        setTasks(tasksRes.data.map((t: any) => ({
          id: t.id, title: t.title, description: t.description, assignee_id: t.assignee_id,
          due_date: t.due_date, status: t.status as TaskStatus, type: t.type, priority: t.priority,
          price: t.price, client_id: t.client_id, comments: [], subtasks: [], attachments: []
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

  const handleAddTask = async (task: Task) => {
    const newTask = { ...task, id: generateUUID() };
    setTasks(prev => [newTask, ...prev]);
    addNotification("Tâche créée", newTask.title, "success");
    await supabase.from('tasks').insert({
      id: newTask.id, title: newTask.title, description: newTask.description,
      assignee_id: newTask.assigneeId, due_date: newTask.dueDate, status: newTask.status,
      type: newTask.type, priority: newTask.priority, price: newTask.price, client_id: newTask.clientId
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    await supabase.from('tasks').update({ status }).eq('id', taskId);
  };

  const handleUpdateMember = async (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    await supabase.from('users').update({
      role: data.role, name: data.name, avatar: data.avatar,
      phone_number: data.phoneNumber, permissions: data.permissions
    }).eq('id', userId);
    
    if (currentUser && userId === currentUser.id) {
        setCurrentUser(prev => prev ? ({ ...prev, ...data }) : null);
    }
  };

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

  const inputClasses = "w-full p-5 bg-slate-100/50 border border-slate-200 rounded-3xl font-bold text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none";

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
                <input type="text" required value={registerName} onChange={e => setRegisterName(e.target.value)} placeholder="Nom Complet" className={`${inputClasses} pl-12`} />
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            )}
            <div className="relative">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={`${inputClasses} pl-12`} />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
            <div className="relative">
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className={`${inputClasses} pl-12`} />
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
            {/* Fix: Remove unused props to match DashboardProps interface */}
            <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} notifications={notifications} onNavigate={() => {}} />} />
            <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={() => {}} onDeleteTask={() => {}} />} />
            <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={currentChannelId} messages={messages} onlineUserIds={new Set()} onChannelChange={setCurrentChannelId} onSendMessage={() => {}} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
            <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} />} />
            <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onlineUserIds={new Set()} onAddUser={() => {}} onRemoveUser={() => {}} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={handleUpdateMember} />} />
            <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (d) => handleUpdateMember(currentUser.id, d)} />} />
            <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} />} />
            <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} />} />
            <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default App;
