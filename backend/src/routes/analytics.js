/**
 * Analytics API Routes
 */

import { Router } from 'express';
import { getAnalytics, getExportData } from '../db/database.js';

const router = Router();

// GET /api/analytics - Get dashboard analytics
router.get('/', (req, res) => {
  try {
    const analytics = getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// POST /api/export - Export data
router.post('/export', (req, res) => {
  try {
    const { type, startDate, endDate, format } = req.body;

    const data = getExportData(type, startDate, endDate);

    if (format === 'csv') {
      // Generate CSV
      let csv = 'ID,Title,Description,Project,Team,Status,Priority,Linear Link,Created Date,Updated Date,Due Date\n';
      data.tasks.forEach(t => {
        csv += `"${t.id}","${t.title}","${(t.description || '').replace(/"/g, '""')}","${t.project}","${t.team}","${t.status}","${t.priority}","${t.linearLink || ''}","${t.createdDate}","${t.updatedDate}","${t.dueDate || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=trunal-ops-export-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // JSON format
      res.json(data);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
