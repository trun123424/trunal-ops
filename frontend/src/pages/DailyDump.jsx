import React, { useState, useEffect } from 'react';
import { HiOutlineSave, HiOutlineCalendar, HiOutlineTrash, HiOutlineDocumentText, HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { notes as notesApi } from '../services/api';

export default function DailyDump() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentNote, setCurrentNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadNotes(); }, []);
  useEffect(() => {
    const dateNotes = notes.filter(n => n.date === selectedDate);
    setCurrentNote(dateNotes.length > 0 ? dateNotes[0].note : '');
  }, [selectedDate, notes]);

  const loadNotes = async () => {
    try { const data = await notesApi.getAll(); setNotes(data.notes || []); }
    catch (err) { console.error('Failed to load notes:', err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!currentNote.trim()) return;
    setSaving(true);
    try {
      const existingNote = notes.find(n => n.date === selectedDate);
      if (existingNote) await notesApi.delete(existingNote.id);
      await notesApi.create({ note: currentNote, date: selectedDate });
      await loadNotes();
    } catch (err) { console.error('Failed to save note:', err); }
    finally { setSaving(false); }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await notesApi.delete(id);
      setNotes(notes.filter(n => n.id !== id));
      if (notes.find(n => n.id === id)?.date === selectedDate) setCurrentNote('');
    } catch (err) { console.error('Failed to delete note:', err); }
  };

  const navigateDate = (direction) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const noteDates = [...new Set(notes.map(n => n.date))].sort().reverse();

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex bg-zinc-950">
      <div className="w-72 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-medium text-white flex items-center gap-2"><HiOutlineDocumentText className="w-4 h-4" />Note History</h2>
          <p className="text-xs text-zinc-500 mt-1">{notes.length} notes</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {noteDates.length === 0 ? <div className="p-4 text-center text-zinc-500 text-sm">No notes yet</div> : noteDates.map((date) => {
            const dateNotes = notes.filter(n => n.date === date);
            const isSelected = date === selectedDate;
            return (
              <button key={date} onClick={() => setSelectedDate(date)} className={`w-full p-4 text-left border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors ${isSelected ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-white'}`}>{formatDate(date)}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(dateNotes[0].id); }} className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><HiOutlineTrash className="w-3 h-3" /></button>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2">{dateNotes[0].note.substring(0, 100)}...</p>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-zinc-800">
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 text-sm"><HiOutlinePlus className="w-4 h-4" />New Note</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"><HiOutlineChevronLeft className="w-5 h-5" /></button>
            <div className="flex items-center gap-2"><HiOutlineCalendar className="w-5 h-5 text-indigo-400" /><h1 className="text-xl font-bold text-white">{formatDate(selectedDate)}</h1></div>
            <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"><HiOutlineChevronRight className="w-5 h-5" /></button>
          </div>
          <button onClick={handleSave} disabled={saving || !currentNote.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <HiOutlineSave className="w-4 h-4" />}Save Note
          </button>
        </div>
        <div className="flex-1 p-6">
          <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder={`Write your daily notes for ${formatDate(selectedDate)}...\n\n## Daily Standup\n- What did I do yesterday?\n- What will I do today?\n- Any blockers?\n\n## Notes\n...\n\n## Action Items\n- [ ] Task 1\n- [ ] Task 2`} className="w-full h-full resize-none bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono text-sm leading-relaxed" />
        </div>
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500"><span className="text-zinc-400">Tip:</span> Use Markdown formatting for better organization. Headers (##), lists (-), checkboxes ([ ]), and more.</p>
        </div>
      </div>
    </div>
  );
}
