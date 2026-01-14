
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead } from './types';
import { Mail, Lock, Loader2, User as UserIcon, Sparkles, Zap } from 'lucide-react';

// Modules Lazy-Loaded pour alléger le bundle initial
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

const PageSkeleton = () => (
  <div className="w-full animate-in fade-in duration-700 space-y-10 px-4">
    <div className="flex justify-between items-end mb-12">
      <div className="space-y-3">
        <div className="h-12 w-64 bg-slate-50 rounded-2xl animate-pulse"></div>
        <div className="h-3 w-40 bg-slate-50 rounded-full animate-pulse opacity-50"></div>
      </div>
      <div className="h-14 w-14 bg-slate-50 rounded-2xl animate-pulse"></div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-48 bg-slate-50 rounded-[3rem] animate-pulse"></div>
      ))}
    </div>
    <div className="h-96 w-full bg-slate-50 rounded-[3.5rem] animate-pulse"></div>
  </div>
);

const AuthUI = ({ isRegistering, setIsRegistering, handleAuth, email, setEmail, password, setPassword, registerName, setRegisterName, isAuthProcessing }: any) => (
  <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.08)] p-12 border border-slate-50 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
    <div className="text-center mb-12">
      <div className="w-20 h-20 bg-primary rounded-[2.5rem] flex items-center justify-center text-white font-black text-2xl mx-auto shadow-2xl shadow-primary/30 mb-8 animate-bounce-slow">iV</div>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1 uppercase">iVISION</h1>
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.5em] mt-3">Workspace Intelligence</p>
    </div>
    
    <form onSubmit={handleAuth} className="space-y-4">
      {isRegistering && (
        <div className="relative group">
          <input 
            type="text" 
            required 
            value={registerName} 
            onChange={e => setRegisterName(e.target.value)} 
            placeholder="Nom complet" 
            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl font-bold text-slate-900 pl-14 outline-none focus:bg-white focus:border-primary/20 transition-all shadow-sm" 
          />
          <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
        </div>
      )}
      <div className="relative group">
        <input 
          type="email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email iVISION" 
          className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl font-bold text-slate-900 pl-14 outline-none focus:bg-white focus:border-primary/20 transition-all shadow-sm" 
        />
        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
      </div>
      <div className="relative group">
        <input 
          type="password" 
          required 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Mot de passe" 
          className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl font-bold text-slate-900 pl-14 outline-none focus:bg-white focus:border-primary/20 transition-all shadow-sm" 
        />
        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
      </div>
      
      <button 
        type="submit"
        disabled={isAuthProcessing} 
        className="w-full py-6 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/40 active-scale disabled:opacity-50 border-4 border-white uppercase text-xs tracking-[0.2em] mt-8 flex items-center justify-center"
      >
        {isAuthProcessing ? <Loader2 className="animate-spin" /> : (isRegistering ? "CRÉER UN ACCÈS" : "DÉVERROUILLER")}
      </button>
    </form>
    
    <button 
      type="button"
      onClick={() => setIsRegistering(!isRegistering)} 
      className="w-full mt-12 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center space-x-2"
    >
      <Zap size={14} className="text-orange-400" />
      <span>{isRegistering ? "Retour Connexion" : "Nouvel accès iVISION"}</span>
    </button>
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
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'urgent') => void;
  removeNotification: (id: string) => void;
  notifications: ToastNotification[];
  fetchInitialData: (userId?: string) => Promise<void>;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, 
  addNotification, removeNotification, notifications, fetchInitialData, setLeads
}) => {
  const navigate = useNavigate();

  const handleUpdateLead = useCallback(async (lead: Lead) => {
    setLeads(prev => prev.map(l => String(l.id) === String(lead.id) ? { ...lead } : l));
    try {
      await supabase.from('leads').update({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        value_min: lead.valueMin,
        description: lead.description
      }).eq('id', lead.id);
      addNotification("Synchronisation", "Lead mis à jour", "success");
    } catch (e) {
      console.error(e);
    }
  }, [setLeads, addNotification]);

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={() => supabase.auth.signOut()} 
      unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}
      tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
    >
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={async (l) => {}} onUpdateLead={handleUpdateLead} onDeleteLead={async (id) => {}} onConvertToClient={async (l) => {}} currentUser={currentUser} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={async () => {}} onAddTask={async () => {}} onUpdateTask={async () => {}} onDeleteTask={async () => {}} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async () => {}} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId="general" messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={() => {}} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={async () => {}} onUpdateStatus={async () => {}} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onlineUserIds={new Set()} onAddUser={async () => {}} onRemoveUser={async () => {}} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={async () => {}} />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} />} />
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
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
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
        valueMin: l.value_min || 0, valueMax: l.value_max || 0, description: l.description, createdAt: l.created_at
      })));
      if (cRes.data) setChannels(cRes.data as Channel[]);
      if (mRes.data) setMessages(mRes.data.map((m: any) => ({
        id: m.id, userId: m.user_id, channelId: m.channel_id, content: m.content, timestamp: new Date(m.created_at).toLocaleTimeString()
      })));
      if (tRes.data) setTasks(tRes.data.map((t: any) => ({
        id: t.id, title: t.title, description: t.description, assigneeId: t.assignee_id, status: t.status as TaskStatus, dueDate: t.due_date, priority: t.priority
      })));
    } catch (e) { console.error(e); }
    finally { 
      // Petit délai pour laisser l'animation de fin de chargement respirer
      setTimeout(() => setIsLoading(false), 800);
    }
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
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      addNotification("Erreur", err.message, "urgent");
    } finally { setIsAuthProcessing(false); }
  };

  if (isLoading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white space-y-10 animate-in fade-in duration-1000">
      <div className="relative">
        <div className="w-28 h-28 border-[6px] border-slate-50 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-black text-primary text-2xl tracking-tighter">iV</div>
      </div>
      <div className="text-center">
        <p className="text-[14px] font-black uppercase tracking-[0.8em] text-slate-300">Synchronisation iVISION</p>
        <p className="text-[9px] font-bold text-slate-100 uppercase mt-4 animate-pulse">Initialisation du workspace...</p>
      </div>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f1f5f9_100%)] animate-in fade-in duration-500">
          <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
          <AuthUI 
            isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth}
            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            registerName={registerName} setRegisterName={setRegisterName} isAuthProcessing={isAuthProcessing}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <AppContent 
            currentUser={currentUser} users={users} tasks={tasks}
            clients={clients} leads={leads} setLeads={setLeads}
            channels={channels} messages={messages} fileLinks={fileLinks}
            notifications={notifications}
            addNotification={addNotification}
            removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            fetchInitialData={fetchInitialData}
          />
        </div>
      )}
    </HashRouter>
  );
};

export default App;
