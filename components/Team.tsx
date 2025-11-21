
import React, { useState } from 'react';
import { User, UserRole, ActivityLog, Task, TaskStatus } from '../types';
import { MoreHorizontal, Mail, Shield, Trash2, UserPlus, History, Briefcase, Bell, Lock, X, CheckCircle, AlertCircle, Edit2, Save } from 'lucide-react';

interface TeamProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  activities: ActivityLog[];
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onApproveUser: (userId: string) => void;
  onUpdateMember: (userId: string, updatedData: Partial<User>) => void;
}

const Team: React.FC<TeamProps> = ({ currentUser, users, tasks, activities, onAddUser, onRemoveUser, onUpdateRole, onApproveUser, onUpdateMember }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  // New User State (Password removed as Admin adds the profile directly)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.MEMBER, notificationPref: 'all' as 'push' | 'all' });
  
  // Edit User State
  const [editUser, setEditUser] = useState<Partial<