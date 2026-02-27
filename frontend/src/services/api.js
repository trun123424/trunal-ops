/**
 * API Service - TrunalOps
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Tasks API
export const tasks = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/tasks${params ? `?${params}` : ''}`);
  },
  getById: (id) => request(`/tasks/${id}`),
  create: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id, updates) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  updateStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' })
};

// Notes API
export const notes = {
  getAll: (date) => {
    const params = date ? `?date=${date}` : '';
    return request(`/notes${params}`);
  },
  create: (note) => request('/notes', { method: 'POST', body: JSON.stringify(note) }),
  delete: (id) => request(`/notes/${id}`, { method: 'DELETE' })
};

// Projects API
export const projects = {
  getAll: () => request('/projects'),
  create: (project) => request('/projects', { method: 'POST', body: JSON.stringify(project) }),
  delete: (id) => request(`/projects/${id}`, { method: 'DELETE' })
};

// Search API
export const search = {
  query: (q) => request(`/search?q=${encodeURIComponent(q)}`)
};

// Analytics API
export const analytics = {
  get: () => request('/analytics'),
  export: (params) => request('/analytics/export', { method: 'POST', body: JSON.stringify(params) })
};
