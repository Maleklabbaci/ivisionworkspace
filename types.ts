

export enum UserRole {
  ADMIN = 'Admin',
  MEMBER = 'Membre',
  PROJECT_MANAGER = 'Chef de Projet',
  COMMUNITY_MANAGER = 'Community Manager',
  ANALYST = 'Analyste Marketing',
}

export interface UserPermissions {
  canCreateTasks?: boolean;
  canEditAllTasks?: boolean;     // Modifier toutes les tâches
  canDeleteTasks?: boolean;
  canManageChat?: boolean;       // Supprimer messages
  canViewFiles?: boolean;        // Accès aux fichiers
  canDeleteFiles?: boolean;      // Supprimer des fichiers
  canViewFinancials?: boolean;   // Accès aux budgets
  canManageTeam?: boolean;       // Ajouter/Modifier des membres
  canManageChannels?: boolean;   // Créer/Supprimer des channels
  canViewReports?: boolean;      // Accès aux rapports
  canExportReports?: boolean;    // Exporter PDF/CSV
  canManageClients?: boolean;    // Accès et gestion des clients
  canManageCampaigns?: boolean;  // Accès et gestion des campagnes
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  phoneNumber?: string;
  notificationPref: 'push' | 'all';
  status: 'active' | 'pending';
  permissions?: UserPermissions;
  lastSeen?: string; // Timestamp ISO de la dernière activité
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
}

export enum TaskStatus {
  TODO = 'À faire',
  IN_PROGRESS = 'En cours',
  BLOCKED = 'Bloqué',
  DONE = 'Terminé',
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  fullTimestamp?: string; // Ajout pour la date exacte
  attachments?: string[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  clientId?: string; // Lien vers le client
  dueDate: string;
  status: TaskStatus;
  type: 'content' | 'ads' | 'social' | 'seo' | 'admin'; 
  priority?: 'low' | 'medium' | 'high';
  comments?: Comment[];
  subtasks?: Subtask[];
  attachments?: string[];
  price?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'global' | 'project';
  unread?: number;
  members?: string[];
}

export interface Message {
  id: string;
  userId: string;
  channelId: string;
  content: string;
  timestamp: string;
  fullTimestamp: string; // ISO Date string for comparison
  attachments?: string[];
}

export interface FileLink {
  id: string;
  name: string;
  url: string;
  clientId?: string; // Lien vers le client
  createdBy: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'urgent';
}

export type ViewState = 'dashboard' | 'tasks' | 'chat' | 'files' | 'team' | 'settings' | 'reports' | 'clients';

export type CampaignCategory = 'content' | 'ads' | 'social' | 'mixed';

export interface CampaignMetric {
  name: string;
  category: CampaignCategory;
  budget: number;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
}
