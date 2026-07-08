import express from 'express';
import { dbAll } from '#@/core/database';
import { authenticateToken } from '#@/core/middleware/auth';

const router = express.Router();

// 1. Attendance analytics
router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const statusCounts = await dbAll(`
      SELECT status, COUNT(*) as count 
      FROM attendance 
      GROUP BY status
    `);
    const monthlyTrends = await dbAll(`
      SELECT strftime('%Y-%m', date) as month, status, COUNT(*) as count 
      FROM attendance 
      GROUP BY month, status
    `);
    res.status(200).json({ statusCounts, monthlyTrends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Leave utilization
router.get('/leave', authenticateToken, async (req, res) => {
  try {
    const typeUtilization = await dbAll(`
      SELECT leave_type, COUNT(*) as count 
      FROM leave_requests 
      WHERE status = 'Approved' 
      GROUP BY leave_type
    `);
    const deptComparison = await dbAll(`
      SELECT o.name as department_name, COUNT(lr.id) as count 
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN organizations o ON e.department_id = o.id
      WHERE lr.status = 'Approved'
      GROUP BY o.name
    `);
    res.status(200).json({ typeUtilization, deptComparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Payroll trends
router.get('/payroll', authenticateToken, async (req, res) => {
  try {
    const monthlyTrends = await dbAll(`
      SELECT month, SUM(basic_salary) as gross, SUM(net_salary) as net, SUM(income_tax) as tax 
      FROM payrolls 
      GROUP BY month
    `);
    res.status(200).json({ monthlyTrends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Recruitment Funnel
router.get('/recruitment', authenticateToken, async (req, res) => {
  try {
    const funnel = await dbAll(`
      SELECT status, COUNT(*) as count 
      FROM candidates 
      GROUP BY status
    `);
    res.status(200).json({ funnel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Performance Reviews Distribution
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const ratingDistribution = await dbAll(`
      SELECT manager_rating, COUNT(*) as count 
      FROM performance_reviews 
      WHERE manager_rating IS NOT NULL 
      GROUP BY manager_rating
    `);
    res.status(200).json({ ratingDistribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Projects Completion workload
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const taskStatus = await dbAll(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `);
    const workload = await dbAll(`
      SELECT u.name as employee_name, COUNT(t.id) as task_count 
      FROM tasks t
      JOIN employees e ON t.assignee_id = e.id
      JOIN users u ON e.user_id = u.id
      GROUP BY u.name
    `);
    res.status(200).json({ taskStatus, workload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Assets Registry depreciation summary
router.get('/assets', authenticateToken, async (req, res) => {
  try {
    const statusCounts = await dbAll(`
      SELECT status, COUNT(*) as count 
      FROM assets 
      GROUP BY status
    `);
    const costSummary = await dbAll(`
      SELECT type, SUM(purchase_cost) as total_cost 
      FROM assets 
      GROUP BY type
    `);
    res.status(200).json({ statusCounts, costSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Help Desk Tickets Volume
router.get('/helpdesk', authenticateToken, async (req, res) => {
  try {
    const categoryVolume = await dbAll(`
      SELECT category, COUNT(*) as count 
      FROM tickets 
      GROUP BY category
    `);
    const statusCounts = await dbAll(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `);
    res.status(200).json({ categoryVolume, statusCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
