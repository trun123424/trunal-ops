import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { HiOutlineExternalLink, HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi';
import { tasks as tasksApi } from '../services/api';
import DateFilter, { getDateRange, filterByDate } from '../components/DateFilter';

const COLUMNS = [
  { id: 'Created', title: 'Created', color: 'bg-zinc-500' },
  { id: 'Assigned', title: 'Assigned', color: 'bg-blue-500' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'Review', title: 'Review', color: 'bg-purple-500' },
  { id: 'Done', title: 'Done', color: 'bg-green-500' }
];

export default function Kanban() {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customRange, setCustomRange] = useState(null);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const data = await tasksApi.getAll();
      setAllTasks(data.tasks || []);
    } catch (err) { console.error('Failed to load tasks:', err); }
    finally { setLoading(false); }
  };

  const handleDateFilterChange = (preset, range = null) => {
    setDateFilter(preset);
    if (range) setCustomRange(range);
  };

  const dateRange = getDateRange(dateFilter, customRange);
  const tasks = filterByDate(allTasks, dateRange, 'createdDate');

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { destination, draggableId } = result;
    if (result.source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    setAllTasks(allTasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));
    try { await tasksApi.updateStatus(draggableId, newStatus); }
    catch (err) { console.error('Failed to update task status:', err); loadTasks(); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
            <p className="text-zinc-400 mt-1">Drag and drop tasks to change their status</p>
          </div>
          <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
        </div>
        {dateFilter !== 'all' && (
          <p className="text-sm text-indigo-400">Showing {tasks.length} tasks</p>
        )}
      </div>
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => (
              <div key={column.id} className="w-72 bg-zinc-900/50 rounded-xl p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h3 className="font-medium text-white">{column.title}</h3>
                  <span className="text-sm text-zinc-500">({tasks.filter(t => t.status === column.id).length})</span>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 space-y-2 overflow-y-auto min-h-[200px] rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/10' : ''}`}>
                      {tasks.filter(t => t.status === column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-zinc-800 border border-zinc-700 rounded-lg p-3 cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-zinc-500 truncate">{task.project}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getTeamBadge(task.team)}`}>{task.team}</span>
                              </div>
                              <h4 className="font-medium text-white text-sm mb-2 line-clamp-2">{task.title}</h4>
                              {task.description && <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{task.description}</p>}
                              <div className="flex items-center justify-between text-xs">
                                <span className={`px-2 py-0.5 rounded font-medium ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                <div className="flex items-center gap-2">
                                  {task.assignedTo && (
                                    <span className="flex items-center gap-1 text-zinc-400" title={task.assignedTo}>
                                      <HiOutlineUser className="w-3 h-3" />
                                      <span className="max-w-[60px] truncate">{task.assignedTo}</span>
                                    </span>
                                  )}
                                  {task.linearLink && <a href={task.linearLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300" onClick={(e) => e.stopPropagation()}><HiOutlineExternalLink className="w-3.5 h-3.5" /></a>}
                                  {task.dueDate && <span className="flex items-center gap-1 text-zinc-500"><HiOutlineCalendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {tasks.filter(t => t.status === column.id).length === 0 && !snapshot.isDraggingOver && <div className="text-center text-zinc-600 py-8 text-sm">No tasks</div>}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

function getTeamBadge(team) {
  const badges = { 'Personal': 'bg-indigo-500/20 text-indigo-400', 'Dev': 'bg-green-500/20 text-green-400', 'Data': 'bg-orange-500/20 text-orange-400' };
  return badges[team] || 'bg-zinc-500/20 text-zinc-400';
}

function getPriorityBadge(priority) {
  const badges = { 'Low': 'bg-zinc-500/20 text-zinc-400', 'Medium': 'bg-blue-500/20 text-blue-400', 'High': 'bg-orange-500/20 text-orange-400', 'Urgent': 'bg-red-500/20 text-red-400' };
  return badges[priority] || 'bg-zinc-500/20 text-zinc-400';
}
