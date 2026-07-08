import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database';
import { authenticateToken } from '#@/core/middleware/auth';

const router = express.Router();

// GET notifications history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await dbAll(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark as read
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark all as read
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'UPDATE notifications SET read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    let prefs = await dbGet('SELECT * FROM notification_preferences WHERE user_id = ?', [req.user.id]);
    if (!prefs) {
      await dbRun('INSERT OR IGNORE INTO notification_preferences (user_id, email_enabled, in_app_enabled) VALUES (?, 1, 1)', [req.user.id]);
      prefs = { email_enabled: 1, in_app_enabled: 1 };
    }
    res.status(200).json({ preferences: prefs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  const { emailEnabled, inAppEnabled } = req.body;
  try {
    await dbRun(
      `INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET email_enabled = excluded.email_enabled, in_app_enabled = excluded.in_app_enabled`,
      [req.user.id, emailEnabled ? 1 : 0, inAppEnabled ? 1 : 0]
    );
    res.status(200).json({ message: 'Preferences updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
