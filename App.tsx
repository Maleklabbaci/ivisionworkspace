
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase, isConfigured } from './services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, Task, TaskStatus, Channel, ToastNotification, Message, Client, FileLink, Lead, ActivityLog } from './types';
import { Mail, Lock, Loader2, User as UserIcon, Sparkles, Zap } from 'lucide-react';
import { setGeminiApiKey } from './services/geminiService';

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

const supabaseUrl = 'https://cfpyrdcybgnefaqdyumb.supabase.co';
const supabaseAnonKey = 'sb_publishable_9_MVHdIusXmJ_awvZdAl_w_2sTgGqoE';

const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
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
            onChange={(e) => setRegisterName(e.target.value)} 
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
          onChange={(e) => setEmail(e.target.value)} 
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
          onChange={(e) => setPassword(e.target.value)} 
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
  activities: ActivityLog[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'urgent') => void;
  onDismissNotification: (id: string) => void;
  notifications: ToastNotification[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setFileLinks: React.Dispatch<React.SetStateAction<FileLink[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  fetchInitialData: (userId?: string) => Promise<void>;
  logActivity: (action: string, target: string) => Promise<void>;
}> = ({ 
  currentUser, users, tasks, clients, leads, channels, messages, fileLinks, activities,
  addNotification, onDismissNotification, notifications, 
  setLeads, setClients, setTasks, setMessages, setFileLinks, setUsers, setActivities, fetchInitialData, logActivity
}) => {
  const navigate = useNavigate();

  const handleUpdateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      addNotification("Missions", "Statut mis à jour", "success");
      logActivity(`a mis à jour le statut (${newStatus})`, `Mission: ${task?.title || taskId}`);
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Échec mise à jour statut", "urgent");
    }
  }, [setTasks, addNotification, tasks, logActivity]);

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
      logActivity("a modifié une mission", `Mission: ${task.title}`);
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", e?.message || "Échec mise à jour mission", "urgent");
    }
  }, [setTasks, addNotification, logActivity]);

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
        logActivity("a créé une mission", `Mission: ${task.title}`);
      }
    } catch (e: any) { 
      console.error("Task Creation Error:", e);
      addNotification("Erreur", e?.message || "Échec création mission", "urgent");
    }
  }, [setTasks, addNotification, logActivity]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addNotification("Missions", "Mission révoquée", "info");
      logActivity("a révoqué une mission", `Mission: ${task?.title || taskId}`);
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Suppression échouée", "urgent");
    }
  }, [setTasks, addNotification, tasks, logActivity]);

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
        logActivity("a ajouté un client", `Client: ${client.name}`);
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", e?.message || "Échec ajout client", "urgent");
    }
  }, [setClients, addNotification, logActivity]);

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
      logActivity("a mis à jour un profil client", `Client: ${client.name}`);
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", e?.message || "Mise à jour échouée", "urgent");
    }
  }, [setClients, addNotification, logActivity]);

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
        logActivity("a enregistré un nouveau prospect", `Lead: ${lead.name}`);
      }
    } catch (e: any) { 
      console.error(e); 
      addNotification("Erreur", e?.message || "Échec ajout prospect", "urgent");
    }
  }, [setLeads, addNotification, logActivity]);

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
      logActivity("a modifié un prospect", `Lead: ${lead.name}`);
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Mise à jour échouée", "urgent");
    }
  }, [setLeads, addNotification, logActivity]);

  const handleDeleteLead = useCallback(async (id: string) => {
    const lead = leads.find(l => String(l.id) === String(id));
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => String(l.id) !== String(id)));
      addNotification("Pipeline", "Prospect supprimé", "info");
      logActivity("a supprimé un prospect", `Lead: ${lead?.name || id}`);
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Suppression échouée", "urgent");
    }
  }, [setLeads, addNotification, leads, logActivity]);

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
        logActivity("a converti un prospect en client", `Lead -> Client: ${lead.name}`);
        navigate('/clients');
      }
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Conversion échouée", "urgent");
    }
  }, [setLeads, setClients, addNotification, navigate, logActivity]);

  const handleMoveClientToLead = useCallback(async (client: Client) => {
    try {
      const { data, error } = await supabase.from('leads').insert({
        id: generateUUID(),
        name: client.name, 
        company: client.company || null, 
        email: client.email || null,
        phone: client.phone || null, 
        status: 'new', 
        value_min: 0,
        value_max: 0, 
        description: client.description || null
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
        await supabase.from('clients').delete().eq('id', client.id);
        setClients(prev => prev.filter(c => String(c.id) !== String(client.id)));
        addNotification("Pipeline", "Client déplacé vers les prospects", "info");
        logActivity("a déplacé un client vers le pipeline de prospects", `Client -> Lead: ${client.name}`);
        navigate('/leads');
      }
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Échec transfert", "urgent");
    }
  }, [setLeads, setClients, addNotification, logActivity, navigate]);

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
    } catch (e: any) { console.error(e); }
  }, [currentUser, setMessages]);

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
        logActivity("a ajouté un lien de document", `Fichier: ${name}`);
      }
    } catch (e: any) { console.error(e); }
  }, [currentUser, setFileLinks, addNotification, logActivity]);

  const handleAddUser = useCallback(async (payload: { name: string; email: string; password: string; role: UserRole }) => {
    try {
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: { data: { name: payload.name } }
      });
      if (authError) throw authError;
      if (authData.user) {
        const newUser: User = {
          id: authData.user.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          avatar: `https://ui-avatars.com/api/?name=${payload.name.replace(/\s+/g, '+')}&background=random`,
          status: 'active',
          notificationPref: 'all',
          permissions: {}
        };
        const { error: dbError } = await supabase.from('users').insert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          status: 'active'
        });
        if (dbError) throw dbError;
        setUsers(prev => [...prev, newUser]);
        addNotification("Équipe", `Collaborateur ${payload.name} créé avec succès.`, "success");
        logActivity("a ajouté un nouveau collaborateur", `User: ${payload.name}`);
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Erreur", e?.message || "Échec création collaborateur", "urgent");
      throw e;
    }
  }, [setUsers, addNotification, logActivity]);

  const handleUpdateMember = useCallback(async (userId: string, updates: Partial<User>) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    try {
      const { error } = await supabase.from('users').update({
        role: updates.role, permissions: updates.permissions, name: updates.name
      }).eq('id', userId);
      if (error) throw error;
      addNotification("Équipe", "Collaborateur mis à jour", "success");
      logActivity("a modifié les paramètres d'un membre", `User: ${user?.name || userId}`);
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Échec mise à jour membre", "urgent");
    }
  }, [setUsers, addNotification, users, logActivity]);

  const handleRemoveUser = useCallback(async (userId: string) => {
    const user = users.find(u => u.id === userId);
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
      addNotification("Équipe", "Collaborateur supprimé", "info");
      logActivity("a révoqué un accès collaborateur", `User: ${user?.name || userId}`);
    } catch (e: any) { 
      console.error(e);
      addNotification("Erreur", e?.message || "Suppression échouée", "urgent");
    }
  }, [setUsers, addNotification, users, logActivity]);

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
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} tasks={tasks} activities={activities} notifications={notifications} onNavigate={(v) => navigate(`/${v}`)} />} />
          <Route path="/leads" element={<Leads leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onConvertToClient={handleConvertToClient} currentUser={currentUser} addNotification={addNotification} />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} users={users} clients={clients} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />} />
          <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={async (data) => {
              const { ai_api_key, ...userData } = data as any;
              setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...userData } : u));
              const { error: userUpdateError } = await supabase.from('users').update(userData).eq('id', currentUser.id);
              if (userUpdateError) console.error("User Update Error:", userUpdateError);
              if (ai_api_key !== undefined && (currentUser.role === UserRole.ADMIN || currentUser.email.includes('admin'))) {
                try {
                  const { error: configError } = await supabase.from('configs').upsert({ key: 'gemini_api_key', value: ai_api_key });
                  if (configError) throw configError;
                  setGeminiApiKey(ai_api_key);
                  addNotification("Système", "Clé API Gemini sauvegardée.", "success");
                } catch (e: any) {
                  console.error("Config Save Error:", e);
                  addNotification("Erreur Système", e?.message || "Échec sauvegarde clé API.", "urgent");
                }
              } else {
                 addNotification("Paramètres", "Profil mis à jour.", "success");
              }
              logActivity("a mis à jour son profil", "Paramètres");
          }} />} />
          <Route path="/chat" element={<Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={channels[0]?.id || "general"} messages={messages} onlineUserIds={new Set()} onChannelChange={() => {}} onSendMessage={handleSendMessage} onAddChannel={() => {}} onDeleteChannel={() => {}} />} />
          <Route path="/clients" element={<Clients clients={clients} tasks={tasks} fileLinks={fileLinks} currentUser={currentUser} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onMoveToLead={handleMoveClientToLead} onDeleteClient={async (id) => {
            const client = clients.find(c => String(c.id) === String(id));
            try {
              const { error } = await supabase.from('clients').delete().eq('id', id);
              if (error) throw error;
              setClients(prev => prev.filter(c => String(c.id) !== String(id)));
              addNotification("CRM", "Client supprimé", "info");
              logActivity("a supprimé un client", `Client: ${client?.name || id}`);
            } catch (e: any) {
              addNotification("Erreur", e?.message || "Échec suppression client", "urgent");
            }
          }} />} />
          <Route path="/calendar" element={<Calendar tasks={tasks} users={users} currentUser={currentUser} onAddTask={handleAddTask} onUpdateStatus={handleUpdateTaskStatus} />} />
          <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} leads={leads} />} />
          <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={activities} onlineUserIds={new Set()} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} onUpdateMember={handleUpdateMember} />} />
          <Route path="/files" element={<Files tasks={tasks} messages={messages} fileLinks={fileLinks} clients={clients} currentUser={currentUser} onAddFileLink={handleAddFileLink} onDeleteFileLink={async (id) => {
              const file = fileLinks.find(f => f.id === id);
              try {
                const { error } = await supabase.from('file_links').delete().eq('id', id);
                if (error) throw error;
                setFileLinks(prev => prev.filter(f => f.id !== id));
                logActivity("a supprimé un lien de document", `Fichier: ${file?.name || id}`);
              } catch (e: any) {
                console.error(e);
              }
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
  const [activities, setActivities] = useState<ActivityLog[]>([]);
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

  const logActivity = useCallback(async (action: string, target: string) => {
    if (!currentUser) return;
    try {
        const logId = generateUUID();
        const { error } = await supabase.from('activity_logs').insert({
            id: logId,
            user_id: currentUser.id,
            action: action,
            target: target
        });
        if (error) console.error("Logging failed", error);
        
        setActivities(prev => [{
            id: logId,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            action: action,
            target: target,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
    } catch (e: any) {
        console.error("Activity tracking error", e);
    }
  }, [currentUser]);

  const fetchInitialData = useCallback(async (userId?: string) => {
    if (!isConfigured) return;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser && userId && !currentUser) {
        const isAdmin = authUser.email?.toLowerCase().includes('admin');
        setCurrentUser({
          id: String(userId),
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Admin iVISION',
          email: authUser.email || '',
          avatar: `https://ui-avatars.com/api/?name=${authUser.email}&background=random`,
          role: isAdmin ? UserRole.ADMIN : UserRole.MEMBER,
          status: 'active',
          notificationPref: 'all',
          permissions: isAdmin ? { 
            canManageTeam: true, canManageClients: true, canViewReports: true, 
            canManageLeads: true, canCreateTasks: true, canManageChannels: true, 
            canManageCampaigns: true, canViewFiles: true 
          } : {}
        });
      }

      const results = await Promise.allSettled([
        supabase.from('users').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('file_links').select('*').order('created_at', { ascending: false }),
        supabase.from('configs').select('*').eq('key', 'gemini_api_key').maybeSingle(),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      const [uRes, cRes, mRes, tRes, clRes, lRes, fRes, configRes, actRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      if (configRes?.data?.value) {
        setGeminiApiKey(configRes.data.value);
      }

      const fetchedUsers = uRes?.data || [];
      const userMap = new Map<string, any>(fetchedUsers.map((u: any) => [String(u.id), u]));

      if (uRes?.data) {
        const mappedUsers = uRes.data.map((u: any) => ({
          id: String(u.id), 
          name: u.name, 
          email: u.email, 
          role: u.role as UserRole, 
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`,
          status: u.status, 
          permissions: u.permissions || {},
        }));
        setUsers(mappedUsers);
        
        const matched = mappedUsers.find((u: any) => String(u.id) === String(userId));
        if (matched) setCurrentUser(matched);
      }

      if (clRes?.data) setClients(clRes.data as Client[]);
      if (lRes?.data) setLeads(lRes.data.map((lead: any) => ({
        id: String(lead.id), name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, status: lead.status,
        valueMin: lead.value_min || 0, valueMax: lead.value_max || 0, description: lead.description, createdAt: lead.created_at
      })));
      if (cRes?.data) setChannels(cRes.data as Channel[]);
      if (mRes?.data) setMessages(mRes.data.map((m: any) => ({
        id: String(m.id), userId: String(m.user_id), channelId: String(m.channel_id), content: m.content, timestamp: new Date(m.created_at).toLocaleTimeString(), fullTimestamp: m.created_at
      })));
      if (tRes?.data) setTasks(tRes.data.map((t: any) => ({
        id: String(t.id), title: t.title, description: t.description, assigneeId: String(t.assignee_id), status: t.status as TaskStatus, dueDate: t.due_date, priority: t.priority, clientId: t.client_id, type: t.type || 'content'
      })));
      if (fRes?.data) setFileLinks(fRes.data.map((f: any) => ({
        id: String(f.id), name: f.name, url: f.url, createdAt: new Date(f.created_at).toLocaleDateString()
      })));
      if (actRes?.data) {
          setActivities(actRes.data.map((log: any) => {
              const user = userMap.get(log.user_id);
              return {
                  id: String(log.id),
                  userId: String(log.user_id),
                  userName: user?.name || 'Inconnu',
                  userAvatar: user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || '?'}&background=random`,
                  action: log.action,
                  target: log.target,
                  timestamp: new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              };
          }));
      }

    } catch (e: any) { 
      console.error("Erreur critique de login :", e);
    } finally { 
      setIsLoading(false);
      setIsEntering(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (!currentUser) fetchInitialData(session.user.id);
        if (event === 'SIGNED_IN') logActivity("s'est connecté", "Plateforme iVISION");
      } else {
        setCurrentUser(null);
        setIsLoading(false);
        setIsEntering(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchInitialData, currentUser, logActivity]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      if (isRegistering) {
        const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { name: registerName } } });
        if (error) throw error;
        if (data.user) {
            const { error: insertError } = await supabase.from('users').insert({ 
              id: data.user.id, 
              name: registerName, 
              email: email, 
              role: UserRole.MEMBER, 
              status: 'active',
              avatar: `https://ui-avatars.com/api/?name=${registerName.replace(/\s+/g, '+')}&background=random`
            });
            if (insertError) throw insertError;
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
      addNotification("Erreur", err?.message || "Échec authentification", "urgent");
      setIsEntering(false);
      setIsLoading(false);
    } finally { 
      setIsAuthProcessing(false); 
    }
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
          <AuthUI isRegistering={isRegistering} setIsRegistering={setIsRegistering} handleAuth={handleAuth} email={email} setEmail={(val: any) => setEmail(val)} password={password} setPassword={(val: any) => setPassword(val)} registerName={registerName} setRegisterName={(val: any) => setRegisterName(val)} isAuthProcessing={isAuthProcessing} isEntering={isEntering} />
        </div>
      ) : (
        <div className={`transition-all duration-1000 ease-out ${isEntering ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100'}`}>
          <AppContent 
            currentUser={currentUser} users={users} tasks={tasks} setTasks={setTasks}
            clients={clients} setClients={setClients} leads={leads} setLeads={setLeads}
            channels={channels} messages={messages} setMessages={setMessages}
            fileLinks={fileLinks} setFileLinks={setFileLinks}
            activities={activities} setActivities={setActivities}
            setUsers={setUsers} notifications={notifications}
            addNotification={addNotification} onDismissNotification={onDismissNotification} fetchInitialData={fetchInitialData}
            logActivity={logActivity}
          />
        </div>
      )}
    </HashRouter>
  );
};

export default App;
