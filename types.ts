
export enum UserRole {
  ADMIN = 'Admin',
  MEMBER = 'Membre',
  PROJECT_MANAGER = 'Chef de Projet',
  COMMUNITY_MANAGER = 'Community Manager',
  ANALYST = 'Analyste Marketing',
}

export interface UserPermissions {
  canCreateTasks?: boolean;
  canDeleteTasks?: boolean;
  canManageChat?: boolean;
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
  attachments?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  status: TaskStatus;
  type: 'content' | 'ads' | 'social' | 'seo' | 'admin'; 
  priority?: 'low' | 'medium' | 'high';
  comments?: Comment[];
  attachments?: string[];
  price?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: 'global' | 'project';
  unread?: number;
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

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'urgent';
}

export type ViewState = 'dashboard' | 'tasks' | 'chat' | 'files' | 'team' | 'settings' | 'reports' | 'campaigns';

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
