
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Clock, CheckCircle } from 'lucide-react';
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

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

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
      if (!task.dueDate) return;
      const dateStr = new Date(task.dueDate).toDateString();
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(task);
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return (tasksByDate[selectedDate.toDateString()] || []).sort((a, b) => (a.priority === 'high' ? -1 : 1));
  }, [selectedDate, tasksByDate]);

  const isToday = (date: Date) => {
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const isSelected = (date: Date) => selectedDate && date.toDateString() === selectedDate.toDateString();

  return (
    <div className="flex flex-col h-full space-y-8 page-transition pb-24">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {monthNames[month].toUpperCase()} <span className="text-primary ml-2">{year}</span>
          </h2>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Planning Stratégique iVISION</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-3 bg-white border border-slate-100 rounded-2xl active-scale"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-3 bg-white border border-slate-100 rounded-2xl active-scale"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm p-6 border border-slate-50">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-12" />;
            const dayTasks = tasksByDate[date.toDateString()] || [];
            const hasUrgent = dayTasks.some(t => t.priority === 'high' && t.status !== TaskStatus.DONE);
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all active-scale
                  ${isSelected(date) ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 
                    isToday(date) ? 'bg-slate-50 text-slate-900 border border-slate-200' : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                <span className="text-sm font-black">{date.getDate()}</span>
                <div className="flex space-x-0.5 mt-1">
                   {dayTasks.length > 0 && (
                     <div className={`w-1 h-1 rounded-full ${isSelected(date) ? 'bg-white' : hasUrgent ? 'bg-urgent animate-pulse' : 'bg-primary'}`} />
                   )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-slate-900 text-sm uppercase px-2 flex items-center">
            <Clock size={16} className="mr-2 text-primary" />
            Agenda du {selectedDate?.getDate()} {monthNames[selectedDate?.getMonth() || 0]}
        </h3>
        {selectedTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-dashed border-2 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune mission ce jour</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTasks.map(task => (
              <div key={task.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-1.5 h-10 rounded-full ${task.status === TaskStatus.DONE ? 'bg-success' : task.priority === 'high' ? 'bg-urgent' : 'bg-primary'}`}></div>
                  <div>
                    <h4 className={`font-black text-sm uppercase tracking-tight ${task.status === TaskStatus.DONE ? 'opacity-30 line-through' : ''}`}>{task.title}</h4>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{task.status}</span>
                  </div>
                </div>
                <button onClick={() => onUpdateStatus(task.id, TaskStatus.DONE)} className="p-2 bg-slate-50 rounded-xl text-slate-200 hover:text-success transition-colors"><CheckCircle size={20}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-3xl shadow-xl flex items-center justify-center z-40 border-4 border-white active-scale"><Plus size={32}/></button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center z-[110] p-4 animate-in fade-in">
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl w-full max-w-md p-10 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Nouveau Plan</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400"><X size={20}/></button>
            </div>
            <input type="text" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-slate-900 outline-none mb-6" placeholder="Titre de la mission..." id="cal-new-title" />
            <button onClick={() => {
              const input = document.getElementById('cal-new-title') as HTMLInputElement;
              if (input.value && selectedDate) {
                onAddTask({ id: `temp-${Date.now()}`, title: input.value, description: '', dueDate: selectedDate.toISOString().split('T')[0], status: TaskStatus.TODO, type: 'content', assigneeId: currentUser.id, priority: 'medium' });
                setShowAddModal(false);
              }
            }} className="w-full py-6 bg-primary text-white font-black rounded-3xl uppercase text-xs tracking-widest active-scale">PLANIFIER</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
