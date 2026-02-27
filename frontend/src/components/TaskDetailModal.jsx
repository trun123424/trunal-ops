import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlinePencil, HiOutlineCalendar, HiOutlineUser, HiOutlineUserGroup, HiOutlineFlag, HiOutlineExternalLink, HiOutlineClock, HiOutlineExclamation } from 'react-icons/hi';
import { tasks as tasksApi } from '../services/api';

const STATUSES = ['Created', 'Assigned', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const TEAMS = ['Personal', 'Dev', 'Data'];

export default function TaskDetailModal({ task, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
    }
  }, [task]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!task || !formData) return null;

  const isOverdue = () => {
    if (!task.deadline || task.status === 'Done') return false;
    return new Date(task.deadline) < new Date();
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const result = await tasksApi.update(task.id, { ...formData, status: newStatus });
      setFormData({ ...formData, status: newStatus });
      if (onUpdate) onUpdate(result.task);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await tasksApi.update(task.id, formData);
      if (onUpdate) onUpdate(result.task);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Created': 'bg-zinc-500',
      'Assigned': 'bg-blue-500',
      'In Progress': 'bg-yellow-500',
      'Review': 'bg-purple-500',
      'Done': 'bg-green-500'
    };
    return colors[status] || 'bg-zinc-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-zinc-400',
      'Medium': 'text-blue-400',
      'High': 'text-orange-400',
      'Urgent': 'text-red-400'
    };
    return colors[priority] || 'text-zinc-400';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <h2 className="text-xl font-bold text-white">{task.title}</h2>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-zinc-400">{task.project}</span>
                {isOverdue() && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                    <HiOutlineExclamation className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              >
                <HiOutlinePencil className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Section */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.status === status
                      ? `${getStatusColor(status)} text-white`
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Assigned To */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <HiOutlineUser className="w-4 h-4" />
                <span className="text-sm">Assigned To</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.assignedTo || ''}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Enter name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="text-white font-medium">{task.assignedTo || 'Unassigned'}</p>
              )}
            </div>

            {/* Team */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <HiOutlineUserGroup className="w-4 h-4" />
                <span className="text-sm">Team</span>
              </div>
              {isEditing ? (
                <select
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <p className="text-white font-medium">{task.team}</p>
              )}
            </div>

            {/* Priority */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <HiOutlineFlag className="w-4 h-4" />
                <span className="text-sm">Priority</span>
              </div>
              {isEditing ? (
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <p className={`font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</p>
              )}
            </div>

            {/* Deadline */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <HiOutlineCalendar className="w-4 h-4" />
                <span className="text-sm">Deadline</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <p className={`font-medium ${isOverdue() ? 'text-red-400' : 'text-white'}`}>
                  {formatDate(task.deadline)}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <HiOutlineClock className="w-4 h-4" />
                <span className="text-sm">Start Date</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="text-white font-medium">{formatDate(task.startDate)}</p>
              )}
            </div>

            {/* Created Date */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <HiOutlineClock className="w-4 h-4" />
                <span className="text-sm">Created</span>
              </div>
              <p className="text-white font-medium">{formatDate(task.createdDate)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Add a description..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-300 whitespace-pre-wrap">
                  {task.description || 'No description provided'}
                </p>
              </div>
            )}
          </div>

          {/* Linear Link */}
          {(task.linearLink || isEditing) && (
            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">Linear Link</label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.linearLink || ''}
                  onChange={(e) => setFormData({ ...formData, linearLink: e.target.value })}
                  placeholder="https://linear.app/..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <a
                  href={task.linearLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30"
                >
                  <HiOutlineExternalLink className="w-4 h-4" />
                  Open in Linear
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
            <button
              onClick={() => {
                setFormData({ ...task });
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Quick Actions Footer (when not editing) */}
        {!isEditing && task.status !== 'Done' && (
          <div className="p-6 border-t border-zinc-800">
            <button
              onClick={() => handleStatusChange('Done')}
              disabled={saving}
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Mark as Done'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
