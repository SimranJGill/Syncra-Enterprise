import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';
import { notify } from '#@/core/notify.js';

const router = express.Router();

// GET all pending actions
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const actions = await dbAll('SELECT * FROM agent_actions WHERE status = "pending_approval" ORDER BY created_at DESC');
    res.status(200).json({ actions: actions.map(a => ({ ...a, proposed_changes: JSON.parse(a.proposed_changes) })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET execution history logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await dbAll('SELECT * FROM agent_actions WHERE status != "pending_approval" ORDER BY executed_at DESC LIMIT 50');
    res.status(200).json({ logs: logs.map(l => ({ ...l, proposed_changes: JSON.parse(l.proposed_changes) })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST approve action
router.post('/:id/approve', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const action = await dbGet('SELECT * FROM agent_actions WHERE id = ?', [id]);
    if (!action) {
      return res.status(404).json({ error: 'Agent action not found.' });
    }

    const proposed = JSON.parse(action.proposed_changes);

    // Execute target domain workflow depending on the agent type
    if (action.agent_type === 'RecruitmentAgent') {
      // Create Interview slot in db or notify candidate
      await dbRun(
        'INSERT INTO interviews (candidate_id, interviewer_id, interview_date, status) VALUES (?, ?, ?, "Scheduled")',
        [proposed.candidateId, proposed.interviewerId, proposed.proposedDate]
      );
    } else if (action.agent_type === 'LeaveAgent') {
      // Auto apply leave request
      await dbRun(
        'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, "Approved")',
        [proposed.employeeId, proposed.leaveType, proposed.startDate, proposed.endDate, proposed.reason]
      );
    } else if (action.agent_type === 'PayrollAgent') {
      // Generate draft payroll
      await dbRun(
        'INSERT INTO payrolls (employee_id, month, year, basic_salary, hra, pf, professional_tax, income_tax, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Draft")',
        [proposed.employeeId, proposed.month, proposed.year, proposed.basicSalary, proposed.hra, proposed.pf, proposed.professionalTax, proposed.incomeTax, proposed.netSalary]
      );
    } else if (action.agent_type === 'OnboardingAgent') {
      // Trigger onboarding profile creation
      const userResult = await dbRun(
        'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, "Employee", "onboard_placeholder_hash")',
        [proposed.name, proposed.email]
      );
      await dbRun(
        'INSERT INTO employees (user_id, employee_id, joining_date, status) VALUES (?, ?, CURRENT_DATE, "Active")',
        [userResult.id, `EMP_${userResult.id}`]
      );
    }

    // Update status to executed
    const audit = JSON.stringify([{ action: 'approved', by: req.user.name, at: new Date().toISOString() }]);
    await dbRun(
      'UPDATE agent_actions SET status = "executed", approved_by = ?, executed_at = CURRENT_TIMESTAMP, audit_trail = ? WHERE id = ?',
      [req.user.name, audit, id]
    );

    // Notify user
    await notify(
      req.user.id,
      'agent-action-approved',
      'Agent Action Executed',
      `The agent task proposed by ${action.agent_type} has been approved and successfully executed.`
    );

    res.status(200).json({ message: 'Action successfully approved and executed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST reject action
router.post('/:id/reject', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const audit = JSON.stringify([{ action: 'rejected', by: req.user.name, reason, at: new Date().toISOString() }]);
    await dbRun(
      'UPDATE agent_actions SET status = "rejected", approved_by = ?, executed_at = CURRENT_TIMESTAMP, audit_trail = ? WHERE id = ?',
      [req.user.name, audit, id]
    );
    res.status(200).json({ message: 'Action rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET trigger burnout checks or payroll proposal mocks (development shortcut)
router.post('/trigger-burnout-check', authenticateToken, async (req, res) => {
  const { employeeId } = req.body;
  try {
    // Propose burnout leave application via agent
    const proposed = JSON.stringify({
      employeeId,
      leaveType: 'Casual Leave',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      reason: 'Preventive Burnout Rest (AI Flagged 12 consecutive days worked)'
    });

    await dbRun(
      'INSERT INTO agent_actions (agent_type, status, trigger_event, proposed_changes, requested_by) VALUES ("LeaveAgent", "pending_approval", "burnout_risk_flagged", ?, "System")',
      [proposed]
    );

    res.status(200).json({ message: 'Burnout check executed, action proposed in queue.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
