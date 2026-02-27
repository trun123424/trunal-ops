import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineBell, HiOutlineX, HiOutlineExclamation, HiOutlineCalendar, HiOutlineCheck } from 'react-icons/hi';

export default function NotificationBell({ tasks = [], onTaskClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const dropdownRef = useRef(null);

  // Get overdue tasks (excluding dismissed ones)
  const overdueTasks = tasks.filter(task => {
    if (!task.deadline || task.status === 'Done') return false;
    if (dismissedIds.includes(task.id)) return false;
    return new Date(task.deadline) < new Date();
  });

  // Get tasks due today (excluding dismissed ones)
  const today = new Date().toISOString().split('T')[0];
  const dueTodayTasks = tasks.filter(task => {
    if (!task.deadline || task.status === 'Done') return false;
    if (dismissedIds.includes(task.id)) return false;
    if (overdueTasks.some(t => t.id === task.id)) return false;
    return task.deadline === today;
  });

  const allNotifications = [...overdueTasks, ...dueTodayTasks];
  const notificationCount = allNotifications.length;

  // Save dismissed IDs to localStorage
  useEffect(() => {
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = (taskId, e) => {
    e.stopPropagation();
    setDismissedIds([...dismissedIds, taskId]);
  };

  const handleClearAll = () => {
    setDismissedIds([...dismissedIds, ...allNotifications.map(t => t.id)]);
  };

  const formatDeadline = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === -1) return 'Due yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          notificationCount > 0
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        <HiOutlineBell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {notificationCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificationCount === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <HiOutlineCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>All caught up!</p>
                <p className="text-sm text-zinc-500 mt-1">No overdue tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {overdueTasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-red-500/10">
                      <span className="text-xs font-medium text-red-400 uppercase">Overdue</span>
                    </div>
                    {overdueTasks.map(task => (
                      <NotificationItem
                        key={task.id}
                        task={task}
                        isOverdue={true}
                        formatDeadline={formatDeadline}
                        onDismiss={handleDismiss}
                        onClick={() => {
                          if (onTaskClick) onTaskClick(task);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}

                {dueTodayTasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-yellow-500/10">
                      <span className="text-xs font-medium text-yellow-400 uppercase">Due Today</span>
                    </div>
                    {dueTodayTasks.map(task => (
                      <NotificationItem
                        key={task.id}
                        task={task}
                        isOverdue={false}
                        formatDeadline={formatDeadline}
                        onDismiss={handleDismiss}
                        onClick={() => {
                          if (onTaskClick) onTaskClick(task);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ task, isOverdue, formatDeadline, onDismiss, onClick }) {
  return (
    <div
      onClick={onClick}
      className="px-4 py-3 hover:bg-zinc-800/50 cursor-pointer flex items-start gap-3"
    >
      <div className={`p-1.5 rounded-lg ${isOverdue ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
        <HiOutlineExclamation className={`w-4 h-4 ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <HiOutlineCalendar className={`w-3 h-3 ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`} />
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
            {formatDeadline(task.deadline)}
          </span>
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs text-zinc-400">{task.project}</span>
        </div>
      </div>
      <button
        onClick={(e) => onDismiss(task.id, e)}
        className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white"
        title="Dismiss"
      >
        <HiOutlineX className="w-4 h-4" />
      </button>
    </div>
  );
}
