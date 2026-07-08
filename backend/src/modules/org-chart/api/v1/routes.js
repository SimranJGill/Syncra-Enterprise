import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';

const router = express.Router();

// GET live org chart tree structure
router.get('/', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT e.id as id, u.name as name, u.role as role, e.salary, o.name as department
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN organizations o ON e.department_id = o.id
      WHERE e.status = 'Active'
    `);
    res.status(200).json({ orgData: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET saved scenario plans
router.get('/scenarios', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll('SELECT * FROM org_scenarios ORDER BY created_at DESC');
    res.status(200).json({ scenarios: list.map(s => ({ ...s, changes: JSON.parse(s.changes), projected_impact: JSON.parse(s.projected_impact || '{}') })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save scenario plan
router.post('/scenarios', authenticateToken, async (req, res) => {
  const { scenarioName, changes, projectedImpact } = req.body;
  try {
    const ins = await dbRun(
      'INSERT INTO org_scenarios (scenario_name, created_by, changes, projected_impact, is_active) VALUES (?, ?, ?, ?, 1)',
      [scenarioName, req.user.id, JSON.stringify(changes || []), JSON.stringify(projectedImpact || {})]
    );
    res.status(201).json({ id: ins.id, message: 'Scenario plan saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
