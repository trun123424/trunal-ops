import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { HiOutlineClipboardList, HiOutlineUsers, HiOutlineDatabase, HiOutlineUser, HiOutlineTrendingUp, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamationCircle, HiOutlineArrowRight, HiOutlineExclamation } from 'react-icons/hi';
import { tasks as tasksApi, notes as notesApi } from '../services/api';
import DateFilter, { getDateRange, filterByDate } from '../components/DateFilter';
import TaskDetailModal from '../components/TaskDetailModal';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#27272a',
      titleColor: '#fafafa',
      bodyColor: '#a1a1aa',
      borderColor: '#3f3f46',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#71717a' }
    },
    y: {
      grid: { color: '#27272a' },
      ticks: { color: '#71717a' }
    }
  }
};

export default function Dashboard() {
  const [allTasks, setAllTasks] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksResult, notesResult] = await Promise.all([
        tasksApi.getAll(),
        notesApi.getAll()
      ]);
      setAllTasks(tasksResult.tasks || []);
      setAllNotes(notesResult.notes || []);
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

  const handleTaskUpdate = (updatedTask) => {
    setAllTasks(allTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const isOverdue = (task) => {
    if (!task.deadline || task.status === 'Done') return false;
    return new Date(task.deadline) < new Date();
  };

  // Filter tasks based on date
  const dateRange = getDateRange(dateFilter, customRange);
  const tasks = filterByDate(allTasks, dateRange, 'createdDate');

  // Calculate analytics from filtered tasks
  const data = {
    totalTasks: tasks.length,
    totalNotes: filterByDate(allNotes, dateRange, 'date').length,
    statusCounts: {
      Created: tasks.filter(t => t.status === 'Created').length,
      Assigned: tasks.filter(t => t.status === 'Assigned').length,
      'In Progress': tasks.filter(t => t.status === 'In Progress').length,
      Review: tasks.filter(t => t.status === 'Review').length,
      Done: tasks.filter(t => t.status === 'Done').length,
    },
    teamCounts: {
      Personal: tasks.filter(t => t.team === 'Personal').length,
      Dev: tasks.filter(t => t.team === 'Dev').length,
      Data: tasks.filter(t => t.team === 'Data').length,
    },
    projectCounts: tasks.reduce((acc, t) => {
      acc[t.project] = (acc[t.project] || 0) + 1;
      return acc;
    }, {}),
    recentTasks: tasks.slice(0, 5),
    tasksPerDay: getLast7DaysData(tasks, 'createdDate'),
    completedPerDay: getLast7DaysData(tasks.filter(t => t.status === 'Done'), 'updatedDate'),
  };

  function getLast7DaysData(taskList, dateField) {
    const result = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result[dateStr] = taskList.filter(t => t[dateField]?.startsWith(dateStr)).length;
    }
    return result;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tasksPerDayData = {
    labels: Object.keys(data.tasksPerDay).map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      data: Object.values(data.tasksPerDay),
      backgroundColor: '#6366f1',
      borderRadius: 6
    }]
  };

  const statusData = {
    labels: Object.keys(data.statusCounts),
    datasets: [{
      data: Object.values(data.statusCounts),
      backgroundColor: ['#6b7280', '#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e'],
      borderWidth: 0
    }]
  };

  const teamData = {
    labels: Object.keys(data.teamCounts),
    datasets: [{
      data: Object.values(data.teamCounts),
      backgroundColor: ['#6366f1', '#22c55e', '#f59e0b'],
      borderWidth: 0
    }]
  };

  const completedData = {
    labels: Object.keys(data.completedPerDay).map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      data: Object.values(data.completedPerDay),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#22c55e'
    }]
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-zinc-950">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Welcome back, Trunal! Here's your operations overview.</p>
          </div>
          <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
        </div>
        {dateFilter !== 'all' && (
          <div className="text-sm text-indigo-400">
            Showing data for: {dateFilter === 'custom' && dateRange ? `${dateRange.start} to ${dateRange.end}` : dateFilter}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={HiOutlineClipboardList} label="Total Tasks" value={data.totalTasks} color="text-indigo-400" bgColor="bg-indigo-500/20" />
        <StatsCard icon={HiOutlineUsers} label="Dev Team Tasks" value={data.teamCounts.Dev || 0} color="text-green-400" bgColor="bg-green-500/20" />
        <StatsCard icon={HiOutlineDatabase} label="Data Team Tasks" value={data.teamCounts.Data || 0} color="text-orange-400" bgColor="bg-orange-500/20" />
        <StatsCard icon={HiOutlineUser} label="Personal Tasks" value={data.teamCounts.Personal || 0} color="text-purple-400" bgColor="bg-purple-500/20" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatusCard label="Created" count={data.statusCounts.Created || 0} color="bg-zinc-500" />
        <StatusCard label="Assigned" count={data.statusCounts.Assigned || 0} color="bg-blue-500" />
        <StatusCard label="In Progress" count={data.statusCounts['In Progress'] || 0} color="bg-yellow-500" />
        <StatusCard label="Review" count={data.statusCounts.Review || 0} color="bg-purple-500" />
        <StatusCard label="Done" count={data.statusCounts.Done || 0} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-medium text-white mb-4">Tasks Created (Last 7 Days)</h3>
          <div className="h-64">
            <Bar data={tasksPerDayData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-medium text-white mb-4">Tasks Completed (Last 7 Days)</h3>
          <div className="h-64">
            <Line data={completedData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-medium text-white mb-4">Tasks by Status</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={statusData} options={{ ...chartOptions, cutout: '60%', scales: {} }} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-medium text-white mb-4">Tasks by Team</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={teamData} options={{ ...chartOptions, cutout: '60%', scales: {} }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Recent Tasks</h3>
            <a href="/tasks" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <HiOutlineArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            {data.recentTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${getStatusBg(task.status)}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white truncate">{task.title}</p>
                    {isOverdue(task) && (
                      <span className="flex items-center px-1.5 py-0.5 bg-red-500/20 rounded">
                        <HiOutlineExclamation className="w-3 h-3 text-red-400" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{task.project}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getTeamBadge(task.team)}`}>{task.team}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="font-medium text-white mb-4">Projects</h3>
          <div className="space-y-3">
            {Object.entries(data.projectCounts).slice(0, 5).map(([project, count]) => (
              <div key={project} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-400 font-medium">{project.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{project}</p>
                  <p className="text-xs text-zinc-500">{count} tasks</p>
                </div>
                <div className="w-24 h-2 rounded-full bg-zinc-700 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (count / data.totalTasks) * 100 * 3)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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

function StatsCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <HiOutlineTrendingUp className="w-4 h-4 text-green-400" />
      </div>
      <div className="text-3xl font-bold text-white mt-3">{value}</div>
      <div className="text-sm text-zinc-400">{label}</div>
    </div>
  );
}

function StatusCard({ label, count, color }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <div>
        <p className="text-xl font-bold text-white">{count}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function getStatusBg(status) {
  const colors = { 'Created': 'bg-zinc-500', 'Assigned': 'bg-blue-500', 'In Progress': 'bg-yellow-500', 'Review': 'bg-purple-500', 'Done': 'bg-green-500' };
  return colors[status] || 'bg-zinc-500';
}

function getTeamBadge(team) {
  const badges = { 'Personal': 'bg-indigo-500/20 text-indigo-400', 'Dev': 'bg-green-500/20 text-green-400', 'Data': 'bg-orange-500/20 text-orange-400' };
  return badges[team] || 'bg-zinc-500/20 text-zinc-400';
}
