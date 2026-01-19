
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, safeFetch } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, UserPermissions, ViewState, Project, SalaryRecord, Expense, AdCampaignExpense } from './types';
import { Loader2, Zap, Lock, WifiOff } from 'lucide-react';

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
const Projects = lazy(() => import('./components/Projects'));
const Finances = lazy(() => import('./components/Finances'));

const generateUUID = () => crypto.randomUUID();

const parsePermissions = (perms: any): UserPermissions => {
  if (!perms) return {};
  if (typeof perms === 'string') {
    try { return JSON.parse(perms); } catch { return {}; }
  }
  return perms;
};

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
    mapped.projectId = item.project_id;
    mapped.dueDate = item.due_date;
  } else if (table === 'users') {
    mapped.permissions = parsePermissions(item.permissions);
  } else if (table === 'messages') {
    mapped.userId = item.user_id;
    mapped.channelId = item.channel_id;
    mapped.timestamp = new Date(item.created_at).toLocaleTimeString();
    mapped.fullTimestamp = item.created_at;
  } else if (table === 'file_links') {
    mapped.clientId = item.client_id;
    mapped.createdBy = item.created_by;
    mapped.createdAt = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';
  } else if (table === 'channels') {
    mapped.member_ids = Array.isArray(item.member_ids) ? item.member_ids : [];
    mapped.created_by = item.created_by;
    mapped.is_private = !!item.is_private;
  } else if (table === 'projects') {
    mapped.totalBudget = item.total_budget;
    mapped.spentBudget = item.spent_budget;
    mapped.clientId = item.client_id;
    mapped.createdAt = item.created_at;
  } else if (table === 'salaries') {
    mapped.userId = item.user_id;
    mapped.projectId = item.project_id;
    mapped.lastPaidDate = item.last_paid_date;
    mapped.bonus = item.bonus || 0;
  } else if (table === 'expenses') {
    mapped.projectId = item.project_id;
    mapped.createdAt = item.created_at;
  } else if (table === 'ad_campaigns') {
    mapped.projectId = item.project_id;
    mapped.createdAt = item.created_at;
  }
  return mapped;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaignExpense[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const addNotification = useCallback((title: string, message: any, type: 'info' | 'success' | 'urgent' = 'info') => {
    let displayMessage = typeof message === 'string' ? message : (message?.message || JSON.stringify(message));
    const id = generateUUID();
    setNotifications(prev => [...prev, { id, title, message: displayMessage, type }]);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      addNotification("Mode Hors Ligne", "Connexion réseau perdue. Certaines données peuvent être obsolètes.", "urgent");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      addNotification("Erreur", "Vérifiez votre connexion internet.", "urgent");
      return;
    }
    setIsAuthProcessing(true);
    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (authData.user) {
          const { error: userError } = await supabase.from('users').insert({
            id: authData.user.id,
            email: email.toLowerCase(),
            name: email.split('@')[0],
            role: UserRole.MEMBER,
            status: 'active',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
          });
          if (userError) throw userError;
          addNotification("Succès", "Profil créé avec succès.", "success");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      addNotification("Erreur d'authentification", error.message || "Vérifiez vos identifiants.", "urgent");
    } finally {
      setIsAuthProcessing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserData(session.user.id);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserData(session.user.id);
      else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Étape 1 : Récupérer le profil utilisateur (Critique)
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
      if (userError) {
        if (userError.message.includes('Failed to fetch')) {
          addNotification("Erreur Réseau", "Impossible de contacter le serveur. Mode hors ligne activé.", "urgent");
        }
        throw userError;
      }
      setCurrentUser(mapFromDB('users', userData));

      // Étape 2 : Chargement sécurisé des autres tables (Non-bloquant)
      const u = await safeFetch(supabase.from('users').select('*'), []);
      setUsers(u.map(i => mapFromDB('users', i)));

      const t = await safeFetch(supabase.from('tasks').select('*').order('created_at', { ascending: false }), []);
      setTasks(t.map(i => mapFromDB('tasks', i)));

      const c = await safeFetch(supabase.from('clients').select('*'), []);
      setClients(c);

      const l = await safeFetch(supabase.from('leads').select('*').order('created_at', { ascending: false }), []);
      setLeads(l.map(i => mapFromDB('leads', i)));

      const ch = await safeFetch(supabase.from('channels').select('*'), []);
      setChannels(ch.map(i => mapFromDB('channels', i)));

      const m = await safeFetch(supabase.from('messages').select('*').order('created_at', { ascending: true }), []);
      setMessages(m.map(i => mapFromDB('messages', i)));

      const f = await safeFetch(supabase.from('file_links').select('*').order('created_at', { ascending: false }), []);
      setFileLinks(f.map(i => mapFromDB('file_links', i)));

      const pr = await safeFetch(supabase.from('projects').select('*').order('created_at', { ascending: false }), []);
      setProjects(pr.map(i => mapFromDB('projects', i)));

      const sl = await safeFetch(supabase.from('salaries').select('*'), []);
      setSalaries(sl.map(i => mapFromDB('salaries', i)));

      const ex = await safeFetch(supabase.from('expenses').select('*').order('created_at', { ascending: false }), []);
      setExpenses(ex.map(i => mapFromDB('expenses', i)));

      const ad = await safeFetch(supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false }), []);
      setAdCampaigns(ad.map(i => mapFromDB('ad_campaigns', i)));

    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-sky-400 mb-4" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Chargement iVISION...</p>
    </div>
  );

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-400 selection:text-white">
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.4em] py-2 text-center z-[10000] flex items-center justify-center">
            <WifiOff size={14} className="mr-3" /> Mode Hors Ligne Actif
          </div>
        )}
        {!currentUser ? (
          <div className="min-h-screen flex items-center justify-center p-4">
            <AuthUI 
              handleAuth={handleAuth} 
              email={email} setEmail={setEmail} 
              password={password} setPassword={setPassword} 
              isAuthProcessing={isAuthProcessing} 
              isSignUp={isSignUp} setIsSignUp={setIsSignUp} 
            />
          </div>
        ) : (
          <AppContent 
            currentUser={currentUser} setCurrentUser={setCurrentUser}
            users={users} setUsers={setUsers}
            tasks={tasks} setTasks={setTasks}
            clients={clients} setClients={setClients}
            leads={leads} setLeads={setLeads}
            channels={channels} setChannels={setChannels}
            messages={messages} setMessages={setMessages}
            fileLinks={fileLinks} setFileLinks={setFileLinks}
            projects={projects} setProjects={setProjects}
            salaries={salaries} setSalaries={setSalaries}
            expenses={expenses} setExpenses={setExpenses}
            adCampaigns={adCampaigns} setAdCampaigns={setAdCampaigns}
            notifications={notifications}
            addNotification={addNotification}
            onDismissNotification={(id: string) => setNotifications(prev => prev.filter(n => n.id !== id))}
          />
        )}
        <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      </div>
    </HashRouter>
  );
};

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing, isSignUp, setIsSignUp }: any) => (
  <div className="w-full max-w-[480px] animate-fade-in p-6">
    <div className="glass rounded-[4rem] p-12 md:p-16 shadow-2xl border border-white/10 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="text-center mb-14 relative z-10">
        <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-950 mx-auto mb-8">
            <Zap size={32} strokeWidth={3} fill="currentColor" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">iVISION</h1>
        <p className="text-primary font-black text-[10px] uppercase tracking-[0.5em] mt-6">CORE SYSTEM ACCESS</p>
      </div>
      <form onSubmit={handleAuth} className="space-y-6 relative z-10">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white outline-none focus:bg-white/10 transition-all text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Mot de passe</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] font-bold text-white outline-none focus:bg-white/10 transition-all text-sm" />
        </div>
        <button type="submit" disabled={isAuthProcessing} className="w-full py-7 bg-white text-slate-950 font-black rounded-[2rem] active-scale uppercase text-[11px] tracking-[0.3em] mt-4 flex items-center justify-center">
          {isAuthProcessing ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? "CRÉER LE PROFIL" : "ENTRER")}
        </button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full py-4 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors">
          {isSignUp ? "DÉJÀ UN COMPTE ? SE CONNECTER" : "S'INSCRIRE"}
        </button>
      </form>
    </div>
  </div>
);

const AccessGuard: React.FC<{
  currentUser: User;
  permission?: keyof UserPermissions;
  role?: UserRole;
  children: React.ReactNode;
}> = ({ currentUser, permission, role, children }) => {
  if (currentUser.role === UserRole.ADMIN) return <>{children}</>;
  
  const hasRole = role ? currentUser.role === role : true;
  const hasPermission = permission ? !!(currentUser.permissions as any)?.[permission] : true;

  if (hasRole && hasPermission) {
    return <>{children}</>;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-20">
      <div className="bg-rose-500/10 p-10 rounded-full mb-6 flex items-center justify-center text-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.1)]"><Lock size={48} /></div>
      <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Accès Restreint</h2>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Désolé, vous n'avez pas les autorisations iVISION nécessaires pour accéder à ce noyau.</p>
    </div>
  );
};

const AppContent: React.FC<any> = ({ 
  currentUser, users, tasks, setTasks, clients, setClients, leads, setLeads, 
  channels, setChannels, messages, setMessages, fileLinks, setFileLinks, 
  projects, setProjects, salaries, setSalaries, expenses, setExpenses, adCampaigns, setAdCampaigns,
  setUsers, notifications, addNotification, onDismissNotification, setCurrentUser 
}) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);

  useEffect(() => {
    if (channels.length > 0 && !currentChannelId) {
      setCurrentChannelId(channels[0].id);
    }
  }, [channels, currentChannelId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/');
  };

  const handleUpdateClient = async (updated: Client) => {
    const { error } = await supabase.from('clients').update(updated).eq('id', updated.id);
    if (error) {
      addNotification("Erreur", error, "urgent");
    } else {
      setClients(clients.map(c => c.id === updated.id ? updated : c));
      addNotification("CRM", `Fiche ${updated.name} mise à jour.`, "success");
    }
  };

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} clients={clients} onNavigate={(v:ViewState)=>navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} projects={projects} currentUser={currentUser} onUpdateStatus={(id:string,st:any)=> {
            supabase.from('tasks').update({status:st}).eq('id',id).then(()=>setTasks(tasks.map(t=>t.id===id?{...t,status:st}:t)));
          }} onAddTask={(t:any)=> {
             const newTask = {...t, id:generateUUID(), created_at: new Date().toISOString()};
             supabase.from('tasks').insert({id:newTask.id, title:t.title, description:t.description, assignee_id:t.assigneeId, client_id:t.clientId, project_id:t.projectId, due_date:t.dueDate, status:t.status, type:t.type, priority:t.priority}).then(()=>setTasks([mapFromDB('tasks', newTask), ...tasks]));
          }} onUpdateTask={(t:any)=> {
             // Fix: Map correct properties from the 't' object to Supabase schema names
             supabase.from('tasks').update({
               title: t.title, 
               description: t.description, 
               assignee_id: t.assigneeId, 
               client_id: t.clientId, 
               project_id: t.projectId, 
               due_date: t.dueDate, 
               status: t.status, 
               type: t.type, 
               priority: t.priority
             }).eq('id', t.id).then(()=>setTasks(tasks.map(tk=>tk.id===t.id?{...tk,...t}:tk)));
          }} onDeleteTask={(id:string)=> {
             supabase.from('tasks').delete().eq('id',id).then(()=>setTasks(tasks.filter(t=>t.id!==id)));
          }} />} />
          <Route path="/projects" element={<Projects projects={projects} clients={clients} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} onAddProject={(p:any)=>{
            const id = generateUUID();
            supabase.from('projects').insert({id, name:p.name, description:p.description, total_budget:p.totalBudget, spent_budget:0, status:p.status, client_id:p.clientId}).then(()=>setProjects([{...p, id, spentBudget:0, createdAt: new Date().toISOString()}, ...projects]));
          }} onDeleteProject={(id:string)=> {
            supabase.from('projects').delete().eq('id',id).then(()=>setProjects(projects.filter(p=>p.id!==id)));
          }} onUpdateProject={(p:Project)=>{
             // Fix: Use correct camelCase property names from the Project type (totalBudget, clientId)
             supabase.from('projects').update({
               name: p.name, 
               description: p.description, 
               total_budget: p.totalBudget, 
               status: p.status, 
               client_id: p.clientId
             }).eq('id', p.id).then(()=>setProjects(projects.map(pr=>pr.id===p.id?p:pr)));
          }} />} />
          <Route path="/finance" element={<AccessGuard currentUser={currentUser} permission="canManageFinances" role={UserRole.ADMIN}>
            <Finances 
              salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} users={users} projects={projects}
              currentUser={currentUser} 
              onAddSalary={(s:any)=>{
                const id = generateUUID();
                supabase.from('salaries').insert({id, user_id:s.userId, project_id:s.projectId, amount:s.amount, bonus:s.bonus, frequency:s.frequency, status:s.status}).then(()=>setSalaries([{...s, id}, ...salaries]));
              }} onDeleteSalary={(id:string)=> {
                supabase.from('salaries').delete().eq('id',id).then(()=>setSalaries(salaries.filter(s=>s.id!==id)));
              }} onUpdateSalary={(s:SalaryRecord)=>{
                supabase.from('salaries').update({status:s.status, amount:s.amount, bonus:s.bonus, frequency:s.frequency, project_id:s.projectId}).eq('id',s.id).then(()=>setSalaries(salaries.map(sl=>sl.id===s.id?s:sl)));
              }} 
              onAddExpense={(ex:any)=>{
                const id = generateUUID();
                supabase.from('expenses').insert({id, name:ex.name, amount:ex.amount, type:ex.type, project_id:ex.projectId, status:ex.status}).then(()=>setExpenses([{...ex, id, createdAt: new Date().toISOString()}, ...expenses]));
              }} onDeleteExpense={(id:string)=> {
                supabase.from('expenses').delete().eq('id',id).then(()=>setExpenses(expenses.filter(e=>e.id!==id)));
              }}
              onAddAdCampaign={(ad:any)=>{
                const id = generateUUID();
                supabase.from('ad_campaigns').insert({id, name:ad.name, amount:ad.amount, platform:ad.platform, project_id:ad.projectId, status:ad.status}).then(()=>setAdCampaigns([{...ad, id, createdAt: new Date().toISOString()}, ...adCampaigns]));
              }} onDeleteAdCampaign={(id:string)=> {
                supabase.from('ad_campaigns').delete().eq('id',id).then(()=>setAdCampaigns(adCampaigns.filter(a=>a.id!==id)));
              }}
            />
          </AccessGuard>} />
          <Route path="/chat" element={<AccessGuard currentUser={currentUser} permission="canManageChat">
            <Chat 
              currentUser={currentUser} users={users} channels={channels} 
              currentChannelId={currentChannelId} messages={messages} 
              onChannelChange={setCurrentChannelId}
              onSendMessage={(c:string,cid:string)=> {
                supabase.from('messages').insert({id:generateUUID(), content:c, channel_id:cid, user_id:currentUser.id}).select().single().then(({data})=>{if(data) setMessages([...messages, mapFromDB('messages', data)])});
              }} 
            />
          </AccessGuard>} />
          <Route path="/team" element={<AccessGuard currentUser={currentUser} role={UserRole.ADMIN}><Team currentUser={currentUser} users={users} onAddUser={(u:any)=> {
            supabase.from('users').insert({id:generateUUID(), ...u, email:u.email.toLowerCase(), avatar:`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`, status:'active'}).select().single().then(({data})=>{if(data) setUsers([mapFromDB('users',data),...users])});
          }} onRemoveUser={(id:string)=> {
            supabase.from('users').delete().eq('id', id).then(()=>setUsers(users.filter(u=>u.id!==id)));
          }} onUpdateMember={async (id:string, up:any) => {
             await supabase.from('users').update(up).eq('id',id);
             setUsers(users.map(u => u.id === id ? {...u, ...up} : u));
          }} /></AccessGuard>} />
          <Route path="/files" element={<AccessGuard currentUser={currentUser} permission="canViewFiles"><Files fileLinks={fileLinks} onAddFileLink={(n:string,u:string)=> {
            supabase.from('file_links').insert({id:generateUUID(), name:n, url:u, created_by:currentUser.id}).select().single().then(({data})=>{if(data) setFileLinks([mapFromDB('file_links',data),...fileLinks])});
          }} onDeleteFileLink={(id:string)=> {
             supabase.from('file_links').delete().eq('id',id).then(()=>setFileLinks(fileLinks.filter(f=>f.id!==id)));
          }} currentUser={currentUser} /></AccessGuard>} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (up:any)=>{
            await supabase.from('users').update(up).eq('id', currentUser.id);
            setCurrentUser({...currentUser, ...up});
          }} />} />
          <Route path="/reports" element={<AccessGuard currentUser={currentUser} permission="canViewReports">
            <Reports 
              tasks={tasks} 
              leads={leads} 
              messages={messages} 
              projects={projects}
              salaries={salaries}
              expenses={expenses}
              adCampaigns={adCampaigns}
              currentUser={currentUser} 
            />
          </AccessGuard>} />
          <Route path="/clients" element={<AccessGuard currentUser={currentUser} permission="canManageClients"><Clients clients={clients} tasks={tasks} onAddClient={(c:any)=> {
            supabase.from('clients').insert({id:generateUUID(), ...c}).select().single().then(({data})=>{if(data) setClients([data,...clients])});
          }} onUpdateClient={handleUpdateClient} onDeleteClient={(id:string)=> {
            supabase.from('clients').delete().eq('id',id).then(()=>setClients(clients.filter(c=>c.id!==id)));
          }} currentUser={currentUser} /></AccessGuard>} />
          <Route path="/calendar" element={<Calendar tasks={tasks} onAddTask={(t:any)=> {
             const newTask = {...t, id:generateUUID(), created_at: new Date().toISOString()};
             supabase.from('tasks').insert({id:newTask.id, title:t.title, description:t.description, assignee_id:t.assigneeId, client_id:t.clientId, project_id:t.projectId, due_date:t.dueDate, status:t.status, type:t.type, priority:t.priority}).then(()=>setTasks([mapFromDB('tasks', newTask), ...tasks]));
          }} onUpdateStatus={(id:string,st:any)=> {
            supabase.from('tasks').update({status:st}).eq('id',id).then(()=>setTasks(tasks.map(t=>t.id===id?{...t,status:st}:t)));
          }} currentUser={currentUser} users={users} clients={clients} projects={projects} />} />
          <Route path="/leads" element={<AccessGuard currentUser={currentUser} permission="canManageLeads"><Leads leads={leads} onAddLead={(l:any)=> {
            supabase.from('leads').insert({id:generateUUID(), ...l, value_min:l.valueMin, value_max:l.valueMax}).select().single().then(({data})=>{if(data) setLeads([mapFromDB('leads',data),...leads])});
          }} onUpdateLead={(l:any)=> {
            supabase.from('leads').update({...l, value_min:l.valueMin, value_max:l.valueMax}).eq('id',l.id).then(()=>setLeads(leads.map(ld=>ld.id===l.id?{...ld,...l}:ld)));
          }} onDeleteLead={(id:string)=> {
            supabase.from('leads').delete().eq('id',id).then(()=>setLeads(leads.filter(l=>l.id!==id)));
          }} onConvertToClient={(l:any)=> {
             const {id:_, ...cData} = l;
             supabase.from('clients').insert({id:generateUUID(), name:l.name, company:l.company, email:l.email, phone:l.phone}).select().single().then(({data})=>{
               if(data) {
                 setClients([data,...clients]);
                 supabase.from('leads').delete().eq('id',l.id).then(()=>setLeads(leads.filter(ld=>ld.id!==l.id)));
                 addNotification("CRM", "Prospect converti en client.", "success");
               }
             });
          }} currentUser={currentUser} addNotification={addNotification} /></AccessGuard>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
