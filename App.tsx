
import React, { useState } from 'react';
import { LogIn, Lock, Mail } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Chat from './components/Chat';
import Reports from './components/Campaigns';
import Team from './components/Team';
import Files from './components/Files';
import ToastContainer from './components/Toast';
import { User, UserRole, ViewState, Task, TaskStatus, CampaignMetric, Channel, ActivityLog, ToastNotification, Message } from './types';

// Mock Data
const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Admin', email: 'admin@ivision.com', role: UserRole.ADMIN, avatar: 'https://picsum.photos/id/64/200/200', notificationPref: 'all' },
  { id: '2', name: 'Sarah Creative', email: 'sarah@ivision.com', role: UserRole.MEMBER, avatar: 'https://picsum.photos/id/65/200/200', notificationPref: 'push' },
  { id: '3', name: 'Marc Media', email: 'marc@ivision.com', role: UserRole.MEMBER, avatar: 'https://picsum.photos/id/91/200/200', notificationPref: 'all' },
];

const MOCK_TASKS: Task[] = [
  { 
    id: '101', 
    title: 'Créer visuels Instagram - Soldes', 
    description: 'Format carré et story pour la campagne hivernale. Utiliser la nouvelle charte graphique.', 
    assigneeId: '2', 
    status: TaskStatus.IN_PROGRESS, 
    dueDate: '2023-10-25', 
    type: 'content',
    priority: 'high',
    comments: [
      { id: 'c1', userId: '1', content: 'Attention au logo, il doit être en blanc.', timestamp: '10:00' }
    ],
    attachments: ['brief_hiver.pdf', 'logo_white.png']
  },
  { 
    id: '102', 
    title: 'Setup Campagne Google Ads', 
    description: 'Mots clés: Chaussures sport. Budget journalier: 50€.', 
    assigneeId: '3', 
    status: TaskStatus.TODO, 
    dueDate: '2023-10-28', 
    type: 'ads',
    priority: 'medium',
    comments: [],
    attachments: ['keywords_list.xlsx']
  },
  { 
    id: '103', 
    title: 'Rapport Mensuel Septembre', 
    description: 'Inclure KPIs Facebook et l\'analyse du ROI.', 
    assigneeId: '1', 
    status: TaskStatus.DONE, 
    dueDate: '2023-10-01', 
    type: 'admin',
    priority: 'low',
    comments: []
  },
  { 
    id: '104', 
    title: 'Brief Créatif TikTok', 
    description: 'Vidéo trend transition pour le produit phare.', 
    assigneeId: '2', 
    status: TaskStatus.BLOCKED, 
    dueDate: '2023-10-26', 
    type: 'content',
    priority: 'high',
    comments: [
      { id: 'c2', userId: '2', content: 'J\'attends la validation du script par le client.', timestamp: '14:30' }
    ]
  },
  { 
    id: '105', 
    title: 'Optimisation SEO Blog', 
    description: 'Revoir les meta descriptions des articles Hiver.', 
    assigneeId: '1', 
    status: TaskStatus.IN_PROGRESS, 
    dueDate: '2023-11-05', 
    type: 'admin',
    priority: 'medium',
    comments: []
  },
];

const MOCK_CAMPAIGNS: CampaignMetric[] = [
  { name: 'Promo Hiver', clicks: 4000, conversions: 240, spend: 1200, impressions: 240 },
  { name: 'Retargeting', clicks: 3000, conversions: 139, spend: 800, impressions: 150 },
  { name: 'Brand Awareness', clicks: 2000, conversions: 50, spend: 2000, impressions: 500 },
  { name: 'Lancement Produit', clicks: 2780, conversions: 190, spend: 1500, impressions: 200 },
];

const MOCK_CHANNELS: Channel[] = [
    { id: 'general', name: 'Général', type: 'global' },
    { id: 'random', name: 'Pause Café', type: 'global' },
    { id: 'winter-campaign', name: 'Campagne Hiver', type: 'project', unread: 2 },
    { id: 'website-redesign', name: 'Redesign Site', type: 'project' },
];

const MOCK_MESSAGES: Message[] = [
    { id: 'm1', userId: '1', channelId: 'general', content: 'Bienvenue sur la nouvelle plateforme iVISION ! 🚀', timestamp: '09:00' },
    { id: 'm2', userId: '2', channelId: 'general', content: 'Superbe interface, merci Alex !', timestamp: '09:05' },
    { id: 'm3', userId: '3', channelId: 'winter-campaign', content: 'Voici les assets pour la campagne hiver.', timestamp: '11:30', attachments: ['assets_hiver.zip'] },
    { id: 'm4', userId: '1', channelId: 'winter-campaign', content: 'Merci Marc, je regarde ça.', timestamp: '11:35' },
];

const MOCK_ACTIVITIES: ActivityLog[] = [
    { id: 'a1', userId: '2', action: 'a terminé la tâche', target: 'Visuels Instagram', timestamp: 'Il y a 2h' },
    { id: 'a2', userId: '3', action: 'a commenté sur', target: 'Setup Ads', timestamp: 'Il y a 4h' },
    { id: 'a3', userId: '1', action: 'a créé le projet', target: 'Redesign Site', timestamp: 'Hier' },
    { id: 'a4', userId: '2', action: 'a uploadé un fichier', target: 'brief_v2.pdf', timestamp: 'Hier' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState('general');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'urgent' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setNotifications(prev => [...prev, { id, title, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      addNotification('Bienvenue', `Ravi de vous revoir, ${user.name.split(' ')[0]} !`, 'success');
    } else {
      alert("Utilisateur non trouvé (essayez admin@ivision.com)");
    }
  };

  const handleDemoLogin = (user: User) => {
    setEmail(user.email);
    setPassword('password123');
    setCurrentUser(user);
    addNotification('Bienvenue', `Ravi de vous revoir, ${user.name.split(' ')[0]} !`, 'success');
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };
  
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleAddTask = (newTask: Task) => {
      setTasks(prev => [...prev, newTask]);
      
      // Trigger Notification if assigned to someone else
      if (newTask.assigneeId !== currentUser?.id) {
          const assignee = users.find(u => u.id === newTask.assigneeId);
          if (assignee) {
              addNotification('Tâche assignée', `Tâche envoyée à ${assignee.name}.`, 'success');
          }
      }
  };

  const handleSendMessage = (text: string, channelId: string) => {
      if (!currentUser) return;
      
      const newMessage: Message = {
          id: Date.now().toString(),
          userId: currentUser.id,
          channelId,
          content: text,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      setMessages(prev => [...prev, newMessage]);
  };

  // Team Management
  const handleAddUser = (newUser: User) => {
      setUsers([...users, newUser]);
      addNotification('Membre ajouté', `${newUser.name} a rejoint l'équipe.`, 'success');
  };

  const handleRemoveUser = (userId: string) => {
      setUsers(users.filter(u => u.id !== userId));
  };

  const handleUpdateRole = (userId: string, role: UserRole) => {
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
        <ToastContainer notifications={notifications} onDismiss={removeNotification} />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary mb-2">
              <span className="text-primary">i</span>VISION AGENCY
            </h1>
            <p className="text-slate-500">Connectez-vous à votre espace de travail</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-200 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-500 font-medium"
                  placeholder="nom@ivision.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                <a href="#" className="text-xs text-primary hover:underline">Oublié ?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-200 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-500 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
            >
              <LogIn size={18} />
              <span>Se connecter</span>
            </button>
          </form>

          {/* Demo Quick Access */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider text-center mb-4">Comptes de démonstration</p>
            <div className="grid grid-cols-3 gap-3">
              {MOCK_USERS.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleDemoLogin(user)}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100 transform hover:-translate-y-1"
                >
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mb-2 opacity-80 group-hover:opacity-100 transition-opacity shadow-sm" />
                  <span className="text-[10px] text-slate-500 font-medium text-center leading-tight">{user.name.split(' ')[0]}<br/><span className="opacity-70 font-normal">{user.role}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={() => setCurrentUser(null)}
    >
      <ToastContainer notifications={notifications} onDismiss={removeNotification} />
      
      {currentView === 'dashboard' && (
        <Dashboard 
          currentUser={currentUser} 
          tasks={tasks}
          campaigns={MOCK_CAMPAIGNS}
          onNavigate={setCurrentView}
        />
      )}
      {currentView === 'tasks' && (
        <Tasks 
            tasks={tasks} 
            users={users} 
            currentUser={currentUser}
            onUpdateStatus={handleUpdateTaskStatus}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
        />
      )}
      {currentView === 'chat' && (
        <Chat 
            currentUser={currentUser} 
            users={users} 
            channels={MOCK_CHANNELS}
            currentChannelId={currentChannelId}
            messages={messages}
            onChannelChange={setCurrentChannelId}
            onSendMessage={handleSendMessage}
        />
      )}
      {currentView === 'files' && currentUser && (
        <Files tasks={tasks} messages={messages} currentUser={currentUser} />
      )}
      {currentView === 'reports' && (
        <Reports 
            currentUser={currentUser} 
            campaignsData={MOCK_CAMPAIGNS} 
            tasks={tasks}
            users={users}
        />
      )}
      {currentView === 'team' && (
        <Team 
            currentUser={currentUser} 
            users={users} 
            tasks={tasks}
            activities={MOCK_ACTIVITIES}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
            onUpdateRole={handleUpdateRole}
        />
      )}
    </Layout>
  );
};

export default App;
