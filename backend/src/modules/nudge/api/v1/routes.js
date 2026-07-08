import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';

const router = express.Router();

// GET all personal nudges
router.get('/', authenticateToken, async (req, res) => {
  try {
    const emp = await dbGet('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    if (!emp) {
      return res.status(200).json({ nudges: [] });
    }

    let list = await dbAll('SELECT * FROM nudges WHERE employee_id = ? AND status = "unread" ORDER BY created_at DESC', [emp.id]);
    if (list.length === 0) {
      // Mock insert basic welcome nudge for testing
      const dummyAction = JSON.stringify([{ label: 'Complete profile', action: 'open_profile_wizard' }]);
      await dbRun(
        'INSERT INTO nudges (employee_id, nudge_type, message, action_buttons, status) VALUES (?, "welcome_nudges", "Welcome onboard! Please review your default skill tags.", ?, "unread")',
        [emp.id, dummyAction]
      );
      list = [{
        id: 1,
        employee_id: emp.id,
        nudge_type: 'welcome_nudges',
        message: 'Welcome onboard! Please review your default skill tags.',
        action_buttons: dummyAction,
        status: 'unread'
      }];
    }

    res.status(200).json({
      nudges: list.map(n => ({
        ...n,
        action_buttons: JSON.parse(n.action_buttons || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST dismiss nudge
router.post('/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    await dbRun('UPDATE nudges SET status = "dismissed" WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Nudge dismissed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST execute nudge action
router.post('/:id/action', authenticateToken, async (req, res) => {
  try {
    await dbRun('UPDATE nudges SET status = "action_taken" WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Nudge action recorded.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
