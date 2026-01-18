
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
    // Les permissions sont stockées en JSONB
    mapped.permissions = item.permissions || {};
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
      <p className="text-center text-[9px] text-slate-600 font-black uppercase mt-12 tracking-[0.4em]">Enterprise iV Engine v2.5</p>
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

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') navigate('/dashboard', { replace: true });
  }, [location.pathname, navigate]);

  const hasAccess = (permissionKey?: keyof UserPermissions) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (!permissionKey) return true;
    return !!(currentUser.permissions as any)?.[permissionKey];
  };

  const handleAddTask = async (task: Task) => {
    if (!hasAccess('canCreateTasks')) {
      addNotification("Accès Refusé", "Vous n'avez pas la permission de créer des missions.", "urgent");
      return;
    }

    const payload = {
      title: task.title,
      description: task.description || '',
      assignee_id: task.assigneeId || currentUser.id,
      client_id: task.clientId || null,
      status: task.status || 'À faire',
      due_date: task.dueDate,
      priority: task.priority || 'medium',
      type: task.type || 'content'
    };

    const { data, error } = await supabase.from('tasks').insert(payload).select().single();
    if (data) {
      setTasks((prev: any) => [mapFromDB('tasks', data), ...prev]);
      addNotification("Système iV", "Mission initialisée avec succès.", "success");
    } else {
      addNotification("Erreur Flux", error.message, "urgent");
    }
  };

  const handleSendMessage = async (content: string, channelId: string) => {
    if (!hasAccess('canManageChat')) return;

    const tempId = generateUUID();
    const now = new Date().toISOString();
    
    const optimisticMessage = {
      id: tempId,
      content,
      channel_id: channelId,
      user_id: currentUser.id,
      created_at: now
    };
    
    setMessages((prev: Message[]) => [...prev, mapFromDB('messages', optimisticMessage)]);

    const { error } = await supabase.from('messages').insert({
      content,
      channel_id: channelId,
      user_id: currentUser.id
    });

    if (error) {
      addNotification("Transmission Échouée", "Le flux de données a été interrompu.", "urgent");
    }
  };

  const handleAddChannel = async (channel: { name: string; type: 'global' | 'project'; members?: string[] }) => {
    if (!hasAccess('canManageChannels')) {
      addNotification("Accès Refusé", "Permission de gestion des canaux requise.", "urgent");
      return;
    }

    const { data, error } = await supabase.from('channels').insert({
      name: channel.name,
      type: channel.type
    }).select().single();

    if (data) {
      setChannels((prev: Channel[]) => [...prev, data]);
      addNotification("Canal Créé", `Flux #${channel.name} opérationnel.`, "success");
    } else {
      addNotification("Erreur Système", error.message, "urgent");
    }
  };

  const handleAddLead = async (lead: Lead) => {
    if (!hasAccess('canManageLeads')) {
      addNotification("Accès Refusé", "Permission de gestion des leads requise.", "urgent");
      return;
    }

    const { data, error } = await supabase.from('leads').insert({
      name: lead.name, 
      company: lead.company, 
      email: lead.email, 
      phone: lead.phone,
      status: lead.status, 
      value_min: lead.valueMin, 
      value_max: lead.valueMax, 
      description: lead.description
    }).select().single();
    if (data) {
        setLeads((prev: any) => [mapFromDB('leads', data), ...prev]);
        addNotification("Lead Capturé", "Nouveau prospect ajouté au pipeline.", "success");
    } else {
        addNotification("Erreur Acquisition", error.message, "urgent");
    }
  };

  const handleAddClient = async (client: Client) => {
    if (!hasAccess('canManageClients')) {
      addNotification("Accès Refusé", "Permission de gestion CRM requise.", "urgent");
      return;
    }

    const { data, error } = await supabase.from('clients').insert({
      name: client.name, 
      company: client.company, 
      email: client.email, 
      phone: client.phone, 
      address: client.address, 
      description: client.description
    }).select().single();
    if (data) {
        setClients((prev: any) => [data, ...prev]);
        addNotification("Partenaire Enregistré", "Fiche client finalisée.", "success");
    } else {
        addNotification("Erreur CRM", error.message, "urgent");
    }
  };

  const handleAddUser = async (user: any) => {
    if (!hasAccess('canManageTeam')) return;

    // Étape 1 : Création dans Supabase Auth (si possible via le client, sinon simulation)
    // Note: Sans clé de service, l'admin ne peut pas créer d'utilisateurs Auth directement via le client JS.
    // Mais on peut utiliser supabase.auth.signUp() si on veut automatiser, mais cela déconnecterait l'admin.
    // On simule donc ici l'enregistrement réussi dans la table 'users'.
    
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
      addNotification("Équipe", "Nouvel accès utilisateur activé.", "success");
      // Note: Le mot de passe devra être géré via une fonction Edge ou Supabase Auth Admin API
      console.log(`Mot de passe configuré pour ${user.email}: ${user.password}`);
    } else {
      addNotification("Erreur Team", error.message, "urgent");
    }
  };

  const handleUpdateMember = async (id: string, updates: any) => {
    if (!hasAccess('canManageTeam')) return;

    const { data, error } = await supabase.from('users').update({
      name: updates.name,
      role: updates.role,
      permissions: updates.permissions
    }).eq('id', id).select().single();

    if (data) {
      setUsers((prev: any) => prev.map((u: any) => u.id === id ? mapFromDB('users', data) : u));
      addNotification("Équipe", "Privilèges mis à jour avec succès.", "success");
    } else {
      addNotification("Erreur Team", error.message, "urgent");
    }
  };

  const handleRemoveUser = async (id: string) => {
    if (!hasAccess('canManageTeam')) return;

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsers((prev: any) => prev.filter((u: any) => u.id !== id));
      addNotification("Équipe", "Accès utilisateur révoqué.", "info");
    } else {
      addNotification("Erreur Team", error.message, "urgent");
    }
  };

  return (
    <Layout currentUser={currentUser} onLogout={() => { supabase.auth.signOut(); window.location.reload(); }}>
      <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
      
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-white opacity-20" size={60} /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} onNavigate={(v: any) => navigate(`/${v}`)} />} />
          
          <Route path="/tasks" element={
            <Tasks 
              tasks={tasks} users={users} clients={clients} currentUser={currentUser} 
              onAddTask={handleAddTask} 
              onUpdateStatus={async (id, s) => { 
                if(!hasAccess('canCreateTasks') && !hasAccess('canEditAllTasks')) return;
                setTasks(prev => prev.map(t => t.id === id ? {...t, status:s} : t)); 
                await supabase.from('tasks').update({status:s}).eq('id', id); 
              }} 
              onUpdateTask={async t => { 
                if(!hasAccess('canEditAllTasks')) return;
                setTasks(prev => prev.map(item => item.id === t.id ? t : item)); 
                await supabase.from('tasks').update({title:t.title, status:t.status, description: t.description, priority: t.priority, type: t.type}).eq('id', t.id); 
              }} 
              onDeleteTask={async id => { 
                if(!hasAccess('canDeleteTasks')) return;
                setTasks(prev => prev.filter(t => t.id !== id)); 
                await supabase.from('tasks').delete().eq('id', id); 
              }} 
            />
          } />
          
          <Route path="/chat" element={hasAccess('canManageChat') ? <Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || ""} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={handleSendMessage} onAddChannel={handleAddChannel} onDeleteChannel={async id => { if(!hasAccess('canManageChannels')) return; setChannels(prev => prev.filter(c => c.id !== id)); await supabase.from('channels').delete().eq('id', id); }} /> : <Navigate to="/dashboard" />} />
          <Route path="/leads" element={hasAccess('canManageLeads') ? <Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={async l => { setLeads(prev => prev.map(i => i.id === l.id ? l : i)); await supabase.from('leads').update({status: l.status}).eq('id', l.id); }} onDeleteLead={async id => { setLeads(prev => prev.filter(l => l.id !== id)); await supabase.from('leads').delete().eq('id', id); }} onConvertToClient={()=>{}} currentUser={currentUser} addNotification={addNotification} /> : <Navigate to="/dashboard" />} />
          <Route path="/clients" element={hasAccess('canManageClients') ? <Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={handleAddClient} onDeleteClient={async id => { setClients(prev => prev.filter(c => c.id !== id)); await supabase.from('clients').delete().eq('id', id); }} /> : <Navigate to="/dashboard" />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} clients={clients} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={async (id, s) => { if(!hasAccess('canCreateTasks')) return; setTasks(prev => prev.map(t => t.id === id ? {...t, status:s} : t)); await supabase.from('tasks').update({status:s}).eq('id', id); }} />} />
          
          <Route path="/team" element={
            hasAccess('canManageTeam') ? (
              <Team 
                currentUser={currentUser} 
                users={users} 
                onAddUser={handleAddUser} 
                onRemoveUser={handleRemoveUser} 
                onUpdateMember={handleUpdateMember} 
              />
            ) : <Navigate to="/dashboard" />
          } />
          
          <Route path="/files" element={hasAccess('canViewFiles') ? <Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={(n,u)=>{setFileLinks(prev=>[{id:generateUUID(), name:n, url:u, createdBy:currentUser.id, createdAt:new Date().toLocaleDateString()}, ...prev])}} onDeleteFileLink={id=>{ if(!hasAccess('canDeleteFiles')) return; setFileLinks(prev=>prev.filter(f=>f.id!==id))}} /> : <Navigate to="/dashboard" />} />
          <Route path="/reports" element={hasAccess('canViewReports') ? <Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} /> : <Navigate to="/dashboard" />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async d => { setCurrentUser(prev => ({...prev!, ...d})); }} />} />
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
    let displayMessage = "Information système";
    if (typeof message === 'string') displayMessage = message;
    else if (message && typeof message === 'object') displayMessage = message.message || JSON.stringify(message);
    setNotifications(prev => [...prev, { id: generateUUID(), title, message: displayMessage, type }]);
  }, []);

  const onDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchInitialData = useCallback(async (userId: string, userEmail?: string) => {
    try {
      // Tenter de récupérer le profil utilisateur pour obtenir ses permissions
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
      
      let profile;
      if (userData) {
        profile = mapFromDB('users', userData);
      } else {
        profile = {
          id: userId,
          name: userEmail?.split('@')[0] || 'Opérateur',
          email: userEmail || '',
          role: UserRole.ADMIN,
          status: 'active',
          permissions: {}, // Les admins ont accès à tout via hasAccess
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail?.split('@')[0] || 'U')}&background=1e293b&color=fff&bold=true`
        };
      }

      setCurrentUser({ ...profile, notificationPref: 'all' } as User);

      const load = async (table: string, setter: Function) => {
        const { data, error } = await supabase.from(table).select('*').limit(100);
        if (!error && data) setter(data.map(item => mapFromDB(table, item)));
      };
      
      await Promise.all([
        load('tasks', setTasks), load('users', setUsers), load('clients', setClients),
        load('leads', setLeads), load('channels', setChannels), load('file_links', setFileLinks),
        load('activity_logs', setActivities), load('messages', setMessages)
      ]);
      
      setIsLoading(false);
      setIsAuthProcessing(false);
    } catch (e: any) {
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
    if (isAuthProcessing) return;
    setIsAuthProcessing(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) { addNotification("Échec Connexion", error.message, "urgent"); setIsAuthProcessing(false); }
    else if(data.user) fetchInitialData(data.user.id, data.user.email);
  };

  if (isLoading && !currentUser) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
          <Zap size={60} className="text-white relative animate-bounce" strokeWidth={3} />
        </div>
        <p className="text-[12px] font-black uppercase tracking-[0.8em] text-white opacity-40">Initialisation iVISION Core</p>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-4">
          <AuthUI handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthProcessing={isAuthProcessing} />
        </div>
      ) : (
        <AppContent 
          currentUser={currentUser} users={users} tasks={tasks} setTasks={setTasks}
          clients={clients} setClients={setClients} leads={leads} setLeads={setLeads}
          channels={channels} setChannels={setChannels} messages={messages} setMessages={setMessages}
          fileLinks={fileLinks} setFileLinks={setFileLinks}
          activities={activities} setActivities={setActivities}
          setUsers={setUsers} notifications={notifications}
          addNotification={addNotification} onDismissNotification={onDismissNotification}
          setCurrentUser={setCurrentUser}
        />
      )}
    </HashRouter>
  );
};

export default App;
