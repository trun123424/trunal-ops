/**
 * Projects API Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllProjects,
  createProject,
  deleteProject,
  getAllTasks
} from '../db/database.js';

const router = Router();

// GET /api/projects - Get all projects with task counts
router.get('/', (req, res) => {
  try {
    const projects = getAllProjects();
    const tasks = getAllTasks();

    // Add task counts to each project
    const projectsWithCounts = projects.map(p => {
      const projectTasks = tasks.filter(t => t.project === p.name);
      return {
        ...p,
        taskCount: projectTasks.length,
        completedCount: projectTasks.filter(t => t.status === 'Done').length,
        inProgressCount: projectTasks.filter(t => t.status === 'In Progress').length
      };
    });

    // Also get unique projects from tasks that might not be in projects table
    const taskProjects = [...new Set(tasks.map(t => t.project))];
    const existingProjectNames = projects.map(p => p.name);

    taskProjects.forEach(projectName => {
      if (!existingProjectNames.includes(projectName)) {
        const projectTasks = tasks.filter(t => t.project === projectName);
        projectsWithCounts.push({
          id: null,
          name: projectName,
          color: '#6b7280',
          taskCount: projectTasks.length,
          completedCount: projectTasks.filter(t => t.status === 'Done').length,
          inProgressCount: projectTasks.filter(t => t.status === 'In Progress').length
        });
      }
    });

    res.json({ projects: projectsWithCounts, count: projectsWithCounts.length });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// POST /api/projects - Create a new project
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    createProject({
      id: uuidv4(),
      name,
      color: color || '#6366f1'
    });

    res.status(201).json({ success: true, message: 'Project created' });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', (req, res) => {
  try {
    deleteProject(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
