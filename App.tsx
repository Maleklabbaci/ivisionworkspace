
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead } from './types';
import { Mail, Lock, Loader2, User as UserIcon, Sparkles, Zap } from 'lucide-react';

// Modules Lazy-Loaded
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

const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    // Fallback pour les contextes non sécurisés (HTTP)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

const PageSkeleton = () => (
  <div className="w-full animate-in fade-in duration-500 space-y-10 px-4 pt-10">
    <div className="flex justify-between items-end mb-12">
      <div className="space-y-3">
        <div className="h-10 w-48 bg-slate-50 rounded-2xl animate-pulse"></div>
        <div className="h-3 w-32 bg-slate-50 rounded-full animate-pulse opacity-50"></div>
      </div>
      <div className="h-12 w-12 bg-slate-50 rounded-2xl animate-pulse"></div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-40 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
      ))}
    </div>
    <div className="h-80 w-full bg-slate-50 rounded-[3rem] animate-pulse"></div>
  </div>
);

const AuthUI = ({ isRegistering, setIsRegistering, handleAuth, email, setEmail, password, setPassword, registerName, setRegisterName, isAuthProcessing, isEntering }: any) => (
  <div className={`glass-card w-full max-w-sm rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-12 border border-white transition-all duration-1000 ease-in-out ${isEntering ? 'opacity-0 scale-95 blur-2xl pointer-events-none' : 'animate-in zoom-in-95 slide-in-from-bottom-12'}`}>
    <div className="text-center mb-10">
      <div className="w-20 h-20 bg-gradient-to-tr from-primary via-vibrant-indigo to-vibrant-violet rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-2xl shadow-primary/30 mb-8 transform hover:rotate-6 transition-transform">iV</div>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1 uppercase">iVISION</h1>
      <p className="text-primary font-bold text-[10px] uppercase tracking-[0.5em] mt-3">Enterprise Workspace</p>
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
            className="w-full p-5 bg-slate-50 border border-transparent rounded-2xl font-semibold text-slate-900 pl-12 outline-none focus:bg-white focus:border-vibrant-indigo/30 focus:ring-4 focus:ring-vibrant-indigo/5 transition-all" 
          />
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-vibrant-indigo transition-colors" size={18} />
        </div>
      )}
      <div className="relative group">
        <input 
          type="email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email iVISION" 
          className="w-full p-5 bg-slate-50 border border-transparent rounded-2xl font-semibold text-slate-900 pl-12 outline-none focus:bg-white focus:border-vibrant-indigo/30 focus:ring-4 focus:ring-vibrant-indigo/5 transition-all" 
        />
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-vibrant-indigo transition-colors" size={18} />
      </div>
      <div className="relative group">
        <input 
          type="password" 
          required 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Mot de passe" 
          className="w-full p-5 bg-slate-50 border border-transparent rounded-2xl font-semibold text-slate-900 pl-12 outline-none focus:bg-white focus:border-vibrant-indigo/30 focus:ring-4 focus:ring-vibrant-indigo/5 transition-all" 
        />
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-vibrant-indigo transition-colors" size={18} />
      </div>
      
      <button 
        type="submit"
        disabled={isAuthProcessing || isEntering} 
        className="w-full py-6 bg-gradient-to-r from-primary to-vibrant-indigo text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active-scale disabled:opacity-50 uppercase text-[11px] tracking-widest mt-8 flex items-center justify-center transition-all hover:brightness-110"
      >
        {isAuthProcessing ? <Loader2 className="animate-spin" /> : (isRegistering ? "CRÉER UN ACCÈS" : "DÉVERROUILLER")}
      </button>
    </form>
    
    <button 
      type="button"
      onClick={() => setIsRegistering(!isRegistering)} 
      className="w-full mt-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center space-x-2 group"
    >
      <Zap size={14} className="text-vibrant-amber group-hover:scale-125 transition-transform" />
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
  onDismissNotification: (id: string) => void;
  notifications: ToastNotification[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setFileLinks: React.Dispatch<React.SetStateAction<FileLink[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  fetchInitialData: (userId?: string) => Promise<void>;
}> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, 
  addNotification, onDismissNotification, notifications, 
  setLeads, setClients, setTasks, setMessages, setFileLinks, setUsers, fetchInitialData
}) => {
  const navigate = useNavigate();

  // TASKS HANDLERS
  const handleUpdateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      addNotification("Missions", "Statut mis à jour", "success");
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", "Impossible de mettre à jour le statut", "urgent");
    }
  }, [setTasks, addNotification]);

  const handleUpdateTask = useCallback(async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...task } : t));
    try {
      const { error } = await supabase.from('tasks').update({
        title: task.title,
        description: task.description || null,
        assignee_id: task.assigneeId,
        status: task.status,
        due_date: task.dueDate,
        priority: task.priority || 'medium',
        client_id: task.clientId || null,
        type: task.type || 'content'
      }).eq('id', task.id);
      
      if (error) throw error;
      addNotification("Missions", "Mission mise à jour", "success");
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", "Impossible de mettre à jour la mission", "urgent");
    }
  }, [setTasks, addNotification]);

  const handleAddTask = useCallback(async (task: Task) => {
    try {
      const { data, error } = await supabase.from('tasks').insert({
        id: generateUUID(),
        title: task.title,
        description: task.description || null,
        assignee_id: task.assigneeId,
        status: task.status,
        due_date: task.dueDate,
        priority: task.priority || 'medium',
        client_id: task.clientId || null,
        type: task.type || 'content'
      }).select();

      if (error) throw error;

      if (data) {
        setTasks(prev => [{
            id: data[0].id,
            title: data[0].title,
            description: data[0].description,
            assigneeId: data[0].assignee_id,
            status: data[0].status,
            dueDate: data[0].due_date,
            priority: data[0].priority,
            clientId: data[0].client_id,
            type: data[0].type || 'content'
        }, ...prev]);
        addNotification("Missions", "Nouvelle mission ajoutée", "success");
      }
    } catch (e: any) { 
      console.error("Task Creation Error:", e);
      addNotification("Erreur", `Échec de la création : ${e.message}`, "urgent");
    }
  }, [setTasks, addNotification]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addNotification("Missions", "Mission révoquée", "info");
    } catch (e) { 
      console.error(e);
      addNotification("Erreur", "Impossible de supprimer la tâche", "urgent");
    }
  }, [setTasks, addNotification]);

  // CLIENTS HANDLERS
  const handleAddClient = useCallback(async (client: Client) => {
    try {
      const { data, error } = await supabase.from('clients').insert({
        id: generateUUID(),
        name: client.name,
        company: client.company || null,
        email: client.email || null,
        phone: client.phone || null,
        address: client.address || null,
        description: client.description || null
      }).select();
      if (error) throw error;
      if (data) {
        setClients(prev => [...prev, data[0] as Client]);
        addNotification("CRM", "Nouveau compte partenaire ajouté", "success");
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", `Impossible d'ajouter le client : ${e.message}`, "urgent");
    }
  }, [setClients, addNotification]);

  const handleUpdateClient = useCallback(async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? { ...client } : c));
    try {
      const { error } = await supabase.from('clients').update({
        name: client.name,
        company: client.company || null,
        email: client.email || null,
        phone: client.phone || null,
        address: client.address || null,
        description: client.description || null
      }).eq('id', client.id);
      if (error) throw error;
      addNotification("CRM", "Compte mis à jour", "success");
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", `Mise à jour échouée : ${e.message}`, "urgent");
    }
  }, [setClients, addNotification]);

  // LEADS HANDLERS
  const handleAddLead = useCallback(async (lead: Lead) => {
    try {
      const { data, error } = await supabase.from('leads').insert({
        id: generateUUID(),
        name: lead.name, 
        company: lead.company || null, 
        email: lead.email || null,
        phone: lead.phone || null, 
        status: lead.status || 'new', 
        value_min: lead.valueMin || 0,
        value_max: lead.valueMax || 0, 
        description: lead.description || null
      }).select();
      if (error) throw error;
      if (data) {
        setLeads(prev => [{
          id: data[0].id,
          name: data[0].name,
          company: data[0].company,
          email: data[0].email,
          phone: data[0].phone,
          status: data[0].status,
          valueMin: data[0].value_min,
          valueMax: data[0].value_max,
          description: data[0].description,
          createdAt: data[0].created_at
        }, ...prev]);
        addNotification("Pipeline", "Prospect capturé", "success");
      }
    } catch (e: any) { 
      console.error(e); 
      addNotification("Erreur", `Impossible d'ajouter le prospect : ${e.message}`, "urgent");
    }
  }, [setLeads, addNotification]);

  const handleUpdateLead = useCallback(async (lead: Lead) => {
    setLeads(prev => prev.map(l => String(l.id) === String(lead.id) ? { ...lead } : l));
    try {
      const { error } = await supabase.from('leads').update({
        name: lead.name, 
        company: lead.company || null, 
        email: lead.email || null,
        phone: lead.phone || null, 
        status: lead.status, 
        value_min: lead.valueMin,
        value_max: lead.valueMax, 
        description: lead.description || null
      }).eq('id', lead.id);
      if (error) throw error;
      addNotification("Pipeline", "Prospect mis à jour", "success");
    } catch (e) { 
      console.error(e);
      addNotification("Erreur", "Mise à jour échouée", "urgent");
    }
  }, [setLeads, addNotification]);

  const handleDeleteLead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => String(l.id) !== String(id)));
      addNotification("Pipeline", "Prospect supprimé", "info");
    } catch (e) { 
      console.error(e);
      addNotification("Erreur", "Suppression échouée", "urgent");
    }
  }, [setLeads, addNotification]);

  const handleConvertToClient = useCallback(async (lead: Lead) => {
    try {
      const { data, error } = await supabase.from('clients').insert({
        id: generateUUID(),
        name: lead.name, 
        company: lead.company || null, 
        email: lead.email || null,
        phone: lead.phone || null, 
        description: lead.description || null
      }).select();
      if (error) throw error;
      if (data) {
        setClients(prev => [...prev, data[0] as Client]);
        await supabase.from('leads').delete().eq('id', lead.id);
        setLeads(prev => prev.filter(l => String(l.id) !== String(lead.id)));
        addNotification("CRM", "Prospect converti en client !", "success");
        navigate('/clients');
      }
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", `Conversion échouée : ${e.message}`, "urgent");
    }
  }, [setLeads, setClients, addNotification, navigate]);

  const handleMoveClientToLead = useCallback(async (client: Client) => {
    try {
      const { data, error } = await supabase.from('leads').insert({
        id: generateUUID(),
        name: client.name,
        company: client.company || null,
        email: client.email || null,
        phone: client.phone || null,
        description: client.description || null,
        status: 'new'
      }).select();
      if (error) throw error;
      if (data) {
        setLeads(prev => [{
            id: data[0].id,
            name: data[0].name,
            company: data[0].company,
            email: data[0].email,
            phone: data[0].phone,
            status: data[0].status,
            description: data[0].description,
            valueMin: data[0].value_min || 0,
            valueMax: data[0].value_max || 0,
            createdAt: data[0].created_at
        }, ...prev]);
        await supabase.from('clients').delete().eq('id', client.id);
        setClients(prev => prev.filter(c => String(c.id) !== String(client.id)));
        addNotification("CRM", "Client rétrogradé en prospect", "info");
        navigate('/leads');
      }
    } catch (e) { 
      console.error(e);
      addNotification("Erreur", "Rétrogradation échouée", "urgent");
    }
  }, [setLeads, setClients, addNotification, navigate]);

  // CHAT HANDLERS
  const handleSendMessage = useCallback(async (content: string, channelId: string) => {
    try {
      const { data, error } = await supabase.from('messages').insert({
        id: generateUUID(),
        content, channel_id: channelId, user_id: currentUser.id
      }).select();
      if (error) throw error;
      if (data) {
        setMessages(prev => [...prev, {
          id: data[0].id, userId: data[0].user_id, channelId: data[0].channel_id,
          content: data[0].content, timestamp: new Date(data[0].created_at).toLocaleTimeString(),
          fullTimestamp: data[0].created_at
        }]);
      }
    } catch (e) { console.error(e); }
  }, [currentUser, setMessages]);

  // FILE LINKS
  const handleAddFileLink = useCallback(async (name: string, url: string) => {
    try {
      const { data, error } = await supabase.from('file_links').insert({
        id: generateUUID(),
        name, url, created_by: currentUser.id
      }).select();
      if (error) throw error;
      if (data) {
        setFileLinks(prev => [data[0], ...prev]);
        addNotification("Documents", "Nouveau lien ajouté", "success");
      }
    } catch (e) { console.error(e); }
  }, [currentUser, setFileLinks, addNotification]);

  // TEAM HANDLERS
  const handleUpdateMember = useCallback(async (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    try {
      const { error } = await supabase.from('users').update({
        role: updates.role, permissions: updates.permissions, name: updates.name
      }).eq('id', userId);
      if (error) throw error;
      addNotification("Équipe", "Collaborateur mis à jour", "success");
    } catch (e) { console.error(e); }
  }, [setUsers, addNotification]);

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={() => supabase.auth.signOut()} 
      unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}
      tasks={tasks} messages={messages} users={users} channels={channels} fileLinks={fileLinks}
    >
      <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onConvertToClient={handleConvertToClient} currentUser={currentUser} addNotification={addNotification} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (data) => {
              setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
              await supabase.from('users').update(data).eq('id', currentUser.id);
              addNotification("Paramètres", "Profil mis à jour", "success");
          }} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || "general"} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={handleSendMessage} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onMoveToLead={handleMoveClientToLead} onDeleteClient={async (id) => {
            await supabase.from('clients').delete().eq('id', id);
            setClients(prev => prev.filter(c => String(c.id) !== String(id)));
            addNotification("CRM", "Client supprimé", "info");
          }} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onlineUserIds={new Set()} onAddUser={() => {}} onRemoveUser={async (id) => {
              await supabase.from('users').delete().eq('id', id);
              setUsers(prev => prev.filter(u => u.id !== id));
          }} onUpdateRole={() => {}} onApproveUser={() => {}} onUpdateMember={handleUpdateMember} />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={handleAddFileLink} onDeleteFileLink={async (id) => {
              await supabase.from('file_links').delete().eq('id', id);
              setFileLinks(prev => prev.filter(f => f.id !== id));
          }} />} />
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
  const [isEntering, setIsEntering] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    setNotifications(prev => [...prev, { id: generateUUID(), title, message, type }]);
  }, []);

  const onDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchInitialData = useCallback(async (userId?: string) => {
    if (!isConfigured) return;
    try {
      const [uRes, cRes, mRes, tRes, clRes, lRes, fRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('file_links').select('*').order('created_at', { ascending: false }),
      ]);

      if (uRes.data) {
        const mappedUsers = uRes.data.map((u: any) => ({
          id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`,
          status: u.status, permissions: u.permissions || {}
        }));
        setUsers(mappedUsers);
        if (userId) {
          const matched = mappedUsers.find((u: any) => u.id === userId);
          if (matched) setCurrentUser(matched);
        }
      }
      if (clRes.data) setClients(clRes.data as Client[]);

      // LOGIQUE DE NETTOYAGE LEADS "PERDU" (> 5 jours)
      if (lRes.data) {
          const now = new Date();
          const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
          const filteredLeads = [];
          
          for (const lead of lRes.data) {
              const updatedAt = new Date(lead.updated_at || lead.created_at);
              if (lead.status === 'lost' && (now.getTime() - updatedAt.getTime()) > fiveDaysInMs) {
                  supabase.from('leads').delete().eq('id', lead.id).then(() => console.debug(`Lead ${lead.id} auto-supprimé`));
              } else {
                  filteredLeads.push({
                      id: lead.id, name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, status: lead.status,
                      valueMin: lead.value_min || 0, valueMax: lead.value_max || 0, description: lead.description, createdAt: lead.created_at, updatedAt: lead.updated_at
                  });
              }
          }
          setLeads(filteredLeads);
      }

      if (cRes.data) setChannels(cRes.data as Channel[]);
      if (mRes.data) setMessages(mRes.data.map((m: any) => ({
        id: m.id, userId: m.user_id, channelId: m.channel_id, content: m.content, timestamp: new Date(m.created_at).toLocaleTimeString(), fullTimestamp: m.created_at
      })));
      if (tRes.data) setTasks(tRes.data.map((t: any) => ({
        id: t.id, 
        title: t.title, 
        description: t.description, 
        assigneeId: t.assignee_id, 
        status: t.status as TaskStatus, 
        dueDate: t.due_date, 
        priority: t.priority, 
        clientId: t.client_id,
        type: t.type || 'content'
      })));
      if (fRes.data) setFileLinks(fRes.data.map((f: any) => ({
        id: f.id, name: f.name, url: f.url, createdAt: new Date(f.created_at).toLocaleDateString()
      })));
    } catch (e) { console.error(e); }
    finally { 
      setIsLoading(false);
      setIsEntering(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (!currentUser) fetchInitialData(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
        setIsEntering(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchInitialData, currentUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      if (isRegistering) {
        const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { name: registerName } } });
        if (error) throw error;
        if (data.user) {
            await supabase.from('users').insert({
                id: data.user.id, name: registerName, email: email, role: UserRole.MEMBER, status: 'active'
            });
        }
        addNotification("Compte créé", "Accès iVISION activé.", "success");
        setIsRegistering(false);
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsEntering(true);
        if (data.user) await fetchInitialData(data.user.id);
      }
    } catch (err: any) {
      addNotification("Erreur", err.message, "urgent");
      setIsEntering(false);
    } finally { setIsAuthProcessing(false); }
  };

  if (isLoading && !currentUser) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white space-y-10 animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-24 h-24 border-[5px] border-slate-50 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-black text-primary text-2xl tracking-tighter">iV</div>
      </div>
      <div className="text-center"><p className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-300">Synchronisation iVISION</p></div>
    </div>
  );

  return (
    <HashRouter>
      {!currentUser ? (
        <div className="h-screen w-screen auth-bg flex items-center justify-center p-6 overflow-hidden">
          <ToastContainer notifications={notifications} onDismiss={onDismissNotification} />
          <AuthUI isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth} email={email} setEmail={setEmail} password={password} setPassword={setPassword} registerName={registerName} setRegisterName={setRegisterName} isAuthProcessing={isAuthProcessing} isEntering={isEntering} />
        </div>
      ) : (
        <div className={`transition-all duration-1000 ease-out ${isEntering ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100'}`}>
          <AppContent 
            currentUser={currentUser} users={users} tasks={tasks} setTasks={setTasks}
            clients={clients} setClients={setClients} leads={leads} setLeads={setLeads}
            channels={channels} messages={messages} setMessages={setMessages}
            fileLinks={fileLinks} setFileLinks={setFileLinks}
            setUsers={setUsers} notifications={notifications}
            addNotification={addNotification} onDismissNotification={onDismissNotification} fetchInitialData={fetchInitialData}
          />
        </div>
      )}
    </HashRouter>
  );
};

export default App;
