
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Sparkles, Filter, LayoutGrid, List, AlertCircle, Paperclip, Send, X, FileText, Trash2, DollarSign, ChevronLeft, ChevronRight, Lock, CheckCircle, MessageSquare, User as UserIcon, Link as LinkIcon, ExternalLink, Edit2, CheckSquare, Square } from 'lucide-react';
import { Task, TaskStatus, User, Comment, UserRole, Subtask } from '../types';
import { brainstormTaskIdeas } from '../services/geminiService';

interface TasksProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onAddFileLink?: (name: string, url: string) => void; 
  onDeleteAttachment?: (taskId: string, url: string) => void;
  onDeleteComment?: (taskId: string, commentId: string) => void;
  handleAddSubtask?: (taskId: string, title: string) => void;
  handleToggleSubtask?: (taskId: string, subtaskId: string, isCompleted: boolean) => void;
  handleDeleteSubtask?: (taskId: string, subtaskId: string) => void;
}

// Optimization: Memoized Task Card Component
const TaskCard = React.memo(({ task, assignee, canDelete, onDelete, onDragStart, onClick, canViewFinancials }: { 
    task: Task, 
    assignee?: User, 
    canDelete: boolean, 
    onDelete: (id: string, e: React.MouseEvent) => void,
    onDragStart: (e: React.DragEvent, id: string) => void,
    onClick: (id: string) => void,
    canViewFinancials: boolean
}) => {
    const getProgressConfig = (status: TaskStatus) => {
        switch(status) {
            case TaskStatus.DONE: return { width: '100%', color: 'bg-green-500' };
            case TaskStatus.IN_PROGRESS: return { width: '40%', color: 'bg-blue-500' };
            case TaskStatus.BLOCKED: return { width: '15%', color: 'bg-red-500' };
            default: return { width: '0%', color: 'bg-slate-200' }; 
        }
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'content': return 'bg-blue-100 text-blue-700';
            case 'ads': return 'bg-green-100 text-green-700';
            case 'social': return 'bg-purple-100 text-purple-700';
            case 'seo': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };
    
    const progress = getProgressConfig(task.status);

    // Subtasks Progress
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
    const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
        <div 
          draggable
          onDragStart={(e) => onDragStart(e, task.id)}
          onClick={() => onClick(task.id)}
          className="bg-white p-3 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
            {/* Priority Badge Top Right */}
            <div className="absolute top-3 right-3">
                {task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100"></div>}
                {task.priority === 'medium' && <div className="w-2 h-2 rounded-full bg-orange-400 ring-2 ring-orange-100"></div>}
            </div>

            <div className="">
                {canDelete && (
                    <button 
                    onClick={(e) => onDelete(task.id, e)}
                    className="absolute bottom-3 right-3 p-1.5 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 border border-slate-100 shadow-sm"
                    title="Supprimer"
                    >
                        <Trash2 size={13} />
                    </button>
                )}

                <div className="flex justify-between items-center mb-2 mr-4">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${getTypeColor(task.type)}`}>{task.type}</span>
                </div>
                
                <h4 className="font-bold text-slate-800 mb-2 text-sm leading-snug group-hover:text-primary transition-colors pr-2">{task.title}</h4>
                
                {/* Admin or Permission: Price Badge */}
                {canViewFinancials && typeof task.price === 'number' && task.price > 0 && (
                <div className="mb-3">
                    <span className="text-[10px] font-mono bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                    {task.price} DA
                    </span>
                </div>
                )}
                
                {/* Main Progress Bar Visual */}
                <div className="w-full bg-slate-100 h-1 rounded-full mb-3 overflow-hidden">
                    <div className={`h-full rounded-full ${progress.color} transition-all duration-500`} style={{ width: progress.width }}></div>
                </div>

                {/* Subtasks Indicator if any */}
                {totalSubtasks > 0 && (
                    <div className="mb-3 flex items-center text-[10px] text-slate-400 space-x-1">
                        <CheckSquare size={10} />
                        <span>{completedSubtasks}/{totalSubtasks}</span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden ml-1">
                            <div className="bg-emerald-400 h-full" style={{width: `${subtaskProgress}%`}}></div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-400 font-medium">
                        <CalendarIcon size={12} className="mr-1" />
                        {new Date(task.dueDate).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                    </div>
                    <div className="flex -space-x-2">
                        {assignee ? (
                            <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" title={assignee.name} />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center"><UserIcon size={10} className="text-slate-400"/></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

type ViewMode = 'board' | 'calendar';

const Tasks: React.FC<TasksProps> = ({ tasks, users, currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask, onAddComment, onAddFileLink, onDeleteAttachment, onDeleteComment, handleAddSubtask, handleToggleSubtask, handleDeleteSubtask }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showModal, setShowModal] = useState(false);
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [taskComment, setTaskComment] = useState('');
  
  // Subtask Input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null); 
  const [dragOverDate, setDragOverDate] = useState<string | null>(null); 
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assigneeId: currentUser.id,
    dueDate: '',
    type: 'content',
    priority: 'medium',
    attachments: [],
    price: 0
  });

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  const canCreateTask = () => currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.permissions?.canCreateTasks === true;
  const canDeleteTask = () => currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.permissions?.canDeleteTasks === true;
  const canViewFinancials = () => currentUser.role === UserRole.ADMIN || currentUser.permissions?.canViewFinancials === true;

  const visibleTasks = useMemo(() => {
    return (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.permissions?.canCreateTasks)
      ? tasks 
      : tasks.filter(t => t.assigneeId === currentUser.id);
  }, [tasks, currentUser.role, currentUser.permissions, currentUser.id]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setNewTask({ ...newTask, type: String(e.target.value) as any });
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    return { days, firstDay: firstDayAdjusted, year, month };
  };

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", taskId);
  }, []);

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverDate !== dateStr) setDragOverDate(dateStr);
  };

  const handleDragLeave = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
      e.preventDefault();
      setDragOverDate(null);
      if (!draggedTaskId) return;
      const taskToMove = tasks.find(t => t.id === draggedTaskId);
      if (taskToMove && taskToMove.dueDate !== targetDate) {
          onUpdateTask({ ...taskToMove, dueDate: targetDate });
      }
      setDraggedTaskId(null);
  };

  const handleBrainstorm = async () => {
    if (!brainstormTopic) return;
    setIsBrainstorming(true);
    const ideas = await brainstormTaskIdeas(brainstormTopic);
    if (ideas.length > 0) setNewTask(prev => ({ ...prev, description: ideas.join('\n- ') }));
    setIsBrainstorming(false);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.title || !newTask.assigneeId || !newTask.dueDate) return;

      const task: Task = {
          id: 'temp-id-' + Date.now(),
          title: String(newTask.title || ''),
          description: String(newTask.description || ''),
          assigneeId: String(newTask.assigneeId),
          dueDate: String(newTask.dueDate),
          status: TaskStatus.TODO,
          type: String(newTask.type || 'content') as any,
          priority: String(newTask.priority || 'medium') as any,
          comments: [],
          attachments: Array.isArray(newTask.attachments) ? newTask.attachments.map(String) : [],
          price: Number(newTask.price) || 0
      };

      onAddTask(task);
      setShowModal(false);
      setNewTask({ title: '', description: '', assigneeId: currentUser.id, dueDate: '', type: 'content', priority: 'medium', attachments: [], price: 0 });
      setBrainstormTopic('');
  };

  const handleAddComment = () => {
    if(!selectedTask || !taskComment.trim()) return;
    onAddComment(selectedTask.id, taskComment);
    setTaskComment('');
  };

  const handleDeleteClick = useCallback((taskId: string, e?: React.MouseEvent) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
          onDeleteTask(taskId);
      }
  }, [onDeleteTask]);
  
  const handleDeleteAttachmentClick = (url: string) => {
      if(!selectedTask || !onDeleteAttachment) return;
      if(window.confirm("Voulez-vous supprimer cette pièce jointe ?")) {
          onDeleteAttachment(selectedTask.id, url);
      }
  };

  const handleDeleteCommentClick = (commentId: string) => {
      if (!selectedTask || !onDeleteComment) return;
      if (window.confirm("Supprimer ce commentaire ?")) {
          onDeleteComment(selectedTask.id, commentId);
      }
  };

  const handleOpenLinkModal = () => setShowLinkModal(true);

  const handleSaveLink = (e: React.FormEvent) => {
      e.preventDefault();
      if (!linkUrl) return;
      
      let finalUrl = linkUrl;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          if (finalUrl.startsWith('www.')) finalUrl = 'https://' + finalUrl;
          else finalUrl = 'https://' + finalUrl;
      }

      const nameToSave = linkName.trim() || finalUrl;
      
      // 1. Save Global File Link if handler exists
      if (onAddFileLink) {
          onAddFileLink(nameToSave, finalUrl);
      }

      // 2. Associate with Task
      if (showModal) {
         setNewTask(prev => ({ ...prev, attachments: [...(prev.attachments || []), finalUrl] }));
      } else if (selectedTask) {
         onAddComment(selectedTask.id, `📎 Fichier attaché: ${nameToSave} \n${finalUrl}`);
      }
      
      setShowLinkModal(false);
      setLinkName('');
      setLinkUrl('');
  };
  
  const handleStartEdit = () => {
      if (selectedTask) {
          setEditTitle(selectedTask.title);
          setEditDescription(selectedTask.description);
          setIsEditing(true);
      }
  };

  const handleSaveEdit = () => {
      if (selectedTask) {
          onUpdateTask({ ...selectedTask, title: editTitle, description: editDescription });
          setIsEditing(false);
      }
  };

  const handleCreateSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedTask && newSubtaskTitle.trim() && handleAddSubtask) {
          handleAddSubtask(selectedTask.id, newSubtaskTitle);
          setNewSubtaskTitle('');
      }
  };

  const isLink = (str: string) => str.startsWith('http://') || str.startsWith('https://');

  const getPriorityColor = (p?: string) => {
      switch(p) {
          case 'high': return 'text-urgent bg-red-50 border-red-100';
          case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
          default: return 'text-slate-500 bg-slate-50 border-slate-100';
      }
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'content': return 'bg-blue-100 text-blue-700';
          case 'ads': return 'bg-green-100 text-green-700';
          case 'social': return 'bg-purple-100 text-purple-700';
          case 'seo': return 'bg-yellow-100 text-yellow-700';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  const getCalendarChipStyle = (type: string, status: TaskStatus) => {
      if (status === TaskStatus.DONE) return "bg-gray-100 text-gray-400 border border-gray-200 line-through decoration-gray-400";
      const baseStyle = "border shadow-sm font-medium";
      switch(type) {
          case 'content': return `${baseStyle} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300`;
          case 'ads': return `${baseStyle} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300`;
          case 'social': return `${baseStyle} bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300`;
          case 'seo': return `${baseStyle} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300`;
          default: return `${baseStyle} bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100`;
      }
  };

  const handleCardClick = useCallback((id: string) => {
      setSelectedTaskId(id);
      setIsEditing(false);
  }, []);
  
  const canDelete = canDeleteTask();
  const canSeeMoney = canViewFinancials();

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Espace de Travail</h2>
            <p className="text-slate-500 text-sm flex items-center mt-1">
                {currentUser.role === UserRole.ADMIN ? 'Vue globale des projets' : 'Mes tâches assignées'}
            </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><LayoutGrid size={16} /><span className="hidden sm:inline">Tableau</span></button>
                <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><CalendarIcon size={16} /><span className="hidden sm:inline">Calendrier</span></button>
            </div>
            {canCreateTask() && (
                <button onClick={() => setShowModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center space-x-2 shadow-lg shadow-slate-900/20 transition-all transform hover:scale-105 active:scale-95"><Plus size={18} /><span className="hidden sm:inline">Tâche</span></button>
            )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
          <div className="flex-1 overflow-x-auto pb-4 min-h-0">
              <div className="flex space-x-6 min-w-[1200px] h-full px-1">
                 {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.DONE].map(status => {
                     const columnTasks = visibleTasks.filter(t => t.status === status);
                     return (
                         <div key={status} className="flex-1 min-w-[300px] flex flex-col h-full bg-slate-100/50 rounded-xl p-2 border border-slate-100">
                              <div className="flex justify-between items-center mb-4 shrink-0 px-2 pt-2">
                                  <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest flex items-center space-x-2">
                                    <span className={`w-2 h-2 rounded-full ring-2 ring-white shadow-sm ${status === TaskStatus.DONE ? 'bg-green-500' : status === TaskStatus.BLOCKED ? 'bg-red-500' : status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                    <span>{status}</span>
                                  </h3>
                                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{columnTasks.length}</span>
                              </div>
                              <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
                                  {columnTasks.map(task => {
                                      const assignee = userMap.get(task.assigneeId);
                                      return <TaskCard key={task.id} task={task} assignee={assignee} canDelete={canDelete} onDelete={handleDeleteClick} onDragStart={handleDragStart} onClick={handleCardClick} canViewFinancials={canSeeMoney} />;
                                  })}
                              </div>
                         </div>
                     )
                 })}
              </div>
          </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
          <div className="flex-1 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300 min-h-0">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center space-x-6">
                      <h3 className="text-2xl font-extrabold text-slate-900 capitalize tracking-tight">{currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                      <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
                          <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-slate-500 transition-all"><ChevronLeft size={18} /></button>
                          <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-slate-500 transition-all"><ChevronRight size={18} /></button>
                      </div>
                      <button onClick={goToToday} className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">Aujourd'hui</button>
                  </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
                        <div key={day} className="py-3 text-center border-r border-slate-100 last:border-r-0"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day}</span></div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar bg-white border-b border-slate-200">
                     {(() => {
                         const { days, firstDay, year, month } = getDaysInMonth(currentDate);
                         const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
                         const cells = [];
                         for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="bg-white border-b border-r border-slate-100"></div>);
                         for (let day = 1; day <= days; day++) {
                             const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                             const dayTasks = visibleTasks.filter(t => t.dueDate === dateStr);
                             const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                             const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                             cells.push(
                                 <div key={day} onDragOver={(e) => handleDragOver(e, dateStr)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, dateStr)} className={`min-h-[140px] p-3 flex flex-col border-b border-r border-slate-100 transition-colors duration-200 relative group ${dragOverDate === dateStr ? 'bg-blue-50/80 ring-2 ring-inset ring-primary z-20' : ''} ${isWeekend ? 'bg-slate-50/40' : 'bg-white'} ${isToday ? 'bg-blue-50/10' : ''} hover:bg-slate-50/80`}>
                                     <div className="flex justify-between items-start mb-2">
                                         <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${isToday ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-700 group-hover:text-slate-900'}`}>{day}</div>
                                         {canCreateTask() && <button onClick={(e) => { e.stopPropagation(); setNewTask({...newTask, dueDate: dateStr}); setShowModal(true); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-md text-slate-400 hover:text-primary transition-all shadow-sm"><Plus size={14} /></button>}
                                     </div>
                                     <div className="flex-1 flex flex-col space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                                         {dayTasks.map(task => (
                                             <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }} className={`px-2 py-1.5 rounded-md text-[11px] cursor-grab active:cursor-grabbing transition-all group/task ${draggedTaskId === task.id ? 'opacity-50 scale-95 rotate-2' : 'opacity-100'} ${getCalendarChipStyle(task.type, task.status)}`}>
                                                 <div className="flex items-center justify-between"><span className="truncate font-semibold leading-tight">{task.title}</span></div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             );
                         }
                         const remainingSlots = totalSlots - (firstDay + days);
                         for (let i = 0; i < remainingSlots; i++) cells.push(<div key={`empty-end-${i}`} className="bg-white border-b border-r border-slate-100"></div>);
                         return cells;
                     })()}
                </div>
              </div>
          </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                      <h3 className="text-xl font-bold text-slate-900">Créer une nouvelle tâche</h3>
                      <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <form id="createTaskForm" onSubmit={handleSubmitTask} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Titre de la tâche</label>
                                  <input type="text" required className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none placeholder-gray-500 transition-all font-medium" placeholder="Ex: Campagne Facebook Hiver" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigné à</label>
                                  <select className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium" value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}>
                                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Date limite</label>
                                  <input type="date" required className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all accent-primary font-medium" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Service (Type)</label>
                                  <select className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium" value={newTask.type} onChange={handleTypeChange}>
                                      <option value="content">Création de Contenu</option>
                                      <option value="ads">Publicité (Ads)</option>
                                      <option value="social">Social Media</option>
                                      <option value="seo">SEO / Web</option>
                                      <option value="admin">Administratif</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
                                  <select className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}>
                                      <option value="low">Basse</option>
                                      <option value="medium">Moyenne</option>
                                      <option value="high">Haute</option>
                                  </select>
                              </div>
                              {canViewFinancials() && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><DollarSign size={14} className="mr-1.5 text-slate-400"/> Prix / Budget</label>
                                    <div className="relative">
                                        <input type="number" min="0" className="w-full p-2.5 pl-4 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium" placeholder="0" value={newTask.price || ''} onChange={e => setNewTask({...newTask, price: parseFloat(e.target.value) || 0})} />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs font-bold">DA</span>
                                    </div>
                                </div>
                              )}
                              <div className="col-span-2">
                                  <div className="flex justify-between items-center mb-1">
                                      <label className="block text-sm font-medium text-slate-700">Description</label>
                                      <button type="button" onClick={() => setIsBrainstorming(!isBrainstorming)} className="text-xs text-primary flex items-center font-medium hover:underline"><Sparkles size={12} className="mr-1" /> Assistant IA</button>
                                  </div>
                                  {isBrainstorming && (
                                      <div className="mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                                          <input type="text" placeholder="Sujet de la campagne..." className="w-full text-sm p-2 bg-gray-200 text-black border border-gray-300 rounded mb-2 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" value={brainstormTopic} onChange={e => setBrainstormTopic(e.target.value)} />
                                          <button type="button" onClick={handleBrainstorm} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">Générer des idées</button>
                                      </div>
                                  )}
                                  <textarea className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none h-24 resize-none placeholder-gray-500 transition-all font-medium" placeholder="Détails de la tâche..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
                              </div>
                              <div className="col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Pièces jointes</label>
                                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer" onClick={handleOpenLinkModal}>
                                      <Paperclip size={20} className="mb-2" />
                                      <span className="text-xs">Ajouter un lien</span>
                                  </div>
                                  {newTask.attachments && newTask.attachments.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                          {newTask.attachments.map((file, idx) => (
                                              <div key={idx} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded flex items-center border border-slate-200 max-w-full">
                                                  {isLink(String(file)) ? <LinkIcon size={10} className="mr-1"/> : <FileText size={10} className="mr-1"/>} 
                                                  <span className="truncate max-w-[200px]">{String(file)}</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </form>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 shrink-0">
                      <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition-colors">Annuler</button>
                      <button type="submit" form="createTaskForm" className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-md transition-colors">Créer la tâche</button>
                  </div>
              </div>
          </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 relative custom-scrollbar">
                       <div className="flex justify-between items-start mb-4">
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getTypeColor(selectedTask.type)}`}>{selectedTask.type}</span>
                           <button onClick={() => setSelectedTaskId(null)} className="text-slate-400 hover:text-slate-600 md:hidden"><X size={24}/></button>
                       </div>
                       {isEditing ? (
                           <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Titre</label>
                                <input type="text" className="w-full text-xl font-bold text-slate-900 border-b-2 border-primary outline-none bg-transparent py-1" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                           </div>
                       ) : (
                           <div className="flex items-center justify-between group/header mb-2">
                                <h2 className="text-2xl font-bold text-slate-900">{selectedTask.title}</h2>
                                {!isEditing && <button onClick={handleStartEdit} className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-full transition-all opacity-0 group-hover/header:opacity-100"><Edit2 size={18} /></button>}
                           </div>
                       )}
                       {canViewFinancials() && typeof selectedTask.price === 'number' && (
                           <div className="mb-4 flex items-center"><div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 text-sm font-medium flex items-center"><DollarSign size={14} className="mr-1 text-slate-400" /> Budget : {selectedTask.price} DA</div></div>
                       )}
                       <div className="flex items-center space-x-4 mb-6 text-sm text-slate-600">
                           {users.filter(u => u.id === selectedTask.assigneeId).map(u => (
                               <div key={u.id} className="flex items-center space-x-2"><img src={u.avatar} className="w-6 h-6 rounded-full" alt={u.name} /><span>{u.name}</span></div>
                           ))}
                           <div className="flex items-center space-x-1"><CalendarIcon size={16} /><span>{selectedTask.dueDate}</span></div>
                       </div>

                       {/* Subtasks / Checklist Section */}
                       {handleAddSubtask && (
                           <div className="mb-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
                               <h4 className="font-bold text-slate-800 mb-3 flex items-center"><CheckSquare size={16} className="mr-2"/> Checklist</h4>
                               
                               {/* Progress Bar for Subtasks */}
                               {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                                   <div className="mb-4">
                                       <div className="flex justify-between text-xs text-slate-500 mb-1">
                                           <span>Progression</span>
                                           <span>{Math.round((selectedTask.subtasks.filter(s => s.isCompleted).length / selectedTask.subtasks.length) * 100)}%</span>
                                       </div>
                                       <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                           <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(selectedTask.subtasks.filter(s => s.isCompleted).length / selectedTask.subtasks.length) * 100}%` }}></div>
                                       </div>
                                   </div>
                               )}

                               <div className="space-y-2 mb-3">
                                   {selectedTask.subtasks?.map(subtask => (
                                       <div key={subtask.id} className="flex items-center justify-between group/subtask p-2 hover:bg-white rounded-lg transition-colors">
                                           <div className="flex items-center space-x-3">
                                               <button 
                                                 onClick={() => handleToggleSubtask && handleToggleSubtask(selectedTask.id, subtask.id, !subtask.isCompleted)}
                                                 className={`text-slate-400 hover:text-emerald-500 transition-colors ${subtask.isCompleted ? 'text-emerald-500' : ''}`}
                                               >
                                                   {subtask.isCompleted ? <CheckCircle size={18} /> : <Square size={18} />}
                                               </button>
                                               <span className={`text-sm ${subtask.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{subtask.title}</span>
                                           </div>
                                           <button onClick={() => handleDeleteSubtask && handleDeleteSubtask(selectedTask.id, subtask.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/subtask:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                       </div>
                                   ))}
                               </div>
                               <form onSubmit={handleCreateSubtask} className="flex gap-2">
                                   <input 
                                     type="text" 
                                     placeholder="Ajouter une sous-tâche..." 
                                     className="flex-1 text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                     value={newSubtaskTitle}
                                     onChange={e => setNewSubtaskTitle(e.target.value)}
                                   />
                                   <button type="submit" disabled={!newSubtaskTitle.trim()} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary rounded-lg transition-all disabled:opacity-50"><Plus size={16} /></button>
                               </form>
                           </div>
                       )}

                       {isEditing ? (
                           <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary min-h-[200px] font-medium text-slate-700 resize-y leading-relaxed" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                <div className="flex justify-end space-x-3 mt-3">
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Annuler</button>
                                    <button onClick={handleSaveEdit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors">Enregistrer</button>
                                </div>
                           </div>
                       ) : (
                           <div className="prose prose-sm text-slate-600 mb-8 relative group/desc border border-transparent hover:border-slate-100 hover:bg-slate-50/50 rounded-lg p-2 -ml-2 transition-all">
                               <p className="whitespace-pre-wrap">{selectedTask.description}</p>
                               {!isEditing && <button onClick={handleStartEdit} className="absolute top-2 right-2 text-slate-400 hover:text-primary opacity-0 group-hover/desc:opacity-100 transition-opacity bg-white shadow-sm p-1.5 rounded border border-slate-100"><Edit2 size={14} /></button>}
                           </div>
                       )}

                       {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                           <div className="mb-8">
                               <h4 className="font-bold text-slate-800 mb-3 flex items-center"><Paperclip size={16} className="mr-2"/> Pièces jointes / Liens</h4>
                               <div className="grid grid-cols-2 gap-2">
                                   {selectedTask.attachments.map((file, i) => {
                                       const link = isLink(file);
                                       return (
                                       <div key={i} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors group/att">
                                           <div className="flex items-center space-x-2 truncate flex-1">
                                               {link ? <LinkIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-slate-400" />}
                                               <span className="text-sm truncate" title={file}>{file}</span>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                              <button onClick={() => window.open(file, '_blank')} className="text-primary text-xs font-bold hover:underline flex items-center"><ExternalLink size={12} className="mr-1"/> {link ? "Ouvrir" : "Télécharger"}</button>
                                              {onDeleteAttachment && <button onClick={() => handleDeleteAttachmentClick(file)} className="text-slate-300 hover:text-red-500 p-1 rounded-full transition-colors opacity-0 group-hover/att:opacity-100"><Trash2 size={14} /></button>}
                                           </div>
                                       </div>
                                   )})}
                               </div>
                           </div>
                       )}

                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                           <h4 className="font-bold text-slate-800 mb-4 flex items-center"><MessageSquare size={16} className="mr-2"/> Commentaires</h4>
                           <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                               {selectedTask.comments?.length === 0 ? (
                                   <p className="text-slate-400 text-sm italic">Aucun commentaire pour le moment.</p>
                               ) : (
                                   selectedTask.comments?.map(comment => {
                                       const user = userMap.get(comment.userId);
                                       const canDeleteComment = comment.userId === currentUser.id || currentUser.role === UserRole.ADMIN;
                                       return (
                                           <div key={comment.id} className="flex space-x-3 animate-in slide-in-from-bottom-2 group/comment">
                                               <img src={user?.avatar} className="w-8 h-8 rounded-full mt-1" alt="Avatar" />
                                               <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1 shadow-sm relative">
                                                   <div className="flex justify-between items-center mb-1"><span className="font-bold text-sm text-slate-900">{user?.name}</span><span className="text-xs text-slate-400">{comment.timestamp}</span></div>
                                                   <p className="text-sm text-slate-700 whitespace-pre-line">{comment.content}</p>
                                                   {canDeleteComment && onDeleteComment && <button onClick={() => handleDeleteCommentClick(comment.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 opacity-0 group-hover/comment:opacity-100 transition-opacity"><Trash2 size={12} /></button>}
                                               </div>
                                           </div>
                                       );
                                   })
                               )}
                           </div>
                           <div className="flex items-center space-x-2">
                               <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="Me" />
                               <div className="flex-1 relative">
                                   <input type="text" placeholder="Écrire un commentaire..." className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" value={taskComment} onChange={(e) => setTaskComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                                   <button onClick={handleAddComment} disabled={!taskComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary disabled:opacity-50"><Send size={16} /></button>
                               </div>
                           </div>
                       </div>
                  </div>

                  <div className="w-full md:w-72 bg-slate-50 p-6 flex flex-col shrink-0">
                      <div className="flex justify-end mb-6 hidden md:block"><button onClick={() => setSelectedTaskId(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div>
                      <div className="space-y-6">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Statut</label>
                              <div className="space-y-2">
                                  {Object.values(TaskStatus).map(status => (
                                      <button key={status} onClick={() => onUpdateStatus(selectedTask.id, status)} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all border ${selectedTask.status === status ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-white text-slate-600'}`}>
                                          <div className="flex items-center"><div className={`w-2 h-2 rounded-full mr-2 ${status === TaskStatus.DONE ? 'bg-green-500' : status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : status === TaskStatus.BLOCKED ? 'bg-red-500' : 'bg-slate-400'}`} />{status}</div>
                                          {selectedTask.status === status && <CheckCircle size={16} />}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Priorité</label>
                              <div className="flex space-x-2">
                                  {(['low', 'medium', 'high'] as const).map(p => (
                                      <button key={p} onClick={() => onUpdateTask({...selectedTask, priority: p})} className={`flex-1 py-1.5 text-xs font-bold rounded uppercase border transition-all ${selectedTask.priority === p ? getPriorityColor(p) + ' ring-1 ring-offset-1 ring-slate-300' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>{p === 'low' ? 'Basse' : p === 'medium' ? 'Moy.' : 'Haute'}</button>
                                  ))}
                              </div>
                          </div>
                          <div>
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Actions</label>
                               <button className="w-full flex items-center space-x-2 p-2 text-sm text-slate-600 hover:bg-white rounded-lg transition-colors mb-2" onClick={handleOpenLinkModal}><Paperclip size={16} /><span>Ajouter un fichier</span></button>
                               {canDelete && <button onClick={() => handleDeleteClick(selectedTask.id)} className="w-full flex items-center space-x-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /><span>Supprimer la tâche</span></button>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Link Modal */}
      {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Ajouter un lien externe</h3>
                      <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveLink} className="p-6 space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg flex items-start text-xs text-blue-700 mb-4"><LinkIcon size={16} className="mr-2 flex-shrink-0 mt-0.5" /><p>Pour économiser l'espace de stockage, ajoutez le lien vers vos fichiers (Google Drive, Dropbox, WeTransfer).</p></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom du fichier (Optionnel)</label><input type="text" value={linkName} onChange={e => setLinkName(e.target.value)} className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: Maquette V1" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">URL (Lien)</label><input type="url" required value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="https://drive.google.com/..." /></div>
                      <div className="flex justify-end space-x-3 mt-4"><button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm">Ajouter</button></div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tasks;
