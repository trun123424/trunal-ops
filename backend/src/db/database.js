/**
 * Database Module - TrunalOps
 * Uses sql.js (pure JavaScript SQLite) for local storage
 */

import initSqlJs from 'sql.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'trunal-ops.db');

let db = null;

/**
 * Initialize the database
 */
export async function initDatabase() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project TEXT NOT NULL,
      team TEXT NOT NULL CHECK (team IN ('Personal', 'Dev', 'Data')),
      status TEXT NOT NULL DEFAULT 'Created' CHECK (status IN ('Created', 'Assigned', 'In Progress', 'Review', 'Done')),
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
      assignedTo TEXT,
      linearLink TEXT,
      createdDate TEXT NOT NULL,
      updatedDate TEXT NOT NULL,
      dueDate TEXT
    )
  `);

  // Add assignedTo column if it doesn't exist (for existing databases)
  try {
    db.run(`ALTER TABLE tasks ADD COLUMN assignedTo TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add startDate column if it doesn't exist
  try {
    db.run(`ALTER TABLE tasks ADD COLUMN startDate TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add deadline column if it doesn't exist
  try {
    db.run(`ALTER TABLE tasks ADD COLUMN deadline TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Create daily notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS dailyNotes (
      id TEXT PRIMARY KEY,
      note TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(createdDate)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_date ON dailyNotes(date)`);

  saveDatabase();
  console.log('Database initialized at:', DB_PATH);
}

/**
 * Save database to disk
 */
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

// ==================== TASKS ====================

export function getAllTasks() {
  const result = db.exec(`
    SELECT id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate, startDate, deadline
    FROM tasks ORDER BY updatedDate DESC
  `);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0],
    title: row[1],
    description: row[2],
    project: row[3],
    team: row[4],
    status: row[5],
    priority: row[6],
    assignedTo: row[7],
    linearLink: row[8],
    createdDate: row[9],
    updatedDate: row[10],
    dueDate: row[11],
    startDate: row[12],
    deadline: row[13]
  }));
}

export function getTaskById(id) {
  const result = db.exec(`SELECT id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate, startDate, deadline FROM tasks WHERE id = ?`, [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    title: row[1],
    description: row[2],
    project: row[3],
    team: row[4],
    status: row[5],
    priority: row[6],
    assignedTo: row[7],
    linearLink: row[8],
    createdDate: row[9],
    updatedDate: row[10],
    dueDate: row[11],
    startDate: row[12],
    deadline: row[13]
  };
}

export function createTask(task) {
  const now = new Date().toISOString();
  db.run(`
    INSERT INTO tasks (id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate, startDate, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [task.id, task.title, task.description || '', task.project, task.team, task.status || 'Created',
      task.priority || 'Medium', task.assignedTo || '', task.linearLink || '', now, now, task.dueDate || null,
      task.startDate || null, task.deadline || null]);
  saveDatabase();
  return getTaskById(task.id);
}

export function updateTask(id, updates) {
  const task = getTaskById(id);
  if (!task) return null;

  const now = new Date().toISOString();
  db.run(`
    UPDATE tasks SET
      title = ?, description = ?, project = ?, team = ?, status = ?,
      priority = ?, assignedTo = ?, linearLink = ?, updatedDate = ?, dueDate = ?,
      startDate = ?, deadline = ?
    WHERE id = ?
  `, [
    updates.title ?? task.title,
    updates.description ?? task.description,
    updates.project ?? task.project,
    updates.team ?? task.team,
    updates.status ?? task.status,
    updates.priority ?? task.priority,
    updates.assignedTo ?? task.assignedTo,
    updates.linearLink ?? task.linearLink,
    now,
    updates.dueDate ?? task.dueDate,
    updates.startDate ?? task.startDate,
    updates.deadline ?? task.deadline,
    id
  ]);
  saveDatabase();
  return getTaskById(id);
}

export function deleteTask(id) {
  db.run(`DELETE FROM tasks WHERE id = ?`, [id]);
  saveDatabase();
}

export function getTasksByStatus(status) {
  const result = db.exec(`SELECT id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate FROM tasks WHERE status = ? ORDER BY updatedDate DESC`, [status]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], title: row[1], description: row[2], project: row[3], team: row[4],
    status: row[5], priority: row[6], assignedTo: row[7], linearLink: row[8], createdDate: row[9], updatedDate: row[10], dueDate: row[11]
  }));
}

export function getTasksByTeam(team) {
  const result = db.exec(`SELECT id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate FROM tasks WHERE team = ? ORDER BY updatedDate DESC`, [team]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], title: row[1], description: row[2], project: row[3], team: row[4],
    status: row[5], priority: row[6], assignedTo: row[7], linearLink: row[8], createdDate: row[9], updatedDate: row[10], dueDate: row[11]
  }));
}

export function getTasksByProject(project) {
  const result = db.exec(`SELECT id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate FROM tasks WHERE project = ? ORDER BY updatedDate DESC`, [project]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], title: row[1], description: row[2], project: row[3], team: row[4],
    status: row[5], priority: row[6], assignedTo: row[7], linearLink: row[8], createdDate: row[9], updatedDate: row[10], dueDate: row[11]
  }));
}

// ==================== DAILY NOTES ====================

export function getAllNotes() {
  const result = db.exec(`SELECT id, note, date, createdAt FROM dailyNotes ORDER BY date DESC`);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], note: row[1], date: row[2], createdAt: row[3]
  }));
}

export function getNotesByDate(date) {
  const result = db.exec(`SELECT id, note, date, createdAt FROM dailyNotes WHERE date = ? ORDER BY createdAt DESC`, [date]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], note: row[1], date: row[2], createdAt: row[3]
  }));
}

export function createNote(note) {
  const now = new Date().toISOString();
  db.run(`INSERT INTO dailyNotes (id, note, date, createdAt) VALUES (?, ?, ?, ?)`,
    [note.id, note.note, note.date, now]);
  saveDatabase();
}

export function deleteNote(id) {
  db.run(`DELETE FROM dailyNotes WHERE id = ?`, [id]);
  saveDatabase();
}

// ==================== PROJECTS ====================

export function getAllProjects() {
  const result = db.exec(`SELECT id, name, color, createdAt FROM projects ORDER BY name`);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], name: row[1], color: row[2], createdAt: row[3]
  }));
}

export function createProject(project) {
  const now = new Date().toISOString();
  db.run(`INSERT INTO projects (id, name, color, createdAt) VALUES (?, ?, ?, ?)`,
    [project.id, project.name, project.color, now]);
  saveDatabase();
}

export function deleteProject(id) {
  db.run(`DELETE FROM projects WHERE id = ?`, [id]);
  saveDatabase();
}

// ==================== SEARCH ====================

export function searchTasks(query) {
  const searchTerm = `%${query.toLowerCase()}%`;
  const result = db.exec(`
    SELECT id, title, description, project, team, status, priority, assignedTo, linearLink, createdDate, updatedDate, dueDate FROM tasks
    WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(project) LIKE ? OR LOWER(assignedTo) LIKE ? OR LOWER(linearLink) LIKE ?
    ORDER BY updatedDate DESC
  `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], title: row[1], description: row[2], project: row[3], team: row[4],
    status: row[5], priority: row[6], assignedTo: row[7], linearLink: row[8], createdDate: row[9], updatedDate: row[10], dueDate: row[11]
  }));
}

export function searchNotes(query) {
  const searchTerm = `%${query.toLowerCase()}%`;
  const result = db.exec(`
    SELECT * FROM dailyNotes WHERE LOWER(note) LIKE ? ORDER BY date DESC
  `, [searchTerm]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0], note: row[1], date: row[2], createdAt: row[3]
  }));
}

// ==================== ANALYTICS ====================

export function getAnalytics() {
  const tasks = getAllTasks();
  const notes = getAllNotes();

  // Task counts by status
  const statusCounts = {};
  ['Created', 'Assigned', 'In Progress', 'Review', 'Done'].forEach(s => statusCounts[s] = 0);
  tasks.forEach(t => statusCounts[t.status]++);

  // Task counts by team
  const teamCounts = {};
  ['Personal', 'Dev', 'Data'].forEach(t => teamCounts[t] = 0);
  tasks.forEach(t => teamCounts[t.team]++);

  // Task counts by project
  const projectCounts = {};
  tasks.forEach(t => {
    projectCounts[t.project] = (projectCounts[t.project] || 0) + 1;
  });

  // Tasks by priority
  const priorityCounts = {};
  ['Low', 'Medium', 'High', 'Urgent'].forEach(p => priorityCounts[p] = 0);
  tasks.forEach(t => priorityCounts[t.priority]++);

  // Tasks per day (last 7 days)
  const tasksPerDay = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    tasksPerDay[dateStr] = tasks.filter(t => t.createdDate.startsWith(dateStr)).length;
  }

  // Tasks completed per day (last 7 days)
  const completedPerDay = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    completedPerDay[dateStr] = tasks.filter(t => t.status === 'Done' && t.updatedDate.startsWith(dateStr)).length;
  }

  // Monthly tasks
  const monthlyTasks = {};
  tasks.forEach(t => {
    const month = t.createdDate.substring(0, 7);
    monthlyTasks[month] = (monthlyTasks[month] || 0) + 1;
  });

  return {
    totalTasks: tasks.length,
    totalNotes: notes.length,
    statusCounts,
    teamCounts,
    projectCounts,
    priorityCounts,
    tasksPerDay,
    completedPerDay,
    monthlyTasks,
    recentTasks: tasks.slice(0, 5),
    recentNotes: notes.slice(0, 5)
  };
}

// ==================== EXPORT ====================

export function getExportData(type, startDate, endDate) {
  let tasks = getAllTasks();

  if (startDate && endDate) {
    tasks = tasks.filter(t => {
      const date = t.createdDate.split('T')[0];
      return date >= startDate && date <= endDate;
    });
  }

  const notes = getAllNotes().filter(n => {
    if (!startDate || !endDate) return true;
    return n.date >= startDate && n.date <= endDate;
  });

  return { tasks, notes };
}
