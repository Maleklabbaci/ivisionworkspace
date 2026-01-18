
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, checkSupabaseConnection } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, ActivityLog, UserPermissions } from './types';
import { Loader2, Zap, ShieldCheck } from 'lucide-react';

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

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const mapFromDB = (table: string, item: any) => {
  if (!item) return item;
  const mapped = { ...item };
  if (table === 'leads') {
    mapped.valueMin = item.value_min;
    mapped.valueMax = item.value_max;
    mapped.createdAt = item.created_at;
  } else if (table === 'tasks') {
    mapped.assigneeId = item.assignee_id;
    mapped.clientId = item.client_id;
    mapped.dueDate = item.due_date;
  } else if (table === 'activity_logs') {
    mapped.userId = item.user_id;
    mapped.timestamp = new Date(item.created_at).toLocaleTimeString();
  } else if (table === 'messages') {
    mapped.userId = item.user_id;
    mapped.channelId = item.channel_id;
    mapped.timestamp = new Date(item.created_at).toLocaleTimeString();
    mapped.fullTimestamp = item.created_at;
  } else if (table === 'users') {
    mapped.permissions = item.permissions || {};
  } else if (table === 'file_links') {
    mapped.clientId = item.client_id;
    mapped.createdBy = item.created_by;
    mapped.createdAt = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';
  }
  return mapped;
};

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing }: any) => (
  <div className="w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-1000 p-6">
    <div className="glass rounded-[4rem] p-12 md:p-16 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="text-center mb-14 relative z-10">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-950 mx-auto mb-8 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <Zap size={40} strokeWidth={3} fill="currentColor" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">iVISION</h1>
        <p className="text-primary font-black text-[11px] uppercase tracking-[0.5em] mt-6 flex items-center justify-center">
            <ShieldCheck size={14} className="mr-3 shadow-[0_0_10px_#0061FF]" /> ACCÈS SÉCURISÉ
        </p>
      </div>
      <form onSubmit={handleAuth} className="space-y-6 relative z-10">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Professionnel" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white outline-none focus:bg-white/10 focus:border-white/30 transition-all text-sm" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de Passe" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white outline-none focus:bg-white/10 focus:border-white/30 transition-all text-sm" />
        <button type="submit" disabled={isAuthProcessing} className="w-full py-7 bg-white text-slate-950 font-black rounded-[2rem] shadow-2xl active-scale uppercase text-[12px] tracking-[0.3em] mt-4 border-4 border-slate-900">
          {isAuthProcessing ? <Loader2 className="animate-spin mx-auto" size={24} /> : "ACTIVER SESSION"}
        </button>
      </form>
    </div>
  </div>
);

const AppContent: React.FC<any> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, activities,
  addNotification, onDismissNotification, notifications, 
  setLeads, setClients, setTasks, setMessages, setFileLinks, setUsers, setActivities, setCurrentUser, setChannels
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const hasAccess = (permissionKey?: keyof UserPermissions) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (!permissionKey) return true;
    return !!(currentUser.permissions as any)?.[permissionKey];
  };

  const handleAddTask = async (task: Task) => {
    if (!hasAccess('canCreateTasks')) {
      addNotification("Accès Refusé", "Permission de création requise.", "urgent");
      return;
    }
    const { data, error } = await supabase.from('tasks').insert({
      title: task.title,
      description: task.description || '',
      assignee_id: task.assigneeId || currentUser.id,
      client_id: task.clientId || null,
      status: task.status || 'À faire',
      due_date: task.dueDate,
      priority: task.priority || 'medium',
      type: task.type || 'content'
    }).select().single();

    if (data) {
      setTasks((prev: any) => [mapFromDB('tasks', data), ...prev]);
      addNotification("Système iV", "Mission initialisée.", "success");
    }
  };

  const handleAddFileLink = async (name: string, url: string) => {
    if (!hasAccess('canCreateTasks')) return;
    const { data, error } = await supabase.from('file_links').insert({
      name, url, created_by: currentUser.id
    }).select().single();

    if (data) {
      setFileLinks((prev: any) => [mapFromDB('file_links', data), ...prev]);
      addNotification("Documents", "Actif archivé avec succès.", "success");
    }
  };

  const handleDeleteFileLink = async (id: string) => {
    if (!hasAccess('canDeleteFiles')) return;
    const { error } = await supabase.from('file_links').delete().eq('id', id);
    if (!error) {
      setFileLinks((prev: any) => prev.filter((f: any) => f.id !== id));
      addNotification("Documents", "Actif révoqué du cloud.", "info");
    }
  };

  const handleAddUser = async (user: any) => {
    if (!hasAccess('canManageTeam')) return;
    const { data, error } = await supabase.from('users').insert({
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      status: 'active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true`
    }).select().single();

    if (data) {
      setUsers((prev: any) => [...prev, mapFromDB('users', data)]);
      addNotification("Équipe", `Accès activé pour ${user.name}.`, "success");
    }
  };

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-white opacity-20" size={60} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} onNavigate={(v: any) => navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={async (id, s) => { setTasks(prev => prev.map(t => t.id === id ? {...t, status:s} : t)); await supabase.from('tasks').update({status:s}).eq('id', id); }} onUpdateTask={async t => { setTasks(prev => prev.map(item => item.id === t.id ? t : item)); await supabase.from('tasks').update({title:t.title, status:t.status, description: t.description, priority: t.priority, type: t.type}).eq('id', t.id); }} onDeleteTask={async id => { setTasks(prev => prev.filter(t => t.id !== id)); await supabase.from('tasks').delete().eq('id', id); }} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || ""} messages={messages} onSendMessage={async (c, cid) => { const { data } = await supabase.from('messages').insert({content:c, channel_id:cid, user_id:currentUser.id}).select().single(); if(data) setMessages((p:any) => [...p, mapFromDB('messages', data)]); }} onAddChannel={async ch => { const { data } = await supabase.from('channels').insert({name:ch.name, type:ch.type}).select().single(); if(data) setChannels((p:any) => [...p, data]); }} onChannelChange={()=>{}} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={async l => { const { data } = await supabase.from('leads').insert({name:l.name, company:l.company, status:l.status}).select().single(); if(data) setLeads((p:any) => [mapFromDB('leads', data), ...p]); }} onUpdateLead={async l => { await supabase.from('leads').update({status:l.status}).eq('id', l.id); setLeads((p:any) => p.map((i:any) => i.id === l.id ? l : i)); }} onDeleteLead={async id => { await supabase.from('leads').delete().eq('id', id); setLeads((p:any) => p.filter((i:any) => i.id !== id)); }} currentUser={currentUser} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} onAddClient={async c => { const { data } = await supabase.from('clients').insert({name:c.name, company:c.company}).select().single(); if(data) setClients((p:any) => [data, ...p]); }} onDeleteClient={async id => { await supabase.from('clients').delete().eq('id', id); setClients((p:any) => p.filter((c:any) => c.id !== id)); }} currentUser={currentUser} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} clients={clients} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={async (id, s) => { setTasks(prev => prev.map(t => t.id === id ? {...t, status:s} : t)); await supabase.from('tasks').update({status:s}).eq('id', id); }} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} onAddUser={handleAddUser} onRemoveUser={async id => { await supabase.from('users').delete().eq('id', id); setUsers((p:any) => p.filter((u:any) => u.id !== id)); }} onUpdateMember={async (id, u) => { await supabase.from('users').update({name:u.name, role:u.role, permissions:u.permissions}).eq('id', id); setUsers((p:any) => p.map((i:any) => i.id === id ? {...i, ...u} : i)); }} />} />
          <Route path="/files" element={<Files fileLinks={fileLinks} onAddFileLink={handleAddFileLink} onDeleteFileLink={handleDeleteFileLink} currentUser={currentUser} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} leads={leads} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async d => { setCurrentUser(prev => ({...prev!, ...d})); await supabase.from('users').update(d).eq('id', currentUser.id); }} />} />
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
    setNotifications(prev => [...prev, { id: generateUUID(), title, message: typeof message === 'string' ? message : "Système iVISION", type }]);
  }, []);

  const fetchInitialData = useCallback(async (userId: string, userEmail?: string) => {
    try {
      const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
      let profile = userData ? mapFromDB('users', userData) : { id: userId, name: userEmail?.split('@')[0] || 'Opérateur', email: userEmail || '', role: UserRole.ADMIN, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail?.split('@')[0] || 'U')}&background=1e293b&color=fff&bold=true` };
      setCurrentUser(profile);
      const load = async (table: string, setter: Function) => {
        const { data } = await supabase.from(table).select('*').limit(100);
        if (data) setter(data.map(item => mapFromDB(table, item)));
      };
      await Promise.all([load('tasks', setTasks), load('users', setUsers), load('clients', setClients), load('leads', setLeads), load('channels', setChannels), load('file_links', setFileLinks), load('messages', setMessages)]);
      setIsLoading(false);
      setIsAuthProcessing(false);
    } catch {
      setIsLoading(false);
      setIsAuthProcessing(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchInitialData(session.user.id, session.user.email);
      else setIsLoading(false);
    });
  }, [fetchInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) { addNotification("Connexion", error.message, "urgent"); setIsAuthProcessing(false); }
    else if(data.user) fetchInitialData(data.user.id, data.user.email);
  };

  if (isLoading && !currentUser) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] space-y-8"><Zap size={60} className="text-white animate-bounce" /><p className="text-[10px] uppercase tracking-[0.6em] text-white opacity-40">Initialisation iV Core</p></div>;

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-4">
          <AuthUI handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} />
        </div>
      ) : (
        <AppContent 
          currentUser={currentUser} users={users} tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} leads={leads} setLeads={setLeads}
          channels={channels} setChannels={setChannels} messages={messages} setMessages={setMessages} fileLinks={fileLinks} setFileLinks={setFileLinks}
          setUsers={setUsers} notifications={notifications} addNotification={addNotification} onDismissNotification={(id:string)=>setNotifications(p=>p.filter(n=>n.id!==id))} setCurrentUser={setCurrentUser}
        />
      )}
    </HashRouter>
  );
};

export default App;
