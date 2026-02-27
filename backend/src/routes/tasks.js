/**
 * Tasks API Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
  getTasksByTeam,
  getTasksByProject
} from '../db/database.js';

const router = Router();

// GET /api/tasks - Get all tasks with optional filters
router.get('/', (req, res) => {
  try {
    const { status, team, project } = req.query;

    let tasks;
    if (status) {
      tasks = getTasksByStatus(status);
    } else if (team) {
      tasks = getTasksByTeam(team);
    } else if (project) {
      tasks = getTasksByProject(project);
    } else {
      tasks = getAllTasks();
    }

    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// GET /api/tasks/:id - Get a single task
router.get('/:id', (req, res) => {
  try {
    const task = getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', (req, res) => {
  try {
    const { title, description, project, team, status, priority, linearLink, dueDate } = req.body;

    if (!title || !project || !team) {
      return res.status(400).json({ error: 'Title, project, and team are required' });
    }

    const task = createTask({
      id: uuidv4(),
      title,
      description: description || '',
      project,
      team,
      status: status || 'Created',
      priority: priority || 'Medium',
      linearLink: linearLink || '',
      dueDate: dueDate || null
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', (req, res) => {
  try {
    const task = updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - Update task status (for Kanban)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const task = updateTask(req.params.id, { status });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
  try {
    const task = getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    deleteTask(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
