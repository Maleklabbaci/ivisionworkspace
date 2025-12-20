
export enum UserRole {
  ADMIN = 'Admin',
  MEMBER = 'Membre',
  PROJECT_MANAGER = 'Chef de Projet',
  COMMUNITY_MANAGER = 'Community Manager',
  ANALYST = 'Analyste Marketing',
}

export interface UserPermissions {
  canCreateTasks?: boolean;
  canEditAllTasks?: boolean;
  canDeleteTasks?: boolean;
  canManageChat?: boolean;
  canViewFiles?: boolean;
  canDeleteFiles?: boolean;
  canManageTeam?: boolean;
  canManageChannels?: boolean;
  canViewReports?: boolean;
  canExportReports?: boolean;
  canManageClients?: boolean;
  canManageCampaigns?: boolean;
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
  lastSeen?: string;
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
  fullTimestamp?: string;
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
  clientId?: string;
  dueDate: string;
  status: TaskStatus;
  type: 'content' | 'ads' | 'social' | 'seo' | 'admin'; 
  priority?: 'low' | 'medium' | 'high';
  comments?: Comment[];
  subtasks?: Subtask[];
  attachments?: string[];
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
  fullTimestamp: string;
  attachments?: string[];
}

export interface FileLink {
  id: string;
  name: string;
  url: string;
  clientId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'urgent';
}

export type ViewState = 'dashboard' | 'tasks' | 'chat' | 'files' | 'team' | 'settings' | 'reports' | 'clients' | 'calendar';

export type CampaignCategory = 'content' | 'ads' | 'social' | 'mixed';

export interface CampaignMetric {
  name: string;
  category: CampaignCategory;
  clicks: number;
  conversions: number;
  impressions: number;
}
