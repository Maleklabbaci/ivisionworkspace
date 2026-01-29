
import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { supabase, safeFetch } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, UserPermissions, ViewState, Project, SalaryRecord, Expense, AdCampaignExpense } from './types';
import { Loader2, Fingerprint } from 'lucide-react';

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
    mapped.timestamp = item.created_at ? new Date(item.created_at).toLocaleTimeString() : '';
    mapped.fullTimestamp = item.created_at;
    mapped.readBy = item.read_by || [];
  } else if (table === 'projects') {
    mapped.totalBudget = item.total_budget || 0;
    mapped.spentBudget = item.spent_budget || 0;
    mapped.clientId = item.client_id;
    mapped.createdAt = item.created_at;
    mapped.billingType = item.billing_type || 'monthly';
  } else if (table === 'salaries') {
    mapped.userId = item.user_id;
    mapped.projectId = item.project_id;
    mapped.lastPaidDate = item.last_paid_date;
    mapped.createdAt = item.created_at;
  } else if (table === 'expenses') {
    mapped.projectId = item.project_id;
    mapped.createdAt = item.created_at;
  } else if (table === 'ad_campaigns') {
    mapped.projectId = item.project_id;
    mapped.clientId = item.client_id;
    mapped.assigneeId = item.assignee_id;
    mapped.taskId = item.task_id;
    mapped.durationDays = item.duration_days;
    mapped.startDate = item.start_date;
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

  const addNotification = useCallback((title: string, message: any, type: 'info' | 'success' | 'urgent' = 'info') => {
    const displayMessage = typeof message === 'string' ? message : (message?.message || "Action effectuée");
    setNotifications(prev => [...prev, { id: generateUUID(), title, message: displayMessage, type }]);
  }, []);

  const fetchUserData = async (authUser: any) => {
    if (!authUser) {
      setLoading(false);
      return;
    }
    
    try {
      let { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
      
      if (!userData && !userError) {
        const newProfile = {
          id: authUser.id,
          name: authUser.email.split('@')[0].toUpperCase(),
          email: authUser.email,
          role: UserRole.MEMBER,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.id}`,
          status: 'active',
          notificationPref: 'push'
        };
        const { data: createdUser, error: insertError } = await supabase.from('users').insert(newProfile).select().single();
        if (insertError) throw insertError;
        userData = createdUser;
      }

      if (userData) {
        setCurrentUser(mapFromDB('users', userData));
      }

      const results = await Promise.allSettled([
        safeFetch(supabase.from('users').select('*'), []),
        safeFetch(supabase.from('tasks').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('clients').select('*'), []),
        safeFetch(supabase.from('leads').select('*'), []),
        safeFetch(supabase.from('channels').select('*'), []),
        safeFetch(supabase.from('messages').select('*').order('created_at', { ascending: true }), []),
        safeFetch(supabase.from('file_links').select('*').order('created_at', { ascending: false }), []),
        safeFetch(supabase.from('projects').select('*'), []),
        safeFetch(supabase.from('salaries').select('*'), []),
        safeFetch(supabase.from('expenses').select('*'), []),
        safeFetch(supabase.from('ad_campaigns').select('*'), [])
      ]);

      const data = results.map(res => res.status === 'fulfilled' ? res.value : []);

      setUsers(data[0].map((i:any) => mapFromDB('users', i)));
      setTasks(data[1].map((i:any) => mapFromDB('tasks', i)));
      setClients(data[2]);
      setLeads(data[3].map((i:any) => mapFromDB('leads', i)));
      setChannels(data[4].map((i:any) => mapFromDB('channels', i)));
      setMessages(data[5].map((i:any) => mapFromDB('messages', i)));
      setFileLinks(data[6].map((i:any) => mapFromDB('file_links', i)));
      setProjects(data[7].map((i:any) => mapFromDB('projects', i)));
      setSalaries(data[8].map((i:any) => mapFromDB('salaries', i)));
      setExpenses(data[9].map((i:any) => mapFromDB('expenses', i)));
      setAdCampaigns(data[10].map((i:any) => mapFromDB('ad_campaigns', i)));

    } catch (err: any) {
      console.error("Fetch Error:", err);
      addNotification("Alerte Système", "Erreur lors du chargement des données.", "urgent");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session?.user) fetchUserData(session.user);
        else setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) fetchUserData(session.user);
        else { setCurrentUser(null); setLoading(false); }
      }
    });

    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-sky-400 mb-4" size={48} />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">Initialisation iVISION Core...</p>
    </div>
  );

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {!currentUser ? (
          <AuthUI 
            handleAuth={async (e: any) => {
              e.preventDefault();
              setIsAuthProcessing(true);
              try {
                const { error } = isSignUp 
                  ? await supabase.auth.signUp({ email: email.toLowerCase().trim(), password })
                  : await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
                if (error) throw error;
              } catch (error: any) { 
                addNotification("Sécurité", error.message, "urgent"); 
              } finally { 
                setIsAuthProcessing(false); 
              }
            }} 
            email={email} setEmail={setEmail} 
            password={password} setPassword={setPassword} 
            isAuthProcessing={isAuthProcessing} 
            isSignUp={isSignUp} setIsSignUp={setIsSignUp} 
          />
        ) : (
          <AppContent 
            currentUser={currentUser} users={users} tasks={tasks} clients={clients} leads={leads} channels={channels} messages={messages} fileLinks={fileLinks} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} notifications={notifications} 
            handleSendMessage={async (c:string, ch:string) => { await supabase.from('messages').insert({ user_id: currentUser.id, channel_id: ch, content: c, read_by: [currentUser.id] }); fetchUserData(currentUser); }} 
            handleMarkAsRead={async (ids: string[]) => { for (const id of ids) await supabase.from('messages').update({ read_by: [...(messages.find(m => m.id === id)?.readBy || []), currentUser.id] }).eq('id', id); fetchUserData(currentUser); }} 
            handleDeleteMessage={async (id: string) => { await supabase.from('messages').delete().eq('id', id); fetchUserData(currentUser); }}
            onUpdateTaskStatus={async (id: string, st: TaskStatus) => { 
              const { error } = await supabase.from('tasks').update({ status: st }).eq('id', id); 
              if (!error) {
                // Déclencheur automatique pour les campagnes ADS
                if (st === TaskStatus.DONE) {
                  const currentTaskObj = tasks.find(t => t.id === id);
                  if (currentTaskObj?.type === 'ads') {
                    // Si c'est une mission d'advertising terminée, on lance le sponsoring lié
                    await supabase.from('ad_campaigns')
                      .update({ start_date: new Date().toISOString() })
                      .eq('task_id', id);
                    addNotification("Finance ADS", `Sponsoring activé suite à la validation de la mission "${currentTaskObj.title}".`, "success");
                  }
                }
                fetchUserData(currentUser);
              } else {
                addNotification("Erreur", "Impossible de mettre à jour le statut.", "urgent");
              }
            }} 
            onUpdateTaskPriority={async (id:string, p:any) => { 
              const { error } = await supabase.from('tasks').update({ priority: p }).eq('id', id); 
              if (!error) fetchUserData(currentUser);
            }} 
            onUpdateProfile={async (up: any) => { await supabase.from('users').update(up).eq('id', currentUser.id); fetchUserData(currentUser); }}
            fetchUserData={fetchUserData} addNotification={addNotification} 
            onAddProject={async (p:any, b:any[])=> { 
              const projId = generateUUID();
              const { error: projError } = await supabase.from('projects').insert({
                id: projId, name: p.name, description: p.description || "", 
                total_budget: Number(p.totalBudget) || 0, status: p.status || "active", 
                client_id: p.clientId || null, billing_type: p.billingType || "monthly"
              });
              if (!projError) fetchUserData(currentUser);
              else addNotification("Erreur", projError.message, "urgent");
            }} 
            onConvertToClient={async (l:Lead)=> {
              const cid = generateUUID();
              await supabase.from('clients').insert({id: cid, name: l.name, company: l.company, email: l.email, phone: l.phone, description: l.description});
              await supabase.from('leads').delete().eq('id', l.id);
              fetchUserData(currentUser);
            }}
          />
        )}
        <ToastContainer notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      </div>
    </HashRouter>
  );
};

const AuthUI = ({ handleAuth, email, setEmail, password, setPassword, isAuthProcessing, isSignUp, setIsSignUp }: any) => (
  <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-slide-up relative text-center">
      <div className="flex flex-col items-center mb-12"><div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-950 mb-6"><Fingerprint size={40} /></div><h1 className="text-4xl font-black text-white uppercase tracking-tighter">iVISION</h1></div>
      <form onSubmit={handleAuth} className="space-y-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@agence.com" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-400" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-sky-400" />
        <button type="submit" disabled={isAuthProcessing} className="w-full py-6 bg-white text-slate-950 font-black rounded-2xl uppercase text-xs active-scale shadow-xl mt-4">{isAuthProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isSignUp ? "DÉPLOYER" : "DÉVERROUILLER")}</button>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-slate-500 text-[11px] uppercase font-bold hover:text-white transition-all pt-4">{isSignUp ? "Connexion" : "Demander accès"}</button>
      </form>
    </div>
  </div>
);

const AppContent: React.FC<any> = ({ currentUser, users, tasks, clients, leads, channels, messages, fileLinks, projects, salaries, expenses, adCampaigns, notifications, handleSendMessage, handleMarkAsRead, handleDeleteMessage, onUpdateTaskStatus, onUpdateTaskPriority, onUpdateProfile, fetchUserData, addNotification, onAddProject, onConvertToClient }) => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  useEffect(() => { if (channels.length > 0 && !currentChannelId) setCurrentChannelId(channels[0].id); }, [channels, currentChannelId]);
  
  return (
    <Layout currentUser={currentUser} onLogout={async () => { await supabase.auth.signOut(); navigate('/'); }} messages={messages}>
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} clients={clients} onNavigate={(v:ViewState)=>navigate(`/${v}`)} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} projects={projects} currentUser={currentUser} onUpdateStatus={onUpdateTaskStatus} onAddTask={async (t:any)=> { 
            const { error } = await supabase.from('tasks').insert({ 
              title: t.title, description: t.description, status: t.status, priority: t.priority,
              id: generateUUID(), assignee_id: t.assigneeId, client_id: t.clientId || null, 
              project_id: t.projectId || null, due_date: t.dueDate, type: t.type 
            }); 
            if (!error) fetchUserData(currentUser);
            else addNotification("Erreur", "Impossible de créer la mission.", "urgent");
          }} onUpdateTask={async (t:any)=> { 
            const { error } = await supabase.from('tasks').update({
              title: t.title, description: t.description, status: t.status, priority: t.priority,
              assignee_id: t.assigneeId, client_id: t.clientId || null, 
              project_id: t.projectId || null, due_date: t.dueDate, type: t.type
            }).eq('id', t.id); 
            if (!error) fetchUserData(currentUser);
            else addNotification("Erreur", "Impossible de mettre à jour la mission.", "urgent");
          }} onBulkUpdateTasks={async (ids:string[], up:any)=> { 
            const dbUpdates: any = {};
            if (up.status) dbUpdates.status = up.status;
            if (up.priority) dbUpdates.priority = up.priority;
            if (up.assigneeId) dbUpdates.assignee_id = up.assigneeId;
            if (up.dueDate) dbUpdates.due_date = up.dueDate;
            if (up.type) dbUpdates.type = up.type;
            if (up.projectId) dbUpdates.project_id = up.projectId;
            if (up.clientId) dbUpdates.client_id = up.clientId;

            const { error } = await supabase.from('tasks').update(dbUpdates).in('id', ids); 
            if (!error) fetchUserData(currentUser);
            else addNotification("Erreur", "Échec de la mise à jour groupée.", "urgent");
          }} onDeleteTask={async (id:string)=> { await supabase.from('tasks').delete().eq('id',id); fetchUserData(currentUser); }} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} tasks={tasks} channels={channels} projects={projects} currentChannelId={currentChannelId} messages={messages} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkAsRead} onDeleteMessage={handleDeleteMessage} onUpdateTaskStatus={onUpdateTaskStatus} onUpdateTaskPriority={onUpdateTaskPriority} onAddChannel={async (ch:any)=> { if(ch.id) await supabase.from('channels').update(ch).eq('id', ch.id); else await supabase.from('channels').insert(ch); fetchUserData(currentUser); }} onDeleteChannel={async (id:string)=> { await supabase.from('channels').delete().eq('id',id); fetchUserData(currentUser); }} onUpdateChannelMembers={async (id:string,m:string[])=> { await supabase.from('channels').update({member_ids:m}).eq('id',id); fetchUserData(currentUser); }} />} />
          <Route path="/finance" element={<Finances salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} users={users} projects={projects} clients={clients} tasks={tasks} currentUser={currentUser} onAddSalary={async(s:any)=>{ await supabase.from('salaries').insert({ id: generateUUID(), user_id: s.userId, project_id: s.projectId || null, amount: s.amount, bonus: s.bonus, frequency: s.frequency, status: s.status }); fetchUserData(currentUser); }} onAddExpense={async(ex:any)=>{ await supabase.from('expenses').insert({ id: generateUUID(), name: ex.name, amount: ex.amount, type: ex.type, project_id: ex.projectId || null, status: ex.status, created_at: ex.createdAt }); fetchUserData(currentUser); }} onAddAdCampaign={async(ad:any)=>{ 
            await supabase.from('ad_campaigns').insert({ 
              id: generateUUID(), name: ad.name, amount: ad.amount, platform: ad.platform, 
              project_id: ad.projectId || null, client_id: ad.clientId || null, assignee_id: ad.assigneeId || null,
              task_id: ad.taskId || null, duration_days: ad.durationDays || 30,
              status: ad.status, created_at: ad.createdAt 
            }); 
            fetchUserData(currentUser); 
          }} onUpdateSalary={async(s:any)=>{ await supabase.from('salaries').update({ amount: s.amount, bonus: s.bonus, frequency: s.frequency, status: s.status, project_id: s.projectId || null }).eq('id', s.id); fetchUserData(currentUser); }} onDeleteSalary={async(id:string)=>{ await supabase.from('salaries').delete().eq('id', id); fetchUserData(currentUser); }} onDeleteExpense={async(id:string)=>{ await supabase.from('expenses').delete().eq('id', id); fetchUserData(currentUser); }} onDeleteAdCampaign={async(id:string)=>{ await supabase.from('ad_campaigns').delete().eq('id', id); fetchUserData(currentUser); }} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} onAddUser={async (u:any)=> { const { data } = await supabase.auth.signUp({ email: u.email, password: u.password }); if (data.user) await supabase.from('users').insert({ id: data.user.id, ...u }); fetchUserData(currentUser); }} onRemoveUser={async (id:string)=> { await supabase.rpc('delete_user_completely', { target_user_id: id }); fetchUserData(currentUser); }} onUpdateMember={async (id:string, up:any) => { await supabase.from('users').update(up).eq('id',id); fetchUserData(currentUser); }} />} />
          <Route path="/projects" element={<Projects projects={projects} users={users} clients={clients} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} onAddProject={onAddProject} onDeleteProject={async (id:string)=> { await supabase.from('projects').delete().eq('id',id); fetchUserData(currentUser); }} onUpdateProject={async (p:Project)=> { await supabase.from('projects').update({name: p.name, description: p.description, total_budget: p.totalBudget, status: p.status, client_id: p.clientId || null, billing_type: p.billingType}).eq('id', p.id); fetchUserData(currentUser); }} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={async (l:any)=> { await supabase.from('leads').insert(l); fetchUserData(currentUser); }} onUpdateLead={async (l:any)=> { await supabase.from('leads').update(l).eq('id', l.id); fetchUserData(currentUser); }} onDeleteLead={async (id:string)=> { await supabase.from('leads').delete().eq('id',id); fetchUserData(currentUser); }} onConvertToClient={onConvertToClient} currentUser={currentUser} addNotification={addNotification} />} />
          <Route path="/files" element={<Files fileLinks={fileLinks} clients={clients} onAddFileLink={async (n:string,u:string,c:string)=> { await supabase.from('file_links').insert({name:n, url:u, client_id:c||null, created_by:currentUser.id}); fetchUserData(currentUser); }} onDeleteFileLink={async (id:string)=> { await supabase.from('file_links').delete().eq('id',id); fetchUserData(currentUser); }} currentUser={currentUser} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={onUpdateProfile} />} />
          <Route path="/reports" element={<Reports tasks={tasks} leads={leads} messages={messages} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} currentUser={currentUser} users={users} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} projects={projects} salaries={salaries} expenses={expenses} adCampaigns={adCampaigns} fileLinks={fileLinks} onAddClient={async (c:any)=> { await supabase.from('clients').insert(c); fetchUserData(currentUser); }} onUpdateClient={async (up:Client)=> { await supabase.from('clients').update(up).eq('id', up.id); fetchUserData(currentUser); }} onDeleteClient={async (id:string)=> { await supabase.from('clients').delete().eq('id',id); fetchUserData(currentUser); }} currentUser={currentUser} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} onAddTask={async (t:any)=> { await supabase.from('tasks').insert({ ...t, id: generateUUID(), assignee_id: t.assigneeId, client_id: t.clientId, project_id: t.projectId, due_date: t.dueDate }); fetchUserData(currentUser); }} onUpdateStatus={onUpdateTaskStatus} currentUser={currentUser} users={users} clients={clients} projects={projects} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

// Added missing default export for App component
export default App;
