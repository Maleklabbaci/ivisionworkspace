
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead } from './types';
import { Mail, Lock, Loader2, User as UserIcon, Sparkles } from 'lucide-react';

// Lazy loading optimal pour une performance maximale
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

const PageLoader = () => (
  <div className="h-[60vh] w-full flex flex-col items-center justify-center space-y-6">
    <div className="w-12 h-12 border-4 border-slate-50 border-t-primary rounded-full animate-spin"></div>
    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Chargement Intelligent...</p>
  </div>
);

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
    // Mise à jour optimiste et stable
    setLeads(prev => prev.map(l => String(l.id) === String(lead.id) ? { ...lead } : l));
    
    try {
      const { error } = await supabase.from('leads').update({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        value_min: lead.valueMin,
        description: lead.description
      }).eq('id', lead.id);

      if (error) throw error;
      addNotification("Mise à jour", "Lead synchronisé", "success");
    } catch (error) {
      console.error(error);
      addNotification("Erreur", "Synchro impossible", "urgent");
      fetchInitialData(); 
    }
  }, [setLeads, addNotification, fetchInitialData]);

  const handleAddLead = useCallback(async (lead: Lead) => {
    try {
      const { data, error } = await supabase.from('leads').insert({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: lead.status || 'new',
        value_min: lead.valueMin,
        description: lead.description
      }).select();

      if (error) throw error;
      if (data?.[0]) {
        const newLead: Lead = {
          ...lead,
          id: data[0].id,
          createdAt: data[0].created_at
        };
        setLeads(prev => [newLead, ...prev]);
        addNotification("Capture iVISION", lead.name, "success");
      }
    } catch (error) {
      console.error(error);
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={async (id) => { await supabase.from('leads').delete().eq('id', id); setLeads(prev => prev.filter(l => String(l.id) !== String(id))); }} onConvertToClient={async (l) => {}} currentUser={currentUser} />} />
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
          currentUser={currentUser} users={users} tasks={tasks}
          clients={clients} leads={leads} setLeads={setLeads}
          channels={channels} messages={messages} fileLinks={fileLinks}
          notifications={notifications}
          addNotification={addNotification}
          removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
          fetchInitialData={fetchInitialData}
        />
      )}
    </HashRouter>
  );
};

export default App;
