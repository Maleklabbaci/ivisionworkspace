
import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Sparkles, Filter, LayoutGrid, List, AlertCircle, Paperclip, Send, X, FileText, Trash2 } from 'lucide-react';
import { Task, TaskStatus, User, Comment, UserRole } from '../types';
import { brainstormTaskIdeas } from '../services/geminiService';

interface TasksProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

type ViewMode = 'board' | 'calendar';

const Tasks: React.FC<TasksProps> = ({ tasks, users, currentUser, onUpdateStatus, onAddTask, onUpdateTask }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [taskComment, setTaskComment] = useState('');
  
  // New Task State
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assigneeId: currentUser.id,
    dueDate: '',
    type: 'content',
    priority: 'medium',
    attachments: []
  });

  // Filter tasks based on role
  const visibleTasks = currentUser.role === UserRole.ADMIN 
    ? tasks 
    : tasks.filter(t => t.assigneeId === currentUser.id);

  // Calendar Generation Logic
  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Start Monday
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

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

      const task: Task = {
          id: Date.now().toString(),
          title: newTask.title!,
          description: newTask.description || '',
          assigneeId: newTask.assigneeId!,
          dueDate: newTask.dueDate!,
          status: TaskStatus.TODO,
          type: newTask.type as any,
          priority: newTask.priority as any,
          comments: [],
          attachments: newTask.attachments || []
      };

      onAddTask(task);
      setShowModal(false);
      setNewTask({
        title: '', description: '', assigneeId: currentUser.id, dueDate: '', type: 'content', priority: 'medium', attachments: []
      });
      setBrainstormTopic('');
  };

  const handleAddComment = () => {
    if(!selectedTask || !taskComment.trim()) return;
    
    const newComment: Comment = {
        id: Date.now().toString(),
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

  const handleFileUpload = () => {
     // Simulate upload
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
          case 'content': return 'bg-blue-100 text-blue-700'; // Blue for Content
          case 'ads': return 'bg-green-100 text-green-700'; // Green for Ads
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
                  {columnTasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => setSelectedTask(task)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer group transform hover:-translate-y-1"
                      >
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getTypeColor(task.type)}`}>{task.type}</span>
                              {task.priority === 'high' && <AlertCircle size={14} className="text-urgent" />}
                          </div>
                          <h4 className="font-bold text-slate-800 mb-1 text-sm leading-snug group-hover:text-primary transition-colors">{task.title}</h4>
                          <div className="flex items-center justify-between mt-3">
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
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Tâches</h2>
            <p className="text-slate-500 text-sm">
                {currentUser.role === UserRole.ADMIN ? 'Vue globale des tâches de l\'agence' : 'Mes tâches assignées'}
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
            {currentUser.role === UserRole.ADMIN && (
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

      {/* Calendar View (Weekly) */}
      {viewMode === 'calendar' && (
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300 min-h-0">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {getCalendarDays().map((day, i) => (
                      <div key={i} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                          <p className="text-xs font-bold text-slate-400 uppercase">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                          <p className={`text-sm font-bold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                              day.toDateString() === new Date().toDateString() ? 'bg-primary text-white' : 'text-slate-800'
                          }`}>{day.getDate()}</p>
                      </div>
                  ))}
              </div>
              <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 overflow-y-auto">
                   {getCalendarDays().map((day, i) => {
                       const dayString = day.toISOString().split('T')[0];
                       const dayTasks = visibleTasks.filter(t => t.dueDate === dayString);
                       return (
                           <div key={i} className="p-2 space-y-2 min-h-[100px]">
                               {dayTasks.map(task => (
                                   <div 
                                    key={task.id} 
                                    onClick={() => setSelectedTask(task)}
                                    className={`p-2 rounded text-xs border cursor-pointer truncate hover:opacity-80 transition-all ${
                                        task.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                        task.type === 'content' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        'bg-green-50 text-green-700 border-green-100'
                                   }`}
                                   >
                                       {task.title}
                                   </div>
                               ))}
                           </div>
                       )
                   })}
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
                                    className="w-full p-2.5 bg-slate-100 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none placeholder-slate-500 transition-all"
                                    placeholder="Ex: Campagne Facebook Hiver"
                                    value={newTask.title}
                                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigné à</label>
                                  <select 
                                    className="w-full p-2.5 bg-slate-100 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
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
                                    className="w-full p-2.5 bg-slate-100 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all accent-primary"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                  <select 
                                    className="w-full p-2.5 bg-slate-100 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={newTask.type}
                                    onChange={e => setNewTask({...newTask, type: e.target.value as any})}
                                  >
                                      <option value="content">Création de Contenu</option>
                                      <option value="ads">Campagne Ads</option>
                                      <option value="admin">Administratif</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
                                  <select 
                                    className="w-full p-2.5 bg-slate-100 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={newTask.priority}
                                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                                  >
                                      <option value="low">Basse</option>
                                      <option value="medium">Moyenne</option>
                                      <option value="high">Haute</option>
                                  </select>
                              </div>
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
                                            className="w-full text-sm p-2 bg-slate-100 text-black border-transparent rounded mb-2 focus:bg-white focus:ring-2 focus:ring-primary outline-none placeholder-slate-500 transition-all"
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
                                    className="w-full p-2.5 bg-slate-100 text-black border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none h-24 resize-none placeholder-slate-500 transition-all"
                                    placeholder="Détails de la tâche..."
                                    value={newTask.description}
                                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                                  ></textarea>
                              </div>
                              
                              {/* Attachments Area */}
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
                                                  <FileText size={10} className="mr-1"/> {file}
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
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                  {/* Left: Task Details */}
                  <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200">
                       <div className="flex justify-between items-start mb-4">
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getTypeColor(selectedTask.type)}`}>{selectedTask.type}</span>
                           <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 md:hidden"><X size={24}/></button>
                       </div>
                       
                       <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedTask.title}</h2>
                       
                       <div className="flex items-center space-x-4 mb-6 text-sm text-slate-600">
                           <div className="flex items-center">
                               <Clock size={16} className="mr-2" />
                               <span>{selectedTask.dueDate}</span>
                           </div>
                           <div className="flex items-center">
                               <div className={`w-2 h-2 rounded-full mr-2 ${
                                   selectedTask.priority === 'high' ? 'bg-urgent' : 
                                   selectedTask.priority === 'medium' ? 'bg-orange-500' : 'bg-slate-400'
                               }`} />
                               <span className="capitalize">{selectedTask.priority} priority</span>
                           </div>
                       </div>

                       <div className="mb-6">
                           <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
                           <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedTask.description}</p>
                       </div>

                       <div className="mb-6">
                           <h4 className="text-sm font-bold text-slate-900 mb-2">Pièces jointes</h4>
                           <div className="grid grid-cols-2 gap-2">
                               {selectedTask.attachments?.map((file, idx) => (
                                   <div key={idx} className="flex items-center p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
                                       <FileText size={16} className="mr-2 text-primary" />
                                       <span className="truncate">{file}</span>
                                   </div>
                               ))}
                               <button onClick={handleFileUpload} className="flex items-center justify-center p-3 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors">
                                   <Plus size={16} className="mr-2" /> Ajouter
                               </button>
                           </div>
                       </div>

                       <div className="mt-8">
                           <h4 className="text-sm font-bold text-slate-900 mb-2">Statut</h4>
                           <div className="flex space-x-2 flex-wrap gap-2">
                               {Object.values(TaskStatus).map(status => (
                                   <button
                                    key={status}
                                    onClick={() => onUpdateStatus(selectedTask.id, status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        selectedTask.status === status 
                                        ? 'bg-slate-800 text-white border-slate-800' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                    }`}
                                   >
                                       {status}
                                   </button>
                               ))}
                           </div>
                       </div>
                  </div>

                  {/* Right: Chat & Activity */}
                  <div className="w-full md:w-96 bg-slate-50 flex flex-col h-full">
                       <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                           <h3 className="font-bold text-slate-800">Commentaires</h3>
                           <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 hidden md:block float-right"><X size={20}/></button>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                           {selectedTask.comments?.map(comment => {
                               const author = users.find(u => u.id === comment.userId);
                               return (
                                   <div key={comment.id} className="flex space-x-3 animate-in fade-in slide-in-from-bottom-1">
                                       <img src={author?.avatar} className="w-8 h-8 rounded-full" />
                                       <div>
                                           <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200">
                                               <p className="text-xs font-bold text-slate-900 mb-0.5">{author?.name}</p>
                                               <p className="text-sm text-slate-700">{comment.content}</p>
                                           </div>
                                           <span className="text-[10px] text-slate-400 ml-1">{comment.timestamp}</span>
                                       </div>
                                   </div>
                               )
                           })}
                           {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                               <div className="text-center text-slate-400 text-sm py-8">Aucun commentaire pour l'instant.</div>
                           )}
                       </div>

                       <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                           <div className="flex items-center space-x-2">
                               <input 
                                 type="text" 
                                 className="flex-1 bg-slate-100 text-black border-transparent rounded-full px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-500"
                                 placeholder="Écrire un commentaire..."
                                 value={taskComment}
                                 onChange={e => setTaskComment(e.target.value)}
                                 onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                               />
                               <button 
                                onClick={handleAddComment}
                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-transform hover:scale-105"
                               >
                                   <Send size={16} />
                               </button>
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
