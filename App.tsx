
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
  const [currentChannelId, setCurrentChannelId] = useState('general');
  
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

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    const id = Date.now().toString() + Math.random();
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
                fetchInitialData()
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
          fullTimestamp: newMsg.created_at // ISO String
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
            } else {
               // If we are on the channel, update last read time essentially
               markChannelAsRead(currentChannelId);
            }
        }

        // 3. CHECK FOR MENTIONS (@User)
        // We only notify if the sender is NOT the current user
        if (newMsg.user_id !== currentUser.id) {
           // Create the tag we are looking for: @NameWithoutSpaces (e.g. @JeanDupont)
           const myMentionTag = `@${currentUser.name.replace(/\s+/g, '')}`;
           
           if (newMsg.content.includes(myMentionTag)) {
              // Find sender name for better notification
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
  }, [currentUser, users, currentChannelId]); // Re-run if currentChannelId changes to update read logic

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
            // Handle missing public profile -> Create one silently
            // Note: handleRegister might have already created it, so this is a fallback for direct auth (Google/MagicLink) or legacy.
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

  const fetchInitialData = async () => {
    try {
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
                permissions: u.permissions || {} // Important for team view
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
                fullTimestamp: m.created_at // Save ISO for logic
            }));
            setMessages(fetchedMessages);
        }

        if (channelsResult.data) {
            // Calculate Unread Count
            const mappedChannels = channelsResult.data.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                unread: 0 // Default, updated below
            }));
            setChannels(calculateUnreadCounts(mappedChannels, fetchedMessages));
        }

        if (tasksResult.data) {
            const mappedTasks = await Promise.all(tasksResult.data.map(async (t) => {
                const comments = []; 
                const attachments = []; 

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
      markChannelAsRead(channelId);
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
        // Note: setIsAuthProcessing(false) will happen in onAuthStateChange via optimistic UI
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
                avatar: `https://ui-avatars.com/api/?name=${registerName.replace(' ', '+')}&background=random`
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
        // Vérifier si un compte "placeholder" existe déjà avec cet email (créé par l'admin via l'interface équipe)
        const registeredEmail = authData.user.email;
        const newAuthId = authData.user.id;

        const { data: existingProfiles } = await supabase
            .from('users')
            .select('*')
            .eq('email', registeredEmail);
        
        const placeholderProfile = existingProfiles?.find(u => u.id !== newAuthId);

        if (placeholderProfile) {
            console.log("Compte pré-créé détecté. Migration en cours...");
            // Le compte existe (créé par admin), on doit migrer ses infos vers le nouvel ID Auth
            
            // 1. Récupérer les rôles et permissions définis par l'admin
            const inheritedRole = placeholderProfile.role;
            const inheritedPermissions = placeholderProfile.permissions;

            // 2. Réassigner les tâches assignées à l'ancien ID vers le nouvel ID
            await supabase.from('tasks').update({ assignee_id: newAuthId }).eq('assignee_id', placeholderProfile.id);

            // 3. Supprimer l'ancien profil "placeholder" pour éviter les doublons
            await supabase.from('users').delete().eq('id', placeholderProfile.id);

            // 4. Créer le nouveau profil officiel avec les données héritées
            const newProfile = {
                id: newAuthId,
                name: registerName,
                email: registeredEmail,
                role: inheritedRole || UserRole.MEMBER, // Garder le rôle défini par l'admin
                avatar: `https://ui-avatars.com/api/?name=${registerName.replace(' ', '+')}&background=random`,
                notification_pref: 'all',
                status: 'active',
                permissions: inheritedPermissions || {} // Garder les permissions définies par l'admin
            };

            await supabase.from('users').insert([newProfile]);
            addNotification('Compte lié', 'Votre profil pré-créé par l\'administrateur a été récupéré.', 'success');

        } else if (authData.session) {
            // Cas normal : Pas de profil existant, on laisse le fetchUserProfile ou le trigger créer le défaut
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
      setCurrentUser(null); // Immediate UI clear
  };

  // --- TASK ACTIONS ---

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId); 
    if (error) { addNotification('Erreur', 'Impossible de mettre à jour le statut.', 'urgent'); }
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
      // Optimistic Add
      const addedTask = { ...newTask, id: dbTask.id };
      setTasks(prev => [...prev, addedTask]);
      addNotification('Succès', 'Tâche créée.', 'success');

      const { error } = await supabase.from('tasks').insert([dbTask]);
      if (error) { 
          console.error(error); 
          addNotification('Erreur', 'Synchronisation échouée.', 'urgent');
          setTasks(prev => prev.filter(t => t.id !== dbTask.id)); // Revert
      } 
  };

  const handleDeleteTask = async (taskId: string) => {
    const previousTasks = [...tasks];
    // Optimistic Update: Remove immediately from UI
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addNotification('Supprimé', 'Tâche supprimée.', 'success');

    // Sync with DB
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
        console.error("Failed to delete task", error);
        setTasks(previousTasks); // Revert if failed
        addNotification('Erreur', 'Impossible de supprimer la tâche. Vérifiez votre connexion.', 'urgent');
    }
  };

  // --- CHAT & TEAM ACTIONS ---

  const handleSendMessage = async (text: string, channelId: string) => {
      if (!currentUser) return;
      
      // We add optimistically for immediate UX
      const newMessageId = crypto.randomUUID();
      const now = new Date();
      
      const displayMessage: Message = { 
          id: newMessageId, 
          userId: currentUser.id, 
          channelId, 
          content: text, 
          timestamp: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          fullTimestamp: now.toISOString()
      };
      
      setMessages(prev => [...prev, displayMessage]);

      const dbMessage = { id: newMessageId, channel_id: channelId, user_id: currentUser.id, content: text };
      const { error } = await supabase.from('messages').insert([dbMessage]);
      
      if (error) { 
          console.error(error); 
          addNotification('Erreur', 'Message non envoyé.', 'urgent');
          setMessages(prev => prev.filter(m => m.id !== newMessageId)); // Revert
      }
  };

  const handleAddChannel = async (newChannel: { name: string; type: 'global' | 'project'; members?: string[] }) => {
      const tempId = crypto.randomUUID();
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

      if (newChannel.type === 'project' && newChannel.members && newChannel.members.length > 0) {
           const memberInserts = newChannel.members.map(uid => ({
               channel_id: tempId,
               user_id: uid
           }));
           
           const { error: membersError } = await supabase.from('channel_members').insert(memberInserts);
           if (membersError) {
               console.error("Error adding members to channel", membersError);
               addNotification('Attention', 'Canal créé mais erreur lors de l\'ajout des membres.', 'urgent');
           }
      }
  };

  const handleDeleteChannel = async (channelId: string) => {
      const previousChannels = [...channels];
      setChannels(prev => prev.filter(c => c.id !== channelId));
      if (currentChannelId === channelId) {
          setCurrentChannelId('general');
      }
      addNotification('Succès', 'Conversation supprimée.', 'success');

      const { error } = await supabase.from('channels').delete().eq('id', channelId);
      if (error) {
          console.error("Delete channel error", error);
          setChannels(previousChannels); // Revert
          addNotification('Erreur', 'Impossible de supprimer la conversation.', 'urgent');
      }
  };

  const handleAddUser = async (newUser: User) => {
      const tempId = crypto.randomUUID();
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
          setUsers(prev => prev.filter(u => u.email !== newUser.email)); // Revert
      }
  };

  const handleRemoveUser = async (userId: string) => {
      // Optimistic Update
      const prevUsers = [...users];
      setUsers(users.filter(u => u.id !== userId));
      addNotification('Succès', 'Utilisateur supprimé.', 'success');

      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
          console.error("Delete user error", error);
          setUsers(prevUsers); // Revert
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
            return; // Stop if auth update fails
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
      // Construct payload dynamically
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
          // Better error handling: Extract message string
          const errorMsg = error.message || JSON.stringify(error);
          
          // FALLBACK: Try updating without permissions if that was the cause
          if (updatePayload.permissions) {
              const { permissions, ...fallbackPayload } = updatePayload;
              if (Object.keys(fallbackPayload).length > 0) {
                   const { error: fallbackError } = await supabase.from('users').update(fallbackPayload).eq('id', userId);
                   if (!fallbackError) {
                        setUsers(users.map(u => u.id === userId ? { ...u, ...updatedData, permissions: undefined } : u));
                        addNotification('Attention', 'Profil mis à jour, mais les permissions n\'ont pas pu être sauvegardées (Colonne "permissions" manquante en base de données).', 'urgent');
                        return;
                   }
              }
          }

          console.error("Failed update member:", error);
          addNotification('Erreur', `Échec de la mise à jour: ${errorMsg}`, 'urgent');
      }
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

  // Total Unread Calculation
  const totalUnreadCount = channels.reduce((acc, c) => acc + (c.unread || 0), 0);

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
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        {currentView === 'dashboard' && <Dashboard currentUser={currentUser} tasks={tasks} messages={messages} notifications={notifications} onNavigate={setCurrentView} onDeleteTask={handleDeleteTask} unreadMessageCount={totalUnreadCount} />}
        {currentView === 'reports' && <Reports currentUser={currentUser} tasks={tasks} users={users} />}
        {currentView === 'tasks' && <Tasks tasks={tasks} users={users.filter(u => u.status === 'active')} currentUser={currentUser} onUpdateStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />}
        {currentView === 'chat' && <Chat currentUser={currentUser} users={users.filter(u => u.status === 'active')} channels={channels.length > 0 ? channels : [{ id: 'general', name: 'Général', type: 'global' }]} currentChannelId={currentChannelId} messages={messages} onChannelChange={handleChannelChange} onSendMessage={handleSendMessage} onAddChannel={handleAddChannel} onDeleteChannel={handleDeleteChannel} />}
        {currentView === 'files' && currentUser && <Files tasks={tasks} messages={messages} currentUser={currentUser} />}
        {currentView === 'team' && <Team currentUser={currentUser} users={users} tasks={tasks} activities={[]} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} onUpdateRole={(userId, role) => handleUpdateMember(userId, { role })} onApproveUser={handleApproveUser} onUpdateMember={handleUpdateMember} />}
        {currentView === 'settings' && <Settings currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />}
      </Layout>
    </div>
  );
};

export default App;
