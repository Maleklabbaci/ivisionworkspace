
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
  const [currentChannelId, setCurrentChannelId] = useState('');
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false); 
  const [isAuthProcessing, setIsAuthProcessing] = useState(false); // Button specific load
  
  // Login & Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  // Ref to track if user data has been loaded
  const isDataLoaded = useRef(false);

  // Helper for UUID generation (Robust Polyfill)
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    const id = generateUUID();
    setNotifications(prev => [...prev, { id, title, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- UNREAD MESSAGES LOGIC (Using LocalStorage) ---
  const getLastReadTimestamp = (channelId: string): string => {
      if (!currentUser) return new Date().toISOString();
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return storage[channelId] || '1970-01-01T00:00:00.000Z';
  };

  const markChannelAsRead = (channelId: string) => {
      if (!currentUser) return;
      const storageKey = `ivision_last_read_${currentUser.id}`;
      const storage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      storage[channelId] = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(storage));
      
      // Update UI state locally to remove unread badge immediately
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, unread: 0 } : c));
  };

  const calculateUnreadCounts = (channelsList: Channel[], allMessages: Message[]) => {
      return channelsList.map(channel => {
          const lastRead = getLastReadTimestamp(channel.id);
          const unreadCount = allMessages.filter(m => 
              m.channelId === channel.id && 
              m.userId !== currentUser?.id && // Don't count own messages
              new Date(m.fullTimestamp) > new Date(lastRead)
          ).length;
          return { ...channel, unread: unreadCount };
      });
  };

  // --- INITIALIZATION & AUTH CHECK ---

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Ecouteur unique pour l'état de l'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setTasks([]);
        setMessages([]);
        isDataLoaded.current = false;
        setIsLoading(false);
      } else if (session?.user) {
        // OPTIMISATION MAJEURE : Chargement Optimiste (Lazy Loading)
        
        if (!isDataLoaded.current && !currentUser) {
             const optimisticUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Utilisateur',
                email: session.user.email!,
                role: UserRole.ADMIN, // On assume Admin par défaut pour la fluidité, le fetch corrigera en ms
                avatar: session.user.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${session.user.email?.charAt(0)}&background=random`,
                notificationPref: 'all',
                status: 'active'
             };
             
             setCurrentUser(optimisticUser);
             setIsLoading(false); // Stop loading screen immediately
             setIsAuthProcessing(false); // Stop button spinner

             // Chargement des vraies données en arrière-plan (Non-bloquant)
             Promise.all([
                fetchUserProfile(session.user.id),
                fetchInitialData(session.user.id) // Pass ID directly to avoid closure staleness
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

  // --- REALTIME SUBSCRIPTION FOR MESSAGES & MENTIONS ---
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to new messages in the database
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        // Convert DB model to UI model
        const displayMsg: Message = {
          id: newMsg.id,
          userId: newMsg.user_id,
          channelId: newMsg.channel_id,
          content: newMsg.content,
          timestamp: new Date(newMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          fullTimestamp: newMsg.created_at, // ISO String
          attachments: newMsg.attachments || []
        };

        // 1. Add to message list (Check for duplicates to avoid double entry with optimistic UI)
        setMessages((prev) => {
          if (prev.some(m => m.id === displayMsg.id)) return prev;
          return [...prev, displayMsg];
        });

        // 2. Update Unread Counts
        if (newMsg.user_id !== currentUser.id) {
            // If the message is for a channel different than the current one, increment unread
            if (newMsg.channel_id !== currentChannelId) {
                setChannels(prev => prev.map(c => 
                    c.id === newMsg.channel_id ? { ...c, unread: (c.unread || 0) + 1 } : c
                ));
            }
        }

        // 3. CHECK FOR MENTIONS (@User)
        if (newMsg.user_id !== currentUser.id) {
           const myMentionTag = `@${currentUser.name.replace(/\s+/g, '')}`;
           
           if (newMsg.content.includes(myMentionTag)) {
              const sender = users.find(u => u.id === newMsg.user_id);
              const senderName = sender ? sender.name : "Quelqu'un";
              
              addNotification(
                  "Nouvelle mention !", 
                  `${senderName} vous a mentionné dans le chat.`, 
                  "info"
              );
           }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, users, currentChannelId]);

  // --- DOCUMENT TITLE UPDATE ---
  useEffect(() => {
      const totalUnread = channels.reduce((acc, c) => acc + (c.unread || 0), 0);
      if (totalUnread > 0) {
          document.title = `(${totalUnread}) iVISION AGENCY`;
      } else {
          document.title = `iVISION AGENCY`;
      }
  }, [channels]);

  // --- DATA FETCHING ---

  const fetchUserProfile = async (userId: string) => {
    try {
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
                status: data.status,
                permissions: data.permissions || {} // Load permissions
            };
            setCurrentUser(user);
        } else {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            
            if (authUser) {
                const defaultName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur';
                const defaultAvatar = authUser.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${defaultName}&background=random`;
                
                const newProfile = {
                    id: authUser.id,
                    name: defaultName,
                    email: authUser.email,
                    role: UserRole.ADMIN, // Default to Admin for this app setup
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
                }
            }
        }
    } catch (e) {
        console.error("Fetch profile exception:", e);
    }
  };

  const fetchInitialData = async (userId?: string) => {
    try {
        // CRITICAL: Upsert User Immediately to ensure Foreign Key exists
        // This fixes the race condition where user tries to send msg before profile is fully synced
        const uid = userId || currentUser?.id;
        if (uid) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                await supabase.from('users').upsert([{
                    id: uid,
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                    email: authUser.email,
                    role: UserRole.ADMIN, // Fallback
                    status: 'active'
                }]);
            }
        }

        // Parallel Fetching
        const [usersResult, channelsResult, messagesResult, tasksResult] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('channels').select('*'),
            supabase.from('messages').select('*').order('created_at', { ascending: true }),
            supabase.from('tasks').select('*')
        ]);

        if (usersResult.data) {
            setUsers(usersResult.data.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role as UserRole,
                avatar: u.avatar,
                phoneNumber: u.phone_number,
                notificationPref: u.notification_pref,
                status: u.status,
                permissions: u.permissions || {} 
            })));
        }

        let fetchedMessages: Message[] = [];
        if (messagesResult.data) {
            fetchedMessages = messagesResult.data.map(m => ({
                id: m.id,
                userId: m.user_id,
                channelId: m.channel_id,
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                fullTimestamp: m.created_at, 
                attachments: m.attachments || []
            }));
            setMessages(fetchedMessages);
        }

        let loadedChannels: Channel[] = [];
        if (channelsResult.data) {
            loadedChannels = channelsResult.data.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                unread: 0
            }));
        }

        // FIX: Dynamic Default Channel Logic
        // Don't force 'Général' if other channels exist. Allow deletion.
        let defaultChannelId = '';
        
        if (loadedChannels.length > 0) {
             // Prefer 'Général' if exists, otherwise first available channel
             const generalChan = loadedChannels.find(c => c.name.toLowerCase() === 'général' || c.name.toLowerCase() === 'general');
             defaultChannelId = generalChan ? generalChan.id : loadedChannels[0].id;
        } else {
             // ONLY create 'Général' if database is completely empty of channels
             const { data: newChannel, error } = await supabase.from('channels').insert([{ 
                name: 'Général', 
                type: 'global', 
                unread_count: 0 
             }]).select().single();
             
             if (newChannel) {
                 const genChannel = { id: newChannel.id, name: newChannel.name, type: 'global' as const, unread: 0 };
                 loadedChannels.push(genChannel);
                 defaultChannelId = newChannel.id;
             } 
        }

        // Calculate unread counts
        setChannels(calculateUnreadCounts(loadedChannels, fetchedMessages));
        
        // Update current channel state to valid UUID
        if (defaultChannelId) {
            setCurrentChannelId(defaultChannelId);
        }

        if (tasksResult.data) {
            const mappedTasks = await Promise.all(tasksResult.data.map(async (t) => {
                const comments = t.comments || []; 
                const attachments = t.attachments || [];

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

    } catch (error) {
        console.error("Error loading data", error);
    }
  };

  // --- ACTIONS ---

  const handleChannelChange = (channelId: string) => {
      setCurrentChannelId(channelId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthProcessing(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        addNotification('Erreur de connexion', error.message, 'urgent');
        setIsAuthProcessing(false);
    } else {
        addNotification('Connexion...', 'Chargement de l\'espace de travail.', 'success');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !registerName) {
      addNotification('Erreur', 'Veuillez remplir tous les champs.', 'urgent');
      return;
    }
    
    setIsAuthProcessing(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: registerName,
                avatar: `https://ui-avatars.com/api/?name=${registerName.replace(/\s+/g, '+')}&background=random`
            }
        }
    });

    if (authError) {
        addNotification('Erreur inscription', authError.message, 'urgent');
        setIsAuthProcessing(false);
        return;
    }

    if (authData.user) {
        // --- MIGRATION DES COMPTES CRÉÉS PAR L'ADMIN ---
        const registeredEmail = authData.user.email;
        const newAuthId = authData.user.id;

        const { data: existingProfiles } = await supabase
            .from('users')
            .select('*')
            .eq('email', registeredEmail);
        
        const placeholderProfile = existingProfiles?.find(u => u.id !== newAuthId);

        if (placeholderProfile) {
            console.log("Compte pré-créé détecté. Migration en cours...");
            const inheritedRole = placeholderProfile.role;
            const inheritedPermissions = placeholderProfile.permissions;
            const inheritedStatus = placeholderProfile.status;

            // 1. Réassigner les tâches
            await supabase.from('tasks').update({ assignee_id: newAuthId }).eq('assignee_id', placeholderProfile.id);
            
            // 2. Supprimer le profil placeholder
            await supabase.from('users').delete().eq('id', placeholderProfile.id);

            // 3. Créer le nouveau profil propre
            const newProfile = {
                id: newAuthId,
                name: registerName,
                email: registeredEmail,
                role: inheritedRole || UserRole.MEMBER, 
                avatar: `https://ui-avatars.com/api/?name=${registerName.replace(/\s+/g, '+')}&background=random`,
                notification_pref: 'all',
                status: inheritedStatus || 'active', 
                permissions: inheritedPermissions || {} 
            };

            await supabase.from('users').insert([newProfile]);
            addNotification('Compte lié', 'Votre profil pré-créé par l\'administrateur a été récupéré avec succès.', 'success');

        } else if (authData.session) {
             addNotification('Compte créé !', 'Bienvenue sur iVISION.', 'success');
        } else {
             addNotification('Vérifiez vos emails', 'Un lien de confirmation a été envoyé.', 'info');
             setIsAuthProcessing(false);
        }
    } else {
        setIsAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
  };

  // --- TASK ACTIONS ---

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId); 
    if (error) { addNotification('Erreur', 'Impossible de mettre à jour le statut.', 'urgent'); }
  };
  
  const handleUpdateTask = async (updatedTask: Task) => {
    const safeComments = Array.isArray(updatedTask.comments) ? updatedTask.comments : [];
    const { error } = await supabase.from('tasks').update({
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate,
        assignee_id: updatedTask.assigneeId,
        type: updatedTask.type,
        price: updatedTask.price,
        comments: safeComments 
    }).eq('id', updatedTask.id);

    if (error) { 
        console.error("Update error:", error);
        addNotification('Erreur', 'Mise à jour échouée.', 'urgent'); 
        return; 
    }
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleAddTask = async (newTask: Task) => {
      const dbId = generateUUID();
      
      // Ensure we do NOT send 'attachments' to DB 'tasks' table if the column is missing.
      // We fallback by appending files to the description text.
      let safeDescription = newTask.description || '';
      if (newTask.attachments && newTask.attachments.length > 0) {
          safeDescription += `\n\n[📎 Fichiers : ${newTask.attachments.join(', ')}]`;
      }

      const dbTask = {
          id: dbId,
          title: newTask.title || 'Sans titre',
          description: safeDescription,
          assignee_id: newTask.assigneeId,
          due_date: newTask.dueDate,
          status: newTask.status || TaskStatus.TODO,
          type: newTask.type || 'content',
          priority: newTask.priority || 'medium',
          price: Number(newTask.price) || 0,
          comments: [] 
          // Removed: attachments field
      };

      const addedTask = { ...newTask, id: dbId, price: dbTask.price, comments: [], attachments: newTask.attachments || [] };
      setTasks(prev => [...prev, addedTask]);
      addNotification('Succès', 'Tâche créée.', 'success');

      const { error } = await supabase.from('tasks').insert([dbTask]);
      
      if (error) { 
          console.error("DB Insert Error:", error); 
          addNotification('Erreur', `Échec de la création: ${error.message}`, 'urgent');
          setTasks(prev => prev.filter(t => t.id !== dbId)); 
      } 
  };

  const handleDeleteTask = async (taskId: string) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addNotification('Supprimé', 'Tâche supprimée.', 'success');

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
        console.error("Failed to delete task", error);
        setTasks(previousTasks); 
        addNotification('Erreur', 'Impossible de supprimer la tâche.', 'urgent');
    }
  };

  // --- CHAT ACTIONS ---

  const handleSendMessage = async (text: string, channelId: string, attachments: string[] = []) => {
      if (!currentUser) return;
      
      // 1. ROBUST CHANNEL RESOLUTION (SELF-HEALING)
      // Fixes "Canal introuvable" error by finding the correct UUID if 'general' is passed or ID is stale
      let finalChannelId = channelId;
      
      // Check if local channel state has this ID
      const channelExists = channels.some(c => c.id === finalChannelId);

      if (!channelExists || finalChannelId === 'general') {
          console.log("Channel ID invalid or not found locally. Attempting self-healing resolution...");
          
          // A. Force Refresh from DB
          const { data: dbChannels } = await supabase.from('channels').select('*');
          
          if (dbChannels && dbChannels.length > 0) {
               // Update local state to be in sync
               const loaded = dbChannels.map(c => ({ id: c.id, name: c.name, type: c.type, unread: 0 }));
               setChannels(loaded);

               // B. Find correct ID
               if (finalChannelId === 'general') {
                   // Look for any channel named General/Général
                   const match = dbChannels.find(c => c.name.toLowerCase() === 'general' || c.name.toLowerCase() === 'général');
                   finalChannelId = match ? match.id : dbChannels[0].id;
               } else {
                   // Check if the UUID actually exists
                   const match = dbChannels.find(c => c.id === finalChannelId);
                   finalChannelId = match ? match.id : dbChannels[0].id; // Fallback to first available
               }
               setCurrentChannelId(finalChannelId);
          } else {
               // C. Absolute Last Resort: Create 'Général' if DB is empty
               const { data: newChan } = await supabase.from('channels').insert([{ name: 'Général', type: 'global', unread_count: 0 }]).select().single();
               if (newChan) {
                   finalChannelId = newChan.id;
                   setChannels([{ id: newChan.id, name: newChan.name, type: 'global', unread: 0 }]);
                   setCurrentChannelId(finalChannelId);
               } else {
                   addNotification('Erreur Technique', 'Impossible de créer ou trouver un canal.', 'urgent');
                   return;
               }
          }
      }
      
      const newMessageId = generateUUID();
      const now = new Date();
      
      // Optimistic Update
      const displayMessage: Message = { 
          id: newMessageId, 
          userId: currentUser.id, 
          channelId: finalChannelId, 
          content: text, 
          timestamp: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          fullTimestamp: now.toISOString(),
          attachments: attachments
      };
      
      setMessages(prev => [...prev, displayMessage]);
      markChannelAsRead(finalChannelId);

      // 2. SYNC & SEND
      // FIX: Append attachments to content and REMOVE 'attachments' column from DB insert
      // This prevents the "column not found" schema error
      let dbContent = text;
      if (attachments.length > 0) {
          dbContent += `\n\n[📎 Pièces jointes : ${attachments.join(', ')}]`;
      }

      const dbMessage = { 
          id: newMessageId, 
          channel_id: finalChannelId, 
          user_id: currentUser.id, 
          content: dbContent
          // attachments: REMOVED to prevent schema error
      };
      
      // Attempt 1
      let { error } = await supabase.from('messages').insert([dbMessage]);
      
      if (error) {
          console.log("Message send failed (Attempt 1). Trying auto-fix...", error.message);
          
          // Auto-Fix Strategy: Upsert User to ensure FK user_id exists
          await supabase.from('users').upsert([{
             id: currentUser.id,
             name: currentUser.name,
             email: currentUser.email,
             role: currentUser.role,
             avatar: currentUser.avatar,
             status: 'active'
          }]);

          // Ensure Membership
          const { error: memberError } = await supabase.from('channel_members').insert([{
              channel_id: finalChannelId,
              user_id: currentUser.id
          }]);

          // Attempt 2
          const retry = await supabase.from('messages').insert([dbMessage]);
          
          if (retry.error) {
              console.error("Message Send Fatal Error:", retry.error); 
              addNotification('Échec Envoi', `Erreur: ${retry.error.message || 'Inconnue'}`, 'urgent');
              setMessages(prev => prev.filter(m => m.id !== newMessageId)); 
          }
      }
  };

  const handleAddChannel = async (newChannel: { name: string; type: 'global' | 'project'; members?: string[] }) => {
      const tempId = generateUUID();
      const channelToAdd: Channel = { id: tempId, name: newChannel.name, type: newChannel.type, unread: 0 };
      
      setChannels(prev => [...prev, channelToAdd]);
      addNotification('Succès', 'Canal créé.', 'success');

      const { error } = await supabase.from('channels').insert([{
          id: tempId,
          name: newChannel.name,
          type: newChannel.type,
          unread_count: 0
      }]);

      if (error) {
          console.error(error);
          addNotification('Erreur', 'Impossible de sauvegarder le canal.', 'urgent');
          setChannels(prev => prev.filter(c => c.id !== tempId));
          return;
      }

      // Always add creator to channel members
      const membersToAdd = newChannel.members ? [...newChannel.members] : [];
      if (!membersToAdd.includes(currentUser!.id)) {
          membersToAdd.push(currentUser!.id);
      }

      if (membersToAdd.length > 0) {
           const memberInserts = membersToAdd.map(uid => ({
               channel_id: tempId,
               user_id: uid
           }));
           
           const { error: membersError } = await supabase.from('channel_members').insert(memberInserts);
           if (membersError) {
               console.error("Error adding members to channel", membersError);
           }
      }
  };

  const handleDeleteChannel = async (channelId: string) => {
      const previousChannels = [...channels];
      const newChannels = channels.filter(c => c.id !== channelId);
      setChannels(newChannels);
      
      if (currentChannelId === channelId) {
          // If we deleted the active channel, switch to another or empty
          const fallback = newChannels.length > 0 ? newChannels[0].id : '';
          setCurrentChannelId(fallback);
      }
      addNotification('Succès', 'Conversation supprimée.', 'success');

      const { error } = await supabase.from('channels').delete().eq('id', channelId);
      if (error) {
          console.error("Delete channel error", error);
          setChannels(previousChannels); 
          addNotification('Erreur', 'Impossible de supprimer la conversation.', 'urgent');
      }
  };

  // --- MEMBER ACTIONS ---
  const handleAddUser = async (newUser: User) => {
      const tempId = generateUUID();
      const dbUser = {
          id: tempId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          notification_pref: 'all',
          status: 'active',
          permissions: newUser.permissions || {}
      };

      setUsers(prev => [...prev, { ...newUser, id: tempId }]);
      addNotification('Succès', 'Membre ajouté (En attente d\'inscription).', 'success');

      const { error } = await supabase.from('users').insert([dbUser]);
      if (error) {
          console.error(error);
          addNotification('Erreur', "Impossible d'enregistrer le membre.", 'urgent');
          setUsers(prev => prev.filter(u => u.email !== newUser.email)); 
      }
  };

  const handleRemoveUser = async (userId: string) => {
      const prevUsers = [...users];
      setUsers(users.filter(u => u.id !== userId));
      addNotification('Succès', 'Utilisateur supprimé.', 'success');

      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
          console.error("Delete user error", error);
          setUsers(prevUsers); 
          addNotification('Erreur', 'Impossible de supprimer l\'utilisateur.', 'urgent');
      }
  };
  
  const handleUpdateProfile = async (updatedData: Partial<User> & { password?: string }) => {
    if (!currentUser) return;
    
    const authUpdates: any = {};
    if (updatedData.password && updatedData.password.length > 0) {
        authUpdates.password = updatedData.password;
    }
    if (updatedData.email && updatedData.email !== currentUser.email) {
        authUpdates.email = updatedData.email;
    }

    if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) {
            addNotification("Erreur Sécurité", authError.message, 'urgent');
            return;
        }
    }

    const { error } = await supabase.from('users').update({ 
        name: updatedData.name, 
        email: updatedData.email, 
        phone_number: updatedData.phoneNumber, 
        avatar: updatedData.avatar 
    }).eq('id', currentUser.id);

    if (!error) { 
        const { password, ...userFields } = updatedData;
        setCurrentUser({ ...currentUser, ...userFields }); 
        addNotification("Profil mis à jour", "Vos modifications ont été enregistrées.", 'success'); 
    } else {
        addNotification("Erreur", "Impossible de mettre à jour les informations du profil.", 'urgent');
    }
  };

  const handleApproveUser = async (userId: string) => {
      const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
      if (!error) { setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u)); addNotification('Succès', 'Compte validé.', 'success'); }
  };

  const handleUpdateMember = async (userId: string, updatedData: Partial<User>) => {
      const updatePayload: any = {};
      if (updatedData.name !== undefined) updatePayload.name = updatedData.name;
      if (updatedData.email !== undefined) updatePayload.email = updatedData.email;
      if (updatedData.role !== undefined) updatePayload.role = updatedData.role;
      if (updatedData.status !== undefined) updatePayload.status = updatedData.status;
      if (updatedData.permissions !== undefined) updatePayload.permissions = updatedData.permissions;

      const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);
      
      if(!error) { 
          setUsers(users.map(u => u.id === userId ? { ...u, ...updatedData } : u)); 
          addNotification('Compte modifié', 'Les informations ont été mises à jour.', 'success'); 
      } else {
          console.error("Failed update member:", error);
          addNotification('Erreur', `Échec de la mise à jour: ${error.message}`, 'urgent');
      }
  };

  // Total Unread Calculation
  const totalUnreadCount = channels.reduce((acc, c) => acc + (c.unread || 0), 0);

  // --- AUTH SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Toast is now properly positioned via its internal styles */}
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
               
               <button 
                 type="submit" 
                 disabled={isAuthProcessing}
                 className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isAuthProcessing ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  <span>{isAuthProcessing ? 'Création...' : 'S\'inscrire'}</span>
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
                <button 
                    type="submit" 
                    disabled={isAuthProcessing}
                    className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isAuthProcessing ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                  <span>{isAuthProcessing ? 'Connexion...' : 'Connexion'}</span>
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
    <div className="animate-in slide-in-from-right duration-300 ease-out h-full">
      <Layout currentUser={currentUser} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} unreadMessageCount={totalUnreadCount}>
        {/* Notification Container - Self positioning */}
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        
        {currentView === 'dashboard' && (
            <Dashboard 
                currentUser={currentUser} 
                tasks={tasks} 
                messages={messages} 
                notifications={notifications} 
                onNavigate={setCurrentView} 
                onDeleteTask={handleDeleteTask} 
                unreadMessageCount={totalUnreadCount} 
            />
        )}
        
        {currentView === 'reports' && <Reports currentUser={currentUser} tasks={tasks} users={users} />}
        
        {currentView === 'tasks' && (
            <Tasks 
                tasks={tasks} 
                users={users.filter(u => u.status === 'active')} 
                currentUser={currentUser} 
                onUpdateStatus={handleUpdateTaskStatus} 
                onAddTask={handleAddTask} 
                onUpdateTask={handleUpdateTask} 
                onDeleteTask={handleDeleteTask} 
            />
        )}
        
        {currentView === 'chat' && (
            <Chat 
                currentUser={currentUser} 
                users={users.filter(u => u.status === 'active')} 
                channels={channels} 
                currentChannelId={currentChannelId} 
                messages={messages} 
                onChannelChange={handleChannelChange} 
                onSendMessage={handleSendMessage} 
                onAddChannel={handleAddChannel} 
                onDeleteChannel={handleDeleteChannel} 
                onReadChannel={markChannelAsRead}
            />
        )}
        
        {currentView === 'files' && currentUser && <Files tasks={tasks} messages={messages} currentUser={currentUser} />}
        
        {currentView === 'team' && (
            <Team 
                currentUser={currentUser} 
                users={users} 
                tasks={tasks} 
                activities={[]} 
                onAddUser={handleAddUser} 
                onRemoveUser={handleRemoveUser} 
                onUpdateRole={(userId, role) => handleUpdateMember(userId, { role })} 
                onApproveUser={handleApproveUser} 
                onUpdateMember={handleUpdateMember} 
            />
        )}
        
        {currentView === 'settings' && <Settings currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />}
      </Layout>
    </div>
  );
};

export default App;
