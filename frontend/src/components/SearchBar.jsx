import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineX, HiOutlineDocumentText, HiOutlineClipboardList, HiOutlineArrowRight } from 'react-icons/hi';
import { search as searchApi } from '../services/api';

export default function SearchBar({ onClose, onSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], notes: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults({ tasks: [], notes: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const data = await searchApi.query(query); setResults(data); }
      catch (err) { console.error('Search error:', err); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => { e.preventDefault(); if (query.trim()) { onSearch(query); navigate('/search'); } };
  const handleResultClick = (type) => { onClose(); navigate(type === 'task' ? '/tasks' : '/daily-dump'); };
  const hasResults = results.tasks.length > 0 || results.notes.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="relative border-b border-zinc-800">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks, notes, projects..." className="w-full bg-transparent border-none px-12 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none" />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>}
        </form>

        <div className="max-h-96 overflow-y-auto">
          {loading && <div className="p-8 text-center text-zinc-400"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>}
          {!loading && query.length >= 2 && !hasResults && <div className="p-8 text-center text-zinc-400">No results found for "{query}"</div>}
          {!loading && hasResults && (
            <>
              {results.tasks.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase">Tasks</p>
                  {results.tasks.slice(0, 5).map((task) => (
                    <button key={task.id} onClick={() => handleResultClick('task')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left">
                      <HiOutlineClipboardList className="w-4 h-4 text-indigo-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{task.title}</p>
                        <p className="text-xs text-zinc-500">{task.project} • {task.team}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(task.status)}`}>{task.status}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.notes.length > 0 && (
                <div className="p-2 border-t border-zinc-800">
                  <p className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase">Notes</p>
                  {results.notes.slice(0, 3).map((note) => (
                    <button key={note.id} onClick={() => handleResultClick('note')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left">
                      <HiOutlineDocumentText className="w-4 h-4 text-orange-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{note.note.substring(0, 60)}...</p>
                        <p className="text-xs text-zinc-500">{note.date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {(results.tasks.length > 5 || results.notes.length > 3) && (
                <div className="p-2 border-t border-zinc-800">
                  <button onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                    <span>View all results</span><HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
          {!query && (
            <div className="p-6 text-center text-zinc-500">
              <p className="text-sm">Start typing to search tasks and notes</p>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-zinc-800">↵</kbd> to search</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-zinc-800">esc</kbd> to close</span>
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
