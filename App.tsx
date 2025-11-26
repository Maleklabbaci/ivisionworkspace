
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { LogIn, Lock, Mail, UserPlus, ArrowLeft, User as UserIcon, Loader2, AlertCircle, Info } from 'lucide-react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, ViewState, Task, TaskStatus, Channel, ActivityLog, ToastNotification, Message, Comment, FileLink, Subtask } from './types';

// Lazy Load Components pour optimiser le chargement initial
const Dashboard = lazy(() => import('./components/Dashboard'));
const Tasks = lazy(() => import('./components/Tasks'));
const Chat = lazy(() => import('./components/Chat'));
const Team = lazy(() => import('./components/Team'));
const Files = lazy(() => import('./components/Files'));
const Settings = lazy(() => import('./components/Settings'));
const Reports = lazy(() => import('./components/Reports'));
const Campaigns = lazy(() => import('./components/Campaigns'));

// Robust UUID generator safe for all contexts
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  let d = new Date().getTime(); 
  let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; 
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

// Helper to safely stringify errors
const safeErrorMsg = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    try {
        return JSON.stringify(error);
    } catch (e) {
        return "Erreur inconnue";
    }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [fileLinks, setFileLinks] = useState<FileLink[]>([]); 
  
  // Presence State
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState('general');
  
  const currentChannelIdRef = useRef(currentChannelId);

  const [isLoading, setIsLoading] = useState(true); 
  const [isAuthProcessing, setIsAuthProcessing] = useState(false); 
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const isDataLoaded = useRef(false);

  useEffect(() => {
    currentChannelIdRef.current = currentChannelId;
  }, [currentChannelId]);

  const addNotification = useCallback((title: string, message: any, type: 'info' | 'success' | 'urgent' = 'info') => {
    const id = generateUUID();
    const safeMessage = safeErrorMsg(message);
    setNotifications(prev => [...prev, { id, title, message: safeMessage, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

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

  const mapTasksFromDB = (tasksData: any[], commentsData: any[], subtasksData: any[]): Task[] => {
      return tasksData.map((t) => {
          const taskComments = commentsData
              .filter(c => c.task_id === t.id)
              .map(c => ({
                  id: c.id, 
                  userId: c.user_id, 
                  content: c.content,
                  timestamp: new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  fullTimestamp: c.created_at 
              }));
          
          const derivedAttachments = extractAttachmentsFromComments(taskComments);

          const taskSubtasks = subtasksData
              .filter(s => s.task_id === t.id)
              .map(s => ({
                  id: s.id,
                  taskId: s.task_id,
                  title: s.title,
                  isCompleted: s.is_completed
              }));

          return {
              id: t.id, title: t.title, description: t.description, assigneeId: t.assignee_id,
              dueDate: t.due_date, status: t.status as TaskStatus, type: t.type, priority: t.priority,
              comments: taskComments, 
              attachments: derivedAttachments, 
              subtasks: taskSubtasks,
              price: t.price
          };
      });
  };

  useEffect(() => {
    if (!currentUser) return;
    const updatePresence = async () => {
      await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', currentUser.id);
    };
    updatePresence();
    const interval = setInterval(updatePresence, 120000);
    return () => clearInterval(interval);
  }, [currentUser]);

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
        setOnlineUserIds(new Set());
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

  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
             presences.forEach((p: any) => {
                 if(p.user_id) onlineIds.add(p.user_id);
             });
        });
        setOnlineUserIds(onlineIds);
      })
      .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
              await presenceChannel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
          }
      });

    const messageChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const eventType = payload.eventType;
        if (eventType === 'INSERT') {
            const newMsg = payload.new as any;
            if (messages.some(m => m.id === newMsg.id)) return;

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

    const commentChannel = supabase
      .channel('public:task_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, async (payload) => {
        const { data: tasksData } = await supabase.from('tasks').select('*');
        const { data: commentsData } = await supabase.from('task_comments').select('*');
        const { data: subtasksData } = await supabase.from('subtasks').select('*');
        
        if (tasksData && commentsData && subtasksData) {
           setTasks(mapTasksFromDB(tasksData, commentsData, subtasksData));
        }
      })
      .subscribe();

    const filesChannel = supabase
      .channel('public:file_links')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'file_links' }, (payload) => {
         if (payload.eventType === 'INSERT') {
            const newLink = payload.new as any;
            setFileLinks(prev => {
                if (prev.some(f => f.id === newLink.id)) return prev;
                return [...prev, {
                    id: newLink.id,
                    name: newLink.name,
                    url: newLink.url,
                    createdBy: newLink.created_by,
                    createdAt: new Date(newLink.created_at).toISOString().split('T')[0]
                }];
            });
         } else if (payload.eventType === 'DELETE') {
             const deletedId = (payload.old as any).id;
             setFileLinks(prev => prev.filter(f => f.id !== deletedId));
         }
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
          const { data: tasksData } = await supabase.from('tasks').select('*');
          const { data: commentsData } = await supabase.from('task_comments').select('*');
          const { data: subtasksData } = await supabase.from('subtasks').select('*');
          
          if (tasksData && commentsData && subtasksData) {
             setTasks(mapTasksFromDB(tasksData, commentsData, subtasksData));
          }
      })
      .subscribe();

    const subtasksChannel = supabase
      .channel('public:subtasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, async (payload) => {
          const { data: tasksData } = await supabase.from('tasks').select('*');
          const { data: commentsData } = await supabase.from('task_comments').select('*');
          const { data: subtasksData } = await supabase.from('subtasks').select('*');
          
          if (tasksData && commentsData && subtasksData) {
             setTasks(mapTasksFromDB(tasksData, commentsData, subtasksData));
          }
      })
      .subscribe();

    const usersChannel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
              const updatedUser = payload.new as any;
              setUsers(prev => prev.map(u => 
                 u.id === updatedUser.id ? { 
                     ...u, 
                     name: updatedUser.name,
                     role: updatedUser.role,
                     status: updatedUser.status,
                     permissions: updatedUser.permissions,
                     lastSeen: updatedUser.last_seen 
                 } : u
              ));
          }
          if (payload.eventType === 'INSERT') {
               const newUser = payload.new as any;
               setUsers(prev => {
                   if(prev.some(u => u.id === newUser.id)) return prev;
                   return [...prev, {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role,
                        avatar: newUser.avatar,
                        status: newUser.status,
                        permissions: newUser.permissions,
                        notificationPref: newUser.notification_pref || 'all',
                        phoneNumber: newUser.phone_number,
                        lastSeen: newUser.last_seen
                   }];
               });
          }
          if (payload.eventType === 'DELETE') {
               const deletedId = (payload.old as any).id;
               setUsers(prev => prev.filter(u => u.id !== deletedId));
          }
      })
      .subscribe();

    return () => {
      supabase.removeAllChannels();
    };
  }, [currentUser, addNotification]); 

  const fetchUserProfile = async (userId: string) => {
    try {
        const { data } = await supabase.from('users').select('*').eq('id', userId).single();
        if (data) {
            setCurrentUser({
                id: data.id, name: data.name, email: data.email, role: data.role as UserRole, avatar: data.avatar,
                phoneNumber: data.phone_number, notificationPref: data.notification_pref, status: data.status,
                permissions: data.permissions || {}, lastSeen: data.last_seen
            });
        }
    } catch (e) { console.error(e); }
  };

  const fetchInitialData = async (userId?: string) => {
    try {
        const [usersResult, channelsResult, messagesResult, tasksResult, commentsResult, filesResult, subtasksResult] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('channels').select('*'),
            supabase.from('messages').select('*').order('created_at', { ascending: true }),
            supabase.from('tasks').select('*'),
            supabase.from('task_comments').select('*').order('created_at', { ascending: true }),
            supabase.from('file_links').select('*').order('created_at', { ascending: false }),
            supabase.from('subtasks').select('*').order('created_at', { ascending: true })
        ]);

        if (usersResult.data) {
            setUsers(usersResult.data.map(u => ({
                id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar,
                phoneNumber: u.phone_number, notificationPref: u.notification_pref, status: u.status, permissions: u.permissions || {},
                lastSeen: u.last_seen
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
            loadedChannels = channelsResult.data.map(c => ({ id: c.id, name: c.name, type: c.type, unread: 0, members: c.members }));
        }
        
        let defaultChannelId = 'general';
        const existingGeneral = loadedChannels.find(c => c.name.toLowerCase().includes('general')) || loadedChannels[0];
        if (existingGeneral) defaultChannelId = existingGeneral.id;

        setChannels(calculateUnreadCounts(loadedChannels, fetchedMessages));
        setCurrentChannelId(defaultChannelId);

        if (tasksResult.data) {
            setTasks(mapTasksFromDB(tasksResult.data, commentsResult.data || [], subtasksResult.data || []));
        }
        setIsLoading(false);
    } catch (e) {
        console.error("Error fetching data", e);
        setIsLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleAddSubtask = useCallback(async (taskId: string, title: string) => {
      if (!currentUser) return;
      const id = generateUUID();
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { id, taskId, title, isCompleted: false }] } : t));
      const { error } = await supabase.from('subtasks').insert({ id, task_id: taskId, title, is_completed: false });
      if (error) addNotification("Erreur", "Impossible d'ajouter la sous-tâche", "urgent");
  }, [currentUser, addNotification]);

  const handleToggleSubtask = useCallback(async (taskId: string, subtaskId: string, isCompleted: boolean) => {
      if (!currentUser) return;
      setTasks(prev => prev.map(t => t.id === taskId && t.subtasks ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, isCompleted } : s) } : t));
      const { error } = await supabase.from('subtasks').update({ is_completed: isCompleted }).eq('id', subtaskId);
      if (error) addNotification("Erreur", "Impossible de mettre à jour", "urgent");
  }, [currentUser, addNotification]);

  const handleDeleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
      if (!currentUser) return;
      setTasks(prev => prev.map(t => t.id === taskId && t.subtasks ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) } : t));
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
      if (error) addNotification("Erreur", "Impossible de supprimer", "urgent");
  }, [currentUser, addNotification]);

  const handleAddUser = useCallback(async (user: User) => {
      if (!currentUser) return;
      const finalId = (user.id && !user.id.startsWith('temp')) ? user.id : generateUUID();
      const optimisticUser: User = { ...user, id: finalId, status: 'active' };
      setUsers(prev => [...prev, optimisticUser]);
      addNotification("Succès", `${user.name} a été ajouté.`, "success");
      const { error } = await supabase.from('users').insert({
          id: finalId, name: optimisticUser.name, email: optimisticUser.email, role: optimisticUser.role,
          avatar: optimisticUser.avatar, status: optimisticUser.status, permissions: optimisticUser.permissions, phone_number: optimisticUser.phoneNumber
      });
      if (error) {
          setUsers(prev => prev.filter(u => u.id !== finalId));
          addNotification("Erreur", "Impossible d'ajouter l'utilisateur: " + safeErrorMsg(error), "urgent");
      }
  }, [currentUser, addNotification]);

  const handleRemoveUser = useCallback(async (userId: string) => {
      const previousUsers = users;
      setUsers(prev => prev.filter(u => u.id !== userId));
      addNotification("Suppression", "Membre supprimé.", "info");
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
          setUsers(previousUsers);
          addNotification("Erreur", "Echec suppression: " + safeErrorMsg(error), "urgent");
      }
  }, [users, addNotification]);

  const handleUpdateUser = useCallback(async (userId: string, data: Partial<User>) => {
      const previousUsers = users;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
      addNotification("Mise à jour", "Modifications enregistrées.", "success");
      const dbUpdates: any = {};
      if (data.name !== undefined) dbUpdates.name = data.name;
      if (data.email !== undefined) dbUpdates.email = data.email;
      if (data.role !== undefined) dbUpdates.role = data.role;
      if (data.status !== undefined) dbUpdates.status = data.status;
      if (data.permissions !== undefined) dbUpdates.permissions = data.permissions;
      if (data.phoneNumber !== undefined) dbUpdates.phone_number = data.phoneNumber;
      if (Object.keys(dbUpdates).length === 0) return;
      const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);
      if (error) {
          setUsers(previousUsers);
          addNotification("Erreur", "Echec mise à jour: " + safeErrorMsg(error), "urgent");
      }
  }, [users, addNotification]);

  const handleTaskComment = useCallback(async (taskId: string, content: string) => {
      if(!currentUser) return;
      const newId = generateUUID();
      const now = new Date();
      const optimisticComment: Comment = {
          id: newId, userId: currentUser.id, content: content, 
          timestamp: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), fullTimestamp: now.toISOString()
      };
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...(t.comments || []), optimisticComment] } : t));
      const { error } = await supabase.from('task_comments').insert({ id: newId, task_id: taskId, user_id: currentUser.id, content: content });
      if (error) {
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: t.comments?.filter(c => c.id !== newId) } : t));
          addNotification("Erreur", "Message non envoyé: " + safeErrorMsg(error), "urgent");
      }
  }, [currentUser, addNotification]);

  const handleSendMessage = useCallback(async (text: string, channelId: string, attachments?: string[]) => {
      if (!currentUser) return;
      
      // Resolving Channel ID logic (Self Healing)
      let targetChannelId = channelId;
      if (targetChannelId === 'general') {
          const realGeneral = channels.find(c => c.name.toLowerCase().includes('general'));
          if (realGeneral) {
              targetChannelId = realGeneral.id;
          } else {
              // Create it if missing
              const newId = generateUUID();
              setChannels(prev => [...prev, { id: newId, name: 'Général', type: 'global', unread: 0 }]);
              const { error } = await supabase.from('channels').insert({ id: newId, name: 'Général', type: 'global' });
              if (!error) targetChannelId = newId;
              else {
                  addNotification("Erreur Technique", "Impossible de localiser le canal Général.", "urgent");
                  return;
              }
          }
          setCurrentChannelId(targetChannelId); // Sync state
      }

      const newId = generateUUID();
      const now = new Date();
      const optimisticMsg: Message = {
          id: newId, userId: currentUser.id, channelId: targetChannelId, content: text, 
          timestamp: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), fullTimestamp: now.toISOString(), attachments: attachments || []
      };
      setMessages(prev => [...prev, optimisticMsg]);
      const { error } = await supabase.from('messages').insert({ id: newId, user_id: currentUser.id, channel_id: targetChannelId, content: text, attachments: attachments });
      if (error) {
          setMessages(prev => prev.filter(m => m.id !== newId));
          addNotification("Erreur", "Message non envoyé", "urgent");
      }
  }, [currentUser, channels, addNotification]);

  const handleAddFileLink = useCallback(async (name: string, url: string) => {
      if (!currentUser) return;
      const id = generateUUID();
      const now = new Date();
      
      // Optimistic UI Update
      const optimisticLink: FileLink = {
          id, name, url, createdBy: currentUser.id, createdAt: now.toISOString().split('T')[0]
      };
      setFileLinks(prev => [optimisticLink, ...prev]);
      addNotification("Fichier ajouté", "Le lien a été ajouté avec succès.", "success");

      try {
          const { error } = await supabase.from('file_links').insert({ id, name, url, created_by: currentUser.id });
          if (error) throw error;
      } catch (e: any) {
          setFileLinks(prev => prev.filter(f => f.id !== id));
          addNotification("Erreur", "Impossible d'ajouter le fichier: " + safeErrorMsg(e), "urgent");
      }
  }, [currentUser, addNotification]);
  
  const handleGlobalFileDelete = useCallback(async (compositeId: string) => {
      if (!currentUser) return;
      try {
          if (compositeId.startsWith('link|')) {
             const cleanId = compositeId.split('|')[1];
             setFileLinks(prev => prev.filter(f => f.id !== cleanId)); // Optimistic
             const { error } = await supabase.from('file_links').delete().eq('id', cleanId);
             if(error) throw error;
          } else if (compositeId.startsWith('task|')) {
             const parts = compositeId.split('|');
             if(parts.length >= 3) {
                 const commentId = parts[2];
                 const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
                 if(error) throw error;
             }
          } else if (compositeId.startsWith('chat|')) {
             const parts = compositeId.split('|');
             if(parts.length >= 3) {
                 const msgId = parts[1];
                 const fileName = parts.slice(2).join('|'); 
                 const { data: msgData, error: fetchError } = await supabase.from('messages').select('attachments').eq('id', msgId).single();
                 if(fetchError) throw fetchError;
                 if(msgData && msgData.attachments) {
                     const updatedAttachments = msgData.attachments.filter((a: string) => a !== fileName);
                     const { error: updateError } = await supabase.from('messages').update({ attachments: updatedAttachments }).eq('id', msgId);
                     if(updateError) throw updateError;
                 }
             }
          }
          addNotification("Suppression", "Le fichier a été supprimé.", "info");
      } catch (e: any) {
          addNotification("Erreur", "Impossible de supprimer: " + safeErrorMsg(e), "urgent");
      }
  }, [currentUser, addNotification]);

  const handleDeleteTaskAttachment = useCallback(async (taskId: string, url: string) => {
      if (!currentUser) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.comments) return;
      const commentToDelete = task.comments.find(c => c.content.includes(url));
      if (commentToDelete) {
          try {
             setTasks(prev => prev.map(t => t.id === taskId && t.comments ? { ...t, comments: t.comments.filter(c => c.id !== commentToDelete.id) } : t));
             const { error } = await supabase.from('task_comments').delete().eq('id', commentToDelete.id);
             if (error) throw error;
          } catch (e: any) {
             addNotification("Erreur", "Echec suppression: " + safeErrorMsg(e), "urgent");
          }
      }
  }, [currentUser, tasks, addNotification]);

  const handleDeleteComment = useCallback(async (taskId: string, commentId: string) => {
      if (!currentUser) return;
      const prevTasks = tasks;
      setTasks(prev => prev.map(t => t.id !== taskId ? t : { ...t, comments: t.comments?.filter(c => c.id !== commentId) }));
      try {
          const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
          if (error) throw error;
      } catch (e: any) {
          setTasks(prevTasks);
          addNotification("Erreur", "Impossible de supprimer le commentaire.", "urgent");
      }
  }, [currentUser, tasks, addNotification]);

  const handleAddTask = useCallback(async (task: Task) => {
      if (!currentUser) return;
      const newTaskId = generateUUID();
      
      // Optimistic UI - Include attachments immediately as comments-like structure if needed visually
      const optimisticTask: Task = { ...task, id: newTaskId };
      setTasks(prev => [...prev, optimisticTask]);
      addNotification("Succès", "Tâche créée avec succès", "success");

      // Separate Insert: Task
      const taskPayload = {
          id: newTaskId, title: task.title, description: task.description, assignee_id: task.assigneeId,
          due_date: task.dueDate, status: task.status, type: task.type, priority: task.priority, price: task.price
      };
      
      const { data: newTaskData, error } = await supabase.from('tasks').insert(taskPayload).select().single();
      
      if (error) {
          setTasks(prev => prev.filter(t => t.id !== newTaskId));
          addNotification("Erreur", `Impossible de créer la tâche: ${safeErrorMsg(error)}`, "urgent");
          return;
      }

      // Separate Insert: Attachments as Comments
      if (newTaskData && task.attachments && task.attachments.length > 0) {
           const commentsPayload = task.attachments.map(url => ({
               id: generateUUID(), task_id: newTaskData.id, user_id: currentUser.id, content: `📎 Fichier attaché: ${url}` 
           }));
           
           const { error: commentsError } = await supabase.from('task_comments').insert(commentsPayload);
           if(commentsError) {
                addNotification("Attention", "Tâche créée mais les fichiers n'ont pas pu être attachés.", "urgent");
           }
      }
  }, [currentUser, addNotification]);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
      if (!currentUser) return;
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      const taskPayload = {
          title: updatedTask.title, description: updatedTask.description, status: updatedTask.status,
          priority: updatedTask.priority, due_date: updatedTask.dueDate, assignee_id: updatedTask.assigneeId,
          type: updatedTask.type, price: updatedTask.price
      };
      const { error } = await supabase.from('tasks').update(taskPayload).eq('id', updatedTask.id);
      if (error) addNotification("Erreur", "Impossible de mettre à jour la tâche", "urgent");
  }, [currentUser, addNotification]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
      if (!currentUser) return;
      const previousTasks = tasks; 
      setTasks(prev => prev.filter(t => t.id !== taskId));
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) { setTasks(previousTasks); addNotification("Erreur", "Impossible de supprimer la tâche", "urgent"); } 
      else { addNotification("Suppression", "Tâche supprimée.", "info"); }
  }, [currentUser, tasks, addNotification]);

  const handleUpdateStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
      const previousTasks = tasks;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) { setTasks(previousTasks); addNotification("Erreur", "Impossible de changer le statut", "urgent"); }
  }, [tasks, addNotification]);

  const handleAddChannel = useCallback(async (channel: { name: string; type: 'global' | 'project'; members?: string[] }) => {
      const id = generateUUID();
      setChannels(prev => [...prev, { id, name: channel.name, type: channel.type, unread: 0, members: channel.members }]);
      const { error } = await supabase.from('channels').insert({ id, name: channel.name, type: channel.type });
      if (error) {
          setChannels(prev => prev.filter(c => c.id !== id));
          addNotification("Erreur", "Impossible de créer le canal", "urgent");
      }
  }, [addNotification]);

  const handleDeleteChannel = useCallback(async (channelId: string) => {
      const previousChannels = channels;
      setChannels(prev => prev.filter(c => c.id !== channelId));
      const { error } = await supabase.from('channels').delete().eq('id', channelId);
      if (error) {
          setChannels(previousChannels);
          addNotification("Erreur", "Impossible de supprimer le canal", "urgent");
      }
  }, [channels, addNotification]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        addNotification('Erreur', error.message, 'urgent');
        setIsAuthProcessing(false);
    } else {
        addNotification('Bienvenue', 'Connexion réussie.', 'success');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !registerName) { addNotification('Erreur', 'Champs manquants.', 'urgent'); return; }
    setIsAuthProcessing(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { name: registerName, avatar: `https://ui-avatars.com/api/?name=${registerName.replace(' ', '+')}&background=random` } }
    });
    if (authError) {
        addNotification('Erreur', authError.message, 'urgent');
        setIsAuthProcessing(false);
    } else if (authData.user) {
        addNotification('Compte créé', 'Connexion en cours...', 'success');
    } else {
        addNotification('Info', 'Vérifiez vos emails.', 'info');
        setIsAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setTasks([]); setMessages([]); setFileLinks([]);
  };

  const handleUpdateProfile = async (updatedData: Partial<User> & { password?: string }) => {
    if (!currentUser) return;
    if (updatedData.password) {
        const { error } = await supabase.auth.updateUser({ password: updatedData.password });
        if(error) { addNotification("Erreur Mot de Passe", error.message, "urgent"); return; }
    }
    const { error } = await supabase.from('users').update({ name: updatedData.name, email: updatedData.email, phone_number: updatedData.phoneNumber, avatar: updatedData.avatar }).eq('id', currentUser.id);
    if (!error) { 
        setCurrentUser({ ...currentUser, ...updatedData }); 
        addNotification("Profil mis à jour", "Vos modifications ont été enregistrées.", 'success'); 
    } else {
        addNotification("Erreur", "Echec de la mise à jour du profil.", "urgent");
    }
  };

  const handleApproveUser = async (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
      if(error) addNotification("Erreur", "Validation échouée", "urgent");
  };

  const handleUpdateMember = async (userId: string, updatedData: Partial<User>) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
      try {
          const dbData: any = {};
          if(updatedData.role) dbData.role = updatedData.role;
          if(updatedData.permissions) dbData.permissions = updatedData.permissions;
          const { error } = await supabase.from('users').update(dbData).eq('id', userId);
          if(error) throw error;
          addNotification('Succès', 'Permissions mises à jour.', 'success');
      } catch (e: any) {
          const { error } = await supabase.from('users').update({ role: updatedData.role }).eq('id', userId);
          if(!error) addNotification('Info', 'Rôle mis à jour, mais les permissions avancées nécessitent une mise à jour de la base de données.', 'info');
          else addNotification('Erreur', safeErrorMsg(e), 'urgent');
      }
  };

  // Navigation helper component to use hook inside App
  const NavigationHandler = ({ navigate }: { navigate: (view: ViewState) => void }) => {
      const nav = useNavigate();
      // expose nav? No, just use useNavigate inside components.
      // But we passed onNavigate prop to Dashboard.
      // Dashboard uses it.
      // Let's fix Dashboard to use useNavigate internally or pass a wrapper.
      return null; 
  }

  const handleNavigate = (view: ViewState) => {
      // This function is deprecated with Router but kept for compatibility if needed
      // With Router, components use useNavigate()
  }

  if (!isConfigured) return <div className="h-screen w-screen flex items-center justify-center"><p>Configuration manquante.</p></div>;
  if (isLoading) return null;

  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight"><span className="text-primary">i</span>VISION AGENCY</h1>
            <p className="text-slate-500">{isRegistering ? "Créer un nouveau compte" : "Connexion Espace de Travail"}</p>
          </div>
          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-5">
               <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label><div className="relative group"><UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Jean Dupont" required /></div></div>
               <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><div className="relative group"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="nom@ivision.com" required /></div></div>
               <div><label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label><div className="relative group"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Créer un mot de passe" required /></div></div>
               <button type="submit" disabled={isAuthProcessing} className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-70">{isAuthProcessing ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}<span>S'inscrire</span></button>
               <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-slate-500 text-sm font-medium hover:text-slate-800 py-2 flex items-center justify-center"><ArrowLeft size={14} className="mr-2" /> Retour à la connexion</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label><div className="relative group"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none" placeholder="nom@ivision.com" required /></div></div>
              <div><div className="flex justify-between items-center mb-1"><label className="block text-sm font-medium text-slate-700">Mot de passe</label></div><div className="relative group"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" /></div></div>
              <div className="flex flex-col space-y-3"><button type="submit" disabled={isAuthProcessing} className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-70">{isAuthProcessing ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}<span>Connexion</span></button><button type="button" onClick={() => setIsRegistering(true)} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2"><UserPlus size={18} /><span>Créer un compte</span></button></div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const unreadCount = channels.reduce((acc, c) => acc + (c.unread || 0), 0);

  // Wrapper to pass navigation prop to Dashboard which might still use it,
  // though ideally Dashboard should be refactored to use useNavigate too.
  // For now, we pass a dummy function or wrap useNavigate.
  const DashboardWrapper = () => {
      const navigate = useNavigate();
      return <Dashboard 
        currentUser={currentUser} 
        tasks={tasks} 
        messages={messages} 
        notifications={notifications} 
        channels={channels} 
        onNavigate={(view) => navigate(`/${view}`)} 
        onDeleteTask={handleDeleteTask} 
        unreadMessageCount={unreadCount} 
      />;
  }

  return (
    <HashRouter>
        <Layout currentUser={currentUser} onLogout={handleLogout} unreadMessageCount={unreadCount}>
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardWrapper />} />
                <Route path="/reports" element={<Reports currentUser={currentUser} tasks={tasks} users={users} />} />
                <Route path="/tasks" element={<Tasks tasks={tasks} users={users.filter(u => u.status === 'active')} currentUser={currentUser} onUpdateStatus={handleUpdateStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddComment={handleTaskComment} onAddFileLink={handleAddFileLink} onDeleteAttachment={handleDeleteTaskAttachment} onDeleteComment={handleDeleteComment} handleAddSubtask={handleAddSubtask} handleToggleSubtask={handleToggleSubtask} handleDeleteSubtask={handleDeleteSubtask} />} />
                <Route path="/chat" element={<Chat currentUser={currentUser} users={users.filter(u => u.status === 'active')} channels={channels.length > 0 ? channels : [{ id: 'general', name: 'Général', type: 'global' }]} currentChannelId={currentChannelId} messages={messages} onlineUserIds={onlineUserIds} onChannelChange={setCurrentChannelId} onSendMessage={handleSendMessage} onAddChannel={handleAddChannel} onDeleteChannel={handleDeleteChannel} />} />
                <Route path="/files" element={currentUser && <Files tasks={tasks} messages={messages} fileLinks={fileLinks} currentUser={currentUser} onAddFileLink={handleAddFileLink} onDeleteFileLink={handleGlobalFileDelete} />} />
                <Route path="/team" element={<Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onlineUserIds={onlineUserIds} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} onUpdateRole={(userId, role) => handleUpdateMember(userId, { role })} onApproveUser={handleApproveUser} onUpdateMember={handleUpdateMember} />} />
                <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />} />
                <Route path="/campaigns" element={<Campaigns currentUser={currentUser} campaignsData={[]} tasks={tasks} users={users} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Suspense>
        </Layout>
    </HashRouter>
  );
};

export default App;
