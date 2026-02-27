import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import PersonalTasks from './pages/PersonalTasks';
import Kanban from './pages/Kanban';
import Timeline from './pages/Timeline';
import Linear from './pages/Linear';
import DailyDump from './pages/DailyDump';
import Reports from './pages/Reports';
import SearchResults from './pages/SearchResults';
import SearchBar from './components/SearchBar';
import AIChatbot from './components/AIChatbot';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-zinc-950">
        <Sidebar onSearchClick={() => setShowSearch(true)} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/personal" element={<PersonalTasks />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/linear" element={<Linear />} />
            <Route path="/daily-dump" element={<DailyDump />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/search" element={<SearchResults query={searchQuery} />} />
          </Routes>
        </main>

        {showSearch && (
          <SearchBar
            onClose={() => setShowSearch(false)}
            onSearch={(q) => {
              setSearchQuery(q);
              setShowSearch(false);
            }}
          />
        )}

        <AIChatbot />
      </div>
    </BrowserRouter>
  );
}
