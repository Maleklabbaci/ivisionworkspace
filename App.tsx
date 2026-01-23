
import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
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
    mapped.createdAt = item.created_at;
  } else if (table === 'users') {
    mapped.permissions = parsePermissions(item.permissions);
    mapped.muteChatNotifications = !!item.mute_chat_notifications;
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
  
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3');
    notificationSound.current.load();
  }, []);

  const addNotification = useCallback((title: string, message: any, type: 'info' | 'success' | 'urgent' = 'info') => {
    let displayMessage = typeof message === 'string' ? message : (message?.message || JSON.stringify(message));
    const id = generateUUID();
    setNotifications(prev => [...prev, { id, title, message: displayMessage, type }]);
  }, []);

  const playSound = useCallback(() => {
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(e => console.log("Audio play blocked", e));
    }
  }, []);

  // REALTIME HUB
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('ivision-realtime-hub')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        const newMessage = mapFromDB('messages', payload.new);
        setMessages(prev => (prev.find(m => m.id === newMessage.id) ? prev : [...prev, newMessage]));
        if (newMessage.userId !== currentUser.id) {
          const mentionTag = `@${currentUser.name.toLowerCase().replace(/\s+/g, '')}`;
          const isMention = newMessage.content.toLowerCase().includes(mentionTag);
          if (!currentUser.muteChatNotifications || isMention) {
            const sender = users.find(u => u.id === newMessage.userId);
            addNotification(isMention ? "Mention iV Prioritaire" : "Nouveau Message iV", `${sender?.name || 'Un membre'}: ${newMessage.content.substring(0, 50)}...`, isMention ? "urgent" : "info");
            playSound();
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', table: 'messages' }, (payload) => {
        const updatedMessage = mapFromDB('messages', payload.new);
        setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
      })
      .on('postgres_changes', { event: 'DELETE', table: 'messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        } else {
          const mappedTask = mapFromDB('tasks', payload.new);
          setTasks(prev => {
            const exists = prev.find(t => t.id === mappedTask.id);
            if (exists) return prev.map(t => t.id === mappedTask.id ? mappedTask : t);
            return [mappedTask, ...prev];
          });
          if (mappedTask.status === TaskStatus.BLOCKED && (payload.eventType === 'INSERT' || (payload.old && payload.old.status !== TaskStatus.BLOCKED))) {
            addNotification("SYSTÈME BLOQUÉ", `La mission "${mappedTask.title}" est bloquée !`, "urgent");
            playSound();
          }
        }
      })
      .on('postgres_changes', { event: '*', table: 'channels' }, (payload) => {
        if (payload.eventType === 'INSERT') setChannels(prev => [...prev, mapFromDB('channels', payload.new)]);
        else if (payload.eventType === 'UPDATE') setChannels(prev => prev.map(c => c.id === payload.new.id ? mapFromDB('channels', payload.new) : c));
        else if (payload.eventType === 'DELETE') setChannels(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, users, addNotification, playSound]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => { setIsOffline(true); addNotification("Mode iV Hors Ligne", "Connexion réseau perdue.", "urgent"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [addNotification]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) { addNotification("Erreur", "Connexion iVISION requise.", "urgent"); return; }
    setIsAuthProcessing(true);
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email: email.toLowerCase().trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
      if (error) throw error;
      if (isSignUp) addNotification("Indexation iV", "Accès en attente.", "success");
    } catch (error: any) { addNotification("Alerte Sécurité", error.message, "urgent"); }
    finally { setIsAuthProcessing(false); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session?.user) fetchUserData(session.user); else setLoading(false); });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { if (session?.user) fetchUserData(session.user); else { setCurrentUser(null); setLoading(false); } });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authUser: any) => {
    try {
      let { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
      if (userData) setCurrentUser(mapFromDB('users', userData));
      const [u, t, c, l, ch, m, f, pr, sl, ex, ad] = await Promise.all([
        safeFetch(supabase.from('users').select('*'), []),
        safeFetch(supabase.from('tasks').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('clients').select('*'), []),
        safeFetch(supabase.from('leads').select('*'), []),
        safeFetch(supabase.from('channels').select('*'), []),
        safeFetch(supabase.from('messages').select('*').order('created_at', { ascending: true }), []),
        safeFetch(supabase.from('file_links').select('*'), []),
        safeFetch(supabase.from('projects').select('*'), []),
        safeFetch(supabase.from('salaries').select('*'), []),
        safeFetch(supabase.from('expenses').select('*'), []),
        safeFetch(supabase.from('ad_campaigns').select('*'), [])
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
    } finally { setLoading(false); }
  };

  const handleUpdateTaskStatus = async (id: string, st: TaskStatus) => {
    const { error } = await supabase.from('tasks').update({ status: st }).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, status: st } : t));
  };

  const handleUpdateTaskPriority = async (id: string, priority: 'low' | 'medium' | 'high') => {
    const { error } = await supabase.from('tasks').update({ priority }).eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
      addNotification("Priorité iV", "Niveau de priorité modifié.", "info");
    }
  };

  const handleSendMessage = async (content: string, channelId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('messages').insert({ user_id: currentUser.id, channel_id: channelId, content, read_by: [currentUser.id] });
    if (error) addNotification("Erreur", error.message, "urgent");
  };

  if (loading) return <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-sky-400 mb-4" size={48} /><p className="text-slate-500 font-bold uppercase text-[11px]">INITIALISATION iVISION...</p></div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {isOffline && <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase py-2 text-center z-[10000]">HORS LIGNE</div>}
        {!currentUser ? <AuthUI handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} isSignUp={isSignUp} setIsSignUp={setIsSignUp} /> : (
          <AppContent 
            currentUser={currentUser} users={users} tasks={tasks} clients={clients} leads={leads} channels={channels} messages={messages} fileLinks={fileLinks} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} notifications={notifications} 
            handleSendMessage={handleSendMessage} handleMarkAsRead={async (ids: string[]) => { for (const id of ids) await supabase.from('messages').update({ read_by: [...(messages.find(m => m.id === id)?.readBy || []), currentUser.id] }).eq('id', id); }} 
            handleDeleteMessage={async (id: string) => { await supabase.from('messages').delete().eq('id', id); }}
            onUpdateTaskStatus={handleUpdateTaskStatus} onUpdateTaskPriority={handleUpdateTaskPriority} onUpdateProfile={async (up: any) => { await supabase.from('users').update(up).eq('id', currentUser.id); setCurrentUser(prev => prev ? { ...prev, ...up } : null); }}
            setLeads={setLeads} setClients={setClients} setProjects={setProjects} setTasks={setTasks} setChannels={setChannels} setSalaries={setSalaries} setExpenses={setExpenses} setAdCampaigns={setAdCampaigns} setUsers={setUsers} addNotification={addNotification} setCurrentUser={setCurrentUser}
          />
        )}
        <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      </div>
    </HashRouter>
  );
};

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing, isSignUp, setIsSignUp }: any) => (
  <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-slide-up relative">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-950 mb-6"><Fingerprint size={40} /></div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">iVISION</h1>
      </div>
      <form onSubmit={handleAuth} className="space-y-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@agence.com" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-400" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-400" />
        <button type="submit" disabled={isAuthProcessing} className="w-full py-6 bg-white text-slate-950 font-black rounded-2xl uppercase text-xs active-scale shadow-xl mt-4">{isAuthProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isSignUp ? "DÉPLOYER" : "DÉVERROUILLER")}</button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-slate-500 text-[11px] uppercase font-bold hover:text-white transition-all pt-4">{isSignUp ? "Connexion" : "Demander accès"}</button>
      </form>
    </div>
  </div>
);

const AppContent: React.FC<any> = ({ currentUser, users, tasks, clients, leads, channels, messages, fileLinks, projects, salaries, expenses, adCampaigns, notifications, handleSendMessage, handleMarkAsRead, handleDeleteMessage, onUpdateTaskStatus, onUpdateTaskPriority, onUpdateProfile, setLeads, setClients, setProjects, setTasks, setChannels, setSalaries, setExpenses, setAdCampaigns, setUsers, addNotification, setCurrentUser }) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  useEffect(() => { if (channels.length > 0 && !currentChannelId) setCurrentChannelId(channels[0].id); }, [channels, currentChannelId]);
  
  const handleUpdateTask = async (t: any) => {
    const dbTask = {
      title: t.title,
      description: t.description,
      assignee_id: t.assigneeId,
      client_id: t.clientId,
      project_id: t.projectId,
      due_date: t.dueDate,
      status: t.status,
      type: t.type,
      priority: t.priority
    };
    const { error } = await supabase.from('tasks').update(dbTask).eq('id', t.id);
    if (error) addNotification("Erreur Mission", error.message, "urgent");
  };

  const handleBulkUpdateTasks = async (ids: string[], updates: any) => {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.assigneeId) dbUpdates.assignee_id = updates.assigneeId;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.projectId) dbUpdates.project_id = updates.projectId;
    if (updates.clientId) dbUpdates.client_id = updates.clientId;

    const { error } = await supabase.from('tasks').update(dbUpdates).in('id', ids);
    if (error) addNotification("Erreur Bulk", error.message, "urgent");
    else addNotification("Succès Bulk", `${ids.length} missions mises à jour.`, "success");
  };

  return (
    <Layout currentUser={currentUser} onLogout={async () => { await supabase.auth.signOut(); setCurrentUser(null); navigate('/'); }} messages={messages}>
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} clients={clients} onNavigate={(v:ViewState)=>navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} projects={projects} currentUser={currentUser} onUpdateStatus={onUpdateTaskStatus} onAddTask={async (t:any)=> { const dbTask = { ...t, id: generateUUID(), assignee_id: t.assigneeId, client_id: t.clientId, project_id: t.projectId, due_date: t.dueDate }; delete dbTask.assigneeId; delete dbTask.clientId; delete dbTask.projectId; delete dbTask.dueDate; await supabase.from('tasks').insert(dbTask); }} onUpdateTask={handleUpdateTask} onBulkUpdateTasks={handleBulkUpdateTasks} onDeleteTask={async (id:string)=> { await supabase.from('tasks').delete().eq('id',id); }} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} tasks={tasks} channels={channels} projects={projects} currentChannelId={currentChannelId} messages={messages} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkAsRead} onDeleteMessage={handleDeleteMessage} onUpdateTaskStatus={onUpdateTaskStatus} onUpdateTaskPriority={onUpdateTaskPriority} onAddChannel={async (ch:any)=> { if(ch.id) await supabase.from('channels').update({name: ch.name, is_private: ch.is_private, member_ids: ch.member_ids}).eq('id', ch.id); else await supabase.from('channels').insert(ch); }} onDeleteChannel={async (id:string)=> { await supabase.from('channels').delete().eq('id',id); }} onUpdateChannelMembers={async (id:string,m:string[])=> { await supabase.from('channels').update({member_ids:m}).eq('id',id); }} />} />
          <Route path="/finance" element={<Finances salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} users={users} projects={projects} currentUser={currentUser} onAddSalary={async (s:any)=>await supabase.from('salaries').insert(s)} onAddExpense={async (ex:any)=>await supabase.from('expenses').insert(ex)} onAddAdCampaign={async (ad:any)=>await supabase.from('ad_campaigns').insert(ad)} onUpdateSalary={async (s:any)=>await supabase.from('salaries').update(s).eq('id',s.id)} onDeleteSalary={async (id:string)=>await supabase.from('salaries').delete().eq('id',id)} onDeleteExpense={async (id:string)=>await supabase.from('expenses').delete().eq('id',id)} onDeleteAdCampaign={async (id:string)=>await supabase.from('ad_campaigns').delete().eq('id',id)} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} onAddUser={async (u:any)=> { const { data } = await supabase.auth.signUp({ email: u.email, password: u.password }); if (data.user) await supabase.from('users').insert({ id: data.user.id, ...u }); }} onRemoveUser={async (id:string)=>await supabase.rpc('delete_user_completely', { target_user_id: id })} onUpdateMember={async (id:string, up:any) => await supabase.from('users').update(up).eq('id',id)} />} />
          <Route path="/projects" element={<Projects projects={projects} users={users} clients={clients} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} onAddProject={async (p:any)=>await supabase.from('projects').insert(p)} onDeleteProject={async (id:string)=>await supabase.from('projects').delete().eq('id',id)} onUpdateProject={async (p:Project, batches?: any[])=>await supabase.from('projects').update(p).eq('id', p.id)} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={async (l:any)=>await supabase.from('leads').insert(l)} onUpdateLead={async (l:any)=>await supabase.from('leads').update(l).eq('id', l.id)} onDeleteLead={async (id:string)=>await supabase.from('leads').delete().eq('id',id)} onConvertToClient={async (l:Lead)=>{ const { data } = await supabase.from('clients').insert(l).select().single(); if(data) await supabase.from('leads').delete().eq('id', l.id); }} currentUser={currentUser} addNotification={addNotification} />} />
          <Route path="/files" element={<Files fileLinks={fileLinks} onAddFileLink={async (n:string,u:string)=>await supabase.from('file_links').insert({name:n, url:u, created_by:currentUser.id})} onDeleteFileLink={async (id:string)=>await supabase.from('file_links').delete().eq('id',id)} currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={onUpdateProfile} />} />
          <Route path="/reports" element={<Reports tasks={tasks} leads={leads} messages={messages} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} users={users} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} projects={projects} onAddClient={async (c:any)=>await supabase.from('clients').insert(c)} onUpdateClient={async (up:Client)=>await supabase.from('clients').update(up).eq('id', up.id)} onDeleteClient={async (id:string)=>await supabase.from('clients').delete().eq('id',id)} currentUser={currentUser} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} onAddTask={async (t:any)=>await supabase.from('tasks').insert(t)} onUpdateStatus={onUpdateTaskStatus} currentUser={currentUser} users={users} clients={clients} projects={projects} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
