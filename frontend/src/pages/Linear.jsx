import React, { useState, useEffect } from 'react';
import { HiOutlineExternalLink, HiOutlineLink, HiOutlinePlus, HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineFolder } from 'react-icons/hi';
import { tasks as tasksApi } from '../services/api';
import DateFilter, { getDateRange, filterByDate } from '../components/DateFilter';

export default function Linear() {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState(null);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const data = await tasksApi.getAll();
      const linearTasks = (data.tasks || []).filter(t => t.linearLink);
      setAllTasks(linearTasks);
      const projects = [...new Set(linearTasks.map(t => t.project))];
      const expanded = {}; projects.forEach(p => expanded[p] = true);
      setExpandedProjects(expanded);
    } catch (err) { console.error('Failed to load tasks:', err); }
    finally { setLoading(false); }
  };

  const handleDateFilterChange = (preset, range = null) => {
    setDateFilter(preset);
    if (range) setCustomRange(range);
  };

  const dateRange = getDateRange(dateFilter, customRange);
  const tasks = filterByDate(allTasks, dateRange, 'createdDate');

  const toggleProject = (project) => setExpandedProjects(prev => ({ ...prev, [project]: !prev[project] }));

  const tasksByProject = tasks.reduce((acc, task) => { if (!acc[task.project]) acc[task.project] = []; acc[task.project].push(task); return acc; }, {});

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><HiOutlineLink className="w-6 h-6 text-indigo-400" />Linear Integration</h1>
            <p className="text-zinc-400 mt-1">{tasks.length} tasks linked to Linear, grouped by project</p>
          </div>
          <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {Object.keys(tasksByProject).length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center mb-4"><HiOutlineLink className="w-8 h-8 text-zinc-600" /></div>
            <h3 className="text-lg font-medium text-white mb-2">No Linear Links Yet</h3>
            <p className="text-zinc-400 mb-6">Add Linear links to your tasks to see them here</p>
            <a href="/tasks" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><HiOutlinePlus className="w-4 h-4" />Create Task with Linear Link</a>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(tasksByProject).map(([project, projectTasks]) => (
              <div key={project} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => toggleProject(project)} className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors">
                  {expandedProjects[project] ? <HiOutlineChevronDown className="w-5 h-5 text-zinc-400" /> : <HiOutlineChevronRight className="w-5 h-5 text-zinc-400" />}
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center"><HiOutlineFolder className="w-5 h-5 text-indigo-400" /></div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-white">{project}</h3>
                    <p className="text-sm text-zinc-500">{projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''} with Linear</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-400">{projectTasks.filter(t => t.status === 'Done').length} done</span>
                    <span className="text-sm text-zinc-500">/ {projectTasks.length}</span>
                  </div>
                </button>
                {expandedProjects[project] && (
                  <div className="border-t border-zinc-800">
                    {projectTasks.map((task, index) => (
                      <div key={task.id} className={`flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors ${index !== projectTasks.length - 1 ? 'border-b border-zinc-800/50' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white truncate">{task.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTeamBadge(task.team)}`}>{task.team}</span>
                          </div>
                          {task.description && <p className="text-sm text-zinc-500 truncate mt-0.5">{task.description}</p>}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(task.status)}`}>{task.status}</span>
                        <a href={task.linearLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors text-sm">
                          <span className="hidden sm:inline">Open in Linear</span><HiOutlineExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Linked" value={tasks.length} color="text-indigo-400" />
            <StatCard label="In Progress" value={tasks.filter(t => t.status === 'In Progress').length} color="text-yellow-400" />
            <StatCard label="In Review" value={tasks.filter(t => t.status === 'Review').length} color="text-purple-400" />
            <StatCard label="Completed" value={tasks.filter(t => t.status === 'Done').length} color="text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center"><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-sm text-zinc-500">{label}</p></div>;
}

function getStatusColor(status) {
  const colors = { 'Created': 'bg-zinc-500', 'Assigned': 'bg-blue-500', 'In Progress': 'bg-yellow-500', 'Review': 'bg-purple-500', 'Done': 'bg-green-500' };
  return colors[status] || 'bg-zinc-500';
}

function getStatusBadge(status) {
  const badges = { 'Created': 'bg-zinc-500/20 text-zinc-400', 'Assigned': 'bg-blue-500/20 text-blue-400', 'In Progress': 'bg-yellow-500/20 text-yellow-400', 'Review': 'bg-purple-500/20 text-purple-400', 'Done': 'bg-green-500/20 text-green-400' };
  return badges[status] || 'bg-zinc-500/20 text-zinc-400';
}

function getTeamBadge(team) {
  const badges = { 'Personal': 'bg-indigo-500/20 text-indigo-400', 'Dev': 'bg-green-500/20 text-green-400', 'Data': 'bg-orange-500/20 text-orange-400' };
  return badges[team] || 'bg-zinc-500/20 text-zinc-400';
}
