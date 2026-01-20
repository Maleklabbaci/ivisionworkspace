
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, safeFetch } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, UserPermissions, ViewState, Project, SalaryRecord, Expense, AdCampaignExpense } from './types';
import { Loader2, Zap, Lock, WifiOff, Mail, Key, ArrowRight, UserPlus, LogIn, ShieldCheck, Fingerprint } from 'lucide-react';

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
      const normalizedEmail = email.toLowerCase().trim();
      if (isSignUp) {
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
        if (existingUser) throw new Error("Cette adresse email est déjà enregistrée.");
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (authError) throw authError;
        if (authData.user) {
          const { error: userError } = await supabase.from('users').insert({ id: authData.user.id, email: normalizedEmail, name: email.split('@')[0], role: UserRole.MEMBER, status: 'active', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random` });
          if (userError) throw userError;
          addNotification("Succès", "Profil créé avec succès.", "success");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
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
      else { setCurrentUser(null); setLoading(false); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (userError) throw userError;
      if (userData) setCurrentUser(mapFromDB('users', userData));
      const [u, t, c, l, ch, m, f, pr, sl, ex, ad] = await Promise.all([
        safeFetch(supabase.from('users').select('*'), []),
        safeFetch(supabase.from('tasks').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('clients').select('*'), []),
        safeFetch(supabase.from('leads').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('channels').select('*'), []),
        safeFetch(supabase.from('messages').select('*').order('created_at', { ascending: true }), []),
        safeFetch(supabase.from('file_links').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('projects').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('salaries').select('*'), []),
        safeFetch(supabase.from('expenses').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false }), [])
      ]);
      setUsers(u.map(i => mapFromDB('users', i)));
      setTasks(t.map(i => mapFromDB('tasks', i)));
      setClients(c);
      setLeads(l.map(i => mapFromDB('leads', i)));
      setChannels(ch.map(i => mapFromDB('channels', i)));
      setMessages(m.map(i => mapFromDB('messages', i)));
      setFileLinks(f.map(i => mapFromDB('file_links', i)));
      setProjects(pr.map(i => mapFromDB('projects', i)));
      setSalaries(sl.map(i => mapFromDB('salaries', i)));
      setExpenses(ex.map(i => mapFromDB('expenses', i)));
      setAdCampaigns(ad.map(i => mapFromDB('ad_campaigns', i)));
    } catch (error: any) { console.error('Fetch error:', error); } finally { setLoading(false); }
  };

  const handleAutoGenerateTasks = async (pId: string, pName: string, pClientId: string | undefined, configs: any[]) => {
    if (!configs || configs.length === 0) return;
    
    const tasksToInsert: any[] = [];
    configs.forEach(config => {
      if (!config.enabled || config.count <= 0) return;
      for (let i = 1; i <= config.count; i++) {
        tasksToInsert.push({
          id: generateUUID(),
          title: `${config.prefix} ${i}`,
          description: `Mission générée automatiquement pour le projet ${pName}.`,
          assignee_id: config.assigneeId || currentUser?.id,
          project_id: pId,
          client_id: pClientId || null,
          status: TaskStatus.TODO,
          type: 'content',
          priority: 'medium',
          due_date: new Date().toLocaleDateString('en-CA')
        });
      }
    });

    if (tasksToInsert.length === 0) return;

    const { data: newTasks, error: taskError } = await supabase.from('tasks').insert(tasksToInsert).select();
    if (taskError) {
      addNotification("Erreur Tâches", "Les tâches auto n'ont pas pu être générées.", "urgent");
    } else if (newTasks) {
      setTasks(prev => [...newTasks.map(nt => mapFromDB('tasks', nt)), ...prev]);
      addNotification("Auto-Générateur", `${tasksToInsert.length} missions indexées.`, "success");
    }
  };

  if (loading) return <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-sky-400 mb-4" size={48} /><p className="text-slate-500 font-bold uppercase text-[11px]">Chargement iVISION...</p></div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-400 selection:text-white">
        {isOffline && <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase py-2 text-center z-[10000] flex items-center justify-center"><WifiOff size={14} className="mr-3" /> CONNEXION INTERROMPUE</div>}
        {!currentUser ? <AuthUI handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} isSignUp={isSignUp} setIsSignUp={setIsSignUp} /> : (
          <AppContent 
            currentUser={currentUser} setCurrentUser={setCurrentUser} users={users} setUsers={setUsers} tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} leads={leads} setLeads={setLeads} channels={channels} setChannels={setChannels} messages={messages} setMessages={setMessages} fileLinks={fileLinks} setFileLinks={setFileLinks} projects={projects} setProjects={setProjects} salaries={salaries} setSalaries={setSalaries} expenses={expenses} setExpenses={setExpenses} adCampaigns={adCampaigns} setAdCampaigns={setAdCampaigns} notifications={notifications} addNotification={addNotification} handleAutoGenerateTasks={handleAutoGenerateTasks} onDismissNotification={(id: string) => setNotifications(prev => prev.filter(n => n.id !== id))}
          />
        )}
        <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      </div>
    </HashRouter>
  );
};

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing, isSignUp, setIsSignUp }: any) => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center md:justify-center overflow-y-auto no-scrollbar">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-sky-500/10 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="relative z-10 w-full md:max-w-md p-6 flex flex-col md:h-auto">
        <div className="flex flex-col items-center justify-center pt-12 pb-8 md:pt-0 animate-fade-in text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl mb-6 transform transition-transform hover:scale-110"><Fingerprint size={32} strokeWidth={2.5} /></div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none">iVISION</h1>
          <p className="text-sky-400 font-bold text-xs uppercase mt-3 tracking-normal">Security Access Protocol</p>
        </div>
        <div className="w-full bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-slide-up relative overflow-hidden">
            <div className="mb-10"><h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">{isSignUp ? 'Nouvel Accès' : 'Connexion'}</h2><div className="flex items-center mt-3 space-x-2 text-slate-500"><ShieldCheck size={14} className="text-sky-400" /><span className="text-[11px] font-bold uppercase tracking-normal">Système iV Sécurisé</span></div></div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative group/input"><div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-sky-400 transition-colors"><Mail size={18} /></div><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre email" className="w-full pl-14 pr-6 py-5 bg-white/[0.04] border border-white/5 rounded-2xl font-bold text-white outline-none focus:bg-white/[0.08] focus:border-sky-400/50 transition-all text-sm placeholder-slate-600" /></div>
              <div className="relative group/input"><div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-sky-400 transition-colors"><Key size={18} /></div><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Code secret" className="w-full pl-14 pr-6 py-5 bg-white/[0.04] border border-white/5 rounded-2xl font-bold text-white outline-none focus:bg-white/[0.08] focus:border-sky-400/50 transition-all text-sm placeholder-slate-600" /></div>
              <button type="submit" disabled={isAuthProcessing} className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl active-scale uppercase text-xs mt-6 flex items-center justify-center shadow-xl hover:bg-sky-400 hover:text-white transition-all duration-300 disabled:opacity-50">{isAuthProcessing ? <Loader2 className="animate-spin" size={20} /> : (<div className="flex items-center space-x-3"><span>{isSignUp ? "DÉPLOYER L'ACCÈS" : "DÉVERROUILLER"}</span>{isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}</div>)}</button>
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full pt-6 text-slate-500 hover:text-white font-bold text-[11px] uppercase transition-all tracking-normal">{isSignUp ? "Déjà un compte ? Se connecter" : "Besoin d'un accès ? S'inscrire"}</button>
            </form>
        </div>
        <div className="py-12 text-center opacity-30 text-[10px] font-bold uppercase text-slate-600 tracking-normal">© 2025 iVISION CRYSTAL CORE</div>
      </div>
    </div>
  );
};

const AccessGuard: React.FC<{ currentUser: User; permission?: keyof UserPermissions; role?: UserRole; children: React.ReactNode; }> = ({ currentUser, permission, role, children }) => {
  if (currentUser.role === UserRole.ADMIN) return <>{children}</>;
  const hasRole = role ? currentUser.role === role : true;
  const hasPermission = permission ? !!(currentUser.permissions as any)?.[permission] : true;
  if (hasRole && hasPermission) return <>{children}</>;
  return <div className="h-full flex flex-col items-center justify-center text-center p-8 pt-20"><div className="bg-rose-500/10 p-10 rounded-full mb-6 flex items-center justify-center text-rose-500"><Lock size={48} /></div><h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Accès Restreint</h2><p className="text-slate-500 font-bold uppercase text-[11px] tracking-normal">Autorisations iVISION insuffisantes.</p></div>;
};

const AppContent: React.FC<any> = ({ currentUser, users, tasks, setTasks, clients, setClients, leads, setLeads, channels, setChannels, messages, setMessages, fileLinks, setFileLinks, projects, setProjects, salaries, setSalaries, expenses, setExpenses, adCampaigns, setAdCampaigns, setUsers, notifications, addNotification, handleAutoGenerateTasks, onDismissNotification, setCurrentUser }) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  useEffect(() => { if (channels.length > 0 && !currentChannelId) setCurrentChannelId(channels[0].id); }, [channels, currentChannelId]);
  const handleLogout = async () => { await supabase.auth.signOut(); setCurrentUser(null); navigate('/'); };

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} clients={clients} onNavigate={(v:ViewState)=>navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} projects={projects} currentUser={currentUser} onUpdateStatus={(id:string,st:any)=> { supabase.from('tasks').update({status:st}).eq('id',id).then(()=>setTasks(tasks.map(t=>t.id===id?{...t,status:st}:t))); }} onAddTask={(t:any)=> { const newTask = {...t, id:generateUUID(), created_at: new Date().toISOString()}; supabase.from('tasks').insert({id:newTask.id, title:t.title, description:t.description, assignee_id:t.assigneeId, client_id:t.clientId, project_id:t.projectId, due_date:t.dueDate, status:t.status, type:t.type, priority:t.priority}).then(()=>setTasks([mapFromDB('tasks', newTask), ...tasks])); }} onUpdateTask={(t:any)=> { supabase.from('tasks').update({ title: t.title, description: t.description, assignee_id: t.assigneeId, client_id: t.clientId, project_id: t.projectId, due_date: t.dueDate, status: t.status, type: t.type, priority: t.priority }).eq('id', t.id).then(()=>setTasks(tasks.map(tk=>tk.id===t.id?{...tk,...t}:tk))); }} onDeleteTask={(id:string)=> { supabase.from('tasks').delete().eq('id',id).then(()=>setTasks(tasks.filter(t=>t.id!==id))); }} />} />
          <Route path="/projects" element={<Projects projects={projects} users={users} clients={clients} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} onAddProject={async (p:any, autoConfigs:any[])=>{
            const id = generateUUID();
            const createdAt = new Date().toISOString();
            const { error: projError } = await supabase.from('projects').insert({id, name:p.name, description:p.description, total_budget:p.totalBudget, spent_budget:0, status:p.status, client_id:p.clientId});
            if (projError) { addNotification("Erreur Projet", projError.message, "urgent"); return; }
            setProjects([{...p, id, spentBudget:0, createdAt}, ...projects]);
            addNotification("Système", `Projet ${p.name} déployé.`, "success");
            if (autoConfigs && autoConfigs.length > 0) handleAutoGenerateTasks(id, p.name, p.clientId, autoConfigs);
          }} onDeleteProject={(id:string)=> { setProjects(projects.filter(p=>p.id!==id)); supabase.from('projects').delete().eq('id',id); }} onUpdateProject={async (p:Project, autoConfigs?: any[])=>{
             const { error } = await supabase.from('projects').update({ name: p.name, description: p.description, total_budget: p.totalBudget, status: p.status, client_id: p.clientId }).eq('id', p.id);
             if (!error) {
               setProjects(projects.map(pr=>pr.id===p.id?p:pr));
               if (autoConfigs && autoConfigs.length > 0) await handleAutoGenerateTasks(p.id, p.name, p.clientId, autoConfigs);
               else addNotification("Système", "Projet mis à jour.", "success");
             }
          }} />} />
          <Route path="/finance" element={<AccessGuard currentUser={currentUser} permission="canManageFinances" role={UserRole.ADMIN}><Finances salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} users={users} projects={projects} currentUser={currentUser} onAddSalary={(s:any)=>{ const id = generateUUID(); supabase.from('salaries').insert({id, user_id:s.userId, project_id:s.projectId, amount:s.amount, bonus:s.bonus, frequency:s.frequency, status:s.status}).then(()=>setSalaries([{...s, id}, ...salaries])); }} onDeleteSalary={(id:string)=> { setSalaries(salaries.filter(s=>s.id!==id)); supabase.from('salaries').delete().eq('id',id); }} onUpdateSalary={(s:SalaryRecord)=>{ supabase.from('salaries').update({status:s.status, amount:s.amount, bonus:s.bonus, frequency:s.frequency, project_id:s.projectId}).eq('id',s.id).then(()=>setSalaries(salaries.map(sl=>sl.id===s.id?s:sl))); }} onAddExpense={(ex:any)=>{ const id = generateUUID(); supabase.from('expenses').insert({id, name:ex.name, amount:ex.amount, type:ex.type, project_id:ex.projectId, status:ex.status}).then(()=>setExpenses([{...ex, id, createdAt: new Date().toISOString()}, ...expenses])); }} onDeleteExpense={(id:string)=> { setExpenses(expenses.filter(e=>e.id!==id)); supabase.from('expenses').delete().eq('id',id); }} onAddAdCampaign={(ad:any)=>{ const id = generateUUID(); supabase.from('ad_campaigns').insert({id, name:ad.name, amount:ad.amount, platform:ad.platform, project_id:ad.projectId, status:ad.status}).then(()=>setAdCampaigns([{...ad, id, createdAt: new Date().toISOString()}, ...adCampaigns])); }} onDeleteAdCampaign={(id:string)=> { setAdCampaigns(adCampaigns.filter(a=>a.id!==id)); supabase.from('ad_campaigns').delete().eq('id',id); }} /></AccessGuard>} />
          <Route path="/chat" element={<AccessGuard currentUser={currentUser} permission="canManageChat"><Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={currentChannelId} messages={messages} onChannelChange={setCurrentChannelId} onSendMessage={(c:string,cid:string)=> { supabase.from('messages').insert({id:generateUUID(), content:c, channel_id:cid, user_id:currentUser.id}).select().single().then(({data})=>{if(data) setMessages([...messages, mapFromDB('messages', data)])}); }} /></AccessGuard>} />
          <Route path="/team" element={<AccessGuard currentUser={currentUser} role={UserRole.ADMIN}><Team currentUser={currentUser} users={users} onAddUser={async (u:any)=> { const normalizedEmail = u.email.toLowerCase().trim(); if (users.some(existingUser => existingUser.email.toLowerCase() === normalizedEmail)) { addNotification("Erreur", "Cette adresse email est déjà utilisée.", "urgent"); return; } const { data: authData, error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password: u.password }); if (authError) { addNotification("Erreur Déploiement", authError.message, "urgent"); return; } if (authData.user) { const { error: userError } = await supabase.from('users').insert({ id: authData.user.id, email: normalizedEmail, name: u.name, role: u.role, permissions: u.permissions, status: 'active', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random` }); if (userError) addNotification("Erreur Profil", userError.message, "urgent"); else { addNotification("Succès", `Accès déployé pour ${u.name}.`, "success"); const u_list = await safeFetch(supabase.from('users').select('*'), []); setUsers(u_list.map(i => mapFromDB('users', i))); } } }} onRemoveUser={async (id:string)=> { const { error } = await supabase.from('users').delete().eq('id', id); if (error) addNotification("Erreur", error.message, "urgent"); else { setUsers(users.filter(u=>u.id!==id)); addNotification("Système", "Accès révoqué.", "success"); } }} onUpdateMember={async (id:string, up:any) => { const { error } = await supabase.from('users').update({ name: up.name, email: up.email.toLowerCase().trim(), role: up.role, permissions: up.permissions }).eq('id',id); if (error) addNotification("Erreur", error.message, "urgent"); else { setUsers(users.map(u => u.id === id ? {...u, ...up} : u)); addNotification("Système", "Profil mis à jour.", "success"); } }} /></AccessGuard>} />
          <Route path="/files" element={<AccessGuard currentUser={currentUser} permission="canViewFiles"><Files fileLinks={fileLinks} onAddFileLink={(n:string,u:string)=> { supabase.from('file_links').insert({id:generateUUID(), name:n, url:u, created_by:currentUser.id}).select().single().then(({data})=>{if(data) setFileLinks([mapFromDB('file_links',data),...fileLinks])}); }} onDeleteFileLink={(id:string)=> { setFileLinks(fileLinks.filter(f=>f.id!==id)); supabase.from('file_links').delete().eq('id',id); }} currentUser={currentUser} /></AccessGuard>} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (up:any)=>{ const { error } = await supabase.from('users').update(up).eq('id', currentUser.id); if (error) addNotification("Erreur", error.message, "urgent"); else setCurrentUser({...currentUser, ...up}); }} />} />
          <Route path="/reports" element={<AccessGuard currentUser={currentUser} permission="canViewReports"><Reports tasks={tasks} leads={leads} messages={messages} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} /></AccessGuard>} />
          <Route path="/clients" element={<AccessGuard currentUser={currentUser} permission="canManageClients"><Clients clients={clients} tasks={tasks} projects={projects} onAddClient={(c:any)=> { supabase.from('clients').insert({id:generateUUID(), ...c}).select().single().then(({data})=>{if(data) setClients([data,...clients])}); }} onUpdateClient={async (updated: Client) => { const { error } = await supabase.from('clients').update(updated).eq('id', updated.id); if (error) addNotification("Erreur", error.message, "urgent"); else { setClients(clients.map(c => c.id === updated.id ? updated : c)); addNotification("CRM", `Fiche ${updated.name} mise à jour.`, "success"); } }} onDeleteClient={(id:string)=> { setClients(clients.filter(c=>c.id!==id)); supabase.from('clients').delete().eq('id',id); }} currentUser={currentUser} /></AccessGuard>} />
          <Route path="/calendar" element={<Calendar tasks={tasks} onAddTask={(t:any)=> { const newTask = {...t, id:generateUUID(), created_at: new Date().toISOString()}; supabase.from('tasks').insert({id:newTask.id, title:t.title, description:t.description, assignee_id:t.assigneeId, client_id:t.clientId, project_id:t.projectId, due_date:t.dueDate, status:t.status, type:t.type, priority:t.priority}).then(()=>setTasks([mapFromDB('tasks', newTask), ...tasks])); }} onUpdateStatus={(id:string,st:any)=> { supabase.from('tasks').update({status:st}).eq('id',id).then(()=>setTasks(tasks.map(t=>t.id===id?{...t,status:st}:t))); }} currentUser={currentUser} users={users} clients={clients} projects={projects} />} />
          <Route path="/leads" element={<AccessGuard currentUser={currentUser} permission="canManageLeads"><Leads leads={leads} onAddLead={(l:any)=> { supabase.from('leads').insert({id:generateUUID(), ...l, value_min:l.valueMin, value_max:l.valueMax}).select().single().then(({data})=>{if(data) setLeads([mapFromDB('leads',data),...leads])}); }} onUpdateLead={(l:any)=> { supabase.from('leads').update({...l, value_min:l.valueMin, value_max:l.valueMax}).eq('id',l.id).then(()=>setLeads(leads.map(ld=>ld.id===l.id?{...ld,...l}:ld))); }} onDeleteLead={(id:string)=> { setLeads(leads.filter(l=>l.id!==id)); supabase.from('leads').delete().eq('id',id); }} onConvertToClient={(l:any)=> { supabase.from('clients').insert({id:generateUUID(), name:l.name, company:l.company, email:l.email, phone:l.phone}).select().single().then(({data})=>{ if(data) { setClients([data,...clients]); setLeads(leads.filter(ld=>ld.id!==l.id)); supabase.from('leads').delete().eq('id',l.id); addNotification("CRM", "Prospect converti.", "success"); } }); }} currentUser={currentUser} addNotification={addNotification} /></AccessGuard>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
