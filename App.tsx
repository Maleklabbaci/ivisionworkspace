
import React, { useState, useEffect } from 'react';
import { LogIn, Lock, Mail, UserPlus, ArrowLeft, User as UserIcon, Loader2, AlertCircle, Info } from 'lucide-react';
import { supabase, isConfigured } from './services/supabaseClient';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Chat from './components/Chat';
import Team from './components/Team';
import Files from './components/Files';
import Settings from './components/Settings';
import Reports from './components/Reports';
import ToastContainer from './components/Toast';
import { User, UserRole, ViewState, Task, TaskStatus, Channel, ActivityLog, ToastNotification, Message } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  
  // Login & Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setNotifications(prev => [...prev, { id, title, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- INITIALIZATION & AUTH CHECK ---

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await fetchUserProfile(session.user.id);
          await fetchInitialData();
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Only fetch if we don't have the user yet to avoid loops
        if (!currentUser) {
            await fetchUserProfile(session.user.id);
            await fetchInitialData();
        }
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---

  const fetchUserProfile = async (userId: string) => {
    setIsLoading(true);
    
    // Wait slightly in case the SQL Trigger is still running the merge
    await new Promise(r => setTimeout(r, 500));

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        avatar: data.avatar,
        phoneNumber: data.phone_number,
        notificationPref: data.notification_pref,
        status: data.status
      };
      setCurrentUser(user);
    } else {
        // FIX: Handle missing public profile by creating one from Auth data
        console.warn("Profile not found in public table. Attempting to create...");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
             const defaultName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur';
             const defaultAvatar = authUser.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${defaultName}&background=random`;
             
             const newProfile = {
                 id: authUser.id,
                 name: defaultName,
                 email: authUser.email,
                 role: UserRole.MEMBER, // Default role
                 avatar: defaultAvatar,
                 notification_pref: 'all',
                 status: 'active'
             };

             const { error: insertError } = await supabase.from('users').insert([newProfile]);
             
             if (!insertError) {
                  const user: User = {
                    id: newProfile.id,
                    name: newProfile.name,
                    email: newProfile.email!,
                    role: newProfile.role as UserRole,
                    avatar: newProfile.avatar,
                    notificationPref: 'all',
                    status: 'active'
                  };
                  setCurrentUser(user);
             } else {
                 console.error("Failed to create missing profile:", insertError);
                 addNotification('Erreur', 'Impossible de charger le profil utilisateur.', 'urgent');
             }
        }
    }
    setIsLoading(false);
  };

  const fetchInitialData = async () => {
    try {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) {
            setUsers(usersData.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role as UserRole,
                avatar: u.avatar,
                phoneNumber: u.phone_number,
                notificationPref: u.notification_pref,
                status: u.status
            })));
        }

        const { data: tasksData } = await supabase.from('tasks').select('*');
        if (tasksData) {
            const mappedTasks: Task[] = await Promise.all(tasksData.map(async (t) => {
                const { data: commentsData } = await supabase.from('task_comments').select('*').eq('task_id', t.id);
                const comments = commentsData ? commentsData.map(c => ({
                    id: c.id,
                    userId: c.user_id,
                    content: c.content,
                    timestamp: new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                })) : [];

                const { data: attachmentsData } = await supabase.from('task_attachments').select('*').eq('task_id', t.id);
                const attachments = attachmentsData ? attachmentsData.map(a => a.file_name) : [];

                return {
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    assigneeId: t.assignee_id,
                    dueDate: t.due_date,
                    status: t.status as TaskStatus,
                    type: t.type,
                    priority: t.priority,
                    price: t.price,
                    comments: comments,
                    attachments: attachments
                };
            }));
            setTasks(mappedTasks);
        }

        const { data: channelsData } = await supabase.from('channels').select('*');
        if (channelsData) {
            setChannels(channelsData.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                unread: c.unread_count
            })));
        }

        const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
        if (msgData) {
            setMessages(msgData.map(m => ({
                id: m.id,
                userId: m.user_id,
                channelId: m.channel_id,
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            })));
        }

    } catch (error) {
        console.error("Error loading data", error);
        addNotification('Erreur', 'Impossible de charger les données.', 'urgent');
    }
  };

  // --- ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        addNotification('Erreur de connexion', error.message, 'urgent');
        setIsLoading(false);
    } else {
        addNotification('Bienvenue', 'Connexion réussie.', 'success');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !registerName) {
      addNotification('Erreur', 'Veuillez remplir tous les champs.', 'urgent');
      return;
    }
    
    setIsLoading(true);

    // 1. Sign up in Supabase Auth
    // IMPORTANT: We pass metadata so the SQL Trigger can use it to create/update the public profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: registerName,
                avatar: `https://ui-avatars.com/api/?name=${registerName.replace(' ', '+')}&background=random`
            }
        }
    });

    if (authError) {
        addNotification('Erreur inscription', authError.message, 'urgent');
        setIsLoading(false);
        return;
    }

    if (authData.user) {
        // We rely on the SQL TRIGGER to create or update the public.users table.
        // This avoids the "duplicate key" error if the user already exists (demo account).
        
        // Check if session is active (sometimes require email confirmation)
        if (authData.session) {
             addNotification('Compte activé !', 'Fusion réussie. Bienvenue.', 'success');
             // Force refresh user profile to get the merged ID and Role
             await fetchUserProfile(authData.user.id);
        } else {
             addNotification('Vérifiez vos emails', 'Un lien de confirmation a peut-être été envoyé.', 'info');
             setIsLoading(false);
        }
    } else {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setTasks([]);
      setMessages([]);
  };

  // --- TASK ACTIONS ---

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId); 
    if (error) { addNotification('Erreur', 'Impossible de mettre à jour le statut.', 'urgent'); fetchInitialData(); }
  };
  
  const handleUpdateTask = async (updatedTask: Task) => {
    const { error } = await supabase.from('tasks').update({
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate,
        assignee_id: updatedTask.assigneeId,
        type: updatedTask.type,
        price: updatedTask.price
    }).eq('id', updatedTask.id);
    if (error) { addNotification('Erreur', 'Mise à jour échouée.', 'urgent'); return; }
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleAddTask = async (newTask: Task) => {
      const dbTask = {
          id: crypto.randomUUID(),
          title: newTask.title,
          description: newTask.description,
          assignee_id: newTask.assigneeId,
          due_date: newTask.dueDate,
          status: newTask.status,
          type: newTask.type,
          priority: newTask.priority,
          price: newTask.price
      };
      const { error } = await supabase.from('tasks').insert([dbTask]);
      if (error) { console.error(error); addNotification('Erreur', 'Impossible de créer la tâche.', 'urgent'); } 
      else { 
          const addedTask = { ...newTask, id: dbTask.id };
          setTasks(prev => [...prev, addedTask]);
          addNotification('Succès', 'Tâche créée avec succès.', 'success');
      }
  };

  // --- CHAT & TEAM ACTIONS ---

  const handleSendMessage = async (text: string, channelId: string) => {
      if (!currentUser) return;
      const newMessageId = crypto.randomUUID();
      const dbMessage = { id: newMessageId, channel_id: channelId, user_id: currentUser.id, content: text };
      const displayMessage: Message = { id: newMessageId, userId: currentUser.id, channelId, content: text, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
      setMessages(prev => [...prev, displayMessage]);
      const { error } = await supabase.from('messages').insert([dbMessage]);
      if (error) { console.error(error); addNotification('Erreur', 'Message non envoyé.', 'urgent'); }
  };

  const handleAddUser = async (newUser: User) => { addNotification('Info', "L'utilisateur doit s'inscrire lui-même pour activer l'authentification.", 'info'); };
  const handleRemoveUser = async (userId: string) => {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (!error) { setUsers(users.filter(u => u.id !== userId)); addNotification('Succès', 'Utilisateur supprimé.', 'success'); }
  };
  const handleUpdateProfile = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('users').update({ name: updatedData.name, email: updatedData.email, phone_number: updatedData.phoneNumber, avatar: updatedData.avatar }).eq('id', currentUser.id);
    if (!error) { setCurrentUser({ ...currentUser, ...updatedData }); addNotification("Profil mis à jour", "Vos modifications ont été enregistrées.", 'success'); }
  };
  const handleApproveUser = async (userId: string) => {
      const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
      if (!error) { setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u)); addNotification('Succès', 'Compte validé.', 'success'); }
  };
  const handleUpdateMember = async (userId: string, updatedData: Partial<User>) => {
      const { error } = await supabase.from('users').update({ role: updatedData.role, name: updatedData.name, email: updatedData.email }).eq('id', userId);
      if(!error) { setUsers(users.map(u => u.id === userId ? { ...u, ...updatedData } : u)); addNotification('Compte modifié', 'Les informations ont été mises à jour.', 'success'); }
  };

  // --- CONFIG CHECK ---
  if (!isConfigured) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 flex-col p-4 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Configuration Requise</h1>
            <p className="text-slate-600 mb-6">Pour utiliser iVISION, vous devez connecter votre base de données Supabase.</p>
            <button onClick={() => window.location.reload()} className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all">Recharger</button>
          </div>
        </div>
      );
  }

  // --- LOADING SCREEN ---
  if (isLoading) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 flex-col">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Chargement iVISION...</p>
        </div>
      );
  }

  // --- AUTH SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              <span className="text-primary">i</span>VISION AGENCY
            </h1>
            <p className="text-slate-500">{isRegistering ? "Créer un nouveau compte" : "Connexion Espace de Travail"}</p>
          </div>
          
          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-right duration-300">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Jean Dupont" required />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="nom@ivision.com" required />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Créer un mot de passe" required />
                  </div>
               </div>
               
               <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20">
                  <UserPlus size={18} /> <span>S'inscrire & Lier le compte</span>
                </button>
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-slate-500 text-sm font-medium hover:text-slate-800 py-2 flex items-center justify-center">
                  <ArrowLeft size={14} className="mr-2" /> Retour à la connexion
                </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-left duration-300">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="nom@ivision.com" required />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1"><label className="block text-sm font-medium text-slate-700">Mot de passe</label></div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20">
                  <LogIn size={18} /> <span>Connexion</span>
                </button>
                <button type="button" onClick={() => setIsRegistering(true)} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2">
                  <UserPlus size={18} /> <span>Créer un compte</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout currentUser={currentUser} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout}>
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
      {currentView === 'dashboard' && <Dashboard currentUser={currentUser} tasks={tasks} onNavigate={setCurrentView} />}
      {currentView === 'reports' && <Reports currentUser={currentUser} tasks={tasks} users={users} />}
      {currentView === 'tasks' && <Tasks tasks={tasks} users={users.filter(u => u.status === 'active')} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} />}
      {currentView === 'chat' && <Chat currentUser={currentUser} users={users.filter(u => u.status === 'active')} channels={channels.length > 0 ? channels : [{ id: 'general', name: 'Général', type: 'global' }]} currentChannelId={currentChannelId} messages={messages} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} />}
      {currentView === 'files' && currentUser && <Files tasks={tasks} messages={messages} currentUser={currentUser} />}
      {currentView === 'team' && <Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} onUpdateRole={(userId, role) => handleUpdateMember(userId, { role })} onApproveUser={handleApproveUser} onUpdateMember={handleUpdateMember} />}
      {currentView === 'settings' && <Settings currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />}
    </Layout>
  );
};

export default App;
