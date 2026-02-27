import React, { useState, useEffect } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineFilter } from 'react-icons/hi';
import { tasks as tasksApi } from '../services/api';
import DateFilter, { getDateRange as getFilterDateRange, filterByDate } from '../components/DateFilter';

const VIEWS = ['daily', 'weekly', 'monthly'];

export default function Timeline() {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try { const data = await tasksApi.getAll(); setAllTasks(data.tasks || []); }
    catch (err) { console.error('Failed to load tasks:', err); }
    finally { setLoading(false); }
  };

  const handleDateFilterChange = (preset, range = null) => {
    setDateFilter(preset);
    if (range) setCustomRange(range);
  };

  // Apply global filter
  const filterRange = getFilterDateRange(dateFilter, customRange);
  const tasks = filterByDate(allTasks, filterRange, 'createdDate');

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'daily') newDate.setDate(newDate.getDate() + direction);
    else if (view === 'weekly') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    if (view === 'daily') return [start];
    if (view === 'weekly') {
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }
    start.setDate(1);
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => { const d = new Date(start); d.setDate(i + 1); return d; });
  };

  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.createdDate.startsWith(dateStr));
  };

  const formatDateHeader = () => {
    if (view === 'daily') return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (view === 'weekly') {
      const dates = getDateRange();
      return `${dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const dates = getDateRange();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Timeline</h1>
            <p className="text-zinc-400 mt-1">View your tasks over time</p>
          </div>
          <div className="flex items-center gap-3">
            <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">
              {VIEWS.map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-sm capitalize transition-colors ${view === v ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white'}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><HiOutlineChevronLeft className="w-5 h-5" /></button>
          <div className="text-center">
            <h2 className="text-lg font-medium text-white flex items-center gap-2"><HiOutlineCalendar className="w-5 h-5 text-indigo-400" />{formatDateHeader()}</h2>
            {dateFilter !== 'all' && <p className="text-sm text-indigo-400">Filtered: {tasks.length} tasks</p>}
          </div>
          <button onClick={() => navigate(1)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><HiOutlineChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {view === 'weekly' && (
          <div className="grid grid-cols-7 gap-4">
            {dates.map((date) => {
              const isToday = date.toISOString().split('T')[0] === today;
              const dayTasks = getTasksForDate(date);
              return (
                <div key={date.toISOString()} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${isToday ? 'ring-2 ring-indigo-500' : ''}`}>
                  <div className="text-center mb-4">
                    <p className="text-xs text-zinc-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={`text-2xl font-bold ${isToday ? 'text-indigo-400' : 'text-white'}`}>{date.getDate()}</p>
                  </div>
                  <div className="space-y-2">
                    {dayTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${task.status === 'Done' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-300'}`}>
                        {task.status === 'Done' ? <HiOutlineCheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 4 && <p className="text-xs text-zinc-500 text-center">+{dayTasks.length - 4} more</p>}
                    {dayTasks.length === 0 && <p className="text-xs text-zinc-600 text-center">No tasks</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'monthly' && (
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="text-center text-xs text-zinc-500 py-2">{day}</div>)}
            {Array.from({ length: dates[0].getDay() }).map((_, i) => <div key={`empty-${i}`} className="h-24"></div>)}
            {dates.map((date) => {
              const isToday = date.toISOString().split('T')[0] === today;
              const dayTasks = getTasksForDate(date);
              return (
                <div key={date.toISOString()} className={`h-24 bg-zinc-900/50 rounded-lg p-2 border border-zinc-800 ${isToday ? 'ring-2 ring-indigo-500' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isToday ? 'text-indigo-400 font-bold' : 'text-zinc-400'}`}>{date.getDate()}</span>
                    {dayTasks.length > 0 && <span className="text-xs text-zinc-500">{dayTasks.length}</span>}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className={`text-xs truncate px-1.5 py-0.5 rounded ${task.status === 'Done' ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{task.title}</div>
                    ))}
                    {dayTasks.length > 2 && <p className="text-[10px] text-zinc-500">+{dayTasks.length - 2}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'daily' && (
          <div className="space-y-1">
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
              <div key={hour} className="flex gap-4">
                <div className="w-16 text-right text-sm text-zinc-500 py-2">{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</div>
                <div className="flex-1 border-t border-zinc-800 py-2 min-h-[40px]">
                  {getTasksForDate(dates[0]).map((task) => (
                    <div key={task.id} className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${task.status === 'Done' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-300'}`}>
                      {task.status === 'Done' ? <HiOutlineCheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
