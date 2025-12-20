import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Clock, CheckCircle, Check } from 'lucide-react';
import { Task, User, TaskStatus } from '../types';

interface CalendarProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onAddTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, users, currentUser, onAddTask, onUpdateStatus }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  }, [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const dateStr = new Date(task.dueDate).toDateString();
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(task);
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasksByDate[selectedDate.toDateString()] || [];
  }, [selectedDate, tasksByDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => selectedDate && date.toDateString() === selectedDate.toDateString();

  return (
    <div className="flex flex-col h-full space-y-8 page-transition pb-24 no-scrollbar">
      <div className="flex items-start justify-between px-2 pt-2">
        <div>
          <h2 className="text-3xl font-[900] text-slate-900 tracking-tight flex items-baseline">
            {monthNames[month].toUpperCase()} <span className="text-primary ml-2">{year}</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1 opacity-70">PLANNING IVISION</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={prevMonth} className="p-4 bg-white border border-slate-50 rounded-3xl text-slate-400 active-scale shadow-sm transition-all hover:bg-slate-50"><ChevronLeft size={22} /></button>
          <button onClick={nextMonth} className="p-4 bg-white border border-slate-50 rounded-3xl text-slate-400 active-scale shadow-sm transition-all hover:bg-slate-50"><ChevronRight size={22} /></button>
        </div>
      </div>

      <div className="bg-white rounded-5xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] p-8 border border-slate-50/50">
        <div className="grid grid-cols-7 gap-1 mb-6">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-4 gap-x-1">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-12" />;
            const dayTasks = tasksByDate[date.toDateString()] || [];
            const urgentTask = dayTasks.some(t => t.priority === 'high');

            return (
              <div key={date.toISOString()} className="flex flex-col items-center justify-center">
                <button
                  onClick={() => setSelectedDate(date)}
                  className={`w-12 h-12 rounded-full flex flex-col items-center justify-center relative transition-all duration-300 active-scale
                    ${isSelected(date) ? 'bg-primary text-white shadow-xl shadow-primary/25 scale-110 z-10' : 
                      isToday(date) ? 'bg-slate-50 text-slate-900 border border-slate-100' : 'text-slate-700 hover:bg-slate-50/50'}
                  `}
                >
                  <span className={`text-sm font-black ${isSelected(date) ? 'text-white' : ''}`}>{date.getDate()}</span>
                </button>
                <div className="h-1 mt-1.5 flex space-x-0.5 justify-center">
                   {dayTasks.length > 0 && (
                     <div className={`w-1.5 h-1.5 rounded-full ${isSelected(date) ? 'bg-white' : urgentTask ? 'bg-red-500' : 'bg-slate-200'}`} />
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Clock size={20} /></div>
            <h3 className="font-[900] text-slate-900 text-lg tracking-tight uppercase">
              {selectedDate?.getDate()} {monthNames[selectedDate?.getMonth() || 0].toUpperCase()}
            </h3>
          </div>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="bg-white/50 p-16 rounded-5xl border border-slate-100 border-dashed text-center">
            <CalendarIcon size={40} className="mx-auto text-slate-200 mb-4 opacity-50" strokeWidth={1} />
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Aucun événement prévu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {selectedTasks.map(task => (
              <div key={task.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex items-center space-x-5 overflow-hidden">
                  <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${task.status === TaskStatus.DONE ? 'bg-slate-200' : task.priority === 'high' ? 'bg-red-500' : 'bg-primary'}`}></div>
                  <div className="overflow-hidden">
                    <h4 className={`font-black text-slate-900 text-base truncate ${task.status === TaskStatus.DONE ? 'opacity-50' : ''}`}>{task.title}</h4>
                    <p className="text-[10px] text-slate-300 font-black uppercase mt-1 tracking-widest flex items-center truncate">
                      {task.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, TaskStatus.DONE); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-success/10 text-success' : 'bg-slate-50 text-slate-200 hover:text-primary hover:bg-primary/5'}`}>
                  <CheckCircle size={24} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB AJOUTER - Calibré avec la Nav */}
      <button 
        onClick={() => setShowAddModal(true)} 
        className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-[0_15px_45px_rgba(0,102,255,0.4)] flex items-center justify-center z-30 active-scale border-4 border-white transition-all"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[48px] md:rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-500 p-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Nouvel Événement</h3>
              <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active-scale"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-widest px-2 opacity-60">Titre de la mission</label>
                <input type="text" className="w-full p-6 bg-slate-50/80 border border-slate-100 rounded-3xl font-black text-slate-900 outline-none transition-all placeholder-slate-300 focus:bg-white" placeholder="Ex: Shooting Photo" id="task-title-cal-new" />
              </div>
              <button 
                onClick={() => {
                  const input = document.getElementById('task-title-cal-new') as HTMLInputElement;
                  if (input.value.trim() && selectedDate) {
                    onAddTask({
                      id: `temp-${Date.now()}`,
                      title: input.value,
                      description: '',
                      dueDate: selectedDate.toISOString().split('T')[0],
                      status: TaskStatus.TODO,
                      type: 'content',
                      assigneeId: currentUser.id,
                      priority: 'medium'
                    });
                    setShowAddModal(false);
                  }
                }}
                className="w-full py-6 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 active-scale uppercase text-xs tracking-widest transition-all"
              >
                PLANIFIER LA MISSION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;