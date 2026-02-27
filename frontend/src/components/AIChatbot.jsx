import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineChat, HiOutlineX, HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineChevronDown } from 'react-icons/hi';
import { tasks as tasksApi } from '../services/api';

const QUICK_PROMPTS = [
  "Show my pending tasks",
  "What tasks are overdue?",
  "Show tasks due today",
  "What did I complete this week?",
  "Show high priority tasks"
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm your TrunalOps assistant. I can help you with task queries and actions. Try asking about your tasks!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadTasks();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTasks = async () => {
    try {
      const data = await tasksApi.getAll();
      setAllTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const processQuery = async (query) => {
    const lowerQuery = query.toLowerCase();

    // Get current date info
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Query patterns
    if (lowerQuery.includes('pending') || lowerQuery.includes('not done') || lowerQuery.includes('incomplete')) {
      const pendingTasks = allTasks.filter(t => t.status !== 'Done');
      return formatTaskList(pendingTasks, 'Pending Tasks');
    }

    if (lowerQuery.includes('overdue')) {
      const overdueTasks = allTasks.filter(t => {
        if (!t.deadline || t.status === 'Done') return false;
        return new Date(t.deadline) < today;
      });
      return formatTaskList(overdueTasks, 'Overdue Tasks');
    }

    if (lowerQuery.includes('due today') || lowerQuery.includes('today\'s tasks')) {
      const todayTasks = allTasks.filter(t => t.deadline === todayStr && t.status !== 'Done');
      return formatTaskList(todayTasks, 'Tasks Due Today');
    }

    if (lowerQuery.includes('high priority') || lowerQuery.includes('urgent')) {
      const highPriority = allTasks.filter(t => (t.priority === 'High' || t.priority === 'Urgent') && t.status !== 'Done');
      return formatTaskList(highPriority, 'High Priority Tasks');
    }

    if (lowerQuery.includes('complete') && lowerQuery.includes('week')) {
      const completedThisWeek = allTasks.filter(t => {
        if (t.status !== 'Done') return false;
        const updatedDate = t.updatedDate?.split('T')[0];
        return updatedDate >= weekStartStr;
      });
      return formatTaskList(completedThisWeek, 'Completed This Week');
    }

    if (lowerQuery.includes('complete') && lowerQuery.includes('today')) {
      const completedToday = allTasks.filter(t => {
        if (t.status !== 'Done') return false;
        const updatedDate = t.updatedDate?.split('T')[0];
        return updatedDate === todayStr;
      });
      return formatTaskList(completedToday, 'Completed Today');
    }

    if (lowerQuery.includes('in progress') || lowerQuery.includes('working on')) {
      const inProgress = allTasks.filter(t => t.status === 'In Progress');
      return formatTaskList(inProgress, 'Tasks In Progress');
    }

    if (lowerQuery.includes('all tasks') || lowerQuery.includes('show all')) {
      return formatTaskList(allTasks.slice(0, 10), `All Tasks (showing 10 of ${allTasks.length})`);
    }

    if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('stats')) {
      return getTaskSummary();
    }

    // Handle task actions
    if (lowerQuery.includes('mark') && lowerQuery.includes('done')) {
      const taskMatch = lowerQuery.match(/mark ["'](.+?)["'] (?:as )?done/i);
      if (taskMatch) {
        const taskTitle = taskMatch[1];
        return await markTaskDone(taskTitle);
      }
      return "To mark a task done, use: `mark \"task title\" as done`";
    }

    // Search by project
    const projectMatch = lowerQuery.match(/(?:tasks? (?:in|for|from) |project )["']?(\w+)["']?/i);
    if (projectMatch) {
      const projectName = projectMatch[1];
      const projectTasks = allTasks.filter(t =>
        t.project.toLowerCase().includes(projectName.toLowerCase())
      );
      return formatTaskList(projectTasks, `Tasks in "${projectName}"`);
    }

    // Search by assignee
    const assigneeMatch = lowerQuery.match(/(?:assigned to |tasks? for )["']?(\w+)["']?/i);
    if (assigneeMatch) {
      const assignee = assigneeMatch[1];
      const assignedTasks = allTasks.filter(t =>
        t.assignedTo?.toLowerCase().includes(assignee.toLowerCase())
      );
      return formatTaskList(assignedTasks, `Tasks assigned to "${assignee}"`);
    }

    // Default response
    return `I can help you with:
- **View tasks**: "show pending tasks", "what's overdue?", "tasks due today"
- **Filter**: "high priority tasks", "tasks in [project]", "tasks for [person]"
- **Summary**: "give me a summary", "task stats"
- **Actions**: \`mark "task title" as done\`

Try one of these queries!`;
  };

  const formatTaskList = (tasks, title) => {
    if (tasks.length === 0) {
      return `**${title}**\n\nNo tasks found.`;
    }

    const taskLines = tasks.slice(0, 10).map((t, i) => {
      const status = t.status === 'Done' ? '✓' : '○';
      const priority = t.priority === 'Urgent' ? '🔴' : t.priority === 'High' ? '🟠' : '';
      const deadline = t.deadline ? ` (due: ${formatDate(t.deadline)})` : '';
      return `${i + 1}. ${status} ${priority} **${t.title}**${deadline}\n   _${t.project} · ${t.status}_`;
    }).join('\n\n');

    const moreText = tasks.length > 10 ? `\n\n_...and ${tasks.length - 10} more_` : '';
    return `**${title}** (${tasks.length})\n\n${taskLines}${moreText}`;
  };

  const getTaskSummary = () => {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.status === 'Done').length;
    const inProgress = allTasks.filter(t => t.status === 'In Progress').length;
    const pending = allTasks.filter(t => t.status !== 'Done').length;
    const overdue = allTasks.filter(t => {
      if (!t.deadline || t.status === 'Done') return false;
      return new Date(t.deadline) < new Date();
    }).length;

    return `**Task Summary**

📊 **Total Tasks**: ${total}
✅ **Completed**: ${done}
🔄 **In Progress**: ${inProgress}
📋 **Pending**: ${pending}
⚠️ **Overdue**: ${overdue}

Completion rate: ${total > 0 ? Math.round((done / total) * 100) : 0}%`;
  };

  const markTaskDone = async (taskTitle) => {
    const task = allTasks.find(t =>
      t.title.toLowerCase().includes(taskTitle.toLowerCase())
    );

    if (!task) {
      return `Could not find a task matching "${taskTitle}"`;
    }

    if (task.status === 'Done') {
      return `Task "${task.title}" is already marked as done.`;
    }

    try {
      await tasksApi.update(task.id, { ...task, status: 'Done' });
      await loadTasks();
      return `✅ Marked **"${task.title}"** as done!`;
    } catch (err) {
      return `Failed to update task: ${err.message}`;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await processQuery(userMessage);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-40 ${
          isOpen ? 'bg-zinc-800 text-zinc-400' : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }`}
      >
        {isOpen ? <HiOutlineChevronDown className="w-6 h-6" /> : <HiOutlineChat className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">TrunalOps AI</h3>
              <p className="text-xs text-zinc-500">Ask about your tasks</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-md'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/_(.+?)_/g, '<em class="text-zinc-400">$1</em>')
                      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-zinc-700 rounded text-xs">$1</code>')
                  }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-zinc-800 overflow-x-auto">
            <div className="flex gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-full whitespace-nowrap hover:bg-zinc-700 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your tasks..."
                className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiOutlinePaperAirplane className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
