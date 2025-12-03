

import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { LogIn, Lock, Mail, UserPlus, ArrowLeft, User as UserIcon, Loader2, AlertCircle, Info } from 'lucide-react';
import { supabase, isConfigured } from './services/supabaseClient';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { User, UserRole, ViewState, Task, TaskStatus, Channel, ActivityLog, ToastNotification, Message, Comment, FileLink, Subtask, Client } from './types';

// Lazy Load Components pour optimiser le chargement initial
const Dashboard = lazy(() => import('./components/Dashboard'));
const Tasks = lazy(() => import('./components/Tasks'));
const Chat = lazy(() => import('./components/Chat'));
const Team = lazy(() => import('./components/Team'));
const Files = lazy(() => import('./components/Files'));
const Settings = lazy(() => import('./components/Settings'));
const Reports = lazy(() => import('./components/Reports'));
const Clients = lazy(() => import('./components/Clients'));

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
  const [clients, setClients] = useState<Client[]>([]); 
  
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

  // Request Notification Permission on Login
  useEffect(() => {
    if (currentUser && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(err => console.error("Erreur permission notification:", err));
    }
  }, [currentUser]);

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
              price: t.price,
              clientId: t.client_id
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
        setClients([]);
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
                }
                
                // MENTION & NOTIFICATION LOGIC
                const myMentionTag = `@${currentUser.name.replace(/\s+/g, '')}`;
                if (newMsg.content.includes(myMentionTag)) {
                    // 1. Toast Notification
                    addNotification("Nouvelle mention !", "Vous avez été mentionné dans le chat.", "info");

                    // 2. Push Notification (Async & Permissions Check)
                    const sendPush = async () => {
                        if (!("Notification" in window)) return;
                        
                        let permission = Notification.permission;
                        if (permission === 'default') {
                            permission = await Notification.requestPermission();
                        }

                        if (permission === 'granted') {
                            const notif = new Notification(`Mention dans iVISION`, {
                                body: newMsg.content,
                                icon: '/favicon.ico', // Fallback
                                tag: `mention-${newMsg.id}`
                            });
                            
                            notif.onclick = () => {
                                window.focus();
                                setCurrentChannelId(newMsg.channel_id);
                            };
                        }
                    };
                    sendPush().catch(err => console.error("Push Notification Failed", err));
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
                    clientId: newLink.client_id,
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
      
    const clientsChannel = supabase
      .channel('public:clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
          if (payload.eventType === 'INSERT') {
             setClients(prev => [...prev, payload.new as Client]);
          } else if (payload.eventType === 'UPDATE') {
             setClients(prev => prev.map(c => c.id === payload.new.id ? payload.new as Client : c));
          } else if (payload.eventType === 'DELETE') {
             setClients(prev => prev.filter(c => c.id !== payload.old.id));
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
        const [usersResult, channelsResult, messagesResult, tasksResult, commentsResult, filesResult, subtasksResult, clientsResult] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('channels').select('*'),
            supabase.from('messages').select('*').order('created_at', { ascending: true }),
            supabase.from('tasks').select('*'),
            supabase.from('task_comments').select('*').order('created_at', { ascending: true }),
            supabase.from('file_links').select('*').order('created_at', { ascending: false }),
            supabase.from('subtasks').select('*').order('created_at', { ascending: true }),
            supabase.from('clients').select('*')
        ]);

        if (usersResult.data) {
            setUsers(usersResult.data.map(u => ({
                id: u.id, name: u.name, email: u.email, role: u.role as UserRole, avatar: u.avatar,
                phoneNumber: u.phone_number, notificationPref: u.notification_pref, status: u.status, permissions: u.permissions || {},
                lastSeen: u.last_seen
            })));
        }

        if (clientsResult.data) {
            setClients(clientsResult.data as Client[]);
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
                id: f.id, name: f.name, url: f.url, clientId: f.client_id, createdBy: f.created_by,
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
              const { error } = await supabase.from('channels').insert({ id: newId, name: 'Général', type: 'global', created_by: currentUser.id });
              if (!error) targetChannelId = newId;
          }
      }

      const newMessageId = generateUUID();
      const now = new Date();
      
      const optimisticMsg: Message = {
        id: newMessageId,
        userId: currentUser.id,
        channelId: targetChannelId,
        content: text,
        timestamp: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        fullTimestamp: now.toISOString(),
        attachments: attachments || []
      };

      setMessages(prev => [...prev, optimisticMsg]);

      const { error } = await supabase.from('messages').insert({
        id: newMessageId,
        channel_id: targetChannelId,
        user_id: currentUser.id,
        content: text,
        attachments: attachments || []
      });

      if (error) {
         setMessages(prev => prev.filter(m => m.id !== newMessageId));
         addNotification("Erreur", "Message non envoyé: " + safeErrorMsg(error), "urgent");
      }
  }, [currentUser, channels, addNotification]);

  const handleAddTask = useCallback(async (task: Task) => {
    if(!currentUser) return;
    const finalId = task.id.startsWith('temp') ? generateUUID() : task.id;
    const newTask = { ...task, id: finalId };
    setTasks(prev => [...prev, newTask]);
    addNotification("Tâche créée", "La tâche a été ajoutée avec succès.", "success");
    // Ensure client_id is null if empty string
    const clientIdValue = newTask.clientId && newTask.clientId.trim() !== "" ? newTask.clientId : null;

    const { error } = await supabase.from('tasks').insert({
        id: finalId, title: newTask.title, description: newTask.description,
        assignee_id: newTask.assigneeId, due_date: newTask.dueDate, status: newTask.status,
        type: newTask.type, priority: newTask.priority, price: newTask.price || 0,
        client_id: clientIdValue
    });
    if (error) {
        setTasks(prev => prev.filter(t => t.id !== finalId));
        addNotification("Erreur", "Echec création tâche: " + safeErrorMsg(error), "urgent");
    }
  }, [currentUser, addNotification]);

  const handleUpdateTask = useCallback(async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    // Ensure client_id is null if empty string
    const clientIdValue = task.clientId && task.clientId.trim() !== "" ? task.clientId : null;

    const { error } = await supabase.from('tasks').update({
        title: task.title, description: task.description, assignee_id: task.assigneeId,
        due_date: task.dueDate, status: task.status, type: task.type, priority: task.priority, price: task.price,
        client_id: clientIdValue
    }).eq('id', task.id);
    if (error) addNotification("Erreur", "Echec mise à jour tâche", "urgent");
  }, [addNotification]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) addNotification("Erreur", "Echec suppression tâche", "urgent");
  }, [addNotification]);

  const handleUpdateStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) addNotification("Erreur", "Echec mise à jour statut", "urgent");
  }, [addNotification]);

  const handleAddFileLink = useCallback(async (name: string, url: string, clientId?: string) => {
      if(!currentUser) return;
      const newId = generateUUID();
      const clientIdValue = clientId && clientId.trim() !== "" ? clientId : null;

      const optimisticLink: FileLink = {
          id: newId, name, url, clientId: clientIdValue || undefined, createdBy: currentUser.id, createdAt: new Date().toISOString().split('T')[0]
      };
      setFileLinks(prev => [optimisticLink, ...prev]);
      const { error } = await supabase.from('file_links').insert({
          id: newId, name, url, client_id: clientIdValue, created_by: currentUser.id
      });
      if (error) {
          setFileLinks(prev => prev.filter(f => f.id !== newId));
          addNotification("Erreur", "Echec ajout lien", "urgent");
      } else {
          addNotification("Succès", "Lien ajouté à la bibliothèque", "success");
      }
  }, [currentUser, addNotification]);

  const handleDeleteFileLink = useCallback(async (id: string) => {
      setFileLinks(prev => prev.filter(f => f.id !== id));
      const { error } = await supabase.from('file_links').delete().eq('id', id);
      if (error) addNotification("Erreur", "Echec suppression lien", "urgent");
  }, [addNotification]);
  
  const handleAddClient = useCallback(async (client: Client) => {
      const newId = generateUUID();
      const newClient = { ...client, id: newId };
      setClients(prev => [...prev, newClient]);
      addNotification("Succès", "Client ajouté.", "success");
      const { error } = await supabase.from('clients').insert({
          id: newId, name: client.name, company: client.company, email: client.email, phone: client.phone, address: client.address, description: client.description
      });
      if (error) addNotification("Erreur", "Impossible d'ajouter le client", "urgent");
  }, [addNotification]);

  const handleUpdateClient = useCallback(async (client: Client) => {
      setClients(prev => prev.map(c => c.id === client.id ? client : c));
      addNotification("Succès", "Informations client mises à jour.", "success");
      const { error } = await supabase.from('clients').update({
          name: client.name, company: client.company, email: client.email, phone: client.phone, address: client.address, description: client.description
      }).eq('id', client.id);
      if (error) addNotification("Erreur", "Impossible de mettre à jour le client", "urgent");
  }, [addNotification]);

  const handleDeleteClient = useCallback(async (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      addNotification("Info", "Client supprimé.", "info");
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) addNotification("Erreur", "Impossible de supprimer le client", "urgent");
  }, [addNotification]);

  const handleCreateChannel = useCallback(async (channel: { name: string; type: 'global' | 'project'; members?: string[] }) => {
      if(!currentUser) return;
      const newId = generateUUID();
      const optimisticChannel: Channel = {
          id: newId, name: channel.name, type: channel.type, unread: 0, members: channel.members
      };
      setChannels(prev => [...prev, optimisticChannel]);
      const { error } = await supabase.from('channels').insert({
          id: newId, name: channel.name, type: channel.type, created_by: currentUser.id, members: channel.members
      });
      if (error) {
          setChannels(prev => prev.filter(c => c.id !== newId));
          addNotification("Erreur", "Impossible de créer le canal", "urgent");
      } else {
          addNotification("Succès", `Canal #${channel.name} créé`, "success");
      }
  }, [currentUser, addNotification]);

  const handleDeleteChannel = useCallback(async (channelId: string) => {
      setChannels(prev => prev.filter(c => c.id !== channelId));
      if (currentChannelId === channelId) setCurrentChannelId('general');
      const { error } = await supabase.from('channels').delete().eq('id', channelId);
      if (error) addNotification("Erreur", "Impossible de supprimer le canal", "urgent");
  }, [currentChannelId, addNotification]);

  const handleReadChannel = useCallback((channelId: string) => {
      if (!currentUser) return;
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      storage[channelId] = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(storage));
      
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, unread: 0 } : c));
  }, [currentUser]);

  const handleUpdateProfile = useCallback(async (updatedData: Partial<User> & { password?: string }) => {
      if (!currentUser) return;
      try {
          if (updatedData.password) {
              const { error } = await supabase.auth.updateUser({ password: updatedData.password });
              if (error) throw error;
          }
          const { error } = await supabase.from('users').update({
              name: updatedData.name,
              phone_number: updatedData.phoneNumber,
              avatar: updatedData.avatar
          }).eq('id', currentUser.id);

          if (error) throw error;
          
          setCurrentUser(prev => prev ? ({ ...prev, ...updatedData }) : null);
          addNotification("Profil mis à jour", "Vos informations ont été enregistrées.", "success");
      } catch (e: any) {
          addNotification("Erreur", e.message || "Erreur de mise à jour", "urgent");
      }
  }, [currentUser, addNotification]);


  // AUTH LOGIC
  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAuthProcessing(true);
      try {
          if (isRegistering) {
              const { data, error } = await supabase.auth.signUp({
                  email, password,
                  options: {
                      data: { name: registerName, avatar: `https://ui-avatars.com/api/?name=${registerName.replace(/\s+/g, '+')}&background=random` }
                  }
              });
              if (error) throw error;
              if (data.user) {
                  const newUser = {
                      id: data.user.id, name: registerName, email: email, role: UserRole.MEMBER,
                      avatar: data.user.user_metadata.avatar, status: 'active', notification_pref: 'all',
                      permissions: {}, phone_number: registerPhone
                  };
                  await supabase.from('users').insert(newUser);
                  addNotification("Bienvenue !", "Votre compte a été créé.", "success");
              }
          } else {
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;
          }
      } catch (err: any) {
          addNotification("Erreur d'authentification", err.message, "urgent");
      } finally {
          setIsAuthProcessing(false);
      }
  };

  const totalUnread = channels.reduce((acc, curr) => acc + (curr.unread || 0), 0);

  if (isLoading) {
      return (
          <div className="h-screen w-screen bg-white flex items-center justify-center flex-col">
              <div className="text-4xl font-extrabold tracking-tighter text-slate-900 mb-4 animate-pulse"><span className="text-primary">i</span>VISION</div>
              <Loader2 className="animate-spin text-primary" size={32} />
          </div>
      );
  }

  if (!currentUser) {
      return (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-4">
             <ToastContainer notifications={notifications} onDismiss={removeNotification} />
             <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
                 <div className="p-8 pb-0 text-center">
                      <div className="text-3xl font-extrabold tracking-tighter text-slate-900 mb-2"><span className="text-primary">i</span>VISION</div>
                      <p className="text-slate-500 text-sm">Plateforme de gestion d'agence tout-en-un</p>
                 </div>
                 <div className="p-8">
                     <form onSubmit={handleAuth} className="space-y-4">
                         {isRegistering && (
                             <>
                                 <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nom Complet</label>
                                    <input type="text" required value={registerName} onChange={e => setRegisterName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="John Doe" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
                                    <input type="tel" value={registerPhone} onChange={e => setRegisterPhone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="+33 6..." />
                                 </div>
                             </>
                         )}
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="vous@ivision.com" />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="••••••••" />
                            </div>
                         </div>

                         <button disabled={isAuthProcessing} className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-primary/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                             {isAuthProcessing ? <Loader2 className="animate-spin" /> : isRegistering ? "Créer un compte" : "Se connecter"}
                         </button>
                     </form>
                     <div className="mt-6 text-center">
                         <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">
                             {isRegistering ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
                         </button>
                     </div>
                 </div>
                 {!isConfigured && (
                   <div className="bg-orange-50 p-4 text-center border-t border-orange-100">
                     <p className="text-xs text-orange-600 font-bold flex items-center justify-center">
                       <AlertCircle size={14} className="mr-1" /> Mode Démo (Supabase non configuré)
                     </p>
                   </div>
                 )}
             </div>
        </div>
      );
  }

  return (
    <HashRouter>
      <Layout 
        currentUser={currentUser} 
        onLogout={() => supabase.auth.signOut()} 
        unreadMessageCount={totalUnread}
        // Props for Global Search
        tasks={tasks}
        messages={messages}
        users={users}
        channels={channels}
        fileLinks={fileLinks}
      >
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <Dashboard 
                currentUser={currentUser} 
                tasks={tasks} 
                messages={messages}
                notifications={notifications}
                channels={channels}
                onNavigate={(view) => {
                   // Simple redirect helper if needed, but Links in Layout handle it mostly
                   window.location.hash = `#/${view}`;
                }}
                onDeleteTask={handleDeleteTask}
                unreadMessageCount={totalUnread}
              />
            } />
            <Route path="/clients" element={
              <Clients 
                clients={clients}
                tasks={tasks}
                fileLinks={fileLinks}
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                currentUser={currentUser || undefined}
              />
            } />
            <Route path="/tasks" element={
              <Tasks 
                tasks={tasks} 
                users={users} 
                clients={clients}
                currentUser={currentUser}
                onUpdateStatus={handleUpdateStatus} 
                onAddTask={handleAddTask} 
                onUpdateTask={handleUpdateTask} 
                onDeleteTask={handleDeleteTask}
                onAddComment={handleTaskComment}
                onAddFileLink={handleAddFileLink}
                onDeleteAttachment={(taskId, url) => {
                     // Find task, remove attachment, update
                     const task = tasks.find(t => t.id === taskId);
                     if(task) {
                         const newAttachments = task.attachments?.filter(a => a !== url) || [];
                         handleUpdateTask({ ...task, attachments: newAttachments });
                     }
                }}
                onDeleteComment={async (taskId, commentId) => {
                     // Optimistic
                     setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: t.comments?.filter(c => c.id !== commentId) } : t));
                     await supabase.from('task_comments').delete().eq('id', commentId);
                }}
                handleAddSubtask={handleAddSubtask}
                handleToggleSubtask={handleToggleSubtask}
                handleDeleteSubtask={handleDeleteSubtask}
              />
            } />
            <Route path="/chat" element={
              <Chat 
                currentUser={currentUser} 
                users={users} 
                channels={channels}
                currentChannelId={currentChannelId}
                messages={messages} 
                onlineUserIds={onlineUserIds}
                onChannelChange={setCurrentChannelId}
                onSendMessage={handleSendMessage}
                onAddChannel={handleCreateChannel}
                onDeleteChannel={handleDeleteChannel}
                onReadChannel={handleReadChannel}
              />
            } />
            <Route path="/files" element={
              <Files 
                tasks={tasks} 
                messages={messages} 
                fileLinks={fileLinks}
                clients={clients}
                currentUser={currentUser}
                onAddFileLink={handleAddFileLink}
                onDeleteFileLink={handleDeleteFileLink}
              />
            } />
            <Route path="/team" element={
              <Team 
                currentUser={currentUser} 
                users={users} 
                tasks={tasks} 
                activities={[]} // Activities not fully impl in DB yet
                onlineUserIds={onlineUserIds}
                onAddUser={handleAddUser}
                onRemoveUser={handleRemoveUser}
                onUpdateRole={(uid, role) => handleUpdateUser(uid, { role })}
                onApproveUser={(uid) => handleUpdateUser(uid, { status: 'active' })}
                onUpdateMember={handleUpdateUser}
              />
            } />
            <Route path="/settings" element={
                <Settings currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />
            } />
            <Route path="/reports" element={
                <Reports currentUser={currentUser} tasks={tasks} users={users} />
            } />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default App;