
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
  canManageLeads?: boolean;
  canManageCampaigns?: boolean;
  canManageFinances?: boolean;
  canManageProjects?: boolean;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  totalBudget: number;
  spentBudget: number;
  status: 'active' | 'completed' | 'on_hold';
  clientId?: string;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  userId: string;
  projectId?: string;
  amount: number;
  bonus?: number;
  frequency: 'hebdo' | 'mensuel';
  status: 'paid' | 'pending';
  lastPaidDate?: string;
}

export interface Expense {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: 'travel' | 'freelance' | 'software' | 'office' | 'other';
  projectId?: string;
  status: 'paid' | 'pending';
  createdAt: string;
}

export interface AdCampaignExpense {
  id: string;
  name: string;
  platform: 'facebook' | 'google' | 'tiktok' | 'instagram' | 'other';
  amount: number;
  projectId?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
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

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  source?: string;
  valueMin?: number;
  valueMax?: number;
  description?: string;
  createdAt: string;
}

export enum TaskStatus {
  TODO = 'À faire',
  IN_PROGRESS = 'En cours',
  BLOCKED = 'Bloqué',
  DONE = 'Terminé',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  clientId?: string;
  projectId?: string;
  dueDate: string;
  status: TaskStatus;
  type: 'content' | 'ads' | 'social' | 'seo' | 'admin'; 
  priority?: 'low' | 'medium' | 'high';
  attachments?: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'global' | 'project';
  created_by?: string;
  member_ids?: string[];
  is_private?: boolean;
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

export type ViewState = 'dashboard' | 'tasks' | 'chat' | 'files' | 'team' | 'settings' | 'reports' | 'clients' | 'calendar' | 'leads' | 'projects' | 'finance';

export type CampaignCategory = 'content' | 'ads' | 'social' | 'mixed';

export interface CampaignMetric {
  name: string;
  category: CampaignCategory;
  clicks: number;
  conversions: number;
  impressions: number;
}
