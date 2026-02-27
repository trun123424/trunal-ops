import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineCalendar, HiOutlineCheck, HiOutlineStar, HiOutlineFlag, HiOutlineUser } from 'react-icons/hi';
import { tasks as tasksApi, projects as projectsApi } from '../services/api';
import DateFilter, { getDateRange, filterByDate } from '../components/DateFilter';

const STATUSES = ['Created', 'Assigned', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function PersonalTasks() {
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([tasksApi.getAll(), projectsApi.getAll()]);
      // Filter only personal tasks
      const personalTasks = (tasksData.tasks || []).filter(t => t.team === 'Personal');
      setAllTasks(personalTasks);
      setProjects(projectsData.projects || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (preset, range = null) => {
    setDateFilter(preset);
    if (range) setCustomRange(range);
  };

  // Apply date filter
  const dateRange = getDateRange(dateFilter, customRange);
  const tasks = filterByDate(allTasks, dateRange, 'createdDate');

  const handleCreateTask = () => { setEditingTask(null); setShowModal(true); };
  const handleEditTask = (task) => { setEditingTask(task); setShowModal(true); };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(id);
      setAllTasks(allTasks.filter(t => t.id !== id));
    } catch (err) { console.error('Failed to delete task:', err); }
  };

  const handleSaveTask = async (taskData) => {
    try {
      // Force team to Personal for this page
      taskData.team = 'Personal';
      if (editingTask) {
        const result = await tasksApi.update(editingTask.id, taskData);
        setAllTasks(allTasks.map(t => t.id === editingTask.id ? result.task : t));
      } else {
        const result = await tasksApi.create(taskData);
        setAllTasks([result.task, ...allTasks]);
      }
      setShowModal(false);
    } catch (err) { console.error('Failed to save task:', err); }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Done' ? 'Created' : 'Done';
    try {
      const result = await tasksApi.update(task.id, { ...task, status: newStatus });
      setAllTasks(allTasks.map(t => t.id === task.id ? result.task : t));
    } catch (err) { console.error('Failed to update task:', err); }
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status !== 'Done');
  const completedTasks = filteredTasks.filter(t => t.status === 'Done');

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <HiOutlineStar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Personal Tasks</h1>
              <p className="text-zinc-400 mt-0.5">{todoTasks.length} to do, {completedTasks.length} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
            <button onClick={handleCreateTask} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              <HiOutlinePlus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search personal tasks..."
            className="w-full pl-10 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* To Do Section */}
          {todoTasks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-zinc-400 uppercase mb-3">To Do</h2>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Section */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-400 uppercase mb-3">Completed</h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    completed
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 mx-auto flex items-center justify-center mb-4">
                <HiOutlineStar className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No personal tasks yet</h3>
              <p className="text-zinc-400 mb-6">Create your first personal task to get started</p>
              <button onClick={handleCreateTask} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                <HiOutlinePlus className="w-4 h-4" /> Add Task
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && <PersonalTaskModal task={editingTask} projects={projects} onSave={handleSaveTask} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete, completed }) {
  return (
    <div className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
      completed
        ? 'bg-zinc-900/50 border-zinc-800/50'
        : 'bg-zinc-900 border-zinc-800 hover:border-purple-500/50'
    }`}>
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          completed
            ? 'border-purple-500 bg-purple-500'
            : 'border-zinc-600 hover:border-purple-500'
        }`}
      >
        {completed && <HiOutlineCheck className="w-4 h-4 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
            {task.title}
          </span>
          {task.priority === 'High' && <HiOutlineFlag className="w-4 h-4 text-orange-400" />}
          {task.priority === 'Urgent' && <HiOutlineFlag className="w-4 h-4 text-red-400" />}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {task.project && <span className="text-xs text-purple-400">{task.project}</span>}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <HiOutlineCalendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.assignedTo && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <HiOutlineUser className="w-3 h-3" />
              {task.assignedTo}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white">
          <HiOutlinePencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400">
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PersonalTaskModal({ task, projects, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project: task?.project || '',
    status: task?.status || 'Created',
    priority: task?.priority || 'Medium',
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate || ''
  });

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{task ? 'Edit Task' : 'New Personal Task'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What do you need to do?"
            required
            autoFocus
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-lg"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add notes..."
            rows={2}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              placeholder="Project / Category"
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p} Priority</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Assign to"
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">{task ? 'Update' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
