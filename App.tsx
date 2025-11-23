

import React, { useState, useEffect, useRef } from 'react';
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
import Campaigns from './components/Campaigns';
import ToastContainer from './components/Toast';
import { User, UserRole, ViewState, Task, TaskStatus, Channel, ActivityLog, ToastNotification, Message, Comment, FileLink } from './types';

// Robust UUID generator safe for all contexts
const generateUUID = () => {
  let d = new Date().getTime(); // Timestamp
  let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; // Time in microseconds
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16;
      if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
      } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]); 
  
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState('general');
  
  // Ref pour suivre le channel actuel sans casser le useEffect des subscriptions
  const currentChannelIdRef = useRef(currentChannelId);

  // Loading States
  const [isLoading, setIsLoading] = useState(true); 
  const [isAuthProcessing, setIsAuthProcessing] = useState(false); 
  
  // Login & Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const isDataLoaded = useRef(false);

  // Sync Ref with State
  useEffect(() => {
    currentChannelIdRef.current = currentChannelId;
  }, [currentChannelId]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    const id = generateUUID();
    const safeMessage = typeof message === 'string' ? message : JSON.stringify(message);
    setNotifications(prev => [...prev, { id, title, message: safeMessage, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getLastReadTimestamp = (channelId: string): string => {
      if (!currentUser) return new Date().toISOString();
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return storage[channelId] || '1970-01-01T00:00:00.000Z';
  };

  const calculateUnreadCounts = (channelsList: Channel[], allMessages: Message[]) => {
      return channelsList.map(channel => {
          const lastRead = getLastReadTimestamp(channel.id);
          const unreadCount = allMessages.filter(m => 
              m.channelId === channel.id && 
              m.userId !== currentUser?.id && 
              new Date(m.fullTimestamp) > new Date(lastRead)
          ).length;
          return { ...channel, unread: unreadCount };
      });
  };

  // Helper to extract links from comments to populate attachments
  const extractAttachmentsFromComments = (comments: Comment[]): string[] => {
      const links: string[] = [];
      const urlRegex = /((https?:\/\/)|(www\.))[^\s]+/g;
      
      comments.forEach(c => {
          const found = c.content.match(urlRegex);
          if (found) {
              found.forEach(l => {
                  if (!links.includes(l)) links.push(l);
              });
          }
      });
      return links;
  };

  const mapTasksFromDB = (tasksData: any[], commentsData: any[]): Task[] => {
      return tasksData.map((t) => {
          const taskComments = commentsData
              .filter(c => c.task_id === t.id)
              .map(c => ({
                  id: c.id, 
                  userId: c.user_id, 
                  content: c.content,
                  timestamp: new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  fullTimestamp: c.created_at // IMPORTANT: Stockage de la date complète pour le tri
              }));
          
          const derivedAttachments = extractAttachmentsFromComments(taskComments);

          return {
              id: t.id, title: t.title, description: t.description, assigneeId: t.assignee_id,
              dueDate: t.due_date, status: t.status as TaskStatus, type: t.type, priority: t.priority,
              comments: taskComments, 
              attachments: derivedAttachments, 
              price: t.price
          };
      });
  };

  // Auth Effect
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setTasks([]);
        setMessages([]);
        setFileLinks([]);
        isDataLoaded.current = false;
        setIsLoading(false);
      } else if (session?.user) {
        if (!isDataLoaded.current && !currentUser) {
             const optimisticUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Utilisateur',
                email: session.user.email!,
                role: UserRole.MEMBER,
                avatar: session.user.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${session.user.email?.charAt(0)}&background=random`,
                notificationPref: 'all',
                status: 'active'
             };
             
             setCurrentUser(optimisticUser);
             setIsLoading(false);
             setIsAuthProcessing(false);

             Promise.all([
                fetchUserProfile(session.user.id),
                fetchInitialData(session.user.id)
             ]).then(() => {
                isDataLoaded.current = true;
             }).catch(err => console.error("Background fetch error", err));
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime Subscriptions Effect - STABILIZED
  useEffect(() => {
    if (!currentUser) return;

    // Messages Subscription (Insert & Delete)
    const messageChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const eventType = payload.eventType;
        
        if (eventType === 'INSERT') {
            const newMsg = payload.new as any;
            const displayMsg: Message = {
              id: newMsg.id,
              userId: newMsg.user_id,
              channelId: newMsg.channel_id,
              content: newMsg.content,
              timestamp: new Date(newMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              fullTimestamp: newMsg.created_at, 
              attachments: newMsg.attachments || []
            };
            
            setMessages((prev) => {
              if (prev.some(m => m.id === displayMsg.id)) return prev;
              return [...prev, displayMsg];
            });

            // Use Ref to check current channel without tearing down subscription
            if (newMsg.user_id !== currentUser.id) {
                if (newMsg.channel_id !== currentChannelIdRef.current) {
                    setChannels(prev => prev.map(c => 
                        c.id === newMsg.channel_id ? { ...c, unread: (c.unread || 0) + 1 } : c
                    ));
                } else {
                     const myMentionTag = `@${currentUser.name.replace(/\s+/g, '')}`;
                     if (newMsg.content.includes(myMentionTag)) {
                        addNotification("Nouvelle mention !", "Vous avez été mentionné dans le chat.", "info");
                     }
                }
            }
        } else if (eventType === 'DELETE') {
             const oldMsg = payload.old as any;
             setMessages(prev => prev.filter(m => m.id !== oldMsg.id));
        }
      })
      .subscribe();

    // Comments Subscription
    const commentChannel = supabase
      .channel('public:task_comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments' }, (payload) => {
        const newComment = payload.new as any;
        const formattedComment: Comment = {
             id: newComment.id,
             userId: newComment.user_id,
             content: newComment.content,
             timestamp: new Date(newComment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
             fullTimestamp: newComment.created_at
        };
        
        setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === newComment.task_id) {
                const updatedComments = task.comments?.some(c => c.id === formattedComment.id) 
                    ? task.comments 
                    : [...(task.comments || []), formattedComment];
                
                const updatedAttachments = extractAttachmentsFromComments(updatedComments);
                return { ...task, comments: updatedComments, attachments: updatedAttachments };
            }
            return task;
        }));
      })
      .subscribe();

    // Files Subscription
    const filesChannel = supabase
      .channel('public:file_links')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'file_links' }, (payload) => {
         if (payload.eventType === 'INSERT') {
            const newLink = payload.new as any;
            const formattedLink: FileLink = {
                id: newLink.id,
                name: newLink.name,
                url: newLink.url,
                createdBy: newLink.created_by,
                createdAt: new Date(newLink.created_at).toISOString().split('T')[0]
            };
            setFileLinks(prev => [...prev, formattedLink]);
         } else if (payload.eventType === 'DELETE') {
             const deletedId = (payload.old as any).id;
             setFileLinks(prev => prev.filter(f => f.id !== deletedId));
         }
      })
      .subscribe();

    // Tasks Subscription (Refetch strategy for safety)
    const tasksChannel = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
          const { data } = await supabase.from('tasks').select('*');
          if (data) {
             const allCommentsResult = await supabase.from('task_comments').select('*');
             const allComments = allCommentsResult.data || [];
             setTasks(mapTasksFromDB(data, allComments));
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(filesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [currentUser]); // Depend ONLY on currentUser to keep connection stable

  const fetchUserProfile = async (userId: string) => {
    try {
        const { data } = await supabase.from('users').select('*').eq('id', userId).single();
        if (data) {
            setCurrentUser({
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role as UserRole,
                avatar: data.avatar,
                phoneNumber: data.phone_number,
                notificationPref: data.notification_pref,
                status: data.status,
                permissions: data.permissions || {} 
            });
        }
    } catch (e) { console.error(e); }
  };

  const fetchInitialData = async (userId?: string) => {
    try {
        const [usersResult, channelsResult, messagesResult, tasksResult, commentsResult, filesResult] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('channels').select('*'),
            supabase.from('messages').select('*').order('created_at', { ascending: true }),
            supabase.from('tasks').select('*'),
            supabase.from('task_comments').select('*').order('created_at', { ascending: true }),
            supabase.from('file_links').select('*').order('created_at', { ascending: false })
        ]);

        if (usersResult.data) {
            setUsers(usersResult.data.map(u => ({
                id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar,
                phoneNumber: u.phone_number, notificationPref: u.notification_pref, status: u.status, permissions: u.permissions || {} 
            })));
        }

        let fetchedMessages: Message[] = [];
        if (messagesResult.data) {
            fetchedMessages = messagesResult.data.map(m => ({
                id: m.id, userId: m.user_id, channelId: m.channel_id, content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                fullTimestamp: m.created_at, attachments: m.attachments || []
            }));
            setMessages(fetchedMessages);
        }

        if (filesResult.data) {
            setFileLinks(filesResult.data.map(f => ({
                id: f.id, name: f.name, url: f.url, createdBy: f.created_by,
                createdAt: new Date(f.created_at).toISOString().split('T')[0]
            })));
        }

        let loadedChannels: Channel[] = [];
        if (channelsResult.data) {
            loadedChannels = channelsResult.data.map(c => ({ id: c.id, name: c.name, type: c.type, unread: 0 }));
        }
        
        let defaultChannelId = 'general';
        const existingGeneral = loadedChannels.find(c => c.name.toLowerCase().includes('general')) || loadedChannels[0];
        if (existingGeneral) defaultChannelId = existingGeneral.id;

        setChannels(calculateUnreadCounts(loadedChannels, fetchedMessages));
        setCurrentChannelId(defaultChannelId);

        if (tasksResult.data) {
            const allComments = commentsResult.data || [];
            setTasks(mapTasksFromDB(tasksResult.data, allComments));
        }
        setIsLoading(false);
    } catch (e) {
        console.error("Error fetching data", e);
        setIsLoading(false);
    }
  };

  const handleTaskComment = async (taskId: string, content: string) => {
      if(!currentUser) return;
      
      const newId = generateUUID();
      const { error } = await supabase.from('task_comments').insert({ 
          id: newId, 
          task_id: taskId, 
          user_id: currentUser.id, 
          content: content 
      });
      
      if (error) {
          console.error("Error sending comment:", error);
          addNotification("Erreur", "Message non envoyé : " + error.message, "urgent");
      }
  };

  const handleAddFileLink = async (name: string, url: string) => {
      if (!currentUser) return;
      try {
          const { error } = await supabase.from('file_links').insert({ 
              id: generateUUID(), 
              name, 
              url, 
              created_by: currentUser.id 
          });
          if (error) throw error;
          addNotification("Fichier ajouté", "Le lien a été sauvegardé avec succès.", "success");
      } catch (e: any) {
          console.error(e);
          addNotification("Erreur", "Impossible d'ajouter le fichier: " + e.message, "urgent");
      }
  };
  
  const handleDeleteFileLink = async (id: string) => {
      if (!currentUser) return;
      try {
          // IMPORTANT: L'ID passé par Files.tsx a un préfixe "link-", il faut le retirer
          const cleanId = id.replace('link-', '');
          const { error } = await supabase.from('file_links').delete().eq('id', cleanId);
          if (error) throw error;
          addNotification("Suppression", "Le fichier a été supprimé.", "info");
      } catch (e: any) {
          console.error(e);
          addNotification("Erreur", "Impossible de supprimer: " + e.message, "urgent");
      }
  };

  const handleAddTask = async (task: Task) => {
      if (!currentUser) return;
      
      const taskPayload = {
          title: task.title,
          description: task.description,
          assignee_id: task.assigneeId,
          due_date: task.dueDate,
          status: task.status,
          type: task.type,
          priority: task.priority,
          price: task.price
      };

      const { data: newTaskData, error } = await supabase.from('tasks').insert(taskPayload).select().single();

      if (error) {
          console.error("Task Insert Error:", error);
          addNotification("Erreur", `Impossible de créer la tâche: ${error.message}`, "urgent");
          return;
      }

      if (newTaskData && task.attachments && task.attachments.length > 0) {
           const commentsPayload = task.attachments.map(url => ({
               id: generateUUID(), 
               task_id: newTaskData.id,
               user_id: currentUser.id,
               content: `📎 Fichier attaché: ${url}` 
           }));
           
           const { error: commentError } = await supabase.from('task_comments').insert(commentsPayload);
           if (commentError) {
              console.error("Error adding attachments as comments", commentError);
              addNotification("Attention", "Tâche créée mais erreur lors de l'ajout des fichiers.", "urgent");
           }
      }

      addNotification("Succès", "Tâche créée avec succès", "success");
  };

  const handleUpdateTask = async (updatedTask: Task) => {
      if (!currentUser) return;
      
      const taskPayload = {
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: updatedTask.priority,
          due_date: updatedTask.dueDate,
          assignee_id: updatedTask.assigneeId,
          type: updatedTask.type,
          price: updatedTask.price
      };

      const { error } = await supabase.from('tasks').update(taskPayload).eq('id', updatedTask.id);

      if (error) {
          console.error("Task Update Error:", error);
          addNotification("Erreur", "Impossible de mettre à jour la tâche", "urgent");
      } else {
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
          addNotification("Mise à jour", "La tâche a été modifiée.", "info");
      }
  };

  const handleDeleteTask = async (taskId: string) => {
      if (!currentUser) return;
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
          addNotification("Erreur", "Impossible de supprimer la tâche", "urgent");
      } else {
          setTasks(prev => prev.filter(t => t.id !== taskId));
          addNotification("Suppression", "Tâche supprimée.", "info");
      }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) {
          addNotification("Erreur", "Impossible de changer le statut", "urgent");
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      addNotification("Erreur de connexion", error.message || "Identifiants incorrects", "urgent");
      setIsAuthProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name: registerName, role: 'Membre', phone_number: registerPhone } }
      });
      if (error) throw error;
      if (data.user) {
         await supabase.from('users').insert({
            id: data.user.id, name: registerName, email: email, role: 'Membre',
            avatar: `https://ui-avatars.com/api/?name=${registerName}&background=random`,
            phone_number: registerPhone, status: 'active'
         });
         addNotification("Compte créé", "Bienvenue sur iVISION !", "success");
      }
    } catch (error: any) {
      addNotification("Erreur d'inscription", error.message, "urgent");
    } finally { setIsAuthProcessing(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white flex-col">
        <div className="font-bold text-2xl mb-4 text-slate-900"><span className="text-primary">i</span>VISION</div>
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 items-center justify-center p-4 font-sans text-slate-900">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight"><span className="text-primary">i</span>VISION</h1>
            <p className="text-slate-500 mt-2">Plateforme de gestion d'agence</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsRegistering(false)}
            >
              Connexion
            </button>
            <button 
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setIsRegistering(true)}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 animate-in slide-in-from-left duration-300">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                   <div className="relative">
                      <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="John Doe" value={registerName} onChange={e => setRegisterName(e.target.value)} />
                   </div>
                </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                   <div className="relative">
                      <input type="tel" className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="+33 6 12 34 56 78" value={registerPhone} onChange={e => setRegisterPhone(e.target.value)} />
                   </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="email" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="nom@agence.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="password" required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isAuthProcessing}
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/30 flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAuthProcessing ? <Loader2 className="animate-spin mr-2" size={20} /> : (isRegistering ? <UserPlus className="mr-2" size={20} /> : <LogIn className="mr-2" size={20} />)}
              {isAuthProcessing ? 'Traitement...' : (isRegistering ? "Créer un compte" : "Se connecter")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout currentUser={currentUser} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)}>
      {currentView === 'dashboard' && <Dashboard currentUser={currentUser} tasks={tasks} messages={messages} notifications={notifications} onNavigate={setCurrentView} onDeleteTask={handleDeleteTask} unreadMessageCount={channels.reduce((acc, c) => acc + (c.unread || 0), 0)} />}
      {currentView === 'tasks' && <Tasks tasks={tasks} users={users} currentUser={currentUser} onUpdateStatus={handleUpdateStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddComment={handleTaskComment} onAddFileLink={handleAddFileLink} />}
      {currentView === 'chat' && <Chat currentUser={currentUser} users={users} channels={channels} currentChannelId={currentChannelId} messages={messages} onChannelChange={setCurrentChannelId} onSendMessage={async (text, cid, att) => { 
          await supabase.from('messages').insert({ 
              id: generateUUID(),
              user_id: currentUser.id, 
              channel_id: cid, 
              content: text, 
              attachments: att 
          });
      }} onAddChannel={async (c) => { 
          await supabase.from('channels').insert({ 
              id: generateUUID(),
              name: c.name, 
              type: c.type, 
              members: c.members 
          });
      }} onDeleteChannel={async (cid) => {
          await supabase.from('channels').delete().eq('id', cid);
          setChannels(prev => prev.filter(c => c.id !== cid));
          if(currentChannelId === cid) setCurrentChannelId('general');
      }} onReadChannel={(cid) => {
          const key = `ivision_last_read_${currentUser.id}`;
          const current = JSON.parse(localStorage.getItem(key) || '{}');
          current[cid] = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(current));
          setChannels(prev => prev.map(c => c.id === cid ? { ...c, unread: 0 } : c));
      }} />}
      {currentView === 'files' && <Files tasks={tasks} messages={messages} fileLinks={fileLinks} currentUser={currentUser} onAddFileLink={handleAddFileLink} onDeleteFileLink={handleDeleteFileLink} />}
      {currentView === 'team' && <Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onAddUser={async (u) => { await supabase.from('users').insert({ id: generateUUID(), name: u.name, email: u.email, role: u.role, status: 'active', avatar: u.avatar }); }} onRemoveUser={async (uid) => { await supabase.from('users').delete().eq('id', uid); setUsers(prev => prev.filter(u => u.id !== uid)); }} onUpdateRole={async (uid, role) => { await supabase.from('users').update({ role }).eq('id', uid); }} onApproveUser={async (uid) => { await supabase.from('users').update({ status: 'active' }).eq('id', uid); setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: 'active' } : u)); }} onUpdateMember={async (uid, data) => { await supabase.from('users').update(data).eq('id', uid); }} />}
      {currentView === 'settings' && <Settings currentUser={currentUser} onUpdateProfile={async (data) => { await supabase.from('users').update(data).eq('id', currentUser.id); setCurrentUser(prev => prev ? { ...prev, ...data } : null); addNotification("Profil mis à jour", "Vos modifications ont été enregistrées.", "success"); }} />}
      {currentView === 'reports' && <Reports currentUser={currentUser} tasks={tasks} users={users} />}
      {currentView === 'campaigns' && <Campaigns currentUser={currentUser} campaignsData={[]} tasks={tasks} users={users} />}
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
    </Layout>
  );
};

export default App;