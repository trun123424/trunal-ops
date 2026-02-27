import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineExternalLink, HiOutlineArrowLeft } from 'react-icons/hi';
import { search as searchApi } from '../services/api';

export default function SearchResults({ query }) {
  const [results, setResults] = useState({ tasks: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query || '');
  const navigate = useNavigate();

  useEffect(() => {
    if (query) { setSearchQuery(query); performSearch(query); }
    else { setLoading(false); }
  }, [query]);

  const performSearch = async (q) => {
    if (!q.trim()) { setResults({ tasks: [], notes: [] }); setLoading(false); return; }
    setLoading(true);
    try { const data = await searchApi.query(q); setResults(data); }
    catch (err) { console.error('Search failed:', err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); performSearch(searchQuery); };
  const totalResults = results.tasks.length + results.notes.length;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="p-6 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"><HiOutlineArrowLeft className="w-4 h-4" />Back</button>
        <h1 className="text-2xl font-bold text-white mb-4">Search Results</h1>
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks and notes..." className="w-full pl-12 py-3 text-lg bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500" />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <>
            {totalResults === 0 && searchQuery && (
              <div className="text-center py-16">
                <HiOutlineSearch className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
                <p className="text-zinc-400">No tasks or notes match "{searchQuery}"</p>
              </div>
            )}
            {!searchQuery && (
              <div className="text-center py-16">
                <HiOutlineSearch className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Search for tasks and notes</h3>
                <p className="text-zinc-400">Enter a search term to find tasks and notes</p>
              </div>
            )}
            {totalResults > 0 && (
              <div className="max-w-4xl mx-auto">
                <p className="text-zinc-400 mb-6">Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"</p>
                {results.tasks.length > 0 && (
                  <div className="mb-8">
                    <h2 className="flex items-center gap-2 text-lg font-medium text-white mb-4"><HiOutlineClipboardList className="w-5 h-5 text-indigo-400" />Tasks ({results.tasks.length})</h2>
                    <div className="space-y-3">
                      {results.tasks.map((task) => (
                        <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => navigate('/tasks')}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white">{task.title}</h3>
                              {task.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{task.description}</p>}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-zinc-500">{task.project}</span>
                                <span className="text-zinc-600">•</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTeamBadge(task.team)}`}>{task.team}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(task.status)}`}>{task.status}</span>
                              </div>
                            </div>
                            {task.linearLink && (
                              <a href={task.linearLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300" onClick={(e) => e.stopPropagation()}><HiOutlineExternalLink className="w-4 h-4" /></a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.notes.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-medium text-white mb-4"><HiOutlineDocumentText className="w-5 h-5 text-orange-400" />Notes ({results.notes.length})</h2>
                    <div className="space-y-3">
                      {results.notes.map((note) => (
                        <div key={note.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => navigate('/daily-dump')}>
                          <div className="flex items-center justify-between mb-2"><span className="text-sm text-zinc-400">{note.date}</span></div>
                          <p className="text-white whitespace-pre-wrap line-clamp-4">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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
