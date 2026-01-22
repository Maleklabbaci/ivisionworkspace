
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
    mapped.readBy = item.read_by || [];
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
      addNotification("Mode Hors Ligne", "Connexion réseau perdue.", "urgent");
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
        const { error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (authError) throw authError;
        addNotification("Compte Créé", "Accès en attente de validation ou confirmation e-mail.", "success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error("L'accès n'est pas encore activé. L'email doit être confirmé dans Supabase.");
          }
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            throw new Error("Email ou code secret incorrect.");
          }
          throw error;
        }
      }
    } catch (error: any) {
      addNotification("Sécurité iVISION", error.message || "Échec de l'authentification.", "urgent");
    } finally {
      setIsAuthProcessing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserData(session.user);
      else setLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserData(session.user);
      else { setCurrentUser(null); setLoading(false); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authUser: any) => {
    try {
      const userId = authUser.id;
      let { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      if (!userData && !userError) {
        const defaultProfile = {
          id: userId,
          email: authUser.email,
          name: authUser.email.split('@')[0],
          role: UserRole.MEMBER,
          status: 'active',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.email.split('@')[0])}&background=020617&color=fff`,
          permissions: { canCreateTasks: true, canManageChat: true, canViewFiles: true }
        };
        const { data: inserted, error: insertError } = await supabase.from('users').insert(defaultProfile).select().single();
        if (!insertError) userData = inserted;
      }

      if (userData) {
        setCurrentUser(mapFromDB('users', userData));
      }
      
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
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, channelId: string) => {
    if (!currentUser) return;

    const mentions = content.match(/@(\w+)/g);
    const lowercaseContent = content.toLowerCase();

    if (mentions) {
      for (const mention of mentions) {
        const namePart = mention.substring(1).toLowerCase();

        // 1. Mentions Utilisateurs : Uniquement au destinataire
        const mentionedUser = users.find(u => u.name.toLowerCase().replace(/\s+/g, '') === namePart);
        if (mentionedUser && mentionedUser.id !== currentUser.id) {
          // Simulation notification ciblée
          console.log(`Notification push envoyée à : ${mentionedUser.name}`);
        }

        // 2. Mentions Missions & Actions Auto
        const mentionedTask = tasks.find(t => t.title.toLowerCase().replace(/\s+/g, '') === namePart);
        if (mentionedTask) {
          let newStatus: TaskStatus | null = null;
          let isProblem = false;
          
          if (lowercaseContent.includes('terminé') || lowercaseContent.includes('fini') || lowercaseContent.includes('ok')) {
            newStatus = TaskStatus.DONE;
          } else if (lowercaseContent.includes('bloqué') || lowercaseContent.includes('problème') || lowercaseContent.includes('bloque')) {
            newStatus = TaskStatus.BLOCKED;
            isProblem = true;
          } else if (lowercaseContent.includes('à faire') || lowercaseContent.includes('pas fini')) {
            newStatus = TaskStatus.TODO;
          } else if (lowercaseContent.includes('en cours')) {
            newStatus = TaskStatus.IN_PROGRESS;
          }

          if (newStatus) {
            const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', mentionedTask.id);
            if (!error) {
              setTasks(prev => prev.map(t => t.id === mentionedTask.id ? { ...t, status: newStatus! } : t));
              
              if (isProblem) {
                // Alerte Admin et Chef de Projet uniquement si problème
                const managers = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.PROJECT_MANAGER);
                managers.forEach(m => {
                   if (m.id !== currentUser.id) console.log(`ALERTE : Problème signalé par ${currentUser.name} sur ${mentionedTask.title}`);
                });
                addNotification("Alerte Responsables", `Le blocage de "${mentionedTask.title}" a été signalé à l'administration.`, "urgent");
              } else {
                addNotification("Auto-Update", `Mission "${mentionedTask.title}" -> ${newStatus}`, "success");
              }
            }
          }
        }
      }
    }

    const { data, error } = await supabase.from('messages').insert({
      content,
      channel_id: channelId,
      user_id: currentUser.id,
      read_by: [currentUser.id]
    }).select().single();

    if (!error && data) {
      setMessages(prev => [...prev, mapFromDB('messages', data)]);
    }
  };

  const handleMarkAsRead = async (messageIds: string[]) => {
    if (!currentUser || messageIds.length === 0) return;
    for (const id of messageIds) {
      const msg = messages.find(m => m.id === id);
      if (msg && !msg.readBy.includes(currentUser.id)) {
        const updatedReadBy = [...msg.readBy, currentUser.id];
        await supabase.from('messages').update({ read_by: updatedReadBy }).eq('id', id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, readBy: updatedReadBy } : m));
      }
    }
  };

  // FIX: Correction des insertions Finance (mappage userId -> user_id, projectId -> project_id)
  const handleAddSalary = async (s: any) => {
    const dbSalary = {
      user_id: s.userId,
      project_id: s.projectId || null,
      amount: s.amount,
      bonus: s.bonus || 0,
      frequency: s.frequency,
      status: s.status
    };
    const { data, error } = await supabase.from('salaries').insert(dbSalary).select();
    if (!error && data) {
      setSalaries(prev => [mapFromDB('salaries', data[0]), ...prev]);
      addNotification("Finance", "Flux salarial indexé.", "success");
    } else {
      addNotification("Erreur Finance", error?.message || "Échec de l'insertion.", "urgent");
    }
  };

  const handleAddExpense = async (ex: any) => {
    const dbExpense = {
      name: ex.name,
      amount: ex.amount,
      type: ex.type,
      project_id: ex.projectId || null,
      status: ex.status
    };
    const { data, error } = await supabase.from('expenses').insert(dbExpense).select();
    if (!error && data) {
      setExpenses(prev => [mapFromDB('expenses', data[0]), ...prev]);
      addNotification("Finance", "Dépense enregistrée.", "success");
    } else {
      addNotification("Erreur Finance", error?.message || "Échec de l'insertion.", "urgent");
    }
  };

  const handleAddAdCampaign = async (ad: any) => {
    const dbAd = {
      name: ad.name,
      amount: ad.amount,
      platform: ad.platform,
      project_id: ad.projectId || null,
      status: ad.status
    };
    const { data, error } = await supabase.from('ad_campaigns').insert(dbAd).select();
    if (!error && data) {
      setAdCampaigns(prev => [mapFromDB('ad_campaigns', data[0]), ...prev]);
      addNotification("Finance", "Budget ADS indexé.", "success");
    } else {
      addNotification("Erreur Finance", error?.message || "Échec de l'insertion.", "urgent");
    }
  };

  if (loading) return <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-sky-400 mb-4" size={48} /><p className="text-slate-500 font-bold uppercase text-[11px]">Initialisation iVISION...</p></div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {isOffline && <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase py-2 text-center z-[10000]">MODE HORS LIGNE</div>}
        {!currentUser ? <AuthUI handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} isSignUp={isSignUp} setIsSignUp={setIsSignUp} /> : (
          <AppContent 
            currentUser={currentUser} setCurrentUser={setCurrentUser} users={users} setUsers={setUsers} tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} leads={leads} setLeads={setLeads} channels={channels} setChannels={setChannels} messages={messages} setMessages={setMessages} fileLinks={fileLinks} setFileLinks={setFileLinks} projects={projects} setProjects={setProjects} salaries={salaries} setSalaries={setSalaries} expenses={expenses} setExpenses={setExpenses} adCampaigns={adCampaigns} setAdCampaigns={setAdCampaigns} notifications={notifications} addNotification={addNotification} handleSendMessage={handleSendMessage} handleMarkAsRead={handleMarkAsRead} onAddSalary={handleAddSalary} onAddExpense={handleAddExpense} onAddAdCampaign={handleAddAdCampaign}
          />
        )}
        <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      </div>
    </HashRouter>
  );
};

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing, isSignUp, setIsSignUp }: any) => (
  <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6">
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 blur-[120px] rounded-full"></div>
    </div>
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl animate-slide-up relative">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-950 mb-6 shadow-xl"><Fingerprint size={40} /></div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">iVISION</h1>
        <p className="text-sky-400 font-bold text-[10px] uppercase mt-3 tracking-widest">Protocol de Sécurité</p>
      </div>
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-1.5">
          <label className="label-iv">Email iV</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@agence.com" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-400 transition-all font-medium" />
        </div>
        <div className="space-y-1.5">
          <label className="label-iv">Code d'accès</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-400 transition-all font-medium" />
        </div>
        <button type="submit" disabled={isAuthProcessing} className="w-full py-6 bg-white text-slate-950 font-black rounded-2xl uppercase text-xs hover:bg-sky-400 hover:text-white transition-all active-scale shadow-xl mt-4">
          {isAuthProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isSignUp ? "DÉPLOYER L'ACCÈS" : "DÉVERROUILLER")}
        </button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-slate-500 text-[11px] uppercase font-bold hover:text-white transition-all pt-4">
          {isSignUp ? "Déjà un accès ? Connexion" : "Demander un accès agence"}
        </button>
      </form>
    </div>
  </div>
);

const AppContent: React.FC<any> = ({ currentUser, users, tasks, setTasks, clients, setClients, leads, setLeads, channels, setChannels, messages, setMessages, fileLinks, setFileLinks, projects, setProjects, salaries, setSalaries, expenses, setExpenses, adCampaigns, setAdCampaigns, setUsers, notifications, addNotification, setCurrentUser, handleSendMessage, handleMarkAsRead, onAddSalary, onAddExpense, onAddAdCampaign }) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  useEffect(() => { if (channels.length > 0 && !currentChannelId) setCurrentChannelId(channels[0].id); }, [channels, currentChannelId]);
  const handleLogout = async () => { await supabase.auth.signOut(); setCurrentUser(null); navigate('/'); };

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} clients={clients} onNavigate={(v:ViewState)=>navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} projects={projects} currentUser={currentUser} onUpdateStatus={async (id:string,st:any)=> { 
            const { error } = await supabase.from('tasks').update({status:st}).eq('id',id);
            if (!error) setTasks(prev => prev.map(t=>t.id===id?{...t,status:st}:t));
          }} onBatchUpdateTasks={async (ids:string[], up:any) => {
            const { error } = await supabase.from('tasks').update(up).in('id', ids);
            if (!error) setTasks(prev => prev.map(t => ids.includes(t.id) ? {...t, ...up} : t));
          }} onAddTask={async (t:any)=> { 
            const newTask = {...t, id:generateUUID()}; 
            const { error } = await supabase.from('tasks').insert({id:newTask.id, ...t});
            if (!error) setTasks(prev => [mapFromDB('tasks', newTask), ...prev]);
          }} onDeleteTask={async (id:string)=> { 
            const { error } = await supabase.from('tasks').delete().eq('id',id); 
            if (!error) setTasks(prev => prev.filter(t=>t.id!==id));
          }} />} />
          <Route path="/projects" element={<Projects projects={projects} users={users} clients={clients} currentUser={currentUser} onAddProject={async (p:any, configs:any[])=>{
            const { data, error } = await supabase.from('projects').insert(p).select();
            if (!error && data) {
              setProjects(prev => [mapFromDB('projects', data[0]), ...prev]);
            }
          }} onDeleteProject={async (id:string)=> { 
            const { error } = await supabase.from('projects').delete().eq('id',id); 
            if (!error) setProjects(prev => prev.filter(p=>p.id!==id)); 
          }} onUpdateProject={async (p:Project) => {
            const { error } = await supabase.from('projects').update({ name: p.name, description: p.description, total_budget: p.totalBudget, status: p.status, client_id: p.clientId }).eq('id', p.id);
            if (!error) {
              setProjects(prev => prev.map(pr => pr.id === p.id ? p : pr));
            }
          }} />} />
          <Route path="/finance" element={<Finances salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} users={users} projects={projects} currentUser={currentUser} onAddSalary={onAddSalary} onDeleteSalary={async (id:string)=> { 
            const { error } = await supabase.from('salaries').delete().eq('id',id); 
            if (!error) setSalaries(prev => prev.filter(s=>s.id!==id)); 
          }} onUpdateSalary={async (s:SalaryRecord)=>{ 
            const { error } = await supabase.from('salaries').update({status: s.status, bonus: s.bonus, amount: s.amount}).eq('id',s.id);
            if (!error) setSalaries(prev => prev.map(sl=>sl.id===s.id?s:sl));
          }} onAddExpense={onAddExpense} onDeleteExpense={async (id:string)=> { 
            const { error } = await supabase.from('expenses').delete().eq('id',id); 
            if (!error) setExpenses(prev => prev.filter(e=>e.id!==id)); 
          }} onAddAdCampaign={onAddAdCampaign} onDeleteAdCampaign={async (id:string)=> { 
            const { error } = await supabase.from('ad_campaigns').delete().eq('id',id); 
            if (!error) setAdCampaigns(prev => prev.filter(a=>a.id!==id)); 
          }} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} tasks={tasks} channels={channels} currentChannelId={currentChannelId} messages={messages} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkAsRead} onAddChannel={async (ch:any)=> { const { data, error } = await supabase.from('channels').insert(ch).select(); if (!error && data) setChannels(prev => [...prev, mapFromDB('channels', data[0])]); }} onDeleteChannel={async (id:string)=> { const { error } = await supabase.from('channels').delete().eq('id',id); if (!error) setChannels(prev => prev.filter(c=>c.id!==id)); }} onUpdateChannelMembers={async (id:string,m:string[])=> { const { error } = await supabase.from('channels').update({member_ids:m}).eq('id',id); if(!error) setChannels(prev => prev.map(c=>c.id===id?{...c, member_ids:m}:c)); }} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} onAddUser={async (u:any)=> { 
            const normalizedEmail = u.email.toLowerCase().trim(); 
            const { data: existingUser } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
            if (existingUser) {
              addNotification("Erreur", "Ce membre est déjà présent dans la base de données.", "urgent");
              return;
            }
            const { data: authData, error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password: u.password }); 
            if (authError) {
              addNotification("Erreur", authError.message, "urgent");
              return;
            }
            if (authData.user) {
              const { error: userError } = await supabase.from('users').insert({ 
                id: authData.user.id, 
                email: normalizedEmail, 
                name: u.name, 
                role: u.role, 
                permissions: u.permissions, 
                status: 'active', 
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=020617&color=fff` 
              });
              if (userError) {
                addNotification("Erreur Profil", userError.message, "urgent");
              } else {
                addNotification("Succès", `Accès iVISION déployé pour ${u.name}.`, "success");
                const u_list = await safeFetch(supabase.from('users').select('*'), []);
                setUsers(u_list.map(i => mapFromDB('users', i)));
              }
            }
          }} onRemoveUser={async (id:string)=> { 
            const { error } = await supabase.rpc('delete_user_completely', { target_user_id: id });
            if (error) {
              await supabase.from('users').delete().eq('id', id);
              setUsers(prev => prev.filter(u=>u.id!==id));
            } else {
              setUsers(prev => prev.filter(u=>u.id!==id)); 
              addNotification("Système", "Accès révoqué et e-mail libéré dans Supabase Auth.", "success");
              if (id === currentUser.id) handleLogout();
            }
          }} onUpdateMember={async (id:string, up:any) => { const { error } = await supabase.from('users').update({ name: up.name, role: up.role, permissions: up.permissions }).eq('id',id); if (!error) setUsers(prev => prev.map(u => u.id === id ? {...u, ...up} : u)); }} />} />
          <Route path="/files" element={<Files fileLinks={fileLinks} onAddFileLink={(n:string,u:string)=> { supabase.from('file_links').insert({name:n, url:u, created_by:currentUser.id}).select().single().then(({data})=>{if(data) setFileLinks(prev => [mapFromDB('file_links',data),...prev])}); }} onDeleteFileLink={async (id:string)=> { const { error } = await supabase.from('file_links').delete().eq('id',id); if (!error) setFileLinks(prev => prev.filter(f=>f.id!==id)); }} currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (up:any)=>{ const { error } = await supabase.from('users').update(up).eq('id', currentUser.id); if (!error) setCurrentUser({...currentUser, ...up}); }} />} />
          <Route path="/reports" element={<Reports tasks={tasks} leads={leads} messages={messages} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} projects={projects} onAddClient={async (c:any)=> { const { error, data } = await supabase.from('clients').insert(c).select(); if (!error && data) setClients(prev => [data[0], ...prev]); }} onUpdateClient={async (up:Client) => { const { error } = await supabase.from('clients').update(up).eq('id', up.id); if (!error) setClients(prev => prev.map(c => c.id === up.id ? up : c)); }} onDeleteClient={async (id:string)=> { const { error } = await supabase.from('clients').delete().eq('id',id); if (!error) setFileLinks(prev => prev.filter(c=>c.id!==id)); }} currentUser={currentUser} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} onAddTask={async (t:any)=> { const { data, error } = await supabase.from('tasks').insert(t).select(); if (!error && data) setTasks(prev => [mapFromDB('tasks', data[0]), ...prev]); }} onUpdateStatus={async (id:string,st:any)=> { const { error } = await supabase.from('tasks').update({status:st}).eq('id',id); if (!error) setTasks(prev => prev.map(t=>t.id===id?{...t,status:st}:t)); }} currentUser={currentUser} users={users} clients={clients} projects={projects} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={async (l:any)=> { const { error, data } = await supabase.from('leads').insert(l).select(); if (!error && data) setLeads(prev => [mapFromDB('leads', data[0]), ...prev]); }} onUpdateLead={async (l:any)=> { const { error } = await supabase.from('leads').update(l).eq('id', l.id); if (!error) setLeads(prev => prev.filter(ld => ld.id === l.id ? l : ld)); }} onDeleteLead={async (id:string)=> { const { error } = await supabase.from('leads').delete().eq('id',id); if (!error) setLeads(prev => prev.filter(l=>l.id!==id)); }} onConvertToClient={async (l:any)=> { const { error, data } = await supabase.from('clients').insert({name:l.name, company:l.company, email:l.email, phone:l.phone}).select(); if(!error && data) { setClients(prev => [data[0], ...prev]); setLeads(prev => prev.filter(ld=>ld.id!==l.id)); await supabase.from('leads').delete().eq('id',l.id); } }} currentUser={currentUser} addNotification={addNotification} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
