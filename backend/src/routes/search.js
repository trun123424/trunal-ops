/**
 * Search API Routes
 */

import { Router } from 'express';
import { searchTasks, searchNotes } from '../db/database.js';

const router = Router();

// GET /api/search - Global search
router.get('/', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ tasks: [], notes: [], totalResults: 0 });
    }

    const tasks = searchTasks(q.trim());
    const notes = searchNotes(q.trim());

    res.json({
      tasks,
      notes,
      totalResults: tasks.length + notes.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
