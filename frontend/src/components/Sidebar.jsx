import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineViewBoards, HiOutlineCalendar, HiOutlineLink, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineSearch, HiOutlineLightningBolt, HiOutlineStar } from 'react-icons/hi';
import NotificationBell from './NotificationBell';
import { tasks as tasksApi } from '../services/api';

const navItems = [
  { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/personal', icon: HiOutlineStar, label: 'Personal', highlight: true },
  { path: '/tasks', icon: HiOutlineClipboardList, label: 'All Tasks' },
  { path: '/kanban', icon: HiOutlineViewBoards, label: 'Kanban' },
  { path: '/timeline', icon: HiOutlineCalendar, label: 'Timeline' },
  { path: '/linear', icon: HiOutlineLink, label: 'Linear' },
  { path: '/daily-dump', icon: HiOutlineDocumentText, label: 'Daily Dump' },
  { path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
];

export default function Sidebar({ onSearchClick }) {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await tasksApi.getAll();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error('Failed to load tasks for notifications:', err);
      }
    };
    loadTasks();
    // Refresh every 30 seconds to catch new deadlines
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (task) => {
    navigate('/tasks', { state: { selectedTaskId: task.id } });
  };

  return (
    <aside className="w-64 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <HiOutlineLightningBolt className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-white">TrunalOps</h1>
            <p className="text-xs text-zinc-500">Operations Dashboard</p>
          </div>
          <NotificationBell tasks={tasks} onTaskClick={handleNotificationClick} />
        </div>
      </div>

      {/* Search Button */}
      <div className="p-3">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all"
        >
          <HiOutlineSearch className="w-4 h-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto px-2 py-0.5 rounded bg-zinc-700 text-xs text-zinc-500">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${item.highlight ? 'text-purple-400' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
            T
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Trunal</p>
            <p className="text-xs text-zinc-500">Local Mode</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
    </aside>
  );
}
