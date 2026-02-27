import React, { useState } from 'react';
import { HiOutlineCalendar, HiOutlineChevronDown } from 'react-icons/hi';

const DATE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'custom', label: 'Custom Range' },
];

export function getDateRange(preset, customRange = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return { start: yesterdayStr, end: yesterdayStr };
    }

    case 'week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
      };
    }

    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      };
    }

    case 'quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      return {
        start: startOfQuarter.toISOString().split('T')[0],
        end: endOfQuarter.toISOString().split('T')[0]
      };
    }

    case 'custom':
      return customRange || { start: null, end: null };

    default:
      return null; // 'all' - no filtering
  }
}

export function filterByDate(items, dateRange, dateField = 'createdDate') {
  if (!dateRange || !dateRange.start) return items;

  return items.filter(item => {
    const itemDate = item[dateField]?.split('T')[0];
    if (!itemDate) return true;
    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });
}

export default function DateFilter({ value, onChange, showCustom = true, compact = false }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const currentPreset = DATE_PRESETS.find(p => p.id === value) || DATE_PRESETS[0];
  const filteredPresets = showCustom ? DATE_PRESETS : DATE_PRESETS.filter(p => p.id !== 'custom');

  const handleSelect = (preset) => {
    if (preset === 'custom') {
      setShowCustomPicker(true);
    } else {
      onChange(preset);
      setShowDropdown(false);
      setShowCustomPicker(false);
    }
  };

  const handleCustomApply = () => {
    if (customRange.start && customRange.end) {
      onChange('custom', customRange);
      setShowDropdown(false);
      setShowCustomPicker(false);
    }
  };

  const handleClose = () => {
    setShowDropdown(false);
    setShowCustomPicker(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {filteredPresets.filter(p => p.id !== 'custom').map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value === preset.id
                ? 'bg-indigo-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    );
  }

  const getDisplayLabel = () => {
    if (value === 'custom' && customRange.start && customRange.end) {
      return `${customRange.start} - ${customRange.end}`;
    }
    return currentPreset.label;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
      >
        <HiOutlineCalendar className="w-4 h-4" />
        <span className="max-w-[180px] truncate">{getDisplayLabel()}</span>
        <HiOutlineChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
            {!showCustomPicker ? (
              <div className="p-2">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      value === preset.id || (preset.id === 'custom' && value === 'custom')
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Custom Date Range</h3>
                  <button
                    onClick={() => setShowCustomPicker(false)}
                    className="text-zinc-400 hover:text-white text-sm"
                  >
                    Back
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customRange.start || !customRange.end}
                    className="w-full px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
