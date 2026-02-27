import React, { useState, useEffect } from 'react';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineCalendar, HiOutlineChartBar, HiOutlineFilter, HiOutlineTable, HiOutlineDocumentReport } from 'react-icons/hi';
import { analytics, tasks as tasksApi } from '../services/api';

const REPORT_TYPES = [
  { id: 'daily', label: 'Daily Report', icon: HiOutlineCalendar },
  { id: 'weekly', label: 'Weekly Report', icon: HiOutlineChartBar },
  { id: 'monthly', label: 'Monthly Report', icon: HiOutlineDocumentText },
  { id: 'project', label: 'Project Report', icon: HiOutlineTable }
];

export default function Reports() {
  const [reportType, setReportType] = useState('weekly');
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    let start = new Date();
    if (reportType === 'daily') start = today;
    else if (reportType === 'weekly') start.setDate(today.getDate() - 7);
    else if (reportType === 'monthly') start.setMonth(today.getMonth() - 1);
    else start.setMonth(today.getMonth() - 3);
    setDateRange({ start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] });
  }, [reportType]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getAll();
      const tasks = (data.tasks || []).filter(t => { const date = t.createdDate.split('T')[0]; return date >= dateRange.start && date <= dateRange.end; });
      setPreview({
        tasks,
        summary: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'Done').length,
          inProgress: tasks.filter(t => t.status === 'In Progress').length,
          byTeam: { Personal: tasks.filter(t => t.team === 'Personal').length, Dev: tasks.filter(t => t.team === 'Dev').length, Data: tasks.filter(t => t.team === 'Data').length }
        }
      });
    } catch (err) { console.error('Failed to generate preview:', err); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getAll();
      const tasks = (data.tasks || []).filter(t => { const date = t.createdDate.split('T')[0]; return date >= dateRange.start && date <= dateRange.end; });
      let content, type, ext;
      if (format === 'csv') {
        content = 'ID,Title,Description,Project,Team,Status,Priority,Linear Link,Created Date\n' + tasks.map(t => `"${t.id}","${t.title}","${(t.description || '').replace(/"/g, '""')}","${t.project}","${t.team}","${t.status}","${t.priority}","${t.linearLink || ''}","${t.createdDate}"`).join('\n');
        type = 'text/csv'; ext = 'csv';
      } else {
        content = JSON.stringify(tasks, null, 2); type = 'application/json'; ext = 'json';
      }
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `trunal-ops-${reportType}-report-${dateRange.start}-to-${dateRange.end}.${ext}`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Export failed:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-zinc-400 mt-1">Generate and export reports for your tasks</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-3">Report Type</label>
            <div className="grid grid-cols-4 gap-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button key={type.id} onClick={() => setReportType(type.id)} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${reportType === type.id ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : 'hover:bg-zinc-800'}`}>
                    <Icon className={`w-6 h-6 ${reportType === type.id ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span className={`text-sm ${reportType === type.id ? 'text-white' : 'text-zinc-400'}`}>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <label className="block text-sm text-zinc-400 mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">End Date</label>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>

          <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <label className="block text-sm text-zinc-400 mb-3">Export Format</label>
            <div className="flex gap-3">
              <button onClick={() => setFormat('csv')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${format === 'csv' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
                <HiOutlineDocumentReport className="w-5 h-5" />CSV
              </button>
              <button onClick={() => setFormat('json')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${format === 'json' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
                <HiOutlineDocumentText className="w-5 h-5" />JSON
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button onClick={generatePreview} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700" disabled={loading}>
              <HiOutlineFilter className="w-4 h-4" />Preview Report
            </button>
            <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <HiOutlineDownload className="w-4 h-4" />}
              Export {format.toUpperCase()}
            </button>
          </div>

          {preview && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="font-medium text-white mb-4">Report Preview</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-800 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-white">{preview.summary.total}</p><p className="text-xs text-zinc-500">Total Tasks</p></div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-green-400">{preview.summary.completed}</p><p className="text-xs text-zinc-500">Completed</p></div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-yellow-400">{preview.summary.inProgress}</p><p className="text-xs text-zinc-500">In Progress</p></div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-indigo-400">{preview.summary.total > 0 ? Math.round((preview.summary.completed / preview.summary.total) * 100) : 0}%</p><p className="text-xs text-zinc-500">Completion</p></div>
              </div>
              <div className="mb-6">
                <h4 className="text-sm text-zinc-400 mb-3">By Team</h4>
                <div className="flex gap-4">
                  {Object.entries(preview.summary.byTeam).map(([team, count]) => (
                    <div key={team} className="flex items-center gap-2"><span className={`px-2 py-1 rounded text-xs font-medium ${getTeamBadge(team)}`}>{team}</span><span className="text-white">{count}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm text-zinc-400 mb-3">Tasks ({preview.tasks.length})</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {preview.tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(task.status)}`}>{task.status}</span>
                      <span className="text-white flex-1 truncate">{task.title}</span>
                      <span className="text-xs text-zinc-500">{task.project}</span>
                    </div>
                  ))}
                  {preview.tasks.length > 10 && <p className="text-center text-zinc-500 text-sm py-2">+{preview.tasks.length - 10} more tasks</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status) {
  const badges = { 'Created': 'bg-zinc-500/20 text-zinc-400', 'Assigned': 'bg-blue-500/20 text-blue-400', 'In Progress': 'bg-yellow-500/20 text-yellow-400', 'Review': 'bg-purple-500/20 text-purple-400', 'Done': 'bg-green-500/20 text-green-400' };
  return badges[status] || 'bg-zinc-500/20 text-zinc-400';
}

function getTeamBadge(team) {
  const badges = { 'Personal': 'bg-indigo-500/20 text-indigo-400', 'Dev': 'bg-green-500/20 text-green-400', 'Data': 'bg-orange-500/20 text-orange-400' };
  return badges[team] || 'bg-zinc-500/20 text-zinc-400';
}
