/**
 * TrunalOps Backend Server
 * Personal Operations Dashboard - Local First
 */

import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';

// Import routes
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import projectsRoutes from './routes/projects.js';
import searchRoutes from './routes/search.js';
import analyticsRoutes from './routes/analytics.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
  try {
    console.log('Initializing database...');
    await initDatabase();

    app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ████████╗██████╗ ██╗   ██╗███╗   ██╗ █████╗ ██╗                ║
║   ╚══██╔══╝██╔══██╗██║   ██║████╗  ██║██╔══██╗██║                ║
║      ██║   ██████╔╝██║   ██║██╔██╗ ██║███████║██║                ║
║      ██║   ██╔══██╗██║   ██║██║╚██╗██║██╔══██║██║                ║
║      ██║   ██║  ██║╚██████╔╝██║ ╚████║██║  ██║███████╗           ║
║      ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝           ║
║                         OPS                                      ║
║                                                                  ║
║   Personal Operations Dashboard                                  ║
║   Server running at http://${HOST}:${PORT}                         ║
║                                                                  ║
║   API Endpoints:                                                 ║
║   • GET    /api/tasks          - List all tasks                  ║
║   • POST   /api/tasks          - Create task                     ║
║   • PUT    /api/tasks/:id      - Update task                     ║
║   • DELETE /api/tasks/:id      - Delete task                     ║
║   • GET    /api/notes          - List all notes                  ║
║   • POST   /api/notes          - Create note                     ║
║   • GET    /api/projects       - List all projects               ║
║   • GET    /api/search?q=      - Search tasks & notes            ║
║   • GET    /api/analytics      - Dashboard analytics             ║
║   • POST   /api/analytics/export - Export data                   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

start();
