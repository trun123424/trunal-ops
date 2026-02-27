import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlinePencil, HiOutlineTrash, HiOutlineExternalLink, HiOutlineX, HiOutlineCalendar, HiOutlineExclamationCircle, HiOutlineUser, HiOutlineChevronDown, HiOutlineExclamation } from 'react-icons/hi';
import { tasks as tasksApi, projects as projectsApi } from '../services/api';
import DateFilter, { getDateRange, filterByDate } from '../components/DateFilter';
import TaskDetailModal from '../components/TaskDetailModal';

const STATUSES = ['Created', 'Assigned', 'In Progress', 'Review', 'Done'];
const TEAMS = ['Personal', 'Dev', 'Data'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function Tasks() {
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', team: '', project: '' });
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusDropdownId, setStatusDropdownId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setStatusDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([tasksApi.getAll(), projectsApi.getAll()]);
      setAllTasks(tasksData.tasks || []);
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

  const handleCreateTask = () => { setEditingTask(null); setShowCreateModal(true); };
  const handleEditTask = (task, e) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(id);
      setAllTasks(allTasks.filter(t => t.id !== id));
    } catch (err) { console.error('Failed to delete task:', err); }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        const result = await tasksApi.update(editingTask.id, taskData);
        setAllTasks(allTasks.map(t => t.id === editingTask.id ? result.task : t));
      } else {
        const result = await tasksApi.create(taskData);
        setAllTasks([result.task, ...allTasks]);
      }
      setShowCreateModal(false);
    } catch (err) { console.error('Failed to save task:', err); }
  };

  const handleTaskUpdate = (updatedTask) => {
    setAllTasks(allTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleStatusChange = async (taskId, newStatus, e) => {
    e.stopPropagation();
    try {
      const task = allTasks.find(t => t.id === taskId);
      const result = await tasksApi.update(taskId, { ...task, status: newStatus });
      setAllTasks(allTasks.map(t => t.id === taskId ? result.task : t));
      setStatusDropdownId(null);
    } catch (err) { console.error('Failed to update status:', err); }
  };

  const isOverdue = (task) => {
    if (!task.deadline || task.status === 'Done') return false;
    return new Date(task.deadline) < new Date();
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Apply date filter first
  const dateRange = getDateRange(dateFilter, customRange);
  const dateFilteredTasks = filterByDate(allTasks, dateRange, 'createdDate');

  const filteredTasks = dateFilteredTasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.project.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.team && task.team !== filters.team) return false;
    if (filters.project && task.project !== filters.project) return false;
    return true;
  });

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Tasks</h1>
            <p className="text-zinc-400 mt-1">{filteredTasks.length} tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
            <button onClick={handleCreateTask} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
              <HiOutlinePlus className="w-4 h-4" /> Create Task
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full pl-10 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700">
            <HiOutlineFilter className="w-4 h-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="grid grid-cols-3 gap-4">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.team} onChange={(e) => setFilters({ ...filters, team: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                <option value="">All Teams</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Title</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Project</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Team</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Priority</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Deadline</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-white">{task.title}</div>
                      {isOverdue(task) && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                          <HiOutlineExclamation className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {task.description && <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{task.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{task.project}</td>
                  <td className="px-4 py-3">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <span className="text-xs text-indigo-400">{task.assignedTo.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-zinc-300 text-sm">{task.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${getTeamBadge(task.team)}`}>{task.team}</span></td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusDropdownId(statusDropdownId === task.id ? null : task.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(task.status)} hover:opacity-80`}
                    >
                      {task.status}
                      <HiOutlineChevronDown className="w-3 h-3" />
                    </button>
                    {statusDropdownId === task.id && (
                      <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                        {STATUSES.map((status) => (
                          <button
                            key={status}
                            onClick={(e) => handleStatusChange(task.id, status, e)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 ${
                              task.status === status ? 'text-indigo-400 bg-zinc-700/50' : 'text-zinc-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(task.priority)}`}>{task.priority}</span></td>
                  <td className="px-4 py-3">
                    {task.deadline ? (
                      <span className={`flex items-center gap-1 text-sm ${isOverdue(task) ? 'text-red-400' : 'text-zinc-300'}`}>
                        <HiOutlineCalendar className="w-4 h-4" />
                        {formatDeadline(task.deadline)}
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => handleEditTask(task, e)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"><HiOutlinePencil className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><HiOutlineTrash className="w-4 h-4" /></button>
                      {task.linearLink && <a href={task.linearLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded hover:bg-zinc-700 text-indigo-400"><HiOutlineExternalLink className="w-4 h-4" /></a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="p-12 text-center text-zinc-400">
              <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p>No tasks found</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && <TaskModal task={editingTask} projects={projects} onSave={handleSaveTask} onClose={() => setShowCreateModal(false)} />}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}

function TaskModal({ task, projects, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: task?.title || '', description: task?.description || '', project: task?.project || (projects[0]?.name || ''),
    team: task?.team || 'Personal', status: task?.status || 'Created', priority: task?.priority || 'Medium',
    assignedTo: task?.assignedTo || '', linearLink: task?.linearLink || '',
    startDate: task?.startDate || '', deadline: task?.deadline || ''
  });

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{task ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" required className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} placeholder="Project" required className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
            <select value={formData.team} onChange={(e) => setFormData({ ...formData, team: e.target.value })} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500">
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative">
            <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} placeholder="Assign to (name or email)" className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Deadline</label>
              <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <input type="url" value={formData.linearLink} onChange={(e) => setFormData({ ...formData, linearLink: e.target.value })} placeholder="Linear link (optional)" className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">{task ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTeamBadge(team) {
  const badges = { 'Personal': 'bg-indigo-500/20 text-indigo-400', 'Dev': 'bg-green-500/20 text-green-400', 'Data': 'bg-orange-500/20 text-orange-400' };
  return badges[team] || 'bg-zinc-500/20 text-zinc-400';
}

function getStatusBadge(status) {
  const badges = { 'Created': 'bg-zinc-500/20 text-zinc-400', 'Assigned': 'bg-blue-500/20 text-blue-400', 'In Progress': 'bg-yellow-500/20 text-yellow-400', 'Review': 'bg-purple-500/20 text-purple-400', 'Done': 'bg-green-500/20 text-green-400' };
  return badges[status] || 'bg-zinc-500/20 text-zinc-400';
}

function getPriorityBadge(priority) {
  const badges = { 'Low': 'bg-zinc-500/20 text-zinc-400', 'Medium': 'bg-blue-500/20 text-blue-400', 'High': 'bg-orange-500/20 text-orange-400', 'Urgent': 'bg-red-500/20 text-red-400' };
  return badges[priority] || 'bg-zinc-500/20 text-zinc-400';
}
