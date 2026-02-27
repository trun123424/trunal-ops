/**
 * Seed Database with Sample Data
 */

import { v4 as uuidv4 } from 'uuid';
import {
  initDatabase,
  createTask,
  createNote,
  createProject,
  getAllTasks
} from './database.js';

const projects = [
  { id: uuidv4(), name: 'TrunalOps Dashboard', color: '#6366f1' },
  { id: uuidv4(), name: 'User Authentication', color: '#22c55e' },
  { id: uuidv4(), name: 'Data Pipeline', color: '#f59e0b' },
  { id: uuidv4(), name: 'API Gateway', color: '#ef4444' },
  { id: uuidv4(), name: 'Mobile App', color: '#8b5cf6' },
  { id: uuidv4(), name: 'Analytics Platform', color: '#06b6d4' }
];

const sampleTasks = [
  // Personal Tasks
  { title: 'Review weekly goals', project: 'TrunalOps Dashboard', team: 'Personal', status: 'Done', priority: 'High', description: 'Review and update weekly goals for the team', linearLink: 'https://linear.app/trunal/issue/TRU-101' },
  { title: 'Plan sprint retrospective', project: 'TrunalOps Dashboard', team: 'Personal', status: 'In Progress', priority: 'Medium', description: 'Prepare agenda for sprint retrospective meeting' },
  { title: 'Update documentation', project: 'API Gateway', team: 'Personal', status: 'Created', priority: 'Low', description: 'Update API documentation with new endpoints' },

  // Dev Team Tasks
  { title: 'Implement user login', project: 'User Authentication', team: 'Dev', status: 'In Progress', priority: 'High', description: 'Build login functionality with JWT tokens', linearLink: 'https://linear.app/trunal/issue/TRU-102' },
  { title: 'Fix navigation bug', project: 'Mobile App', team: 'Dev', status: 'Review', priority: 'Urgent', description: 'Navigation stack not clearing on logout', linearLink: 'https://linear.app/trunal/issue/TRU-103' },
  { title: 'Add password reset', project: 'User Authentication', team: 'Dev', status: 'Assigned', priority: 'Medium', description: 'Implement forgot password flow with email verification' },
  { title: 'Optimize database queries', project: 'API Gateway', team: 'Dev', status: 'Created', priority: 'High', description: 'Improve query performance for user endpoints' },
  { title: 'Setup CI/CD pipeline', project: 'TrunalOps Dashboard', team: 'Dev', status: 'Done', priority: 'High', description: 'Configure GitHub Actions for automated deployments', linearLink: 'https://linear.app/trunal/issue/TRU-104' },
  { title: 'Add unit tests', project: 'User Authentication', team: 'Dev', status: 'In Progress', priority: 'Medium', description: 'Write unit tests for authentication module' },
  { title: 'Implement rate limiting', project: 'API Gateway', team: 'Dev', status: 'Assigned', priority: 'High', description: 'Add rate limiting to prevent API abuse' },

  // Data Team Tasks
  { title: 'Build ETL pipeline', project: 'Data Pipeline', team: 'Data', status: 'In Progress', priority: 'High', description: 'Create ETL pipeline for user analytics data', linearLink: 'https://linear.app/trunal/issue/TRU-105' },
  { title: 'Create analytics dashboard', project: 'Analytics Platform', team: 'Data', status: 'Assigned', priority: 'Medium', description: 'Build Grafana dashboard for monitoring' },
  { title: 'Data quality checks', project: 'Data Pipeline', team: 'Data', status: 'Review', priority: 'High', description: 'Implement automated data quality validation' },
  { title: 'Setup data warehouse', project: 'Analytics Platform', team: 'Data', status: 'Done', priority: 'Urgent', description: 'Configure BigQuery data warehouse', linearLink: 'https://linear.app/trunal/issue/TRU-106' },
  { title: 'Migrate legacy data', project: 'Data Pipeline', team: 'Data', status: 'Created', priority: 'Medium', description: 'Migrate data from old MySQL database' },
  { title: 'Build ML model', project: 'Analytics Platform', team: 'Data', status: 'In Progress', priority: 'Low', description: 'Train churn prediction model' }
];

const sampleNotes = [
  { note: '## Daily Standup Notes\n\n- Completed user authentication module\n- Started working on password reset flow\n- Blocked on database access - waiting for DevOps\n\n### Action Items\n- [ ] Follow up with DevOps team\n- [ ] Review PR #123\n- [ ] Update sprint board', date: new Date().toISOString().split('T')[0] },
  { note: '## Sprint Planning\n\n**Goals for this sprint:**\n1. Complete authentication module\n2. Start mobile app development\n3. Setup analytics infrastructure\n\n**Risks:**\n- Tight deadline for auth module\n- Need more data engineering resources', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
  { note: '## Code Review Notes\n\n- PR #125 needs refactoring\n- Good test coverage on auth module\n- Need to add error handling in API routes\n\nDiscussed with team:\n- Agreed on code style guidelines\n- Will use ESLint + Prettier', date: new Date(Date.now() - 172800000).toISOString().split('T')[0] }
];

async function seed() {
  console.log('Initializing database...');
  await initDatabase();

  const existingTasks = getAllTasks();
  if (existingTasks.length > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding projects...');
  for (const project of projects) {
    createProject(project);
  }

  console.log('Seeding tasks...');
  for (const task of sampleTasks) {
    createTask({
      id: uuidv4(),
      ...task
    });
  }

  console.log('Seeding notes...');
  for (const note of sampleNotes) {
    createNote({
      id: uuidv4(),
      ...note
    });
  }

  console.log('Seed completed successfully!');
  console.log(`Created ${projects.length} projects, ${sampleTasks.length} tasks, and ${sampleNotes.length} notes.`);
}

seed().catch(console.error);
