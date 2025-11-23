
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Sparkles, Filter, LayoutGrid, List, AlertCircle, Paperclip, Send, X, FileText, Trash2, DollarSign, ChevronLeft, ChevronRight, Lock, CheckCircle, MessageSquare, User as UserIcon } from 'lucide-react';
import { Task, TaskStatus, User, Comment, UserRole } from '../types';
import { brainstormTaskIdeas } from '../services/geminiService';

interface TasksProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type ViewMode = 'board' | 'calendar';

const Tasks: React.FC<TasksProps> = ({ tasks, users, currentUser, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [taskComment, setTaskComment] = useState('');
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null); // DRAG & DROP STATE
  const [dragOverDate, setDragOverDate] = useState<string | null>(null); // VISUAL FEEDBACK STATE
  
  // New Task State
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

  // --- PERMISSIONS HELPERS ---
  
  const canCreateTask = () => {
      return currentUser.role === UserRole.ADMIN || 
             currentUser.role === UserRole.PROJECT_MANAGER || 
             currentUser.permissions?.canCreateTasks === true;
  };

  const canDeleteTask = () => {
      return currentUser.role === UserRole.ADMIN || 
             currentUser.role === UserRole.PROJECT_MANAGER || 
             currentUser.permissions?.canDeleteTasks === true;
  };

  const canViewFinancials = () => {
      return currentUser.role === UserRole.ADMIN || 
             currentUser.permissions?.canViewFinancials === true;
  };

  // Helper for Progress Bar logic
  const getProgressConfig = (status: TaskStatus) => {
      switch(status) {
          case TaskStatus.DONE: return { width: '100%', color: 'bg-green-500', text: '100%' };
          case TaskStatus.IN_PROGRESS: return { width: '40%', color: 'bg-blue-500', text: '40%' };
          case TaskStatus.BLOCKED: return { width: '15%', color: 'bg-red-500', text: 'Bloqué' };
          default: return { width: '0%', color: 'bg-slate-200', text: '0%' }; 
      }
  };

  // Filter tasks based on role
  const visibleTasks = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PROJECT_MANAGER || currentUser.permissions?.canCreateTasks)
    ? tasks 
    : tasks.filter(t => t.assigneeId === currentUser.id);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = String(e.target.value);
      setNewTask({ 
          ...newTask, 
          type: newType as any
      });
  };

  // --- Calendar Logic ---
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
    // Adjust for Monday start (European/French standard)
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    return { days, firstDay: firstDayAdjusted, year, month };
  };

  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverDate !== dateStr) {
          setDragOverDate(dateStr);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
  };

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
  // -----------------------

  const handleBrainstorm = async () => {
    if (!brainstormTopic) return;
    setIsBrainstorming(true);
    const ideas = await brainstormTaskIdeas(brainstormTopic);
    if (ideas.length > 0) {
        setNewTask(prev => ({ ...prev, description: ideas.join('\n- ') }));
    }
    setIsBrainstorming(false);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.title || !newTask.assigneeId || !newTask.dueDate) return;

      // Ensure string conversions to prevent [object Object]
      const taskTitle = String(newTask.title || '');
      const taskDesc = String(newTask.description || '');
      const taskAssignee = String(newTask.assigneeId);
      const taskDate = String(newTask.dueDate);
      const taskType = String(newTask.type || 'content') as any;
      const taskPriority = String(newTask.priority || 'medium') as any;
      const taskPrice = Number(newTask.price) || 0;
      const taskAttachments = Array.isArray(newTask.attachments) ? newTask.attachments.map(String) : [];

      const task: Task = {
          id: 'temp-id-' + Date.now(), // Placeholder ID, will be replaced by App.tsx
          title: taskTitle,
          description: taskDesc,
          assigneeId: taskAssignee,
          dueDate: taskDate,
          status: TaskStatus.TODO,
          type: taskType,
          priority: taskPriority,
          comments: [],
          attachments: taskAttachments,
          price: taskPrice
      };

      onAddTask(task);
      setShowModal(false);
      setNewTask({
        title: '', description: '', assigneeId: currentUser.id, dueDate: '', type: 'content', priority: 'medium', attachments: [], price: 0
      });
      setBrainstormTopic('');
  };

  const handleAddComment = () => {
    if(!selectedTask || !taskComment.trim()) return;
    
    // Fix: Generate a robust ID locally just in case, though server handles it usually.
    const newComment: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        content: taskComment,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    const updatedTask = {
        ...selectedTask,
        comments: [...(selectedTask.comments || []), newComment]
    };

    onUpdateTask(updatedTask);
    setSelectedTask(updatedTask);
    setTaskComment('');
  };

  const handleDeleteClick = (taskId: string) => {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche définitivement ?")) {
          onDeleteTask(taskId);
          if (selectedTask && selectedTask.id === taskId) {
              setSelectedTask(null);
          }
      }
  };

  const handleFileUpload = () => {
     const fakeFiles = ['brief_v2.pdf', 'assets_graphiques.zip'];
     const file = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
     
     if (showModal) {
         setNewTask(prev => ({ ...prev, attachments: [...(prev.attachments || []), file] }));
     } else if (selectedTask) {
         const updatedTask = {
             ...selectedTask,
             attachments: [...(selectedTask.attachments || []), file]
         };
         onUpdateTask(updatedTask);
         setSelectedTask(updatedTask);
     }
  };

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

  const renderBoardColumn = (status: TaskStatus) => {
      const columnTasks = visibleTasks.filter(t => t.status === status);
      
      return (
          <div className="flex-1 min-w-[280px] bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                        status === TaskStatus.DONE ? 'bg-success' : 
                        status === TaskStatus.BLOCKED ? 'bg-urgent' : 
                        status === TaskStatus.IN_PROGRESS ? 'bg-blue-400' : 'bg-slate-400'
                    }`} />
                    <span>{status}</span>
                  </h3>
                  <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{columnTasks.length}</span>
              </div>
              <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
                  {columnTasks.map(task => {
                      const progress = getProgressConfig(task.status);
                      
                      return (
                      <div 
                        key={task.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer group transform hover:-translate-y-1 relative"
                      >
                          {canDeleteTask() && (
                              <button 
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    handleDeleteClick(task.id); 
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white text-slate-300 hover:text-urgent hover:bg-red-50 rounded shadow-sm border border-slate-100 transition-colors z-10"
                                title="Supprimer"
                              >
                                  <Trash2 size={14} />
                              </button>
                          )}

                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getTypeColor(task.type)}`}>{task.type}</span>
                              {task.priority === 'high' && <AlertCircle size={14} className="text-urgent" />}
                          </div>
                          
                          <h4 className="font-bold text-slate-800 mb-1 text-sm leading-snug group-hover:text-primary transition-colors">{task.title}</h4>
                          
                          {/* Admin or Permission: Price Badge */}
                          {canViewFinancials() && typeof task.price === 'number' && task.price > 0 && (
                             <div className="mb-2">
                               <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                 {task.price} DA
                               </span>
                             </div>
                          )}
                          
                          {/* Visual Progress Bar (Kanban Card) */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 mb-3 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${progress.color}`} 
                                style={{ width: progress.width }}
                              ></div>
                          </div>

                          <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                  {users.filter(u => u.id === task.assigneeId).map(u => (
                                      <img key={u.id} src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full border-2 border-white" title={u.name} />
                                  ))}
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                  {new Date(task.dueDate).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}
                              </span>
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      );
  };

  // Helper for Calendar Chip Styling
  const getCalendarChipStyle = (type: string, status: TaskStatus) => {
      if (status === TaskStatus.DONE) {
          return "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-75";
      }
      switch(type) {
          case 'content': return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
          case 'ads': return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
          case 'social': return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
          case 'seo': return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200";
          default: return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
      }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Tâches</h2>
            <p className="text-slate-500 text-sm flex items-center">
                {currentUser.role === UserRole.ADMIN ? 'Vue globale des tâches & budgets' : 'Mes tâches assignées'}
                {currentUser.permissions?.canCreateTasks && currentUser.role !== UserRole.ADMIN && (
                   <span className="ml-2 text-xs bg-blue-100 text-primary px-2 py-0.5 rounded-full font-medium">Permission: Création activée</span>
                )}
            </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all ${viewMode === 'board' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <LayoutGrid size={16} />
                    <span className="hidden sm:inline">Kanban</span>
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all ${viewMode === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <CalendarIcon size={16} />
                    <span className="hidden sm:inline">Calendrier</span>
                </button>
            </div>
            {canCreateTask() && (
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center space-x-2 shadow-md shadow-primary/20 transition-all transform hover:scale-105"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Nouvelle Tâche</span>
                </button>
            )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
          <div className="flex-1 overflow-x-auto pb-4 min-h-0">
              <div className="flex space-x-4 min-w-[1000px] h-full">
                  {renderBoardColumn(TaskStatus.TODO)}
                  {renderBoardColumn(TaskStatus.IN_PROGRESS)}
                  {renderBoardColumn(TaskStatus.BLOCKED)}
                  {renderBoardColumn(TaskStatus.DONE)}
              </div>
          </div>
      )}

      {/* Calendar View (Redesigned Modern Grid) */}
      {viewMode === 'calendar' && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300 min-h-0">
              {/* Modern Calendar Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100 shadow-sm">
                          <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all">
                              <ChevronLeft size={18} />
                          </button>
                          <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all">
                              <ChevronRight size={18} />
                          </button>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
                          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button onClick={goToToday} className="px-3 py-1.5 text-xs font-bold text-primary bg-blue-50 hover:bg-blue-100 rounded-full transition-all border border-blue-100">
                          Aujourd'hui
                      </button>
                  </div>
                  
                  <div className="hidden lg:flex items-center space-x-6 text-xs font-medium text-slate-500">
                     <div className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-2 shadow-sm shadow-blue-500/30"></span>Content</div>
                     <div className="flex items-center"><span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 shadow-sm shadow-green-500/30"></span>Ads</div>
                     <div className="flex items-center"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-2 shadow-sm shadow-purple-500/30"></span>Social</div>
                  </div>
              </div>

              {/* Calendar Grid Container */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, i) => (
                        <div key={day} className="py-3 text-center border-r border-slate-100 last:border-r-0">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">{day}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:hidden">{day.substring(0,3)}</span>
                        </div>
                    ))}
                </div>
                
                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar bg-slate-100 gap-px border-b border-slate-200">
                     {(() => {
                         const { days, firstDay, year, month } = getDaysInMonth(currentDate);
                         const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
                         const cells = [];

                         // Empty slots before start of month
                         for (let i = 0; i < firstDay; i++) {
                             cells.push(<div key={`empty-${i}`} className="bg-slate-50/40 min-h-[120px]"></div>);
                         }

                         // Valid days
                         for (let day = 1; day <= days; day++) {
                             const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                             const dayTasks = visibleTasks.filter(t => t.dueDate === dateStr);
                             const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                             const isDragOver = dragOverDate === dateStr;

                             cells.push(
                                 <div 
                                    key={day} 
                                    onDragOver={(e) => handleDragOver(e, dateStr)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, dateStr)}
                                    className={`min-h-[120px] bg-white p-2 flex flex-col transition-all duration-200 group relative ${
                                        isDragOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 
                                        isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50'
                                    }`}
                                 >
                                     {/* Day Number Header */}
                                     <div className="flex justify-between items-start mb-2 pointer-events-none">
                                         <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                                             isToday 
                                             ? 'bg-primary text-white shadow-md shadow-primary/30' 
                                             : 'text-slate-500'
                                         }`}>
                                             {day}
                                         </span>
                                         {/* Add Button (Hidden by default, shown on hover) */}
                                         {canCreateTask() && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    setNewTask({...newTask, dueDate: dateStr});
                                                    setShowModal(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-primary transition-all pointer-events-auto"
                                            >
                                                <Plus size={14} />
                                            </button>
                                         )}
                                     </div>
                                     
                                     {/* Task List */}
                                     <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar max-h-[150px]">
                                         {dayTasks.map(task => {
                                             const assignee = users.find(u => u.id === task.assigneeId);
                                             const isDragging = draggedTaskId === task.id;

                                             return (
                                                 <div 
                                                    key={task.id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                                    className={`px-2 py-1.5 rounded-md cursor-pointer border text-xs font-medium shadow-sm transition-all hover:scale-[1.02] hover:shadow-md flex items-center space-x-1.5 group/task ${
                                                        isDragging ? 'opacity-50 border-dashed border-primary bg-slate-100' : 
                                                        getCalendarChipStyle(task.type, task.status)
                                                    }`}
                                                 >
                                                     {assignee && (
                                                         <img 
                                                             src={assignee.avatar} 
                                                             className="w-4 h-4 rounded-full border border-white flex-shrink-0 object-cover" 
                                                             title={assignee.name}
                                                         />
                                                     )}
                                                     <span className="truncate leading-tight">{task.title}</span>
                                                 </div>
                                             )
                                         })}
                                     </div>
                                 </div>
                             );
                         }

                         // Empty slots after end of month
                         const remainingSlots = totalSlots - (firstDay + days);
                         for (let i = 0; i < remainingSlots; i++) {
                              cells.push(<div key={`empty-end-${i}`} className="bg-slate-50/40 min-h-[120px]"></div>);
                         }

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
                                  <input 
                                    type="text" 
                                    required
                                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none placeholder-gray-500 transition-all font-medium"
                                    placeholder="Ex: Campagne Facebook Hiver"
                                    value={newTask.title}
                                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigné à</label>
                                  <select 
                                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    value={newTask.assigneeId}
                                    onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                                  >
                                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Date limite</label>
                                  <input 
                                    type="date" 
                                    required
                                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all accent-primary font-medium"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Service (Type)</label>
                                  <select 
                                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    value={newTask.type}
                                    onChange={handleTypeChange}
                                  >
                                      <option value="content">Création de Contenu</option>
                                      <option value="ads">Publicité (Ads)</option>
                                      <option value="social">Social Media</option>
                                      <option value="seo">SEO / Web</option>
                                      <option value="admin">Administratif</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
                                  <select 
                                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    value={newTask.priority}
                                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                                  >
                                      <option value="low">Basse</option>
                                      <option value="medium">Moyenne</option>
                                      <option value="high">Haute</option>
                                  </select>
                              </div>
                              
                              {/* Price - Admin or Permission Only */}
                              {canViewFinancials() && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                        <DollarSign size={14} className="mr-1.5 text-slate-400"/>
                                        Prix / Budget (Visible uniquement par Admin/Finance)
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-full p-2.5 pl-4 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                            placeholder="0"
                                            value={newTask.price || ''}
                                            onChange={e => setNewTask({...newTask, price: parseFloat(e.target.value) || 0})}
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs font-bold">DA</span>
                                    </div>
                                </div>
                              )}

                              <div className="col-span-2">
                                  <div className="flex justify-between items-center mb-1">
                                      <label className="block text-sm font-medium text-slate-700">Description</label>
                                      <button 
                                        type="button"
                                        onClick={() => setIsBrainstorming(!isBrainstorming)}
                                        className="text-xs text-primary flex items-center font-medium hover:underline"
                                      >
                                          <Sparkles size={12} className="mr-1" />
                                          Assistant IA
                                      </button>
                                  </div>
                                  
                                  {isBrainstorming && (
                                      <div className="mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                                          <input 
                                            type="text"
                                            placeholder="Sujet de la campagne (ex: Soldes d'été)"
                                            className="w-full text-sm p-2 bg-gray-200 text-black border border-gray-300 rounded mb-2 focus:bg-white focus:ring-2 focus:ring-primary outline-none placeholder-gray-500 transition-all"
                                            value={brainstormTopic}
                                            onChange={e => setBrainstormTopic(e.target.value)}
                                          />
                                          <button 
                                            type="button" 
                                            onClick={handleBrainstorm}
                                            className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700"
                                          >
                                              Générer des idées
                                          </button>
                                      </div>
                                  )}

                                  <textarea 
                                    className="w-full p-2.5 bg-gray-200 text-black border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none h-24 resize-none placeholder-gray-500 transition-all font-medium"
                                    placeholder="Détails de la tâche..."
                                    value={newTask.description}
                                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                                  ></textarea>
                              </div>
                              
                              <div className="col-span-2">
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Pièces jointes</label>
                                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer" onClick={handleFileUpload}>
                                      <Paperclip size={20} className="mb-2" />
                                      <span className="text-xs">Cliquer pour ajouter un fichier (Simulation)</span>
                                  </div>
                                  {newTask.attachments && newTask.attachments.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                          {newTask.attachments.map((file, idx) => (
                                              <div key={idx} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded flex items-center border border-slate-200">
                                                  <FileText size={10} className="mr-1"/> {String(file)}
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

      {/* Task Detail Modal (FULLY RESTORED) */}
      {selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                  {/* Left Column: Content */}
                  <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 relative">
                       <div className="flex justify-between items-start mb-4">
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getTypeColor(selectedTask.type)}`}>{selectedTask.type}</span>
                           <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 md:hidden"><X size={24}/></button>
                       </div>
                       
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedTask.title}</h2>
                       
                       {/* Price Display (Admin/Permission only) */}
                       {canViewFinancials() && typeof selectedTask.price === 'number' && (
                           <div className="mb-4 flex items-center">
                               <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 text-sm font-medium flex items-center">
                                   <DollarSign size={14} className="mr-1 text-slate-400" />
                                   Budget : {selectedTask.price} DA
                               </div>
                           </div>
                       )}

                       <div className="flex items-center space-x-4 mb-6 text-sm text-slate-600">
                           {users.filter(u => u.id === selectedTask.assigneeId).map(u => (
                               <div key={u.id} className="flex items-center space-x-2">
                                   <img src={u.avatar} className="w-6 h-6 rounded-full" alt={u.name} />
                                   <span>{u.name}</span>
                               </div>
                           ))}
                           <div className="flex items-center space-x-1">
                               <CalendarIcon size={16} />
                               <span>{selectedTask.dueDate}</span>
                           </div>
                       </div>

                       <div className="prose prose-sm text-slate-600 mb-8">
                           <p className="whitespace-pre-wrap">{selectedTask.description}</p>
                       </div>

                       {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                           <div className="mb-8">
                               <h4 className="font-bold text-slate-800 mb-3 flex items-center"><Paperclip size={16} className="mr-2"/> Pièces jointes</h4>
                               <div className="grid grid-cols-2 gap-2">
                                   {selectedTask.attachments.map((file, i) => (
                                       <div key={i} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                                           <div className="flex items-center space-x-2 truncate">
                                               <FileText size={16} className="text-slate-400" />
                                               <span className="text-sm truncate">{file}</span>
                                           </div>
                                           <button className="text-primary text-xs font-bold hover:underline">Télécharger</button>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}

                       {/* Comments Section */}
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                           <h4 className="font-bold text-slate-800 mb-4 flex items-center"><MessageSquare size={16} className="mr-2"/> Commentaires</h4>
                           <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                               {selectedTask.comments?.length === 0 ? (
                                   <p className="text-slate-400 text-sm italic">Aucun commentaire pour le moment.</p>
                               ) : (
                                   selectedTask.comments?.map(comment => {
                                       const user = users.find(u => u.id === comment.userId);
                                       return (
                                           <div key={comment.id} className="flex space-x-3">
                                               <img src={user?.avatar} className="w-8 h-8 rounded-full mt-1" alt="Avatar" />
                                               <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1 shadow-sm">
                                                   <div className="flex justify-between items-center mb-1">
                                                       <span className="font-bold text-sm text-slate-900">{user?.name}</span>
                                                       <span className="text-xs text-slate-400">{comment.timestamp}</span>
                                                   </div>
                                                   <p className="text-sm text-slate-700">{comment.content}</p>
                                               </div>
                                           </div>
                                       );
                                   })
                               )}
                           </div>
                           <div className="flex items-center space-x-2">
                               <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="Me" />
                               <div className="flex-1 relative">
                                   <input 
                                     type="text" 
                                     placeholder="Écrire un commentaire..." 
                                     className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                     value={taskComment}
                                     onChange={(e) => setTaskComment(e.target.value)}
                                     onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                   />
                                   <button 
                                     onClick={handleAddComment}
                                     disabled={!taskComment.trim()}
                                     className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary disabled:opacity-50"
                                   >
                                       <Send size={16} />
                                   </button>
                               </div>
                           </div>
                       </div>
                  </div>

                  {/* Right Column: Sidebar Actions */}
                  <div className="w-full md:w-72 bg-slate-50 p-6 flex flex-col shrink-0">
                      <div className="flex justify-end mb-6 hidden md:block">
                          <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Statut</label>
                              <div className="space-y-2">
                                  {Object.values(TaskStatus).map(status => (
                                      <button 
                                        key={status}
                                        onClick={() => onUpdateStatus(selectedTask.id, status)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all border ${
                                            selectedTask.status === status 
                                            ? 'bg-white border-primary text-primary shadow-sm' 
                                            : 'bg-transparent border-transparent hover:bg-white text-slate-600'
                                        }`}
                                      >
                                          <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                                status === TaskStatus.DONE ? 'bg-green-500' : 
                                                status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 
                                                status === TaskStatus.BLOCKED ? 'bg-red-500' : 'bg-slate-400'
                                            }`} />
                                            {status}
                                          </div>
                                          {selectedTask.status === status && <CheckCircle size={16} />}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Priorité</label>
                              <div className="flex space-x-2">
                                  {(['low', 'medium', 'high'] as const).map(p => (
                                      <button
                                        key={p}
                                        onClick={() => onUpdateTask({...selectedTask, priority: p})}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded uppercase border transition-all ${
                                            selectedTask.priority === p 
                                            ? getPriorityColor(p) + ' ring-1 ring-offset-1 ring-slate-300' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                      >
                                          {p === 'low' ? 'Basse' : p === 'medium' ? 'Moy.' : 'Haute'}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Actions</label>
                               <button 
                                 className="w-full flex items-center space-x-2 p-2 text-sm text-slate-600 hover:bg-white rounded-lg transition-colors mb-2"
                                 onClick={handleFileUpload}
                               >
                                   <Paperclip size={16} />
                                   <span>Ajouter un fichier</span>
                               </button>
                               {canDeleteTask() && (
                                   <button 
                                     onClick={() => handleDeleteClick(selectedTask.id)}
                                     className="w-full flex items-center space-x-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                   >
                                       <Trash2 size={16} />
                                       <span>Supprimer la tâche</span>
                                   </button>
                               )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tasks;
