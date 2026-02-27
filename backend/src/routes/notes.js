/**
 * Daily Notes API Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllNotes,
  getNotesByDate,
  createNote,
  deleteNote
} from '../db/database.js';

const router = Router();

// GET /api/notes - Get all notes
router.get('/', (req, res) => {
  try {
    const { date } = req.query;

    let notes;
    if (date) {
      notes = getNotesByDate(date);
    } else {
      notes = getAllNotes();
    }

    res.json({ notes, count: notes.length });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// POST /api/notes - Create a new note
router.post('/', (req, res) => {
  try {
    const { note, date } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const noteDate = date || new Date().toISOString().split('T')[0];

    createNote({
      id: uuidv4(),
      note,
      date: noteDate
    });

    res.status(201).json({ success: true, message: 'Note created' });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', (req, res) => {
  try {
    deleteNote(req.params.id);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
